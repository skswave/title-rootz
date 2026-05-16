# Design: Page Structure + Memory Model — Rootz Property Intelligence

> **Brand**: Rootz Property Intelligence (title.rootz.global)
> **Last updated**: May 15, 2026
> **Status**: Core system BUILT and deployed. Build log below.

## The Core Insight

The agent's AI is the interface. Every page we build serves two consumers:
1. **The human agent** — visual, clickable, bookmarkable
2. **The agent's AI** — structured JSON, fetchable, context-providing

The pages ARE the memory. A saved bridge page URL is a memory object that any AI can read months later and get current state. The conversation history is memory. The saved farm list is memory. All of it persists through URLs and account state — not locked in any single AI's context window.

---

## What's Built (May 15, 2026)

### Files Added
| File | Purpose |
|---|---|
| `db.mjs` | SQLite schema — 8 tables (accounts, sessions, magic_links, subscriptions, saved_properties, farm_areas, conversations, usage_log) |
| `auth.mjs` | Magic link auth, JWT (jose, HS256, 30-day), dual rate limiting (daily + monthly tokens), tier config |
| `email.mjs` | Gmail OAuth2 magic link emails with Rootz Property Intelligence branding, console fallback for dev |
| `stripe-config.mjs` | 4 Stripe products, checkout sessions, billing portal, webhook handler (5 events) |
| `nav-template.mjs` | Persistent nav bar with tier badges (free/starter/pro/unlimited), responsive |

### Files Modified
| File | Changes |
|---|---|
| `server.mjs` | Auth middleware preamble, 25+ routes, bridge page address lookup, 5 HTML page templates |
| `farm-chat.mjs` | Conversation ID tracking, rate limit UI, upgrade prompts, session resume, property pre-seed |
| `package.json` | Added `better-sqlite3`, `jose`, `stripe`, `@anthropic-ai/sdk` |

### Subscription Tiers (LIVE in Stripe)
| Tier | Price | Daily Searches | Monthly Token Budget | Model | Sessions | Our Margin |
|---|---|---|---|---|---|---|
| Free | $0 | 5 | 50K | Haiku | Archived (locked) | — |
| Starter | $29/mo | 50 | 500K | Haiku | Archived (locked) | ~92% |
| Pro | $49/mo | 200 | 1M | Sonnet | Resume past sessions | ~89% |
| Unlimited | $99/mo | Unlimited | 5M | Sonnet | Resume past sessions | ~73% |
| Training | $2,500/mo | Unlimited | 5M | Sonnet | Resume (multi-seat, deferred) | TBD |

Token budgets based on Anthropic API reported usage (`result.usage.input_tokens` + `output_tokens`).
Dual rate limit: daily search count AND monthly token budget — whichever hits first.
Conversations archived for ALL tiers; resume gated to Pro+ as upsell.

### Environment Variables (Server)
```
ANTHROPIC_API_KEY          # Claude API
TITLE_JWT_SECRET           # Separate from Origin
SITE_URL=https://title.rootz.global
STRIPE_SECRET_KEY          # Same Stripe account as Origin
STRIPE_WEBHOOK_SECRET      # Endpoint: title.rootz.global/api/stripe/webhook
GMAIL_USER                 # Same Gmail OAuth2 as Origin
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN
```

---

## Page Hierarchy (BUILT)

```
title.rootz.global
├── /farm                          ← AI Chat (primary interface)              BUILT
├── /farm?property=X,Y             ← Chat pre-seeded with address            BUILT
├── /farm?conversation=ID          ← Resume past session (Pro+)              BUILT
├── /farm/{city}                   ← Farm Map (visual territory overview)     EXISTS (farm-map-template.mjs)
├── /p/farm?address=X&city=Y       ← Property Intelligence (bridge page)     BUILT
├── /p/{folioNumber}               ← Bridge page by folio                    EXISTS
├── /saved                         ← Saved Properties list (auth required)   BUILT
├── /pricing                       ← Subscription tiers                      BUILT
├── /auth/login                    ← Magic link entry                        BUILT
├── /auth/verify?token=X           ← Magic link verification                 BUILT
├── /auth/logout                   ← Clear session                           BUILT
├── /auth/account                  ← Account dashboard (tier, usage, token budget) BUILT
├── /api/saved                     ← Saved properties CRUD (JSON)            BUILT
├── /api/farm-areas                ← Farm areas CRUD (JSON)                  BUILT
├── /api/conversations             ← Conversation list/load/delete (JSON)    BUILT
├── /api/stripe/checkout           ← Create Stripe checkout session          BUILT
├── /api/stripe/success            ← Post-checkout redirect                  BUILT
├── /api/stripe/webhook            ← Stripe webhook (5 events)              BUILT
├── /api/stripe/portal             ← Stripe billing portal redirect          BUILT
├── /api/fl/search                 ← Property intelligence API (JSON)        EXISTS
├── /api/fl/farm                   ← Farming search API (JSON)               EXISTS
├── /.well-known/ai                ← AI discovery metadata                   EXISTS
└── /openapi.json                  ← OpenAPI spec for GPT Actions            EXISTS
```

