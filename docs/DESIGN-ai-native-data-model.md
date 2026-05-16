# Design: AI-Native Data Model — How Should Property Data Be Stored for the AI Future?

## The Question

We're storing 10.8M parcels as grep-searchable JSONL files and 908K court records in SQLite. Is that right? Or are we just doing what every developer has done since 1970 — relational tables and flat files — because that's what we know?

The AI doesn't query like a human. It doesn't write SQL. It doesn't browse tables. It asks questions in natural language, gets structured answers, and builds understanding across multiple calls. What data model serves THAT?

## How AI Actually Talks to Data

### What AI Does Well
- Understands context from structured JSON responses
- Follows links (URLs, references, IDs) across multiple calls
- Reasons about relationships described in text
- Remembers what it learned earlier in a conversation
- Asks follow-up questions to narrow down

### What AI Does Poorly
- Scanning millions of rows to find patterns
- Aggregating across large datasets (COUNT, SUM, AVG)
- Joining tables it can't see
- Understanding schema it hasn't been told about
- Dealing with inconsistent field names across sources

### What AI Needs from a Data Layer
1. **Semantic search** — "find me properties where the owner might be ready to sell" not `WHERE farming_score > 40`
2. **Pre-computed intelligence** — don't make the AI calculate, give it the answer
3. **Context-rich responses** — one API call returns the full story, not raw fields
4. **Linkable depth** — summary first, detail on demand via URL
5. **Self-describing data** — the response explains what it means, not just what it contains

## Three Data Model Paradigms

### 1. Traditional (What We Have Now)
```
JSONL files → grep search → field mapping → JSON response
SQLite tables → SQL query → join → JSON response
```
**Pros**: Fast, simple, proven, cheap
**Cons**: AI has to know the schema, field names, query patterns. Every new data source requires new query code. No semantic understanding.

### 2. Document Store (MongoDB/ElasticSearch model)
```
One document per property → all data embedded → full-text searchable
```
**Pros**: One query returns everything. Full-text search works like natural language.
**Cons**: Expensive at scale. Denormalized = storage bloat. Updates are complex.

### 3. AI-Native: The Property Intelligence Document

**What if each property IS a document — a self-describing, pre-computed intelligence package that any AI can read and understand without knowing our schema?**

```json
{
  "@context": "https://title.rootz.global/schema/property-intelligence/v1",
  "@type": "PropertyIntelligence",
  
  "summary": "Single family home in Fort Lauderdale, built 1953, assessed at $424,820. Owner DEJULIO SALVATORE is not living at the property and has no homestead exemption. Broward County court records show a pre-foreclosure filing from January 2025, followed by a foreclosure judgment in August 2025, and the property was transferred to a new owner in October 2025. The house has since been demolished. High flood risk area (Zone AE, 4.83ft elevation vs 6ft base flood).",
  
  "farmingScore": {
    "score": 40,
    "rating": "MEDIUM",
    "interpretation": "This property has moderate farming potential. The foreclosure process has completed and the property transferred, so direct seller outreach is no longer relevant. However, the new owner may be a developer prospect.",
    "signals": [
      "Litigation pending (pre-foreclosure) — filed 01/02/2025",
      "Foreclosure judgment entered",
      "No homestead — not primary residence"
    ]
  },
  
  "property": { ... },
  "owner": { ... },
  "courtRecords": { ... },
  "neighborhood": { ... },
  "provenance": { ... },
  
  "relatedQueries": [
    { "question": "What happened to this property?", "url": "/api/fl/search?address=..." },
    { "question": "Are there similar foreclosures nearby?", "url": "/api/fl/farm?city=FORT+LAUDERDALE&signals=lis_pendens" },
    { "question": "Who owns it now?", "url": "/api/fl/cross-ref/owner-intel?address=..." }
  ]
}
```

The AI reads the `summary` field and understands the property WITHOUT parsing 50 fields. The `relatedQueries` tell it what to ask next. The `interpretation` explains what the score means in human terms.

