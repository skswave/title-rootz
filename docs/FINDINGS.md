# Land Records Project — Research Findings
## April 19, 2026

## Executive Summary

**Massachusetts land records are a perfect Origin-model opportunity.** Public data worth billions to the title insurance industry is trapped behind 1990s-era ASP.NET interfaces with zero AI accessibility. We successfully extracted structured data for 5 properties across 2 registry districts, proving the data can be harvested and structured for AI consumption.

## Properties Captured (Registry of Deeds)

| Property | Town | Registry | Records | Key Finding |
|----------|------|----------|---------|-------------|
| 111 Swamp Rd | Richmond | Middle Berkshire | 14 | **Full detail extracted** — Steven's house, 3 deeds Foster→Sprague (2000), $274K + $30K + $30K |
| 147 Reservoir Rd | Lenox | Middle Berkshire | 19 | Moynihan→Palmer ($937,500, 2012), Charter Communications easement |
| 299 Under Mountain Rd | Lenox | Middle Berkshire | 271 | Massive title history — extensive property with many transactions |
| Marshall Ave | Pittsfield | Middle Berkshire | 166 | Multiple properties on street — grid captured |
| Shetland Dr | Pittsfield | Middle Berkshire | 197 | Multiple properties — grid captured |
| 291 North Plain Rd | Great Barrington | South Berkshire | 21 | **TROUBLED TITLE** — 3 tax takings, 3 redemptions, 3 execution judgments |

### 291 North Plain Rd — Title Insurance Case Study

This property is a textbook example of why title insurance exists:
- **1996**: Siok sells to Cook David J & Marie Ann for $167,000
- **2001**: Cook takes $80,000 mortgage from Greylock Federal Credit Union
- **2006**: David Cook dies (referenced as "EST" = estate)
- **2009**: Three execution judgments — funeral home ($8,674), oil company ($2,174 + $2,039)
- **2009-2017**: Three tax takings by Great Barrington, each redeemed
- **2019**: Marie Ann transfers to herself + Thomas M Clark (family transfer, $0)
- A title examiner would need to verify ALL these liens are cleared before insuring

## Data Sources Inventory

### 1. Registry of Deeds (masslandrecords.com) ✅ CAPTURED
- **Data**: Deeds, mortgages, discharges, liens, easements, takings, executions
- **Fields per record**: Doc#, date, time, type, pages, book/page, consideration, status, parties (grantor/grantee), cross-references
- **Coverage**: 21 registries, back to 1641 (Middle Berkshire: 1,056,169+ docs)
- **Format**: Scanned images + structured index
- **API**: NONE
- **AI accessible**: ZERO
- **Automation**: Possible via Playwright, but ViewState makes it brittle (requires cookie clearing between searches)
- **Digital signatures/hashes**: NONE — just physical stamps

### 2. Town Assessor Databases 🔄 IDENTIFIED
- **Richmond**: AxisGIS (axisgis.com/richmondma/) — parcel format "249/000.0-0000-0000.0"
- **Lenox**: AxisGIS (axisgis.com/LenoxMA/) — assessed values, building values, land values, sale prices
- **Pittsfield**: City website (cityofpittsfield.org) — board of assessors
- **Great Barrington**: Town website — assessor's office
- **Data**: Assessed value (total, land, building), lot size, building details, tax amount, parcel ID
- **API**: None found — all browser-based
- **Contact**: Each town has different systems and formats

### 3. MassGIS Property Tax Parcels ✅ AVAILABLE
- **URL**: gis.data.mass.gov — statewide parcel dataset
- **Coverage**: All Massachusetts municipalities
- **Format**: Shapefiles, FGDB, Feature Service (ArcGIS)
- **Updated**: January 1, 2026 (twice yearly)
- **Data**: Parcel boundaries, some assessment attributes
- **API**: ArcGIS REST Feature Service (queryable!)
- **FREE**: Yes, open data
- **This is the bulk assessor layer** — downloadable for all of MA

### 4. Real Estate Market Data (Zillow, Redfin, MLS)
- **Data**: Zestimate, market value, sale history, property details, photos
- **111 Swamp Rd**: 2 bed/1 bath, 1,600 sqft, 74 acres, 18th century Colonial, $334,000 (2000 sale)
- **147 Reservoir Rd**: 4-bed Timberpeg Post & Beam, near Tanglewood
- **API**: Zillow/Redfin block automated access (403)
- **Value**: Market price context that registry doesn't have

