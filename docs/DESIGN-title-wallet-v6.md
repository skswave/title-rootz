# Design: Origin Title Wallet — V6 Architecture

**Version:** 2.0
**Date:** April 24, 2026
**Author:** Steven Sprague / Claude
**Status:** Design

---

## Vision

The Origin Title Wallet is the **root document system** for real property. Every document produced at a closing — deed, disclosures, settlements, inspections, certifications — becomes a signed, timestamped, immutable record attached to the property itself.

This is not a document management system. It is the **foundation layer** for three things:

1. **Authenticity** — every document carries cryptographic proof of who created it, when, and from what source
2. **Fraud reduction** — cross-property, cross-document verification makes forgery economically irrational
3. **RWA tokenization** — the accumulated wallet IS the digital representation of the real asset. You cannot tokenize what you cannot prove.

The wallet is a property's birth certificate under each new owner — everything that was represented in the sale, every disclosure signed, every certification issued, every inspection performed. The complete provenance of the transaction.

---

## Architecture: V6 Mapping

### Core Principle

```
Property       = Secret  (one Polygon contract per property, lives forever)
Document       = Note    (signed, encrypted, with original PDF/scan as IPFS file attachment)
Document Group = KeyVault (organized by sensitivity — public, disclosure, settlement, wire, etc.)
Party          = Team Member (added via addTeamMember with ECDH key, gets access to specific KeyVaults)
Organization   = Identity Contract (title company, law firm, lender — multiple users share one Identity)
```

### The V6 Stack

| V6 Component | Title Wallet Role |
|---|---|
| `SovereignSecretWalletFactory` | Deploys one contract per property — the wallet |
| `Secret Contract` | The property's on-chain identity. Holds KeyVaults, team members, notes. |
| `KeyVault (createKeyVault)` | Document group compartment — organized by sensitivity, not by party |
| `Note (writeData)` | Each closing document. Content + original PDF as IPFS file attachment. |
| `addTeamMember` | On-chain party registration with role, ECDH public key, encrypted access key |
| `Identity Contract` | Multi-user organization (title co with 5 employees, married couple, law firm) |
| `Rivet` | Individual device/user on an Identity — each gets their own encrypted key entry |
| `Fat Key Package` | 1-step key distribution to all rivets on an Identity contract |
| `Write Authorization (v/r/s)` | Pre-signed permission for team members to write notes |
| `IPFS (Pinata)` | Stores encrypted document content and original PDFs/scans |
| `VDN Pattern` | Hides IPFS locations — only key holders can find documents |
| `ECDH` | Per-party key exchange. Each team member gets keys to their authorized KeyVaults. |
| `@rootz/crypto` | AES-256-GCM for content, SHA-256 for document integrity |
| `@rootz/chain-reader` | Read wallet state, notes, events, team members from chain |
| `Credits` | Pay for note writes. Title company funds the wallet at closing. |

### Why Identity Contracts Matter

A title company is not one person with one wallet. It's an organization with a receptionist, paralegals, title officers, closers, and principals. An Identity contract represents the company:

```
Berkshire Title Services — Identity Contract (0x111...)
├── Rivet: Jane (paralegal) — laptop
├── Rivet: Mike (title officer) — desktop
├── Rivet: Sarah (closer) — laptop + phone
└── Rivet: Tom (principal) — phone

When the company is added as team member on a Property Secret:
  → Fat Key Package encrypts KeyVault keys for ALL 4 rivets
  → Any rivet can read the documents
  → Any rivet with write authorization can add notes
  → When Jane quits → remove rivet → access revoked across ALL properties
  → When new hire starts → add rivet → instant access to everything the company can see
```

This scales: a title company doing 500 closings/year has ONE Identity contract but is a team member on 500 Property Secrets. A lender financing 10,000 mortgages = one Identity, 10,000 team memberships.

### Data Flow

```
Title Company closes transaction
         │
         ▼
    Closing Package
    (PDFs, scans, structured data)
         │
         ▼
┌──────────────────────────────────────────┐
│  1. DEPLOY PROPERTY SECRET               │
│     Factory.createSovereignWalletAsNew-  │
│     born() owned by Title Co Identity    │
│     → Property contract: 0xABC...        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  2. CREATE KEYVAULTS (by document group) │
│     KV-PUBLIC      — deed, chain, certs  │
│     KV-DISCLOSURE  — lead, septic, env   │
│     KV-SETTLEMENT  — CD/HUD-1, prorations│
│     KV-WIRE        — wire instructions   │
│     KV-MORTGAGE    — note, mortgage, appr│
│     KV-TITLE       — exam, policies      │
│     KV-INSPECTION  — inspections, surveys│
│     KV-CONTRACT    — P&S, addenda        │
│     KV-ENTITY      — POA, corp docs      │
│     KV-COMMERCIAL  — leases, estoppels   │
│     (only create what the deal requires) │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  3. ADD TEAM MEMBERS (each party)        │
│     For each party at closing:           │
│       a. addTeamMember(address, role,    │
│          encryptedAccessKey, publicKey)   │
│       b. Encrypted access key contains   │
│          the KV keys they're entitled to │
│       c. If party is an Identity:        │
│          send Fat Key Package so all     │
│          rivets can decrypt              │
│                                          │
│     Title Co Identity → ALL KVs (ADMIN)  │
│     Buyer Identity → PUBLIC, DISCLOSURE, │
│       SETTLEMENT(buyer), MORTGAGE,       │
│       TITLE, INSPECTION, CONTRACT        │
│     Seller Identity → PUBLIC, DISCLOSURE,│
│       SETTLEMENT(seller), CONTRACT       │
│     Attorney Identity → ALL except       │
│       internal notes (ADMIN)             │
│     Lender Identity → PUBLIC, MORTGAGE,  │
│       SETTLEMENT(buyer), TITLE,          │
│       INSPECTION                         │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  4. WRITE NOTES (per document)           │
│     For each closing document:           │
│       a. Upload original PDF to IPFS     │
│          (encrypted with KV key)         │
│       b. Encrypt IPFS hash (VDN pattern) │
│       c. Write Note to the appropriate   │
│          KeyVault for that doc type      │
│       d. Note includes metadata:         │
│          - document type + category      │
│          - signer / notary               │
│          - SHA-256 of original PDF       │
│          - provenance (source SSL cert)  │
│          - registry reference if recorded│
│          - compliance (statute, req'd by)│
│                                          │
│     Each Note = 1 document = 1 KV write  │
│     Team members read their authorized   │
│     KVs — they see only their documents  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  5. PROPERTY WALLET IS LIVE              │
│     - QR code generated for deed         │
│     - Team members notified              │
│     - MCP tools can query                │
│     - Confidence score computed           │
│     - Ready for next transaction          │
│     - Ready for post-closing additions    │
└──────────────────────────────────────────┘
```

