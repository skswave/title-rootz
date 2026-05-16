# Session Prompt: Title Rootz — Architecture Rebuild + Git + Harvester Framework

## Context

Title Rootz Global (title.rootz.global) is a live AI-powered real estate farming product. It works — the data is real, the APIs return results, CSV export is functional, the GPT calls our endpoints. But the codebase is spaghetti: 37 files in root directory, server.mjs at 160KB, code was injected through SSH/Python/sed. A demo on May 16 failed because of this.

This session rebuilds the application properly with:
1. Git version control
2. Component architecture (following freight-intel pattern)
3. Stateless harvester framework for scaling to all 50 states
4. Tested, deployable components

## Read These First

- `land-records/docs/ARCHITECTURE-title-rootz-rebuild.md` — the full component map and migration plan
- `land-records/CLAUDE.md` — current data inventory and endpoints
- `freight-intel/CLAUDE.md` — the REFERENCE architecture to follow (ssh ubuntu@141.148.25.214 "cat /var/www/freight.rootz.global/CLAUDE.md")
- Memory file `feedback_title_spaghetti_never_again.md` — rules to follow
- Memory file `feedback_use_v6_components.md` — reuse existing Rootz patterns

## What Exists on the Server (Working, Needs Restructuring)

```
Server: ubuntu@141.148.25.214
Path: /var/www/title.rootz.global/
PM2: title-records (port 3035)
```

### Working endpoints to preserve:
- `/api/fl/farm?city=X&signals=Y&format=csv` — farming search + CSV export
- `/api/fl/search?address=X&city=Y` — full property intelligence
- `/api/oh/search?address=X&city=Y` — Ohio property search
- `/p/farm?address=X&city=Y` — bridge page (HTML intelligence page)
- `/farm` — AI chat UI (Claude Haiku)
- `/farm/{city}` — farm map (Leaflet)
- `/auth/login`, `/auth/verify`, `/auth/logout` — magic link auth
- `/saved` — saved properties
- `/pricing` — subscription tiers
- All cross-ref endpoints

### Data on server (DO NOT TOUCH):
- `data/florida/cities/*.jsonl` — 10.8M parcels (12GB)
- `data/broward-clerk/farming-signals.db` — 908K court records (448MB)
- `data/ohio/*.jsonl` — 1.2M parcels
- `data/title-accounts.db` — accounts, sessions, saved properties
- `data/florida/*.json` — overlay data (schools, hospitals, permits, etc.)

## Task 1: Initialize Git Repository

```bash
cd land-records
git init
echo "node_modules/\ndata/\n*.db\n.env" > .gitignore
git add -A
git commit -m "Initial commit — restructure from spaghetti to components"
```

Consider: create `skswave/title-rootz` on GitHub (like `skswave/origin-data`).

## Task 2: Create src/ Directory Structure

Follow the architecture in `ARCHITECTURE-title-rootz-rebuild.md`:

```
src/
  server.js              ← Routes only (Express)
  db.js                  ← SQLite schema for accounts
  auth.js                ← Port from current auth.mjs
  email.js               ← Port from current email.mjs
  stripe.js              ← Port from current stripe-config.mjs
  query/
    fl-property.js       ← Extract from fl-query.mjs: assemblePropertyIntelligence, lookupByAddress
    fl-farming.js        ← Extract from fl-query.mjs: farmingSearch
    fl-clerk.js          ← Extract from fl-query.mjs: lookupClerkSignals, getClerkDb
    fl-overlays.js       ← Extract from fl-query.mjs: getFloodZone, getCensusData, findSchools, etc.
    oh-property.js       ← Port from oh-query.mjs
    cross-ref.js         ← Extract from fl-query.mjs: crossRefEntity, crossRefPublic, crossRefOwnerIntel
  scoring/
    farming-score.js     ← Extract from fl-query.mjs: computeFarmingScore
  export/
    csv.js               ← Port from csv-export.mjs (already clean)
    bridge-page.js       ← Port from bridge-page-template.mjs
  templates/
    nav.js               ← Port from nav-template.mjs
    farm-chat.js         ← Port from farm-chat.mjs (HTML template only)
    farm-map.js          ← Port from farm-map-template.mjs
    pricing.js           ← Extract from server.mjs
    saved.js             ← Extract from server.mjs
    account.js           ← Extract from server.mjs
    auth-pages.js        ← Extract from server.mjs
  ai/
    chat-handler.js      ← Port from farm-chat.mjs (Claude API logic only)
  mcp-server.js          ← MCP tool definitions
```

