# Origin Land Records — Product Design
## The AI-Readable, Fraud-Resistant Property Record

### Vision
The first AI-readable, cryptographically verified land records dataset for Massachusetts. Every property gets a structured, queryable record that combines 15+ data sources with an integrity layer that detects document tampering.

---

## The Fraud Problem

### Current State: No Verification
- Registry documents are scanned images with physical stamps
- "Verified/Certified" is a label, not a cryptographic proof
- Anyone who can forge a notary seal can file a fraudulent deed
- No way to detect if a document image was altered after filing
- Wire fraud in real estate closings: **$1.4 billion lost in 2023** (FBI IC3)
- Title companies pay billions annually in claims for fraud they couldn't detect

### Fraud Types in Title Records
| Type | Description | Frequency |
|------|-------------|-----------|
| **Deed fraud** | Forged deed transferring property without owner knowledge | Growing |
| **Seller impersonation** | Fraudster poses as owner to sell property | Common |
| **Forged discharge** | Fake mortgage discharge to clear lien for fraudulent sale | Rare but devastating |
| **Wire fraud** | Hacked closing instructions redirect wire transfer | $1.4B in 2023 |
| **Phantom mortgage** | Fake mortgage filed against property for fraudulent borrowing | Growing |
| **Title washing** | Filing false documents to obscure ownership history | Organized crime |
| **Backdated documents** | Documents filed with false dates to claim priority | Difficult to detect |

### What Origin Adds
Every document gets hashed at extraction time. The hash chain proves:
1. **Existence** — This document was in the registry on this date
2. **Integrity** — The document hasn't been altered since extraction
3. **Completeness** — No documents have been inserted or removed from the chain
4. **Temporal order** — The chain respects chronological order

---

## Data Product Schema

### Per-Property Origin Record
```json
{
  "origin": {
    "version": "1.0",
    "propertyId": "MA-BERK-MID-111-SWAMP-RD-RICHMOND",
    "extractionDate": "2026-04-19T00:00:00Z",
    "merkleRoot": "sha256:abc123...",
    "onChainAnchor": {
      "chain": "polygon",
      "txHash": "0x...",
      "block": 12345678,
      "timestamp": "2026-04-19T15:30:00Z"
    }
  },
  
  "property": {
    "address": {
      "number": "111",
      "street": "Swamp Rd",
      "town": "Richmond",
      "county": "Berkshire",
      "state": "MA",
      "zip": "01254",
      "aliases": [],
      "h3Index": "8b2a100d2c9ffff"
    },
    "parcel": {
      "id": "249/000.0-0000-0000.0",
      "gisId": "...",
      "coordinates": { "lat": 42.375, "lng": -73.367 }
    }
  },

  "registry": {
    "district": "Middle Berkshire",
    "registryCode": "BerkMiddle",
    "recordCount": 14,
    "dateRange": { "earliest": "1997-07-07", "latest": "2015-10-22" },
    "records": [
      {
        "docNum": "549232",
        "fileDate": "2000-08-11",
        "recTime": "15:03:00.000",
        "type": "DEED",
        "subType": "QUITCLAIM",
        "pages": 3,
        "bookPage": "01760/119",
        "consideration": 274000.00,
        "status": "Verified/Certified",
        "parties": {
          "grantors": ["FOSTER JOHN E", "FOSTER MARY L"],
          "grantees": ["SPRAGUE STEVEN", "SPRAGUE JUDITH"]
        },
        "references": [
          { "bookPage": "07532/106", "type": "INSTRUMENT OF TAKING", "year": 2023 }
        ],
        "documentHash": "sha256:def456...",
        "ocrText": "We, JOHN E. FOSTER and MARY L. FOSTER, husband and wife, of Richmond, Berkshire County, Massachusetts, for $274,000.00 consideration paid, grant to Steven Sprague and Judith Sprague...",
        "ocrConfidence": 0.97,
        "fraudFlags": []
      }
    ]
  },

  "chainOfTitle": {
    "currentOwner": {
      "names": ["SPRAGUE STEVEN K", "SPRAGUE JUDITH K"],
      "since": "2000-08-11",
      "deedRef": "01760/119",
      "tenancy": "Tenants by the Entireties"
    },
    "priorOwners": [
      {
        "names": ["FOSTER JOHN E", "FOSTER MARY L"],
        "from": "before 1997",
        "to": "2000-08-11",
        "deedRef": "01760/119"
      }
    ],
    "chainComplete": true,
    "chainScore": 0.95,
    "gaps": []
  },

  "liens": {
    "active": [
      {
        "type": "MORTGAGE",
        "amount": 150000,
        "lender": "LENOX NATIONAL BANK",
        "filedDate": "2012-08-01",
        "bookPage": "05008/2",
        "status": "ACTIVE",
        "note": "Assigned 10/22/2015 per 05644/44"
      }
    ],
    "discharged": [
      {
        "type": "MORTGAGE",
        "amount": 300000,
        "lender": "LENOX NATIONAL BANK",
        "filedDate": "2000-11-22",
        "dischargedDate": "2015-08-21",
        "dischargeRef": "05609/228"
      }
    ],
    "taxLiens": [],
    "executions": [],
    "lispendens": []
  },

  "assessor": {
    "source": "MassGIS + Town Assessor",
    "fiscalYear": 2026,
    "assessedValue": {
      "total": 450000,
      "land": 200000,
      "building": 250000
    },
    "propertyDetails": {
      "lotSize": "74 acres",
      "lotSizeSF": 3223440,
      "yearBuilt": 1780,
      "grossArea": 1600,
      "livingArea": 1600,
      "bedrooms": 2,
      "bathrooms": 1,
      "style": "Colonial",
      "condition": "Average",
      "heating": "Hot Water",
      "stories": 2
    },
    "taxRate": 14.50,
    "annualTax": 6525.00
  },

  "environmental": {
    "floodZone": { "zone": "X", "source": "FEMA NFHL", "firmPanel": "..." },
    "wetlands": false,
    "aul": null,
    "twentyOneE": null,
    "conservationRestriction": false
  },

  "market": {
    "lastSaleDate": "2000-08-11",
    "lastSalePrice": 274000,
    "priorSaleDate": null,
    "priorSalePrice": null
  },

  "integrity": {
    "documentHashes": [
      { "docNum": "549232", "bookPage": "01760/119", "sha256": "sha256:...", "pages": 3 },
      { "docNum": "824094", "bookPage": "05008/2", "sha256": "sha256:...", "pages": 8 }
    ],
    "merkleTree": {
      "root": "sha256:abc123...",
      "leaves": 14,
      "algorithm": "SHA-256",
      "treeHeight": 4
    },
    "fraudAnalysis": {
      "score": 0.0,
      "flags": [],
      "chainIntegrity": "VERIFIED",
      "documentIntegrity": "ALL_HASHES_VALID",
      "ownershipContinuity": "VERIFIED",
      "lienDischargeMatch": "ALL_DISCHARGED_MATCHED",
      "lastVerified": "2026-04-19T15:30:00Z"
    }
  }
}
```