---

## Smart Contract Foundation

### Solidity Functions Used

```solidity
// FACTORY — Deploy one Secret per property
function createSovereignWalletAsNewborn(
  address userAuthorizer,     // Title Co Identity (owner)
  address newbornAddress,     // Authorized signer
  string walletName,          // "111 Swamp Rd, Richmond MA"
  string secretName,          // "Origin Title Wallet"
  string secretType,          // "title-wallet"
  bytes authSignature,
  uint256 nonce
) payable returns (address)   // → Property Secret contract address

// SECRET — Create document group compartments
function createKeyVault(
  bytes encryptedKeysData,    // AES-encrypted KV key (for owner/team)
  bytes schemaDefinition      // JSON: what document types, access rules
) external
// Emits: KeyVaultCreated(blockNumber, creator, encryptedKeysData, schemaDefinition, timestamp)
// blockNumber IS the KeyVault ID

// SECRET — Add parties at closing
function addTeamMember(
  address member,             // Party's wallet or Identity contract
  uint8 role,                 // 0=NONE, 1=VIEWER, 2=MEMBER, 3=ADMIN
  string encryptedAccessKey,  // ECDH-encrypted KV keys for their authorized vaults
  string publicKey            // Party's ECDH public key (0x04...)
) external
// Emits: TeamMemberAdded(member, role, addedBy, timestamp)
// Only callable by owner (Title Co Identity)

// SECRET — Write documents as Notes
function writeData(
  uint256 keyVaultBlock,      // Which KeyVault (block number)
  bytes data,                 // AES-encrypted Note JSON (content + file refs)
  uint256 expiresAt,          // 0 = never expires
  uint8 v, bytes32 r, bytes32 s  // Authorization signature
) external
// Emits: DataWritten(secretContract, writer, keyVaultBlock, data, creditsCost, timestamp)
//
// Three write authorization paths:
//   PATH 1 (v=0, r=0, s=0): Owner writes directly (Title Co)
//   PATH 2 (v>=27):         Team member with pre-signed ECDSA auth from owner
//   PATH 3 (EIP-1271):      Identity contract validates via isValidSignature()

// SECRET — Fund operations
function fundOperations(address owner, int256 credits) external
function fundVaultCredits(uint256 keyVaultBlock, uint256 amount) external
```

### Identity Contract — Multi-User Organizations

```solidity
// IDENTITY — Add employee/device
function addRivet(address rivet, string name) external
// → New employee "Jane" gets added as a rivet

// IDENTITY — Register ECDH public key for encryption
function registerPublicKey(string publicKey) external
// → Jane's device registers its public key so Fat Key Packages can be sent

// IDENTITY — Route transactions through the org
function executeTransaction(
  address destination,        // Property Secret contract
  uint256 value,
  bytes data                  // Encoded writeData() call
) external returns (bool, bytes)
// → Jane writes a note; the Identity contract is the msg.sender

// IDENTITY — Receive keys from other parties
// fallback() emits MessageReceived(from, data, value, messageIndex, timestamp)
// → Fat Key Packages arrive here, all rivets can scan for their entry
```

### Write Authorization — How Team Members Write Notes

The owner (Title Company Identity) pre-signs authorizations at closing. Each team member receives a signed permission slip that lets them write to their authorized KeyVaults:

```
Authorization hash = keccak256(abi.encode(
  secretContract,    // This property
  keyVaultBlock,     // This KeyVault
  writerAddress,     // This team member
  expiresAt          // Expiration (0 = never)
))

Owner signs hash → (v, r, s)
Team member includes (v, r, s) in writeData() call
Secret contract verifies: ecrecover(hash, v, r, s) == owner
```

For Identity-owned secrets (EIP-1271 path): rivet signs, submits signature via `submitRivetSignature()`, then calls `writeData()` with the submission hash. The Secret validates via `Identity.isValidSignature()`.

---

## KeyVault Structure (Document Groups)

KeyVaults are organized by **document sensitivity**, not by party. Each team member gets the KV keys for their authorized vaults at closing via their `encryptedAccessKey` in `addTeamMember()`.

### KeyVault Layout

| KeyVault | schemaDefinition | Documents Stored | Persists |
|---|---|---|---|
| **KV-PUBLIC** | `{ access: "public", category: "conveyance" }` | Deed, chain of title, attestation, smoke/CO certs, homestead, zoning, wetlands, ADA | Forever — QR code on deed links here |
| **KV-DISCLOSURE** | `{ access: "parties", category: "disclosure" }` | Lead paint, septic, UFFI, municipal lien cert, environmental | Yes |
| **KV-SETTLEMENT** | `{ access: "restricted", category: "settlement" }` | Closing Disclosure / HUD-1, TILA, 1099-S, FIRPTA, W-9, tax prorations, water/sewer | Yes — buyer and seller each see their own side |
| **KV-WIRE** | `{ access: "confidential", category: "wire" }` | Wire instructions (buyer + seller), payoff letter | Yes — highest sensitivity |
| **KV-MORTGAGE** | `{ access: "parties", category: "mortgage" }` | Promissory note, mortgage, riders, escrow, borrower's affidavit, appraisal, flood, insurance, PMI | Yes |
| **KV-TITLE** | `{ access: "parties", category: "title" }` | 50-year exam, title cert, commitment, policies, endorsements, affidavits | Yes |
| **KV-INSPECTION** | `{ access: "parties", category: "inspection" }` | Home inspection, pest, radon, well, survey, Phase I/II, 21E, asbestos | Yes |
| **KV-CONTRACT** | `{ access: "parties", category: "contract" }` | P&S, addenda, amendments, deposit receipt | Yes |
| **KV-ENTITY** | `{ access: "restricted", category: "entity" }` | POA, corporate resolution, trust cert, good standing | As applicable |
| **KV-CONDO** | `{ access: "parties", category: "condo" }` | 6(d) cert, master deed, bylaws, rules, budget, insurance | If condo |
| **KV-COMMERCIAL** | `{ access: "parties", category: "commercial" }` | Estoppels, rent roll, leases, SNDA, bill of sale, assignments | If commercial |

Only the KeyVaults needed for the transaction are created. A cash residential sale might create 6 KeyVaults. A complex commercial deal might create all 11.

### Team Member → KeyVault Access Matrix

Each team member's `encryptedAccessKey` contains the KV keys for their authorized vaults:

| Team Member | Role | PUBLIC | DISCLOSURE | SETTLEMENT | WIRE | MORTGAGE | TITLE | INSPECTION | CONTRACT | ENTITY | CONDO | COMMERCIAL |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Title Company** | ADMIN | x | x | x (both) | x (both) | x | x | x | x | x | x | x |
| **Attorney** | ADMIN | x | x | x (both) | x (both) | x | x | x | x | x | x | x |
| **Buyer** | MEMBER | x | x | x (buyer) | x (buyer) | x | x | x | x | if applicable | x | x |
| **Seller** | MEMBER | x | x | x (seller) | x (seller) | — | x | — | x | if applicable | x | x |
| **Lender** | MEMBER | x | x | x (buyer) | — | x | x | x | — | — | x | — |
| **Future Title Co** | VIEWER | x | — | — | — | — | — | — | — | — | — | — |

**Settlement and Wire separation:** The Closing Disclosure has a buyer side and seller side. Notes in KV-SETTLEMENT are tagged with `metadata.side: "buyer"` or `"seller"`. The KV key is the same, but the `encryptedAccessKey` given to the buyer only includes the KV-SETTLEMENT key if the template permits buyer settlement access. For wire instructions (KV-WIRE), the buyer's access key excludes seller wire notes and vice versa — achieved by writing buyer and seller wires as separate notes with different KV keys within the same logical group, or by splitting into KV-WIRE-BUYER and KV-WIRE-SELLER when maximum separation is required.

### Access Control Matrix — Full Document Set

**Legend:** P = Public KV, B = Buyer KV, S = Seller KV, T = Title Co KV, A = Attorney KV, L = Lender KV, F = Future Title Co KV

#### Category 1: Conveyance Documents

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Deed (Quitclaim/Warranty/Release) | x | x | x | x | x | x | x |
| Deed Excise Tax Stamps receipt | x | x | x | x | x | | x |
| Declaration of Homestead | x | x | | x | x | x | x |

#### Category 2: State-Required Disclosures (MA)

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Lead Paint Notification (MA + Federal) | | x | x | x | x | x | |
| Title 5 Septic Inspection Report | | x | x | x | x | x | |
| Title 5 Septic Disclosure | | x | x | x | x | x | |
| Smoke Detector Certificate | x | x | x | x | x | x | x |
| CO Detector Certificate | x | x | x | x | x | x | x |
| UFFI Certification | | x | x | x | x | x | |
| Certificate of Occupancy | x | x | x | x | x | x | x |
| Municipal Lien Certificate | | x | x | x | x | x | |

#### Category 3: Federal Requirements

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Closing Disclosure (CD) / HUD-1 | | x | x | x | x | x | |
| Truth in Lending (Final TILA) | | x | | x | x | x | |
| IRS Form 1099-S | | | x | x | x | | |
| FIRPTA Affidavit | | | x | x | x | x | |
| IRS Form W-9 | | | | x | x | | |
| Patriot Act / OFAC verification | | | | x | x | x | |

#### Category 4: Lender / Mortgage Documents

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Promissory Note | | x | | x | x | x | |
| Mortgage (recorded) | x | x | | x | x | x | x |
| Mortgage Rider(s) | | x | | x | x | x | |
| Escrow/Impound Agreement | | x | | x | x | x | |
| Borrower's Affidavit | | x | | x | x | x | |
| Compliance Agreement | | x | | x | x | x | |
| Appraisal | | x | | x | x | x | |
| Flood Zone Determination | | x | | x | x | x | |
| Hazard Insurance Binder | | x | | x | x | x | |
| PMI Disclosure | | x | | x | x | x | |
| Seller's Mortgage Payoff Letter | | | x | x | x | | |

#### Category 5: Title Documents

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 50-Year Title Examination | | x | x | x | x | x | |
| Title Certification | x | x | x | x | x | x | x |
| Title Commitment | | x | | x | x | x | |
| Lender's Title Insurance Policy | | x | | x | x | x | |
| Owner's Title Insurance Policy | | x | | x | x | | |
| Title Insurance Endorsements | | x | | x | x | x | |
| Title Affidavit (Seller) | | | x | x | x | x | |
| Survey Affidavit | | x | | x | x | x | |

#### Category 6: Tax and Assessment

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Real Estate Tax Proration | | x | x | x | x | x | |
| Water/Sewer Final Reading | | x | x | x | x | | |
| Corporate Excise Tax Waiver | | | x | x | x | | |

#### Category 7: Survey, Inspection, Environmental

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Plot Plan / Survey | | x | | x | x | x | |
| ALTA/NSPS Survey (commercial) | | x | | x | x | x | |
| Home Inspection Report | | x | | x | x | | |
| Pest / Termite Report | | x | | x | x | x | |
| Radon Test Report | | x | | x | x | | |
| Well Water Test | | x | x | x | x | x | |
| Phase I ESA (commercial) | | x | | x | x | x | |
| Phase II ESA (if triggered) | | x | | x | x | x | |
| 21E Assessment (if contamination) | | x | x | x | x | x | |
| Wetlands Order of Conditions | x | x | | x | x | x | x |

#### Category 8: Purchase and Sale

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Purchase and Sale Agreement | | x | x | x | x | x | |
| Addenda / Amendments | | x | x | x | x | x | |
| Deposit Receipt | | x | x | x | x | | |

#### Category 9: Condominium / HOA

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 6(d) Certificate | | x | x | x | x | x | |
| Master Deed | x | x | | x | x | x | x |
| Declaration of Trust / Bylaws | | x | | x | x | x | |
| Condo Rules and Regulations | | x | | x | x | | |
| Budget / Financial Statements | | x | | x | x | x | |
| Association Insurance Certificate | | x | | x | x | x | |

#### Category 10: Entity / POA Documents

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Power of Attorney | | x | x | x | x | x | |
| Corporate Resolution / LLC Vote | | | x | x | x | x | |
| Certificate of Good Standing | | | x | x | x | x | |
| Trust Certificate | | x | x | x | x | x | |

#### Category 11: Commercial-Specific

| Document | P | B | S | T | A | L | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Tenant Estoppel Certificates | | x | x | x | x | x | |
| Rent Roll | | x | x | x | x | x | |
| All Leases (full copies) | | x | x | x | x | x | |
| Assignment of Leases and Rents | | x | x | x | x | x | |
| Bill of Sale (personal property) | | x | x | x | x | | |
| Assignment of Contracts | | x | x | x | x | | |
| Assignment of Warranties | | x | x | x | x | | |
| Zoning Verification Letter | x | x | | x | x | x | x |
| SNDA Agreements | | x | x | x | x | x | |
| Environmental Indemnity | | x | | x | x | x | |
| Asbestos Survey / Report | | x | | x | x | x | |
| ADA Compliance Certification | x | x | | x | x | x | x |

---

## Note Schema

Every document in the wallet is a V6 Note with this structure:

