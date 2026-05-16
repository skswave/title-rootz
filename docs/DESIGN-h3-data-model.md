# H3 Hexagonal Data Model for Property Intelligence
## The Right Architecture for 967K Properties

### Why H3 Hexagons

Property data has two types:
- **Property-specific**: owner, building details, title chain, liens — unique per folio
- **Neighborhood-shared**: schools, crime, flood zone, demographics, amenities — shared by nearby properties

Duplicating neighborhood data in every property file wastes storage and makes updates expensive. Instead, we use **Uber's H3 hexagonal indexing** to assign every property to a hex cell, then pre-compute the neighborhood data once per hex.

### The Model

```
┌─────────────────────────────────────────────────┐
│ LEVEL 1: PROPERTY (per folio)                    │
│ Key: folio number (0232020040540)                │
│ Data: owner, building, lot, title, liens         │
│ Size: ~1KB per property                          │
│ Count: 967,000 (Miami-Dade)                      │
│ Source: County GIS (already pulled)              │
├─────────────────────────────────────────────────┤
│ LEVEL 2: H3 HEX (shared neighborhood)           │
│ Key: H3 index at resolution 9                    │
│ Data: schools, crime, demographics, amenities,   │
│       walk score, transit, nearest services       │
│ Size: ~2-4KB per hex                             │
│ Count: ~19,000 hexes covering Miami-Dade         │
│ Source: Census, FEMA, school boundaries, etc.     │
│ Update: quarterly or when source data changes    │
├─────────────────────────────────────────────────┤
│ LEVEL 3: ZONE (spatial overlay)                  │
│ Key: zone ID (flood zone, evacuation zone, etc.) │
│ Data: FEMA zone, BFE, evacuation category        │
│ Size: varies                                     │
│ Count: ~500 zones in Miami-Dade                  │
│ Source: FEMA, county GIS                         │
├─────────────────────────────────────────────────┤
│ LEVEL 4: JURISDICTION (city/county)              │
│ Key: municipality name                           │
│ Data: tax rates, city services, ordinances        │
│ Size: ~1KB per municipality                      │
│ Count: 34 municipalities + unincorporated        │
│ Source: County records                           │
└─────────────────────────────────────────────────┘
```

### H3 Resolution 9

- Each hex = ~0.1 km² (~25 acres)
- Covers roughly one neighborhood block
- 20-50 properties per hex in residential areas
- Perfect granularity for school zones, crime stats, demographics

### Query Flow

```
Agent asks: "Tell me about 7830 Atlantic Way, Miami Beach"

Step 1: Folio lookup → 0232020040540
  → Returns: owner, building (3bd/3ba, 3623sqft, 2019), lot (6250sqft)
  
Step 2: Lat/lng → H3 index → 892a100d2cbffff
  → Returns pre-computed hex data:
    School: Biscayne Beach Elementary (B, 0.3mi)
    Demographics: pop 489, median HHI $70K, 54% owner-occupied
    Walk Score: 60
    Crime: low (island residential)
    Nearest grocery: Publix 0.8mi
    Nearest hospital: Mt Sinai 2.5mi

Step 3: Spatial zone lookup → flood zone AE, evac zone A
  → Returns: BFE 8ft, flood insurance required, evacuate Cat 1+

Step 4: Jurisdiction → Miami Beach
  → Returns: millage 17.0, no short-term rental without permit

ASSEMBLED IN: <50ms (all hash lookups, no spatial queries)
```

### Why This Matters for 8,500 Agents

An agent in the field asks their AI about ANY Miami-Dade property:
- **Without Origin**: AI searches Google, gets generic results, says "check Zillow"
- **With Origin**: AI queries our API, gets the complete package in milliseconds

At 967K properties × 29 fields = Level 1 is pre-built.
At 19K hexagons × pre-computed neighborhood = Level 2 is instant.
No per-query spatial computation needed.

### Connection to ReefRootz / Origin Local

We already use H3 in two other Rootz products:
- **ReefRootz**: H3 hex grid for reef monitoring data (dive sites, observations)
- **Origin Local**: H3 for Ocala venue data (events, GeoMerkle tree)

Same library (h3-js), same resolution approach, same spatial pattern.
The property intelligence product joins the H3 family.

### Data Size Estimate

| Layer | Records | Size Each | Total |
|-------|---------|-----------|-------|
| Properties (Level 1) | 967,000 | 1 KB | ~1 GB |
| H3 Hexagons (Level 2) | 19,000 | 3 KB | ~57 MB |
| Zones (Level 3) | 500 | 5 KB | ~2.5 MB |
| Jurisdictions (Level 4) | 35 | 1 KB | ~35 KB |
| **Total index** | | | **~1.06 GB** |

Fits comfortably on the server (41 GB free). Fits in memory for fast queries.
