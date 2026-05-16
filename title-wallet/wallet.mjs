/**
 * Origin Title Wallet — Wallet CRUD Operations
 *
 * A wallet is a permanent, encrypted record attached to a property.
 * Created from a title company's closing package upload.
 *
 * Storage: ./wallets/{propertyId}/
 *   wallet.json    — metadata + public layer
 *   parties.json   — encrypted per-party data
 *   events.json    — event log (genesis, updates, transfers)
 *   keys.json      — master key + party keys (title company only)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  generateMasterKey, derivePartyKey, encrypt, decrypt,
  hashDocument, hashObject, encryptClosingPackage,
  generateShareKey
} from './crypto.mjs';

import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WALLETS_DIR = path.join(__dirname, 'wallets');

// Normalize a property address into a wallet ID
export function propertyId(address, town, state = 'MA') {
  const clean = `${state}-${town}-${address}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return clean;
}

// Get the wallet directory for a property
function walletDir(propId) {
  return path.join(WALLETS_DIR, propId);
}

// Check if a wallet exists
export function walletExists(propId) {
  return fs.existsSync(path.join(walletDir(propId), 'wallet.json'));
}

// List all wallets
export function listWallets() {
  if (!fs.existsSync(WALLETS_DIR)) return [];
  return fs.readdirSync(WALLETS_DIR)
    .filter(d => fs.existsSync(path.join(WALLETS_DIR, d, 'wallet.json')))
    .map(d => {
      const w = JSON.parse(fs.readFileSync(path.join(WALLETS_DIR, d, 'wallet.json'), 'utf8'));
      return {
        propertyId: d,
        address: w.property.address,
        town: w.property.town,
        state: w.property.state,
        currentOwner: w.property.currentOwner,
        created: w.wallet.created,
        trustLevel: w.wallet.trustLevel,
        confidence: w.wallet.confidence,
        eventCount: w.wallet.eventCount
      };
    });
}

/**
 * Create a new Title Wallet from a closing package.
 *
 * closingPackage shape:
 * {
 *   property: { address, town, state, county, zip },
 *   transaction: { type, date, price, deedNumber, bookPage, registry },
 *   parties: {
 *     buyer: { name, address },
 *     seller: { name, address },
 *     titleCompany: { name, licenseNumber, address },
 *     attorney: { name, barNumber },
 *     lender: { name, loanNumber }
 *   },
 *   documents: {
 *     deed: { ... },
 *     chainOfTitle: [ ... ],
 *     titleSearch: { ... },
 *     settlementBuyer: { ... },
 *     settlementSeller: { ... },
 *     wireBuyer: { ... },
 *     wireSeller: { ... },
 *     identityBuyer: { ... },
 *     identitySeller: { ... },
 *     attestation: { ... },
 *     internalNotes: { ... }
 *   },
 *   liens: { active: [], discharged: [] },
 *   confidenceScore: 0.0-1.0,
 *   confidenceDetail: { ... }
 * }
 */
