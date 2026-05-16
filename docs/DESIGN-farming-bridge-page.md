# Design: Farming Bridge Pages — Sovereign Property Intelligence

## The Insight

A farming bridge page isn't just a search result — it's a **living, cross-AI memory object** for a specific property or farming territory. When an agent does a farming search, the bridge page URL becomes:

1. **The search result** — human-readable property intelligence
2. **AI memory** — any AI (Claude, ChatGPT, Grok) can read the URL and pick up where the last session left off
3. **Time machine** — historical snapshots show how signals evolved
4. **Compliance surface** — provenance chain proves where every data point came from
5. **Subscription hook** — premium signals behind auth, basic signals free

This is the same pattern from the Sovereign Bridge Page insight — the URL IS the coordination fabric.

## URL Structure

### Property Bridge Page
```
title.rootz.global/p/{parcelId}
title.rootz.global/p/494126DD0410          → specific parcel (Broward folio format)
title.rootz.global/p/{hash}                → SHA-256 hash of address for privacy
```

### Farm Territory Bridge Page
```
title.rootz.global/farm/{city}
title.rootz.global/farm/CORAL_SPRINGS       → city farming overview
title.rootz.global/farm/CORAL_SPRINGS/hot   → hot prospects only (3+ signals)
title.rootz.global/farm/zip/33076           → ZIP code farming view
```

### Search Result Bridge Page
```
title.rootz.global/s/{searchHash}
title.rootz.global/s/a3f7b2c1               → saved search result (persists, shareable)
```

## What a Property Bridge Page Shows

```
┌─────────────────────────────────────────────────────────────────┐
│  title.rootz.global/p/494126DD0410                              │
│  Rootz Property Intelligence — Broward County, FL               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📍 1725 SW 14 ST, Fort Lauderdale, FL 33312                   │
│  Owner: DEJULIO, SALVATORE                                     │
│  Assessed Value: $424,820 (land $180K + building $245K)        │
│  Last Sale: 2019 @ $320,000 (+$105K equity, 33%)              │
│                                                                 │
│  ═══ FARMING SIGNALS ═══                                        │
│                                                                 │
│  🔴 LIS PENDENS — Pre-Foreclosure                              │
│     Filed: 01/02/2025 | Case: CACE-25-000009                  │
│     Filer: AMERISAVE MORTGAGE CORP                             │
│     Instrument: #119979160                                      │
│     Source: Broward County Clerk SFTP                           │
│     Hash: a3f7b2c1e8d94f21                                     │
│                                                                 │
│  🟡 NON-OWNER OCCUPIED                                         │
│     Mailing: 456 Oak St, Tampa FL 33601                        │
│     Source: FL DOR Statewide Parcel Data (May 2026)            │
│                                                                 │
│  🟡 HIGH EQUITY (33%)                                           │
│     Purchase: $320,000 (2019)                                  │
│     Current assessed: $424,820                                  │
│     Estimated equity: $104,820                                 │
│                                                                 │
│  ═══ PROPERTY DETAILS ═══                                       │
│                                                                 │
│  Type: Single Family | Built: 2005 | 1,850 sqft | 3 bed 2 ba │
│  Lot: 6,500 sqft | Homestead: No | DOR Use: 001 (SFR)        │
│                                                                 │
│  ═══ OVERLAYS ═══                                               │
│                                                                 │
│  🌊 Flood Zone: AE (high risk, base elevation 7ft)             │
│  🏫 Schools: Dillard Elementary (0.4mi), Stranahan HS (1.2mi) │
│  📊 Census: Median income $52,340 | Home value $385,000       │
│  🏗️ Permits: 3 permits (2020-2023) — AC replacement, roof     │
│  📈 Market: Median days on market 45 | Inventory: 3.2 months  │
│                                                                 │
│  ═══ OWNER INTELLIGENCE ═══                                     │
│                                                                 │
│  LLC Check: Not a corporate entity                             │
│  Sunbiz Cross-Ref: N/A (individual owner)                      │
│  TruePeopleSearch: [lookup link]                               │
│                                                                 │
│  ═══ PROVENANCE ═══                                             │
│                                                                 │
│  Data assembled: 2026-05-14T20:15:00Z                          │
│  Document hash: SHA-256 e8d94f21a3f7b2c1...                    │
│  Sources:                                                       │
│    ✓ FL DOR (floridarevenue.com) — TLS 1.3, cert SHA256:abc... │
│    ✓ Broward Clerk (BCFTP.Broward.org) — SFTP, inst #119979160│
│    ✓ FEMA (hazards.fema.gov) — TLS 1.3, cert SHA256:def...    │
│    ✓ Census (api.census.gov) — TLS 1.3, cert SHA256:ghi...    │
│                                                                 │
│  ═══ FARMING VERDICT ═══                                        │
│                                                                 │
│  🔴 LISTING PROBABILITY: HIGH (82/100)                         │
│                                                                 │
│  This property has 3 farming signals including an active lis   │
│  pendens. The owner is being foreclosed on by Amerisave        │
│  Mortgage Corp (case CACE-25-000009). Property is non-owner    │
│  occupied with $105K equity. The owner likely needs to sell    │
│  quickly to protect their equity before auction.               │
│                                                                 │
│  Suggested approach: Contact owner at mailing address (Tampa). │
│  Offer to help sell before foreclosure — they have equity to   │
│  protect. Time-sensitive — foreclosure case filed Jan 2, 2025. │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Skip Trace] [Export PDF] [Add to Farm List] [Share]           │
│                                                                 │
│  Powered by Rootz — Government data with cryptographic proof   │
│  Last updated: 2026-05-14 | Next update: 2026-05-15            │
└─────────────────────────────────────────────────────────────────┘
```

