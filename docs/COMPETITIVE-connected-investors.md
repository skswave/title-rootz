# Competitive Analysis: Connected Investors (CI)

**Date**: May 14, 2026
**URL**: connectedinvestors.platlabs.com
**Parent**: PlatLabs (powered by First American Financial Corporation)
**Auth**: login.firstam.com (Eagle ID) — First American Identity
**Version**: v2.0.0
**Model**: Credit-based ($9.40 visible in wallet). Skip trace costs credits per record.
**Steph's account**: safehandstitle / Vault Title

## CI's Data Supply Chain — The Key Insight

CI authenticates through **First American Financial** (login.firstam.com). First American is the 2nd largest title insurance company in the US ($6B+ revenue). This means CI likely gets their data from First American's data ecosystem:

- **DataTree** — First American's property data platform (deed recordings, mortgages, liens, foreclosures)
- **First American Data & Analytics** — Title plant records across all US counties
- **CoreLogic** — First American previously owned CoreLogic (spun off 2010), may still have data agreements

This is their unfair advantage: **they sit on top of the title insurance data pipeline**. Every mortgage, lien, foreclosure, deed transfer flows through title companies. First American sees it first.

## CI Filter Taxonomy (Complete)

### Property Status → Distressed
| Filter | Data Source (Likely) |
|--------|---------------------|
| Pre-Foreclosures | County Clerk lis pendens filings → DataTree/ATTOM |
| Auction | Foreclosure auction listings → Auction.com/county postings |
| Zombie Property | Vacant + distressed property combo signal |
| Property Lien | County Recorder lien filings → DataTree |
| Personal Lien | Court judgment liens → county courts |
| Tax Delinquent | County Tax Collector delinquent lists |

### Property Status → Non-Distressed
| Filter | Data Source (Likely) | Rootz Has? |
|--------|---------------------|------------|
| Vacant | USPS vacancy flag OR no utility connection | YES (TOT_LVG_AR=0) |
| Non-Owner Occupied | Mailing ≠ site address, no homestead | YES |
| Failed MLS Listings | MLS expired/withdrawn/canceled | NO |
| Tired Landlords | Long-term absentee owner (>7yr) | YES |
| Senior Owner | Age from voter rolls/public records, or exemption | YES (exemption) |
| Out-of-State Owner | Mailing state ≠ property state | YES |
| Probate | County probate court filings | NO |
| Intra-family Transfers | Deed recordings with same surname | PARTIAL ($0-100 transfer) |
| Bank Owned (REO) | Post-foreclosure bank ownership | NO |
| Free & Clear | No active mortgage recorded | PARTIAL |
| High Equity | Estimated value - mortgage balance | YES (assessed - sale price) |
| Negative Equity | Mortgage > estimated value | PARTIAL |
| Released Pre-Foreclosure | Lis pendens dismissed/cured | NO |
| Released Lien | Lien satisfaction recorded | NO |
| 2+ motivations stacking | Computed from above signals | YES |

### Property Characteristics
| Filter | Rootz Has? |
|--------|------------|
| Property Type (SFR, Townhouse, Condo, Mobile, Multi, Land) | YES (DOR_UC) |
| Bedrooms min/max | PARTIAL (some DOR data) |
| Bathrooms min/max | PARTIAL (some DOR data) |
| Building SqFt min/max | YES (TOT_LVG_AR) |
| Lot Size min/max | YES (LND_SQFOOT) |
| Year Built | YES (ACT_YR_BLT, EFF_YR_BLT) |

### Ownership Info
| Filter | Rootz Has? |
|--------|------------|
| Owner name | YES |
| Owner type (individual, corporate, trust) | YES |
| Ownership length | YES (SALE_YR1) |
| Mailing address | YES |

### Sale & Value
| Filter | Rootz Has? |
|--------|------------|
| Last sale date/price | YES (SALE_YR1, SALE_PRC1) |
| Estimated value | YES (JV - just value) |
| Equity % and $ | YES (computed) |
| Price/sqft | YES (computed) |

