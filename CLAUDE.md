# Title Rootz Global — Session Orientation

## What This Is
Multi-state property intelligence platform. Live at **title.rootz.global** (port 3035, PM2 `title-records`).

## Data (Verified May 16 2026)

| Dataset | Records | Coverage | Refresh |
|---------|---------|----------|---------|
| FL Parcels | 10,834,415 | 635 cities, all 67 counties (FL DOR statewide) | Monthly 15th |
| FL Permits | 2,275K+ | Miami-Dade, Broward, Brevard, Orlando, Charlotte (312K), Leon, Hillsborough, Volusia | Weekly Monday |
| FL DBPR Vacation Rentals | 178,236 | **Statewide, all 67 counties — 143K with PHONE** | Monthly 1st |
| FL Code Enforcement | 251,213 | Orlando (full history) | Weekly |
| FL Tax Delinquent | 1,941 + PDFs | Orange CSV + Miami-Dade 6MB PDF | Annual (published May) |
| Broward Court Records | 908,840 signals | 2.4M party records, 1978-present | Daily 6am UTC |
| FL Schools | statewide | Public + private, lat/lng | Monthly 1st |
| FL Hospitals | statewide | CMS Medicare-certified | Monthly 1st |
| FL FEMA Flood | nationwide | Any lat/lng | Live API |
| FL Census | statewide | ACS 2022 block groups | Annual Jan 15 |
| FL EV Charging | statewide | DOE AFDC | Monthly 1st |
| FL EPA TRI | statewide | Toxic release inventory | Monthly 1st |
| FL IRS Income | statewide | SOI by ZIP code | Annual |
| OH Parcels | 1,242,958 | Franklin (494K), Hamilton (329K), Cuyahoga (420K) + Montgomery/Summit ready | Monthly 1st |

## FL Parcel Fields (FL DOR format)
Core: `PARCELNO`, `OWN_NAME`, `PHY_ADDR1`, `PHY_CITY`, `PHY_ZIPCD`
Owner mailing: `OWN_ADDR1`, `OWN_CITY`, `OWN_STATE`, `OWN_ZIPCD`
Sales: `SALE_PRC1`, `SALE_YR1`, `SALE_MO1`, `SALE_PRC2`, `SALE_YR2`, `SALE_MO2`
Value: `JV` (just/market value), `LND_VAL`, `AV_HMSTD`, `AV_NON_HMS`
Building: `TOT_LVG_AR`, `ACT_YR_BLT`, `EFF_YR_BLT`, `NO_BULDNG`, `NO_RES_UNT`
Type: `DOR_UC` (use code), `CO_NO` (county number)
Trust/Estate: `FIDU_CD`, `FIDU_NAME`
Homestead: `AV_HMSTD`, `PREV_HMSTD`
Legal: `S_LEGAL`, `OR_BOOK1`, `OR_PAGE1`

## Key Endpoints

### Florida (primary)
- `/api/fl/search?address={ADDR}&city={CITY}` — Full property intelligence package
- `/api/fl/lookup?address={ADDR}&city={CITY}` — Quick lookup
- `/api/fl/flood?lat={LAT}&lng={LNG}` — FEMA flood zone (nationwide)
- `/api/fl/permits?address={ADDR}` — Building permits
- `/api/fl/schools?lat={LAT}&lng={LNG}` — Nearest schools
- `/api/fl/census?address={ADDR}&city={CITY}` — Census demographics
- `/api/fl/economics` — Market economics (FRED trends)
- `/api/fl/cross-ref/owner-intel?address={ADDR}&city={CITY}` — Full owner intelligence (LLC unmasking + public company detection)

### Ohio
- `/api/oh/search?address={ADDR}&city={CITY}` — Property intelligence

### Discovery
- `/.well-known/ai` — AI discovery metadata
- `/openapi.json` — OpenAPI 3.1.0 spec (for GPT Actions)
- `/api` — JSON endpoint directory
- `/skill` — Markdown skill file

## MCP Tools (12)
`search_property`, `get_chain_of_title`, `check_liens`, `get_document`, `get_assessor_data`, `list_properties`, `search_by_party`, `detect_fraud_patterns`, `search_by_notary`, `cross_ref_entity`, `cross_ref_public`, `cross_ref_owner_intel`