## Persistent Navigation Bar (BUILT)

Every page shares a nav bar (`nav-template.mjs`):

```
┌──────────────────────────────────────────────────────────────────────┐
│  Rootz Property Intelligence    [Farm]  [Saved]  [Pricing]  [Sign In] │
└──────────────────────────────────────────────────────────────────────┘
```

When signed in (shows tier badge):
```
┌──────────────────────────────────────────────────────────────────────┐
│  Rootz Property Intelligence    [Farm]  [Saved]  [Pricing]  steven PRO │
└──────────────────────────────────────────────────────────────────────┘
```

Free tier users see a rate limit banner on /farm:
```
┌──────────────────────────────────────────────────────────────────────┐
│  Free plan: 3/5 searches remaining today • Upgrade                    │
└──────────────────────────────────────────────────────────────────────┘
```

Logo links to `/farm` (the product). Tier badges color-coded: free=gray, starter=blue, pro=gold, unlimited=green.

## Auth Flow (BUILT)

```
Agent visits /farm → clicks "Sign In"
  → /auth/login → enters email
  → Magic link sent via Gmail OAuth2
  → Agent clicks link in email
  → /auth/verify?token=X → JWT cookie set (30-day, HttpOnly, Secure)
  → Redirected to /farm → signed in
  → Cookie: title_session (isolated to title.rootz.global)
```

Rate limiting on magic links: max 5 per email per hour.
Account ID format: `tacct_` + 32 hex chars.
Session ID format: `sess_` + 32 hex chars.

## Billing Flow (BUILT)

```
Agent hits daily limit or token budget
  → Sees upgrade prompt with tier comparison
  → Clicks "View Plans" → /pricing page
  → Clicks "Subscribe" → POST /api/stripe/checkout
  → Stripe Checkout page (Stripe-hosted)
  → Pays → Stripe fires webhook
  → /api/stripe/webhook verifies signature, updates tier
  → Agent returns → rate limit updated, model upgraded
```

Stripe webhook events handled:
- `checkout.session.completed` — initial subscription
- `customer.subscription.created` / `updated` — tier changes
- `customer.subscription.deleted` — downgrade to free
- `invoice.payment_failed` — mark past_due

## Page Flows

### Flow 1: New Agent Arrives (BUILT)
```
Agent hears about Rootz from Steph
  → visits title.rootz.global/farm
  → sees chat UI with conversation starters
  → clicks "I want to farm in Coral Springs"
  → AI calls search_farming_prospects tool, returns top prospects
  → Agent clicks "Full intelligence" link → /p/farm?address=X&city=Y
  → sees property bridge page (score, owner, court records)
  → clicks "Save to list" → prompted to sign in if needed
  → enters email → magic link → signed in
  → property saved to their list
  → returns to chat → conversation continues (archived automatically)
```

### Flow 2: Returning Agent (Pro+) (BUILT)
```
Agent opens title.rootz.global/farm
  → cookie recognized → already signed in
  → can resume past conversation via /farm?conversation=ID
  → OR starts fresh session
  → agent types "show me new probate filings"
  → AI uses tools, returns results with bridge page links
  → agent saves new prospects to their list
  → agent clicks "Saved" in nav → sees all saved properties
```

### Flow 3: Agent Uses GPT Instead (BUILT)
```
Agent opens ChatGPT with Rootz Property Intelligence GPT
  → asks for farming prospects
  → GPT calls our API via OpenAPI Actions, gets results
  → GPT includes bridge page URLs in response
  → agent clicks bridge page → arrives at our site
  → bridge page has "Save" and "Ask about this property" buttons
  → agent now has account, can use /farm chat too
```

