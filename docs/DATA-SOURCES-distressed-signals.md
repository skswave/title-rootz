# Data Sources for Distressed & Life-Event Signals

## How Connected Investors Gets Their Data

CI authenticates through **First American Financial** (login.firstam.com). First American is the 2nd largest US title company. Their data ecosystem:

- **DataTree** (datatree.com) — deed recordings, mortgages, liens, foreclosures, ownership history. $100-500/mo for API access. This is almost certainly CI's primary data source.
- **First American Data & Analytics** — title plant records, document images, property characteristics
- **ATTOM Data** (attomdata.com) — if not DataTree, then ATTOM. They aggregate county records nationally. $500-2,000/mo for API.

## Commercial Data Aggregators (what CI-type platforms buy)

| Provider | Data | Coverage | Pricing | Notes |
|----------|------|----------|---------|-------|
| **ATTOM Data** | Pre-foreclosure, foreclosure, deed, mortgage, lien, tax, MLS | National 155M+ properties | $500-2,000/mo API | Most common source for RE data startups |
| **First American DataTree** | Deeds, mortgages, liens, foreclosures, doc images | National | $100-500/mo | CI's likely source (same parent company) |
| **CoreLogic** | Property, mortgage, foreclosure, MLS, rental, risk | National | Enterprise ($5K+/mo) | Dominant player, expensive |
| **Black Knight / ICE** | Mortgage servicing, origination, MLS (MLS Listing Gateway) | National | Enterprise | Owns multiple MLSs |
| **PropertyShark** | Deed, mortgage, liens, permits, violations (NYC focus) | NYC/major metros | $60-200/mo | Good for single-city |
| **BatchData** | Property, owner, mortgage, foreclosure, skip trace | National | Pay-per-record | Powers BatchLeads |

### Skip Trace Providers (phone + email)
| Provider | Cost/Record | Source |
|----------|-------------|-------|
| **Tracerfy** | $0.02/credit | LexisNexis/TLO reseller |
| **BatchSkipTracing** | $0.20/result | Multiple data brokers |
| **REISkip** | $0.10-0.15/record | Data broker aggregation |
| **TLO (TransUnion)** | $1-4/record | Credit bureau + public records |
| **IDI/Idicore** | $0.50-2/record | Comprehensive people data |

### MLS Data (expired/failed listings)
| Source | Access | Notes |
|--------|--------|-------|
| **Local MLS board** | Membership required | Agent must be member. Data sharing rules vary. |
| **Zillow/Redfin feeds** | No bulk API for expired | Only show active/recently sold |
| **MFRMLS** (My Florida Regional MLS) | FL agents can access | Covers much of FL |
| **Stellar MLS** | Central FL | Orlando metro |
| **BeachesMLS** | SE Florida | Palm Beach, Broward |
| **Miami MLS** | Miami-Dade | |
| **ATTOM (MLS data)** | API | They aggregate from 800+ MLSs — includes expired/withdrawn |

## FREE Public Record Sources — Florida Specific

### Pre-Foreclosure (Lis Pendens)

Florida has **67 county Clerks of Court**, each with their own system. BUT there's a statewide portal:

| Source | URL | Bulk? | Notes |
|--------|-----|-------|-------|
| **FL Clerks Portal** (myflcourtaccess.com) | myflcourtaccess.com | Individual lookup | Statewide search across all 67 clerks |
| **Miami-Dade Clerk** | www2.miami-dadeclerk.com | Web search | Case search by type (lis pendens) |
| **Broward Clerk** | www.browardclerk.org | Web search | BRIMS system |
| **Orange Clerk** | myeclerk.myorangeclerk.com | Web search | |
| **Hillsborough Clerk** | pubrec6.hillsclerk.com | Web search | |
| **Duval Clerk** | core.duvalclerk.com | Web search | |

**Strategy**: Scrape lis pendens filings from FL Clerks Portal (one search interface for all 67 counties). Filter by case type = "Mortgage Foreclosure" or "Lis Pendens".

### Tax Delinquency

Each FL county Tax Collector publishes delinquent tax lists (required by FL law for tax certificate sales):

