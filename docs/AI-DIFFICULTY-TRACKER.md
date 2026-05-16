# AI Difficulty & Cost Tracker — Land Records Extraction
## Building the case for private LLM vs API costs

### Why Track This
Every step of building the dataset has an AI cost. We need to know:
1. What can be done with simple automation (no LLM needed)?
2. What requires LLM intelligence (OCR interpretation, entity resolution)?
3. What's the per-property cost at scale?
4. Does a private LLM make sense vs Claude/GPT API?

---

## Step-by-Step Extraction Difficulty

### 1. Registry Index Search (masslandrecords.com)
| Metric | Value |
|--------|-------|
| **Difficulty** | MEDIUM |
| **AI needed?** | No — pure browser automation (Playwright) |
| **Bottleneck** | ASP.NET ViewState requires cookie clearing between searches |
| **Street name inconsistency** | HIGH — "UNDER MOUNTAIN" vs "UNDERMOUNTAIN", address changes (249→299) |
| **Time per property** | ~3-5 seconds per search + 1.2 sec per record detail |
| **Rate limiting** | Unknown — tested ~100 requests with no blocks |
| **Cost per property** | ~$0 (compute only, no LLM needed) |
| **AI value-add** | Street name fuzzy matching, address normalization |
| **Scale estimate** | Middle Berkshire: 1,056,169 docs. At 1.2 sec/record = ~14 days continuous |

