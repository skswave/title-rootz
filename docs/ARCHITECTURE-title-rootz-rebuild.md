# Architecture Plan: Title Rootz Global — Component Rebuild

## The Problem

37 files in the root directory. server.mjs is 160KB (4,000+ lines). fl-query.mjs is 93KB. Code injected through Python heredocs via SSH. No tests. No component boundaries. No src/ folder. Demo crashed because untestable spaghetti code.

## The Standard (from freight-intel, the reference)

```
freight-intel/
├── CLAUDE.md                    # 80 lines — what, why, how
├── AI_CONTEXT.md                # Detailed AI-readable context
├── package.json
├── .env
├── src/
│   ├── server.js                # Express HTTP (landing, REST API, .well-known/ai)
│   ├── db.js                    # SQLite schema + initialization
│   ├── mcp-server.js            # MCP tool definitions
│   ├── fmcsa-api.js             # External API integration
│   ├── vetting-record.js        # Business logic
│   ├── attestation.js           # Provenance/hashing
│   └── *-puller.js              # Data ingestion (separate scripts)
├── public/                      # Static HTML
├── data/                        # SQLite databases
└── docs/                        # Design documents
```

## Target Architecture for Title Rootz

```
title-rootz/
├── CLAUDE.md                        # Quick reference (what, why, deploy)
├── AI_CONTEXT.md                    # Full AI-readable project context
├── package.json                     # Dependencies
├── .env                             # API keys, ports, secrets
│
├── src/
│   ├── server.js                    # Express HTTP — routes ONLY, delegates to components
│   ├── db.js                        # SQLite schema (accounts + farming signals)
│   ├── auth.js                      # Magic link auth, JWT sessions, rate limiting
│   ├── email.js                     # Gmail OAuth2 magic link sending
│   ├── stripe.js                    # Stripe billing, webhooks, checkout
│   │
│   ├── query/                       # Data query components
│   │   ├── fl-property.js           # FL property lookup (statewide DOR + MDC GIS)
│   │   ├── fl-farming.js            # Farming search (city + signals + scoring)
│   │   ├── fl-clerk.js              # Broward clerk signal lookup (SQLite)
│   │   ├── fl-overlays.js           # FEMA flood, Census, schools, hospitals, permits
│   │   ├── oh-property.js           # Ohio property lookup (Franklin, Hamilton, Cuyahoga)
│   │   └── cross-ref.js             # Sunbiz LLC + SEC company cross-reference
│   │
│   ├── scoring/
│   │   └── farming-score.js         # Farming score algorithm (0-100)
│   │
│   ├── export/
│   │   ├── csv.js                   # CSV/Excel export (farming + mailer formats)
│   │   └── bridge-page.js           # Bridge page HTML renderer
│   │
│   ├── templates/
│   │   ├── nav.js                   # Persistent navigation bar
│   │   ├── farm-chat.js             # Chat UI page template
│   │   ├── farm-map.js              # Leaflet map page template
│   │   ├── pricing.js               # Pricing page template
│   │   ├── saved.js                 # Saved properties page template
│   │   ├── account.js               # Account page template
│   │   └── auth-pages.js            # Login, verify, logout templates
│   │
│   ├── ai/
│   │   └── chat-handler.js          # Claude API handler (tool_use, conversation)
│   │
│   └── mcp-server.js                # MCP tool definitions (stdio JSON-RPC)
│
├── ingest/                          # Data ingestion scripts (NOT production code)
│   ├── pull-fl-parcels.js           # FL DOR statewide parcel pull
│   ├── pull-broward-clerk.js        # Broward Clerk SFTP bulk
│   ├── pull-ohio.js                 # Ohio county ArcGIS pulls
│   ├── pull-permits.js              # FL building permit recipes
│   ├── pull-overlays.js             # Federal overlay data (schools, hospitals, etc.)
│   ├── build-city-index.js          # Build city-indexed JSONL from statewide
│   └── build-clerk-sqlite.js        # Build farming-signals.db from JSONL
│
├── public/
│   ├── index.html                   # Landing page
│   └── skill.md                     # AI skill file
│
├── data/                            # SQLite databases + JSONL (NOT in git)
│   ├── title-accounts.db            # Accounts, sessions, saved properties
│   ├── florida/
│   │   ├── cities/                  # City-indexed JSONL (10.8M parcels)
│   │   └── *.json                   # Overlay data files
│   ├── ohio/
│   │   └── *.jsonl                  # Ohio parcel files
│   └── broward-clerk/
│       └── farming-signals.db       # 908K court record signals
│
├── docs/
│   ├── DEPLOYMENT.md
│   ├── FARMING-GUIDE.md
│   └── *.md                         # All design/research documents
│
└── tests/                           # Test suites
    ├── test-farming-search.js
    ├── test-csv-export.js
    ├── test-bridge-page.js
    └── test-auth.js
```