export function createWallet(closingPackage) {
  const pkg = closingPackage;
  const propId = propertyId(pkg.property.address, pkg.property.town, pkg.property.state || 'MA');
  const dir = walletDir(propId);

  if (walletExists(propId)) {
    throw new Error(`Wallet already exists for ${propId}. Use updateWallet() to add events.`);
  }

  fs.mkdirSync(dir, { recursive: true });

  // Generate encryption keys
  const masterKey = generateMasterKey();
  const partyKeys = {};
  const shareLinks = {};
  for (const role of ['buyer', 'seller', 'titleCompany', 'attorney', 'lender', 'futureTitleCo']) {
    const key = derivePartyKey(masterKey, role);
    partyKeys[role] = key;
    shareLinks[role] = generateShareKey(key);
  }

  // Build the public layer (visible to anyone with wallet access)
  const publicLayer = {
    deed: pkg.documents.deed || null,
    chainOfTitle: pkg.documents.chainOfTitle || [],
    liens: pkg.liens || { active: [], discharged: [] },
    attestation: pkg.documents.attestation || null,
    confidenceScore: pkg.confidenceScore || 0,
    confidenceDetail: pkg.confidenceDetail || {}
  };

  // Encrypt per-party private data
  const encryptedParties = encryptClosingPackage(pkg.documents, masterKey);

  // Compute integrity hashes
  const publicHash = hashObject(publicLayer);
  const documentHashes = {};
  for (const [docType, doc] of Object.entries(pkg.documents)) {
    if (doc) documentHashes[docType] = hashObject(doc);
  }

  // Build wallet metadata
  const now = new Date().toISOString();
  const wallet = {
    wallet: {
      id: propId,
      version: '1.0',
      created: now,
      lastUpdated: now,
      status: 'active',
      trustLevel: determineTrustLevel(pkg),
      confidence: pkg.confidenceScore || 0,
      eventCount: 1,
      merkleRoot: publicHash,
      documentHashes
    },
    property: {
      address: pkg.property.address,
      town: pkg.property.town,
      state: pkg.property.state || 'MA',
      county: pkg.property.county || '',
      zip: pkg.property.zip || '',
      currentOwner: pkg.parties.buyer?.name || 'Unknown'
    },
    transaction: {
      type: pkg.transaction.type || 'sale',
      date: pkg.transaction.date,
      price: pkg.transaction.price,
      deedNumber: pkg.transaction.deedNumber,
      bookPage: pkg.transaction.bookPage,
      registry: pkg.transaction.registry
    },
    parties: {
      buyer: { name: pkg.parties.buyer?.name },
      seller: { name: pkg.parties.seller?.name },
      titleCompany: {
        name: pkg.parties.titleCompany?.name,
        licenseNumber: pkg.parties.titleCompany?.licenseNumber
      },
      attorney: {
        name: pkg.parties.attorney?.name,
        barNumber: pkg.parties.attorney?.barNumber
      },
      lender: { name: pkg.parties.lender?.name }
    },
    public: publicLayer
  };

  // Genesis event
  const events = [{
    id: 1,
    type: 'GENESIS',
    timestamp: now,
    description: `Wallet created from ${pkg.transaction.type || 'sale'} closing`,
    source: pkg.parties.titleCompany?.name || 'Origin Title Wallet',
    documentCount: Object.keys(pkg.documents).filter(k => pkg.documents[k]).length,
    hash: publicHash
  }];

  // Keys file (only accessible to title company / system admin)
  const keys = {
    masterKey,
    partyKeys,
    shareLinks,
    created: now,
    warning: 'DO NOT SHARE. Title company retains master key. Party keys distributed at closing.'
  };

  // Write everything
  fs.writeFileSync(path.join(dir, 'wallet.json'), JSON.stringify(wallet, null, 2));
  fs.writeFileSync(path.join(dir, 'parties.json'), JSON.stringify(encryptedParties, null, 2));
  fs.writeFileSync(path.join(dir, 'events.json'), JSON.stringify(events, null, 2));
  fs.writeFileSync(path.join(dir, 'keys.json'), JSON.stringify(keys, null, 2));

  return {
    propertyId: propId,
    wallet: wallet.wallet,
    property: wallet.property,
    transaction: wallet.transaction,
    shareLinks,
    trustLevel: wallet.wallet.trustLevel,
    confidence: wallet.wallet.confidence,
    eventCount: 1,
    documentCount: events[0].documentCount
  };
}

// Get wallet public data
export function getWallet(propId) {
  const dir = walletDir(propId);
  if (!fs.existsSync(path.join(dir, 'wallet.json'))) return null;

  const wallet = JSON.parse(fs.readFileSync(path.join(dir, 'wallet.json'), 'utf8'));
  const events = JSON.parse(fs.readFileSync(path.join(dir, 'events.json'), 'utf8'));

  return { ...wallet, events };
}

