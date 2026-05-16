/**
 * AI_CONTEXT: Broward County Clerk court record signal lookup
 *
 * Dependencies:
 *   - better-sqlite3
 *   - data/broward-clerk/farming-signals.db (908K court records, SFTP bulk)
 *
 * Exports:
 *   - getClerkDb() — returns SQLite connection (lazy-loaded, readonly)
 *   - lookupClerkSignals(ownerName, parcelId) — returns court filings for owner
 *
 * Court signal types: lis_pendens, probate, lien, final_judgment, death, mortgage, satisfaction
 * Match types: 'confirmed' (parcel ID match) or 'name_match' (same name in county)
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { DATA_DIR } from '../lib/config.js';

const CLERK_DB_PATH = path.join(DATA_DIR, 'broward-clerk', 'farming-signals.db');
let _clerkDb = null;
let _clerkStmts = {};

export function getClerkDb() {
  if (_clerkDb) return _clerkDb;
  if (!fs.existsSync(CLERK_DB_PATH)) return null;
  try {
    _clerkDb = new Database(CLERK_DB_PATH, { readonly: true });
    _clerkStmts.byName = _clerkDb.prepare(`
      SELECT s.*, GROUP_CONCAT(p2.party_name, '|') as all_parties
      FROM parties p
      JOIN signals s ON p.instrument_num = s.instrument_num
      LEFT JOIN parties p2 ON s.instrument_num = p2.instrument_num
      WHERE p.party_name_norm = ?
      GROUP BY s.instrument_num
      ORDER BY s.record_date DESC
      LIMIT 50
    `);
    _clerkStmts.byNameLike = _clerkDb.prepare(`
      SELECT s.*, GROUP_CONCAT(p2.party_name, '|') as all_parties
      FROM parties p
      JOIN signals s ON p.instrument_num = s.instrument_num
      LEFT JOIN parties p2 ON s.instrument_num = p2.instrument_num
      WHERE p.party_name_norm LIKE ?
      GROUP BY s.instrument_num
      ORDER BY s.record_date DESC
      LIMIT 50
    `);
    return _clerkDb;
  } catch (e) {
    console.error('Clerk DB init error:', e.message);
    return null;
  }
}

export function lookupClerkSignals(ownerName, parcelId = null) {
  const db = getClerkDb();
  if (!db || !ownerName) return [];
  const norm = ownerName.replace(/[,.\s]+/g, ' ').trim().toUpperCase();
  if (norm.length < 3) return [];
  try {
    const results = _clerkStmts.byName.all(norm);

    return results.map(r => {
      const hasParcelMatch = parcelId && r.parcel_id && r.parcel_id === parcelId;
      const matchType = hasParcelMatch ? 'confirmed' : 'name_match';

      return {
        signal: r.signal,
        category: r.category,
        description: r.description,
        docType: r.doc_type,
        recordDate: r.record_date,
        instrumentNum: r.instrument_num,
        caseNum: r.case_num || null,
        consideration: r.consideration,
        hash: r.hash,
        parties: (r.all_parties || '').split('|').filter(Boolean),
        matchType,
        matchNote: matchType === 'confirmed'
          ? 'Confirmed — parcel ID matches county records'
          : 'Matched by owner name in Broward County records — verify this filing relates to this specific property',
        source: 'Broward County Clerk of Courts (SFTP bulk)',
        sourceUrl: 'BCFTP.Broward.org'
      };
    });
  } catch (e) {
    return [];
  }
}

// Export prepared statements for direct use by farmingSearch (performance)
export { _clerkStmts };
