# Origin Land Records — Data Collection Recipe Book
## How We Pull, Process, and Refresh Every Data Source
### The guide that makes weekly updates trivial

---

## Why This Matters

Every token an AI spends navigating a government website is wasted. Our job is to do the hard work ONCE, structure the data, and serve it instantly. This recipe book documents exactly how we collect each data source so:
1. Weekly/daily refreshes are automated
2. New team members can replicate the process
3. We track costs and timing for each source
4. We know when data goes stale

---

## Recipe 1: Miami-Dade Property Records (GIS)

| Field | Value |
|-------|-------|
| **Source** | Miami-Dade County GIS |
| **URL** | `gisweb.miamidade.gov/arcgis/rest/services/MD_LandInformation/MapServer/24` |
| **Auth** | None required |
| **Cost** | Free |
| **Format** | ArcGIS REST → JSON |
| **Records** | 936,739 (all parcels in Miami-Dade) |
| **Fields** | 29 (folio, address, owner, bedrooms, bathrooms, year built, lot size, zoning, etc.) |
| **Refresh** | Weekly recommended (county updates regularly) |
| **Pull time** | ~28 minutes for full county |
| **Script** | `data/florida/pull-miami-dade.py` |
| **Output** | `data/florida/miami-dade-parcels.jsonl` (681MB deduped) |
| **SSL Cert** | CN=gisweb.miamidade.gov, O=Miami-Dade County, Sectigo CA |
| **Provenance** | `data/florida/miami-dade-provenance.json` |

### Query Pattern
```
GET {url}/query?where=1=1&outFields={fields}&returnGeometry=false
    &resultOffset={offset}&resultRecordCount=2000&f=json

Pagination: 2000 records per request, increment offset until no more results
Rate limit: 0.5s between requests (polite)
Resume: Script supports resume — counts existing lines and starts from that offset
```

### Known Issues
- Assessed values (TOTAL_VAL_CUR, LAND_VAL_CUR, BUILDING_VAL_CUR) are NULL in this layer
- Need FL DOR NAL file or Property Appraiser bulk download for values
- Coordinates are in State Plane (EPSG:2236), not WGS84 — use Census geocoder for lat/lng

---

## Recipe 2: FEMA Flood Zones

| Field | Value |
|-------|-------|
| **Source** | FEMA National Flood Hazard Layer |
| **URL** | `hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28` |
| **Auth** | None |
| **Cost** | Free (federal, public domain) |
| **Format** | ArcGIS REST spatial query → JSON |
| **Method** | Point-in-polygon: pass lat/lng, get flood zone |
| **Key fields** | FLD_ZONE, ZONE_SUBTY, SFHA_TF, STATIC_BFE, DFIRM_ID |
| **Refresh** | Annually (FEMA updates FIRMs on rolling schedule) |
| **Coverage** | Nationwide |
| **SSL Cert** | CN=hazards.fema.gov, O=FEMA, DigiCert EV CA |

### Query Pattern
```
GET {url}/query?geometry={lng},{lat}&geometryType=esriGeometryPoint
    &inSR=4326&spatialRel=esriSpatialRelIntersects
    &outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,DFIRM_ID&f=json
```

### For Bulk Pre-computation
Sample a grid across the county (20×15 = 300 points) and cache results.
Most of Miami-Dade is Zone AE or X. The grid gives ~99% coverage for instant lookup.

---

## Recipe 3: US Census Demographics (ACS)

| Field | Value |
|-------|-------|
| **Source** | US Census Bureau, American Community Survey 5-Year |
| **URL** | `api.census.gov/data/2022/acs/acs5` |
| **Geocoder** | `geocoding.geo.census.gov/geocoder/geographies/onelineaddress` |
| **Auth** | None (free tier, no API key needed for moderate volume) |
| **Cost** | Free (federal, public domain) |
| **Format** | REST API → JSON |
| **Granularity** | Block Group (most granular), Tract, County |
| **Key fields** | Median HH income, population, median home value, rent, owner-occupancy, age, commute |
| **Refresh** | Annually (new ACS release each September) |
| **SSL Cert** | CN=api.census.gov, O=U.S. Census Bureau, DigiCert CA |

