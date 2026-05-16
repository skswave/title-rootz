# AI-Powered Farming for Real Estate Agents

## What Is Farming?

Farming is a real estate prospecting strategy where agents systematically work a geographic area to identify properties likely to come on the market — before they're listed. The best farming agents know about potential sellers before anyone else.

**Traditional farming**: Drive neighborhoods, check tax records one by one, buy lists from data brokers, mail postcards.

**AI-powered farming**: Ask your AI assistant to analyze thousands of properties instantly, surface the ones with seller signals, and explain why each one is a prospect.

## The Beta Test

**Who**: Steph's training class of 1,100 Florida real estate agents
**What**: A/B test of Title Rootz farming tools against existing platforms (Connected Investors, etc.)
**Where**: All 67 Florida counties — 10.8 million parcels
**Goal**: Prove that AI + government data beats traditional list buying for farming

### What We Have That Others Don't

| Capability | Title Rootz | Typical List Broker |
|-----------|-------------|-------------------|
| Data source | FL Dept of Revenue (government) | Scraped/aggregated (unknown provenance) |
| Coverage | 10.8M parcels, all 67 FL counties | Varies, often incomplete |
| Freshness | Monthly auto-refresh from DOR | Unknown, often stale |
| AI accessible | MCP + OpenAPI + HTTP API | CSV download, manual |
| Investor signals | 12 computed signals per property | Basic filters |
| Owner intelligence | LLC unmasking via FL Sunbiz + SEC | Owner name only |
| Flood/schools/demographics | Federal overlays on every property | Separate lookup or none |
| Skip trace | Owner name + mailing address + TruePeopleSearch link | Phone/email (paid per record) |
| Provenance | SSL certificate chain from source | None |

### What They Have That We Need

| Gap | Current State | Plan |
|-----|--------------|------|
| **Skip trace (phone/email)** | Owner name + mailing address only. TruePeopleSearch link generated. | Augment with skip trace API partner (BatchSkipTracing, SkipForce, or REsimpli API) |
| **Building permits** | 3 counties only (Miami-Dade, Broward, Brevard) | Expand to all 67 FL counties via Accela + county portals |
| **Zestimate-style value** | Government assessed value (JV) | Add automated valuation model or Zillow/Redfin API |
| **Comps** | Not yet | Nearby recent sales from same parcel data |
| **CRM integration** | None | Export to CSV, webhook, or direct CRM API |
| **Mobile app** | API only | PWA or ChatGPT Custom GPT (see AI Platform section) |

## How Agents Use It

### Option 1: ChatGPT Custom GPT (Recommended for 1,100 agents)

The fastest path to 1,100 agents using Rootz data. Build a Custom GPT with:
- The OpenAPI spec from `title.rootz.global/openapi.json` as an Action
- A system prompt that teaches farming methodology
- Pre-built conversation starters: "Find farming prospects in [city]", "Analyze [address]"

**Advantages**: Zero setup for agents, shareable link, familiar ChatGPT interface
**Requires**: ChatGPT Plus ($20/mo per agent) or ChatGPT Team ($25/mo)
**Latency**: 2-5 seconds per query through Actions

### Option 2: Claude with MCP Tools

For power users who want native tool calling:
- Add `title.rootz.global` as MCP server in Claude Desktop
- Claude can call all 12 tools directly
- Best for deep analysis (chain of title, fraud detection, cross-reference)

**Advantages**: Fastest, most capable, native tool integration
**Requires**: Claude Pro ($20/mo), desktop app setup
**Best for**: Steph and team leads, not all 1,100 agents

### Option 3: Direct API via Simple Web Dashboard

Build a farming dashboard at `title.rootz.global/farm`:
- Enter a city or ZIP code
- See top farming prospects ranked by signal count
- Click to expand: full owner intel, flood zone, demographics
- Export to CSV for mailing lists

**Advantages**: No AI subscription needed, purpose-built UI
**Requires**: Frontend development (React/Vue + the existing API)
**Best for**: Agents who don't use AI tools yet

### Option 4: Google Gemini (if agents use Google Workspace)

Gemini can call external APIs via Extensions. Similar to ChatGPT Actions.
**Status**: Less mature than GPT Actions, but Google Workspace adoption is high among agents.

## Farming Playbook