### Flow 4: Agent Shares with Colleague (BUILT)
```
Agent finds a great prospect
  → copies bridge page URL: title.rootz.global/p/farm?address=X&city=Y
  → texts it to colleague
  → colleague opens it → sees full intelligence page with nav bar
  → colleague clicks "Farm" in nav → starts their own farming session
  → colleague signs up → new account
```

---

## Memory Model

### Layer 1: URL Memory — BUILT (No account needed)

Every bridge page URL is a memory object:
```
title.rootz.global/p/farm?address=1725+SW+14+ST&city=FORT+LAUDERDALE
```

- **Any AI can fetch it** — returns current state every time
- **Bookmarkable** — agent saves in browser
- **Shareable** — text to colleague, email to client
- **Time-independent** — data refreshes on every load
- **Cross-model** — Claude reads it, GPT reads it, Gemini reads it

### Layer 2: Conversation Memory — BUILT (Account required)

Chat conversations stored in `conversations` table:
```json
{
  "id": 1,
  "account_id": "tacct_xxx",
  "title": "I want to farm in Coral Springs. Show me wh...",
  "messages": [
    {"role": "user", "content": "Find me probate properties in Coral Springs"},
    {"role": "assistant", "content": "I found 7 HIGH scoring properties..."}
  ],
  "last_active": "2026-05-15 14:30:00"
}
```

**All tiers**: conversations archived automatically on every chat.
**Pro+ only**: can resume via `/farm?conversation=ID` or `/api/conversations/:id`.
**Free/Starter see**: "You have 12 archived sessions. Upgrade to Pro ($49/mo) to resume them."

### Layer 3: Saved Properties — BUILT (Account required)

`saved_properties` table:
```json
{
  "id": 1,
  "account_id": "tacct_xxx",
  "address": "7513 NW 47 DR",
  "city": "CORAL SPRINGS",
  "state": "FL",
  "folio": "farm",
  "bridge_url": "/p/farm?address=7513+NW+47+DR&city=CORAL+SPRINGS",
  "farming_score": 85,
  "notes": null,
  "created_at": "2026-05-15 14:30:00"
}
```

API: `POST /api/saved`, `GET /api/saved`, `DELETE /api/saved/:id`
UI: `/saved` page with property cards, delete buttons, "Ask about this property" links.
Bridge pages have "Save to list" button (redirects to /auth/login if not signed in).

### Layer 4: Farm Areas — BUILT (Account required)

`farm_areas` table:
```json
{
  "id": 1,
  "account_id": "tacct_xxx",
  "city": "CORAL SPRINGS",
  "zip": "33067",
  "signals": ["probate", "lis_pendens"],
  "alert_enabled": 1
}
```

API: `POST /api/farm-areas`, `GET /api/farm-areas`, `DELETE /api/farm-areas/:id`

### Layer 5: Cross-Session AI Context — NOT YET BUILT

When the agent starts a new farming chat, inject context from their account:
```
System context (injected into Claude prompt):
- Agent has 12 saved properties (3 in Coral Springs, 9 in Fort Lauderdale)
- Agent's farm areas: Coral Springs 33067 (probate), Fort Lauderdale 33312 (all)
- Last session: "Coral Springs Probate Farming" — looked at 7513 NW 47 DR
- Properties they've already seen (don't repeat these unless asked)
```

### Layer 6: Usage Tracking — BUILT

`usage_log` table records every `/farm/chat` request:
- `tokens_in`, `tokens_out` — from Anthropic API response
- `cost_usd` — calculated per model (Haiku $0.25/$1.25, Sonnet $3/$15 per 1M)
- `account_id` — or IP hash for anonymous users
- Used for both daily rate limiting and monthly token budget enforcement

Account page (`/auth/account`) shows:
- Searches today vs daily limit
- Token budget: used/total with percentage
- Current tier, model, features

---

## Property Intelligence Page (Bridge Page) — BUILT