```javascript
{
  // V6 Note standard fields
  content: "encrypted markdown summary of the document",
  author: "0x... (signer's wallet address)",
  timestamp: 1714000000,
  
  // File attachment — the original PDF/scan
  files: [{
    ipfsRef: { encrypted, iv, version: '5.0' },  // VDN-encrypted IPFS hash
    filename: "deed-549232-quitclaim.pdf",
    contentType: "application/pdf",
    size: 245760,
    description: "Quitclaim Deed #549232, Foster to Sprague, $274,000",
    contentHash: "sha256:abc123...",  // SHA-256 of original file
    encrypted: true,                   // file content is encrypted on IPFS
    encryptionIv: "hex..."            // IV for file decryption
  }],
  
  // Title Wallet metadata (extensible)
  metadata: {
    walletVersion: "1.0",
    documentType: "deed",                    // See document type enum
    category: "conveyance",                  // See category enum
    subcategory: "quitclaim",               // Specific type
    
    // Provenance
    source: "masslandrecords.com/BerkMiddle",
    sourceSSL: {
      issuer: "DigiCert SHA2 Extended Validation Server CA",
      fingerprint: "SHA-256:ab:cd:ef...",
      capturedAt: "2026-04-24T12:00:00Z"
    },
    
    // Registry reference (if recorded document)
    registry: {
      district: "Middle Berkshire",
      docNum: "549232",
      bookPage: "01760/119",
      fileDate: "2000-08-11",
      pages: 3
    },
    
    // Parties on this document
    parties: {
      grantors: ["FOSTER JOHN E", "FOSTER MARY L"],
      grantees: ["SPRAGUE STEVEN", "SPRAGUE JUDITH"],
      notary: "SORRENTO MARIA A",
      witnesses: []
    },
    
    // Financial (if applicable)
    consideration: 274000,
    
    // Compliance
    requiredBy: "MA law",        // "MA law", "federal law", "lender", "customary"
    statute: "M.G.L. c. 183",   // Legal reference
    
    // Integrity
    documentHash: "sha256:...",  // Hash of the structured content
    fileHash: "sha256:...",      // Hash of the original PDF
    
    // Cross-references
    relatedNotes: [3, 7, 12],   // Note indices in this wallet
    supersedes: null,            // Note index this replaces (for amendments)
    
    // Closing context
    closingDate: "2000-08-11",
    transactionType: "sale",     // sale, refinance, transfer, estate
    propertyAddress: "111 Swamp Rd, Richmond, MA 01254"
  }
}
```

### Document Types (Enum)

