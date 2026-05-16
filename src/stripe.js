/**
 * AI_CONTEXT: Stripe billing — subscription management for Title Rootz.
 * Products: Starter $29, Pro $49, Unlimited $99, Training $2500/mo.
 *
 * Dependencies:
 *   - src/db.js
 *   - src/auth.js (updateAccountTier, updateAccountStripe)
 *
 * Exports:
 *   - initStripeProducts()
 *   - createCheckoutSession(account, tierKey)
 *   - createPortalSession(stripeCustomerId)
 *   - handleStripeWebhook(event)
 *   - verifyWebhookSignature(body, signature)
 *   - stripe, STRIPE_PRICES, PRICE_TO_TIER
 */
import Stripe from 'stripe';
import db from './db.js';
import { updateAccountTier, updateAccountStripe } from './auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const SITE_URL = process.env.SITE_URL || 'https://title.rootz.global';

let STRIPE_PRICES = {};
let PRICE_TO_TIER = {};

const TIER_DEFS = [
  { tier: 'starter',   name: 'Rootz Property Intelligence Starter',   monthly: 2900 },
  { tier: 'pro',       name: 'Rootz Property Intelligence Pro',       monthly: 4900 },
  { tier: 'unlimited', name: 'Rootz Property Intelligence Unlimited', monthly: 9900 },
  { tier: 'training',  name: 'Rootz Property Intelligence Training',  monthly: 250000 },
];

export async function initStripeProducts() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    console.log('  Stripe: skipped (no STRIPE_SECRET_KEY)');
    return;
  }

  console.log('  Stripe: initializing products...');

  for (const def of TIER_DEFS) {
    try {
      const products = await stripe.products.search({ query: `metadata['title_tier']:'${def.tier}'` });
      let product = products.data[0];
      if (!product) {
        product = await stripe.products.create({
          name: def.name,
          metadata: { title_tier: def.tier },
        });
      }

      const prices = await stripe.prices.list({ product: product.id, active: true });
      let monthlyPrice = prices.data.find(p => p.recurring?.interval === 'month');
      if (!monthlyPrice) {
        monthlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: def.monthly,
          currency: 'usd',
          recurring: { interval: 'month' },
          metadata: { title_tier: def.tier },
        });
      }

      STRIPE_PRICES[def.tier] = monthlyPrice.id;
      PRICE_TO_TIER[monthlyPrice.id] = def.tier;
    } catch (e) {
      console.log(`    Stripe error (${def.tier}): ${e.message}`);
    }
  }

  console.log(`  Stripe: ${Object.keys(STRIPE_PRICES).length} prices loaded`);
}

export async function createCheckoutSession(account, tierKey) {
  const priceId = STRIPE_PRICES[tierKey];
  if (!priceId) throw new Error(`No Stripe price for tier: ${tierKey}`);

  let customerId = account.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: account.email,
      name: account.name || account.email,
      metadata: { title_account_id: account.id },
    });
    customerId = customer.id;
    updateAccountStripe(account.id, customerId, 'none', null);
  }

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/pricing`,
    client_reference_id: account.id,
    metadata: { title_tier: tierKey },
    subscription_data: {
      metadata: { title_account_id: account.id, title_tier: tierKey },
    },
  });
}

export async function createPortalSession(stripeCustomerId) {
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${SITE_URL}/auth/account`,
  });
}

export async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const accountId = session.client_reference_id;
      const tier = session.metadata?.title_tier;
      if (accountId && tier) {
        updateAccountTier(accountId, tier);
        updateAccountStripe(accountId, session.customer, 'active', null);
        console.log(`  Stripe: ${accountId} subscribed to ${tier}`);
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const tier = sub.metadata?.title_tier || PRICE_TO_TIER[sub.items?.data?.[0]?.price?.id];
      const accountId = sub.metadata?.title_account_id;
      if (accountId) {
        db.prepare(`
          INSERT OR REPLACE INTO subscriptions
          (id, account_id, stripe_customer_id, stripe_price_id, tier, billing_period, status,
           current_period_start, current_period_end, cancel_at, canceled_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(?))
        `).run(
          sub.id, accountId, sub.customer,
          sub.items?.data?.[0]?.price?.id || '',
          tier || 'unknown',
          sub.items?.data?.[0]?.price?.recurring?.interval || 'month',
          sub.status,
          sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : new Date().toISOString(),
          sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : new Date().toISOString(),
          sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          new Date().toISOString()
        );

        if (sub.status === 'active' || sub.status === 'trialing') {
          if (tier) updateAccountTier(accountId, tier);
          updateAccountStripe(accountId, sub.customer, sub.status,
            sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : new Date().toISOString());
        } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
          updateAccountTier(accountId, 'free');
          updateAccountStripe(accountId, sub.customer, sub.status, null);
        } else {
          updateAccountStripe(accountId, sub.customer, sub.status, null);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const accountId = sub.metadata?.title_account_id;
      if (accountId) {
        updateAccountTier(accountId, 'free');
        updateAccountStripe(accountId, sub.customer, 'canceled', null);
        db.prepare("UPDATE subscriptions SET status = 'canceled', canceled_at = datetime(?), updated_at = datetime(?) WHERE id = ?")
          .run(new Date().toISOString(), new Date().toISOString(), sub.id);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        db.prepare("UPDATE subscriptions SET status = 'past_due', updated_at = datetime(?) WHERE id = ?")
          .run(new Date().toISOString(), subId);
        const sub = db.prepare('SELECT account_id FROM subscriptions WHERE id = ?').get(subId);
        if (sub) updateAccountStripe(sub.account_id, invoice.customer, 'past_due', null);
      }
      break;
    }
  }
}

export function verifyWebhookSignature(body, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  return stripe.webhooks.constructEvent(body, signature, secret);
}

export { stripe, STRIPE_PRICES, PRICE_TO_TIER };
