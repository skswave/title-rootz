# Session Prompt: Title Rootz — Account System + Subscription Billing

## Context

Title Rootz Global (title.rootz.global) is a live AI-powered real estate farming product for Florida agents. It has:

- **10.8M FL parcels** across all 67 counties
- **908K Broward County courthouse records** (litigation pending, probate, liens, mortgages, deeds, deaths — from free SFTP bulk download)
- **Farming API**: `/api/fl/farm?city=X&signals=Y` — returns scored prospects with owner mailing addresses, court records, equity estimates
- **Property intelligence pages**: `/p/farm?address=X&city=Y` — photo from BCPA, map, farming score, court records, flood zone, schools
- **Farm chat UI**: `/farm` — Claude Haiku powered ($0.001/query), agents talk naturally to find prospects
- **ChatGPT Custom GPT**: Working with OpenAPI Actions calling our farming API
- **Farm map**: `/farm/{city}` — Leaflet map with scored pins

## What Needs to Be Built

### 1. Account System (Magic Link Auth)

Port the existing pattern from Origin (origin.rootz.global):
- **Source code**: `/var/www/origin.rootz.global/src/auth.js` — magic links, JWT sessions, tier management, Stripe integration
- **Email**: `/var/www/origin.rootz.global/src/email.js` — Gmail OAuth2 via `email-service.mjs`
- **DB schema**: SQLite tables for accounts, magic_links, sessions (already defined in Origin's db.js)
- **Gmail env vars**: GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN (already in Origin .env)

Flow:
```
Agent visits title.rootz.global/farm → clicks "Sign In" → enters email
→ Magic link sent via Gmail → agent clicks → JWT cookie set → 30-day session
→ Agent can save properties, track searches, access premium features
```

### 2. Subscription Tiers (Stripe)

| Tier | Price | Features | Rate Limit |
|------|-------|----------|-----------|
| Free | $0 | 5 searches/day, basic results | 5/day |
| Starter | $29/mo | 50 searches/day, mailing addresses, bridge pages | 50/day |
| Pro | $49/mo | 200 searches/day, court records, equity estimates, Sonnet model | 200/day |
| Unlimited | $99/mo | Unlimited, all features, conversation history | Unlimited |
| Training | $2,500/mo | Unlimited seats for training program | Unlimited × seats |

Stripe is already configured on Origin — same account, new product/prices.

### 3. Saved Properties / Farm Lists

SQLite tables:
```sql
CREATE TABLE saved_properties (
  id INTEGER PRIMARY KEY,
  account_id TEXT NOT NULL,
  address TEXT,
  city TEXT,
  bridge_url TEXT,
  farming_score INTEGER,
  notes TEXT,
  saved_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE farm_areas (
  id INTEGER PRIMARY KEY,
  account_id TEXT NOT NULL,
  city TEXT,
  zip TEXT,
  signals TEXT,
  alert_enabled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

### 4. Conversation History

Store chat sessions so agents can resume farming conversations:
```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY,
  account_id TEXT NOT NULL,
  messages TEXT, -- JSON array
  last_active TEXT,
  title TEXT, -- auto-generated from first message
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

### 5. Page Navigation / Continuity

Every page (bridge page, farm map, chat) needs a persistent header:
- Rootz logo → home
- "Farm" → /farm (chat)
- "Saved" → /saved (saved properties list — requires login)
- "Sign In" / "Account" → /auth/login or /account
- On bridge pages: "Ask about this property" button → opens farm chat pre-loaded with this address

### 6. Usage Tracking

```sql
CREATE TABLE usage_log (
  id INTEGER PRIMARY KEY,
  account_id TEXT,
  endpoint TEXT,
  query TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_usd REAL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 7. Files on Server

```
/var/www/title.rootz.global/
├── server.mjs          ← Add auth routes + middleware
├── fl-query.mjs        ← Farming search + property intelligence
├── farm-chat.mjs       ← Claude Haiku chat handler
├── auth.mjs            ← NEW: Port from Origin auth.js
├── email.mjs           ← NEW: Port from Origin email.js  
├── db.mjs              ← NEW: SQLite schema + helpers
├── bridge-page-template.mjs ← Add nav bar + save button
├── farm-map-template.mjs   ← Add nav bar + sign-in prompt
├── data/
│   ├── title-farming.db     ← NEW: SQLite for accounts + saved + usage
│   ├── florida/cities/      ← 10.8M parcel JSONL files
│   └── broward-clerk/
│       └── farming-signals.db ← 908K court records SQLite
```

### 8. Key Decisions

- **Same Stripe account as Origin** or separate? (Same is easier)
- **SITE_URL**: `https://title.rootz.global`
- **Email from**: Use same Gmail OAuth2 creds as Origin, just change the email template branding
- **JWT secret**: Generate new one for title service (don't share with Origin)
- **Cookie domain**: `.rootz.global` (shared across subdomains) or `title.rootz.global` (isolated)?

## Reference Files

- Origin auth: `ssh ubuntu@141.148.25.214 "cat /var/www/origin.rootz.global/src/auth.js"`
- Origin email: `ssh ubuntu@141.148.25.214 "cat /var/www/origin.rootz.global/src/email.js"`
- Origin DB schema: `ssh ubuntu@141.148.25.214 "cat /var/www/origin.rootz.global/src/db.js"`
- Origin .env (Gmail creds): `ssh ubuntu@141.148.25.214 "grep GMAIL /var/www/origin.rootz.global/.env"`
- Title CLAUDE.md: Read `land-records/CLAUDE.md` for full project context
- Farm chat: `land-records/mcp-server/farm-chat.mjs`
- Bridge page: `land-records/mcp-server/bridge-page-template.mjs`

## What Success Looks Like

An agent goes to `title.rootz.global/farm`, enters their email, gets a magic link, clicks it, and is logged in. They search for farming prospects, save the best ones to their list, come back tomorrow and their conversation + saved properties are still there. Usage is tracked. At 5 searches they hit the free limit and see "Upgrade to Starter ($29/mo)" with a Stripe checkout link.