```javascript
const DOCUMENT_TYPES = {
  // Conveyance
  deed: { category: 'conveyance', label: 'Deed' },
  deed_excise: { category: 'conveyance', label: 'Deed Excise Tax' },
  homestead: { category: 'conveyance', label: 'Homestead Declaration' },
  
  // State Disclosures
  lead_paint: { category: 'disclosure', label: 'Lead Paint Notification', requiredBy: 'MA + federal' },
  septic_inspection: { category: 'disclosure', label: 'Title 5 Septic Inspection', requiredBy: 'MA law' },
  septic_disclosure: { category: 'disclosure', label: 'Title 5 Septic Disclosure', requiredBy: 'MA law' },
  smoke_detector: { category: 'disclosure', label: 'Smoke Detector Certificate', requiredBy: 'MA law' },
  co_detector: { category: 'disclosure', label: 'CO Detector Certificate', requiredBy: 'MA law' },
  uffi: { category: 'disclosure', label: 'UFFI Certification', requiredBy: 'lender' },
  certificate_occupancy: { category: 'disclosure', label: 'Certificate of Occupancy', requiredBy: 'MA building code' },
  municipal_lien: { category: 'disclosure', label: 'Municipal Lien Certificate', requiredBy: 'MA law' },
  
  // Federal
  closing_disclosure: { category: 'federal', label: 'Closing Disclosure (CD)', requiredBy: 'federal (TRID)' },
  hud1: { category: 'federal', label: 'HUD-1 Settlement Statement', requiredBy: 'federal (RESPA)' },
  tila: { category: 'federal', label: 'Truth in Lending', requiredBy: 'federal (TILA)' },
  form_1099s: { category: 'federal', label: 'IRS Form 1099-S', requiredBy: 'federal (IRC)' },
  firpta: { category: 'federal', label: 'FIRPTA Affidavit', requiredBy: 'federal (IRC)' },
  w9: { category: 'federal', label: 'IRS Form W-9', requiredBy: 'federal' },
  patriot_act: { category: 'federal', label: 'Patriot Act / OFAC', requiredBy: 'federal' },
  
  // Mortgage
  promissory_note: { category: 'mortgage', label: 'Promissory Note', requiredBy: 'lender' },
  mortgage: { category: 'mortgage', label: 'Mortgage', requiredBy: 'lender' },
  mortgage_rider: { category: 'mortgage', label: 'Mortgage Rider', requiredBy: 'lender' },
  escrow_agreement: { category: 'mortgage', label: 'Escrow Agreement', requiredBy: 'lender' },
  borrower_affidavit: { category: 'mortgage', label: "Borrower's Affidavit", requiredBy: 'lender' },
  compliance_agreement: { category: 'mortgage', label: 'Compliance Agreement', requiredBy: 'lender' },
  appraisal: { category: 'mortgage', label: 'Appraisal', requiredBy: 'lender' },
  flood_determination: { category: 'mortgage', label: 'Flood Zone Determination', requiredBy: 'federal' },
  insurance_binder: { category: 'mortgage', label: 'Hazard Insurance Binder', requiredBy: 'lender' },
  pmi_disclosure: { category: 'mortgage', label: 'PMI Disclosure', requiredBy: 'federal' },
  payoff_letter: { category: 'mortgage', label: 'Seller Mortgage Payoff', requiredBy: 'closing practice' },
  
  // Title
  title_exam: { category: 'title', label: '50-Year Title Examination', requiredBy: 'MA law' },
  title_certification: { category: 'title', label: 'Title Certification', requiredBy: 'MA law' },
  title_commitment: { category: 'title', label: 'Title Commitment', requiredBy: 'lender' },
  title_policy_lender: { category: 'title', label: "Lender's Title Insurance", requiredBy: 'lender' },
  title_policy_owner: { category: 'title', label: "Owner's Title Insurance", requiredBy: 'customary' },
  title_endorsement: { category: 'title', label: 'Title Insurance Endorsement', requiredBy: 'customary' },
  title_affidavit: { category: 'title', label: 'Title Affidavit', requiredBy: 'lender' },
  survey_affidavit: { category: 'title', label: 'Survey Affidavit', requiredBy: 'lender' },
  
  // Tax
  tax_proration: { category: 'tax', label: 'Real Estate Tax Proration', requiredBy: 'closing practice' },
  water_sewer_reading: { category: 'tax', label: 'Water/Sewer Final Reading', requiredBy: 'MA practice' },
  corporate_excise_waiver: { category: 'tax', label: 'Corporate Excise Tax Waiver', requiredBy: 'MA law' },
  
  // Inspections & Environmental
  survey: { category: 'inspection', label: 'Plot Plan / Survey', requiredBy: 'lender' },
  alta_survey: { category: 'inspection', label: 'ALTA/NSPS Survey', requiredBy: 'lender (commercial)' },
  home_inspection: { category: 'inspection', label: 'Home Inspection Report', requiredBy: 'customary' },
  pest_inspection: { category: 'inspection', label: 'Pest / Termite Report', requiredBy: 'VA/FHA' },
  radon_test: { category: 'inspection', label: 'Radon Test', requiredBy: 'customary' },
  well_test: { category: 'inspection', label: 'Well Water Test', requiredBy: 'MA law (if well)' },
  phase1_esa: { category: 'inspection', label: 'Phase I ESA', requiredBy: 'lender (commercial)' },
  phase2_esa: { category: 'inspection', label: 'Phase II ESA', requiredBy: 'conditional' },
  ch21e: { category: 'inspection', label: '21E Assessment', requiredBy: 'MA law (if contamination)' },
  wetlands: { category: 'inspection', label: 'Wetlands Order of Conditions', requiredBy: 'MA law' },
  asbestos: { category: 'inspection', label: 'Asbestos Survey', requiredBy: 'MA law (commercial pre-1980)' },
  
  // Contract
  purchase_sale: { category: 'contract', label: 'Purchase and Sale Agreement', requiredBy: 'contractual' },
  addendum: { category: 'contract', label: 'Addendum / Amendment', requiredBy: 'contractual' },
  deposit_receipt: { category: 'contract', label: 'Deposit Receipt', requiredBy: 'contractual' },
  
  // Condo / HOA
  condo_6d: { category: 'condo', label: '6(d) Certificate', requiredBy: 'MA law' },
  master_deed: { category: 'condo', label: 'Master Deed', requiredBy: 'MA law' },
  condo_bylaws: { category: 'condo', label: 'Declaration of Trust / Bylaws', requiredBy: 'MA law' },
  condo_rules: { category: 'condo', label: 'Condo Rules', requiredBy: 'customary' },
  condo_budget: { category: 'condo', label: 'Budget / Financials', requiredBy: 'lender' },
  condo_insurance: { category: 'condo', label: 'Association Insurance', requiredBy: 'lender' },
  
  // Entity / POA
  power_of_attorney: { category: 'entity', label: 'Power of Attorney', requiredBy: 'as needed' },
  corporate_resolution: { category: 'entity', label: 'Corporate Resolution', requiredBy: 'entity transactions' },
  good_standing: { category: 'entity', label: 'Certificate of Good Standing', requiredBy: 'MA law (entities)' },
  trust_certificate: { category: 'entity', label: 'Trust Certificate', requiredBy: 'trust transactions' },
  
  // Commercial
  estoppel: { category: 'commercial', label: 'Tenant Estoppel Certificate', requiredBy: 'lender' },
  rent_roll: { category: 'commercial', label: 'Rent Roll', requiredBy: 'lender' },
  lease: { category: 'commercial', label: 'Lease', requiredBy: 'contractual' },
  lease_assignment: { category: 'commercial', label: 'Assignment of Leases', requiredBy: 'contractual' },
  bill_of_sale: { category: 'commercial', label: 'Bill of Sale', requiredBy: 'contractual' },
  contract_assignment: { category: 'commercial', label: 'Assignment of Contracts', requiredBy: 'contractual' },
  warranty_assignment: { category: 'commercial', label: 'Assignment of Warranties', requiredBy: 'contractual' },
  zoning_letter: { category: 'commercial', label: 'Zoning Verification', requiredBy: 'lender' },
  snda: { category: 'commercial', label: 'SNDA Agreement', requiredBy: 'lender' },
  environmental_indemnity: { category: 'commercial', label: 'Environmental Indemnity', requiredBy: 'lender' },
  ada_certification: { category: 'commercial', label: 'ADA Compliance', requiredBy: 'federal' },
  
  // Post-closing
  recording_confirmation: { category: 'post-closing', label: 'Recording Confirmation', requiredBy: 'MA law' },
  mortgage_discharge: { category: 'post-closing', label: 'Mortgage Discharge', requiredBy: 'MA law' },
  
  // Wallet meta-documents
  attestation: { category: 'wallet', label: 'Professional Attestation', requiredBy: 'wallet' },
  confidence_score: { category: 'wallet', label: 'Confidence Score Report', requiredBy: 'wallet' },
  fraud_analysis: { category: 'wallet', label: 'Fraud Pattern Analysis', requiredBy: 'wallet' },
  
  // Custom
  custom: { category: 'custom', label: 'Custom Document', requiredBy: 'as specified' },
  rights_of_way: { category: 'custom', label: 'Rights of Way', requiredBy: 'as applicable' },
  easement: { category: 'custom', label: 'Easement', requiredBy: 'as applicable' },
  conservation_restriction: { category: 'custom', label: 'Conservation Restriction', requiredBy: 'as applicable' },
  historic_restriction: { category: 'custom', label: 'Historic Restriction', requiredBy: 'as applicable' }
};
```

---

## Closing Templates

Not every closing is the same. The wallet supports templates that define which documents are expected based on transaction type.

### Residential Sale (Standard)

```javascript
const RESIDENTIAL_SALE = {
  name: "Massachusetts Residential Sale",
  required: [
    'deed', 'deed_excise', 'closing_disclosure', 'title_exam',
    'title_certification', 'smoke_detector', 'co_detector',
    'municipal_lien', 'form_1099s', 'firpta', 'w9',
    'purchase_sale', 'attestation'
  ],
  requiredIfApplicable: [
    { type: 'lead_paint', condition: 'built before 1978' },
    { type: 'septic_inspection', condition: 'septic system present' },
    { type: 'septic_disclosure', condition: 'septic system present' },
    { type: 'well_test', condition: 'private well' },
    { type: 'certificate_occupancy', condition: 'new construction or major renovation' },
    { type: 'uffi', condition: 'lender requires' },
    { type: 'homestead', condition: 'primary residence (recommended)' },
    { type: 'wetlands', condition: 'within 100ft of wetlands' },
    { type: 'flood_determination', condition: 'lender financed' },
    { type: 'corporate_excise_waiver', condition: 'corporate seller' }
  ],
  lenderRequired: [
    'promissory_note', 'mortgage', 'escrow_agreement',
    'borrower_affidavit', 'compliance_agreement', 'appraisal',
    'flood_determination', 'insurance_binder', 'title_commitment',
    'title_policy_lender', 'patriot_act'
  ],
  optional: [
    'title_policy_owner', 'home_inspection', 'radon_test',
    'pest_inspection', 'survey', 'survey_affidavit',
    'addendum', 'power_of_attorney', 'deposit_receipt'
  ],
  condoAdditional: [
    'condo_6d', 'master_deed', 'condo_bylaws',
    'condo_rules', 'condo_budget', 'condo_insurance'
  ]
};
```