---

## Multi-Source Attestation & Confidence Scoring

### The Core Innovation
Origin doesn't just copy records — it **cross-references independent sources** and produces a cryptographic proof that they agree. This is the trust layer that doesn't exist anywhere today.

### How It Works
```
For each property:
  1. Pull record from MassGIS (assessor source A)
  2. Pull record from Registry of Deeds (source B)
  3. Pull record from Town Assessor (source C)
  4. Compare overlapping fields across all sources
  5. Calculate confidence score (0.0 to 1.0)
  6. Hash each source's contribution independently
  7. Combine hashes into Origin Signature
  8. Anchor to chain = proof of cross-referenced verification at point in time
```

### Field-Level Cross-Reference Matrix
| Field | MassGIS | Registry | Town Assessor | Match? |
|-------|---------|----------|---------------|--------|
| Owner name | SPRAGUE STEVEN | SPRAGUE STEVEN (grantee) | SPRAGUE, STEVEN & JUDITH | fuzzy match ✓ |
| Sale price | $274,000 (LS_PRICE) | $274,000 (consideration) | $274,000 | exact ✓ |
| Book/Page | 1760/119 (LS_BOOK/LS_PAGE) | 01760/119 | 1760/119 | exact ✓ |
| Sale date | 20000811 (LS_DATE) | 08/11/2000 (fileDate) | 08/11/2000 | exact ✓ |
| Address | 109 SWAMP ROAD | 111 SWAMP RD | 111 Swamp Rd | MISMATCH ⚠ |
| Lot size | 10.34 acres | (not in registry) | 74 acres total | partial ✓ |

### Confidence Score Calculation
```
confidence = (exact_matches × 1.0 + fuzzy_matches × 0.8 + mismatches × 0.0) / total_fields

Example — 111 Swamp Rd:
  4 exact matches × 1.0 = 4.0
  1 fuzzy match × 0.8 = 0.8
  1 mismatch × 0.0 = 0.0
  confidence = 4.8 / 6 = 0.80

  Mismatch detail: Address 109 vs 111 (assessor vs registry)
  → Flagged for human review, but not fraud — likely data entry variation
```

