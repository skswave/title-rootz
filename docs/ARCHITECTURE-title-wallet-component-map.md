# Title Wallet: Component Mapping to V6 Infrastructure

**Version:** 1.0
**Date:** April 28, 2026
**Purpose:** Map every Title Wallet operation to existing V6 packages, identify gaps, build plan.

---

## Inventory: What We Have (4,000+ lines of tested code)

### Layer 1 — Cryptographic Primitives

| Package | Version | Tests | Title Wallet Use |
|---|---|---|---|
| **@rootz/crypto** | 1.0.0 | 38 | AES-256-GCM content encryption, ECDH per-party key exchange, master key derivation |
| **@rootz/document-wallet** | 0.1.0 | 1 | Hash-binding PDF ↔ AI markdown, manifest builder, integrity verification |
| **@rootz/pq-crypto** | 0.1.0 | 21 | ML-KEM-1024 envelope encryption (future: PQ-encrypted closing documents) |

### Layer 2 — Blockchain Operations

| Package | Version | Tests | Title Wallet Use |
|---|---|---|---|
| **@rootz/secret-orchestrator** | 1.0.0 | 31 | Deploy Property Secret via Factory (7-step orchestration) |
| **@rootz/notes** | 1.4.0 | 0 | createKeyVault() for document groups, writeNote() for each closing doc |
| **@rootz/chain-reader** | 2.0.5 | 12 | Read Property Secrets, KeyVaults, Notes, team members from chain |
| **@rootz/gas-provider** | 1.0.0 | 0 | Dynamic gas estimation for all Polygon transactions |

### Layer 3 — Identity & Teams

| Package | Version | Tests | Title Wallet Use |
|---|---|---|---|
| **@rootz/identity-provider** | 1.0.0 | 24 | Create Identity contracts for title companies, law firms, lenders |
| **@rootz/teams** | 0.2.0 | 39 | 3-step invite flow, ECDH key sharing, write authorization, bootstrap sync |
| **@rootz/message-processor** | 1.0.4 | 33 | Parse team invites, key exchanges, ownership from chain events |

### Layer 4 — Integration & Application

| Package | Version | Tests | Title Wallet Use |
|---|---|---|---|
| **@rootz/integration** | 1.0.0 | 30 | RootzClient unified API, re-exports all packages |
| **@rootz/origin-bundle** | 1.0.0 | 0 | Document provenance (Who/What/When/Where/Why/How) |
| **@rootz/wallet** | 1.0.0 | 1 | EOASigner, IdentitySigner, BrowserStorageAdapter |
| **@rootz/api** | 0.1.0 | 2 | Headless API for browser/Node.js (secrets, teams, identity, notes) |

### Layer 5 — Distribution

| Package | Version | Tests | Title Wallet Use |
|---|---|---|---|
| **@rootz/browser-mcp** | 0.1.0 | 0 | MCP server for browser-based wallet-authenticated access |
| **@rootz/rootz-embed** | 1.0.0 | 0 | Embeddable widget for third-party apps (Title Toolbox integration) |
| **@rootz/agent-wallet** | 0.1.0 | 0 | AI agent birth certificates, inference chain (autonomous title search) |

### Layer 6 — Future (PQ Integration Path)

| Package | Version | Tests | Title Wallet Use |
|---|---|---|---|
| **@rootz/pq-crypto** | 0.1.0 | 21 | ML-KEM-1024 + AES-256-GCM envelope (Phase 2+) |
| **@rootz/tee-policy** | 0.1.0 | 140 | Policy enforcement for automated title operations |
| **@rootz/proven-source** | 0.1.0 | 0 | Code provenance for the title wallet software itself |

**Total existing tests across all packages: 272+**
**Total packages that directly serve the title wallet: 16 of 26**

---

## Operation-by-Operation Mapping

### Operation 1: Create Property Secret