### Rules for extraction:
- Each file starts with an AI_CONTEXT comment block
- Each file exports named functions only
- No file exceeds 500 lines
- No file imports from server.js (server imports from components, never reverse)
- No HTTP req/res knowledge in query/ or scoring/ (pure functions)

## Task 3: Build Harvester Framework

### The Vision
As we scale from Broward County to all 67 FL counties to all 50 states, we'll have hundreds of data sources. Each needs a harvester that:
- Loads a **recipe** (JSON config: source URL, field mapping, pagination, schedule)
- Pulls data from the source
- Transforms to standard schema
- Loads into the data lake (SQLite or JSONL)
- Reports status (records pulled, errors, duration)
- Is **stateless** — can run on any processor, doesn't depend on local state

### Harvester Architecture

```
ingest/
  harvester.js           ← Base harvester class (load recipe, pull, transform, load)
  recipes/
    fl-dor-parcels.json  ← FL DOR statewide parcel recipe
    fl-broward-clerk.json ← Broward SFTP recipe
    fl-permits-miami.json ← Miami-Dade ArcGIS recipe
    fl-permits-orlando.json ← Orlando Socrata recipe
    oh-franklin.json     ← Ohio Franklin County ArcGIS recipe
    oh-hamilton.json      ← Ohio Hamilton County CAGIS recipe
    ...
  transports/
    arcgis.js            ← ArcGIS REST FeatureServer puller
    socrata.js           ← Socrata SODA API puller
    sftp.js              ← SFTP bulk file puller (Broward clerk pattern)
    csv-download.js      ← HTTP CSV/Excel download puller
    web-scraper.js       ← Playwright-based scraper (for Accela, court portals)
  transforms/
    fl-dor-parcel.js     ← FL DOR field normalization
    oh-franklin-parcel.js ← Franklin County field normalization
    clerk-record.js      ← Courthouse record normalization
    permit-record.js     ← Building permit normalization
  loaders/
    jsonl-city-index.js  ← Write to city-indexed JSONL files
    sqlite-loader.js     ← Write to SQLite database
    status-reporter.js   ← Log harvest status + metrics
```

### Recipe Format (JSON)
```json
{
  "id": "fl-permits-miami-dade",
  "name": "Miami-Dade County Building Permits",
  "transport": "arcgis",
  "source": {
    "endpoint": "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/BuildingPermit_gdb/FeatureServer/0",
    "pagination": { "method": "offset", "batchSize": 2000, "delay": 300 }
  },
  "transform": "permit-record",
  "fieldMapping": {
    "permitNumber": "PROCNUM",
    "address": "STNDADDR",
    "type": "TYPE",
    "description": "DESC1",
    "status": "BPSTATUS",
    "estimatedValue": "ESTVALUE",
    "contractor": "CONTRNAME",
    "issueDate": { "field": "ISSUDATE", "format": "epoch_ms" }
  },
  "loader": "jsonl-city-index",
  "output": "data/florida/permits/miami-dade.jsonl",
  "schedule": "0 4 * * 1",
  "lastRun": null,
  "recordCount": null
}
```

### Harvester Runner
```bash
# Run a single recipe
node ingest/harvester.js --recipe fl-permits-miami-dae

# Run all recipes for a state
node ingest/harvester.js --state FL

# Run all due recipes (based on schedule)
node ingest/harvester.js --scheduled

# Status report
node ingest/harvester.js --status
```

## Task 4: Deploy via Git

```bash
# On dev machine
cd land-records
git add -A && git commit -m "Component architecture v1"
git remote add origin git@github.com:skswave/title-rootz.git
git push -u origin main

# On server
cd /var/www/title.rootz.global
git clone git@github.com:skswave/title-rootz.git src-new
# Copy src/ from src-new, update PM2 config to point to src/server.js
# Verify, then switch over
```

## Task 5: Fix Demo Issues