| Source | URL | Format | Notes |
|--------|-----|--------|-------|
| **Miami-Dade Tax Collector** | miamidade.county-taxes.com | Web + PDF | Annual tax certificate sale list |
| **Broward Tax Collector** | broward.county-taxes.com | Web search | |
| **Orange Tax Collector** | octaxcol.com | Web search | |
| **Hillsborough Tax Collector** | hillstax.org | Web search | Delinquent list published annually |
| **FL DOR Tax Roll** | floridarevenue.com/property | Bulk data | Annual NAL file (we already have this!) |

**Strategy**: FL DOR tax roll data (which we already have!) includes assessed values but NOT delinquency status. Need county tax collector data for actual delinquent parcels. Many counties publish their annual tax certificate sale lists as PDFs/CSVs.

### Probate

| Source | URL | Bulk? | Notes |
|--------|-----|-------|-------|
| **FL Clerks Portal** | myflcourtaccess.com | Individual | Search by case type = "Probate" |
| **County Probate Courts** | Per county | Web search | Each clerk's own system |

**Strategy**: Same as lis pendens — scrape FL Clerks Portal for probate filings.

### Divorce

| Source | URL | Bulk? | Notes |
|--------|-----|-------|-------|
| **FL Clerks Portal** | myflcourtaccess.com | Individual | Search by case type = "Family" |
| **County Family Courts** | Per county | Web search | |

### Mortgage Data (deed recordings)

| Source | URL | Bulk? | Notes |
|--------|-----|-------|-------|
| **FL County Recorders** | Per county | Varies | Deed + mortgage recordings are public |
| **FL DOR** | We already have sale price/date | Bulk | SALE_PRC1, SALE_YR1, OR_BOOK1, OR_PAGE1 |

## Recommended Strategy: Build vs. Buy

### Phase 1 — Free/Scrape (now, $0 cost)
1. **FL Clerks Portal scraper** for lis pendens + probate + divorce
   - Single endpoint: myflcourtaccess.com
   - Covers all 67 FL counties
   - Public records, no login required
   - Build Playwright scraper (same pattern as masslandrecords.com)
   
2. **Tax delinquency from county tax collectors**
   - Start with top 5 counties (Miami-Dade, Broward, Orange, Hillsborough, Palm Beach)
   - Annual tax certificate sale lists published as PDF/CSV
   
3. **Code violations from city open data**
   - Already pulled Orlando (77K records)
   - Expand to Miami, Tampa, Jacksonville, Fort Lauderdale

### Phase 2 — Cheap Partners ($50-200/mo)
4. **Tracerfy API** for skip trace — $0.02/record
   - Integrate as "Skip Trace" button in farming UI
   - Pass cost through to agents with markup
   
5. **Property photos** — Google Street View Static API
   - $7/1000 requests, free tier 28K/mo
   - Add to property cards like CI does

### Phase 3 — Commercial Data ($500-2,000/mo)
6. **ATTOM Data API** for comprehensive distressed data
   - Pre-foreclosure, auction, REO, liens, mortgage details
   - $500-2,000/mo depending on volume
   - This is the "buy" option instead of scraping 67 county clerks
   
7. **MLS data** for expired/failed listings
   - Requires MLS membership OR ATTOM MLS data add-on
   - Steph may already have MLS access through her brokerage

### Phase 4 — If Revenue Justifies
8. **CoreLogic or DataTree** for full title plant data
   - Mortgage details, full ownership chain, document images
   - $5K+/mo — only makes sense at scale

## Cost Comparison

| Approach | Monthly Cost | Signals Added | Time to Build |
|----------|-------------|---------------|---------------|
| **Scrape FL Clerks Portal** | $0 | Pre-foreclosure, probate, divorce | 1-2 weeks |
| **County tax delinquent lists** | $0 | Tax delinquent | 1 week |
| **Tracerfy skip trace** | ~$0.02/record | Phone + email | 1 day (API integration) |
| **ATTOM Data API** | $500-2K/mo | All distressed + mortgage + MLS | 1 week |
| **CoreLogic** | $5K+/mo | Everything including doc images | Enterprise sales process |

**Recommendation**: Start with FL Clerks Portal scraper ($0) + Tracerfy ($0.02/record). This gets us pre-foreclosure + probate + skip trace — the three biggest gaps — for essentially free. Add ATTOM later if volume justifies.
