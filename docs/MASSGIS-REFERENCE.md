# MassGIS Property Tax Parcels — API Reference
## Berkshire County: 76,400 parcels across 32 municipalities

### API Endpoint
```
https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Property_Tax_Parcels/FeatureServer/0
```

### Query Examples
```
# All Pittsfield parcels (no geometry)
.../query?where=CITY='PITTSFIELD'&outFields=*&returnGeometry=false&f=json

# Search by address
.../query?where=SITE_ADDR LIKE '%SWAMP%' AND CITY='RICHMOND'&outFields=*&f=json

# Count only
.../query?where=CITY='LENOX'&returnCountOnly=true&f=json

# GeoJSON with geometry
.../query?where=CITY='GREAT BARRINGTON'&outFields=*&f=geojson
```

### Key Fields (48 total)
| Field | Description |
|-------|-------------|
| SITE_ADDR | Full site address |
| CITY | Municipality |
| OWNER1 | Owner name |
| TOTAL_VAL | Total assessed value ($) |
| BLDG_VAL | Building value ($) |
| LAND_VAL | Land value ($) |
| LOT_SIZE | Lot size |
| LOT_UNITS | Acres or Sq. Ft. |
| YEAR_BUILT | Year built |
| BLD_AREA | Building area (sqft) |
| RES_AREA | Residential area (sqft) |
| STYLE | Building style |
| NUM_ROOMS | Number of rooms |
| STORIES | Number of stories |
| UNITS | Number of units |
| USE_CODE | DOR property use code |
| ZONING | Zoning district |
| LS_DATE | Last sale date |
| LS_PRICE | Last sale price |
| LS_BOOK | Last sale deed book |
| LS_PAGE | Last sale deed page |
| FY | Fiscal year |

### Berkshire County Stats
- **76,400 parcels** across 32 towns
- Total assessed value: **$29.1 billion**
- Average parcel value: $384,922
- Richmond: 1,267 parcels
- Lenox: 2,971 parcels
- Pittsfield: 18,330 parcels
- Great Barrington: 4,195 parcels

### Licensing: FREE, no restrictions on commercial use
