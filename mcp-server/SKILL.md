# Title Rootz Global — Property Farming Skill

## What You Can Do With This

You are connected to **title.rootz.global**, a property intelligence platform with **10.8 million Florida parcels** covering all 67 counties, plus 1.2 million Ohio parcels.

**Primary use case: Real estate farming** — identifying properties likely to come on the market before they're listed.

## Farming Workflow

### Step 1: Search a Property
```
GET https://title.rootz.global/api/fl/search?address=123+MAIN+ST&city=CORAL_SPRINGS
```
Returns: owner name, mailing address, assessed value (land + building + total), last 2 sale prices and dates, year built, living area, homestead status, FEMA flood zone, census demographics, nearest schools, and investor signals.

### Step 2: Read the Farming Signals
Every FL search returns an `investorSignals` section. Key farming indicators:

| Signal | What It Means for Farming |
|--------|--------------------------|
| `absenteeOwner: true` | Owner doesn't live there — rental or vacant, more likely to sell |
| `outOfStateOwner: true` | Managing from afar — burden increases over time |
| `corporateOwner: true` | LLC/Corp — investment property, may rotate out of portfolio |
| `trustOwner: true` | Estate/trust — probate settlement, heirs may sell |
| `longTermOwner: true` | 15+ years — life changes, downsizing, empty nesters |
| `highEquity: true` | 50%+ equity — sitting on gains, may cash out |
| `nominalTransfer: true` | $0-$100 sale — estate transfer, likely free & clear |
| `seniorExemption: true` | Aging owner — may downsize or move to assisted living |
| `noHomestead: true` | Not primary residence — investment/second home |
| `vacantLot: true` | No building — development or land banking |

### Step 3: Unmask LLC Owners
If the owner is an LLC or corporation:
```
GET https://title.rootz.global/api/fl/cross-ref/owner-intel?address=123+MAIN+ST&city=CORAL_SPRINGS
```
Returns: the actual officers behind the LLC (from FL Sunbiz), whether the CEO is also the registered agent (owner-operated signal), filing date, and if the entity is a SEC-registered public company or REIT.

### Step 4: Check Neighborhood Context
For any property's coordinates:
```
GET https://title.rootz.global/api/fl/flood?lat=26.27&lng=-80.27       — Flood risk
GET https://title.rootz.global/api/fl/schools?lat=26.27&lng=-80.27     — Nearest schools
GET https://title.rootz.global/api/fl/census?address=123+MAIN+ST&city=CORAL_SPRINGS — Demographics
GET https://title.rootz.global/api/fl/economics                        — Market trends
```

### Step 5: Check Building Activity
```
GET https://title.rootz.global/api/fl/permits?address=123+MAIN+ST
```
Returns building permits with contractor names, dates, and types. (Currently covers Miami-Dade, Broward, and Brevard counties — expanding statewide.)

## Tips for Agents

**Best farming prospects** combine multiple signals:
- Absentee + long-term owner = rental property with aging landlord
- Trust/estate + no homestead = inherited property, heirs don't live there
- High equity + senior exemption = ready to downsize
- Corporate owner + nominal transfer = internal portfolio shuffle, may sell
- Out-of-state + long-term = distant owner losing connection to property

**Address formatting**: Use `+` for spaces, underscore-style city names work too. Example: `address=6580+SHERRY+LN&city=Hilliard`

**Ohio endpoints** use the same pattern: `/api/oh/search?address=X&city=Y`

## Coverage

| State | Parcels | Counties | Endpoint |
|-------|---------|----------|----------|
| Florida | 10,834,415 | All 67 | `/api/fl/search` |
| Ohio | 1,242,958 | 3 (Franklin, Hamilton, Cuyahoga) | `/api/oh/search` |

Plus nationwide FEMA flood zones, statewide FL schools/hospitals/demographics/economics.

## Full API Directory
```
GET https://title.rootz.global/api
```
Returns JSON list of all available endpoints.

## Data Sources
All data from authenticated government sources: FL Department of Revenue (parcels), FEMA (flood), US Census Bureau (demographics), NCES (schools), CMS (hospitals), BLS (CPI), FRED (housing economics), IRS SOI (income by ZIP), EPA (environmental). Every response includes SSL certificate provenance from the source servers.