AFTER the restructure:
1. Fix BCPA photo loading (fetch timeout handling in bridge-page.js)
2. Pre-cache Census data (use statewide cached file, skip live API)
3. Increase free tier to 15 searches
4. Add ZIP code search to fl-farming.js
5. Test bridge page for Ohio addresses (state detection)

## Task 6: AI-Native Data Model (Two Layers + Summary Caching)

Read `docs/DESIGN-ai-native-data-model.md` for the full design. Key points:

### Layer 1: Raw Data Lake (for harvesters, unchanged)
- JSONL city-indexed files, SQLite databases
- Optimized for ingestion and batch computation
- AI never touches this directly

### Layer 2: Intelligence Documents (for AI consumption)
- Every API response includes a `summary` field (natural language)
- Template-generated summaries for all properties ($0, string concatenation)
- AI-generated rich summaries ONLY on demand ($0.001 when agent digs in)
- Cache AI summaries with dataHash — serve cached on repeat visits ($0)
- Invalidate when dataHash changes (new court filing, value update)

### Summary Cache Table (in title-accounts.db)
```sql
CREATE TABLE IF NOT EXISTS intelligence_cache (
  property_key TEXT PRIMARY KEY,       -- address+city normalized
  data_hash TEXT NOT NULL,             -- SHA-256 of raw property data
  template_summary TEXT,               -- Free template summary
  ai_summary TEXT,                     -- AI-generated rich summary (nullable)
  ai_model TEXT,                       -- Model used (haiku, sonnet)
  farming_score INTEGER,
  generated_at TEXT,
  accessed_count INTEGER DEFAULT 0,
  last_accessed TEXT
);
```

### Response Schema (every API response)
```json
{
  "summary": "Template or cached AI summary — AI reads this first",
  "farmingScore": { "score": 40, "rating": "MEDIUM", "interpretation": "..." },
  "property": { ... },
  "owner": { ... },
  "actions": {
    "bridgePage": "URL",
    "csvExport": "URL", 
    "ownerLookup": "URL"
  }
}
```

### Rules:
- Template summaries cost $0 — always generate them
- AI summaries cost $0.001 — only generate on demand, cache forever
- Cache invalidates when dataHash changes
- Budget $50/month max for nightly batch AI summaries on top 50K prospects
- The bridge page URL serves cached summaries — any AI reads the rich version free

## Also Read Before Starting

- `docs/DESIGN-ai-native-data-model.md` — full data model design
- `docs/DESIGN-page-structure-memory.md` — page hierarchy and memory model
- `docs/MEETING-steph-rich-may16-analysis.md` — Steph wants Excel lists, title companies are the customer
- Memory: `feedback_title_spaghetti_never_again.md` — the rules
- Memory: `feedback_ai_summary_caching.md` — compute once, serve forever
- Memory: `feedback_use_v6_components.md` — reuse existing Rootz patterns
- Memory: `project_title_steph_demo_feedback.md` — Excel export is the product, not AI chat

## Success Criteria

1. `git log` shows meaningful commits
2. No file in src/ exceeds 500 lines
3. `node --check src/server.js` passes
4. All existing endpoints still work (JSON, CSV, bridge pages, chat, auth)
5. `node ingest/harvester.js --recipe fl-permits-miami-dade --test` pulls 10 records
6. New developer can read CLAUDE.md and understand the system in 5 minutes

## Reference: Current Server File Sizes (the mess to clean up)

| File | Lines (~) | What It Contains | Split Into |
|------|-----------|------------------|------------|
| server.mjs | ~4,000 | Everything | src/server.js (routes only) |
| fl-query.mjs | ~2,500 | FL property, farming, clerk, overlays, scoring | 6 files in src/query/ + src/scoring/ |
| oh-query.mjs | ~400 | Ohio property | src/query/oh-property.js |
| farm-chat.mjs | ~300 | Chat UI + Claude handler | src/templates/farm-chat.js + src/ai/chat-handler.js |
| bridge-page-template.mjs | ~500 | Bridge page HTML | src/export/bridge-page.js |
| auth.mjs | ~300 | Auth logic | src/auth.js |
| db.mjs | ~170 | DB schema | src/db.js |
| csv-export.mjs | ~75 | CSV export | src/export/csv.js (already clean) |
| 10+ pull-*.mjs/py | ~200 each | Ingest scripts | ingest/ (with recipe framework) |