## What Makes This Different from CI's Property Card

| Feature | CI Property Card | Rootz Bridge Page |
|---------|-----------------|-------------------|
| Data | Static snapshot | **Living URL** — updates daily with new filings |
| AI memory | None | **Any AI reads the URL** — Claude, GPT, Grok all get context |
| Provenance | "Est Value" (no source) | **SHA-256 hash + SSL cert chain per source** |
| History | Current signals only | **Timeline** — when signals appeared/resolved |
| Narrative | Signal tags only | **AI-generated farming verdict** with talking points |
| Shareability | Export CSV | **URL is the share** — text it, email it, bookmark it |
| Overlays | Separate lookups | **13 federal layers baked in** (flood, schools, census, etc.) |
| Permits | None | **Building permit history** (1.1M Orlando, 842K others) |
| LLC unmasking | "Person" or "Corp" | **Actual officers from FL Sunbiz** |
| Cost | Credits per view | **URL is free** — premium features behind subscription |

## AI Memory Pattern

When an agent asks their AI about a property:

**First session:**
```
Agent: "Tell me about 1725 SW 14 St, Fort Lauderdale"
AI: Fetches title.rootz.global/p/494126DD0410
AI: "This property has an active lis pendens filed Jan 2, 2025..."
```

**Second session (weeks later, different AI even):**
```
Agent: "What's happening with that Fort Lauderdale foreclosure?"
AI: Fetches the SAME URL — gets UPDATED data
AI: "The lis pendens is still active. No satisfaction filed yet. 
     It's been 4.5 months — the auction timeline is approaching.
     Owner equity has increased to $112K based on latest assessment."
```

**The URL remembers. The AI doesn't have to.** This is cross-model memory without any protocol — just a URL that always returns current state.

## Farm Territory Bridge Page