### Commercial Sale

```javascript
const COMMERCIAL_SALE = {
  name: "Massachusetts Commercial Sale",
  inherits: 'RESIDENTIAL_SALE',  // All residential requirements plus:
  additional_required: [
    'alta_survey', 'phase1_esa', 'zoning_letter',
    'certificate_occupancy', 'environmental_indemnity',
    'ada_certification'
  ],
  additional_if_tenanted: [
    'estoppel', 'rent_roll', 'lease', 'lease_assignment',
    'snda', 'bill_of_sale', 'contract_assignment',
    'warranty_assignment'
  ],
  additional_if_applicable: [
    { type: 'phase2_esa', condition: 'Phase I flags RECs' },
    { type: 'asbestos', condition: 'pre-1980 building, renovation planned' },
    { type: 'ch21e', condition: 'contamination identified' }
  ]
};
```

### Refinance

```javascript
const REFINANCE = {
  name: "Massachusetts Refinance",
  required: [
    'closing_disclosure', 'promissory_note', 'mortgage',
    'title_exam', 'title_certification', 'title_commitment',
    'title_policy_lender', 'appraisal', 'flood_determination',
    'insurance_binder', 'borrower_affidavit', 'payoff_letter',
    'patriot_act', 'attestation'
  ],
  optional: [
    'survey', 'title_policy_owner', 'homestead'
  ],
  // Note: 3-day right of rescission applies (primary residence)
  specialRules: ['right_of_rescission']
};
```

---

## Wallet Lifecycle

### Phase 1: Genesis (At Closing)

```
Title company exports closing file
    → Property Secret deployed on Polygon (owned by Title Co Identity)
    → KeyVaults created by document group (6-11 depending on deal type)
    → Team members added: buyer, seller, attorney, lender (each as Identity or EOA)
    → Each team member receives ECDH-encrypted access keys for their authorized KVs
    → All closing documents written as Notes with original PDF attachments
    → QR code generated for the physical deed
    → Confidence score computed from template completeness + cross-source verification
    → Genesis event recorded
```

The wallet starts with 20-120 documents depending on transaction complexity. Each is a signed Note with the original PDF/scan. Every party at closing is an on-chain team member with cryptographic access to their authorized document groups. The property now has a root of authenticity.

### Phase 2: Post-Closing (Days to Months After)

```
Recording confirmation arrives → Note to KV-PUBLIC (title co writes, Path 1)
Seller's mortgage discharge recorded → Note to KV-MORTGAGE
Title insurance policies issued → Notes to KV-TITLE
Property tax bill arrives → Note to KV-PUBLIC (owner writes, Path 2 with write auth)
```

Team members can add post-closing documents using their pre-signed write authorizations. The title company (as owner) writes directly. The attorney and lender write with authorization. The buyer becomes the active contributor as they begin their ownership.

### Phase 3: Life of Ownership (Ongoing)

```
Renovation permit pulled → Note to KV-PUBLIC (municipality source, SSL provenance)
Contractor warranty filed → Note to KV-INSPECTION (contractor signs as team member)
Insurance claim documented → Note to KV-MORTGAGE (insurer as team member)
Property tax payment recorded → Note to KV-PUBLIC
Solar panel lease signed → Note to KV-CONTRACT (new team member: solar company)
Roof replacement receipt → Note to KV-INSPECTION (roofer signs)
```

New parties are added as team members over the life of ownership. The roofer who replaces the roof becomes a team member with VIEWER access to KV-PUBLIC and MEMBER access to KV-INSPECTION — they write their warranty note, signed by their Identity. The solar company that installs panels gets added with access to write their lease. Each new team member adds an independent signature to the wallet.

The wallet accumulates. Every note adds provenance. The confidence score increases. After 5 years with 100+ notes from 20+ independent sources (contractor, inspector, utility, assessor, bank, insurer, municipality), the wallet becomes **mathematically unforgeable**. You can forge one document. You cannot forge 100 independent signatures from 30 different Identity contracts.

### Phase 4: Next Transaction

```
New buyer's title search → reads KV-PUBLIC via QR code (15 minutes vs 4 hours)
New closing adds to the SAME wallet:
    → New KeyVaults for new settlement, new mortgage, new wire
    → New team members: new buyer Identity, new lender Identity
    → Old buyer becomes seller (role changes, retains read access to their KVs)
    → Previous Title Co retains VIEWER access (their title plant entry)
    → New Title Co becomes ADMIN (new owner of the Secret)
```

The wallet doesn't start over. It grows. Each transaction adds a chapter — new KeyVaults for new documents, new team members for new parties. The property's complete provenance accumulates over its lifetime. Every prior transaction layer is immutable. Every prior team member retains their authorized access.

**Ownership transfer on-chain:** The Secret contract's `owner` transfers to the new title company's Identity. The previous owner's role changes from ADMIN to VIEWER. Write authorizations for previous team members expire. New authorizations are issued by the new owner.

### Phase 5: Tokenization (Future)

```
Wallet holds verified provenance of the real asset
    → 100+ notes from 30+ independent Identity contracts
    → Every deed, inspection, disclosure, attestation — signed and timestamped
    → Merkle root of all notes = the asset's digital fingerprint
    → Tokenize the Merkle root, not the property
    → Token holders can verify any claim against the wallet
    → Fractional ownership inherits the full verification history
```

You cannot tokenize what you cannot prove. The wallet IS the proof. The Merkle root of all notes — every deed, every inspection, every disclosure, every attestation — is the cryptographic summary of everything known about this property. That root is what gets tokenized. Not a PDF of a deed. Not a promise. A verifiable, immutable, accumulated body of evidence.

The confidence score IS the tokenization readiness score. A token backed by a 0.95 confidence wallet with 150 notes from 40 independent signers has a different risk profile than a 0.40 wallet with 10 notes from 2 signers. The market will price accordingly.

---

## Scaling Model

### How Identity Contracts Enable Network Effects

The same architecture that handles one closing handles a million. The key is that **organizations persist across properties**:

```
Berkshire Title Services (Identity: 0x111...)
├── Team member on: 111 Swamp Rd (Property Secret: 0xAAA...)
├── Team member on: 147 Reservoir Rd (Property Secret: 0xBBB...)
├── Team member on: 15 Shetland Dr (Property Secret: 0xCCC...)
├── Team member on: ... 497 more properties
└── All employees (rivets) see all 500 properties instantly

Lenox National Bank (Identity: 0x555...)
├── Team member on: 111 Swamp Rd (lender role)
├── Team member on: 22 other financed properties
└── Loan officers see mortgage docs across all 23 properties

Robert Anderson, Esq. (Identity: 0x444...)
├── Team member on: 111 Swamp Rd (attorney role)
├── Team member on: 89 other closings
└── Associates see all 90 closing files via shared Identity
```