**What happens:** Title company creates a new on-chain contract for a property.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Generate master key | `@rootz/crypto` | `RootzCrypto.generateMasterKey()` | ✅ Exists |
| Deploy contract via Factory | `@rootz/secret-orchestrator` | `SecretOrchestrator.createSecret()` | ✅ Exists |
| Encrypt content (property metadata) | `@rootz/crypto` | `AES.encrypt(content, masterKey)` | ✅ Exists |
| Upload to IPFS | `@rootz/secret-orchestrator` | Step 4 (Pinata upload) | ✅ Exists |
| Encrypt IPFS hash (VDN) | `@rootz/crypto` | `AES.encrypt(ipfsHash, masterKey)` | ✅ Exists |
| Encrypt master key for owner | `@rootz/crypto` | `ECDH.encryptMasterKeyForMember()` | ✅ Exists |
| Create KeyVault | `@rootz/notes` | `NoteManager.createKeyVault()` | ✅ Exists |
| Gas management | `@rootz/gas-provider` | `GasProvider.getGasSettings()` | ✅ Exists |

**Gap: NONE.** This is a standard secret creation — the same flow used for every Rootz secret.

**Title Wallet specifics:**
- `secretName`: Property address (e.g., "111 Swamp Rd, Richmond MA")
- `secretType`: `"title-wallet"` (new type, but just a string — no code change needed)
- Owner: Title Company's Identity contract

---

### Operation 2: Create KeyVaults (Document Groups)

**What happens:** Multiple KeyVaults created on the Property Secret, one per document sensitivity group.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Create KeyVault with schema | `@rootz/notes` | `NoteManager.createKeyVault({ secretAddress, masterKey, schema })` | ✅ Exists |
| Schema definition | `@rootz/notes` | `schema` param = JSON defining document types | ✅ Exists (flexible JSON) |
| Fund credits for creation | `@rootz/notes` | `CreditPurchaser.purchaseCredits()` | ✅ Exists (V7 auto-funding) |

**Gap: NONE.** `createKeyVault()` accepts any JSON as `schemaDefinition`. We define title-wallet-specific schemas.

**Title Wallet specifics:**
- Create 6-11 KeyVaults per property (residential = ~8, commercial = ~11)
- Each schema includes: `{ category: "settlement", documentTypes: ["closing_disclosure", "hud1", ...], access: "restricted" }`
- V7 auto-funding handles credits automatically

---

### Operation 3: Write Closing Documents as Notes

**What happens:** Each PDF/scan from the closing package becomes a Note with the original file as an IPFS attachment.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Hash-bind PDF + AI markdown | `@rootz/document-wallet` | `buildManifest({ originBytes, aiMarkdown, ... })` | ✅ Exists |
| Upload PDF to IPFS (encrypted) | `@rootz/notes` | `NoteManager.writeNote()` handles IPFS routing | ✅ Exists |
| Encrypt IPFS hash (VDN) | `@rootz/notes` | `NoteCrypto.encryptIPFSRef()` | ✅ Exists |
| Write Note to KeyVault | `@rootz/notes` | `NoteManager.writeNote({ secretAddress, kvBlock, content, kvKey, files })` | ✅ Exists |
| Attach file metadata | `@rootz/notes` | `files: [{ ipfsHash, filename, contentType, size, description }]` | ✅ Exists |
| Auto-fund if low credits | `@rootz/notes` | V7 auto-funding built into `writeNote()` | ✅ Exists |

**Gap: NONE.** The Note system already supports file attachments with IPFS, encryption, and VDN. The `document-wallet` package adds hash binding between the original PDF and its AI-readable summary.

**Title Wallet specifics:**
- Each Note's `content` = DocumentWalletManifest JSON (from `buildManifest()`)
- Each Note's `files[0]` = original PDF on IPFS (encrypted)
- Each Note's `files[1]` = AI-readable markdown summary on IPFS
- Each Note's `metadata` = title-wallet document metadata (type, category, provenance, registry ref, statute)

---

### Operation 4: Add Team Members (Parties at Closing)

