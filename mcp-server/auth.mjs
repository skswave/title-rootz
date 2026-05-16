/**
 * Auth Module — Magic link, JWT sessions, rate limiting.
 * Port of Origin's auth.js adapted for Title Rootz.
 * No passwords. No cookies dependency. Pure functions + DB.
 */
import db from './db.mjs';
import { createHash, randomBytes } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.TITLE_JWT_SECRET || 'dev-secret-change-in-production-' + randomBytes(16).toString('hex')
);
const SESSION_TTL_DAYS = 30;

// ============================================================
// Tier → Limits mapping
// Conversations archived for ALL tiers. Resume gated to Pro+.
// Monthly token budget from Anthropic API reported usage.
// ============================================================
export const TIER_LIMITS = {
  free:      { daily: 5,    monthly_tokens: 50_000,    model: 'claude-haiku-4-5-20251001', court_records: false, mailing_addr: false, bridge_links: false, resume_sessions: false },
  starter:   { daily: 50,   monthly_tokens: 500_000,   model: 'claude-haiku-4-5-20251001', court_records: false, mailing_addr: true,  bridge_links: true,  resume_sessions: false },
  pro:       { daily: 200,  monthly_tokens: 1_000_000, model: 'claude-sonnet-4-20250514',  court_records: true,  mailing_addr: true,  bridge_links: true,  resume_sessions: true  },
  unlimited: { daily: -1,   monthly_tokens: 5_000_000, model: 'claude-sonnet-4-20250514',  court_records: true,  mailing_addr: true,  bridge_links: true,  resume_sessions: true  },
  training:  { daily: -1,   monthly_tokens: 5_000_000, model: 'claude-sonnet-4-20250514',  court_records: true,  mailing_addr: true,  bridge_links: true,  resume_sessions: true  },
};

export function getTierConfig(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

// ============================================================
// ID generation + hashing
// ============================================================
function genId(prefix) {
  return prefix + '_' + randomBytes(16).toString('hex');
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

// ============================================================
// Cookie parsing (vanilla Node.js — no Express)
// ============================================================
export function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) cookies[k] = decodeURIComponent(v.join('='));
  });
  return cookies;
}

// ============================================================
// Account CRUD
// ============================================================
export function createAccount({ email, name }) {
  const id = genId('tacct');
  db.prepare(`
    INSERT INTO accounts (id, email, name, tier, rate_limit_daily)
    VALUES (?, ?, ?, 'free', 5)
  `).run(id, email.toLowerCase(), name || null);
  return getAccountById(id);
}

export function getAccountByEmail(email) {
  return db.prepare('SELECT * FROM accounts WHERE email = ?').get(email.toLowerCase());
}

export function getAccountById(id) {
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
}

export function updateAccountTier(accountId, tier) {
  const config = getTierConfig(tier);
  db.prepare('UPDATE accounts SET tier = ?, rate_limit_daily = ?, updated_at = datetime(?) WHERE id = ?')
    .run(tier, config.daily, new Date().toISOString(), accountId);
}

export function updateAccountStripe(accountId, stripeCustomerId, subscriptionStatus, expiresAt) {
  db.prepare('UPDATE accounts SET stripe_customer_id = ?, subscription_status = ?, subscription_expires_at = ?, updated_at = datetime(?) WHERE id = ?')
    .run(stripeCustomerId, subscriptionStatus, expiresAt, new Date().toISOString(), accountId);
}

