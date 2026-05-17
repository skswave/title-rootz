/**
 * AI_CONTEXT: Title Rootz Global — HTTP + MCP Server (routes only)
 * All business logic lives in query/, scoring/, export/, ai/, templates/.
 * This file wires up routes and delegates to components.
 *
 * Port: 3035 (PM2: title-records)
 * Pattern: raw Node http (no Express)
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';
import crypto from 'crypto';

// ─── Component imports ─────────────────────────────────────────
import { assemblePropertyIntelligence, lookupByAddress, lookupByFolio, getInvestorSignals } from './query/fl-property.js';
import { farmingSearch } from './query/fl-farming.js';
import { lookupClerkSignals } from './query/fl-clerk.js';
import { getFloodZone, getCensusData, identifyAllLayers, getElevation, getIRSIncomeByZip, getNFIPClaimsByZip, getFEMADisastersByCounty, getStatewideEconomics, getMarketEconomics, lookupStatwideCensus, lookupCensusBlockGroup } from './query/fl-overlays.js';
import { findNearestSchools, findBuildingPermits, findNearestHospitals, findNearestEVCharging, findNearestTRIFacilities } from './query/fl-proximity.js';
import { assembleTimeshareIntelligence, searchDBPRTimeshare } from './query/fl-timeshare.js';
import { assembleOhioPropertyIntelligence, lookupOhioByAddress } from './query/oh-property.js';
import { computeFarmingScore } from './scoring/farming-score.js';
import { farmingToCSV } from './export/csv.js';
import { renderBridgePage } from './export/bridge-page.js';
import { handleFarmChat } from './ai/chat-handler.js';
import { renderFarmChatPage } from './templates/farm-chat.js';
import { renderNav } from './templates/nav.js';
import { parseCookies, requireAuth, createAccount, getAccountByEmail, createMagicLinkToken, verifyMagicLinkToken, createSession, checkRateLimit, checkTokenBudget, logUsage, updateUsageTokens, getUsageStats, getTierConfig, revokeSession } from './auth.js';
import { sendMagicLink } from './email.js';
import { initStripeProducts, createCheckoutSession, createPortalSession, handleStripeWebhook, verifyWebhookSignature } from './stripe.js';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3035;
const DATA_DIR = fs.existsSync(path.join(__dirname, '..', 'data'))
  ? path.join(__dirname, '..', 'data')
  : path.join(__dirname, 'data');

// ─── Helpers ───────────────────────────────────────────────────
function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function html(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function getRawBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// ─── Route Handler ─────────────────────────────────────────────
async function handleRequest(req, res) {
  const urlParsed = new URL(req.url, `http://localhost:${PORT}`);
  const path_ = urlParsed.pathname;
  const params = urlParsed.searchParams;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  try {
    // ─── Auth Routes ─────────────────────────────────
    if (path_ === '/auth/login' && method === 'GET') {
      return html(res, renderAuthLoginPage());
    }

    if (path_ === '/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const email = (body.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) return json(res, { error: 'Valid email required' }, 400);

      let account = getAccountByEmail(email);
      if (!account) account = createAccount({ email });

      const result = createMagicLinkToken(email, 'login', req.socket?.remoteAddress);
      if (result.error) return json(res, { error: result.error }, 429);

      await sendMagicLink(email, result.token, 'login');
      return json(res, { success: true, message: 'Check your email for the sign-in link.' });
    }

    if (path_ === '/auth/verify' && method === 'GET') {
      const token = params.get('token');
      if (!token) return html(res, '<h1>Invalid link</h1>', 400);

      const link = verifyMagicLinkToken(token);
      if (!link) return html(res, '<h1>Link expired or already used</h1>', 400);

      let account = getAccountByEmail(link.email);
      if (!account) account = createAccount({ email: link.email });

      const session = await createSession(account.id, req);
      res.writeHead(302, {
        'Set-Cookie': `title_session=${session.jwt}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 3600}`,
        'Location': '/farm'
      });
      return res.end();
    }

    if (path_ === '/auth/logout' && method === 'GET') {
      res.writeHead(302, {
        'Set-Cookie': 'title_session=; Path=/; HttpOnly; Max-Age=0',
        'Location': '/farm'
      });
      return res.end();
    }

    // ─── Farm Chat ───────────────────────────────────
    if (path_ === '/farm' && method === 'GET') {
      return html(res, renderFarmChatPage());
    }

    if (path_ === '/farm/chat' && method === 'POST') {
      const account = await requireAuth(req);
      const tier = account?.tier || 'free';
      const config = getTierConfig(tier);

      const rateCheck = checkRateLimit(account?.id, tier);
      if (!rateCheck.allowed) {
        return json(res, { error: 'Daily limit reached', message: `You've used all ${rateCheck.limit} searches today. Upgrade for more.`, rate_limit: rateCheck }, 429);
      }

      const tokenCheck = checkTokenBudget(account?.id, tier);
      if (!tokenCheck.allowed) {
        return json(res, { error: 'Monthly token budget exhausted', message: 'Upgrade for more tokens.', token_budget: tokenCheck }, 429);
      }

      const body = await parseBody(req);
      const usageId = logUsage(account?.id, '/farm/chat', body.messages?.[body.messages.length - 1]?.content?.slice(0, 200));

      const result = await handleFarmChat(body.messages || [], config.model);

      if (result.usage) {
        updateUsageTokens(usageId, result.usage.input_tokens || 0, result.usage.output_tokens || 0,
          ((result.usage.input_tokens || 0) * 0.25 + (result.usage.output_tokens || 0) * 1.25) / 1_000_000);
      }

      // Save conversation
      if (account) {
        const title = (body.messages?.[0]?.content || '').slice(0, 100);
        const convId = body.conversation_id;
        if (convId) {
          db.prepare('UPDATE conversations SET messages = ?, last_active = datetime(?) WHERE id = ? AND account_id = ?')
            .run(JSON.stringify(result.messages), new Date().toISOString(), convId, account.id);
        } else {
          const ins = db.prepare('INSERT INTO conversations (account_id, messages, title) VALUES (?, ?, ?)')
            .run(account.id, JSON.stringify(result.messages), title);
          result.conversation_id = ins.lastInsertRowid;
        }
      }

      return json(res, {
        text: result.text,
        model: result.model,
        conversation_id: result.conversation_id || body.conversation_id,
        rate_limit: checkRateLimit(account?.id, tier),
        token_budget: checkTokenBudget(account?.id, tier),
      });
    }

    // ─── Bridge Page ─────────────────────────────────
    if (path_.startsWith('/p/') && method === 'GET') {
      const parts = path_.slice(3).split('/');
      const addressSlug = decodeURIComponent(parts[0] || '');
      const city = decodeURIComponent(parts[1] || params.get('city') || '');
      const state = (params.get('state') || 'FL').toUpperCase();
      const address = addressSlug.replace(/-/g, ' ').toUpperCase();

      if (!address) return json(res, { error: 'Address required' }, 400);

      // State detection: OH cities or explicit state param
      const OH_CITIES = ['COLUMBUS', 'CLEVELAND', 'CINCINNATI', 'DAYTON', 'AKRON', 'TOLEDO', 'CANTON', 'HAMILTON', 'SPRINGFIELD', 'DUBLIN', 'WESTERVILLE', 'GAHANNA', 'GROVE CITY', 'UPPER ARLINGTON', 'REYNOLDSBURG', 'HILLIARD'];
      const isOhio = state === 'OH' || OH_CITIES.includes(city.toUpperCase());

      let data;
      if (isOhio) {
        data = await assembleOhioPropertyIntelligence(address, city);
      } else {
        data = await assemblePropertyIntelligence(address, city);
      }
      const page = await renderBridgePage(data, data.property?.folio);
      return html(res, page);
    }

    // ─── FL Property API ─────────────────────────────
    if (path_ === '/api/fl/search' && method === 'GET') {
      const address = params.get('address');
      const city = params.get('city') || '';
      const format = params.get('format');
      if (!address) return json(res, { error: 'address parameter required' }, 400);
      const data = await assemblePropertyIntelligence(address, city);
      if (format === 'csv') {
        res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="property.csv"' });
        return res.end(farmingToCSV([data]));
      }
      return json(res, data);
    }

    if (path_ === '/api/fl/lookup' && method === 'GET') {
      const address = params.get('address');
      const folio = params.get('folio');
      const city = params.get('city') || '';
      let result;
      if (folio) result = await lookupByFolio(folio);
      else if (address) result = await lookupByAddress(address, city);
      else return json(res, { error: 'address or folio required' }, 400);
      return json(res, result);
    }

    if (path_ === '/api/fl/farm' && method === 'GET') {
      const city = params.get('city');
      const zip = params.get('zip');
      const signals = params.get('signals')?.split(',').filter(Boolean) || [];
      const limit = parseInt(params.get('limit') || '50');
      const minScore = parseInt(params.get('minScore') || '0');
      const format = params.get('format');
      if (!city && !zip) return json(res, { error: 'city or zip parameter required' }, 400);
      const results = farmingSearch({ city, zip, signals, limit, minScore });
      if (format === 'csv') {
        const csvData = results.prospects || results.properties || results;
        res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="farming.csv"' });
        return res.end(farmingToCSV(csvData));
      }
      return json(res, results);
    }

    if (path_ === '/api/fl/flood' && method === 'GET') {
      const lat = parseFloat(params.get('lat'));
      const lng = parseFloat(params.get('lng'));
      if (!lat || !lng) return json(res, { error: 'lat and lng required' }, 400);
      return json(res, await getFloodZone(lat, lng));
    }

    if (path_ === '/api/fl/census' && method === 'GET') {
      const address = params.get('address');
      const city = params.get('city') || '';
      if (!address) return json(res, { error: 'address required' }, 400);
      return json(res, await getCensusData(address, city));
    }

    if (path_ === '/api/fl/permits' && method === 'GET') {
      const address = params.get('address');
      const folio = params.get('folio');
      if (!address && !folio) return json(res, { error: 'address or folio required' }, 400);
      return json(res, findBuildingPermits(folio, address));
    }

    if (path_ === '/api/fl/schools' && method === 'GET') {
      const lat = parseFloat(params.get('lat'));
      const lng = parseFloat(params.get('lng'));
      if (!lat || !lng) return json(res, { error: 'lat and lng required' }, 400);
      return json(res, findNearestSchools(lat, lng));
    }

    if (path_ === '/api/fl/hospitals' && method === 'GET') {
      const lat = parseFloat(params.get('lat'));
      const lng = parseFloat(params.get('lng'));
      if (!lat || !lng) return json(res, { error: 'lat and lng required' }, 400);
      return json(res, findNearestHospitals(lat, lng));
    }

    if (path_ === '/api/fl/economics' && method === 'GET') {
      return json(res, getMarketEconomics());
    }

    if (path_ === '/api/fl/timeshare' && method === 'GET') {
      const query = params.get('query') || params.get('q');
      if (!query) return json(res, { error: 'query required' }, 400);
      const city = params.get('city') || '';
      return json(res, await assembleTimeshareIntelligence(query, city));
    }

    // ─── OH Property API ─────────────────────────────
    if (path_ === '/api/oh/search' && method === 'GET') {
      const address = params.get('address');
      const city = params.get('city') || '';
      if (!address) return json(res, { error: 'address required' }, 400);
      return json(res, await assembleOhioPropertyIntelligence(address, city));
    }

    // ─── Saved Properties ────────────────────────────
    if (path_ === '/api/saved' && method === 'GET') {
      const account = await requireAuth(req);
      if (!account) return json(res, { error: 'Authentication required' }, 401);
      const saved = db.prepare('SELECT * FROM saved_properties WHERE account_id = ? AND status = ? ORDER BY created_at DESC').all(account.id, 'active');
      return json(res, { properties: saved });
    }

    if (path_ === '/api/saved' && method === 'POST') {
      const account = await requireAuth(req);
      if (!account) return json(res, { error: 'Authentication required' }, 401);
      const body = await parseBody(req);
      db.prepare('INSERT INTO saved_properties (account_id, address, city, state, folio, bridge_url, farming_score) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(account.id, body.address, body.city, body.state || 'FL', body.folio, body.bridge_url, body.farming_score);
      return json(res, { success: true });
    }

    // ─── Stripe ──────────────────────────────────────
    if (path_ === '/api/stripe/checkout' && method === 'POST') {
      const account = await requireAuth(req);
      if (!account) return json(res, { error: 'Authentication required' }, 401);
      const body = await parseBody(req);
      const session = await createCheckoutSession(account, body.tier);
      return json(res, { url: session.url });
    }

    if (path_ === '/api/stripe/portal' && method === 'GET') {
      const account = await requireAuth(req);
      if (!account?.stripe_customer_id) return json(res, { error: 'No subscription' }, 400);
      const session = await createPortalSession(account.stripe_customer_id);
      res.writeHead(302, { Location: session.url });
      return res.end();
    }

    if (path_ === '/api/stripe/webhook' && method === 'POST') {
      const rawBody = await getRawBody(req);
      const sig = req.headers['stripe-signature'];
      try {
        const event = verifyWebhookSignature(rawBody, sig);
        await handleStripeWebhook(event);
        return json(res, { received: true });
      } catch (e) {
        return json(res, { error: e.message }, 400);
      }
    }

    // ─── Conversations ───────────────────────────────
    if (path_ === '/api/conversations' && method === 'GET') {
      const account = await requireAuth(req);
      if (!account) return json(res, { error: 'Not authenticated' }, 401);
      const config = getTierConfig(account.tier);
      const conversations = db.prepare('SELECT id, title, last_active FROM conversations WHERE account_id = ? ORDER BY last_active DESC LIMIT 20').all(account.id);
      return json(res, { conversations, can_resume: config.resume_sessions });
    }

    if (path_.match(/^\/api\/conversations\/\d+$/) && method === 'GET') {
      const account = await requireAuth(req);
      if (!account) return json(res, { error: 'Not authenticated' }, 401);
      const config = getTierConfig(account.tier);
      if (!config.resume_sessions) return json(res, { error: 'Session resume requires Pro tier' }, 403);
      const id = path_.split('/').pop();
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND account_id = ?').get(id, account.id);
      if (!conv) return json(res, { error: 'Not found' }, 404);
      return json(res, { id: conv.id, title: conv.title, messages: JSON.parse(conv.messages || '[]') });
    }

    // ─── Discovery / AI ──────────────────────────────
    if (path_ === '/.well-known/ai' || path_ === '/.well-known/ai.json') {
      return json(res, {
        name: 'Rootz Property Intelligence',
        description: '10.8M Florida properties + 1.2M Ohio. Courthouse records, farming scores, flood zones, permits.',
        url: 'https://title.rootz.global',
        endpoints: ['/api/fl/search', '/api/fl/farm', '/api/fl/flood', '/api/oh/search'],
        mcp: { tools: 12 }
      });
    }

    if (path_ === '/api' && method === 'GET') {
      return json(res, {
        service: 'Rootz Property Intelligence',
        version: '2.0',
        endpoints: {
          '/api/fl/search': 'Full property intelligence (address + city)',
          '/api/fl/farm': 'Farming search (city + signals + format=csv)',
          '/api/fl/flood': 'FEMA flood zone (lat + lng)',
          '/api/fl/census': 'Census demographics (address + city)',
          '/api/fl/permits': 'Building permits (address or folio)',
          '/api/fl/schools': 'Nearest schools (lat + lng)',
          '/api/fl/economics': 'Market economics (FRED data)',
          '/api/oh/search': 'Ohio property intelligence (address + city)',
        }
      });
    }

    // ─── Pricing page ────────────────────────────────
    if (path_ === '/pricing' && method === 'GET') {
      const account = await requireAuth(req);
      return html(res, renderPricingPage(account));
    }

    // ─── Static files ────────────────────────────────
    if (path_ === '/' || path_ === '/index.html') {
      const landing = path.join(__dirname, '..', 'mcp-server', 'landing.html');
      if (fs.existsSync(landing)) {
        return html(res, fs.readFileSync(landing, 'utf8'));
      }
      res.writeHead(302, { Location: '/farm' });
      return res.end();
    }

    // ─── 404 ─────────────────────────────────────────
    return json(res, { error: 'Not found', path: path_ }, 404);

  } catch (e) {
    console.error(`  Error [${path_}]:`, e.message);
    return json(res, { error: 'Internal server error', detail: e.message }, 500);
  }
}

// ─── Auth Login Page (inline) ────────────────────────────────
function renderAuthLoginPage() {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign In — Rootz Property Intelligence</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border-radius:12px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,.08);max-width:400px;width:100%}
h1{color:#1e3a5f;font-size:22px;margin-bottom:8px}p{color:#64748b;font-size:14px;margin-bottom:24px}
input{width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;font-size:15px;margin-bottom:12px}
button{width:100%;padding:12px;background:linear-gradient(135deg,#1e3a5f,#0f766e);color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer}
.msg{padding:12px;border-radius:8px;margin-top:12px;font-size:14px;display:none}
.msg.ok{display:block;background:#f0fdf4;color:#16a34a}.msg.err{display:block;background:#fef2f2;color:#dc2626}</style></head><body>
<div class="card"><h1>Sign In</h1><p>Enter your email. We'll send a magic link — no password needed.</p>
<form onsubmit="go(event)"><input type="email" id="email" placeholder="agent@example.com" required><button type="submit">Send Sign-In Link</button></form>
<div class="msg" id="msg"></div></div>
<script>async function go(e){e.preventDefault();const m=document.getElementById('msg'),em=document.getElementById('email').value;
m.className='msg';m.style.display='none';try{const r=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:em})});
const d=await r.json();if(r.ok){m.className='msg ok';m.textContent=d.message;m.style.display='block'}else{m.className='msg err';m.textContent=d.error;m.style.display='block'}}
catch(err){m.className='msg err';m.textContent='Network error';m.style.display='block'}}</script></body></html>`;
}

// ─── Pricing Page (inline) ───────────────────────────────────
function renderPricingPage(account) {
  const nav = renderNav(account);
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pricing — Rootz Property Intelligence</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#f8fafc;color:#1e293b}
.wrap{max-width:1000px;margin:0 auto;padding:40px 20px}h1{text-align:center;font-size:28px;color:#1e3a5f;margin-bottom:8px}
.sub{text-align:center;color:#64748b;margin-bottom:32px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.plan{background:#fff;border-radius:12px;padding:24px;border:2px solid #e2e8f0;text-align:center}
.plan.pop{border-color:#0f766e;box-shadow:0 4px 20px rgba(15,118,110,.15)}
.plan h3{font-size:18px;color:#1e3a5f;margin-bottom:4px}
.price{font-size:32px;font-weight:800;color:#0f766e;margin:12px 0}
.price span{font-size:14px;font-weight:400;color:#94a3b8}
ul{list-style:none;text-align:left;margin:16px 0}li{padding:4px 0;font-size:13px;color:#475569}
li::before{content:'\\2713';color:#0f766e;margin-right:8px;font-weight:700}
.btn{display:block;padding:12px;background:linear-gradient(135deg,#1e3a5f,#0f766e);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px}
</style></head><body>${nav}
<div class="wrap"><h1>Simple Pricing</h1><p class="sub">Start free. Upgrade when you need more.</p>
<div class="grid">
<div class="plan"><h3>Free</h3><div class="price">$0<span>/mo</span></div><ul><li>5 searches/day</li><li>50K tokens/month</li><li>All 67 FL counties</li><li>Basic farming scores</li></ul></div>
<div class="plan"><h3>Starter</h3><div class="price">$29<span>/mo</span></div><ul><li>50 searches/day</li><li>500K tokens/month</li><li>Owner mailing addresses</li><li>Bridge page links</li><li>CSV export</li></ul><a class="btn" href="/api/stripe/checkout" onclick="checkout('starter');return false">Start Starter</a></div>
<div class="plan pop"><h3>Pro</h3><div class="price">$49<span>/mo</span></div><ul><li>200 searches/day</li><li>1M tokens/month</li><li>Court records access</li><li>Claude Sonnet model</li><li>Session history</li><li>Priority support</li></ul><a class="btn" href="/api/stripe/checkout" onclick="checkout('pro');return false">Start Pro</a></div>
<div class="plan"><h3>Unlimited</h3><div class="price">$99<span>/mo</span></div><ul><li>Unlimited searches</li><li>5M tokens/month</li><li>Everything in Pro</li><li>API access</li><li>Team features</li></ul><a class="btn" href="/api/stripe/checkout" onclick="checkout('unlimited');return false">Start Unlimited</a></div>
</div></div>
<script>async function checkout(tier){const r=await fetch('/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tier})});const d=await r.json();if(d.url)window.location=d.url;else alert(d.error||'Please sign in first')}</script>
</body></html>`;
}

// ─── Start Server ────────────────────────────────────────────
const server = http.createServer(handleRequest);

async function start() {
  await initStripeProducts();
  server.listen(PORT, () => {
    console.log(`\n  Title Rootz Global — port ${PORT}`);
    console.log(`  Live: https://title.rootz.global`);
    console.log(`  Data: ${DATA_DIR}\n`);
  });
}

start().catch(e => {
  console.error('Failed to start:', e);
  process.exit(1);
});