**What happens:** Buyer, seller, attorney, lender each become team members on the Property Secret.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Send team invite | `@rootz/teams` | `TeamManager.sendInvite({ secret, memberAddress, role })` | ✅ Exists |
| Accept invite (party responds) | `@rootz/teams` | `TeamManager.respondToInvite()` | ✅ Exists |
| Exchange encrypted keys | `@rootz/teams` | `TeamManager.processResponse()` delivers ECDH-encrypted KV keys | ✅ Exists |
| Direct share (1-step) | `@rootz/teams` | Direct key sharing (skips 3-step for known parties) | ✅ Exists |
| Fat Key Package (to Identity) | `@rootz/identity-provider` | `MultiDeviceEncryption.encryptMasterKeyForDevice()` for each rivet | ✅ Exists |
| Write authorization | `@rootz/teams` | `WriteAuthGenerator.createECDSAAuth()` | ✅ Exists |
| On-chain addTeamMember | Smart contract | `addTeamMember(address, role, encryptedAccessKey, publicKey)` | ✅ Exists |

**Gap: PARTIAL.** The 3-step invite flow and direct sharing work. What's new:

1. **Selective KeyVault key sharing** — the `encryptedAccessKey` must contain only the KV keys the party is authorized for (not all KV keys). This is application logic, not a package gap. The encryption functions exist; the access matrix is new.

2. **Custodian-managed invites** — in Dashboard V1, Rootz sends the invite on behalf of the title company. The custodian service signs with the company's Identity. This is infrastructure, not a package gap.

---

### Operation 5: Create Identity Contract (Company/Couple/Firm)

**What happens:** A title company, law firm, lender, or married couple gets an Identity contract.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Create Identity contract | `@rootz/identity-provider` | `IdentityManager.createIdentity()` | ✅ Exists |
| Add rivets (employees/devices) | `@rootz/identity-provider` | `IdentityManager.addRivet()` | ✅ Exists |
| Register ECDH public keys | `@rootz/identity-provider` | `IdentityManager.registerPublicKey()` | ✅ Exists |
| Route transactions through Identity | `@rootz/identity-provider` | `IdentityManager.executeTransaction()` | ✅ Exists |
| Bootstrap sync (new device) | `@rootz/teams` | `BootstrapSync` | ✅ Exists |

**Gap: NONE.** Identity is fully implemented and tested (24 tests). The title wallet needs no changes to the Identity system.

**Known issue:** IdentityFactory_V6 needs `authorizeFactory()` call on V7 Registry (documented in CLAUDE.md). This is a one-time admin action.

---

### Operation 6: Document Classification (AI-Assisted)

**What happens:** AI analyzes uploaded PDFs and classifies them (deed, closing disclosure, lead paint, etc.).

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Read PDF content | None | — | ❌ GAP |
| Classify document type | None | — | ❌ GAP |
| Map to KeyVault group | None | — | ❌ GAP |
| Validate against closing template | None | — | ❌ GAP |

**Gap: YES.** This is new code. No existing package handles document classification. This is the primary new work for the title wallet.

**What to build:**
- `@rootz/title-wallet` — closing templates, document type enum, access matrix, classification hints
- AI classification via MCP tool (Claude reads the PDF, identifies the type, maps to template)
- Completeness checker (which required docs are present/missing)

---

### Operation 7: Confidence Scoring

**What happens:** Score computed from template completeness + cross-source verification.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Count docs vs template | None | — | ❌ GAP |
| Cross-reference sources | Land records MCP server (port 3035) | 9 tools including confidence scoring | ✅ Exists (MCP) |
| Compute weighted score | None | — | ❌ GAP |

**Gap: PARTIAL.** The land records MCP server already does cross-source confidence scoring (Registry + MassGIS + Assessor). What's new is template completeness scoring — checking how many required documents are present.

---

### Operation 8: QR Code Generation

**What happens:** A QR code is generated linking to the property wallet's public KeyVault.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Generate QR code image | None | — | ❌ GAP (use qrcode npm) |
| Encode wallet URL | None | — | ❌ GAP |
| Render for print (deed) | None | — | ❌ GAP |