### Query Pattern
```
Step 1 — Geocode address to get tract/block group:
GET geocoding.geo.census.gov/geocoder/geographies/onelineaddress?
    address={address}&benchmark=Public_AR_Current&vintage=Current_Current&format=json

Step 2 — Pull ACS data for that block group:
GET api.census.gov/data/2022/acs/acs5?
    get=B19013_001E,B01003_001E,B25077_001E,...
    &for=block%20group:{bg}&in=state:{state}+county:{county}+tract:{tract}

Key ACS variable codes:
  B19013_001E = Median household income
  B01003_001E = Total population
  B25077_001E = Median home value
  B25064_001E = Median rent
  B25003_001E = Total occupied housing
  B25003_002E = Owner-occupied housing
  B01002_001E = Median age
  B19301_001E = Per capita income
  B25002_001E = Total housing units
  B25002_002E = Occupied
  B25002_003E = Vacant
```

### For Bulk Pre-computation
Miami-Dade has ~1,300 census block groups. Pull ACS for all block groups once:
```
GET api.census.gov/data/2022/acs/acs5?
    get=B19013_001E,...&for=block%20group:*&in=state:12+county:086
```
This returns ALL block groups in one call. Cache locally.

---

## Recipe 4: Miami-Dade Overlay Layers (ArcGIS Online)

| Layer | Endpoint | Records | Method | Refresh |
|-------|----------|---------|--------|---------|
| **FEMA Flood Zones** | `FEMAFloodZone_gdb/FeatureServer/0` | ~10K polygons | Spatial or bulk | Annual |
| **Hurricane Evacuation** | `HurricaneEvacZone_gdb/FeatureServer/0` | ~100 polygons | Spatial or bulk | Annual |
| **School Sites** | `SchoolSite_gdb/FeatureServer/0` | ~500 points | Bulk pull all | Annually |
| **Private Schools** | `PrivateSchool_gdb/FeatureServer/0` | ~300 points | Bulk pull all | Annually |
| **Charter Schools** | `CharterSchool_gdb/FeatureServer/0` | ~100 points | Bulk pull all | Annually |
| **Building Permits** | `BuildingPermit_gdb/FeatureServer/0` | ~50K+ points | Bulk pull all | Weekly |
| **Road Improvements** | `RoadWayImprovement_gdb/FeatureServer/0` | ~200 lines | Bulk pull all | Monthly |
| **Traffic Counts** | `MDCTrafficCountStation_gdb/FeatureServer/0` | ~500 points | Bulk pull all | Annually |
| **Evacuation Routes** | `PrimaryEvacuationRoute_gdb/FeatureServer/0` | ~50 lines | Bulk pull all | Annually |
| **Broadband** | `MDBroadbandProvider_gdb/FeatureServer/0` | varies | Spatial | Annually |

All endpoints: `https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/{name}/FeatureServer/0`

### Bulk Pull Pattern
```python
# For small layers (<5000 records) — pull everything
offset = 0
while True:
    GET {url}/query?where=1=1&outFields=*&returnGeometry=true&outSR=4326
        &resultOffset={offset}&resultRecordCount=2000&f=json
    if not features or not exceededTransferLimit: break
    offset += len(features)
```

### Spatial Query Pattern (for large polygon layers)
```
GET {url}/query?geometry={lng},{lat}&geometryType=esriGeometryPoint
    &inSR=4326&spatialRel=esriSpatialRelIntersects
    &outFields=*&returnGeometry=false&f=json
```

---

## Recipe 5: Miami-Dade Clerk (Official Records — Paid)

