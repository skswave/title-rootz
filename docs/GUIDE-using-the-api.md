# Origin Title Records API Guide
## How to Use the Property Intelligence API
### https://title.rootz.global
### Updated April 29, 2026

---

> **"The SHA-256 document hash and SSL provenance chain in the API response are real cryptographic attestations — not marketing fluff. We're seeing direct government-sourced data, not scraped or third-party aggregated info."**
> — Independent AI verification (Grok, April 2026)

---

## Quick Start

The Origin Title Records API provides instant, verified property intelligence for Miami-Dade County, Florida and selected Massachusetts properties. Every response includes data from multiple government sources with SSL-attested provenance.

**Base URL**: `https://title.rootz.global`

**No API key required** for demo access. All endpoints return JSON.

---

## Florida Endpoints (Miami-Dade County)

### Full Property Intelligence Package
**The flagship endpoint.** Queries 4+ government sources in real-time and assembles a complete property profile.

```
GET /api/fl/search?address={address}&city={city}
```

**Example:**
```
https://title.rootz.global/api/fl/search?address=179+Harbor+Dr&city=Key+Biscayne
```

**What it returns:**
- Property details (owner, bedrooms, bathrooms, sqft, year built, lot size)
- FEMA flood zone with base flood elevation
- Census demographics (income, population, home values, owner-occupancy)
- Nearest schools (public, private, charter) with enrollment and capacity
- Building permit history with contractor names
- 30+ GIS overlay layers identified at the location
- SSL provenance chain (government certificate fingerprints)
- Confidence score (0.0 to 1.0)
- Document hash (SHA-256 of assembled data)

**Confidence scoring:**
| Score | Meaning |
|-------|---------|
| 0.95 | All layers present including permits |
| 0.90 | Property + flood + census + schools |
| 0.65 | Property data only (overlays failed) |
| 0.50 | Partial data |

---

### Quick Property Lookup
Fast lookup from Miami-Dade County GIS. Returns property details without the overlay enrichment.

```
GET /api/fl/lookup?address={address}&city={city}
GET /api/fl/lookup?folio={13-digit-folio}
```

**Examples:**
```
https://title.rootz.global/api/fl/lookup?address=7830+Atlantic+Way&city=Miami+Beach
https://title.rootz.global/api/fl/lookup?folio=0232020040540
```

**Returns:** Owner, building details, lot size, year built, zoning, DOR classification, condo flag, subdivision. Covers all 936,739 properties in Miami-Dade.

---

### FEMA Flood Zone
Query FEMA flood zones by coordinates. Works nationwide.

```
GET /api/fl/flood?lat={latitude}&lng={longitude}
```

**Example:**
```
https://title.rootz.global/api/fl/flood?lat=25.8638&lng=-80.1208
```

**Returns:** Flood zone (AE, AH, X, VE, etc.), base flood elevation, special flood hazard area status, insurance requirement, DFIRM panel ID.

**Common zones:**
| Zone | Risk | Insurance |
|------|------|-----------|
| AE | High (1% annual chance, coastal) | Required |
| AH | High (1% annual chance, ponding) | Required |
| VE | Very High (coastal wave action) | Required |
| X | Minimal | Not required |

---

### Census Demographics
Block-group level demographics for any US address.

```
GET /api/fl/census?address={address}&city={city}
```

**Example:**
```
https://title.rootz.global/api/fl/census?address=200+S+Biscayne+Blvd&city=Miami
```

**Returns:** Population, median household income, median home value, median rent, owner-occupied rate, vacancy rate, median age, per capita income, congressional district, state legislative districts.

---

### Nearest Schools
Find public, private, and charter schools near any coordinates.

```
GET /api/fl/schools?lat={latitude}&lng={longitude}&radius={miles}
```

**Example:**
```
https://title.rootz.global/api/fl/schools?lat=25.8638&lng=-80.1208&radius=3
```

**Returns:** Nearest elementary, middle, and high school (public) with enrollment, capacity, and utilization percentage. Plus up to 5 nearest private schools and 5 nearest charter schools. All with distance in miles.

---

### Building Permits
Search building permit history by folio number or address.

```
GET /api/fl/permits?folio={folio}
GET /api/fl/permits?address={address}
```

**Examples:**
```
https://title.rootz.global/api/fl/permits?folio=2442320062150
https://title.rootz.global/api/fl/permits?address=18325+SW+114
```