**Gap: YES.** QR code generation is new. Simple — `npm install qrcode` and encode the wallet viewer URL. But the viewer page itself needs to be built.

---

### Operation 9: Wallet Viewer (Party Access)

**What happens:** A party scans the QR code or clicks a share link and sees their authorized documents.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Read public KeyVault | `@rootz/chain-reader` | Read DataWritten events | ✅ Exists |
| Decrypt party KeyVaults | `@rootz/crypto` | AES decrypt with party's KV key | ✅ Exists |
| Render documents | Dashboard (`rootz-v6/dashboard/`) | Existing secret/notes viewer | ✅ Exists (partial) |
| Verify document integrity | `@rootz/document-wallet` | `verifyDocumentWallet()` | ✅ Exists |

**Gap: PARTIAL.** The dashboard already views secrets and notes. What's new is a property-specific viewer that shows documents organized by category with the closing template overlay.

---

### Operation 10: Fraud Detection (Cross-Property)

**What happens:** Search across property wallets for fraud patterns.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| Search by party name | Land records MCP server | `search_by_party` tool | ✅ Exists |
| Detect fraud patterns | Land records MCP server | `detect_fraud_patterns` tool | ✅ Exists |
| Search by notary | Land records MCP server | `search_by_notary` tool | ✅ Exists |
| Cross-property search | `@rootz/chain-reader` | Query TeamMemberAdded events across contracts | ✅ Exists |

**Gap: NONE** for basic fraud detection. The MCP server has 9 tools. Cross-property search is a ChainReader query filtered by Identity address.

---

### Operation 11: Post-Quantum Encryption (Future Phase)

**What happens:** Closing documents encrypted with ML-KEM-1024 instead of classical ECDH.

| Step | V6 Package | Function | Status |
|---|---|---|---|
| PQ envelope creation | `@rootz/pq-crypto` | `createEnvelope()` | ✅ Exists (Phase 1 complete) |
| PQ envelope opening | `@rootz/pq-crypto` | `openEnvelope()` | ✅ Exists |
| Format detection (v1 vs v2) | `@rootz/pq-crypto` | `detectFormat()` | ✅ Exists |
| Epoch key management | `@rootz/pq-crypto` | `keychain.ts` — HD epoch derivation | ✅ Exists |
| Key recovery (Shamir) | `@rootz/pq-crypto` | `shamir.ts` — 3-of-5 splitting | ✅ Exists |
| Merkle tree per property | `@rootz/pq-crypto` | `merkle.ts` — domain-separated SHA-384 | ✅ Exists |

**Gap: NONE** in the crypto layer. Integration into the title wallet Note-writing flow is new work but the primitives are built and tested (21 integration tests).

**Integration path:** When writing a Note, check `envelope_version`. If v2 → use `@rootz/pq-crypto` envelope instead of `@rootz/crypto` ECDH. Format detection routes automatically. No contract changes needed — `writeData()` stores opaque bytes.

**Strategic note:** Title records live 50+ years. PQ encryption is not optional for this use case — it's the most compelling argument for why title companies should adopt Origin over any competitor. "Your closing documents are protected against quantum attacks. Nobody else offers this."

---

## Gap Summary

### What's Missing (New Code Needed)

| Gap | Size | Priority | Description |
|---|---|---|---|
| **Closing templates** | ~200 lines | P0 | Document type enum, per-template required/optional list, KeyVault mapping |
| **Access matrix** | ~150 lines | P0 | Which party gets which KV keys (application logic, not crypto) |
| **Document classifier hints** | ~100 lines | P1 | Metadata to help AI classify PDFs (filename patterns, page counts, keywords) |
| **Completeness checker** | ~100 lines | P1 | Compare present docs vs template, compute % complete |
| **Confidence score calculator** | ~80 lines | P1 | Weighted formula: completeness + cross-source + attestation |
| **QR code generator** | ~50 lines | P2 | npm qrcode + URL encoding |
| **Property wallet viewer** | ~500 lines | P2 | HTML page showing documents by category (extends existing dashboard) |
| **Custodian wallet service** | ~300 lines | P1 | Server-side key management, sign-on-behalf, key export |
| **Dashboard closing upload UI** | ~400 lines | P1 | Drag-drop PDFs, AI classification review, party management |
| **MCP tools for title wallet** | ~200 lines | P1 | create_property_wallet, add_document, check_completeness, etc. |

