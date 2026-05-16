# Florida Land Records — Feasibility Analysis
## Palm Beach County + Miami-Dade County
### April 22, 2026

## Bottom Line: Florida is easier, richer, and bigger than Massachusetts.

Florida has what Massachusetts doesn't:
- **A statewide standardized dataset** (FL DOR) covering all 67 counties in one format
- **A developer API** (Miami-Dade Clerk) at $0.20/call
- **Bulk FTP data** (Miami-Dade) at $110/month
- **10.8 million parcels** statewide via ArcGIS REST (free)
- **100+ fields per parcel** in county GIS systems
- **Documentary stamp tax** = sale price is calculable from recording data
- **No registered land** complexity (no Land Court like MA)

We could build Florida faster and cheaper than Massachusetts — and the market is 4x larger.

---

## Data Access Comparison: FL vs MA

| Feature | Massachusetts | Florida |
|---------|-------------|---------|
| Record custodian | 21 Registries of Deeds | 67 County Clerks |
| Statewide standard format | NO | **YES (FL DOR NAL/SDF files, 70+ fields)** |
| Developer API | NONE anywhere | **Miami-Dade: $0.20/call** |
| Bulk FTP | NONE | **Miami-Dade: $110/month** |
| Free online search | Yes (all registries) | Yes (Palm Beach free, Miami-Dade basic free) |
| Statewide GIS parcels | MassGIS (2.6M parcels, 48 fields) | **FL Cadastral (10.8M parcels) + county GIS (100+ fields)** |
| Sale price from records | Separate source needed | **Calculable from doc stamps** |
| Registered Land complexity | Yes (~15% of Suffolk) | **NO — one system only** |
| Search methods | 3-4 (name, property, book, date) | **10 (includes parcel ID, consideration, legal desc)** |
| Document images | Free (back to 1641 in some) | Free PBC (back to 1968), paid MDC |
| Puppeteer needed? | YES (ASP.NET ViewState) | **Less — API available for MDC** |
| robots.txt | 404 (none) | MDC: permissive (only blocks /Sealed/) |
| .well-known/ai | 404 (none) | 404 (none — opportunity!) |
| Parcels (target counties) | 76,400 (Berkshire) | **1,612,561 (PBC + MDC)** |

---

## Key Data Sources

### 1. FL Department of Revenue — Statewide Data Portal
**THE single best resource. One integration = all 67 counties.**

- URL: floridarevenue.com/property/Pages/DataPortal_RequestAssessmentRollGISData.aspx
- Format: CSV (comma-delimited)
- Three file types:
  - **NAL** (Name-Address-Legal): 70+ fields — owner, address, legal description, values, exemptions, use codes
  - **SDF** (Sale Data File): All recorded sales with prices, dates, qualification codes
  - **NAP** (Name-Address-Property): Tangible personal property
- Historical: NAL/NAP from 2002, SDF from 2009, GIS shapefiles from 2005
- Coverage: ALL 67 counties

### 2. Miami-Dade Clerk — Developer API
- URL: www2.miamidadeclerk.gov/Developers
- Cost: $0.20/API call (prepaid units)
- FTP bulk: $110/month (standard), $420/month (with images)
- Data: Official Records (deeds, mortgages, liens), Civil, Criminal, Family, Marriage
- Registration: Online form, notarized ID for court records (NOT required for Official Records)

### 3. Palm Beach Clerk — Landmark Web
- URL: erec.mypalmbeachclerk.com
- Technology: Pioneer Technology Group (Landmark Web v1.5.103.0)
- Cost: FREE — no login, no fees
- 10 search methods including Parcel ID and Consideration search
- Document images back to 1968
- Pioneer Landmark used in MULTIPLE FL counties — learn once, apply many

### 4. County GIS (Free ArcGIS REST)
- Palm Beach: maps.co.palm-beach.fl.us/arcgis/rest/services/Parcels/
- Miami-Dade: gisweb.miamidade.gov/arcgis/rest/services/MD_LandInformation/MapServer
  - Layer 24: Property (45 fields — owner, values, bedrooms, year built)
  - Layer 26: Parcels (boundaries)
- Both free, no auth needed

### 5. FL Statewide Cadastral
- ArcGIS REST: services9.arcgis.com/.../Florida_Statewide_Cadastral/FeatureServer
- 10.8 million parcels
- Free, JSON format
- 2,000 records per query

---

## Florida-Specific Issues for Title

