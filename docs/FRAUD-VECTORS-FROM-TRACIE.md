# Fraud Vectors in Title Insurance — From Tracie (Apr 20, 2026)
## Insider perspective from a practicing title insurance lawyer

---

## Vector 1: The Registry Has No Verification

**The Registry of Deeds does NOT verify documents.** They accept anything that's notarized and properly formatted. They rely entirely on notarization — which is itself broken.

**What this means:** The "Verified/Certified" status we see in the registry index is just a filing label. It means "we received this document and filed it." It does NOT mean "we verified this is legitimate."

**Anyone can file at the ROD.** This is by design — the recording system is meant to be open. But it means a forged deed with a forged notary stamp gets recorded and treated as authentic.

**Origin opportunity:** Our cross-reference verification does what the registry doesn't. If someone files a deed claiming to sell a property, but our chain of title shows the "seller" never owned it — we catch it. The registry can't.

---

## Vector 2: Notary Stamps Are Meaningless

**The notary system is broken in Massachusetts:**

1. **Notary stamps can be ordered from Amazon.** A physical stamp is not a security device — it's office supplies.

2. **Notaries maintain a registry** of documents they notarize, but **nobody checks it.** The registry exists in theory but there's no systematic verification.

3. **Attorneys in MA are NOT required to keep a registry** of notarized documents. So there's literally no authoritative record of what an attorney-notary actually notarized.

4. **Bad actors are producing documents with copies of bank notary stamps or attorney notary stamps.** They forge the stamp and the signature. Since nobody checks the notary's own records, the forgery goes undetected.

**What this means:** The entire foundation of document authenticity in the recording system — notarization — is a paper stamp you can buy online. There is ZERO digital verification of notary identity or intent.

**Origin opportunity:** We can cross-reference the notary name on a document against known notary registrations (Massachusetts maintains a notary commission database through the Secretary of State). If the notary on a deed isn't a registered notary, or if the same notary appears on multiple suspicious transactions, that's a fraud flag.

---

## Vector 3: Pattern Detection for Title Companies

**Title companies are looking for patterns we can learn and automate:**

### Seller Mortgage Pattern
Is the seller simultaneously taking out a mortgage for a new property? This is a normal pattern for a legitimate sale (sell old house, buy new house). Its ABSENCE in certain scenarios is suspicious:
- Seller is "selling" but not buying anywhere = possible fraud (especially if seller didn't know about the sale)
- Seller is refinancing AND selling simultaneously = suspicious
- Property sold twice in rapid succession with big price changes = title washing

### Other Patterns Title Companies Watch For
- **Power of Attorney deeds** — POA used for property sale is a major red flag (used in impersonation fraud)
- **Vacant property sales** — properties that appear vacant are targets for deed fraud
- **Out-of-state notarization** — deed notarized in a different state from where the property is located
- **Recently deceased owners** — estate properties targeted for fraud before probate is filed
- **Corporate entity purchases** — LLC formed shortly before purchase may be a fraud vehicle
- **Rapid equity extraction** — property bought and immediately mortgaged for full value

**Origin opportunity:** Every one of these patterns can be detected automatically from our cross-referenced dataset:
- Seller mortgage check: Search by seller name across all registries for simultaneous mortgage filings
- POA detection: Document type = POWER OF ATTORNEY filed shortly before a deed
- Vacancy: Cross-reference with assessor (owner-occupied flag) and USPS address forwarding
- Estate fraud: Cross-reference with probate court filings
- LLC formation date: Secretary of State database vs deed date

---

## Vector 4: Wire Fraud — The $1.4 Billion Problem

**The wire fraud problem is systemic:**

1. **Nobody is checking.** Banks process wire instructions without verifying the recipient account belongs to the party in the transaction.

2. **Banks set up accounts just for the transaction.** Scammers open accounts specifically to receive fraudulent wire transfers, then close them.

3. **Banks prioritize customer care over security.** Friction in the wire process is seen as a customer service problem, not a security feature. They are literally losing millions because security "stands in the way."

4. **Business Email Compromise (BEC)** — hackers intercept closing instructions and substitute their own wire routing. By the time anyone notices, the money is gone.

**Origin opportunity — Rootz Secure Network:**

Create a trusted network among common providers (title companies, attorneys, lenders, banks) in the closing ecosystem:

```
Traditional Closing:
  Buyer's bank → wire instructions (email, easily spoofed) → Title company → Seller's bank
  
  Problem: No verification of wire instructions. Email can be intercepted.

Rootz Secure Network:
  Buyer's bank ←→ Rootz identity verification ←→ Title company ←→ Seller's bank
  
  - Each party has a Rootz wallet (verified identity)
  - Wire instructions are signed by the sending party's wallet
  - Receiving party's bank account is verified against their Rootz identity
  - Any change in wire instructions triggers verification through a separate channel
  - The closing instructions themselves become a signed, hashed document in the property wallet
```

This is the Rootz messaging model applied to real estate closings:
- Write to an address (property wallet)
- All parties listen (title company, lender, buyer, seller)
- Every message is signed and verified
- No email spoofing possible — instructions are wallet-signed

**Scale of opportunity:** $1.4B in losses in 2023. If we prevent even 1% of wire fraud, that's $14M in saved losses. Title companies and banks would pay significant premiums for this.

---

## How This Connects to What We've Built

| What We Have Today | What It Enables |
|---|---|
| Chain of title from registry | Detect orphan deeds (seller never owned property) |
| Cross-reference verification | Catch phantom documents |
| Confidence scoring | Quantify title risk for underwriting |
| Document hashing | Detect post-filing tampering |
| SSL provenance | Prove document came from official registry |
| MassGIS assessor data | Verify property details match deed description |
| Secretary of State lookup | Verify LLC formation date vs deed date |
| Multi-source attestation | What the registry can't do — actual verification |

### The Pitch to Title Companies (Updated from Tracie's Input)

*"The Registry of Deeds doesn't verify anything — they told us so. Notary stamps cost $12 on Amazon. Nobody checks the notary registry. Your title examiners are looking for fraud patterns manually in a system with zero digital verification.*

*Origin does what the registry can't: cross-reference every document across independent sources, detect fraud patterns automatically, and produce a cryptographic proof that the documents are authentic and unaltered. We catch the forged deed before you issue the policy.*

*And when it's time to close — our secure network verifies wire instructions through wallet-signed messages, not spoofable email. No more $1.4 billion in wire fraud losses.*

*The registry is a filing cabinet. We're the security system."*

---

## Action Items from Tracie's Input

1. **Add notary verification** to the Origin record — cross-reference notary name against MA Secretary of State notary commission database
2. **Build fraud pattern detection rules** — seller mortgage check, POA flag, vacancy detection, rapid equity extraction
3. **Research MA notary commission database** — is it publicly accessible? API?
4. **Explore Rootz Secure Network** for closing transactions — wire instruction signing, multi-party verification
5. **Talk to title company underwriters** — what patterns do they actually check? What do they miss?