| Field | Value |
|-------|-------|
| **Source** | Miami-Dade Clerk of Court |
| **URL** | `www2.miamidadeclerk.gov/Developers` |
| **Auth** | Account + prepaid units |
| **Cost** | $0.20 per API call |
| **FTP Bulk** | $110/month (standard), $420/month (with images) |
| **Data** | Deeds, mortgages, liens, lis pendens, judgments, satisfactions |
| **Refresh** | Daily (records filed daily) |
| **SSL Cert** | CN=miamidadeclerk.gov, O=Clerk of the Courts, Sectigo CA |

### When to Pull
- NOT bulk — only on demand when a specific property is requested
- Each pull costs $0.20, so we cache results permanently
- Title chain data is the PREMIUM layer — only fetched when someone pays for it

---

## Recipe 6: FL Department of Revenue (Statewide Values)

| Field | Value |
|-------|-------|
| **Source** | Florida Department of Revenue, Property Tax Oversight |
| **URL** | `floridarevenue.com/property/Pages/DataPortal_RequestAssessmentRollGISData.aspx` |
| **Auth** | None for current data (email request for historical) |
| **Cost** | Free |
| **Format** | CSV (NAL, SDF files) |
| **Records** | 10.8M parcels statewide, 936K Miami-Dade |
| **Key fields** | Just value, assessed value, taxable value, exemptions, sale data |
| **Refresh** | Twice yearly (posted to website) |
| **Contact** | PTOTechnology@floridarevenue.com |

### Pull Method
- Current data: direct download from website (need to find exact URL — SharePoint hosted)
- Historical: email request specifying year + county + file type (NAL/SDF)
- Files > 10MB delivered via temporary download link

### Why This Matters
This fills the GAP in our GIS data — the assessed values are null in the GIS layer.
The NAL file has just value, assessed value, taxable value, exemptions — everything we need.

---

## Refresh Schedule

| Source | Frequency | Method | Estimated Time | Cost |
|--------|-----------|--------|---------------|------|
| Property records (GIS) | Weekly | Python script | 28 min | $0 |
| Building permits | Weekly | Python script | 10 min | $0 |
| FEMA flood zones | Annually | Grid sample | 20 min | $0 |
| Census demographics | Annually | Bulk block groups | 5 min | $0 |
| School sites | Annually | Bulk pull | 2 min | $0 |
| Road improvements | Monthly | Bulk pull | 2 min | $0 |
| Traffic counts | Annually | Bulk pull | 2 min | $0 |
| FL DOR values | Twice yearly | CSV download | 5 min | $0 |
| Clerk records (title) | On demand | API call | Instant | $0.20/property |

### Automation
All free sources can be cron-scheduled:
```
Weekly:   pull-miami-dade.py (parcels) + building-permits
Monthly:  road-improvements + traffic
Annual:   schools + flood zones + census + FL DOR values
On demand: clerk API for title chains
```

---

## Token Savings Calculation

### Without Origin (AI searches from scratch)
An AI trying to answer "tell me about 7830 Atlantic Way" would need to:
1. Search Google → parse results → 2,000 tokens
2. Navigate to county GIS → parse form → query → 5,000 tokens
3. Navigate to FEMA → parse → query → 3,000 tokens
4. Navigate to Census → geocode → query ACS → 5,000 tokens
5. Navigate to school district → find boundaries → 3,000 tokens
6. Cross-reference everything → 2,000 tokens
**Total: ~20,000 tokens, 2-5 minutes, unreliable results**

### With Origin (pre-computed data)
AI calls one endpoint → gets structured JSON → 1,500 tokens for the response
**Total: ~2,000 tokens, <3 seconds, verified results**

**Token savings: 90%+**
**Time savings: 98%+**
**Reliability: from ~40% (web search) to ~95% (verified data)**

At $3/million tokens (Claude), 20K tokens = $0.06 per query the old way.
At 2K tokens with Origin = $0.006 per query. 10x cheaper for the AI operator.

And the AI gets BETTER data — not web search snippets, but structured, verified, SSL-attested government records.
