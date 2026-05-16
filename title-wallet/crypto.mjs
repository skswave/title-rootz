/**
 * Origin Title Wallet — Per-Party Encryption
 *
 * Each party in a closing gets their own AES-256-GCM key.
 * The title company holds all keys. Each party gets only theirs.
 *
 * Key hierarchy:
 *   Wallet Master Key (generated once per wallet)
 *     └─ Party Key = HKDF(masterKey, partyRole)
 *        └─ AES-256-GCM encrypts that party's documents
 */

import crypto from 'node:crypto';

// AES-256-GCM encryption
export function encrypt(plaintext, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return { ciphertext, iv: iv.toString('hex'), authTag };
}

export function decrypt(encrypted, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(encrypted.iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

// Generate a 256-bit master key
export function generateMasterKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Derive a party-specific key from the master key using HKDF
export function derivePartyKey(masterKeyHex, partyRole) {
  const masterKey = Buffer.from(masterKeyHex, 'hex');
  const salt = Buffer.from('origin-title-wallet-v1', 'utf8');
  const info = Buffer.from(`party:${partyRole}`, 'utf8');

  const derived = crypto.hkdfSync('sha256', masterKey, salt, info, 32);
  return Buffer.from(derived).toString('hex');
}

// SHA-256 hash for document integrity
export function hashDocument(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Hash an object (JSON-deterministic)
export function hashObject(obj) {
  const stable = JSON.stringify(obj);
  return hashDocument(stable);
}

// Generate a share key for a specific party (URL-safe base64)
export function generateShareKey(partyKeyHex) {
  // The share key IS the party key, encoded for URLs
  return Buffer.from(partyKeyHex, 'hex').toString('base64url');
}

// Decode a share key back to hex
export function decodeShareKey(shareKey) {
  return Buffer.from(shareKey, 'base64url').toString('hex');
}

// Encrypt a closing package for all parties
export function encryptClosingPackage(closingData, masterKeyHex) {
  const parties = {};

  // Define what each party can see
  const accessMatrix = {
    buyer: ['deed', 'chainOfTitle', 'titleSearch', 'settlementBuyer', 'wireBuyer', 'attestation'],
    seller: ['deed', 'chainOfTitle', 'titleSearch', 'settlementSeller', 'wireSeller', 'attestation'],
    titleCompany: ['deed', 'chainOfTitle', 'titleSearch', 'settlementBuyer', 'settlementSeller',
                   'wireBuyer', 'wireSeller', 'identityBuyer', 'identitySeller', 'attestation', 'internalNotes'],
    attorney: ['deed', 'chainOfTitle', 'titleSearch', 'settlementBuyer', 'settlementSeller',
               'wireBuyer', 'wireSeller', 'identityBuyer', 'identitySeller', 'attestation'],
    lender: ['deed', 'chainOfTitle', 'titleSearch', 'settlementBuyer', 'wireBuyer',
             'identityBuyer', 'attestation'],
    futureTitleCo: ['deed', 'chainOfTitle', 'attestation']
  };

  for (const [role, accessibleDocs] of Object.entries(accessMatrix)) {
    const partyKey = derivePartyKey(masterKeyHex, role);

    // Build this party's view of the closing
    const partyData = {};
    for (const docType of accessibleDocs) {
      if (closingData[docType]) {
        partyData[docType] = closingData[docType];
      }
    }

    // Encrypt the party's view
    const plaintext = JSON.stringify(partyData);
    const encrypted = encrypt(plaintext, partyKey);

    parties[role] = {
      encrypted,
      accessibleDocuments: accessibleDocs,
      shareKey: generateShareKey(partyKey)
    };
  }

  return parties;
}

// Decrypt a party's view
export function decryptPartyData(partyEncrypted, shareKey) {
  const partyKeyHex = decodeShareKey(shareKey);
  const plaintext = decrypt(partyEncrypted.encrypted, partyKeyHex);
  return JSON.parse(plaintext);
}
