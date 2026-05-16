# Property Intelligence Package
## The 20-Page AI-Ready Data File Behind Every Listing

### The Concept

Print Genie prints an 11x17 glossy for a $1.2M listing. Origin provides the structured data file that any AI can use to answer any question a buyer, agent, or lender asks about that property.

Not a PDF. Not a brochure. A **structured data package** — JSON or markdown — that an AI reads and turns into whatever the audience needs:
- Buyer asks: "What are the schools like?" → AI pulls from the education layer
- Agent asks: "What's the equity story on this street?" → AI pulls from the title + assessor layer
- Lender asks: "What's the flood risk?" → AI pulls from the FEMA + climate layer
- Investor asks: "What's the rental yield potential?" → AI pulls from market + tax + demographic layer

**One data file. Infinite presentations.**

---

### The Top 10 Questions Every Buyer Wants Answered

| # | Question | Data Source | Level |
|---|----------|------------|-------|
| 1 | **What are the schools?** | School district boundaries, ratings, enrollment, test scores | Address-specific |
| 2 | **What are the taxes?** | Property tax amount, millage rate, exemptions, tax history | Property-specific |
| 3 | **Is it safe?** | Crime stats, police response times, sex offender registry | Neighborhood (0.5mi) |
| 4 | **What's the traffic like?** | Traffic counts, accident data, commute times, road projects | Street + community |
| 5 | **What's nearby?** | Shopping, restaurants, groceries, healthcare, parks | Walkability radius |
| 6 | **Will it flood?** | FEMA zone, sea level rise projections, storm surge, insurance cost | Property + zone |
| 7 | **What's the history?** | Prior sales, price appreciation, days on market, neighborhood trends | Property + area |
| 8 | **What will it cost to own?** | Taxes + insurance + HOA + utilities estimate | Property-specific |
| 9 | **Is the neighborhood growing?** | Population trends, new construction, permits, commercial development | Community/zip |
| 10 | **What's it really worth?** | Comparable sales, assessed vs market, price per sqft trends | Street + comp area |

---

### Data Layers (Property → Street → Community → County)

#### Layer 1: PROPERTY (this specific address)
```json
{
  "property": {
    "address": "1455 Ocean Dr, Miami Beach FL 33139",
    "folio": "0232310700001",
    "owner": "ERIC S WEISS TRS",
    "assessed_value": 2500000,
    "land_value": 1800000,
    "building_value": 700000,
    "year_built": 1998,
    "sqft": 2995,
    "bedrooms": 3,
    "bathrooms": 4,
    "lot_sqft": 12608,
    "zoning": "RM-2",
    "property_type": "Condominium",
    "homestead": false,
    "annual_tax": 42500,
    "tax_rate_millage": 17.0,
    "hoa_condo_fee": "varies by unit",
    "last_sale_date": "2019-03-15",
    "last_sale_price": 2200000,
    "appreciation_since_purchase": "13.6%",
    "title_chain": [...],
    "active_liens": [...],
    "confidence_score": 0.92
  }
}
```

#### Layer 2: STREET (neighbors, immediate context)
```json
{
  "street": {
    "name": "Ocean Dr, Miami Beach",
    "properties_on_block": 45,
    "avg_assessed_value": 1850000,
    "median_year_built": 1985,
    "avg_lot_size": 8500,
    "recent_sales": [
      { "address": "1200 Ocean Dr #401", "date": "2026-01", "price": 1750000 },
      { "address": "1500 Ocean Dr #PH", "date": "2025-11", "price": 4200000 }
    ],
    "avg_price_per_sqft": 850,
    "avg_days_on_market": 67,
    "owner_occupied_pct": 25,
    "investor_owned_pct": 75,
    "turnover_rate_5yr": "35%",
    "building_permits_last_2yr": 12,
    "code_violations_active": 3
  }
}
```