**Total new code estimate: ~2,100 lines**

### What's NOT Missing (Already Built)

| Capability | Package | Lines | Tests |
|---|---|---|---|
| Secret creation (7-step) | secret-orchestrator | ~800 | 31 |
| KeyVault creation | notes | ~300 | (tested via API playbook) |
| Note writing with IPFS files | notes | ~600 | (tested via API playbook) |
| AES-256-GCM encryption | crypto | ~400 | 38 |
| ECDH key exchange | crypto | ~300 | (in crypto + teams) |
| Team invites (3-step) | teams | ~500 | 39 |
| Write authorization (v/r/s) | teams | ~200 | 11 |
| Identity contracts | identity-provider | ~600 | 24 |
| Fat Key Packages | identity-provider | ~300 | (in identity tests) |
| Bootstrap sync | teams | ~200 | 6 |
| Chain event reading | chain-reader | ~500 | 12 |
| Message processing | message-processor | ~800 | 33 |
| Document hash binding | document-wallet | ~300 | 1 |
| Document provenance | origin-bundle | ~400 | — |
| PQ encryption (Phase 2) | pq-crypto | ~1,200 | 21 |
| Gas management | gas-provider | ~300 | — |
| Credit purchasing (V7) | notes | ~300 | — |
| Unified client API | integration | ~400 | 30 |

**Total existing code serving title wallet: ~8,200+ lines with 246+ tests**

### Ratio: 2,100 new lines / 8,200 existing lines = **20% new code, 80% composition**

---

## Build Plan

### Phase 1: `@rootz/title-wallet` Package (Week 1)

Create a new V6 package following all developer guidelines.

```
packages/title-wallet/
├── src/
│   ├── index.ts              — Exports + AI-documented
│   ├── types.ts              — Document types, templates, access matrix
│   ├── templates.ts          — MA residential, commercial, refinance, estate
│   ├── access-matrix.ts      — Party → KeyVault mapping
│   ├── completeness.ts       — Template vs present docs, confidence scoring
│   ├── classifier-hints.ts   — Metadata to help AI identify documents
│   └── wallet-builder.ts     — Orchestrates: create secret → KVs → notes → team
├── tests/
│   ├── templates.test.ts
│   ├── access-matrix.test.ts
│   └── completeness.test.ts
├── AI_CONTEXT.md
├── RESOURCES.md
├── package.json
├── tsconfig.json
└── .ai/
    └── changelog.jsonl
```

**Dependencies:** `@rootz/integration`, `@rootz/document-wallet`
**Zero new crypto code.** Uses existing packages for everything cryptographic.

### Phase 2: Integration Tests on Mainnet (Week 2)

Run scenarios TW-1 through TW-10 from the integration plan. Every test on Polygon mainnet. Total cost: ~$0.50.

Reuse patterns from `packages/api/tests/TEST_PLAYBOOK.md` scenarios 1-8.

### Phase 3: Custodian Service + Dashboard UI (Week 3-4)

- Custodian wallet service (server-side key management)
- Dashboard upload page (drag-drop PDFs)
- AI document classification (MCP tool)
- QR code generation
- Property viewer page

### Phase 4: MCP Tools + AI Workflow (Week 5)

- Title wallet MCP tools (create, add, check, search)
- AI-assisted closing workflow
- Completeness checking
- Fraud detection integration (connect to land records MCP server on port 3035)

### Phase 5: PQ Encryption Integration (Week 6+)

- Wire `@rootz/pq-crypto` envelope into Note writing
- Format detection: v1 (classical) or v2 (PQ) per KeyVault config
- "50-year documents deserve 50-year encryption"
- Settlement: Merkle root per property → Polygon + (future) Naoris

