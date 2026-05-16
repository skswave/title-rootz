# Mapping: Farming Best Practices → Rootz Data Capabilities

## What We Have vs. What Agents Need

### FORCED SELLER SIGNALS

| Signal | Status | Our Data Source | Gap |
|--------|--------|----------------|-----|
| Pre-foreclosure / NOD | **MISSING** | None | Need: County Clerk lis pendens filings |
| Tax delinquency | **PARTIAL** | Can infer from nominal transfers ($0-100) | Need: County tax collector delinquent lists |
| Probate filing | **MISSING** | None | Need: County probate court records |
| Divorce filing | **MISSING** | None | Need: County family court records |
| Code violations | **PARTIAL** | Orlando (77K records pulled) | Need: Expand to more FL cities |
| Bankruptcy filing | **MISSING** | None | Need: Federal PACER data (expensive) |

### VOLUNTARY SELLER SIGNALS

| Signal | Status | Our Data Source | Notes |
|--------|--------|----------------|-------|
| Absentee owner | **HAVE** | OWN_ADDR1 ≠ PHY_ADDR1 | Working in fl-query.mjs |
| Out-of-state owner | **HAVE** | OWN_STATE ≠ "FLORIDA" | Fixed May 14 (was comparing to "FL") |
| Corporate/LLC owner | **HAVE** | OWN_NAME keyword matching | + LLC unmasking via Sunbiz cross-ref |
| Trust/estate owner | **HAVE** | FIDU_CD + name matching | Detects trusts, estates, trustees |
| Long-term owner (15yr+) | **PARTIAL** | SALE_YR1 field | Sparse in DOR data (many records = 0) |
| High equity | **PARTIAL** | JV vs SALE_PRC1 | Works when sale price available |
| Nominal transfer | **HAVE** | SALE_PRC1 ≤ $100 | Indicates estate/gift transfer |
| No homestead | **HAVE** | AV_HMSTD = 0 | Not primary residence |
| Vacant lot | **HAVE** | TOT_LVG_AR = 0 | No building / living area |
| Homestead removed | **HAVE** | PREV_HMSTD > 0 | Strong signal: owner moved away |
| Expired listing | **MISSING** | None | Need: MLS data access |
| FSBO | **MISSING** | None | Need: MLS/Zillow/Redfin feeds |
| Building permits | **PARTIAL** | 842K in 4 counties | Need: Expand statewide |
| Short-term rental | **PARTIAL** | Orlando (513 with phone/email!) | Need: Expand to more cities |

### DEMOGRAPHIC/CONTEXT SIGNALS

| Signal | Status | Our Data Source |
|--------|--------|----------------|
| Flood zone | **HAVE** | FEMA nationwide |
| School quality | **HAVE** | Statewide FL public + private |
| Median income | **HAVE** | IRS SOI by ZIP |
| Home values | **HAVE** | ACS 2022 census block groups |
| Vacancy rate | **HAVE** | Census demographics |
| Market trends | **HAVE** | FRED economics (median price, DOM, inventory) |
| Environmental risk | **HAVE** | EPA TRI statewide |
| EV charging | **HAVE** | DOE AFDC statewide |

### SKIP TRACE / CONTACT

| Capability | Status | Our Data |
|-----------|--------|----------|
| Owner name | **HAVE** | OWN_NAME |
| Mailing address | **HAVE** | OWN_ADDR1, OWN_CITY, OWN_STATE, OWN_ZIPCD |
| Physical address | **HAVE** | PHY_ADDR1, PHY_CITY, PHY_ZIPCD |
| LLC officers | **HAVE** | Cross-ref to private.rootz.global (Sunbiz) |
| TruePeopleSearch link | **HAVE** | Auto-generated in investor signals |
| Phone number | **MISSING** | Need: Skip trace API partner |
| Email address | **MISSING** | Need: Skip trace API partner |
| STR license holder phone/email | **HAVE** | Orlando STR data (513 records) |

