# Origin Title Wallet
## The Closing File That Never Gets Lost

---

### First: What Is a "Data Wallet"?

Think about a physical wallet. It holds your driver's license, credit cards, insurance cards — things that prove who you are and what you're authorized to do. You control it. You decide what to show and to whom. The bouncer sees your ID. The cashier sees your credit card. Neither sees everything.

A **data wallet** is the same concept, but for digital records. It's a secure digital container that:

- **Holds documents and records** — deeds, mortgages, title searches, wire instructions, insurance policies
- **You control who sees what** — the buyer sees the deed and their settlement statement, but not the seller's wire routing number. The lender sees the mortgage terms but not the seller's identity documents.
- **Proves authenticity** — every document in the wallet is digitally signed by the person or company who put it there, with a timestamp that can't be faked
- **Lives forever** — it's not on anyone's computer or in anyone's filing cabinet. It exists on a permanent digital ledger. If the attorney retires, the title company closes, or the bank merges — the wallet and its contents survive.
- **Linked to the property, not a person** — when the property sells, the wallet stays with the property. The new owner inherits the verified history.

**The simplest analogy: It's a safe deposit box for a property's closing file, where different people have different keys, and the box can never be lost or destroyed.**

Today, your closing file is a stack of paper (or PDFs) in the attorney's office. If you need something 5 years later, you call the attorney and hope they still have it. A data wallet means you never have to hope — it's always there, always verified, always accessible to the people who should have access.

---

### What Is the Origin Title Wallet?

The Origin Title Wallet is a data wallet designed specifically for real estate closings. It's an encrypted, permanent digital record of a closing — created automatically by the title company during their normal workflow. Every document, every verification, every wire instruction — signed by the party who created it, encrypted so only authorized parties can see their piece, and linked to the property forever.

The deed carries a QR code. Scan it, and you see the verified closing package. Not someday. Today.

---

### How It Works

#### At Closing

The title company does their normal job. Nothing changes about their process. But instead of putting documents in a filing cabinet, they go into an Origin Title Wallet:

1. **Title search results** → encrypted, shared with buyer + seller + lender
2. **Attorney attestation** → signed by the attorney's wallet, certifying title is clear and parties verified
3. **Wire instructions** → encrypted separately for each party (buyer can't see seller's bank, seller can't see buyer's)
4. **Settlement statement** → each party sees their side
5. **Title insurance policy** → shared with buyer + seller
6. **Identity verification** → attorney + title company only
7. **Deed + mortgage** → public (same as the registry)

The deed is printed with a **QR code** or URL linking to the wallet. When it's recorded at the Registry of Deeds, the QR code becomes part of the permanent public record.

**Time added to the closing process: zero.** The title company's existing software exports to the wallet. The QR code is auto-generated.

#### After Closing

The wallet lives on. Attached to the property, not the attorney's office.

- **Buyer needs a copy of their settlement statement 5 years later?** Open the wallet. It's there.
- **Attorney retires?** Doesn't matter. The wallet has the attestation.
- **Property sells again?** The new title company sees the prior wallet. Search time drops from 4 hours to 15 minutes.
- **Someone files a suspicious document against the property?** The wallet alerts all parties.
- **Lender wants to verify the mortgage was properly recorded?** Wallet has the proof.

#### The QR Code on the Deed

Every deed recorded with an Origin wallet gets a QR code or URL printed on it:

```
┌─────────────────────────────────────┐
│                                     │
│          QUITCLAIM DEED             │
│                                     │
│   Turner Kathryn C & William J      │
│   to                                │
│   [New Buyer]                       │
│   15 Shetland Dr, Pittsfield MA     │
│                                     │
│   Consideration: $XXX,XXX           │
│                                     │
│   [Standard deed language...]       │
│                                     │
│   ┌──────────┐                      │
│   │ ▄▄▄▄▄▄▄▄ │  Origin Title Wallet │
│   │ ██    ██ │  Verified Closing     │
│   │ ▄▄▄▄▄▄▄▄ │  ID: MA-PITTS-15-SH │
│   └──────────┘                      │
│   origin.rootz.global/w/MA-15-SHET  │
│                                     │
│   [Signatures, Notary, etc.]        │
│                                     │
└─────────────────────────────────────┘
```

Anyone who pulls this deed from the registry — 5 years or 50 years from now — scans the code and sees the verified closing package. The paper deed and the digital wallet validate each other.

---

### Who Sees What