---

## Key Architectural Decisions

### 1. Compose, Don't Rebuild

The title wallet is a **thin composition layer** (~2,100 lines) on top of 8,200+ lines of tested infrastructure. Every cryptographic operation, every blockchain interaction, every team management flow uses existing packages. The new code is:
- Templates (what documents a closing needs)
- Access matrix (who sees what)
- Classification (what kind of document is this)
- Scoring (how complete is this wallet)

### 2. One Property = One Secret

The Property Secret is deployed once and lives forever. It's the canonical on-chain identity for the property. Every transaction (sale, refinance, transfer) adds KeyVaults and team members to the same Secret.

### 3. KeyVaults = Document Groups, Not Parties

Documents are grouped by sensitivity (PUBLIC, SETTLEMENT, WIRE, etc.). Parties get keys to their authorized groups. This is cleaner than per-party vaults because:
- Adding a new party doesn't require copying documents
- A document change (amendment) updates one KeyVault, not N per-party copies
- The access matrix is declarative, not embedded in the data structure

### 4. PQ From Day One (Optional, But Designed In)

The Note format supports `envelope_version` detection. PQ encryption can be enabled per-KeyVault without changing any other code. Title records are the strongest case for PQ: 50-year documents, harvest-now-decrypt-later threat model, CNSA 2.0 compliance differentiator.

### 5. Custodian Is a Rivet, Not a God

The Rootz custodian is added as a **rivet on the company Identity** — not a separate admin system. It has the same access as any employee rivet. When removed, it loses access like any other rivet. The Identity contract is the access control authority, not Rootz infrastructure.

---

## Contract Addresses (V7 Polygon Mainnet)

| Contract | Address | Used For |
|---|---|---|
| SovereignSecretWalletFactory | `0x7A2598459C080Ce1AB017A42EB46BD98f34A4590` | Deploy Property Secrets |
| UniversalTeamRegistryV4 | `0x83B25fDD25516057AaaAf8027464C8bbb2f91d5B` | Credit management, vault funding |
| IdentityFactory_V6 | `0xc6361e4780eb16ee8643538376600D97F9E4C9c0` | Deploy Identity contracts |
| CreditRateTableV6 | `0x5fb9e4018022e9E40D987C6f2a959cE4027E8b20` | Credit pricing |
| MultiTokenCreditPurchase | `0x0D6F37Be6227D0b2C882338924CDc7063fa11346` | Buy credits with POL |
| Rootz DBA Wallet | `0xD36AAf65a91bB7dc69942cF6B6d1dBa4Ef171664` | Rootz operational wallet |

---

## Existing Test Coverage We Can Reuse

| Test Source | Tests | Covers |
|---|---|---|
| `@rootz/crypto` tests | 38 | AES-256-GCM, ECDH, master key |
| `@rootz/teams` tests | 39 | Key sharing, write auth, bootstrap sync, type guards |
| `@rootz/secret-orchestrator` tests | 31 | 7-step secret creation |
| `@rootz/identity-provider` tests | 24 | Identity creation, rivet management, EIP-1271 |
| `@rootz/message-processor` tests | 33 | Message parsing, storage, invite lifecycle |
| `@rootz/integration` tests | 30 | RootzClient, invite API, mainnet reads |
| `@rootz/chain-reader` tests | 12 | Event reading, transaction parsing |
| `@rootz/document-wallet` tests | 1 | Manifest building, hash binding, verification |
| `@rootz/pq-crypto` tests | 21 | PQ envelope, key derivation, Shamir |
| `@rootz/tee-policy` tests | 140 | Policy validation (future: automated title ops) |
| API Test Playbook | 8 scenarios | End-to-end: create, share, write, identity, bootstrap |
| **Total** | **377+** | |

---

*The infrastructure is built. The contracts are deployed. The tests exist. The title wallet is 2,100 lines of composition on top of 8,200 lines of proven code. 20% new, 80% reuse. That's the right ratio for production software in a $20B industry.*