### 2. Registry Detail Extraction (parties, references, consideration)
| Metric | Value |
|--------|-------|
| **Difficulty** | LOW |
| **AI needed?** | No — structured HTML parsing |
| **Data quality** | HIGH — clean structured fields (doc#, date, book/page, type, parties) |
| **Cross-references** | Automatically extractable (book/page links between documents) |
| **Cost per record** | ~$0 (Playwright + DOM parsing) |
| **Proven** | Extracted 100+ records in this session with full detail |

### 3. Document Image OCR
| Metric | Value |
|--------|-------|
| **Difficulty** | MEDIUM-HIGH |
| **AI needed?** | YES — this is where LLM shines |
| **Modern docs (post-1970)** | Typewritten, clear scans — high OCR accuracy (~95%+) |
| **Historical docs (1641-1969)** | Handwritten, variable quality — needs vision LLM |
| **What OCR extracts** | Legal descriptions, metes & bounds, easement terms, mortgage conditions |
| **Per-document cost (API)** | ~$0.03-0.10 per page (GPT-4V or Claude vision) |
| **Per-document cost (private LLM)** | ~$0.001-0.005 per page (Llama 3.2 Vision on local GPU) |
| **Scale estimate** | 1M docs × 3 pages avg = 3M pages × $0.05 = **$150,000 via API** |
| **Scale estimate (private)** | 3M pages × $0.003 = **$9,000 via private LLM** |
| **Fraud detection value** | OCR reveals text changes, inconsistent fonts, altered dates |

### 4. Assessor Data Integration
| Metric | Value |
|--------|-------|
| **Difficulty** | LOW-MEDIUM |
| **AI needed?** | No for MassGIS (structured GIS data). Yes for scraping town sites. |
| **MassGIS bulk download** | FREE, structured, statewide. No LLM needed. |
| **Town assessor scraping** | Medium — each vendor (AxisGIS, Vision) has different HTML structure |
| **Entity matching** | MEDIUM — matching "SPRAGUE STEVEN K" in registry to "Steven K Sprague" in assessor |
| **Cost** | ~$0 for MassGIS. ~$0.01 per property for town assessor scraping |
| **Boston assessor** | FREE CSV bulk download — best source in the state |

### 5. Chain of Title Construction
| Metric | Value |
|--------|-------|
| **Difficulty** | MEDIUM-HIGH |
| **AI needed?** | YES — entity resolution + temporal reasoning |
| **What it does** | Links deeds in sequence: Grantor→Grantee chain over time |
| **Hard parts** | Name variations (SPRAGUE STEVEN vs SPRAGUE STEVEN K vs STEVEN K SPRAGUE) |
| **Hard parts** | Trust transfers ($1 consideration), estate transfers, LLC ownership |
| **Hard parts** | Cross-reference resolution (book/page links across documents) |
| **Per-property cost (API)** | ~$0.05-0.15 (context window with all records for a property) |
| **Per-property cost (private)** | ~$0.005-0.01 |
| **Fraud detection** | AI flags: deed without matching mortgage discharge, gaps in chain, unusual consideration amounts |

### 6. Lien/Encumbrance Detection
| Metric | Value |
|--------|-------|
| **Difficulty** | MEDIUM |
| **AI needed?** | Partially — rule-based for simple cases, LLM for complex |
| **Simple** | Mortgage without matching discharge = active lien (rule-based) |
| **Complex** | Tax taking→redemption chains, partial releases, UCC filings |
| **Fraud detection** | Forged discharges, backdated releases, phantom mortgages |
| **Per-property cost** | ~$0.02-0.05 (API), ~$0.002 (private) |

### 7. Document Hashing + Merkle Tree (Origin Layer)
| Metric | Value |
|--------|-------|
| **Difficulty** | LOW |
| **AI needed?** | NO — pure cryptographic computation |
| **What it does** | SHA-256 hash of each document image, per-property Merkle tree |
| **Cost** | Negligible (~$0.0001 per document) |
| **Fraud detection** | **THIS IS THE KEY ORIGIN VALUE** — any document alteration changes the hash |
| **Tamper evidence** | If someone files a fraudulent deed, the hash won't match the original |
| **Chain verification** | Merkle root changes if any document in the property's history is altered |
| **On-chain anchoring** | Merkle root on Polygon = $0.01 per property, immutable timestamp |

### 8. Environmental/Flood/Soil Overlay
| Metric | Value |
|--------|-------|
| **Difficulty** | LOW |
| **AI needed?** | No — GIS spatial join |
| **Data sources** | FEMA NFHL (shapefile), MassDEP 21E (web), USDA Soil (API) |
| **Cost** | ~$0 (all free public data, spatial query) |

---

## Cost Summary: Per-Property at Scale

### API Approach (Claude/GPT)
| Step | Cost/Property |
|------|--------------|
| Registry scraping | $0.00 |
| Detail extraction | $0.00 |
| OCR (avg 5 docs × 3 pages) | $0.75 |
| Assessor integration | $0.01 |
| Chain of title (LLM) | $0.10 |
| Lien detection | $0.03 |
| Document hashing | $0.00 |
| Environmental overlay | $0.00 |
| **Total per property** | **~$0.89** |
| **1M properties (all of MA)** | **~$890,000** |

### Private LLM Approach (Llama 3.2 Vision, local GPU)
| Step | Cost/Property |
|------|--------------|
| Registry scraping | $0.00 |
| Detail extraction | $0.00 |
| OCR (avg 5 docs × 3 pages) | $0.015 |
| Assessor integration | $0.001 |
| Chain of title | $0.008 |
| Lien detection | $0.002 |
| Document hashing | $0.00 |
| Environmental overlay | $0.00 |
| **Total per property** | **~$0.026** |
| **1M properties (all of MA)** | **~$26,000** |

### Hardware for Private LLM
| Item | Cost |
|------|------|
| NVIDIA A100 80GB (used) | ~$8,000 |
| Or cloud GPU (Lambda/RunPod) | ~$1.50/hr |
| Processing 1M properties @ 10/sec | ~28 hours = **~$42** |
| Amortized over dataset | Negligible |

**Verdict: Private LLM wins by 34x on cost.** At scale, a $8K GPU pays for itself processing ~300K properties vs API. Given we're targeting all of MA (1M+ properties), private LLM is the clear choice for OCR and chain-of-title construction.

---

## Fraud Detection: Origin's Killer Feature

### Current State: Zero Integrity
- Documents are scanned images with physical stamps
- "Verified/Certified" status is just a label — no cryptographic proof
- Anyone who can forge a notary seal can file a fraudulent deed
- No way to detect if a document image has been altered after filing
- No cross-registry verification
- Wire fraud in real estate closings: **$1.4 billion lost in 2023** (FBI IC3)

### What Origin Adds
1. **Document hash**: SHA-256 of every scanned image at time of extraction
2. **Merkle tree**: Per-property tree of all document hashes
3. **On-chain anchor**: Merkle root on Polygon ($0.01) = immutable timestamp
4. **Tamper detection**: Any alteration to any document changes the hash → breaks the Merkle proof
5. **Cross-reference verification**: If a deed references a mortgage at Book/Page X, verify that document exists and hasn't been altered
6. **Temporal proof**: Prove that a document existed at a specific point in time
7. **Chain integrity**: Verify that every grantor was a prior grantee (no phantom owners)

### Fraud Scenarios Origin Catches
| Fraud Type | How Origin Catches It |
|------------|----------------------|
| **Forged deed** | Hash doesn't match original filing |
| **Altered consideration** | Document hash changes when price is modified |
| **Phantom mortgage discharge** | No matching document at referenced book/page |
| **Backdated filing** | On-chain timestamp proves document didn't exist at claimed date |
| **Seller impersonation** | Chain-of-title shows no prior deed to the "seller" |
| **Double-filing** | Same property hash tree would show conflicting deeds |
| **Wire fraud** | Verified owner identity from chain vs fraudulent redirect |

### The Pitch to Title Companies
*"Your title examiners spend 2-8 hours per property, and you still can't detect document tampering. Origin gives you instant chain-of-title verification with cryptographic proof that every document is authentic and unaltered. The last document fraud that cost your company a claim? Origin would have caught it before the policy was issued."*

---

## What Can't Be Automated (Human Required)

1. **Legal interpretation** — Does this easement actually restrict development? (Requires lawyer)
2. **Survey review** — Metes and bounds descriptions need surveyor verification
3. **Title curative work** — Clearing defects requires legal action
4. **Municipal lien certificates** — Must be requested from town ($25-50 each, no bulk access)
5. **Registered land certificates** — Land Court, mostly paper-based
6. **Physical inspection** — Encroachments, boundary disputes, unrecorded easements

These are the human-in-the-loop steps. Everything else can be automated.