## Signal Stacking — Our Key Differentiator

The research shows **stacking 2-3 signals converts at 5-8%** vs 1-3% for single signal. Our farming-analysis.mjs already computes multi-signal scores:

**Coral Springs demo**: 41,759 parcels → 9,388 with 3+ signals → 1,074 with 4+ signals → 95 with 5+ signals

The top prospect (CENTURY55 LLC, Houston TX) has 5 stacked signals: absentee + out-of-state + corporate + high equity + no homestead. That's exactly the "tired out-of-state investor" profile that converts at 5-8%.

**No competitor does this with government-sourced, provenance-tracked data.**

## Priority Data Gaps to Fill

### Tier 1 — Highest ROI (forced seller signals)
1. **Lis pendens (pre-foreclosure)** — County Clerk filings. Each FL county clerk has an online portal. Some have bulk download. This is the #1 missing signal.
2. **Tax delinquency** — County Tax Collector delinquent lists. Many publish annually as PDF/CSV. Hillsborough has a live web portal.
3. **Expired listings + FSBO** — MLS data. Requires MLS board membership or a data partner. 44% list rate makes this extremely high-value.

### Tier 2 — Strong ROI
4. **Probate filings** — County Probate Court records. Usually available through Clerk of Court search.
5. **Code violations** — Municipal code enforcement. Orlando pulled (77K). Need to expand to Miami, Tampa, Jacksonville, Fort Lauderdale.
6. **Divorce filings** — County Family Court records. Available through Clerk of Court.

### Tier 3 — Nice to have
7. **Skip trace API** — Partner with Tracerfy ($0.02/record) or BatchSkipTracing ($0.20/record)
8. **Building permits** — Expand from 4 counties statewide
9. **STR licenses** — Expand Orlando pattern to more cities
10. **FTSA/DNC compliance** — Auto-scrub against FL + National DNC registries

## Competitive Positioning

### What competitors charge vs. what we can offer:

| Feature | PropStream ($99/mo) | PropertyRadar ($119-599/mo) | Rootz ($29-49/mo) |
|---------|--------------------|-----------------------------|-------------------|
| Parcel data | 160M national | National | 10.8M FL (deeper fields) |
| Signal stacking | Basic filters | 250+ filters | AI-scored with provenance |
| LLC unmasking | No | No | **Yes (Sunbiz cross-ref)** |
| Data source proof | No | No | **SSL certificate provenance** |
| Skip trace | $0.12/record | Not included | Future: $0.02-0.20/record |
| AI assistant | None | None | **Built-in Claude farming AI** |
| FTSA compliance | DNC scrub | Not included | Future: auto-scrub |
| Flood/schools/demographics | Separate tools | Some | **Included in every search** |
| Expired/FSBO | No | No | Future: MLS integration |

### Our unfair advantages:
1. **Government-sourced data with cryptographic provenance** — not scraped, not estimated
2. **AI-native** — Claude understands the data and explains WHY each property is a prospect
3. **LLC unmasking** — cross-reference to FL Sunbiz for actual officers (nobody else does this)
4. **Signal stacking with scoring** — computed multi-signal scores, not just filters
5. **90%+ margin** — $1-3/agent API cost vs $29-49 subscription price
6. **No per-seat AI subscription** — agents use our web UI, not ChatGPT

## Steph's Competitive Talking Points

For the A/B test against Connected Investors ($29/mo):
1. "Our data comes from the Florida Department of Revenue, not scraped websites"
2. "We can tell you WHO is behind that LLC — officers, filing date, succession risk"
3. "Every record has a cryptographic hash proving when and where the data came from"
4. "The AI doesn't just give you a list — it explains why each property is a farming prospect"
5. "We cover every one of Florida's 67 counties — 10.8 million parcels"
6. "Flood zone, school district, demographics, and market trends — included in every search, not separate subscriptions"
