# Licensing & Legal Analysis — Massachusetts Property Data
## April 19, 2026

## Bottom Line: Massachusetts law is strongly on our side.

The data is public domain. The vendor websites are not. Access through proper channels (public records requests) and we have a legally defensible commercial product.

---

## Legal Foundation

### Massachusetts Public Records Law (MGL Chapter 66, Section 10)
- **One of the strongest public records laws in the country**
- Records custodians MUST provide records in electronic format if they exist electronically
- **Cannot inquire into purpose** — no "commercial use" exclusion
- 2016 Public Records Reform (Chapter 121) strengthened access further
- Supervisor of Records can order production and impose penalties + attorneys' fees

### Feist Publications v. Rural Telephone Service (1991, US Supreme Court)
- **Facts are not copyrightable** — names, dates, addresses, consideration amounts are facts
- A standard grantor/grantee index arranged by book/page follows legally mandated structure — likely NOT sufficiently original for copyright
- The vendor's software/UI is copyrightable. The DATA is not.

---

## Source-by-Source Analysis

### TIER 1: Freely Available, Zero Legal Risk

| Source | Status | Method | Notes |
|--------|--------|--------|-------|
| **MassGIS Parcels** | Open data, no restrictions | Bulk download | Explicitly encourages commercial use. MA Executive Order 504. |
| **FEMA Flood Maps** | Public domain (federal) | Bulk download | 17 U.S.C. § 105 — all federal works are public domain |
| **Census/ACS** | Public domain (federal) | API (free key) | Census Bureau explicitly encourages reuse |
| **MassDEP published data** | Open data | Download from portal | Environmental records, 21E sites, AULs |
| **Secretary of State** | Public records | Public records request | Corporate records. LexisNexis already resells this commercially. |
| **USDA Soil Survey** | Public domain (federal) | REST API | Federal work product |
| **EPA Envirofacts** | Public domain (federal) | REST API | Federal work product |

### TIER 2: Public Records, Requires Formal Requests

| Source | Status | Method | Notes |
|--------|--------|--------|-------|
| **Registry of Deeds** | Public records, no commercial restriction | Public records request to each Registry | MGL c. 36. Vendor (Avenu/Tyler) ToS restricts their WEBSITE, not the underlying data. |
| **Town Assessor Data** | Public records | Public records request (or via MassGIS) | MGL c. 59, § 52 — assessment records must be open to public inspection |
| **MassDEP unpublished** | Public records | Public records request | Specific site reports, inspection records |

### TIER 3: Restricted / Do Not Use

| Source | Status | Risk | Notes |
|--------|--------|------|-------|
| **Court records** | Public but bulk access restricted | HIGH | Trial Court does NOT offer bulk commercial access. Would need formal agreement. |
| **Zillow / Redfin / MLS** | Proprietary | **DO NOT SCRAPE** | Zillow aggressively sues scrapers. Zestimate is copyrightable. MLS data is licensed. |
| **Warren Group data** | Proprietary compilation | Medium | They have NO exclusive rights to public records, but their compilation is protected. |

---

## Key Legal Questions Answered

### Can deed records be scraped and resold?
**The records: YES. The website: NO.** The deed records themselves are public domain facts (Feist). But the masslandrecords.com website has ToS restricting scraping. **Solution: Submit public records requests directly to each of the 21 Registries of Deeds for bulk electronic data.** The Register must provide it.

### Does Avenu/Tyler have copyright on the index?
**Weak to none.** The factual content (names, dates, book/page) is not copyrightable. The arrangement follows a legally mandated structure. Tyler is a contractor performing a government function — work-for-hire argument may apply.

### Is there a difference between free viewing vs. bulk downloading for commercial use?
**Under Massachusetts law: NO.** MGL c. 66, § 10 does not distinguish by purpose. Custodians cannot restrict based on commercial intent. They can charge reasonable reproduction fees for electronic records (minimal).

### Can we compete with the Warren Group?
**Absolutely YES.** Warren Group has no exclusive license to any Massachusetts public records. They built their database from the same public sources available to anyone. Under Feist, we can build our own independent compilation from the same sources.

### Legal precedent for commercial products from MA public records?
- **The Warren Group** — 150-year-old business built entirely on public records
- **CoreLogic, ATTOM Data, Black Knight** — national aggregators including MA data
- **Title insurance companies** — build proprietary title plants from Registry records
- **LexisNexis, Westlaw** — commercially resell public court and corporate records

---

## Strategy: How to Legally Build the Dataset

### Phase 1: Free Downloads (do immediately)
1. Download MassGIS statewide parcels (assessor data for all towns)
2. Download FEMA NFHL for Massachusetts (flood zones)
3. Pull Census ACS data via API
4. Download MassDEP 21E site data
5. Pull Secretary of State corporate records

### Phase 2: Public Records Requests (weeks 1-4)
1. Submit formal MGL c. 66, § 10 requests to each Registry of Deeds
2. Request: "Complete electronic database of recorded land documents including grantor/grantee index, document type, book/page, consideration, filing date, and all associated metadata, from [date] to present"
3. Specify: electronic format, database export or CSV
4. Budget: Reproduction fees should be minimal for electronic records
5. If refused: Escalate to Supervisor of Records (free, and they award attorneys' fees)

### Phase 3: Targeted Requests (as needed)
1. Individual town assessor requests for data not in MassGIS
2. MassDEP records for specific properties
3. Secretary of State bulk corporate data

### What NOT to Do
- Do NOT scrape masslandrecords.com without a legal opinion
- Do NOT scrape Zillow, Redfin, or any MLS-sourced site
- Do NOT copy Warren Group's database structure or indexes
- Do NOT present vendor-compiled data as your own without independent creation

---

## Origin's Legal Advantage

### Adding Value = Clear Copyright
While the underlying facts are public domain, **Origin's value-add creates copyrightable work product**:
1. **Schema design** — our JSON structure for property records is original
2. **Chain-of-title computation** — our algorithm for linking grantor→grantee chains
3. **Fraud detection rules** — our scoring model and detection patterns
4. **Document hashes** — our cryptographic integrity layer (and the Merkle tree structure)
5. **Cross-source integration** — our method of combining 15+ sources into one record
6. **OCR + structured extraction** — our LLM-based interpretation of scanned documents
7. **MCP tools** — our API design for querying the dataset

### What We Own vs. What's Public
| Layer | Status |
|-------|--------|
| Raw deed text (names, dates, amounts) | Public domain (facts) |
| Document scan images | Public record |
| Our JSON schema | **Our copyright** |
| Our chain-of-title algorithm | **Our copyright** |
| Our fraud detection model | **Our copyright + trade secret** |
| Our Merkle tree / hash chain | **Our copyright** |
| Our MCP tools | **Our copyright** |
| Our OCR extraction pipeline | **Our copyright + trade secret** |

### The Rootz Pattern
Same as SEC AI Registry: public data + original value-add = defensible commercial product. The data is free. The intelligence layer is ours.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Registry refuses public records request | Low | Medium | Escalate to Supervisor of Records (they'll order compliance) |
| Avenu/Tyler sends C&D for scraping | Medium | Medium | Don't scrape — use public records requests instead |
| Warren Group claims unfair competition | Very Low | Low | Independent creation from public records is legally protected |
| Town assessor delays electronic production | Medium | Low | MassGIS has most data already; request individual towns as needed |
| Zillow/Redfin legal action | N/A | High | Not using their data — not applicable |
| Court records access denied | Medium | Low | Court data is supplementary, not core to the product |

**Overall legal risk: LOW** — as long as we access data through proper public records channels rather than scraping vendor websites.