### Scenario 1: "I want to farm Coral Springs"
```
Agent: "Show me farming prospects in Coral Springs, FL"

AI calls: /api/fl/search for known addresses in Coral Springs
AI response:
- 41,759 total parcels in Coral Springs
- Top signals found:
  - 3,200+ absentee owners (mailing address != property)
  - 1,800+ long-term owners (15+ years)
  - 950+ corporate/LLC owners
  - 400+ trust/estate owners
  - 280+ out-of-state owners
```

### Scenario 2: "Analyze this address I'm looking at"
```
Agent: "Tell me about 6580 Sherry Ln, Hilliard OH"

AI calls: /api/oh/search?address=6580+SHERRY+LN&city=Hilliard
AI response:
- Owner: [name], assessed at $245,000
- Last sold 2018 for $189,000 → $56K equity gain
- Homestead: yes (owner-occupied)
- Flood zone: X (minimal risk)
- School district: Hilliard City Schools
- Farming verdict: Low priority — owner-occupied, recent purchase, homesteaded
```

### Scenario 3: "Find distressed properties near me"
```
Agent: "Any foreclosure or distressed signals in Fort Myers?"

AI calls: /api/fl/search for Fort Myers addresses with signals
AI response:
- 146,235 parcels in Fort Myers
- Distress indicators:
  - Nominal transfers ($0-$100) in last 2 years: estate settlements
  - Properties with no homestead + out-of-state owner: abandoned rentals
  - Corporate owners with old filing dates: stale LLCs
```

### Scenario 4: "Who owns this LLC property?"
```
Agent: "123 Ocean Blvd is owned by Seaside Holdings LLC. Who's behind it?"

AI calls: /api/fl/cross-ref/owner-intel?address=123+OCEAN+BLVD&city=FORT_LAUDERDALE
AI response:
- Entity: SEASIDE HOLDINGS LLC, filed 2019
- Officer: Maria Torres, President
- CEO is Registered Agent → owner-operated (not institutional)
- Not SEC-registered → private individual investor
- Succession risk: moderate (single officer, no succession layer)
- Farming approach: Contact Maria Torres directly
```

## Farming Signal Priority for Agents

**Highest priority** (most likely to sell):
1. Trust/estate + no homestead → inherited property, heirs want out
2. Absentee + long-term + out-of-state → distant landlord losing interest
3. Senior exemption + high equity → ready to downsize
4. Corporate owner + nominal transfer → portfolio cleanup

**Medium priority** (worth watching):
5. Long-term owner + high equity → sitting on gains but comfortable
6. Absentee + corporate → investment property, tracks market timing
7. Vacant lot + long-term → land banking, may be ready to sell

**Lower priority** (long-term cultivation):
8. Homesteaded + recent purchase → happy owner, check back in 5 years
9. Veteran/disabled exemptions → stable, established

## Skip Trace Strategy

**What we have now**:
- Owner name (OWN_NAME) from FL DOR
- Mailing address (OWN_ADDR1, OWN_CITY, OWN_STATE, OWN_ZIPCD)
- Physical address (PHY_ADDR1, PHY_CITY, PHY_ZIPCD)
- TruePeopleSearch link auto-generated (free, self-serve)
- LLC officer names via cross-reference (FL Sunbiz)

**What agents expect**:
- Phone number (cell preferred)
- Email address
- Social media profiles
- Relative/associate connections

**Augmentation options**:
1. **BatchSkipTracing** — $0.12-0.15/record, bulk uploads, phone + email
2. **SkipForce** — $0.10-0.20/record, real estate focused
3. **REsimpli** — CRM with built-in skip trace
4. **TLO/Accurint** — Professional-grade, requires license
5. **Build our own** — Aggregate voter rolls, utility connections, court records

**Recommended**: Partner with BatchSkipTracing or similar for phone/email, integrate as an API call in the farming workflow. Agent asks AI for prospects → AI returns property + owner + signals → agent clicks "skip trace" → phone/email returned. Cost: $0.12-0.15/record, passed through to agent or bundled in subscription.

## Metrics for A/B Test

Compare Rootz farming vs. Connected Investors (or existing tool):

| Metric | How to Measure |
|--------|---------------|
| Time to first prospect list | How long to get 50 farmable properties in a city |
| Signal accuracy | Do flagged properties actually have seller intent? |
| Data freshness | When was the underlying data last updated? |
| Coverage completeness | What % of addresses return results? |
| Owner identification | Can we name the actual person behind an LLC? |
| Cost per prospect | Subscription cost / prospects identified |
| Agent adoption | How many of 1,100 agents actively use it after 30 days? |
| Listing conversion | How many prospects become actual listings (90-day tracking)? |