#### Layer 3: NEIGHBORHOOD (0.5-1 mile radius)
```json
{
  "neighborhood": {
    "name": "South Beach / Art Deco Historic District",
    "area_sqmi": 1.2,
    
    "schools": {
      "elementary": { "name": "South Pointe Elementary", "grade": "B+", "distance_mi": 0.4, "enrollment": 450 },
      "middle": { "name": "Nautilus Middle School", "grade": "B", "distance_mi": 1.2, "enrollment": 1200 },
      "high": { "name": "Miami Beach Senior High", "grade": "B", "distance_mi": 2.1, "enrollment": 2100 },
      "private_options": [
        { "name": "Hebrew Academy", "distance_mi": 0.8, "tuition": 22000 }
      ]
    },

    "safety": {
      "crime_index": 45,
      "national_avg": 100,
      "violent_crime_rate": "lower than city average",
      "property_crime_rate": "higher than city average (tourist area)",
      "nearest_police": "Miami Beach PD, 1100 Washington Ave (0.3 mi)",
      "nearest_fire": "Fire Station 2, 2300 Pine Tree Dr (0.8 mi)",
      "avg_response_time_min": 4.2,
      "sex_offenders_1mi": 3
    },

    "traffic": {
      "major_roads": ["A1A / Collins Ave", "MacArthur Causeway", "Julia Tuttle Causeway"],
      "avg_commute_downtown_miami": "18 min (no traffic), 35 min (rush hour)",
      "transit_options": ["Miami Beach Trolley (free)", "Metrobus routes 120, 150"],
      "nearest_metrorail": "Government Center (7 mi via causeway)",
      "walk_score": 92,
      "bike_score": 82,
      "transit_score": 65,
      "parking": "Street metered + garage at 13th & Collins"
    },

    "amenities": {
      "restaurants_within_half_mile": 85,
      "grocery": [
        { "name": "Publix", "distance_mi": 0.6 },
        { "name": "Whole Foods", "distance_mi": 1.2 }
      ],
      "parks": [
        { "name": "Lummus Park / Ocean Drive Beach", "distance_mi": 0.0 },
        { "name": "South Pointe Park", "distance_mi": 0.5 }
      ],
      "hospitals": [
        { "name": "Mount Sinai Medical Center", "distance_mi": 1.5 }
      ],
      "shopping": "Lincoln Road Mall (0.8 mi), Bal Harbour Shops (4.5 mi)"
    },

    "flood_climate": {
      "fema_zone": "AE (high risk coastal)",
      "base_flood_elevation_ft": 9,
      "flood_insurance_required": true,
      "estimated_flood_insurance_annual": 3500,
      "sea_level_rise_risk": "HIGH — Miami Beach investing $500M+ in infrastructure",
      "storm_surge_zone": "Category 1 evacuation zone",
      "king_tide_flooding": "Occasional street flooding Oct-Nov during king tides"
    }
  }
}
```

#### Layer 4: COMMUNITY / MUNICIPAL
```json
{
  "community": {
    "municipality": "Miami Beach",
    "county": "Miami-Dade",
    "population": 82890,
    "median_household_income": 52000,
    "median_home_value": 545000,
    "population_growth_5yr": "+3.2%",
    "new_construction_permits_1yr": 245,
    "commercial_development": "Convention center renovation, Hyatt Regency expansion",
    "tax_rate": {
      "county_millage": 4.7,
      "city_millage": 6.8,
      "school_millage": 5.5,
      "total_millage": 17.0,
      "comparison": "Higher than county avg (15.2) due to city services"
    },
    "utilities": {
      "water_sewer": "Miami-Dade Water & Sewer — avg $85/month",
      "electric": "FPL — avg $145/month for 2BR condo",
      "internet": "AT&T Fiber, Xfinity available",
      "waste": "Included in city taxes"
    },
    "governance": {
      "form": "Commission-Manager",
      "mayor": "Current mayor info",
      "notable_ordinances": "Short-term rental restrictions, noise curfews",
      "building_code": "Florida Building Code + Miami-Dade enhancements (hurricane rated)"
    }
  }
}
```

---

### How It's Assembled

```
PROPERTY LAYER:
  Source: Miami-Dade GIS (free) + Property Appraiser + Clerk API ($0.20)
  Method: Pull by folio/address, cross-reference
  
STREET LAYER:  
  Source: Same GIS — query surrounding parcels by proximity
  Method: Spatial query within 500ft, aggregate stats
  
NEIGHBORHOOD LAYER:
  Source: Multiple free APIs:
    Schools → greatschools.org API or NCES data
    Crime → local PD open data or CrimeMapping.com
    Traffic → FDOT traffic counts + Google/HERE APIs  
    Amenities → OpenStreetMap / Overpass API (free)
    Flood → FEMA NFHL REST API (free)
    Walk/bike/transit scores → walkscore.com API
    
COMMUNITY LAYER:
  Source: Census ACS (free API) + county open data
  Method: Join by census tract/zip code
```

