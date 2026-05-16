# Massachusetts Property Data Sources — Complete Inventory
## Compiled April 19, 2026

A truly complete Massachusetts property record requires data from **at least 15 independent sources**.

## The Property Record Stack

| Layer | Primary Source | Machine-Readable? |
|-------|---------------|-------------------|
| Ownership chain | Registry of Deeds (masslandrecords.com) | Scanned images (OCR needed) |
| Registered land (~15% of Suffolk) | Land Court | Paper/PDF |
| Assessed value + building details | Town assessor (Vision/AxisGIS) | HTML scrape only |
| Parcel geometry + assessor attributes | **MassGIS Level 3 parcels** | **Shapefile/GDB — best source** |
| Tax obligations | Town tax collector / MLC | PDF/paper |
| Corporate ownership (LLCs) | Secretary of State | HTML scrape |
| Environmental restrictions | MassDEP (21E sites, AULs, wetlands) | HTML + Shapefile |
| Flood zone | FEMA NFHL | **Shapefile + REST API** |
| Soil/septic suitability | USDA Web Soil Survey | **Shapefile + REST API** |
| Building permits | Town building dept | Paper (mostly) |
| Court cases (probate, liens) | MassCourts / Land Court / PACER | HTML/PDF |
| Historic designation | MACRIS (MA Historical Commission) | HTML/PDF |
| Market value | Zillow/Redfin/MLS/Warren Group | HTML scrape or commercial API |
| Demographics | Census ACS | **JSON API** |
| Rare species habitat | NHESP via MassGIS | **Shapefile** |

## Best Programmatic Sources (API or structured download)

| Source | URL | Format | Notes |
|--------|-----|--------|-------|
| **MassGIS Parcels** | gis.data.mass.gov | Shapefile, GDB, REST | Parcel boundaries + assessor attributes, ~80% of towns, updated 2x/year |
| **Boston Assessor** | assessing.boston.gov | **CSV bulk download** | One of best public datasets in state |
| **Boston Open Data** | data.boston.gov | CSV, JSON, Socrata API | Permits, parcels, everything |
| **FEMA NFHL** | msc.fema.gov | Shapefile, GDB, REST API | Flood zones by address |
| **Census ACS** | data.census.gov | JSON API (free key) | Demographics, housing characteristics |
| **USDA Soil Survey** | websoilsurvey.nrcs.usda.gov | Shapefile, REST API (SDA) | Soil types, drainage, septic suitability |
| **EPA Envirofacts** | enviro.epa.gov | JSON, XML, CSV REST API | Superfund, RCRA, toxic releases |
| **EDGAR (SEC)** | sec.gov | JSON, XML, XBRL | REIT property holdings |
| **Redfin Data Center** | redfin.com | CSV downloads | Aggregate market data |

## Worst Sources (paper/in-person only)

- Small-town building permits (Lenox, Richmond, Great Barrington)
- Land Court registered land certificates
- Municipal Lien Certificates ($25-50 each, required for every sale)
- MLS interior photos/agent remarks (agent access only)

## Town Assessor Vendors (Berkshire County)

| Town | Vendor | URL |
|------|--------|-----|
| Richmond | AxisGIS | axisgis.com/richmondma/ |
| Lenox | AxisGIS | axisgis.com/LenoxMA/ |
| Pittsfield | Vision Government Solutions | vgsi.com |
| Great Barrington | Vision Government Solutions | vgsi.com |
| Boston | City assessor | assessing.boston.gov |

All town assessor databases are scrape-only — no public APIs.

## Commercial Aggregators (Shortcut)

| Source | Data | Pricing |
|--------|------|---------|
| **Warren Group** (thewarrengroup.com) | THE commercial source for MA property data — sales, mortgages, foreclosures, assessments. Most title companies buy from them | Subscription $$$ |
| **ATTOM Data** (attomdata.com) | National property database — sales, tax, mortgage, foreclosure, hazard | REST API, paid |
| **CoreLogic** | Title plant data, MLS aggregation | Enterprise |

## Critical Findings for Title Insurance

### Things the Registry MISSES
1. **Activity & Use Limitations (AULs)** from 21E cleanup sites — legally binding property restrictions that don't always appear in deeds
2. **Water/sewer liens** — only appear on Municipal Lien Certificate, not in registry
3. **LLC beneficial owners** — registry shows LLC name, Secretary of State reveals members
4. **Registered Land** (~15% of Suffolk County) — completely separate system from recorded deeds
5. **Chapter 61/61A/61B** — forestry/agriculture/recreation tax classification gives town right of first refusal on sale

### The Municipal Lien Certificate (MLC)
The single most authoritative document for what a property owes. Captures: taxes, water, sewer, betterments, trash fees. **Required for every sale.** Costs $25-50 per request from town collector.

## Origin Model Advantage

Today: A title examiner manually searches 5-15 of these sources, taking 2-8 hours per property.

With Origin: An AI queries one structured dataset that aggregates all sources, returning a complete property profile in seconds.

**No one has built this aggregated, AI-readable dataset for Massachusetts yet.**