| Record | Buyer | Seller | Title Co | Attorney | Lender | Future Title Co |
|--------|-------|--------|----------|----------|--------|----------------|
| Deed | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (public) |
| Chain of title | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Confidence score | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Title search results | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (if shared) |
| Settlement (buyer side) | ✓ | — | ✓ | ✓ | ✓ | — |
| Settlement (seller side) | — | ✓ | ✓ | ✓ | — | — |
| Wire instructions (buyer) | ✓ | — | ✓ | ✓ | ✓ | — |
| Wire instructions (seller) | — | ✓ | ✓ | ✓ | — | — |
| Buyer identity verification | — | — | ✓ | ✓ | ✓ | — |
| Seller identity verification | — | — | ✓ | ✓ | — | — |
| Title insurance policy | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (if shared) |
| Attorney attestation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lender instructions | — | — | ✓ | ✓ | ✓ | — |

Every record is encrypted to the wallets of authorized parties. No one sees what they shouldn't. Everyone sees what they need.

---

### What the Title Company Gets

#### Automatic Title Plant

Every closing creates a verified property record. After 500 closings, the title company has an immutable title plant for 500 properties — built automatically from doing their job. No data entry. No separate database.

When one of those 500 properties comes back for a refinance or resale:
- **Before Origin:** Full title search, 2-8 hours, $200-400
- **With Origin:** Check the existing wallet, verify nothing new filed since last closing, 15 minutes, $50

**The title company's cost drops 90%. They can keep the fee or pass savings to the consumer.**

#### Fraud Detection

The wallet system detects fraud patterns that individual closings can't:
- Same "seller" appearing on multiple properties in different towns
- Notary stamps that don't match the Secretary of State registry
- Wire instructions that change between initial order and closing
- Properties with no attorney attestation when every other closing has one
- Rapid transfers that suggest title washing

#### Professional Liability Protection

The attorney's signed attestation is timestamped and immutable. If there's ever a malpractice claim:
- The attestation proves exactly what the attorney certified and when
- The title search results prove what was found
- The identity verification proves who was checked
- No "he said / she said" — the wallet has the signed record

---

### The Co-Op: Shared Title Network

#### The Problem Today

Every title company maintains their own title plant — or pays the Warren Group $10K-$100K/year for data. When Title Company A does a search on a property, that work is invisible to Title Company B. The next company starts from scratch on the same property.

#### The Origin Title Network

Title companies can **opt in** to share their wallet data with other network members. Not the confidential pieces (wire instructions, identity docs) — just the title verification layer:

**What's shared in the network:**
- Chain of title (verified)
- Lien status (current)
- Confidence score
- Attorney attestation (that title was searched and cleared)
- Recording references (book/page)
- QR code / wallet ID

**What stays private:**
- Wire instructions
- Settlement amounts
- Identity documents
- Lender terms
- Internal work product

#### How the Co-Op Works

```
Title Company A closes on 15 Shetland Dr (2024)
  → Creates wallet, shares chain of title + confidence score to network
  
Title Company B gets an order for 15 Shetland Dr (2027)
  → Sees Company A's verified wallet in the network
  → Only needs to check: anything filed between 2024 and 2027?
  → Search time: 30 minutes instead of 4 hours
  → Company B adds their verification to the wallet
  → Network now has TWO attestations — even higher confidence
  
Title Company C gets the same property (2030)
  → TWO prior verifications in the network
  → Just check 2027-2030 gap
  → Network confidence keeps climbing
```

#### Network Economics

| Tier | Price | What You Get |
|------|-------|-------------|
| **Solo** | $5/wallet created | Your own wallets, private. No network access. |
| **Network Member** | $3/wallet + $500/month | Create wallets at discount. Search the network. See other members' verified properties. |
| **Network Contributor** | $2/wallet + $300/month | Create + share wallets. Search the network. Lower per-wallet cost because you're contributing data. |

**The more you share, the less you pay.** Contributors get the lowest per-wallet cost because every wallet they share makes the network more valuable for everyone.

#### Network Governance

- **Run by Rootz** as a neutral infrastructure provider (not a title company — no conflict of interest)
- **Members vote** on data sharing standards, privacy rules, and fee changes
- **No lock-in** — wallets are portable. If a member leaves, their wallets still exist on-chain
- **Audit trail** — every access to network data is logged. Members can see who searched their properties.
- **Reciprocity** — you can only search the network if you contribute to it. Free riders get Solo tier.

---

### Integration

#### With Existing Title Software

| Platform | Integration |
|----------|------------|
| **Qualia** | Export closing package to Origin wallet. Import network search results. |
| **SoftPro** | Same — export/import via API |
| **EasySoft** | Same |
| **CertifID** | Origin wallet provides verified seller identity + property ownership for CertifID's wire verification |
| **Simplifile / eRecording** | Embed QR code in electronic recording submission |

#### With AI Agents