### Documentary Stamp Tax (advantage)
- Deeds: $0.70/$100 (MDC special: $0.60/$100)
- Mortgages: $0.35/$100 + intangible tax $2/$1,000
- **Tax paid = consideration calculable** — no need for separate sales data source

### Homestead (complexity)
- Constitutional protection from ALL judgment creditors (no dollar cap)
- Save Our Homes cap: assessed value increase limited to 3%/year or CPI
- Creates gap between just value and assessed value (tracked in NAL file)
- Portability: benefit can transfer to new homestead within 3 years
- **Must cross-reference Clerk + Property Appraiser to verify**

### HOA/Condo Liens (major FL issue)
- Condo liens relate back to original declaration recording date
- Super-lien: up to 12 months unpaid assessments survive mortgage foreclosure
- HOA liens expire 5 years, condo liens expire 1 year
- **Heavy in South FL** — critical for title search

### Foreign Ownership / FinCEN
- FinCEN GTOs originally targeted Manhattan + Miami-Dade (2016)
- NEW March 1, 2026: Nationwide Residential Real Estate Rule replaces GTOs
- Title companies must identify beneficial owners behind LLCs
- Beneficial ownership data goes to FinCEN, NOT county records
- **Origin opportunity**: Cross-reference FL Secretary of State (sunbiz.org) with recorded entities

### Judicial Foreclosure
- All foreclosures go through court (creates extensive public records)
- Lis pendens → court case → judgment → certificate of title
- Typically 12-18 months (one of slowest states)
- All searchable through Clerk records

---

## Competitive Landscape in FL

### Propy (aggressive, $100M funded)
- Operating title agencies in Tampa, Clearwater, St. Pete, Seminole
- March 2026: Acquired Boss Law's title division (3rd acquisition)
- Boss Law clients include 3 of country's largest REITs ($10B+ AUM)
- AI escrow officer "Avery" automates data, contracts, communications
- Claims 2x transaction volume with same staff

### National Data Providers
- **ATTOM Data**: 158M+ properties from 3,000+ counties including all FL
- **DataTree (First American)**: 7 billion searchable images, all US properties
- **Regrid**: 160M parcels, FL data has 114 attributes per parcel

---

## Recommended Build Sequence for FL

### Phase 1: Bulk Data (Week 1)
1. Request FL DOR NAL + SDF files for Palm Beach + Miami-Dade (~$0)
2. Download PBC GIS Open Data parcels (free, immediate)
3. Query MDC GIS ArcGIS REST for all parcels (free, immediate)
4. **Result: 1.6M parcels with values, owners, building details, sales history**

### Phase 2: Official Records (Weeks 2-4)
1. Register for Miami-Dade Clerk API ($0.20/call)
2. Set up FTP bulk access ($110/month)
3. Build Playwright puppeteer for Palm Beach Landmark Web
4. **Result: Deed chains, mortgages, liens for target properties**

### Phase 3: Integration (Weeks 5-8)
1. Cross-reference Clerk records with Property Appraiser data
2. Build homestead verification layer
3. Add HOA/condo lien detection
4. Import into Origin MCP server
5. **Result: Full FL property search + fraud detection**

### Cost Estimate
| Item | Cost |
|------|------|
| FL DOR data request | ~$0 (public records) |
| MDC Clerk API (10K queries) | $2,000 |
| MDC FTP bulk (3 months) | $330 |
| PBC GIS data | $0 (free) |
| MDC GIS data | $0 (free) |
| Compute / private LLM | $5,000 |
| **Total FL build** | **~$7,330** |

Compare to MA: ~$26,000 estimated (mostly because no API exists)

---

## Why FL First Might Be Better Than MA First

1. **API exists** — Miami-Dade has official programmatic access. No puppeteering needed.
2. **Statewide standard** — FL DOR gives us one format for all 67 counties vs MA's 21 different registries.
3. **Bigger market** — FL has more real estate transactions than any state except CA and TX.
4. **Patrick Waley is there** — we have an industry contact in FL title (from Stepho's intro).
5. **Propy is there** — the competitor we're positioning against is operating in FL. Title companies there NEED an alternative.
6. **Foreign ownership** — FinCEN's new rule creates demand for beneficial ownership verification. Miami's LLC ownership problem is exactly what Origin's cross-reference model solves.
7. **Documentary stamp tax** — sale prices are calculable from recording data, giving us richer data without needing MLS access.

**MA is the proof of concept. FL is the product launch.**