## Architecture
```
Server: ubuntu@141.148.25.214
Path:   /var/www/title.rootz.global/
Code:   mcp-server/server.mjs (HTTP+MCP), fl-query.mjs (FL engine), oh-query.mjs (OH engine)
Data:   data/florida/cities/*.jsonl (city-indexed), data/ohio/*.jsonl
PM2:    title-records (id 24, port 3035)
Nginx:  /etc/nginx/sites-enabled/title.rootz.global.conf
```

## Cross-Reference Network
```
title.rootz.global  ←→  private.rootz.global (4.2M FL/NY entities, LLC unmasking)
title.rootz.global  ←→  origin.rootz.global (8K SEC companies, REIT detection)
```

## Farming Signals (built in fl-query.mjs)
The investor signals engine detects: absentee owner, out-of-state owner, corporate/LLC owner, trust/fiduciary owner, long-term owner (15+ years), vacant lot, high equity (50%+), nominal transfer ($0-$100), senior/veteran/disabled/widow exemptions, homestead status, multiple owners.

## Broward County Official Records — SFTP Bulk Data (NEW May 14 2026)
**Free SFTP server with 48 years of official records:**
```
Host: BCFTP.Broward.org  Port: 22  User: crpublic  Pass: crpublic
```
- Yearly exports 1978-2025 (pipe-delimited: doc, nme, lnk, lgl files)
- Daily rolling 10 days (same format + TIFF document images)
- 2025: 642K documents, 438K farming-relevant signals
- Key doc types: LP (lis pendens), PRO (probate), LIE (lien), D (deed), M (mortgage), RST (satisfaction), DC (death), FJ (final judgment)
- Ingestion script: `pull-broward-clerk.mjs`
- Farming signals: `data/broward-clerk/farming/*.jsonl`
- Name-matched to DOR parcels: 5,912 signals with addresses (2025)
- System: OnCore Acclaim (Harris Recording Solutions) — check other FL counties for same pattern

## Current Focus (May 2026)
Building an **AI farming tool for real estate agents**. Target: Steph's training class of 1,100 FL agents. Farming = systematically identifying properties likely to list soon, then proactively reaching owners.

## File Structure
```
land-records/
├── CLAUDE.md              ← this file (session orientation)
├── AI_CONTEXT.md          ← full project context for AI discovery
├── mcp-server/
│   ├── server.mjs         ← HTTP + MCP server (81K, 2000+ lines)
│   ├── fl-query.mjs       ← FL intelligence engine (73K)
│   ├── oh-query.mjs       ← OH intelligence engine (14K)
│   ├── SKILL.md           ← AI skill file (farming-focused)
│   ├── openapi.json       ← OpenAPI spec for GPT Actions
│   ├── refresh.mjs        ← Data refresh (cron target)
│   ├── pull-statewide.mjs ← FL DOR statewide puller
│   └── pull-ohio*.mjs     ← OH county pullers
├── docs/
│   ├── DEPLOYMENT.md      ← Server operations guide
│   ├── FARMING-GUIDE.md   ← Agent farming playbook
│   └── [20+ design/architecture docs]
├── data/                  ← Local data samples (bulk on server)
├── title-wallet/          ← Title Wallet API (port 3036)
└── title-wallet-mcp/      ← Title Wallet MCP (port 3037)
```

## Cron Schedule (title-specific)
- `0 0,6,12,18 * * *` — Source health monitor (4x daily)
- `0 3 15 * *` — Full parcel re-pull (monthly 15th)
- `0 4 * * 1` — Permits refresh (weekly Monday) — includes Leon + Charlotte
- `0 5 1 * *` — Schools + roads (monthly 1st)
- `0 6 * * *` — Broward Clerk daily records + SQLite rebuild
- `0 6 15 1 *` — Census (annual January 15)
- `0 7 1 * *` — Ohio parcel refresh, all ready counties
- `0 8 1 * *` — DBPR vacation rental licenses statewide

## Key Data Scripts
- `harvest-batch.mjs` — Pull all verified data sources (permits, tax, CE)
- `pull-dbpr-licenses.mjs` — DBPR vacation rental licenses (178K, statewide phone numbers)
- `pull-broward-clerk.mjs` — Broward court records SFTP (--daily --rebuild-db)
- `build-clerk-sqlite.mjs` — JSONL→SQLite for court records query engine
- `pull-ohio.mjs` — Ohio county parcels (5 counties configured)
- `scrape-landmark.mjs` — Playwright court records scraper (15 Landmark Web counties)
- `harvest-permits.mjs` — FL permit recipes (Miami-Dade, Broward, Brevard)
