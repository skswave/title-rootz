# FL Building Permit Expansion — Status Report (May 14 2026)

## What We Have (Working)

| County/City | Platform | Records | File | Status |
|-------------|----------|---------|------|--------|
| Miami-Dade County | ArcGIS FeatureServer | 262,019 | building-permits.json (511MB) | Active recipe |
| City of Miami | ArcGIS FeatureServer | 219,931 | miami-city-permits.json (279MB) | Active recipe |
| Fort Lauderdale (Broward) | ArcGIS MapServer | 204,760 | broward-fort-lauderdale-permits.json (210MB) | Pulled May 1 |
| Palm Bay (Brevard) | ArcGIS FeatureServer | 155,693 | brevard-palm-bay-permits.json (78MB) | Pulled May 14 |
| **Total permits** | | **842,403** | | |

## New Data Pulled Today (May 14)

| City | Platform | Records | File | Farming Value |
|------|----------|---------|------|--------------|
| Orlando | Socrata SODA | 22,007 | orlando-planning-applications.json (15MB) | Development/zoning activity |
| Orlando | Socrata SODA | 513 | orlando-str-licenses.json (367KB) | Investor properties w/ phone+email! |

**Orlando STR licenses are gold** — includes license holder name, phone, email, property owner name + address. These are confirmed investor properties.

## Blocked Counties (No Open API)

| County | System | URL | Notes |
|--------|--------|-----|-------|
| Orange (Orlando) | OC FastTrack | fasttrack.ocfl.net | Custom web portal, no API |
| Hillsborough (Tampa) | Accela | aca-prod.accela.com/HCFL/ | Web portal only |
| Palm Beach | Custom | pbcgov.org/PermitPortal | Login required |
| Duval (Jacksonville) | JaxEPICS | jaxepics.coj.net | Custom COJ system |
| Pinellas (St Pete) | Accela/ArcGIS | egis.pinellascounty.org | Server unreachable |
| Lee (Fort Myers) | Accela | aca-prod.accela.com/LEECO/ | Web portal only |
| Sarasota | Accela | building.scgov.net | Web portal only |
| Marion (Ocala) | Tyler Civic Access | marionfl.org/CivicAccess | New Tyler system |
| Volusia (Daytona) | Connect Live | connectlivepermits.org | Custom system |

## What We Probed (No Results)

All of these returned empty for permit-related services:
- Orange County ArcGIS (maps.ocfl.net)
- Hillsborough County ArcGIS
- Duval/Jacksonville ArcGIS (maps.coj.net)
- Palm Beach County ArcGIS
- Polk County ArcGIS
- St. Johns County ArcGIS
- Seminole County ArcGIS
- Pasco County ArcGIS
- Manatee County ArcGIS
- Osceola County ArcGIS
- Collier County ArcGIS
- Sarasota County ArcGIS
- Lee County ArcGIS
- Tampa Socrata
- Jacksonville Socrata
- Fort Lauderdale Socrata
- St. Petersburg Socrata
- FL State data portal (data.florida.gov)

## Reality Check

**Building permits are a nice-to-have, not a must-have for farming.** The core farming signals (absentee, long-term, trust, corporate, equity, exemptions) come from the 10.8M parcel records we already have statewide. Permits add "renovation activity" as one more signal.

For the immediate farming beta with 1,100 agents, we have:
- Complete parcel data statewide (10.8M records, all 67 FL counties)
- 12 investor/farming signals computed per property
- 842K permits in 4 counties (the most populated — Miami-Dade metro + Brevard)
- Schools, hospitals, demographics, flood zones statewide
- LLC unmasking via Sunbiz cross-reference

## Expansion Strategy

### Phase 1: Low-hanging fruit (no scraping needed)
- [x] Pull Orlando planning applications (22K) — DONE
- [x] Pull Orlando STR licenses (513 with phone/email) — DONE  
- [x] Pull Palm Bay/Brevard permits (156K) — DONE
- [ ] Search for more Socrata city portals with STR/permit data
- [ ] Check if FL DBPR publishes contractor license data (statewide)

### Phase 2: Scraping needed
- [ ] Accela portals (Hillsborough, Lee, Sarasota, Pinellas) — Puppeteer/Playwright needed
- [ ] Orange County FastTrack — custom scraper
- [ ] Jacksonville JaxEPICS — custom scraper

### Phase 3: Alternative farming signals (no permits needed)
These public data sources provide STRONGER farming signals than building permits:
- [ ] **FL Clerk of Court** — lis pendens (pre-foreclosure), probate filings, divorce filings
- [ ] **FL Tax Collector** — tax delinquency (property taxes owed)
- [ ] **FL code violations** — by municipality (properties owner can't afford to maintain)
- [ ] **Eviction filings** — landlords with problem tenants may sell
- [ ] **FL DOR homestead changes** — people removing homestead = moving/selling

**Lis pendens + tax delinquency are the two highest-value farming signals we're missing.** Both are public records, filed with the county clerk, and many clerks publish them online.