The Origin Title Wallet is an MCP server. Any AI agent can:
- `search_property("15 Shetland Dr", "Pittsfield")` → full verified record
- `check_liens("15 Shetland Dr", "Pittsfield")` → active/resolved liens
- `verify_wallet("MA-PITTS-15-SHET")` → confidence score + attestation chain
- `get_network_status("15 Shetland Dr")` → how many title companies have verified this property

AI agents don't replace title companies. They use the wallet data to serve buyers, sellers, and lenders faster.

---

### Why This Wins Without Regulation

The Origin Title Wallet follows the **DKIM model, not the HIPAA model.**

DKIM became the email authentication standard because Gmail started checking for it. No law required it. Emails with DKIM got delivered. Emails without got flagged.

Origin Title Wallets work the same way:
- Properties **with wallets** close faster and cost less to search
- Properties **without** require full manual examination
- Title companies **in the network** pay less and search faster
- Title companies **outside** start from scratch every time

Within 3 years:
- Title companies start asking "does this property have a wallet?"
- Real estate agents start advertising "wallet-verified property"
- Lenders start requiring wallet verification for fast-track closings
- Consumers start expecting it

No law needed. Just better economics.

---

### The Numbers

| Metric | Value |
|--------|-------|
| MA real estate transactions/year | ~150,000 |
| Average title search cost (manual) | $200-400 |
| Average title search cost (with wallet) | $50-100 |
| Savings per transaction | $150-300 |
| Total market savings (MA) | $22M-$45M/year |
| Origin revenue at $5-15/wallet | $750K-$2.25M/year (MA only) |
| Network subscription revenue | $300-500/month × N members |
| Wire fraud prevented | Portion of $1.4B annual losses |
| National scale (50 states) | 5.5M transactions/year |

#### For a Single Title Company

A mid-size MA title company doing 500 closings/year:

| Item | Without Origin | With Origin |
|------|---------------|-------------|
| Title search cost (labor) | $150/search × 500 = $75,000 | $50/search × 500 = $25,000 |
| Warren Group data license | $15,000/year | $0 (wallet replaces it) |
| Fraud losses/claims | $50,000/year (avg) | $10,000/year |
| **Total cost** | **$140,000** | **$35,000 + $6,000 Origin** |
| **Annual savings** | | **$99,000** |

The product pays for itself 15x over.

---

### Competitive Position

| Feature | Warren Group | CoreLogic | CertifID | Qualia | **Origin Wallet** |
|---------|-------------|-----------|----------|--------|-----------------|
| Title search data | ✓ | ✓ | — | — | ✓ |
| Cross-property fraud | — | Some | — | — | **✓** |
| Wire verification | — | — | ✓ | — | **✓** |
| Document integrity | — | — | — | — | **✓ (hashed)** |
| Multi-party encryption | — | — | — | — | **✓** |
| Permanent record | — | — | — | — | **✓ (on-chain)** |
| AI accessible (MCP) | — | API ($$$) | — | — | **✓** |
| Network co-op | — | — | — | — | **✓** |
| QR on deed | — | — | — | — | **✓** |
| Cost to title company | $15K+/yr | Enterprise | $150+/mo | $4K+/yr | **$3K-6K/yr** |

**Nobody else gives the title company their own immutable title plant built automatically from doing closings.**

---

### Implementation Timeline

**Phase 1 (Now — 8 weeks): Data Foundation**
- Origin Land Records dataset for Berkshire County
- MCP server with search, chain of title, lien check, fraud detection
- Demo to 3 title companies

**Phase 2 (Weeks 9-16): Title Wallet MVP**
- Wallet creation from closing data export
- QR code generation for deeds
- Multi-party encryption (buyer/seller/attorney/lender access)
- Integration with one title software platform (Qualia or SoftPro)

**Phase 3 (Weeks 17-24): Network Launch**
- Co-op network for shared title verification
- Network search across member wallets
- Contribution-based pricing tiers
- Attorney attestation signing

**Phase 4 (Months 7-12): Scale**
- All Massachusetts registries
- CertifID integration for wire verification
- eRecording integration (QR code in electronic filings)
- Second state expansion

---

### The Pitch

*"Every closing you do creates documents that go into a filing cabinet. Five years later, when that property comes back, you start from scratch.*

*What if every closing automatically created a permanent, verified, encrypted record — attached to the property, not your office? What if the next title company to search that property could see your verified work? What if the deed itself carried a link to the complete closing package?*

*That's the Origin Title Wallet. Your closing file, but permanent. Your title plant, but automatic. Your fraud detection, but network-wide.*

*The filing cabinet costs you $140,000 a year in search labor and data licenses. The wallet costs $6,000 and saves you $99,000.*

*And the deed with the QR code? That's not just a document anymore. It's a portal to the truth.*

*We're launching the network with 10 founding title companies in Berkshire County. Founding members get locked-in pricing for 3 years. Interested?"*