// ============================================================
// Magic Links — passwordless auth
// ============================================================
export function createMagicLinkToken(email, purpose = 'login', ip = null) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

  // Rate limit: max 5 magic links per email per hour
  const recentCount = db.prepare(
    "SELECT COUNT(*) as n FROM magic_links WHERE email = ? AND created_at > datetime('now', '-1 hour')"
  ).get(email.toLowerCase()).n;
  if (recentCount >= 5) return { error: 'Too many login attempts. Try again in an hour.' };

  db.prepare(`
    INSERT INTO magic_links (email, token_hash, purpose, expires_at, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(email.toLowerCase(), tokenHash, purpose, expiresAt, ip);

  return { token, expiresAt };
}

export function verifyMagicLinkToken(token) {
  const tokenHash = hashToken(token);
  const link = db.prepare(`
    SELECT * FROM magic_links
    WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')
  `).get(tokenHash);

  if (!link) return null;

  // Mark as used
  db.prepare('UPDATE magic_links SET used_at = datetime(?) WHERE id = ?')
    .run(new Date().toISOString(), link.id);

  return link;
}

// ============================================================
// Sessions — JWT + DB tracking for revocation
// ============================================================
export async function createSession(accountId, req) {
  const sessionId = genId('sess');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const account = getAccountById(accountId);
  if (!account) return null;

  // Store session in DB
  db.prepare(`
    INSERT INTO sessions (id, account_id, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, accountId, req?.socket?.remoteAddress || null, req?.headers?.['user-agent']?.substring(0, 200) || null, expiresAt);

  // Sign JWT
  const jwt = await new SignJWT({
    sub: accountId,
    jti: sessionId,
    tier: account.tier,
    email: account.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .setIssuedAt()
    .sign(JWT_SECRET);

  return { jwt, sessionId, expiresAt };
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Check session not revoked
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND revoked = 0').get(payload.jti);
    if (!session) return null;

    // Check not expired in DB
    if (new Date(session.expires_at) < new Date()) return null;

    return getAccountById(payload.sub);
  } catch (e) {
    return null;
  }
}

export function revokeSession(sessionId) {
  db.prepare('UPDATE sessions SET revoked = 1 WHERE id = ?').run(sessionId);
}

// ============================================================
// Middleware — resolve account from cookie
// ============================================================
export async function requireAuth(req) {
  const cookies = req.cookies || parseCookies(req);
  const token = cookies.title_session;
  if (!token) return null;
  return verifySession(token);
}

// ============================================================
// Rate Limiting — daily query budget per account/IP
// ============================================================
export function checkRateLimit(accountId, tier) {
  const config = getTierConfig(tier);
  const limit = config.daily;
  if (limit === -1) return { allowed: true, used: 0, limit: -1, remaining: -1 };

  const today = new Date().toISOString().slice(0, 10);
  const used = db.prepare(
    "SELECT COUNT(*) as n FROM usage_log WHERE account_id = ? AND created_at >= ?"
  ).get(accountId || 'anon', today + ' 00:00:00').n;

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export function logUsage(accountId, endpoint, query, tokensIn = 0, tokensOut = 0, costUsd = 0, ip = null) {
  const result = db.prepare(`
    INSERT INTO usage_log (account_id, endpoint, query, tokens_in, tokens_out, cost_usd, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(accountId || 'anon', endpoint, query, tokensIn, tokensOut, costUsd, ip);
  return result.lastInsertRowid;
}

// Update a usage log row with actual token counts from Anthropic API response
export function updateUsageTokens(rowId, tokensIn, tokensOut, costUsd) {
  db.prepare('UPDATE usage_log SET tokens_in = ?, tokens_out = ?, cost_usd = ? WHERE id = ?')
    .run(tokensIn, tokensOut, costUsd, rowId);
}

// ============================================================
// Token Budget — monthly cap from Anthropic-reported usage
// ============================================================
export function checkTokenBudget(accountId, tier) {
  const config = getTierConfig(tier);
  const budget = config.monthly_tokens;
  if (budget === -1) return { allowed: true, used: 0, budget: -1, remaining: -1 };

  const monthStart = new Date().toISOString().slice(0, 7) + '-01';
  const row = db.prepare(
    "SELECT COALESCE(SUM(tokens_in + tokens_out), 0) as total FROM usage_log WHERE account_id = ? AND created_at >= ?"
  ).get(accountId || 'anon', monthStart + ' 00:00:00');

  const used = row.total;
  return {
    allowed: used < budget,
    used,
    budget,
    remaining: Math.max(0, budget - used),
    pct: budget > 0 ? Math.round((used / budget) * 100) : 0,
  };
}

// ============================================================
// Usage stats for account page
// ============================================================
export function getUsageStats(accountId, tier) {
  const config = getTierConfig(tier || 'free');
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = db.prepare(
    "SELECT COUNT(*) as n FROM usage_log WHERE account_id = ? AND created_at >= ?"
  ).get(accountId, today + ' 00:00:00').n;

  const monthStart = today.slice(0, 7) + '-01';
  const monthCount = db.prepare(
    "SELECT COUNT(*) as n, COALESCE(SUM(tokens_in),0) as tokens_in, COALESCE(SUM(tokens_out),0) as tokens_out, COALESCE(SUM(cost_usd),0) as cost FROM usage_log WHERE account_id = ? AND created_at >= ?"
  ).get(accountId, monthStart + ' 00:00:00');

  const totalTokens = monthCount.tokens_in + monthCount.tokens_out;
  return {
    today: todayCount,
    month: monthCount,
    token_budget: {
      used: totalTokens,
      budget: config.monthly_tokens,
      remaining: config.monthly_tokens > 0 ? Math.max(0, config.monthly_tokens - totalTokens) : -1,
      pct: config.monthly_tokens > 0 ? Math.round((totalTokens / config.monthly_tokens) * 100) : 0,
    },
  };
}
