# Land Records Project — Summary for Tracie
## April 19, 2026

### What We Did Today

In one session, we extracted structured property records from the Massachusetts Registry of Deeds for 8 properties across 3 registries, identified 15+ data sources that contribute to a complete property record, and proved that an AI-readable land records dataset is both feasible and desperately needed.

---

## Properties Captured

| # | Property | Town | Registry | Records | Type | Key Finding |
|---|----------|------|----------|---------|------|-------------|
| 1 | **111 Swamp Rd** | Richmond | Middle Berkshire | 14 | Residential | Steven's house. Foster→Sprague (2000), $274K. Full chain extracted. |
| 2 | **147 Reservoir Rd** | Lenox | Middle Berkshire | 19 | Residential | Moynihan→Palmer ($937,500, 2012). Charter Communications easement. |
| 3 | **299 Under Mountain Rd** | Lenox | Middle Berkshire | 271 (street) | Residential | Address changed from 249. Street name indexed as both "UNDER MOUNTAIN" and "UNDERMOUNTAIN". |
| 4 | **291 North Plain Rd** | Great Barrington | South Berkshire | 21 | Residential | **TROUBLED TITLE**: 3 tax takings, 3 redemptions, 3 execution judgments, estate issues. |
| 5 | **Marshall Ave** | Pittsfield | Middle Berkshire | 166 | Residential | Multiple properties. 20 Marshall Ave: Sprague Alexis sold $360K (Dec 2025). |
| 6 | **Shetland Dr** | Pittsfield | Middle Berkshire | 197 | Residential | Multiple properties. Mixed DR and AVE indexing. |
| 7 | **89-111 North St** | Pittsfield | Middle Berkshire | 10 | **Commercial** | England Brothers dept store (1857-1988). Demolished 1998. Parcel now city-owned. |
| 8 | **99 Bedford St** | Boston | Suffolk | 56 | **Commercial** | Office building. **SVB collapse** in title chain! FDIC→First-Citizens→Foreclosure at $19M (was $51M). |

**Total records extracted: 500+**

---

## 291 North Plain Rd — Title Insurance Case Study

This property tells Tracie's story of why title insurance matters:

```
1996: Siok → Cook David J & Marie Ann ($167,000 deed)
2001: Cook takes $80,000 mortgage (Greylock Federal)
2006: David Cook dies (estate records begin)
2009: Execution — Birches-Roy Funeral Home ($8,674)
2009: Execution — DJ Oil Express ($2,174 + $2,039)
2009: TAX TAKING by Great Barrington (unpaid taxes)
2009: Cook Marie Ann files Homestead
2010: Mortgage discharged, Tax REDEMPTION
2011: Execution — Johns Garage ($633)
2012: SECOND TAX TAKING
2015: SECOND REDEMPTION
2017: THIRD TAX TAKING (David Cook EST)
2019: Marie Ann transfers to self + Thomas Clark ($0, family)
2019: THIRD REDEMPTION
```

A title examiner would need to verify ALL 21 documents link properly, all liens are cleared, all executions satisfied, and the current owner has clean title. **Today this takes hours of manual clicking. With Origin data, an AI does it in seconds.**

---

## 99 Bedford St Boston — Commercial Foreclosure

This shows the power of registry data for commercial properties:

```
2019: Credit Suisse entity buys for ~$51M
2019: Boston Private Bank mortgage
2023: Mechanic's lien (contractor dispute)
2023: Lien released
2023: Refinanced with First-Citizens Bank ($31M)
2024: FDIC assigns original mortgage to First-Citizens
     (SVB collapsed March 2023 — Boston Private was SVB subsidiary)
2025: Chevron Partners acquires mortgage
2025: FORECLOSURE DEED — $19M (63% below purchase price)
```

The **SVB banking collapse** shows up directly in the title chain. An AI could flag this pattern across thousands of properties.

---

