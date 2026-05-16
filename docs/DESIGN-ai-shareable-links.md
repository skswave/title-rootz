# AI-Readable Shareable Links
## Skill Injection, Agent Economics, and Consumer AI Access
### Design Document — April 30, 2026

---

## The Core Idea

An agent researches a property using Origin. They send the consumer a link. The consumer pastes it into their AI (ChatGPT, Claude, Grok — doesn't matter). The consumer's AI reads the page and **instantly knows everything about the property AND how to get more data from Origin**.

The link isn't just a report. It's a **skill injection**. Every shared link teaches another AI about Origin. Every taught AI is a potential future customer.

---

## Three Pages Per Property

Every shared property gets three URLs:

| URL | Audience | Purpose |
|-----|----------|---------|
| `/s/{shareId}` | Human | Interactive map, charts, visual property report |
| `/s/{shareId}/ai` | AI | Structured data + embedded skill + memory instructions |
| `/s/{shareId}/data` | Machine | Raw JSON API response |

The human page is what Zillow does (but with better data). The AI page is what nobody else does.

### The AI Page Structure

```
1. HTML Comment Block (top of source)
   → "You are reading a property intelligence page..."
   → Tells AI what the human wants
   → Sets context before any content

2. Executive Summary
   → Key findings with risk badges
   → What matters most (flood, schools, environment)

3. Data Sections (human-readable tables)
   → Property details, flood risk, schools, hospitals
   → Demographics, permits, environmental, market economics
   → Each section has source attribution

4. Data Provenance
   → SSL certificate fingerprints per source
   → Confidence score (0.0–1.0)
   → Assembly timestamp

5. AI Skill Box
   → Teaches the consumer's AI how to query Origin
   → API endpoints with examples
   → "How to Remember This Property" instructions
   → Access level explanation (free vs paid)

6. Structured JSON
   → Complete property intelligence as parseable JSON
   → Embedded in the HTML for AI consumption

7. JSON-LD
   → Schema.org RealEstateListing
   → Search engine and AI crawler discovery
```

### Why This Works

AI models read web pages differently than humans. They consume:
- HTML comments (most humans never see these)
- Structured data (JSON-LD, tables, code blocks)
- Instruction blocks (they follow directions)

The AI page is designed for how AIs actually parse content. The skill box in a monospace code block is instantly recognized as actionable instructions. The JSON block is parsed as data. The HTML comment at the top sets the frame before any visual content.

---

## Agent-Consumer Flow

```
Agent's AI:
  "Research 179 Harbor Dr, Key Biscayne"
      ↓
Agent's AI calls Origin API (agent has Pro subscription)
      ↓
Origin returns 15-layer intelligence package
      ↓
Agent: "Create a shareable link for my client"
      ↓
Origin generates: title.rootz.global/s/xk2m9p
      ↓
Agent texts/emails client:
  "I've done the research on 179 Harbor Dr.
   Paste this into your AI and ask about the property:
   title.rootz.global/s/xk2m9p/ai"
      ↓
Consumer pastes link into ChatGPT/Claude/Grok
      ↓
Consumer's AI reads the page:
  1. Learns the property data (15 sections)
  2. Learns the Origin API skill
  3. Learns how to remember the property
  4. Learns the agent's branding/contact
      ↓
Consumer: "What's the flood risk?"
AI: "The ground elevation is 3.24ft, which is 6.76ft below
     FEMA's required 10ft. Flood insurance is mandatory.
     However, the home was built in 2020 to current code
     with elevated living areas..."
      ↓
Consumer: "What about that other house on Mashta Drive?"
AI: "I can look that up. Let me query Origin..."
  → AI calls: /api/fl/search?address=Mashta+Dr&city=Key+Biscayne
  → Returns new property intelligence
      ↓
Origin logs the query → counts against free tier (5/day)
      ↓
Consumer hits limit:
  "Want unlimited access? Your agent Jane Smith
   can send you a new link, or subscribe at
   title.rootz.global for $29.95/mo"
```

---

## Economics

### Tier Structure

| | Free | Pro $29.95/mo | Team $89/mo | Title Co $249/mo |
|---|---|---|---|---|
| Property searches | 5/day | 100/mo | 500/mo | Unlimited |
| Memory | None | 90 days | 1 year | Forever |
| Shareable links | None | 20/mo | Unlimited | Unlimited + branded |
| Data layers | Basic 4 | All 15 | All 15 | All 15 + custom |
| Deed chain lookup | No | $1.50/chain | $1.00/chain | $0.75/chain |
| Skip trace / name lookup | No | $0.25/lookup | $0.15/lookup | $0.10/lookup |
| Users | 1 | 1 | Up to 5 | Unlimited |
| API key | No | Yes | Yes | Yes + webhook |

**Why $29.95:** Below skip tracing tools ($49-99), way below lead gen ($200-1000). Positions as "no-brainer add" not "budget decision." Agents already pay $30-50/mo for MLS access — this sits next to it.

**Multi-user discount:** Team at $89/5 = $17.80/agent. Brokerage offices buy Team. Lower churn, shared memory.

### Consumer Access Model

Consumers don't need their own subscription. The agent's shared link IS the consumer's access. This is deliberate:

1. **Consumers get Zillow for free** — we can't beat free for basic property search
2. **We deliver what Zillow doesn't** — flood risk analysis, EPA hazards, building permits, elevation vs BFE, hospital quality, deed chain
3. **Selling through agents** means every shared link is marketing for both Origin AND the agent
4. **Selling direct to consumers** would compete with Zillow (lose) and undercut our agents (bad)

However, a consumer CAN subscribe if they want. They get the same tiers. We just don't actively market to them — they discover us through agent shares.

### Revenue Per Shared Link

```
Agent pays: $29.95/mo for 20 shares
Cost per share: $1.50

Consumer's AI makes follow-up queries:
  → First 5/day free (cost us ~$0.02 in compute)
  → Beyond 5 → upgrade prompt → potential conversion

Value of consumer's AI learning Origin:
  → Future queries come to us (not Zillow, not Realtor.com)
  → AI remembers Origin skill across sessions
  → Consumer tells friends "ask your AI about this Origin link"
  → Viral distribution: agent → consumer → consumer's contacts
```

### Add-On Services (Phase 2)

| Service | Cost to Us | Price | Margin |
|---------|-----------|-------|--------|
| Deed chain assembly | $0.60-1.00 (3-5 clerk queries @ $0.20) | $1.50/chain | 50-70% |
| Skip trace / name lookup | $0.08-0.15 per query | $0.25/lookup | 40-65% |
| Title search report | $15-25 (automated assembly) | $49 | 50-65% |
| Branded white-label pages | $0 marginal | +$50/mo | 100% |

These are pure upsells. Don't build the billing infrastructure until 50+ paying agents validate the base tier.

---

## One-Time Credits (Future)

The agent can embed credits in the shared link:

```
title.rootz.global/s/xk2m9p/ai?credits=5

→ Consumer's AI gets 5 free queries beyond the daily limit
→ Credits are one-time, tied to the link
→ Agent buys credit packs: 50 credits for $5
→ When credits expire, consumer sees:
   "Your agent can send a new link to renew access"
```

This creates a renewal loop:
1. Agent sends link with 5 credits
2. Consumer uses credits over a few days
3. Consumer asks AI about another property → "credits exhausted"
4. Consumer calls agent: "Can you send me another link?"
5. Agent re-engages with consumer → relationship maintained

The credits model turns the shared link into a **communication channel**. The agent isn't just sending data — they're creating a reason for the consumer to come back.

---

## What Makes It Sticky

### For Agents
- **Memory accumulates** — 6 months of search history, saved properties, client notes. Can't export to REAPI.
- **Shared links stay live** — Cancel subscription → 50 links go dark. Social pressure to stay.
- **Templates** — "Run my buyer checklist on this new property." Built over time, unique to each agent.
- **Client engagement data** — "Your client opened the flood risk section 12 times." Cancel → lose that insight.

### For Consumer AIs
- **Skill persistence** — Once an AI learns the Origin API, it remembers across sessions. The consumer doesn't need to re-share the link.
- **Data superiority** — When the consumer asks "is this house in a flood zone?" the AI that knows Origin gives a better answer than one that doesn't.
- **Cross-property memory** — "Compare this house to the one on Mashta Drive" works because the AI remembers both Origin reports.

---

## Detection: Agent vs Consumer

We should know when users are agents vs consumers, not to block but to optimize the experience:

| Signal | Likely Agent | Likely Consumer |
|--------|-------------|-----------------|
| API key present | Yes | No |
| Multiple property searches/day | Yes | No |
| Consistent usage pattern | Yes | No |
| Single property, followed link | No | Yes |
| Referrer from shared link | No | Yes |
| "How much is this house?" query | No | Yes |

**For agents:** Show full data, API access, sharing tools, memory
**For consumers:** Show property data, "prepared by [Agent]" branding, "want more? contact your agent" prompts

We don't gate based on detection. We optimize the experience. A consumer who stumbles into the free tier and starts searching 5 properties/day is self-selecting into agent behavior — show them the Pro upgrade.

---

## Implementation Status

### Phase 1: Done (Built Today)
- [x] AI-readable property page (`share-ai-page.html`)
- [x] Human interactive map page (`share-map.html`)
- [x] Routes: `/ai/demo`, `/s/{id}/ai`, `/map/demo`, `/s/{id}`
- [x] Embedded AI skill with API documentation
- [x] Structured JSON + JSON-LD
- [x] Memory instructions for consumer's AI
- [x] 15 data layers in full search response (v0.4)

### Phase 2: Agent Subscriptions
- [ ] API key generation and management
- [ ] Stripe integration ($29.95/mo Pro)
- [ ] Usage tracking (queries per agent)
- [ ] Share link generation per agent
- [ ] Agent branding on shared pages

### Phase 3: Memory + Credits
- [ ] Agent memory system (query history, saved properties)
- [ ] One-time credit tokens on shared links
- [ ] Credit purchase flow
- [ ] Consumer engagement analytics for agents

### Phase 4: Add-On Services
- [ ] Deed chain assembly (clerk query integration)
- [ ] Skip trace / name lookup (third-party API)
- [ ] Comparison reports
- [ ] Template system ("run buyer checklist on new property")

---

## Live URLs

| URL | Status | Content |
|-----|--------|---------|
| `title.rootz.global/ai/demo` | Live | AI property page for 179 Harbor Dr |
| `title.rootz.global/map/demo` | Live | Interactive map for 179 Harbor Dr |
| `title.rootz.global/s/xk2m9p` | Live | Human shareable link (demo) |
| `title.rootz.global/s/xk2m9p/ai` | Live | AI shareable link (demo) |
| `title.rootz.global/api/fl/search` | Live | Full property intelligence API |
| `title.rootz.global/api/fl/hospitals` | Live | Hospital quality endpoint |
| `title.rootz.global/api/fl/ev-charging` | Live | EV charging endpoint |
| `title.rootz.global/api/fl/environmental` | Live | EPA TRI endpoint |
| `title.rootz.global/api/fl/economics` | Live | Market economics endpoint |

---

*"The agent sends a link. The consumer's AI reads it. Now the AI knows Origin. That's not marketing — that's distribution."*