```
┌─ Nav Bar ──────────────────────────────────────────────┐
│  Rootz Property Intelligence  [Farm] [Saved] [Pricing] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─ Property Header ─────────────────────────────┐     │
│  │  Rootz Property Intelligence                  │     │
│  │  7513 NW 47 DR                                │     │
│  │  CORAL SPRINGS, FL | Folio: xxx               │     │
│  └───────────────────────────────────────────────┘     │
│                                                        │
│  ┌─ Score ───────────────────────────────────────┐     │
│  │  85/100 HIGH                                  │     │
│  │  [progress bar]                               │     │
│  │  • Absentee owner, mailing in Hillsboro Beach │     │
│  │  • Probate filing + foreclosure judgment       │     │
│  └───────────────────────────────────────────────┘     │
│                                                        │
│  ┌─ Owner ───────────────────────────────────────┐     │
│  │  SAKS, JEFFREY A                              │     │
│  │  Mailing: Hillsboro Beach                     │     │
│  │  Assessed: $1,500,000                         │     │
│  └───────────────────────────────────────────────┘     │
│                                                        │
│  ┌─ Court Records ───────────────────────────────┐     │
│  │  Probate filing — Nov 2025                    │     │
│  │  Litigation pending — Sep 2025                │     │
│  │  Foreclosure judgment — Jun 2024              │     │
│  │  Lien filed — Feb 2024                        │     │
│  └───────────────────────────────────────────────┘     │
│                                                        │
│  [Ask about this property]  [Save to list]             │
│                                                        │
│  ┌─ Provenance ──────────────────────────────────┐     │
│  │  Hash: a3f7... | Sources | Confidence         │     │
│  └───────────────────────────────────────────────┘     │
│                                                        │
│  Rootz Property Intelligence — title.rootz.global      │
└────────────────────────────────────────────────────────┘
```

Buttons:
- **Ask about this property** → `/farm?property=ADDRESS,CITY` (pre-seeds chat)
- **Save to list** → `POST /api/saved` (redirects to login if not signed in)

---

## Content Negotiation (BUILT)

```
GET /p/farm?address=X&city=Y
  Accept: text/html       → Visual bridge page
  Accept: application/json → Structured JSON

GET /api/saved
  Cookie: title_session   → JSON array of saved properties

GET /api/conversations
  Cookie: title_session   → JSON array of conversations
```

---

## What's NOT Yet Built

### High Priority
- **Cross-session AI context (Layer 5)** — inject saved properties + history into system prompt
- **Status workflow on saved properties** — active/contacted/listed/closed/archived
- **Notes editing on saved properties** — inline edit from /saved page
- **Copy Link button on bridge pages** — copy URL to clipboard
- **Score change tracking** — score_at_save vs current, show deltas on /saved

### Medium Priority
- **Farm area alerts** — daily cron checks for new court filings, email notification
- **Mini-chat on bridge pages** — embedded chat pre-loaded with property context
- **Export CSV from /saved** — for direct mail campaigns
- **Landing page replacement** — current / serves stale "Origin Title Records" page

### Lower Priority
- **Training tier team management** — multi-seat, invite flow, shared saved properties
- **Conversation sidebar in /farm** — visual list of past sessions for Pro+
- **Score_at_save column** — record farming score at time of save for delta tracking

---

## The Bridge Page as Memory Object

The bridge page URL is the universal memory format:

```
https://title.rootz.global/p/farm?address=7513+NW+47+DR&city=CORAL+SPRINGS
```

This URL:
1. **Is the search result** — AI includes it in farming responses
2. **Is the visual page** — agent clicks and sees the property
3. **Is AI memory** — any AI fetches it later and gets current state
4. **Is the save target** — agent bookmarks or saves to their list
5. **Is the share mechanism** — agent texts it to a colleague
6. **Is the alert reference** — "your saved property has a new filing"
7. **Is the conversation anchor** — "Ask AI about this property"
8. **Is the billing surface** — premium features behind auth
9. **Is the provenance chain** — SHA-256 hash proves the data

One URL, nine functions. That's the Rootz pattern.

---

## Deployment

```bash
# Deploy code
scp -i ~/.ssh/rootz_deploy mcp-server/*.mjs ubuntu@141.148.25.214:/var/www/title.rootz.global/
ssh -i ~/.ssh/rootz_deploy ubuntu@141.148.25.214 "cd /var/www/title.rootz.global && npm install && pm2 restart title-records --update-env"

# Check status
ssh -i ~/.ssh/rootz_deploy ubuntu@141.148.25.214 "pm2 logs title-records --lines 10 --nostream"

# Verify live
curl https://title.rootz.global/health
curl https://title.rootz.global/auth/login | head -3
```

PM2 process: `title-records` (id 36), port 3035.
Server: ubuntu@141.148.25.214, `/var/www/title.rootz.global/`.
Stripe webhook: `https://title.rootz.global/api/stripe/webhook` (5 events).
