# Design: AI Farming Interface

## Architecture

```
Agent's browser
    → title.rootz.global/farm (React/vanilla JS chat UI)
    → POST /farm/chat { message, sessionId }
    → Server: Claude Haiku/Sonnet API with tool_use
    → Tools call fl-query.mjs functions LOCALLY (same process)
    → Streaming response back to browser via SSE
```

### Why This Architecture
- **Zero per-seat AI cost** — Rootz pays API per-token, bundles in subscription
- **Zero agent setup** — browser only, no ChatGPT/Claude subscription needed
- **Same server** — tools call local functions, no HTTP latency for data
- **You own the UX** — branded, farming-specific, not generic ChatGPT

## System Prompt (for Claude API)

```
You are a real estate farming assistant powered by Title Rootz Global. You help Florida real estate agents identify properties that are likely to come on the market — before they're listed.

## Your Data
You have access to 10.8 million Florida property records covering all 67 counties. Each record includes: owner name, mailing address, physical address, assessed value, last sale price/date, year built, living area, homestead status, and fiduciary/trust information.

You also have: FEMA flood zones (nationwide), school locations, hospital locations, census demographics, IRS income by ZIP, building permits (select counties), and code enforcement data.

## Farming Signals You Can Detect
These patterns indicate a property may come on the market:
- Absentee owner: mailing address ≠ property address (not living there)
- Out-of-state owner: mailing state ≠ FL (managing from afar)
- Corporate/LLC owner: investment property, may rotate out
- Trust/estate owner: probate settlement, heirs may sell
- Long-term owner: 15+ years since last sale (life changes)
- High equity: market value significantly exceeds last sale price
- Nominal transfer: $0-100 sale (estate transfer, likely free & clear)
- Senior exemption: aging owner, may downsize
- No homestead: not primary residence
- Vacant lot: no building, development or land banking

## How to Respond
1. When an agent asks about a specific address, look it up and explain what the data means for farming potential
2. When an agent asks about a city/area, summarize the farming opportunity (total parcels, top signals)
3. Always explain WHY a signal matters — agents need to understand the story behind the data
4. Suggest talking points for contacting the owner based on the signals
5. Never fabricate data — if you don't have information, say so
6. Be concise — agents are busy, give them actionable intelligence

## Owner Intelligence
When a property is owned by an LLC or corporation, you can unmask the actual officers behind the entity using Florida Sunbiz business registry cross-reference. This tells you who to actually contact.

## Important
- All data comes from Florida Department of Revenue and county government sources
- Values shown are government assessed values, not market estimates
- Data refreshes monthly from DOR statewide bulk files
- Skip trace (phone/email) is not yet available — use the owner name + mailing address
```

## Tool Definitions (for Claude API tool_use)

```json
[
  {
    "name": "search_florida_property",
    "description": "Search for a Florida property by address and city. Returns owner, value, sale history, building details, investor signals, flood zone, and demographics.",
    "input_schema": {
      "type": "object",
      "properties": {
        "address": { "type": "string", "description": "Street address (e.g., '179 Harbor Dr')" },
        "city": { "type": "string", "description": "City name (e.g., 'Key Biscayne')" }
      },
      "required": ["address", "city"]
    }
  },
  {
    "name": "search_ohio_property",
    "description": "Search for an Ohio property by address and city. Returns owner, value, sale history, and investor signals.",
    "input_schema": {
      "type": "object",
      "properties": {
        "address": { "type": "string", "description": "Street address" },
        "city": { "type": "string", "description": "City name" }
      },
      "required": ["address", "city"]
    }
  },
  {
    "name": "get_flood_zone",
    "description": "Check FEMA flood zone for any US location by latitude/longitude.",
    "input_schema": {
      "type": "object",
      "properties": {
        "lat": { "type": "number", "description": "Latitude" },
        "lng": { "type": "number", "description": "Longitude" }
      },
      "required": ["lat", "lng"]
    }
  },
  {
    "name": "get_schools_nearby",
    "description": "Find schools near a location. Returns school name, type, enrollment, distance.",
    "input_schema": {
      "type": "object",
      "properties": {
        "lat": { "type": "number" },
        "lng": { "type": "number" },
        "radius": { "type": "number", "description": "Search radius in miles (default 5)" }
      },
      "required": ["lat", "lng"]
    }
  },
  {
    "name": "get_census_demographics",
    "description": "Get census demographics for an address: median income, home values, vacancy rate, population.",
    "input_schema": {
      "type": "object",
      "properties": {
        "address": { "type": "string" },
        "city": { "type": "string" }
      },
      "required": ["address", "city"]
    }
  },
  {
    "name": "get_building_permits",
    "description": "Search building permits by address. Available for Miami-Dade, Broward, and Brevard counties.",
    "input_schema": {
      "type": "object",
      "properties": {
        "address": { "type": "string" }
      },
      "required": ["address"]
    }
  },
  {
    "name": "unmask_llc_owner",
    "description": "Cross-reference a property owner (LLC/Corp) with Florida Sunbiz to find the actual officers, filing date, and succession signals.",
    "input_schema": {
      "type": "object",
      "properties": {
        "address": { "type": "string" },
        "city": { "type": "string" }
      },
      "required": ["address", "city"]
    }
  },
  {
    "name": "get_market_economics",
    "description": "Get Florida market economics: median price trends, active listings, days on market, unemployment.",
    "input_schema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  }
]
```

## Tool Implementation (server-side)

Each tool maps to an existing function in fl-query.mjs or server.mjs:

| Tool | Implementation |
|------|---------------|
| `search_florida_property` | `lookupByAddress(address, city)` → `getInvestorSignals()` → `getFloodZone()` → `getCensusData()` |
| `search_ohio_property` | `ohLookupByAddress(address, city)` |
| `get_flood_zone` | `getFloodZone(lat, lng)` |
| `get_schools_nearby` | `getNearbySchools(lat, lng, radius)` |
| `get_census_demographics` | `getCensusData(address, city)` |
| `get_building_permits` | `getPermits(address)` |
| `unmask_llc_owner` | `crossRefOwnerIntel(address, city)` |
| `get_market_economics` | `getMarketEconomics()` |

**Key advantage**: These are LOCAL function calls, not HTTP round-trips. The Claude API tool_use response triggers a function call on the same Node.js process that serves the data.

## Chat UI Design

### Minimal viable interface:
```
┌─────────────────────────────────────────────────────┐
│  🏡 Title Rootz — AI Farming Assistant              │
│  Coverage: 10.8M FL parcels | All 67 counties       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Suggested prompts]                                │
│  "Find farming prospects in Coral Springs"          │
│  "Analyze 123 Main St, Fort Myers"                  │
│  "Who owns this LLC property?"                      │
│  "Show me absentee owners in ZIP 33076"             │
│                                                     │
│  ─── Chat messages ───                              │
│                                                     │
│  Agent: Tell me about 6580 Sherry Ln, Hilliard      │
│                                                     │
│  AI: Here's what I found...                         │
│  📍 6580 Sherry Ln, Hilliard OH                     │
│  Owner: [name]                                      │
│  Assessed: $245,000 (land $65K + building $180K)    │
│  Last Sale: 2018 for $189,000 (+$56K equity)        │
│  Homestead: Yes (owner-occupied)                    │
│  Flood: Zone X (minimal risk)                       │
│  Schools: Hilliard City Schools                     │
│                                                     │
│  Farming Verdict: LOW PRIORITY                      │
│  Recent purchase, owner-occupied, homesteaded.      │
│  Check back in 5+ years.                            │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Type your question...                    ] [Send] │
└─────────────────────────────────────────────────────┘
```

### Features:
- Streaming responses (SSE from Claude API)
- Suggested prompts for new users
- Export to CSV button on prospect lists
- Session memory (conversation context persists)
- Mobile-responsive (agents on phones)

## API Route: POST /farm/chat

```javascript
// In server.mjs, add farming chat endpoint
app.post('/farm/chat', async (req, res) => {
  const { message, sessionId, history } = req.body;
  
  // Set up SSE for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  
  // Call Claude API with tool_use
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001', // cheapest, fast, good enough
    max_tokens: 2048,
    system: FARMING_SYSTEM_PROMPT,
    tools: FARMING_TOOLS,
    messages: history.concat([{ role: 'user', content: message }]),
    stream: true
  });
  
  // Handle tool_use responses
  for await (const event of response) {
    if (event.type === 'content_block_delta') {
      res.write(`data: ${JSON.stringify(event.delta)}\n\n`);
    }
    if (event.type === 'tool_use') {
      // Execute tool locally
      const result = await executeTool(event.name, event.input);
      // Continue conversation with tool result
      // ...
    }
  }
  
  res.end();
});
```

## Subscription Tiers

| Tier | Price | Includes | Target |
|------|-------|----------|--------|
| **Starter** | $29/mo | 100 searches/day, FL statewide, signals, export CSV | Individual agent |
| **Pro** | $49/mo | Unlimited searches, LLC unmasking, demographics, permits | Active farmer |
| **Team** | $199/mo | 10 seats, shared prospect lists, CRM export | Brokerage team |
| **Training** | $2,500/mo | Unlimited seats, usage dashboard, custom branding | Steph's program |

### Economics at Scale
- 1,100 agents × Training tier = $2,500/mo (Steph pays, agents included)
- AI cost at 1,100 agents × 20 queries/day = ~$1,320/mo
- Margin: ~$1,180/mo on training tier
- If agents graduate to individual Pro ($49/mo): 100 agents = $4,900/mo

## ChatGPT Custom GPT (Demo for Steph)

### GPT Configuration
- **Name**: Title Rootz Farming Assistant
- **Description**: AI-powered property farming for Florida real estate agents. Search 10.8M parcels across all 67 counties.
- **Instructions**: [Same system prompt as above]
- **Actions**: Import `title.rootz.global/openapi.json`
- **Authentication**: None (public API) or API key for rate limiting
- **Conversation Starters**:
  - "Find absentee owners in Coral Springs, FL"
  - "Analyze 179 Harbor Dr, Key Biscayne"
  - "Show me trust/estate properties in Naples"
  - "Who's behind the LLC that owns 456 Ocean Blvd?"

### Testing Plan
1. Create GPT at chat.openai.com/gpts
2. Add OpenAPI spec as Action
3. Test with Steph's real addresses (Hilliard, OH from Connected Investors CSV)
4. Test with FL addresses she's actively farming
5. Compare results vs Connected Investors side-by-side

## Next Steps
1. [ ] Build /farm/chat endpoint in server.mjs (Claude API + tool_use)
2. [ ] Build farming chat UI (HTML/JS, SSE streaming)
3. [ ] Add Stripe billing for subscriptions
4. [ ] Create ChatGPT Custom GPT for Steph demo
5. [ ] Integrate farming best practices research into system prompt
6. [ ] Add CSV export for prospect lists
7. [ ] Add session persistence (conversation history)