### Life & Legal Events (CI's most valuable filters)
| Filter | Rootz Has? | Source Needed |
|--------|------------|--------------|
| Probate | NO | County probate court |
| Divorce | NO | County family court |
| Bankruptcy | NO | Federal PACER |
| Death (estate) | NO | Vital records/obituaries |
| Inheritance | PARTIAL | Intra-family deed transfer |

### Mortgage Info (requires title plant data)
| Filter | Rootz Has? | Source Needed |
|--------|------------|--------------|
| Current mortgage amount | NO | County recorder mortgage filings |
| Interest rate | NO | Mortgage recording details |
| Loan type (conventional, FHA, VA) | NO | Mortgage recording details |
| Lender name | NO | Mortgage recording details |
| Mortgage date | NO | County recorder |
| Free & clear | PARTIAL | No mortgage on record |

### Tax Info
| Filter | Rootz Has? |
|--------|------------|
| Assessed value | YES |
| Tax amount | PARTIAL |
| Homestead exemption | YES |
| Tax delinquent | NO — need tax collector data |

### Location & Desirability
| Filter | Rootz Has? |
|--------|------------|
| School district | YES |
| Flood zone | YES (FEMA) |
| Neighborhood demographics | YES (Census ACS) |
| Walk score / transit | NO |

## Per-Property Card Display

Each CI property card shows:
- **Photo gallery** (2 images from satellite/street view)
- **Status badge**: "Off Market (Motivated)" in green
- **Financial metrics**: Last Sold Date, Last Sold Price, Est Price/SqFt, Equity %, Equity $
- **Address + property type + owner type** (Person/Corp)
- **Physical**: beds, baths, sqft, acres, year built
- **Signal tags**: "Non-Owner Occupied", "Tired Landlords", "Out of State Owner", "+2"
- **Est Value**: estimated market value
- **BuyAbility score**: proprietary 0-100 score (60 = moderate opportunity)

## Skip Trace Export (from Steph's CSV)

149 records from "Old Orchard" neighborhood. Per record:
- Owner 1: name, 5 phones, 5 mobile phones, 5 emails
- Owner 2: name, 5 phones, 5 mobile phones, 5 emails
- Ownership type: individual, multi_related, multi_non_related

This costs credits per record. At $0.12-0.20/record, 149 records ≈ $18-30.

## Steph's Farming Packages (from Image.png)

Stephanie O'Brien, Vault Title (614-633-5540, sobrien@vault-title.com)
"Target Farming Packages" include:
- Divorces, Pre-Foreclosures, Bank Owned, Equity in Home
- Interest Rate, Demographics, Expired Listings, Tax Liens
- Probate, Type of Loan, Years in Home, Multi-Family
- HOA Liens, Vacant, Commercial

## Competitive Positioning Summary

**CI's advantages (from First American):**
- Full distressed data pipeline (pre-foreclosure, liens, auctions)
- Life event data (probate, divorce, bankruptcy)
- Mortgage data (loan amount, rate, lender)
- MLS integration (failed/expired listings)
- Skip trace with phone + email
- BuyAbility proprietary score
- Satellite/street view images

**Rootz advantages over CI:**
1. **Government data with cryptographic provenance** — CI shows "Est Value", we show the actual FL DOR assessed value with SSL certificate chain proving source
2. **LLC unmasking** — we cross-reference to FL Sunbiz for actual officers. CI shows "Person" or "Corp" — we show WHO
3. **Federal overlays on every property** — flood zone, schools, demographics, economics built into every search. CI charges for "Location & Desirability"
4. **AI-native** — our tool explains WHY, not just WHAT. CI gives you filters, we give you a farming assistant
5. **90%+ margin** — CI is credit-based tied to First American data costs. We own our data pipeline
6. **2M building permits** — CI doesn't show permits. We have 1.1M Orlando + 842K others
7. **No per-seat AI subscription** — agents use our web UI

**What we must build to compete:**
1. Skip trace API integration ($0.02-0.20/record)
2. Farming score (our "BuyAbility" equivalent)
3. At least probate + tax delinquent data for FL
4. Street view/satellite images (Google Street View API)
