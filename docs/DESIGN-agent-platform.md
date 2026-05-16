# Origin Agent Platform
## Memory, Shareable Content, and Interactive Maps for Real Estate Agents
### Design Document — April 30, 2026

---

## The Core Idea

An agent's AI assistant gets smarter over time because Origin remembers what they've searched, what they've asked, and what they've shared. Every interaction builds context. Every property report gets a permanent shareable URL. Every map is interactive and live.

The agent texts a link to their client. The client opens it on their phone and sees an interactive property map with schools, flood zones, transit, and hospitals — all from verified government data. No app download. No login. Just a URL.

---

## Three Components

### 1. Agent Identity (API Key / Wallet)

Every subscriber gets a unique identity that connects their AI interactions to persistent memory.

```
Agent Registration:
  POST /api/agent/register
  { name: "Jane Smith", company: "Compass Realty", email: "jane@compass.com" }
  
  Returns:
  { agentId: "agent_abc123", apiKey: "ok_live_abc123..." }
```

The API key travels with every request. The GPT passes it via a custom header or parameter. We know WHO is asking and can maintain their context.

**Identity tiers:**
| Tier | Identity | Memory | Sharing |
|------|---------|--------|---------|
| Free | Anonymous (IP-based) | None | No |
| Pro ($29/mo) | API key | 90 days | 10 shares/month |
| Team ($99/mo) | API key × 5 | 1 year | Unlimited |
| Title Co ($299/mo) | API key × unlimited | Forever | Unlimited + branded |

### 2. Agent Memory (Server-Side Context)

Every query is logged. Every property is summarized. The agent's AI can reference prior sessions.

```
Storage per agent:
  /agents/{agentId}/
    ├── profile.json           ← name, company, tier, preferences
    ├── history.jsonl          ← append-only query log
    ├── properties/            ← saved property intelligence packages
    │   ├── FL-MDC-2442320062150.json   (179 Harbor Dr)
    │   └── FL-MDC-0341050502320.json   (6 Veragua Ave)
    ├── templates/             ← reusable question sets
    │   ├── buyer-checklist.json
    │   └── investor-analysis.json  
    ├── comparisons/           ← saved comparison reports
    └── shared/                ← published shareable content
        ├── {shareId}.json     (data)
        └── {shareId}.html     (rendered page)
```

**Memory API:**

```
# Save a property to agent's portfolio
POST /api/agent/save
{ agentId, property: "FL-MDC-2442320062150", notes: "Client interested, concerned about flood" }

# Get agent's saved properties
GET /api/agent/properties?key={apiKey}

# Get agent's search history
GET /api/agent/history?key={apiKey}&last=30

# Save a question template
POST /api/agent/template
{ agentId, name: "Buyer Checklist", questions: [
    "What are the schools?",
    "What's the flood risk?",
    "What's the elevation vs BFE?",
    "Any active building permits?",
    "What's the neighborhood income?",
    "How long do homes stay on market here?"
  ]
}

# Apply template to a new property
GET /api/agent/apply-template?key={apiKey}&template=buyer-checklist&address=123+Main+St&city=Miami
```

**Context for the GPT:**
When the GPT calls our API with an agent key, we return a context block:

```json
{
  "agentContext": {
    "recentProperties": ["179 Harbor Dr (Key Biscayne)", "6 Veragua Ave (Coral Gables)"],
    "lastQuery": "flood risk comparison",
    "savedTemplates": ["buyer-checklist", "investor-analysis"],
    "propertyCount": 47,
    "memberSince": "2026-04-30"
  }
}
```

The GPT reads this and can say: "Last time you looked at 179 Harbor Dr, the flood margin was -6.76ft. Want me to compare that to this new property?"

### 3. Shareable Content (Public Links)

When the AI generates a report, chart, map, or comparison — it gets a permanent URL.