## The Insight: Two Layers

The data model should have TWO layers:

### Layer 1: Raw Data Lake (for harvesting and computation)
This is the JSONL files, SQLite databases, and flat files we have now. Optimized for:
- Bulk ingestion from government sources
- Fast grep/query for known addresses
- Batch computation (farming scores, signal detection)
- Provenance tracking (hashes, timestamps, source URLs)

**This layer is for US (the developers and harvesters). AI never touches it directly.**

### Layer 2: Intelligence Documents (for AI consumption)
Pre-computed, self-describing property intelligence packages. Optimized for:
- Natural language understanding (summary field)
- One-call completeness (everything in one response)
- Semantic linking (relatedQueries, bridgePageUrl)
- Schema-free consumption (AI reads the summary, doesn't parse fields)
- Context continuity (the document IS the memory object)

**This layer is for AI. Humans can read it too (bridge pages), but it's designed for machines.**

## How This Changes the Architecture

### Current Flow (AI has to understand our schema)
```
Agent asks question
  → AI calls /api/fl/farm?city=X&signals=Y
  → API greps JSONL, queries SQLite, computes score
  → Returns raw JSON with 25 fields per prospect
  → AI has to figure out what the fields mean
  → AI has to decide what to tell the agent
```

### AI-Native Flow (AI reads a story)
```
Agent asks question
  → AI calls /api/fl/farm?city=X&signals=Y
  → API returns Intelligence Documents with summaries
  → AI reads the summary: "248 properties with probate filings..."
  → AI reads each prospect's interpretation: "Owner passed away, heirs in Cooper City..."
  → AI already knows what to tell the agent
  → AI includes bridge page URLs for the agent to explore
```

The difference: we do the THINKING at computation time (when we build the intelligence document), not at query time (when the AI is trying to make sense of raw fields).

## Pre-Computed Summaries

The key innovation: **generate natural language summaries at index time, not at query time.**

When we harvest Broward clerk data and detect a lis pendens + probate + death certificate on the same property, we don't just store `{signal: "lis_pendens", signal: "probate", signal: "death"}`. We compute:

```
"Owner passed away (death certificate August 2025). Estate entered probate (case PR-C-25-001631, April 2025). Heirs live in Cooper City, 15 minutes from the property. Pre-foreclosure litigation filed by Pennymac Loan Services. Property is assessed at $313,140 with no homestead exemption. The heirs are likely sitting on this property without the means or motivation to maintain it."
```

This costs us ~$0.001 per property to generate with Claude Haiku at harvest time. For 1,000 high-score properties, that's $1. And every AI that ever reads this property — GPT, Claude, Grok, Gemini — gets the full story in one field.

## Schema Design

### Property Intelligence Document (v1)

```json
{
  "@context": "https://title.rootz.global/schema/v1",
  "@type": "PropertyIntelligence",
  "@id": "https://title.rootz.global/p/farm?address=X&city=Y",
  
  "summary": "Natural language summary of the property and its farming potential",
  
  "farmingScore": {
    "score": 0-100,
    "rating": "HIGH|MEDIUM|LOW",
    "interpretation": "What this score means for a farming agent",
    "signals": ["plain English signal descriptions"]
  },
  
  "property": {
    "address": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "type": "Single Family|Condo|Multi-Family|...",
    "yearBuilt": number,
    "livingArea": number,
    "lotSize": number,
    "assessedValue": number,
    "landValue": number,
    "buildingValue": number
  },
  
  "owner": {
    "name": "string",
    "mailingAddress": {
      "address": "string",
      "city": "string", 
      "state": "string",
      "zip": "string"
    },
    "ownerOccupied": boolean,
    "outOfState": boolean,
    "corporate": boolean,
    "homestead": boolean,
    "trustOrEstate": boolean
  },
  
  "salesHistory": [
    { "date": "string", "price": number }
  ],
  
  "equity": {
    "estimated": number,
    "percentage": number,
    "interpretation": "string"
  },
  
  "courtRecords": {
    "county": "string",
    "coverage": "string",
    "filings": [
      {
        "type": "Litigation Pending|Probate|Lien|...",
        "date": "string",
        "caseNumber": "string",
        "parties": ["string"],
        "matchConfidence": "confirmed|name_match",
        "interpretation": "What this filing means"
      }
    ]
  },
  
  "neighborhood": {
    "floodZone": { "zone": "string", "risk": "string", "insuranceCost": "string" },
    "elevation": number,
    "schools": [{ "name": "string", "type": "string", "distance": number }],
    "demographics": { "medianIncome": number, "medianHomeValue": number },
    "recentPermits": [{ "type": "string", "date": "string" }]
  },
  
  "provenance": {
    "hash": "string",
    "sources": ["string"],
    "confidence": number,
    "assembled": "ISO date",
    "freshness": "string"
  },
  
  "actions": {
    "bridgePage": "URL",
    "csvExport": "URL",
    "mailerExport": "URL",
    "farmMap": "URL",
    "ownerLookup": "URL",
    "relatedProperties": "URL"
  }
}
```

## Implementation Strategy

### Phase 1: Add summaries to existing API responses
- Generate `summary` and `interpretation` fields in farmingSearch and assemblePropertyIntelligence
- Template-based first (no AI cost), AI-generated later for high-score properties
- Add `actions` block with pre-built URLs

### Phase 2: Pre-compute intelligence documents for high-score properties
- Nightly batch: find all properties with score > 50
- Generate AI summaries for top 1,000 per city using Claude Haiku
- Store as JSON documents in a `/intelligence/` directory
- Serve pre-computed documents when available, compute on-demand for the rest

### Phase 3: Semantic search
- Index summaries and interpretations for full-text search
- Agent types "find me elderly couples who might downsize in Coral Springs"
- System searches summaries, not database fields
- Returns properties whose stories match the query

### Phase 4: Cross-property intelligence
- "Show me all properties owned by the same LLC"
- "Find neighborhoods where multiple properties are in probate"
- "Which streets have the most foreclosure activity?"
- These are computed at harvest time and stored as relationship documents

## What This Means for the Harvester Framework

Each harvester doesn't just pull data — it also:
1. **Normalizes** to the standard schema
2. **Enriches** with cross-references (clerk signals, flood zones)
3. **Scores** using the farming algorithm
4. **Summarizes** in natural language (template or AI)
5. **Links** to related documents and actions
6. **Hashes** for provenance

The raw data goes to Layer 1 (data lake). The intelligence document goes to Layer 2 (AI consumption). Both are versioned and traceable.

## The Rootz Thesis Applied

"We make data speak AI."

That's not just an API that returns JSON. It's a data model that THINKS like AI:
- Summaries instead of field lists
- Interpretations instead of raw scores
- Stories instead of rows
- Links instead of foreign keys
- Context instead of schema

The bridge page URL is the interface. The intelligence document is the substance. The AI reads the story and helps the agent.

## Storage Comparison

| Approach | 10.8M Properties | Cost | AI Readability |
|----------|-----------------|------|----------------|
| Current (JSONL + SQLite) | 12GB + 448MB | $0 | Low — AI must parse fields |
| + Pre-computed summaries | +2GB (JSON) | ~$10 for AI summaries | High — AI reads stories |
| Full document store (Elastic) | ~50GB | $100+/mo hosting | Medium — searchable but complex |
| Intelligence docs (our model) | 12GB raw + 5GB intelligence | ~$10 one-time + $1/day batch | Highest — self-describing |

The intelligence layer is CHEAP. We already have the raw data. Generating summaries for the top 10,000 prospects costs $10. Maintaining daily updates costs $1/day. The value creation is enormous.
