/**
 * AI_CONTEXT: Title Rootz — Account Database
 * SQLite for accounts, sessions, subscriptions, saved properties, usage.
 * Separate from farming-signals.db (courthouse records).
 *
 * Exports:
 *   - default: better-sqlite3 Database instance
 *
 * Tables: accounts, magic_links, sessions, subscriptions, saved_properties,
 *         farm_areas, conversations, usage_log
 */
import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = existsSync(join(__dirname, '..', 'data'))
  ? join(__dirname, '..', 'data')
  : join(__dirname, '..', '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'title-accounts.db'));

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    tier TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'none',
    subscription_expires_at TEXT,
    rate_limit_daily INTEGER DEFAULT 5,
    email_verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
  CREATE INDEX IF NOT EXISTS idx_accounts_stripe ON accounts(stripe_customer_id);

  CREATE TABLE IF NOT EXISTS magic_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    purpose TEXT DEFAULT 'login',
    account_id TEXT,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_magic_token ON magic_links(token_hash);
  CREATE INDEX IF NOT EXISTS idx_magic_email ON magic_links(email);

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    revoked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,
    tier TEXT NOT NULL,
    billing_period TEXT,
    status TEXT NOT NULL,
    current_period_start TEXT,
    current_period_end TEXT,
    cancel_at TEXT,
    canceled_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_subs_account ON subscriptions(account_id);
  CREATE INDEX IF NOT EXISTS idx_subs_stripe ON subscriptions(stripe_customer_id);

  CREATE TABLE IF NOT EXISTS saved_properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    address TEXT NOT NULL,
    city TEXT,
    state TEXT DEFAULT 'FL',
    folio TEXT,
    bridge_url TEXT,
    farming_score INTEGER,
    score_at_save INTEGER,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_saved_account ON saved_properties(account_id);

  CREATE TABLE IF NOT EXISTS farm_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    city TEXT NOT NULL,
    zip TEXT,
    signals TEXT,
    alert_enabled INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_farm_areas_account ON farm_areas(account_id);

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    messages TEXT NOT NULL,
    title TEXT,
    last_active TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_conversations_account ON conversations(account_id);

  CREATE TABLE IF NOT EXISTS usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT,
    endpoint TEXT NOT NULL,
    query TEXT,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_usage_account ON usage_log(account_id);
  CREATE INDEX IF NOT EXISTS idx_usage_time ON usage_log(created_at);

  CREATE TABLE IF NOT EXISTS intelligence_cache (
    property_key TEXT PRIMARY KEY,
    data_hash TEXT NOT NULL,
    template_summary TEXT,
    ai_summary TEXT,
    ai_model TEXT,
    farming_score INTEGER,
    generated_at TEXT DEFAULT (datetime('now')),
    accessed_count INTEGER DEFAULT 0,
    last_accessed TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_cache_hash ON intelligence_cache(data_hash);

  CREATE TABLE IF NOT EXISTS access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_type TEXT NOT NULL DEFAULT 'unknown',
    agent_id TEXT,
    endpoint TEXT NOT NULL,
    query_params TEXT,
    method TEXT DEFAULT 'GET',
    status_code INTEGER DEFAULT 200,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_access_agent_type ON access_log(agent_type);
  CREATE INDEX IF NOT EXISTS idx_access_time ON access_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_access_endpoint ON access_log(endpoint);
`);

console.log('  DB: title-accounts.db initialized (9 tables)');

export default db;
