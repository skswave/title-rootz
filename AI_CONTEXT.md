# Title Rootz Global — Property Intelligence Platform

## What This Is

**title.rootz.global** is an AI-accessible property intelligence platform covering all of Florida (10.8M parcels), Ohio (1.2M parcels), and Massachusetts (deep title records). Every record comes from authenticated government sources with cryptographic provenance.

The immediate application: **AI-powered farming for real estate agents.** 1,100 Florida agents in a training program will use this data through AI to identify properties likely to come on the market.

## Why This Exists

Real estate agents spend hours manually researching properties to "farm" — identifying potential sellers before they list. County property appraiser sites are designed for individual lookups, not systematic analysis. AI assistants (ChatGPT, Claude, Grok) cannot access county GIS data directly.

Title Rootz Global solves this by:
1. Collecting government parcel data in bulk from every Florida county
2. Indexing it for instant AI query (city-indexed JSONL, grep-based lookup)
3. Adding investor signals that detect farming-relevant patterns
4. Overlaying federal data (flood zones, schools, demographics, economics)
5. Exposing everything via HTTP API + MCP tools + OpenAPI spec

## Live Data Inventory (Verified May 14 2026)

### Florida — All 67 Counties
- **10,834,415 parcels** from FL Department of Revenue statewide bulk data
- 635 real cities indexed (12GB on disk)
- Source: FL DOR annual NAL (Name/Address/Legal) file + county GIS supplements
- Fields per record: owner name, physical address, mailing address, sale prices (last 2), sale dates, just/market value, land value, living area, year built, use code, homestead status, fiduciary/trust info, county number, legal description
- **Refresh**: Monthly 15th via `refresh.mjs --parcels`

### Florida — Overlays
- **842K+ building permits** — Miami-Dade (482K), Broward, Brevard
- **Schools** — statewide public + private with enrollment, lat/lng
- **Hospitals** — statewide CMS Medicare-certified
- **FEMA Flood Zones** — nationwide, any lat/lng
- **Census Demographics** — ACS 2022 block group level (income, home values, vacancy, age)
- **IRS Income** — SOI by ZIP code (AGI, returns, average income)
- **EPA Toxic Release** — statewide TRI facilities
- **EV Charging** — statewide DOE AFDC stations
- **FRED Economics** — median price, active listings, days on market, new listings, unemployment
- **BLS CPI** — Miami-Fort Lauderdale cost of living index
- **FEMA Disasters** — by county, historical declarations
- **Refresh**: Weekly (permits), Monthly (schools, roads), Annual (census)

### Ohio — 3 Counties
- **Franklin County (Columbus)**: 493,866 parcels — ArcGIS with full CAMA data
- **Hamilton County (Cincinnati)**: 329,092 parcels — CAGIS with detailed fields
- **Cuyahoga County (Cleveland)**: 420,000 parcels — ArcGIS with CAMA data
- Total: 1,242,958 parcels
- **Refresh**: Manual (no cron yet)

### Massachusetts — Deep Title Records
- ~10 properties with full chain of title, lien analysis, fraud detection
- Source: masslandrecords.com (Berkshire County)
- 1M+ documents in Middle Berkshire registry alone

## Farming Signals Engine

The investor signals engine in `fl-query.mjs` detects patterns that indicate a property may come on the market:

| Signal | Detection Method | Why It Matters |
|--------|-----------------|----------------|
| Absentee Owner | Mailing address != physical address | Not living there, may sell |
| Out-of-State Owner | Mailing state != FL | Distance management burden |
| Corporate/LLC Owner | Entity keywords in OWN_NAME | Investment property, may rotate |
| Trust/Estate Owner | FIDU_CD populated, trust keywords | Probate/estate settlement |
| Long-term Owner | 15+ years since last sale | Life changes, downsizing |
| High Equity | Market value >> last sale price (50%+) | Sitting on unrealized gains |
| Nominal Transfer | Sale price $0-$100 | Free & clear, estate transfer |
| Senior Exemption | County senior exemption active | Aging in place, may downsize |
| Veteran/Disabled/Widow | Respective exemptions active | Life situation indicators |
| No Homestead | AV_HMSTD = 0 | Not primary residence |
| Vacant Lot | No year built, no building | Development opportunity |
| Multiple Owners | Second owner populated | Joint ownership complexity |

## Cross-Reference Network

Title Rootz connects to two other Rootz data services:

```
title.rootz.global (10.8M properties)
       ↕ LLC/entity name match
private.rootz.global (4.2M FL/NY business entities, 575K officers)
       ↕ company name match  
origin.rootz.global (8K SEC public companies, 247 tickers)
```

**Join 1 — LLC Unmasking**: Property owned by "SEASIDE HOLDINGS LLC" → query private.rootz.global → returns officers, filing date, registered agent, succession signal