## Component Contracts

### Each component in src/ has:

1. **AI_CONTEXT comment block** at top of file — what it does, what it depends on, what it exports
2. **Named exports only** — no default exports, no side effects on import
3. **Pure functions where possible** — input → output, no hidden state
4. **Explicit dependencies** — imports at top, no dynamic requires
5. **Error handling** — returns error objects, never throws across boundaries
6. **No HTTP knowledge** — components don't know about req/res (server.js handles that)

### Example: src/query/fl-farming.js
```javascript
/**
 * FL Farming Search — finds farming prospects in a Florida city
 * 
 * Dependencies:
 *   - data/florida/cities/*.jsonl (DOR parcel data)
 *   - data/broward-clerk/farming-signals.db (court records)
 *   - src/query/fl-clerk.js (clerk signal lookup)
 *   - src/scoring/farming-score.js (score computation)
 * 
 * Exports:
 *   - farmingSearch({ city, signals, limit, minScore }) → { total, prospects[] }
 */

import { lookupClerkSignals } from './fl-clerk.js';
import { computeFarmingScore } from '../scoring/farming-score.js';

export function farmingSearch({ city, signals = [], limit = 50, minScore = 0 }) {
  // ... clean implementation
}
```

### Example: src/server.js (routes only, no business logic)
```javascript
// Route: GET /api/fl/farm
app.get('/api/fl/farm', async (req, res) => {
  const { city, signals, limit, minScore, format } = req.query;
  if (!city) return res.status(400).json({ error: 'city required' });
  
  const result = farmingSearch({ city, signals: signals?.split(','), limit, minScore });
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rootz-farming-${city}.csv"`);
    return res.send(farmingToCSV(result.prospects));
  }
  
  res.json(result);
});
```

## Migration Plan

### Phase 1: Structure (no behavior change)
1. Create `src/` directory
2. Extract fl-query.mjs into `src/query/fl-property.js`, `src/query/fl-farming.js`, `src/query/fl-clerk.js`, `src/query/fl-overlays.js`
3. Extract scoring into `src/scoring/farming-score.js`
4. Extract CSV into `src/export/csv.js` (already done as csv-export.mjs)
5. Extract templates into `src/templates/`
6. Move ingest scripts to `ingest/`
7. Delete Python scripts from root (replace with JS equivalents or move to ingest/)
8. Create thin `src/server.js` that imports components and defines routes

### Phase 2: Testing
9. Write test for farmingSearch (known city → expected result count)
10. Write test for CSV export (known input → valid CSV)
11. Write test for bridge page (known address → valid HTML with expected sections)
12. Write test for auth flow (create account → magic link → verify → session)

### Phase 3: Documentation
13. Write AI_CONTEXT.md comment block for every src/ file
14. Update CLAUDE.md to reflect new structure
15. Update AI_CONTEXT.md with component map
16. Update OpenAPI spec

### Phase 4: Deploy
17. Deploy to server maintaining same PM2 process and data paths
18. Verify all routes work (JSON API, CSV export, bridge pages, chat, auth)
19. Remove old files from server root

## Rules Going Forward

1. **No code injection through SSH/Python/sed.** Write files locally, SCP, restart PM2.
2. **No 3,000+ line files.** If a file exceeds 500 lines, split it.
3. **No business logic in server.js.** Routes call components, components do work.
4. **No untested deployments.** Run `node --check` before deploying. Write a basic test.
5. **Every component has an AI_CONTEXT block.** If you can't explain what it does in 5 lines, it's too complex.
6. **Ingest scripts are separate from production code.** They run on cron, not on request.
7. **One database per concern.** title-accounts.db for auth/billing. farming-signals.db for court records. Don't merge them.
