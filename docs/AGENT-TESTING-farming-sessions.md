# Agent Farming Sessions — Live API Testing (May 15 2026)

Two simulated agents tested the Rootz farming API against live data, role-playing as members of Steph's 1,100-agent training program.

## Results Summary

| Metric | Maria (Probate) | Carlos (Investor) |
|--------|----------------|-------------------|
| Rating | **8/10** | **8/10** |
| Cities searched | Fort Lauderdale, Hollywood | Coral Springs, Fort Lauderdale, Pembroke Pines |
| Prospects found | 248 + 219 = 467 | 16,298 + 10,977 + 24,039 = 51,314 |
| Top prospect value | $3.4M (Windjammer Way waterfront) | $101M (444 NE 7 ST commercial) |
| Highest score found | 87 | **97** (7 signals on one property) |
| Multi-property owners | Gonzalez (4 props), Dolgonos (2) | AIM Partners (3), Innova (3), Garcia (2) |
| Would pay for tool | Yes | Yes |
| Key quote | "Best farming tool I've tested for probate" | "It tells me which doors to knock on and why" |

## What Both Agents Loved

1. **Signal stacking** — combining courthouse + DOR signals into one score
2. **Multi-property detection** — spotting portfolios (Gonzalez 4 listings, AIM Partners 3)
3. **Court record depth** — case numbers, party names, filing dates, satisfaction tracking
4. **Volume** — 24K absentee owners in Pembroke Pines alone
5. **Data provenance** — "when a seller's attorney asks where I got this, I have an answer"
6. **Bridge page URLs** — shareable intelligence for each property

## Gaps Both Agents Identified

| Gap | Maria Said | Carlos Said | Fix |
|-----|-----------|-------------|-----|
| **Owner mailing address** | "#1 thing I need for outreach" | "Names + cities but no addresses" | Add OWN_ADDR1 to farm API response |
| **Phone/email** | "Skip trace needed" | "Need address-level for postcards" | Tracerfy integration ($0.02/record) |
| **Mortgage balance** | "Changes my approach completely" | "Can't estimate equity without it" | County recorder mortgage data |
| **Sale history** | "salesHistory array is empty" | "Can't see what owner paid" | Pass _sale1/_sale2 from DOR |
| **Bed/bath** | "Showing 0 for 5,420 sqft home" | Same | DOR doesn't have it; need county CAMA |
| **Comps** | Not mentioned | "Need recent comps within half mile" | Same-area DOR sales data |
| **Rental income** | Not relevant to her | "#1 gap for investor farming" | No free source; would need rental API |
| **Property type labels** | Tested before fix deployed | "001/004 with no description" | FIXED in latest deploy |

## Bugs Found

1. **Road work data** showing Miami-Dade projects for Broward properties (wrong geography)
2. **Owner name mismatch** between farm API and search API (915 Riverside: "LTE Corp" vs "Hurtado, Amanda" — likely a recent transfer)
3. **Farm score drops** on deep search (915 Riverside: 75 on farm → 60 on search — different scoring paths)

## Priority Fixes (from agent feedback)

### Fix Now (easy, high impact)
1. Add `ownerMailingAddress` to farming API response (data exists in OWN_ADDR1/CITY/STATE/ZIP)
2. Pass sale history (_sale1, _sale2) through to API response
3. Fix road work geographic filtering (only show local projects)
4. Reconcile farm score with search score (same algorithm)

### Fix Soon (medium effort)
5. Add skip trace button/link (Tracerfy API integration)
6. Add neighborhood comps (recent sales from same DOR data within 0.5mi)
7. Fix owner name timestamp (show "as of DOR update date")

### Fix Later (requires new data)
8. Mortgage balance (county recorder mortgage filings — we have this in Broward clerk data!)
9. Rental income / cap rate (no free source)
10. Bed/bath/sqft from county CAMA (per-county property appraiser API)
