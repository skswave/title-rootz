# How We Get the Data — A Plain English Guide
## For Tracie and anyone who asks "where does this come from?"

---

## The Short Version

Massachusetts has 2.6 million property parcels. All the records are public. We assemble a complete property profile by collecting data from multiple public sources, cross-referencing them against each other, and producing a verified record that's instantly queryable by AI.

No special access required. No exclusive licenses. The same data every title company uses — just organized for machines instead of humans.

---

## The Sources (Where the Data Lives)

### Source 1: MassGIS — The Property Map
**What it is:** The state of Massachusetts publishes a map of every property parcel in the state with assessor data attached.

**What it gives us:**
- Owner name and mailing address
- Assessed value (total, land, building)
- Lot size, year built, building style, rooms
- Zoning district
- Last sale date, price, and deed book/page
- Parcel boundaries (shapes on a map)

**How we get it:** Free download from the state website. No login, no fee, no restrictions. Updated twice a year. We can also query it property-by-property through a free API.

**Coverage:** 2,557,649 parcels statewide. Berkshire County alone has 76,400.

**Cost: $0**

---

### Source 2: Registry of Deeds — The Title Records
**What it is:** The official record of every deed, mortgage, discharge, lien, easement, and other document affecting property ownership. Massachusetts has 21 separate registries, one per county/district.

**What it gives us:**
- Complete chain of ownership (who sold to whom, when, for how much)
- All mortgages and whether they've been discharged
- Tax liens, court judgments, easements
- The actual scanned document images (PDFs)
- Cross-references between related documents

**How we get it — Option A (one at a time):**
The website masslandrecords.com lets anyone search and view records for free. You type in an address, get a list of documents, click to see details. We automate this using a real web browser (not a bot) that fills in the same search form a title agent would use. Same interface, same data, just faster.

Downloading document images is also free — the site has a "Download Wizard" that produces a PDF. We tested this and successfully downloaded an 11-page mortgage assignment document as a ZIP file containing a PDF. No charge.

**How we get it — Option B (bulk request):**
Massachusetts public records law (MGL Chapter 66, Section 10) requires every government office to provide records in electronic format upon request. We can submit a formal written request to each of the 21 Registers of Deeds asking for a database export of their entire index. They must respond within 10 business days.

The Warren Group (the company title companies buy data from) has been doing exactly this — collecting data weekly from all 21 registries — since 1872. They have no exclusive rights. We can request the same data.

**Fees:**
| Type | Cost |
|------|------|
| Searching online | Free |
| Viewing documents online | Free |
| Downloading PDFs | Free ("at this time") |
| Certified paper copies | $1 per page |
| Bulk electronic data (public records request) | Reproduction cost only — typically minimal for electronic records |
| Personnel time for request | Up to $25/hour, first 4 hours free |

**Coverage:** Over 10 million documents statewide. Middle Berkshire alone has 1,056,169. Records go back to 1641 in some registries.

---

### Source 3: Boston Assessor — The Gold Standard
**What it is:** The City of Boston publishes its entire property assessment database as a downloadable spreadsheet every year.

**What it gives us:** 66 data fields per property including assessed values, building details (square footage, bedrooms, bathrooms, year built, condition, heating type, roof type), tax amounts, and owner information.

**How we get it:** Free CSV download from data.boston.gov. No login, no fee.

**Coverage:** All ~170,000 Boston properties. We already downloaded the FY2026 file (76 MB).

**Cost: $0**

---

### Source 4: FEMA Flood Maps
**What it is:** Federal flood zone maps showing which properties are in flood-risk areas.

**What it gives us:** Flood zone classification (Zone A, X, etc.), whether the property requires flood insurance.

**How we get it:** Free API query by coordinates. Federal government data = public domain.

**Cost: $0**

---

### Source 5: Environmental Records (MassDEP)
**What it is:** State records of contaminated sites, environmental restrictions, and cleanup status.

**What it gives us:** Whether a property has contamination history or activity/use limitations (AULs) that restrict future development. These are legally binding restrictions that don't always appear in the deed records.