```
# Create a shareable property report
POST /api/share/create
{
  agentId: "agent_abc123",
  type: "property-report",       // or "comparison", "map", "chart"
  propertyId: "FL-MDC-2442320062150",
  title: "179 Harbor Dr — Property Intelligence",
  content: { ... },             // the data to render
  branding: {
    agentName: "Jane Smith",
    company: "Compass Realty",
    phone: "305-555-1234",
    photo: "https://..."
  },
  expiry: null                   // null = permanent, or ISO date
}

Returns:
{
  shareId: "s_xk2m9p",
  url: "https://title.rootz.global/s/xk2m9p",
  qrCode: "https://title.rootz.global/s/xk2m9p/qr.png"
}
```

**The shareable URL serves:**
- Interactive map (Leaflet.js + OpenStreetMap)
- Property data tables
- Charts (ECharts)
- Agent branding (name, company, contact)
- Origin provenance badge
- Mobile-responsive design
- No login required — link = access

**Analytics for the agent:**
```
GET /api/share/stats?key={apiKey}&shareId=s_xk2m9p

Returns:
{
  views: 12,
  uniqueViewers: 3,
  avgTimeOnPage: "2:45",
  lastViewed: "2026-04-30T14:30:00Z",
  deviceBreakdown: { mobile: 8, desktop: 4 },
  topSections: ["flood-risk", "schools", "elevation"]
}
```

The agent sees: "My client opened the 179 Harbor Dr report 12 times, spent the most time on flood risk. They're worried about insurance costs — I should address that in our next call."

---

## Interactive Map Architecture

### Technology Stack

```
Map tiles:    OpenStreetMap (free, no API key)
Map library:  Leaflet.js (open source, mobile-friendly)
Charts:       ECharts (already using)
Data:         Our API endpoints (all JSON)
Hosting:      title.rootz.global/s/{shareId}
```

### Map Layers (Toggle On/Off)

| Layer | Icon | Data Source | Color Coding |
|-------|------|------------|--------------|
| Property | 📍 pin | Our GIS data | Blue (primary) |
| Schools | 🏫 | Our schools.json | Green=A/B, Yellow=C, Red=D/F |
| Bus Routes | 🚌 lines | County GTFS/GIS | Blue lines |
| Hospitals | 🏥 | CMS hospitals.json | Green=5★, Red=1★ |
| EV Charging | ⚡ | DOE ev-charging.json | Green dots |
| Flood Zone | 🌊 overlay | FEMA zones | Blue shading (AE/AH/VE) |
| Elevation | 📊 heatmap | USGS elevation | Green=high, Red=low |
| Road Construction | 🚧 | road-improvements.json | Orange zones |
| Permits | 🔨 | building-permits.json | Yellow dots |
| Parks | 🌳 | County GIS | Green areas |

### Map Page Structure

```html
<!-- title.rootz.global/s/{shareId} -->

HEADER:
  Property address + agent branding
  "Prepared by Jane Smith | Compass Realty | 305-555-1234"

MAP (full width, 60% of viewport):
  Leaflet.js with toggleable layers
  Property centered, zoom level 15
  Layer control panel (top right)
  Click any icon for popup with details

SIDEBAR (scrollable):
  Property Summary
    Owner, beds/baths, sqft, year built, lot
  
  Flood Risk Analysis ⚠️
    Elevation: 3.24ft | BFE: 10ft | Margin: -6.76ft
    "HIGH RISK — property ground level is below FEMA requirement"
  
  Schools
    Key Biscayne K-8 (0.5mi, B, 76% capacity)
    + private options
  
  Demographics
    Pop 489, Income $70K, Owner-occupied 54%
  
  Building Permits (4)
    A/C, Electrical, Plumbing, Building — all finaled
  
  Hospital Quality
    Nearest: Mount Sinai (3/5, 2.5mi)
    Best: Doctors Hospital (5/5, 8mi)
  
  Market Trends [chart]
    Median price: $599K (flat)
    Inventory: 17,911 (declining)
    Days on market: 80 (improving)
  
  Confidence: 1.0 | 7 government sources
  Provenance: SSL certificates from MDC GIS, FEMA, Census, USGS

FOOTER:
  "Data from Origin Title Records | title.rootz.global"
  "Government-verified with SSL provenance"
  Agent contact info + QR code
```