```
title.rootz.global/farm/CORAL_SPRINGS

═══ CORAL SPRINGS FARMING OVERVIEW ═══

Total parcels: 41,759
Farming score distribution:
  🔴 High (70+):    1,074 properties (2.6%)
  🟡 Medium (40-69): 9,388 properties (22.5%)
  🟢 Low (<40):     31,297 properties (75.0%)

Signal breakdown:
  Absentee owners:    19,265 (46.1%)
  Non-homestead:      16,447 (39.4%)
  Corporate/LLC:       5,320 (12.7%)
  Out-of-state:        2,261 (5.4%)
  Vacant:              2,426 (5.8%)
  Nominal transfer:    1,583 (3.8%)

Recent clerk filings (last 30 days):
  Lis pendens:    12 new
  Probate:        34 new
  Liens:          28 new
  Satisfactions:  89 (mortgages paid off)

Top 10 hot prospects: [list with bridge page links]

Market context:
  Median price: $485,000 (↑3.2% YoY)
  Days on market: 38 (↓12% from last month)
  Active listings: 412
  Months of inventory: 2.8

Flood risk: 18% of parcels in AE/VE zones
Top schools: Coral Springs Charter, Coral Park Elementary
```

## Technical Implementation

### Property Bridge Page Endpoint
```
GET /p/{parcelId}
Accept: text/html  → renders human-readable page
Accept: application/json → returns structured JSON (for AI)
```

The same URL serves both humans and AI — content negotiation. When ChatGPT or Claude fetches it, they get JSON. When a browser opens it, they get a formatted page.

### Data Assembly (per request)
1. Look up parcel in DOR city-indexed JSONL (grep, <50ms)
2. Look up owner name in Broward clerk name-signal index (<10ms)
3. Geocode address → get lat/lng (cached)
4. Look up FEMA flood zone (cached)
5. Look up census demographics (cached)
6. Look up nearest schools (cached)
7. Look up building permits (grep, <50ms)
8. Compute farming score (in-memory)
9. Generate farming verdict (optional: Claude API call, or template-based)
10. Assemble provenance chain
11. Hash the assembled document
12. Return HTML or JSON

### Farming Score Algorithm
```
score = 0 (out of 100)

// Distressed signals (courthouse records) — highest weight
+25  lis_pendens (active, filed within 12 months)
+20  probate (filed within 12 months)
+15  lien (active, no satisfaction)
+10  final_judgment (foreclosure judgment)

// Voluntary signals (DOR parcel data)
+12  absentee + out_of_state (combined)
+10  absentee (in-state)
+8   corporate/LLC owner
+8   trust/estate owner
+8   long_term (15+ years)
+6   high_equity (50%+)
+5   no_homestead
+5   nominal_transfer
+4   senior_exemption
+3   homestead_removed (PREV_HMSTD > 0)
+2   vacant_lot

// Context signals (federal overlays)
+3   high flood risk (AE/VE zone)
+2   recent building permits (renovation = possible prep for sale)
-5   recent purchase (< 3 years ago, less likely to sell)

// Cap at 100
```

### Bridge Page Persistence
- Bridge page URLs are stable (parcelId doesn't change)
- Data refreshes on each request (live assembly)
- Historical snapshots stored weekly for timeline view
- SHA-256 hash changes when any data point changes → proves what changed and when

## Revenue Model

| Tier | What They See | Price |
|------|-------------|-------|
| **Free** | Property basics, 3 signals, flood zone, farming score | $0 |
| **Pro** | All signals, clerk records, full overlays, farming verdict, skip trace button | $29-49/mo |
| **Team** | Export, saved farms, alerts on new LP/probate filings, bulk search | $199/mo |
| **Training** | Unlimited seats, Steph's 1,100 agents | $2,500/mo |

The free tier drives traffic. The AI reads the free tier. The agent upgrades when they want the full picture + skip trace + alerts.

## Alerts — The Retention Feature

"Alert me when a new lis pendens is filed in my farm area."

Daily cron pulls Broward clerk data → matches new LP/probate to farm areas → sends email/text to subscribed agents. This is the feature that keeps agents paying monthly — they're not buying data, they're buying **early notification** of farming opportunities.

## Implementation Priority

1. [ ] Build `/p/{parcelId}` endpoint — JSON + HTML dual-serve
2. [ ] Build `/farm/{city}` endpoint — territory overview with top prospects
3. [ ] Compute farming score on every property search
4. [ ] Generate farming verdict (template-based first, Claude API later)
5. [ ] Add provenance chain to every response
6. [ ] Weekly snapshot storage for timeline view
7. [ ] Alert cron for new LP/probate in saved farms
