# Miami-Dade County — 80+ Public Data Layers
## Everything Free, All Joinable to Property Address

### The Power: One Folio Number Unlocks Everything

Miami-Dade's 13-digit folio number is the master key. From one property address, we geocode to lat/lng, spatial-query against 80+ polygon/point layers, and assemble a complete intelligence package.

### Data Layers by Category

| Category | Layers | Source | Join Method | Key Data |
|----------|--------|--------|-------------|----------|
| **Property & Tax** | 11 | County PA, Clerk, FL DOR | Folio | Owner, value, tax, liens, deeds, sales |
| **Schools** | 7 | County GIS + FL DOE | Spatial | Which school, grade (A-F), test scores |
| **Public Safety** | 9 | County PD, FDLE | Spatial | Crime stats, sex offenders, fire stations, evacuation zones |
| **Traffic** | 5 | FDOT, County | Spatial | Traffic counts, crash data, commute times |
| **Flood & Environment** | 11 | FEMA, NOAA, EPA, FL DEP | Spatial | Flood zone, Superfund, brownfields, wetlands, soil |
| **Sea Level / Climate** | 6 | NOAA, County | Spatial | Sea level rise scenarios (1-10ft), storm surge, king tides |
| **Zoning & Land Use** | 7 | County Planning | Spatial | Current zoning, future land use, CRAs, opportunity zones |
| **Permits & Violations** | 5 | County Building | Address/Folio | Active permits, code violations, 311 requests |
| **Demographics** | 4 | Census ACS | Census tract | Income, education, population, housing |
| **Transit** | 4 | County Transit, Walk Score | Spatial | Bus/rail stops, walk/bike/transit scores |
| **Utilities** | 6 | County WASD, FCC | Spatial | Water/sewer, broadband, stormwater |
| **Parks & Recreation** | 3 | County GIS | Spatial | Parks, beaches, facilities |
| **Health** | 6 | County, FL DBPR, EPA | Spatial | Hospitals, restaurant inspections, EJScreen |
| **HOA/Condo** | 3 | County Registry, FL DBPR | Address | Association info, SIRS compliance, officers |
| **Historic** | 2 | County Historic Preservation | Spatial | Historic designation, tax exemptions |
| **Elevation** | 2 | USGS, County LiDAR | Spatial | 1-meter elevation (critical in Miami!) |
| **Noise** | 2 | MIA Airport, DOT | Spatial | Airport noise contours, highway noise |
| **Boundaries** | 5 | County, Census | Spatial | Municipality, commission district, precincts |

### Key API Endpoints (All Free)

```
Property:    gisweb.miamidade.gov/arcgis/rest/services/MD_LandInformation/MapServer/24
Parcels:     gis-mdc.opendata.arcgis.com/datasets/parcel
Flood:       gis-mdc.opendata.arcgis.com/datasets/fema-flood-zone
Schools:     gis-mdc.opendata.arcgis.com/datasets/elementary-school-attendance-boundary
Crime:       gis-mdc.opendata.arcgis.com/maps/d260bfad798a4f868d277990511620cc
Permits:     gis-mdc.opendata.arcgis.com/datasets/building-permit
Zoning:      gis-mdc.opendata.arcgis.com/datasets/county-zoning-1
Transit:     miamidade.gov/global/transportation/open-data-feeds.page
Evacuation:  gis-mdc.opendata.arcgis.com/datasets/hurricane-evacuation-zone
Sea Level:   coast.noaa.gov/slrdata/
HOA/Condo:   wwwx.miamidade.gov/Apps/RER/carbr/
Census:      api.census.gov + geocoding.geo.census.gov
Broadband:   broadbandmap.fcc.gov/data-download
Walk Score:  walkscore.com/professional/api.php
```

### What This Means for the Product

For ANY address in Miami-Dade, we can automatically assemble:
- Which school your kids would attend (with letter grade)
- What your taxes would be (millage rate × assessed value)
- Whether you're in a flood zone (and estimated insurance cost)
- Whether you're in a hurricane evacuation zone (and which category)
- How high above sea level you are (1-meter resolution)
- What the crime rate is within half a mile
- Nearest fire station and avg response time
- Bus/rail stops within walking distance
- Walk/bike/transit scores
- Active building permits and code violations
- Whether the condo association has done its structural inspection (post-Surfside)
- Restaurant health inspection scores nearby
- Broadband availability and speeds
- Airport noise exposure
- Historical designation (and tax benefits)
- Opportunity zone status (for investors)
- Brownfield/Superfund proximity

**All from free public data. All joinable by folio number or lat/lng. All queryable via ArcGIS REST APIs.**

### Cost to Assemble Per Property: ~$0.10-0.50

Most layers are free spatial queries. The only paid elements:
- Walk Score API: free tier available
- Clerk API (deeds): $0.20/call
- Property Appraiser bulk: $50/file

At scale (928K properties), the per-property cost approaches zero because the spatial layers are queried once and cached.