### Origin Signature Construction
```
origin_signature = SHA-256(
  SHA-256(massgis_record_json) +
  SHA-256(registry_records_json) +
  SHA-256(assessor_record_json) +
  confidence_score +
  timestamp
)

// Anchored on Polygon:
// - Merkle root of all property signatures for the batch
// - One tx covers thousands of properties
// - Cost: $0.01 per batch (not per property)
```

### Confidence Tiers (Product)
| Score | Tier | Meaning | Title Company Action |
|-------|------|---------|---------------------|
| 0.95-1.0 | **GREEN** | All sources agree, no flags | Fast-track closing, minimal review |
| 0.80-0.94 | **YELLOW** | Minor discrepancies (name variations, address format) | Standard review |
| 0.60-0.79 | **ORANGE** | Significant gaps (missing records, complex encumbrances) | Detailed examination required |
| 0.00-0.59 | **RED** | Major conflicts or fraud indicators | Full manual title search + underwriter review |

### Per-Property Data Wallet
Each property gets a persistent identity (wallet address) that accumulates records over time:
```
Property Wallet: 0x7a3b...
├── Genesis: First extraction (all historical records hashed)
├── Update 1: New deed filed → re-extract, re-hash, re-score
├── Update 2: Mortgage discharged → confidence increases
├── Update 3: Tax lien filed → confidence drops, alert sent
└── Current: Merkle root reflects complete verified history
```

**The wallet IS the title plant.** Any AI agent can query it. Any title company can verify it. The confidence score tells you instantly whether to trust it or dig deeper.

### The Business Model Shift
Today: Title company pays $200-400 per search, gets a one-time report.
Origin: Title company subscribes, gets continuous monitoring with live confidence scores. When a new document files against any property in their portfolio, the wallet updates and the score recalculates. Proactive fraud detection, not reactive title search.

---

## MCP Tools

### Search & Query
```
search_property(address, town)        → Full Origin record
get_chain_of_title(propertyId)        → Ownership chain with scores
check_liens(propertyId)               → Active liens, encumbrances
get_document(bookPage, registry)      → Specific document + hash
compare_properties(propertyIds[])     → Side-by-side comparison
search_by_owner(name)                 → All properties for an owner
search_by_street(street, town)        → All properties on a street
```

### Verification & Fraud Detection  
```
verify_document(docNum)               → Hash check against Merkle root
verify_chain(propertyId)              → Full chain integrity check
flag_anomalies(propertyId)            → AI fraud analysis
compare_registries(propertyId)        → Cross-source consistency check
audit_property(propertyId)            → Full audit report (title examiner replacement)
```

### Data Integration
```
get_assessor_data(propertyId)         → Assessed values, building details
get_flood_zone(propertyId)            → FEMA flood zone
get_environmental(propertyId)         → DEP 21E, AULs, wetlands
get_corporate_owner(entityName)       → Secretary of State lookup
```

---

## Fraud Detection Rules (Automated)

### Rule-Based (No LLM)
1. **Orphan deed**: Deed where grantor never appears as prior grantee
2. **Unmatched discharge**: Mortgage with no corresponding discharge
3. **Phantom discharge**: Discharge referencing a mortgage that doesn't exist
4. **Double deed**: Two deeds for same property filed within 30 days
5. **Zero consideration**: Non-family deed with $0 or $1 consideration
6. **Circular ownership**: A→B→C→A transfer patterns
7. **Excessive liens**: More than 5 active liens (financial distress indicator)

### LLM-Powered (requires AI)
1. **OCR anomaly**: Text style/font changes within a document
2. **Consideration outlier**: Sale price >3x or <0.3x assessed value
3. **Name variation analysis**: Detecting intentional name misspellings
4. **Entity opacity**: LLC with no Secretary of State registration
5. **Temporal anomaly**: Documents filed out of chronological order
6. **Cross-reference gaps**: Referenced documents that don't exist

---

## Licensing Model

### For Title Companies
| Tier | Price | Includes |
|------|-------|----------|
| **Search** | $5/property | Full Origin record query |
| **Professional** | $500/month | Unlimited searches, API access |
| **Enterprise** | $2,500/month | Bulk data, fraud alerts, API, SLA |

### For AI Agents
| Tier | Price | Includes |
|------|-------|----------|
| **MCP Basic** | Free | 10 queries/day, no fraud analysis |
| **MCP Pro** | $25/month | 1,000 queries/day, fraud flags |
| **MCP Enterprise** | $200/month | Unlimited, full audit reports |

### Revenue Model
- 1M properties in MA × average 2 searches/year = 2M queries
- At $5/query average = **$10M/year potential** for MA alone
- 50 states × similar datasets = **$500M market**