### 5. Additional Sources Identified
| Source | Data | Access |
|--------|------|--------|
| Massachusetts Land Court | Registered Land (~5% of parcels) | masslandrecords.com (separate search) |
| FEMA Flood Maps | Flood zones | FEMA Map Service Center |
| MassDEP | Environmental records, 21E sites | mass.gov/dep |
| Town Building Dept | Building permits, inspections | Per-town |
| Probate Court | Estate records, trusts | masscourts.org |
| Secretary of State | Corporate ownership (LLCs, trusts) | sec.state.ma.us |
| Census/Historical | Historical ownership | FamilySearch, ancestry |
| USDA Soil Survey | Soil types, ag classification | websoilsurvey.nrcs.usda.gov |

## Technical Findings

### What Works
1. **Playwright automation** can navigate the ASP.NET interface
2. **Cookie clearing** between searches solves ViewState persistence
3. **Detail extraction** via `__doPostBack()` gives full record detail (parties, references, consideration)
4. **Cross-references** link documents together (mortgage→discharge, deed→taking)
5. **Data is structured** enough to build automated chain-of-title

### What's Hard
1. **Street name indexing** is inconsistent ("UNDERMOUNTAIN" fails, "UNDER MOUNTAIN" works)
2. **No bulk export** — must crawl page by page, record by record
3. **Rate limiting** unknown — need to test carefully
4. **ViewState** makes browser automation fragile
5. **Assessor data** varies by town — no standard API
6. **Real estate sites** block automated access (403)

### What's Missing (No Digital Trust Layer)
- No hash of any document image
- No digital signatures on records
- No Merkle tree linking records
- No cryptographic timestamp
- Status says "Verified/Certified" but verification is just a label, not a proof
- **This is the Rootz value proposition**: Add a verifiable integrity layer to public records

## Origin Model Design

### Per-Property Record Structure
```json
{
  "property": {
    "address": "111 Swamp Rd",
    "town": "Richmond",
    "state": "MA",
    "parcelId": "249/...",
    "coordinates": { "lat": 42.xxx, "lng": -73.xxx }
  },
  "registry": {
    "records": [...],           // from masslandrecords.com
    "chainOfTitle": [...]       // computed from records
  },
  "assessor": {
    "assessedValue": 450000,    // from town assessor / MassGIS
    "landValue": 200000,
    "buildingValue": 250000,
    "lotSize": "74 acres",
    "yearBuilt": 1780,
    "sqft": 1600,
    "bedrooms": 2,
    "bathrooms": 1
  },
  "market": {
    "lastSaleDate": "2000-08-11",
    "lastSalePrice": 334000,
    "estimatedValue": null      // Zestimate equivalent
  },
  "integrity": {
    "merkleRoot": "...",        // hash of all document images
    "lastVerified": "2026-04-19",
    "documentHashes": [...]     // SHA-256 of each scanned image
  }
}
```

### MCP Tools (Target)
- `search_property(address, town)` — find property and return full record
- `get_chain_of_title(address)` — compute ownership chain from deeds
- `check_liens(address)` — find active mortgages, tax liens, executions
- `get_document(bookPage)` — retrieve specific document by book/page reference
- `verify_record(docNum)` — check document hash against Merkle root
- `get_assessor_data(address)` — assessed values, building details
- `compare_properties(addresses[])` — side-by-side comparison

## Economics

### Title Insurance Industry
- **Market size**: $20B+ annually in the US
- **Average title search**: $200-400 per property
- **Time per search**: 2-8 hours for a manual examiner
- **With Origin data**: Seconds per AI query
- **Pricing model**: Per-property search fee ($5-25) or subscription for title companies

### Data Scale
- Middle Berkshire: 1,056,169 documents
- South Berkshire: 287,802 documents
- **21 registries total** across Massachusetts
- Estimated statewide: 10-20M+ documents
- MassGIS: All parcels statewide (millions)

## Next Steps

1. **Download MassGIS parcel data** for Berkshire County — get assessor fields for all properties
2. **Build automated scraper** using the proven Playwright pattern (cookie clear + pressSequentially)
3. **Extract remaining properties**: 299 Under Mountain Rd detail, Marshall Ave, Shetland Dr individual properties
4. **Find commercial properties**: England Bros building (Pittsfield), Boston office building
5. **Design JSON schema** for the complete property record (registry + assessor + market)
6. **Build MCP server** with search tools
7. **Add integrity layer**: Hash document images, build per-property Merkle trees

## For Tracie

The data that a title examiner manually assembles is all here — it just takes a browser and hours of clicking:
- Chain of title (grantor→grantee links with cross-references)
- Lien status (mortgages, tax liens, executions — with discharge/redemption tracking)
- Easements and restrictions
- Municipal lien certificates (required for any sale)

An Origin-style dataset makes ALL of this queryable by AI in seconds. The 291 North Plain Rd example shows exactly why: 21 records with complex cross-references that tell a story of financial distress, tax delinquency, and family succession. Today, a title examiner pieces this together manually. Tomorrow, an AI does it instantly from structured data.