// Get party-specific decrypted data
export function getPartyViewSync(propId, shareKey) {
  const dir = walletDir(propId);
  if (!fs.existsSync(path.join(dir, 'parties.json'))) return null;

  const parties = JSON.parse(fs.readFileSync(path.join(dir, 'parties.json'), 'utf8'));

  for (const [role, partyData] of Object.entries(parties)) {
    if (partyData.shareKey === shareKey) {
      try {
        const keyHex = Buffer.from(shareKey, 'base64url').toString('hex');
        const plaintext = decrypt(partyData.encrypted, keyHex);
        return {
          role,
          documents: JSON.parse(plaintext),
          accessibleDocuments: partyData.accessibleDocuments
        };
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Add an event to a wallet (refinance, new filing, transfer, etc.)
export function addEvent(propId, event) {
  const dir = walletDir(propId);
  if (!fs.existsSync(path.join(dir, 'events.json'))) {
    throw new Error(`No wallet found for ${propId}`);
  }

  const events = JSON.parse(fs.readFileSync(path.join(dir, 'events.json'), 'utf8'));
  const wallet = JSON.parse(fs.readFileSync(path.join(dir, 'wallet.json'), 'utf8'));

  const newEvent = {
    id: events.length + 1,
    type: event.type || 'UPDATE',
    timestamp: new Date().toISOString(),
    description: event.description,
    source: event.source || 'Origin Title Wallet',
    hash: hashObject(event),
    ...event
  };

  events.push(newEvent);
  wallet.wallet.eventCount = events.length;
  wallet.wallet.lastUpdated = newEvent.timestamp;

  if (event.confidence) wallet.wallet.confidence = event.confidence;
  if (event.newOwner) wallet.property.currentOwner = event.newOwner;

  fs.writeFileSync(path.join(dir, 'events.json'), JSON.stringify(events, null, 2));
  fs.writeFileSync(path.join(dir, 'wallet.json'), JSON.stringify(wallet, null, 2));

  return newEvent;
}

// Verify wallet integrity
export function verifyWallet(propId) {
  const dir = walletDir(propId);
  if (!fs.existsSync(path.join(dir, 'wallet.json'))) return null;

  const wallet = JSON.parse(fs.readFileSync(path.join(dir, 'wallet.json'), 'utf8'));
  const events = JSON.parse(fs.readFileSync(path.join(dir, 'events.json'), 'utf8'));

  const currentPublicHash = hashObject(wallet.public);
  const storedHash = wallet.wallet.merkleRoot;

  return {
    propertyId: propId,
    status: wallet.wallet.status,
    trustLevel: wallet.wallet.trustLevel,
    confidence: wallet.wallet.confidence,
    created: wallet.wallet.created,
    lastUpdated: wallet.wallet.lastUpdated,
    eventCount: events.length,
    integrityCheck: {
      publicHashMatch: currentPublicHash === storedHash,
      computedHash: currentPublicHash,
      storedHash
    },
    property: wallet.property,
    transaction: wallet.transaction,
    parties: wallet.parties
  };
}

// Determine trust level from closing data
function determineTrustLevel(pkg) {
  let level = 1; // Self-claimed

  // Level 2: Has recorded deed
  if (pkg.transaction.deedNumber || pkg.transaction.bookPage) level = 2;

  // Level 3: Has professional attestation
  if (pkg.documents.attestation && pkg.parties.attorney?.barNumber) level = 3;

  // Level 4: Multi-source verification
  if (pkg.confidenceScore >= 0.80) level = 4;

  // Level 5 requires multiple independent parties over time (not achievable at creation)
  return level;
}

// Get share links for a wallet (title company only — requires master key)
export function getShareLinks(propId) {
  const dir = walletDir(propId);
  const keysPath = path.join(dir, 'keys.json');
  if (!fs.existsSync(keysPath)) return null;

  const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  return keys.shareLinks;
}