---

## Origin Data Wallet — Per-Property Living Record

### The Vision
Every property in Massachusetts gets a data wallet — a persistent, self-verifying record that accumulates truth over time. Not mandated by regulation. Adopted because it's better.

### Wallet Lifecycle
```
GENESIS (first extraction):
  Property discovered in MassGIS manifest
  → Registry records extracted and hashed
  → Assessor data pulled and hashed  
  → Cross-referenced, confidence scored
  → Origin signature created
  → Anchored to Polygon
  → Wallet address assigned: 0x...
  → Property now has a verifiable digital identity

LIVING RECORD (ongoing):
  New deed filed at registry
  → Auto-detected (daily registry scan or webhook)
  → New record extracted, hashed, added to wallet
  → Chain of title extended
  → Confidence recalculated
  → New Merkle root anchored
  → Subscribers notified

  Assessor update (annual)
  → New assessed value pulled from MassGIS
  → Cross-referenced against last sale price
  → Anomalies flagged (assessment 3x sale price = possible error)
  → Wallet updated

  Environmental event
  → DEP files 21E notice → AUL restriction detected
  → Wallet flagged, confidence drops
  → Title companies alerted

  Property sale
  → New deed recorded → new owner
  → Wallet transfers with property (like a car title)
  → Buyer inherits full verified history
  → Seller's wallet relationship ends
  → Chain of custody unbroken
```

### Wallet Contents
```json
{
  "wallet": {
    "address": "0x7a3b...",
    "propertyId": "MA-BERK-MID-111-SWAMP-RD-RICHMOND",
    "created": "2026-04-19T15:30:00Z",
    "currentOwner": "SPRAGUE STEVEN & JUDITH",
    "merkleRoot": "sha256:...",
    "confidence": 0.80,
    "lastVerified": "2026-04-19T15:30:00Z",
    "eventCount": 14,
    "noteCount": 0
  },
  "events": [
    {
      "id": 1,
      "type": "GENESIS",
      "timestamp": "2026-04-19T15:30:00Z",
      "source": "masslandrecords.com + MassGIS",
      "description": "Initial extraction: 14 registry records + assessor data",
      "hash": "sha256:...",
      "confidence": 0.80
    },
    {
      "id": 2,
      "type": "REGISTRY_UPDATE",
      "timestamp": "2026-05-01T...",
      "source": "masslandrecords.com",
      "description": "New mortgage filed: Book 08001/Page 123",
      "hash": "sha256:...",
      "confidence": 0.80
    }
  ],
  "notes": [
    {
      "timestamp": "2026-04-19",
      "author": "system",
      "note": "Address discrepancy: Assessor has 109 Swamp Rd, Registry has 111 Swamp Rd. Same parcel confirmed via Book/Page cross-reference."
    }
  ]
}
```

### Why It Wins Without Regulation

**The DKIM model, not the HIPAA model.**

DKIM became the email authentication standard because:
- Emails WITH DKIM signatures got delivered to inbox
- Emails WITHOUT got flagged as spam
- No law required it. Gmail just started checking.
- Within 5 years, 80%+ of domains had DKIM

Origin property wallets follow the same pattern:
- Properties WITH wallets close faster (lower title search cost)
- Properties WITHOUT require full manual title examination
- No law required. Title companies just start checking.
- Within 5 years, walleted properties become the norm

**Incentive structure (self-reinforcing):**
| Party | Incentive |
|-------|-----------|
| Title companies | Lower search cost, faster closings, reduced fraud claims |
| Buyers | Verified history before offer, transparent title status |
| Sellers | Faster closings, higher buyer confidence |
| Lenders | Multi-source attestation > single title search |
| Insurers | Quantified fraud risk = better pricing |
| Real estate agents | Competitive advantage — "this listing has an Origin wallet" |
| AI agents | Queryable structured data vs. unreadable scanned images |

**The regulatory model says "you must."**
**The Origin model says "you'd be crazy not to."**

Same outcome. Faster adoption. No lobbying required.

### Network Effect
- First 1,000 properties: proof of concept
- First 10,000: title companies start checking wallets before manual search
- First 100,000: insurance companies offer discounts for walleted properties
- First 1,000,000: walleted becomes the default assumption
- Non-walleted properties become the exception that requires extra work

---

## Build Plan

## SSL-Anchored Provenance — The Collection Attestation

### The Insight
Every document we collect from masslandrecords.com is served over TLS. The registry's SSL certificate is their digital identity — issued by a trusted CA, bound to their domain, with a validity period. By capturing the SSL certificate details at the moment of collection, we create a provenance chain that proves:

1. **What** — SHA-256 hash of the document
2. **Where** — masslandrecords.com (verified by SSL certificate)
3. **When** — timestamp anchored on-chain
4. **How** — TLS connection details (cert fingerprint, protocol version)

### Provenance Record Structure
```json
{
  "provenance": {
    "documentHash": "sha256:abc123...",
    "source": {
      "domain": "masslandrecords.com",
      "registry": "BerkMiddle",
      "url": "https://www.masslandrecords.com/BerkMiddle/D/DownloadWizardEx.aspx",
      "httpStatus": 200
    },
    "ssl": {
      "issuer": "DigiCert SHA2 Extended Validation Server CA",
      "subject": "*.masslandrecords.com",
      "serialNumber": "0x3a7b...",
      "validFrom": "2025-01-15T00:00:00Z",
      "validTo": "2027-01-15T23:59:59Z",
      "fingerprint": "SHA-256:ab:cd:ef:12:34:...",
      "protocol": "TLSv1.3",
      "cipherSuite": "TLS_AES_256_GCM_SHA384"
    },
    "collection": {
      "timestamp": "2026-04-20T11:28:00Z",
      "collectorId": "origin-land-records-v0.1",
      "sessionId": "berk-middle-batch-001"
    },
    "attestation": "sha256(documentHash + sslFingerprint + timestamp)",
    "anchor": {
      "chain": "polygon",
      "txHash": "0x...",
      "block": 12345678,
      "merkleRoot": "sha256:..."
    }
  }
}
```

### Why This Is Powerful

**The registry attests without knowing it.** Their SSL certificate IS their endorsement key (same concept as TPM endorsement key in trusted computing). We don't need their cooperation — they're already signing every response with their private key via TLS.

**Forgery detection:** If someone produces a document claiming to be from the registry, but there's no matching provenance record with a valid SSL attestation and on-chain timestamp, it's suspect.

**Temporal proof:** The on-chain anchor proves the document existed at a specific time. Combined with the SSL cert validity period, this creates a narrow window that pins the document to a specific collection event.

**Certificate rotation tracking:** When the registry renews their SSL cert, the fingerprint changes. Our records show which cert was active at each collection time — creating a chronological chain of SSL attestations.

**The Wave/TPM lineage:** SSL certificate = endorsement key. Document hash = measurement. On-chain anchor = attestation log. This is trusted computing for land records, using infrastructure that already exists.

### Collection Pipeline (Enhanced)
```
1. Open TLS connection to masslandrecords.com
2. Capture SSL certificate details (fingerprint, issuer, validity)
3. Perform search / download document
4. Hash the received document (SHA-256)
5. Construct provenance record (doc hash + SSL fingerprint + timestamp)
6. Hash the provenance record
7. Add to batch Merkle tree
8. Anchor Merkle root to Polygon
9. Store: document + provenance record + Merkle proof
```

Cost per document: ~$0.0001 (hash computation + share of batch anchor tx)

---

### Strategic Sequencing
Phase 1 ships the dataset. Phases 2-3 scale it. The integrity layer (hashing, Merkle trees, wallets, on-chain anchoring) computes silently from day one but launches as a product feature when the market timing is right. Build the customer base first, then reveal the moat.

### Phase 1: Berkshire County PoC (Weeks 1-4)
- [ ] Scrape all Middle Berkshire property index (1,056,169 docs)
- [ ] Download MassGIS parcels for Berkshire County
- [ ] OCR sample documents (100 properties)
- [ ] Build chain-of-title engine
- [ ] Hash all document images
- [ ] Stand up MCP server with search tools
- [ ] Demo to Tracie + title company contacts

### Phase 2: All Berkshire + Suffolk (Weeks 5-8)
- [ ] Add South Berkshire + North Berkshire
- [ ] Add Suffolk County (Boston)
- [ ] Integrate Boston assessor CSV (full city)
- [ ] Add FEMA flood zones overlay
- [ ] Add Secretary of State LLC lookups
- [ ] Private LLM for OCR at scale
- [ ] On-chain Merkle root anchoring (Polygon)

### Phase 3: Statewide (Weeks 9-16)
- [ ] All 21 registries
- [ ] All MassGIS parcels statewide
- [ ] Fraud detection engine (rule-based + LLM)
- [ ] Title company pilot program
- [ ] Stripe billing integration
- [ ] API documentation

### Phase 4: National (Q3-Q4 2026)
- [ ] Identify states with similar digital records
- [ ] Template the scraper for other states
- [ ] Partner with title companies for distribution
- [ ] MCP registry listing