### Personnel Changes at Scale

| Event | Action | Properties Affected |
|---|---|---|
| Jane joins Berkshire Title | `addRivet(jane, "Title Officer")` on Title Co Identity | All 500 — instant access |
| Mike leaves Berkshire Title | `removeRivet(mike)` on Title Co Identity | All 500 — access revoked |
| Berkshire Title merges with another firm | Transfer title plant (team memberships) to new Identity | All 500 — new firm inherits |
| Attorney retires | Identity persists. Files remain accessible to other rivets in firm. | All 90 — zero data loss |

### Cross-Property Intelligence

Because the same Identity contracts appear across multiple Property Secrets, the system naturally enables:

- **Title plant growth:** Every closing the title co does adds to their portfolio of team memberships
- **Fraud detection:** The same seller Identity appearing on 3 unrelated properties is visible to the network
- **Notary verification:** A notary Identity's signature can be checked across all documents they notarized
- **Lender portfolio view:** A bank sees all its mortgaged properties through one Identity

### Co-Op Network

The co-op model maps directly to team membership:

```
Solo:        Title co is ADMIN on their own properties only
Network:     Title co is added as VIEWER on other members' KV-PUBLIC
Contributor: Title co is added as MEMBER on other members' KV-PUBLIC + KV-TITLE
```

Joining the network = getting added as team member on other firms' Property Secrets. The more firms contribute, the more KV-PUBLIC data is cross-searchable. The incentive is clear: contribute your chain of title data, get access to everyone else's.

---

## Customization Model

### Data Room Templates

The closing template is a **data room configuration** — it defines what documents are expected, who sees them, and what compliance rules apply. Templates are customizable:

```javascript
{
  template: "MA_RESIDENTIAL_SALE",
  
  // Override defaults
  customizations: {
    // Add custom documents
    additionalDocuments: [
      { type: 'custom', label: 'Beach Access Agreement', parties: ['B', 'S', 'T', 'A'] },
      { type: 'rights_of_way', label: 'Shared Driveway Easement', parties: ['P', 'B', 'S', 'T', 'A', 'F'] },
      { type: 'custom', label: 'Historic Preservation Covenant', parties: ['P', 'B', 'T', 'A', 'L', 'F'] }
    ],
    
    // Modify access for specific documents
    accessOverrides: {
      'home_inspection': { addParties: ['S'] },  // Seller wants to see inspection too
    },
    
    // Mark additional documents as required
    additionalRequired: ['radon_test', 'well_test'],
    
    // Note: removing required documents is not allowed — 
    // compliance requirements are additive only
  }
}
```

### Complexity Spectrum

| Transaction Type | Est. Documents | Est. Notes | Typical Parties |
|---|---:|---:|---|
| Cash residential sale | 15-25 | 20-30 | Buyer, Seller, Attorney, Title Co |
| Financed residential sale | 30-45 | 35-55 | + Lender |
| Condo sale (financed) | 40-55 | 45-65 | + Condo association |
| Commercial sale (simple) | 50-70 | 55-80 | + Tenants, Environmental consultant |
| Commercial sale (complex) | 80-120+ | 90-140+ | + Multiple tenants, Phase I/II, SNDA per tenant |
| 1031 Exchange | 35-50 | 40-60 | + Qualified intermediary |
| Estate transfer | 25-40 | 30-50 | + Probate court, executor |

---

## Confidence Scoring (V2)

Confidence comes from **document completeness** and **cross-source verification**:

```javascript
confidence = (
  templateCompleteness * 0.30 +    // How many required docs are present
  crossSourceAgreement * 0.25 +     // Registry + MassGIS + Assessor agree
  notaryVerification * 0.10 +       // Notary checked against SoS database
  networkCorroboration * 0.15 +     // Other wallets confirm related data
  documentIntegrity * 0.10 +        // All hashes verify, no tampering
  professionalAttestation * 0.10    // Licensed attorney/title co attested
)
```

### Template Completeness

A wallet with 25 of 30 required documents = 0.83 completeness. Missing a smoke detector certificate drops the score. Missing a lead paint disclosure (pre-1978 home) drops it further. The template knows what's required — the score reflects what's actually present.

### Why This Matters for Tokenization

A token backed by a 0.95 confidence wallet has verifiable proof that:
- All required documents are present
- Multiple independent data sources agree
- Professional attestations are signed
- No fraud patterns detected
- Full provenance chain from source to wallet

A token backed by a 0.40 confidence wallet has gaps. The confidence score IS the tokenization readiness score.

---

## Economics

### Credit Costs (V7 Credits System)

```
1 POL = 1,000,000 credits
DATAWRITE_BASE_COST = 500 credits per write
DATAWRITE_PER_BYTE = 10 credits per byte

Property Secret deployment:     ~500 credits (one-time)
KeyVault creation (per group):  ~500 credits × 8 = 4,000 (typical residential)
addTeamMember (per party):      ~500 credits × 5 = 2,500 (typical residential)
Note write (per document):      ~500 + (bytes × 10) credits
IPFS upload (per file):         Pinata cost (~$0.01-0.10 per file)

Typical residential closing (40 documents, 5 parties, 8 KeyVaults):
  Deploy:       500 credits
  KeyVaults:    4,000 credits
  Team members: 2,500 credits
  40 notes:     ~30,000 credits
  Total:        ~37,000 credits = 0.037 POL ≈ $0.02

Typical commercial closing (100 documents, 8 parties, 11 KeyVaults):
  Deploy:       500 credits
  KeyVaults:    5,500 credits
  Team members: 4,000 credits
  100 notes:    ~75,000 credits
  Total:        ~85,000 credits = 0.085 POL ≈ $0.05
```

The entire closing — every document, every PDF, every encryption, every on-chain record, every team member registered — costs less than a nickel. The filing cabinet it replaces costs $200-400 in search labor every time someone opens it.

### Credit Funding Model

The title company funds the property wallet at closing:

```
1. Title Co deposits POL → Registry.depositCredits() → userCredits += POL × 1M
2. Title Co funds property → Registry.fundSecretCredits(propertySecret, amount)
   → Secret.ownerCredits[titleCo] += amount
3. Notes written → vault.creditBalance -= cost per write
4. Post-closing: team members can self-fund via Registry.fundVaultBalance()
   → Lender adds credits to write their discharge note
   → Buyer adds credits to write renovation records
```

The credit model enables the ANYONE_PAYS pattern: the title company pays for the closing, but any team member can fund their own writes later. A homeowner adding renovation records pays for their own notes. A contractor adding a warranty record pays for theirs. The wallet grows because everyone can contribute.

### Pricing to Title Companies