**Returns:** Permit type, description, contractor name and license number, issue date, completion date, estimated value, residential/commercial flag.

**Permit coverage (481,950 total records):**
- **County permits**: 262,019 records (unincorporated Miami-Dade, Key Biscayne)
- **City of Miami permits**: 219,931 records (since 2014, includes scope of work, total cost, inspection results)
- More cities being added (Miami Beach, Coral Gables coming soon)

City of Miami permits are especially rich: scope of work description, total project cost, remodeling vs. addition cost, square footage changes, days in city review, and final inspection results.

---

## Massachusetts Endpoints

### Property Search (Cached Records)
Returns deep title records for 10 pre-extracted Massachusetts properties.

```
GET /api/search?address={address}&town={town}
```

**Example:**
```
https://title.rootz.global/api/search?address=111+Swamp+Rd&town=Richmond
```

---

### Chain of Title
Complete ownership history — who bought from whom, when, for how much.

```
GET /api/chain?address={address}&town={town}
```

**Example:**
```
https://title.rootz.global/api/chain?address=15+Shetland+Dr&town=Pittsfield
```

---

### Lien Check
Active vs. resolved mortgages, tax liens, and execution judgments.

```
GET /api/liens?address={address}&town={town}
```

**Example — the troubled title:**
```
https://title.rootz.global/api/liens?address=291+North+Plain+Rd&town=Great+Barrington
```

---

### Fraud Pattern Detection
Automated risk scoring with 7 detection rules.

```
GET /api/fraud?address={address}&town={town}
```

**Example:**
```
https://title.rootz.global/api/fraud?address=291+North+Plain+Rd&town=Great+Barrington
```

**Returns:** Risk level (LOW/MEDIUM/HIGH), flag count, specific warnings (orphan deeds, rapid transfers, financial distress, zero-consideration transfers, repeated tax takings).

---

### Cross-Party Search
Find a person or entity across ALL properties. The fraud detection tool — scammers appear on multiple properties.

```
GET /api/party?name={name}&role={grantor|grantee|both}
```

**Examples:**
```
https://title.rootz.global/api/party?name=SPRAGUE
https://title.rootz.global/api/party?name=COOK+MARIE
https://title.rootz.global/api/party?name=PITTSFIELD+COOPERATIVE
```

---

### Live MassGIS Assessor
Real-time query to Massachusetts state GIS. Works for any of 2.6 million MA properties.

```
GET /api/assessor?address={address}&town={town}
```

**Example:**
```
https://title.rootz.global/api/assessor?address=147+Reservoir+Rd&town=Lenox
```

---

### Document Lookup
Retrieve a specific recorded document by book/page reference.

```
GET /api/document?bookPage={book/page}
```

**Example:**
```
https://title.rootz.global/api/document?bookPage=01760/119
```

---

### List All Properties
See all properties currently in the Origin cache.

```
GET /api/properties
```

---

## For AI Agents (MCP Protocol)

This server speaks Model Context Protocol (MCP). AI agents can connect via POST and call 9 tools:

| Tool | Purpose |
|------|---------|
| `search_property` | Full property lookup (MA) |
| `get_chain_of_title` | Ownership history |
| `check_liens` | Active/resolved liens |
| `get_document` | Specific document by book/page |
| `get_assessor_data` | Live MassGIS query |
| `search_by_party` | Cross-property person search |
| `detect_fraud_patterns` | Automated risk scoring |
| `search_by_notary` | Cross-property notary search |
| `list_properties` | All cached properties |

**MCP endpoint:** `POST https://title.rootz.global/`