## Why This Matters for Title Insurance

### The Problem
- **15 independent data sources** needed for a complete MA property record
- Zero of them have APIs
- Registry of Deeds (the most important) is trapped behind 1990s ASP.NET interface
- No digital signatures or hashes on any documents
- Street name indexing is inconsistent (same property found under different names)
- Address changes not linked (249→299 Under Mountain)
- Each search requires a fresh browser session (ViewState persistence)

### The Opportunity
| What Exists Today | What Origin Would Add |
|---|---|
| Manual browser search | AI-queryable structured data |
| Hours per title search | Seconds per query |
| No cross-referencing | Automatic chain-of-title construction |
| No integrity verification | SHA-256 hash per document, Merkle tree per property |
| 21 separate registries | One unified dataset |
| Assessor data in separate system | Integrated property profile |
| No lien detection | Automated lien/encumbrance flagging |

### The Data We Captured Per Record
```
- Document number, filing date, recording time
- Document type (DEED, MORTGAGE, DISCHARGE, TAKING, EXECUTION, etc.)
- Book/Page reference
- Consideration amount (sale price / mortgage amount)
- Verification status
- All parties (Grantor/Grantee with names)
- Cross-references to related documents
- Property address
```

### What the Assessor Adds (identified, not yet captured)
```
- Assessed value (total, land, building)
- Lot size / acreage
- Building details (year built, sqft, bedrooms, baths)
- Tax amount
- Parcel ID
- Zoning
- Sale history
```

### Sources Identified
- **MassGIS**: Statewide parcel data, freely downloadable (updated Jan 2026)
- **Town assessors**: AxisGIS (Richmond, Lenox), Vision (Pittsfield, Great Barrington)
- **Boston**: Open data portal with CSV downloads and APIs
- **Warren Group**: Commercial aggregator — what title companies currently pay for
- **MassDEP**: Environmental restrictions (AULs) that don't appear in deeds
- **FEMA**: Flood zones
- **Land Court**: Registered land (~15% of Suffolk County)
- **Secretary of State**: LLC beneficial owners (registry only shows entity name)

---

## Files Created

```
land-records/
├── AI_CONTEXT.md                              — Project overview and architecture
├── SUMMARY-FOR-TRACIE.md                      — This document
├── docs/
│   ├── FINDINGS.md                            — Detailed research findings
│   └── DATA-SOURCES.md                        — 15 data sources inventory
├── data/properties/
│   ├── 111-swamp-rd-richmond.json             — 14 records, full detail
│   ├── 147-reservoir-rd-lenox.json            — 19 records, 4 detail
│   ├── 291-north-plain-rd-great-barrington.json — 20 records, full detail
│   ├── 299-under-mountain-rd-lenox.json       — 271 on street, 10 detail
│   ├── marshall-ave-pittsfield.json           — 166 records, 10 detail
│   ├── 89-north-st-pittsfield-england-bros.json — 10 records (commercial)
│   └── 99-bedford-st-boston.json              — 56 records, 15 detail (commercial)
└── crawler/
    └── scrape-property.js                     — Playwright scraper (reusable)
```

---

## Next Steps

1. **Download MassGIS parcel data** — bulk assessor attributes for all Berkshire properties
2. **Build automated scraper** — proven pattern works, needs reliability improvements
3. **OCR sample documents** — the scanned images are typewritten and clear
4. **Design the Origin JSON schema** — unified property record combining all sources
5. **Build MCP server** — AI-queryable tools for property search, chain-of-title, lien check
6. **Add integrity layer** — hash every document image, Merkle tree per property
7. **Expand** — start with all of Middle Berkshire (1,056,169 documents), then statewide

### The Pitch
*"Every title search in Massachusetts requires a human to manually click through a 1990s website, one property at a time, across 21 separate registries. We're building the dataset that makes those records AI-readable — and adding the cryptographic integrity layer that the registries never had."*
