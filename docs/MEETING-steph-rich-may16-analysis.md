# Meeting Analysis: Steph + Rich Demo — May 16, 2026

## What We Heard

### The #1 Takeaway: Agents Want Excel Lists, Not AI Conversations

Steph said it plainly: **"Realtors primarily desire simple, accurate Excel lists for digital marketing rather than complex AI interactions."**

We built an AI-powered conversation interface. They want a CSV download button. We built bridge pages with farming scores. They want a spreadsheet they can upload to their mailer service.

This doesn't mean the AI is wrong — it means the AI's OUTPUT needs to be a clean list, not a chat conversation. The AI does the thinking. The Excel file is what the agent takes to work.

### The Demo Failed on Execution
- Pages had no pictures (BCPA photo loading failed)
- Results were super slow (server under load, Census API timeouts)
- Token limits hit on free tier (Rich burned through 3 searches)
- The interface was too complex for the audience

### Key Insights from Steph

1. **Selling to realtors directly is hard** — they're AI-illiterate, won't pay for subscriptions, rely on title companies for data
2. **Title companies are the real customer** — they already provide data to agents as a value-add
3. **Steph manages 1,100 agents through a master subscription** with 25,000 free skip traces/month from her current provider
4. **Agents use Print Genie** for mailers — they need data that feeds into Print Genie
5. **Beta test with Red One planned for June** — real deadline
6. **Steph will introduce to Matt from Title EQ and Patrick** — potential distribution partners

### What Rich Experienced
- Hit token limits after 3 searches on free tier
- Wanted to do broad searches (whole ZIP codes, radius queries)
- Experienced the friction of the AI conversation when he just wanted a list

### Competitive Context
- Steph's agents already have **Dynamic Data / First American** through her title company
- They get **25,000 free skip traces per month** — that's the bar
- **Connected Investors** is the comparison product
- Agents compare everything to the Excel exports they already get

## What They Actually Need

### The Product (revised):

```
Agent tells AI what they want
  → AI searches our data
  → AI generates a ranked prospect list
  → Agent clicks "Download Excel"
  → Excel file with: address, owner, mailing address, value, score, signals
  → Agent uploads to Print Genie / mailer service
  → Letters go out
```

The AI conversation is the SEARCH interface. The Excel file is the PRODUCT.

### The Excel Must Contain:
| Column | Source |
|--------|--------|
| Property Address | DOR |
| City, State, ZIP | DOR |
| Owner Name | DOR |
| Owner Mailing Address | DOR |
| Owner Mailing City/State/ZIP | DOR |
| Assessed Value | DOR |
| Property Type | DOR (decoded) |
| Year Built | DOR |
| Living Area (sqft) | DOR |
| Lot Size | DOR |
| Last Sale Date | DOR |
| Last Sale Price | DOR |
| Farming Score | Computed |
| Signals | Computed (plain English) |
| Court Records | Broward Clerk (if applicable) |
| Flood Zone | FEMA |
| School District | Cached |
| Bridge Page URL | Generated |

### What They Don't Need in the Excel:
- SHA-256 hashes
- SSL certificate chains
- Provenance metadata
- JSON structures
- API documentation

### The Interface (revised):
- Keep the AI chat — but add **"Export to Excel"** button on every search result
- The farm map is useful — but add **"Download this list"** on the map page too
- Bridge pages are useful for deep-dive — but the list is the daily workflow
- Pricing should be per-list or per-export, not per-AI-query

## Pivot: Title Companies as Customer

Steph's insight: **sell to title companies, not individual agents.** Title companies:
- Already provide data to agents as a service
- Have budgets for data tools
- Understand data quality and provenance
- Can distribute to hundreds of agents through one relationship
- Steph IS a title company (Vault Title / Safe Hands Title)

### The B2B Model:
```
Rootz → Title Company ($500-2,500/mo)
  → Title company gives agents access
  → Agents get lists through the title company's relationship
  → Title company differentiates by offering better farming data
```

This is how Dynamic Data / First American already works. Steph doesn't pay per-agent — she has a master subscription.

## Work Plan for Next Demo (Before June Beta)

### Priority 1: Excel Export (THIS WEEK)
- Add "Download Excel" button to farm chat results
- Add "Download CSV" button to farm map page
- Format: clean columns, no JSON, no hashes
- Include all fields agents need for Print Genie mailers
- Make it work for any city search, any signal filter

### Priority 2: Fix Demo Reliability
- Fix BCPA photo loading (was broken during demo)
- Pre-cache Census data (API was timing out — use statewide cached data)
- Increase free tier to 10-15 searches (3 was too restrictive for demos)
- Speed up search response time (skip live APIs when cached data available)

### Priority 3: Geographic Search
- Add ZIP code search to farming API
- Add radius search (0.5mi, 1mi, 5mi from address)
- Distinguish physical address vs mailing address in results
- This is critical for geo-farming (Print Genie mailers go to physical addresses)

### Priority 4: Data Accuracy Verification
- Steph will compare our output against her existing database
- Need to ensure owner names, addresses, values match what she already has
- Any mismatches = credibility problem
- Run comparison against Connected Investors data for same addresses

### Priority 5: Deed Document Access ($9/record model)
- Steven mentioned $9/per-deed pay-per-record
- Broward Clerk SFTP has document IMAGES (TIFF files in daily img.zip)
- Could serve actual deed images on demand
- This is a revenue feature, not a priority for beta

### Priority 6: Partnership Prep
- Research Dynamic Data platform capabilities
- Research First American DataTree API/pricing
- Prepare positioning: "We go direct to courthouse, they aggregate through middlemen"
- Be ready for Matt (Title EQ) and Patrick introductions

## Schedule
| Date | Milestone |
|------|-----------|
| May 19-23 | Excel export working, demo reliability fixed |
| May 23 | Follow-up meeting with Steph |
| May 26-30 | Geographic search, data accuracy verification |
| June 2 | Beta test with Red One |
| June TBD | Title EQ / Patrick introductions |

## Key Quotes to Remember

> "Realtors primarily desire simple, accurate Excel lists for digital marketing rather than complex AI interactions." — Steph

> "Selling directly to realtors is challenging because they are often AI-illiterate or unwilling to pay for subscriptions." — Steph

> "The primary value proposition for agents is the delivery of clean, accurate Excel lists." — Group consensus

> "Unlike general AI tools that scrape data from Reddit or Wikipedia, the Roots platform relies on specific public records." — Steven (this resonated)

## What We Got Right
- The DATA is valuable — courthouse records, farming signals, provenance
- The CONCEPT of AI-driven farming resonated
- Steph sees the potential — she's willing to beta test and make introductions
- Direct courthouse access differentiates from First American's aggregated data
- Cross-referencing government records (the Rootz thesis) landed

## What We Got Wrong
- Built for AI power users, not for Excel-loving realtors
- Over-engineered the interface, under-engineered the output
- Demo reliability wasn't production-ready
- Free tier was too restrictive for a demo
- Photos didn't load, making bridge pages look empty
- Didn't have "Download" buttons anywhere
