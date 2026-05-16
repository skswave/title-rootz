# Session Prompt: Title Rootz — Property Data Harvesting (FL + OH)

## Context

Title Rootz Global (title.rootz.global) is a live AI-powered real estate farming product. The data foundation needs expansion. This session focuses on harvesting more property-related data across Florida and Ohio.

## Current Data Inventory (as of May 15 2026)

### Florida Parcels — COMPLETE
- **10,834,415 parcels** — all 67 counties from FL DOR statewide NAL file
- City-indexed JSONL in `/var/www/title.rootz.global/data/florida/cities/` (12GB, 635 real cities)
- Fields: owner, mailing address, physical address, assessed value, sale price/date (varies by county), use code, homestead, lot size, living area
- Refresh: monthly cron on 15th via `refresh.mjs --parcels`
- **GAP**: No bed/bath/sqft for most counties (DOR doesn't include CAMA data). Need county-specific property appraiser APIs for detailed building info.

### Florida Building Permits — PARTIAL
| Source | Records | Status |
|--------|---------|--------|
| Miami-Dade County | 262,019 | Active recipe in harvest-permits.mjs |
| City of Miami | 219,931 | Active recipe |
| Fort Lauderdale (Broward) | 204,760 | Pulled May 1 |
| Palm Bay (Brevard) | 155,693 | Pulled May 14 |
| **Orlando (City, Socrata)** | **1,097,840** | Pulled May 14 — BIGGEST source |
| Hillsborough/Tampa (ArcGIS) | 10,817 | Pulled May 14 — small, may be active only |
| Volusia/Daytona (ArcGIS) | 3,547 | Pulled May 14 — AMANDA active permits only |
| **Total** | **1,954,607** | |

**Expansion targets** (from research doc `RESEARCH-fl-permit-endpoints.md`):
- Leon/Tallahassee — ArcGIS open data, URL was 404 last attempt, needs retry
- Manatee County — CivicData CSV archives (1991-2018), free download
- Charlotte County — Excel export + ArcGIS new construction
- City of St. Augustine — ArcGIS building permits dashboard

**Blocked counties** (Accela web portals, no API):
- Hillsborough (full county), Pinellas, Lee, Sarasota, Osceola, Polk, Pasco, Seminole
- These require Playwright scraping or public records requests

### Florida Court Records — BROWARD ONLY
- **908,840 farming signals** in SQLite (`farming-signals.db`, 448MB)
- **2,435,892 party name records** indexed for matching
- Source: Broward County Clerk SFTP (BCFTP.Broward.org, user: crpublic, pass: crpublic)
- Yearly exports 1978-2025 + daily rolling 10 days
- Ingestion script: `pull-broward-clerk.mjs`
- **IMPORTANT**: Court records matched by owner name only — labeled "Name match — verify" on bridge pages. Only deed transfers have Parcel IDs.

**Expansion targets** (from research doc `RESEARCH-fl-county-bulk-ftp.md`):
| County | Pop | Access | Cost | Status |
|--------|-----|--------|------|--------|
| Palm Beach | 1.5M | FTP subscription | $600/yr | Application needed |
| Miami-Dade | 2.7M | FTP + API | $110/mo index | Developer portal exists |
| Lee | 770K | FTP bulk | Call for pricing | (239) 533-5007 |
| Lake | 380K | FTP | $900/yr + $75 setup | |
| Pasco | 560K | FREE web download | $0 | Download page exists |
| Brevard | 600K | AcclaimWeb (same as Broward) | Likely free | Call (321) 637-2006 |
| St. Lucie | 330K | AcclaimWeb | Likely free | Call (772) 462-6930 |
| Leon | 290K | AcclaimWeb, FTP mentioned | Likely free | Call (850) 606-4030 |

**Action items**:
1. Pull Pasco County free downloads (daily/weekly index + sales data)
2. Call AcclaimWeb counties (Brevard, St. Lucie, Leon) — same platform as Broward, likely have same free FTP
3. Set up daily cron for Broward clerk data: `pull-broward-clerk.mjs --daily`

### Florida Overlay Data — MOSTLY COMPLETE
| Dataset | Coverage | Records | Refresh |
|---------|----------|---------|---------|
| Schools (public) | FL statewide | 1.4MB | Monthly 1st |
| Schools (private) | FL statewide | 556KB | Monthly 1st |
| Hospitals | FL statewide | 353KB | Monthly 1st |
| EV Charging | FL statewide | 14MB | Monthly 1st |
| EPA TRI | FL statewide | 3.3MB | Monthly 1st |
| Census (ACS) | FL statewide | 3.8MB | Annual Jan |
| FEMA Flood | Nationwide | Live API | Real-time |
| FEMA Disasters | FL statewide | 2.8MB | Monthly |
| IRS Income | FL statewide | 7.4MB | Annual |
| FRED Economics | FL metros | 58KB | Monthly |
| BLS CPI | Miami metro | 3.6KB | Monthly |
| Orlando Planning Apps | Orlando only | 22,007 | One-time |
| Orlando STR Licenses | Orlando only | 513 | One-time — **HAS PHONE + EMAIL!** |
| Orlando Code Enforcement | Orlando only | 77,019 | One-time |

**Expansion targets**:
- Short-term rental licenses from more FL cities (these have phone + email!)
- Code enforcement data from Miami, Tampa, Jacksonville, Fort Lauderdale
- FL DBPR contractor license data (statewide)
- Tax delinquent lists from county tax collectors (annual PDF/CSV publications)

### Ohio Parcels — 3 COUNTIES
| County | Records | Source | Status |
|--------|---------|-------|--------|
| Franklin (Columbus) | 493,866 | ArcGIS | Working |
| Hamilton (Cincinnati) | 329,092 | CAGIS | Working — different field format |
| Cuyahoga (Cleveland) | 420,000 | ArcGIS | Pulled May 12 — has full CAMA data |
| Montgomery (Dayton) | 0 | ArcGIS | FAILED — field encoding issue |
| Summit (Akron) | 0 | ArcGIS | FAILED — field encoding issue |
| **Total** | **1,242,958** | | |

**OH expansion targets**:
- Fix Montgomery and Summit county pulls (ArcGIS field encoding)
- Add Lucas County (Toledo) — check for ArcGIS endpoint
- Add Stark County (Canton) — check for ArcGIS endpoint
- Steph's agents use Ohio data for Columbus/Hilliard area training

### Ohio Overlay Data — MINIMAL
- No Ohio court records, no permits, no overlay data yet
- Need: OH county auditor APIs for building details (beds, baths, sqft)
- Need: OH school district data

## Server Details
```
Server: ubuntu@141.148.25.214 (Oracle Cloud ARM, 12GB RAM, 193GB disk 52% used)
Path: /var/www/title.rootz.global/
PM2: title-records (port 3035)
Data: /var/www/title.rootz.global/data/
```

## Key Scripts
- `pull-broward-clerk.mjs` — Broward SFTP ingestion (--daily, --year, --farming)
- `harvest-permits.mjs` — FL permit recipes (--county X, --list, --test)
- `pull-ohio.mjs` — Ohio ArcGIS puller
- `pull-ohio-counties.mjs` — Multi-county OH puller
- `pull-statewide.mjs` — FL DOR statewide parcel puller
- `refresh.mjs` — Cron target for all refresh jobs
- `farming-analysis.mjs` — City-level farming signal analysis
- `build-clerk-sqlite.py` — Clerk signal SQLite index builder

## Priority Tasks for This Session

### 1. Set Up Broward Clerk Daily Cron
Add to crontab:
```
0 6 * * * cd /var/www/title.rootz.global && node pull-broward-clerk.mjs --daily >> /var/log/title-clerk.log 2>&1
```
Then rebuild SQLite index after daily pull.

### 2. Pull Pasco County Free Downloads
URL: https://www.pascoclerk.com/526/Subscription-Download-Data
Free daily/weekly index files + sales data. Download and parse.

### 3. Fix Montgomery + Summit OH Pulls
The pull-remaining-oh.py script failed due to outFields encoding. The fix that worked for Cuyahoga: use `outFields=*` instead of listing specific field names.

### 4. Expand STR Licenses (Phone + Email Data!)
Orlando's short-term rental licenses are the ONLY source with phone + email. Search for similar datasets from:
- Miami Beach (strong STR regulation)
- Fort Lauderdale
- Key West
- Tampa / St. Petersburg
- Any FL city with STR licensing

### 5. Expand Building Permits
- Retry Leon/Tallahassee ArcGIS endpoint
- Pull Manatee County CivicData CSV archives
- Try Charlotte County Excel export

### 6. Tax Delinquent Lists
Many FL county tax collectors publish annual tax certificate sale lists (required by law). These identify properties with unpaid taxes — strong farming signal. Start with top 5 counties.

### 7. Code Enforcement Expansion
Orlando's code enforcement data (77K records) is a farming signal. Expand to:
- City of Miami
- City of Tampa
- City of Jacksonville
- Broward County

## What to Read First
- `land-records/CLAUDE.md` — session orientation
- `land-records/docs/RESEARCH-fl-permit-endpoints.md` — permit sources
- `land-records/docs/RESEARCH-fl-county-bulk-ftp.md` — clerk FTP sources
- `land-records/docs/PERMIT-EXPANSION-STATUS.md` — what's been tried
- `land-records/docs/DATA-SOURCES-distressed-signals.md` — all data source options