| Tier | Per Wallet | Monthly | What They Pay For |
|---|---|---|---|
| Solo | $5 | — | Wallet creation + storage + QR code |
| Network Member | $3 | $500 | + Network search access + fraud alerts |
| Contributor | $2 | $300 | + Lower rates for sharing verification data |

The $5 wallet creation fee covers: Polygon gas (~$0.05), IPFS storage (~$2-3 for all PDFs), credit purchase, QR code generation, and margin. The infrastructure cost is negligible. The value is in the accumulated, verified, permanent record.

---

## MCP Tools (Extended)

```javascript
const TITLE_WALLET_TOOLS = [
  // Wallet lifecycle
  'create_title_wallet',       // Deploy property Secret, create KeyVaults, write all closing Notes
  'get_title_wallet',          // Read public layer of a wallet
  'verify_title_wallet',       // Integrity check + confidence score
  'list_title_wallets',        // Browse all wallets
  
  // Document management
  'add_document',              // Write a Note with PDF attachment to specified KeyVaults
  'get_document',              // Read a specific Note (requires party key)
  'list_documents',            // List all Notes in a KeyVault
  'verify_document',           // Check document hash against on-chain record
  
  // Party access
  'get_party_view',            // Decrypt a party's KeyVault and list their documents
  'generate_share_link',       // Create encrypted share URL for a party
  
  // Events
  'add_event',                 // Record a wallet event (refinance, filing, transfer)
  
  // Fraud
  'detect_fraud_patterns',     // Cross-property fraud analysis
  'check_notary',              // Verify notary against SoS database
  
  // Templates
  'get_closing_template',      // Get expected document list for a transaction type
  'check_completeness',        // Which required documents are present/missing
  
  // Search
  'search_by_address',         // Find wallet by property address
  'search_by_party',           // Find all wallets involving a person/entity
  'search_by_document',        // Find wallets containing a document type
];
```

---

## What This Enables

### For Title Companies (Today)
- Upload the closing file they already produce → get a permanent, verified wallet
- Every closing builds their title plant automatically
- Next search on a walleted property: 15 minutes instead of 4 hours
- Fraud detection across the network, not just one property

### For Property Owners (Near-Term)
- Carfax for your house — complete verified history
- Contractors add signed work records. Permits auto-deposit. Insurance claims documented.
- The wallet grows in value with every addition
- Premium properties command premium prices because the provenance is verified

### For the Industry (Medium-Term)
- RWA tokenization with verifiable provenance
- Fractional ownership backed by accumulated evidence, not promises
- Lenders can price risk based on wallet confidence scores
- Insurance companies can assess claims against the complete record

### For Society (Long-Term)
- Fraud becomes economically irrational — you cannot forge 100 independent signatures from 30 different sources
- Title searches drop from hours to minutes
- The $20B title insurance industry reprices around verification, not search labor
- Every property has a digital twin — as complete and as trustworthy as the physical asset

---

## Build Phases

### Phase 1: Schema + Templates
- Finalize Note schema with metadata structure
- Build closing templates (residential, commercial, refinance, estate)
- Define document type enum and KeyVault group structure
- Map template → KeyVaults → team member access matrix

### Phase 2: V6 Integration — Secret + KeyVaults
- Wire `@rootz/secret-orchestrator` for Property Secret creation (owned by Title Co Identity)
- Wire `@rootz/notes` for KeyVault creation with `schemaDefinition` per document group
- Wire `@rootz/crypto` for AES-256-GCM content encryption + SHA-256 document hashing
- Wire Pinata for PDF/scan upload to IPFS (encrypted, VDN pattern for hash hiding)
- Deploy test property on Polygon Amoy, then Mainnet
- DBA wallet: `0xD36AAf65a91bB7dc69942cF6B6d1dBa4Ef171664`

### Phase 3: V6 Integration — Team Members + Identity
- Wire `addTeamMember()` for party registration at closing
- Wire `@rootz/identity-provider` for Identity contract creation (title co, law firm, lender)
- Implement Fat Key Package distribution: encrypt KV keys for all rivets on an Identity
- Implement write authorization generation: pre-sign (v/r/s) for team member note writes
- Test: title co (Identity with 3 rivets) creates wallet, adds buyer (EOA) and lender (Identity)

### Phase 4: Closing Flow — Web Interface
- Title company upload interface: drag-and-drop PDFs mapped to document types
- Template-driven checklist: shows what's required, what's present, what's missing
- Automatic document classification (AI-assisted: "this PDF looks like a deed")
- QR code generation for recorded deed (links to KV-PUBLIC viewer)
- Team member notification: each party gets their share link + encrypted access key

### Phase 5: Network + Fraud (After First 10 Closings)
- Cross-property search: same Identity appearing on multiple Property Secrets
- Notary verification: check notary Identity against MA Secretary of State commission database
- Fraud pattern detection: rapid transfers, vacant property sales, POA patterns — all visible via team member / Identity cross-reference
- Co-op network: add network members as VIEWER/MEMBER on each other's KV-PUBLIC + KV-TITLE

### Phase 6: Post-Closing + Ownership Lifecycle
- Homeowner writes: renovation permits, contractor warranties, tax payments
- Self-funded notes: owner deposits credits, writes to their authorized KeyVaults
- New team member addition: contractor, solar company, insurer — each gets their own Identity + access
- Property monitoring: alerts when new filings detected at Registry of Deeds

### Phase 7: Tokenization Foundation (After 100 Wallets)
- Merkle root computation across all Notes in a wallet
- On-chain anchoring of Merkle root on the Property Secret
- Confidence score as tokenization readiness indicator
- API for token platforms to verify wallet provenance
- Token = Merkle root of verified, accumulated, multi-signer evidence

---

## Contract Addresses (Polygon Mainnet V7)

| Contract | Address |
|---|---|
| SovereignSecretWalletFactory | `0xC683540Ab2A9f017Ea48E044aA74f0b74D9DC4E4` |
| UniversalTeamRegistryV4 | `0x83B25fDD25516057AaaAf8027464C8bbb2f91d5B` |
| CreditRateTableV6 | `0x5fb9e4018022e9E40D987C6f2a959cE4027E8b20` |
| IdentityFactory_V6 | `0xc6361e4780eb16ee8643538376600D97F9E4C9c0` |
| MultiTokenCreditPurchase | `0x0D6F37Be6227D0b2C882338924CDc7063fa11346` |
| Rootz DBA Wallet | `0xD36AAf65a91bB7dc69942cF6B6d1dBa4Ef171664` |

---

*This document is the design specification for the Origin Title Wallet built on Rootz V6 infrastructure. The property wallet is not a document manager — it is the root of authenticity for real-world assets. Every document is a signed Note. Every party is a team member. Every organization is an Identity contract. The accumulated wallet is the foundation for tokenization of the real-world asset.*