**Request format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_property",
    "arguments": {
      "address": "111 Swamp Rd",
      "town": "Richmond"
    }
  }
}
```

---

## Understanding the Data

### What Makes This Different

| Question | Zillow | PropStream | Origin |
|----------|--------|-----------|--------|
| Who owns it? | Public name | Public name | **Owner + trust/LLC name** |
| What's it worth? | Zestimate (algorithm) | Assessed value | **Assessed + market + verified** |
| Is it in a flood zone? | Badge (yes/no) | Basic zone | **Zone + BFE + insurance est + source cert** |
| What school? | Generic rating | No | **Specific school with enrollment & capacity** |
| Any permits? | No | No | **Yes — contractor, type, date** |
| Is the title clean? | No | No | **Chain + liens + fraud score** |
| Is the data verified? | No | No | **SSL provenance + document hash** |
| Can my AI use it? | No (scraping) | API ($$$) | **Yes — structured JSON, MCP tools** |

### Reading the Provenance Chain

Every response includes an `origin.provenance` object showing which government servers provided the data:

```json
"provenance": {
  "gisweb.miamidade.gov": {
    "subject": "CN=gisweb.miamidade.gov, O=Miami-Dade County",
    "fingerprint": "78:34:5D:92:...",
    "validTo": "2027-01-30"
  },
  "hazards.fema.gov": {
    "subject": "CN=hazards.fema.gov, O=FEMA",
    "fingerprint": "C9:4B:E9:25:...",
    "validTo": "2026-07-14"
  }
}
```

This proves the data came from authenticated government servers. The SSL certificate fingerprint can be independently verified — we're not asking you to trust us, we're showing you who we got the data from.

### Reading the Confidence Score

The confidence score tells you how complete the intelligence package is:

- **0.50** = Property data only (base record from GIS)
- **+0.10** = Coordinates resolved (enables spatial queries)
- **+0.10** = Flood zone data from FEMA
- **+0.10** = Census demographics
- **+0.05** = School data
- **+0.05** = Building permit data
- **+0.05** = GIS overlay layers (30+ identified)
- **= 0.95** = Maximum with current data sources

Adding title chain data (deed history, mortgages, liens) from the Clerk API would push confidence to 0.98+. This is the premium layer available on request.

---

## Try It Now

Click any of these links to see live data:

**Florida — Full Intelligence:**
- [179 Harbor Dr, Key Biscayne](https://title.rootz.global/api/fl/search?address=179+Harbor+Dr&city=Key+Biscayne) — Luxury 5bd, flood zone AE, $250K+ median income, 4 permits
- [7830 Atlantic Way, Miami Beach](https://title.rootz.global/api/fl/search?address=7830+Atlantic+Way&city=Miami+Beach) — 3bd trust-held, flood zone AE, BFE 8ft
- [6 Veragua Ave, Coral Gables](https://title.rootz.global/api/fl/search?address=6+Veragua+Ave&city=Coral+Gables) — Family home, flood zone AH (ponding), $58K median income

**Florida — Quick Lookup:**
- [Any Miami-Dade address](https://title.rootz.global/api/fl/lookup?address=1500+Collins&city=Miami+Beach) — 936K properties instant

**Florida — Schools:**
- [Schools near Key Biscayne](https://title.rootz.global/api/fl/schools?lat=25.6937&lng=-80.1625) — K-8 at 76% capacity

**Florida — Flood:**
- [Downtown Miami](https://title.rootz.global/api/fl/flood?lat=25.7617&lng=-80.1918)
- [Key Biscayne](https://title.rootz.global/api/fl/flood?lat=25.6937&lng=-80.1625)

**Massachusetts — Deep Title:**
- [Fraud Analysis: Troubled Title](https://title.rootz.global/api/fraud?address=291+North+Plain+Rd&town=Great+Barrington) — 3 tax takings, 4 judgments
- [Cross-Party: Find all Spragues](https://title.rootz.global/api/party?name=SPRAGUE) — 57 appearances across 2 properties
- [Chain of Title](https://title.rootz.global/api/chain?address=15+Shetland+Dr&town=Pittsfield) — Kester→Connolly→Turner with name change

---

## Data Coverage

| Area | Properties | Data Layers | Real-Time |
|------|-----------|-------------|-----------|
| Miami-Dade County, FL | 936,739 | Property + flood + census + schools + 482K permits | YES |
| Massachusetts | 2.6M (assessor) + 10 deep title | Title + liens + fraud + assessor | Assessor: YES |
| FEMA Flood Zones | Nationwide | Flood zone + BFE | YES |
| Census Demographics | Any US address | 1,843 block groups (MDC) | YES |
| Schools | 1,603 | Public (451) + Private (971) + Charter (181) | Cached |
| Road Construction | 1,139 projects | Active road/utility work | Cached |
| Traffic Counts | 424 stations | Annual average daily traffic | Cached |
| Evacuation Routes | 152 routes | Hurricane evacuation routes | Cached |

---

*Built by [Rootz Corp](https://rootz.global) — origin.rootz.global*
*DBA: eth:0xD36AAf65a91bB7dc69942cF6B6d1dBa4Ef171664*