**Total cost to assemble per property: ~$0.50-1.00**
- $0.20 for Clerk API (deed chain)
- $0.00 for GIS property data
- $0.00 for Census/FEMA/schools
- $0.30-0.80 for third-party APIs (walk score, crime, amenities)

---

### The Output Formats

#### For AI Consumption (the core product)
```
property-intelligence/
├── 1455-ocean-dr-miami-beach.json    (structured, all layers)
├── 1455-ocean-dr-miami-beach.md      (human-readable markdown)
└── 1455-ocean-dr-provenance.json     (SSL certs, hashes, timestamps)
```

#### For Print Genie (the 11x17)
AI reads the JSON → generates customized marketing copy:
- "Steps from Lummus Park Beach, in Miami Beach's iconic Art Deco district"
- "Walk Score 92 — daily errands without a car"
- "South Pointe Elementary (B+) just 0.4 miles"
- "$42,500 annual taxes | $3,500 flood insurance | ~$230/month condo"

#### For Agent's AI Assistant
```
Agent: "Tell me about 1455 Ocean Dr for my client who has two kids"

AI (reading the intelligence package):
"This is a 3BR/4BA condo on Ocean Drive in the Art Deco district,
 listed at $2.5M. Built 1998, 2,995 sqft.

 For your client with kids:
 - South Pointe Elementary is 0.4 miles away, rated B+
 - Nautilus Middle is 1.2 miles, rated B  
 - Lummus Park beach is literally across the street
 - Walk score 92 — very walkable for daily life
 
 Concerns to flag:
 - FEMA Zone AE — flood insurance required (~$3,500/yr)
 - 75% investor-owned building — may affect financing
 - No homestead exemption currently claimed
 - Sea level rise risk rated HIGH by Miami-Dade
 
 Price context:
 - Last sold 2019 for $2.2M (13.6% appreciation)
 - Comparable sales on Ocean Dr: $850/sqft average
 - At 2,995 sqft × $850 = $2.55M — listing is at market"
```

That response is ONLY possible because the AI has the structured intelligence package. Without it, the AI would say "I'd recommend checking Zillow and the local school district website."

---

### Scale Economics

| Volume | Cost/Property | Revenue/Property | Margin |
|--------|-------------|-----------------|--------|
| One-off lookup | $1.00 | $5.00 | $4.00 |
| Street pull (10 properties) | $0.70 each | $2.00 each | $13.00 total |
| Agent subscription (50/month) | $0.50 each | $25/month flat | $0/month |
| Title company (500/month) | $0.40 each | $200/month flat | $0/month |
| Print Genie integration (10K/month) | $0.30 each | $0.50 each | $2,000/month |

At scale (100K properties/month through Print Genie):
- Cost: $30,000/month
- Revenue: $50,000/month  
- Net: $20,000/month recurring
- PLUS: every property enriches the cached dataset

---

### What Makes This Different From Zillow/Redfin/PropStream

| Feature | Zillow/Redfin | PropStream | Origin Intelligence |
|---------|-------------|-----------|-------------------|
| Property data | Yes (MLS focused) | Yes (investor focused) | Yes (title + assessor + GIS) |
| School info | Generic | No | **Specific school assignments with ratings** |
| Crime data | Generic "safety score" | No | **Actual crime stats + response times** |
| Flood risk | Basic zone | Basic | **FEMA zone + sea level rise + insurance est** |
| Title chain | No | No | **Full deed chain with cross-references** |
| Liens/encumbrances | No | Some | **Active liens matched to discharges** |
| Confidence score | No | No | **Multi-source verification score** |
| AI-readable | No (HTML scraping) | API (expensive) | **Structured JSON, MCP tools** |
| Street context | Comparable sales | Filters | **Every neighbor's full profile** |
| Customizable for audience | No | No | **AI generates buyer/agent/lender views** |
| Provenance/verification | None | None | **SSL-attested, hash-anchored** |

**Zillow tells you the price. PropStream finds the deal. Origin tells you the STORY — and proves it's true.**