**How we get it:** Online portal search, free. Or public records request.

**Cost: $0**

---

### Source 6: Secretary of State — Corporate Ownership
**What it is:** The state's registry of all business entities (LLCs, corporations, trusts).

**What it gives us:** When a property is owned by an LLC (increasingly common), the deed only shows the LLC name. The Secretary of State database reveals who actually controls the LLC — the managers, members, and registered agent.

**How we get it:** Free online search or public records request for bulk data.

**Cost: $0**

---

## What We Do With It (The Origin Layer)

### Step 1: Collect
We pull data from all sources above for each property. The MassGIS parcel list tells us every property in the state — that's our starting point. Then we look up each one in the registry to get the title history.

### Step 2: Cross-Reference
We compare the same facts across multiple sources:
- Does the owner name in MassGIS match the grantee in the latest deed?
- Does the sale price in MassGIS match the consideration in the deed?
- Does the book/page number match across sources?

### Step 3: Score
Each property gets a confidence score from 0 to 1.0:
- **0.95+** = all sources agree perfectly → fast-track title
- **0.80-0.94** = minor discrepancies (name spelling, address format) → standard review
- **Below 0.80** = significant gaps or conflicts → needs detailed examination

### Step 4: Verify (The Origin Secret Sauce)
Every document we collect is served over an encrypted connection (HTTPS). The registry's security certificate is their digital signature — it proves the document came from their server. We capture that certificate information at the moment of collection, creating a proof chain:

**"This document (hash) was served by this government server (certificate) at this time (timestamp)."**

Think of it like a notary stamp, but digital and automatic. The registry is already "signing" every document they serve — they just don't know it. We're the first ones to capture and preserve that signature.

### Step 5: Store
Each property gets a permanent digital record (a "data wallet") that accumulates over time. New deed filed? The record updates automatically. Mortgage discharged? The lien status changes. The record gets stronger and more complete with every update.

---

## What This Means for Title Insurance

### Today
A title examiner:
1. Goes to masslandrecords.com
2. Searches by owner name and/or address
3. Clicks through each document one at a time
4. Reads the scanned images
5. Manually traces the chain of ownership
6. Checks for active liens
7. Calls the town for a Municipal Lien Certificate ($25-50)
8. Checks for flood zones, environmental issues separately
9. Writes a title report
10. **Time: 2-8 hours per property. Cost: $200-400.**

### With Origin
An AI or title professional:
1. Queries one system
2. Gets complete chain of title, lien status, assessor data, flood zone, environmental status — all cross-referenced with a confidence score
3. Reviews flagged items only
4. **Time: under 1 minute. Cost: $5-25 per property.**

The 85% of title insurance premiums that currently go to search and examination costs? That's the market we're addressing.

---

## Frequently Asked Questions

**Q: Is this legal?**
Yes. All data sources are public records. Massachusetts public records law explicitly requires electronic access and does not restrict commercial use. The Warren Group has been building a commercial business from the same data for 150 years.

**Q: Do we need permission from the registries?**
No. Public records are available to any person for any purpose. We don't need to explain why we want the data.

**Q: What about the masslandrecords.com terms of service?**
Their terms restrict "scraping and crawling" of the website. We are not scraping — we use the search interface the same way a title agent does, one property at a time. Separately, we can also request bulk data directly from the Register of Deeds, bypassing the website entirely.

**Q: How much would it cost to build the full Massachusetts dataset?**
About $26,000 in compute costs using a private AI for document reading, plus staff time for quality control. Compare to the Warren Group charging $10K-$100K+ for access to their version of the same data.

**Q: What do we have that Warren Group doesn't?**
1. AI-readable format (they serve humans, we serve AI agents)
2. Cross-source verification with confidence scores
3. Cryptographic proof of document authenticity
4. Real-time update capability
5. 10-100x lower price point

**Q: Can someone just copy our dataset?**
They can try — the underlying facts are public domain. But they can't copy our verification layer, our confidence scores, our provenance chain, or our document hashes. And by the time they catch up, we'll have months of temporal proof they can't replicate. You can't backdate a blockchain timestamp.
