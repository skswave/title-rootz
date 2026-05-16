# Side-by-Side: Coral Springs FL — Connected Investors vs Rootz

## Summary

| Metric | Connected Investors | Rootz |
|--------|-------------------|-------|
| **Total results** | 19,832 (Motivated + Off-Market) | 41,759 parcels, 1,919 farming prospects (score 30+) |
| **Cost** | $29-97/mo + skip trace credits | $0 (self-hosted) |
| **Data source** | First American DataTree (opaque) | FL DOR + Broward Clerk SFTP (provenance chain) |
| **Scoring** | BuyAbility 0-100 (proprietary black box) | Farming Score 0-100 (transparent, reasons listed) |
| **Court records** | Tags only ("Pre-Foreclosure") | Full filing: date, case number, parties, instrument # |
| **Flood zone** | Not shown | FEMA zone + base flood elevation + risk analysis |
| **Schools** | Not shown | Nearest public, private, charter with enrollment |
| **Demographics** | Not shown | Census ACS: income, home values, vacancy, population |
| **Building permits** | Not shown | 1.1M Orlando permits + 842K others |
| **LLC unmasking** | "Corp" or "Person" label | Actual FL Sunbiz officers, filing date, succession risk |
| **Market economics** | Not shown | FRED trends: median price, DOM, inventory, unemployment |
| **Bridge page URL** | None | Living URL per property, cross-AI memory |

## CI Top Result: 8153 Andover Blvd

**What CI shows:**
- Off Market (Motivated)
- Est Value: $4,823,046
- Last Sold: $3,241,045
- Equity: 100%
- BuyAbility: 85
- Signal tags: (visible on card)
- Photo: satellite/street view

**What CI DOESN'T show:**
- Why is it "Motivated"? What filing triggered this?
- When was the filing? Is it recent or years old?
- Court case number for lookup
- Who filed against the owner? Bank? HOA? IRS?
- Flood zone (AE? X? VE?)
- Nearest schools
- Neighborhood income/demographics
- Recent building permits
- If the owner is an LLC, who are the actual officers?

## Rootz Top Result: 915 Riverside Dr

**What Rootz shows:**
```
SCORE: 75/100 (HIGH)
915 RIVERSIDE DR, Coral Springs FL
Owner: LTE CORP
Value: $221,860 | 1,060 sqft | Built 1987
Mailing: HOUSTON, TEXAS

LIS PENDENS: 01/15/2025 | Case: CACE-25-000536
Court filings: 5

WHY:
- Lis pendens filed (pre-foreclosure) — 01/15/2025
- Lien recorded
- Final judgment (foreclosure) entered
- Out-of-state absentee owner (TEXAS)
- Corporate/LLC owner
- No homestead

Bridge page: https://title.rootz.global/p/504216070850
```

**What Rootz shows that CI can't:**
1. **Case number** (CACE-25-000536) — agent can look up the court docket
2. **Filing date** (01/15/2025) — agent knows how urgent the timeline is
3. **Filing party** — which bank/lender is foreclosing
4. **Mailing address** (Houston, TX) — agent knows where to send mail
5. **Why it's a prospect** — transparent reasoning, not a black box score
6. **LLC unmasking available** — can query Sunbiz for LTE CORP officers
7. **Bridge page URL** — any AI can read this URL and get full context
8. **Provenance** — SHA-256 hash proving data came from Broward Clerk SFTP

## What CI Has That We Don't (Yet)

| Feature | Status | Plan |
|---------|--------|------|
| Street view photos | Missing | Google Street View API ($7/1000) |
| Skip trace (phone/email) | Missing | Tracerfy API ($0.02/record) |
| Estimated market value | We show assessed value (JV) | Add Zillow/Redfin API or AVM model |
| MLS listing history | Missing | MLS data partner or ATTOM |
| BuyAbility-style badge | We have Farming Score but no UI badge | Build badge into bridge page |
| Comps | Missing | Same-area recent sales from DOR data |
| Cash buyer network | Not applicable | We serve listing agents, not investors |

## Data Only Rootz Has

| Data Layer | CI Has? | Rootz | Farming Value |
|-----------|---------|-------|---------------|
| Flood zone + elevation | No | FEMA + USGS | Flood risk = insurance cost = buyer hesitation |
| Schools | No | NCES statewide | School quality = family buyers = price premium |
| Census demographics | No | ACS block group | Income level = buyer pool for this neighborhood |
| Building permits | No | 2M records | Recent renovation = not selling; roof repair = prepping |
| IRS income by ZIP | No | SOI data | Owner wealth indicator |
| FEMA disaster history | No | Disaster declarations | Hurricane damage risk |
| EPA environmental | No | TRI facilities | Contamination near property |
| EV charging | No | DOE AFDC | Neighborhood modernization signal |
| Market economics | No | FRED trends | Is the market hot or cooling? |
| Court record timeline | Tags only | Full filing history | See how case evolved over time |
| Provenance chain | None | SHA-256 + SSL certs | Prove where every data point came from |

## The Pitch for Steph

"Connected Investors tells your agents a property is 'Motivated' — a tag with no explanation. Rootz tells them it has a lis pendens filed January 15, 2025, case number CACE-25-000536, by [specific lender], against [specific owner] at [specific Texas mailing address], on a property assessed at $221,860 that sits in FEMA flood zone X next to Coral Springs Charter School with median neighborhood income of $72,000.

Your agents don't need a black box score. They need the STORY — because the story is what they say at the door."