**Join 2 — Institutional Detection**: Property owned by "INVITATION HOMES" → query origin.rootz.global → returns ticker INVH, REIT SIC code, institutional flag

**Join 3 — Combined Owner Intel**: One call (`/api/fl/cross-ref/owner-intel`) runs both joins in parallel, classifies owner as individual/private_entity/owner_operated/public_company/public_reit

## API Reference

### Florida (primary for farming)
```
GET /api/fl/search?address={ADDR}&city={CITY}     — Full property intelligence package
GET /api/fl/lookup?address={ADDR}&city={CITY}      — Quick property lookup
GET /api/fl/flood?lat={LAT}&lng={LNG}              — FEMA flood zone (nationwide)
GET /api/fl/permits?address={ADDR}                 — Building permits
GET /api/fl/schools?lat={LAT}&lng={LNG}&radius=N   — Nearest schools
GET /api/fl/hospitals?lat={LAT}&lng={LNG}&radius=N  — Nearest hospitals
GET /api/fl/census?address={ADDR}&city={CITY}       — Census demographics
GET /api/fl/economics                               — Market economics (FRED trends)
GET /api/fl/ev-charging?lat={LAT}&lng={LNG}&radius=N — EV charging stations
GET /api/fl/environmental?lat={LAT}&lng={LNG}&radius=N — EPA TRI facilities
GET /api/fl/timeshare?q={QUERY}                     — Timeshare intelligence
GET /api/fl/cross-ref/entity?owner={NAME}           — LLC → officers
GET /api/fl/cross-ref/public?owner={NAME}           — Owner → SEC company
GET /api/fl/cross-ref/owner-intel?address={ADDR}&city={CITY} — Full owner profile
```

### Ohio
```
GET /api/oh/search?address={ADDR}&city={CITY}      — Property intelligence
GET /api/oh/lookup?address={ADDR}&city={CITY}       — Property lookup
```

### Massachusetts
```
GET /api/search?address={ADDR}&town={TOWN}          — Full property + chain of title
GET /api/chain?address={ADDR}&town={TOWN}           — Chain of title only
GET /api/liens?address={ADDR}&town={TOWN}           — Lien analysis
GET /api/fraud?address={ADDR}&town={TOWN}           — Fraud pattern detection
GET /api/party?name={NAME}                          — Cross-property party search
```

### Discovery
```
GET /.well-known/ai          — AI discovery metadata
GET /openapi.json            — OpenAPI 3.1.0 spec (for GPT Actions)
GET /api                     — JSON endpoint directory
GET /skill                   — Markdown skill guide
GET /health                  — Health check
```

## MCP Tools (12)

| Tool | Description |
|------|-------------|
| `search_property` | Full property record: registry docs, assessor data, chain of title, liens |
| `get_chain_of_title` | Ownership history (who owned it, when, price) |
| `check_liens` | Active mortgages, tax takings, execution judgments |
| `get_document` | Specific recorded document by book/page |
| `get_assessor_data` | MassGIS data: assessed value, lot size, year built, zoning |
| `list_properties` | Summary of all cached properties |
| `search_by_party` | Cross-property search by person/entity name |
| `detect_fraud_patterns` | Orphan deeds, phantom discharges, rapid transfers, POA, notary anomalies |
| `search_by_notary` | Cross-property notary search |
| `cross_ref_entity` | Property owner → FL Sunbiz business officers |
| `cross_ref_public` | Property owner → SEC public company/REIT |
| `cross_ref_owner_intel` | Combined full owner intelligence profile |

## What Makes This Different

1. **Government source data** — not scraped from Zillow/Redfin estimates
2. **Cryptographic provenance** — SSL fingerprints proving data source
3. **Statewide bulk** — not individual lookups; 10.8M records pre-indexed
4. **Investor signals** — computed farming patterns, not raw fields
5. **Cross-reference joins** — LLC unmasking + institutional detection in one call
6. **AI-native** — MCP tools + OpenAPI + .well-known/ai; any AI can use it
7. **Federal overlays** — flood, schools, demographics, economics layered on every property

## Team
- **Steven Sprague** — Rootz founder, CEO of Wave Systems (trusted computing pioneer)
- **Tracie** — Title insurance lawyer (MA domain expert)
- **Steph** — Real estate training (1,100 FL agent program, farming methodology)

## Architecture
```
Server:  ubuntu@141.148.25.214 (Oracle Cloud, 193GB disk, 51% used)
Path:    /var/www/title.rootz.global/
Process: PM2 id 24 "title-records" on port 3035
Nginx:   /etc/nginx/sites-enabled/title.rootz.global.conf
Code:    mcp-server/server.mjs (HTTP+MCP) + fl-query.mjs (FL engine) + oh-query.mjs (OH engine)
Data:    data/florida/cities/*.jsonl (city-indexed) + data/ohio/*.jsonl
```