### Mobile Experience

```
Phone opens title.rootz.global/s/xk2m9p:

[MAP takes full screen]
  ↕ Swipe up to see property details
  
[Property card slides up from bottom]
  Quick facts: 5bd/5ba | $2.5M est | Zone AE
  
  [Schools] [Flood] [Permits] [Market] tabs
  
  Each tab shows relevant data
  Tap "Schools" → map zooms to show school locations
  Tap "Flood" → map shows flood overlay
```

---

## Data Flow

```
Agent uses GPT:
  "Tell me about 179 Harbor Dr, Key Biscayne"
      ↓
GPT calls: /api/fl/search?address=179+Harbor+Dr&city=Key+Biscayne&key=ok_live_abc123
      ↓
Our server:
  1. Queries 7 government sources
  2. Assembles intelligence package
  3. Logs query to agent's history
  4. Returns data to GPT
      ↓
GPT presents data to agent
      ↓
Agent: "Create a shareable report for my client"
      ↓
GPT calls: /api/share/create (with the intelligence data)
      ↓
Our server:
  1. Saves data to /agents/{id}/shared/
  2. Generates interactive HTML page with Leaflet map
  3. Returns shareable URL
      ↓
Agent texts client: "Check out this property: title.rootz.global/s/xk2m9p"
      ↓
Client opens link on phone:
  → Interactive map with schools, flood, transit
  → Property details with flood risk analysis
  → Agent's contact info at bottom
      ↓
Agent checks: /api/share/stats
  → "Client viewed 12 times, focused on flood risk"
```

---

## Revenue Model Impact

The shareable content changes the value proposition:

| Feature | Free | Pro $29 | Team $99 | Title $299 |
|---------|------|---------|----------|------------|
| Property searches | 10/day | 100/month | 500/month | Unlimited |
| Memory | None | 90 days | 1 year | Forever |
| Shareable links | None | 10/month | Unlimited | Unlimited |
| Agent branding on shares | No | Yes | Yes | Custom branded |
| Analytics (view tracking) | No | Basic | Full | Full + export |
| Question templates | No | 3 | Unlimited | Unlimited |
| Map layers | 3 | All | All | All + custom |
| Client portal | No | No | No | Yes |

**The shareable link is the conversion trigger.** An agent on the free tier sees the data and thinks "I want to share this with my client." That's the upsell moment — "Upgrade to Pro for shareable links."

---

## Implementation Phases

### Phase 1: Shareable Maps (Build Now)
- Leaflet.js map page template
- Property data + school + flood + elevation overlays
- Agent branding
- Permanent URLs at /s/{shareId}
- Basic view counter

### Phase 2: Agent Memory (Next Week)
- API key generation
- Query logging
- Property save/recall
- GPT integration with context

### Phase 3: Templates + Analytics (Following Week)
- Reusable question templates
- "Run same analysis on new property"
- View analytics for shared links
- Client engagement tracking

### Phase 4: Full Agent Portal (Month 2)
- Agent dashboard
- Saved properties portfolio
- Client list with activity
- Comparison tool
- Subscription management (Stripe)

---

## Why This Is the Moat

**REAPI** sells data. We sell a RELATIONSHIP.

The agent's memory lives with us. Their templates, their history, their client engagement data — all on our platform. Switching to REAPI means losing all of that context. The longer they use Origin, the more valuable it becomes to them.

The shareable links are the agent's marketing tool. Every link has Origin branding. Every client who opens a link sees "Data from Origin Title Records." The agent's marketing becomes OUR distribution.

And the maps — nobody else gives agents an interactive, shareable, mobile-friendly property map with flood zones, school ratings, and elevation analysis from verified government data. That's the demo that sells itself.

---

*"The filing cabinet had a good run. It's time for the wallet."*
