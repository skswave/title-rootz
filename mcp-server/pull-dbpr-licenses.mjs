#!/usr/bin/env node
// Pull FL DBPR Vacation Rental Licenses — STATEWIDE
// Source: Florida Dept of Business & Professional Regulation
// Downloads: https://www2.myfloridalicense.com/sto/file_download/extracts/
//
// These CSVs contain every licensed lodging establishment in Florida
// across 7 geographic districts. Filter by license type to isolate
// vacation rentals (type 2006 = condo, type 2007 = dwelling).
//
// PHONE NUMBERS included. No email.
//
// Usage:
//   node pull-dbpr-licenses.mjs                    # Pull all 7 districts
//   node pull-dbpr-licenses.mjs --district 1       # Pull one district
//   node pull-dbpr-licenses.mjs --stats            # Show stats from downloaded data
//   node pull-dbpr-licenses.mjs --list             # Show district coverage

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data', 'dbpr-licenses');

// DBPR lodging license CSV URLs by district
const DISTRICTS = {
  1: { url: 'https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge1.csv', counties: 'Miami-Dade, Monroe' },
  2: { url: 'https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge2.csv', counties: 'Broward, Palm Beach, Martin, St. Lucie, Indian River, Okeechobee' },
  3: { url: 'https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge3.csv', counties: 'Hillsborough, Pinellas, Polk, Pasco, Manatee, Sarasota, Hardee, Highlands, DeSoto' },
  4: { url: 'https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge4.csv', counties: 'Orange, Osceola, Brevard, Volusia, Seminole, Lake, Sumter' },
  5: { url: 'https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge5.csv', counties: 'Duval, Alachua, St. Johns, Marion, Putnam, Clay, Nassau, Flagler' },
  6: { url: 'https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge6.csv', counties: 'Bay, Okaloosa, Walton, Escambia, Santa Rosa, Leon, Gulf, Franklin' },
  7: { url: 'https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge7.csv', counties: 'Collier, Lee, Sarasota, Manatee, Charlotte, Hendry, Glades' },
};

// Vacation rental type codes (filter from all lodging)
const VACATION_RENTAL_TYPES = ['2006', '2007'];  // 2006=Condo, 2007=Dwelling

// ═══════════════════════════════════════════════════════════════
// CSV PARSER (handles DBPR's specific format)
// ═══════════════════════════════════════════════════════════════

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse header — DBPR uses standard comma-separated with possible quoted fields
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 3) continue; // skip malformed
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = (fields[j] || '').trim();
    }
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ═══════════════════════════════════════════════════════════════
// DOWNLOAD AND PARSE
// ═══════════════════════════════════════════════════════════════

async function pullDistrict(districtNum) {
  const district = DISTRICTS[districtNum];
  if (!district) { console.log(`Unknown district: ${districtNum}`); return null; }

  console.log(`\n  District ${districtNum}: ${district.counties}`);
  console.log(`  URL: ${district.url}`);

  try {
    const resp = await fetch(district.url, { signal: AbortSignal.timeout(60000) });
    if (!resp.ok) {
      console.log(`  HTTP ${resp.status} — ${resp.statusText}`);
      return null;
    }

    const text = await resp.text();
    const { headers, rows } = parseCSV(text);

    if (rows.length === 0) {
      console.log(`  Empty or unparseable CSV`);
      console.log(`  First 500 chars: ${text.slice(0, 500)}`);
      return null;
    }

    // Log actual headers so we know the REAL field names (no guessing)
    console.log(`  Headers (${headers.length}): ${headers.join(', ')}`);
    console.log(`  Total rows: ${rows.length}`);

    // Save raw CSV
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const rawFile = path.join(DATA_DIR, `district-${districtNum}-raw.csv`);
    fs.writeFileSync(rawFile, text);
    console.log(`  Raw saved: ${rawFile} (${(text.length / 1024).toFixed(0)} KB)`);

    // Try to identify vacation rentals by examining actual data
    // First, discover which field holds the license type code
    const typeFields = headers.filter(h =>
      /type|code|class|category|lic.*type/i.test(h)
    );
    console.log(`  Potential type fields: ${typeFields.join(', ') || '(none found by name)'}`);

    // Show a sample row for manual inspection
    console.log(`  Sample row 1: ${JSON.stringify(rows[0], null, 2).slice(0, 800)}`);
    if (rows.length > 1) {
      console.log(`  Sample row 2: ${JSON.stringify(rows[1], null, 2).slice(0, 800)}`);
    }

    // Identify phone field(s)
    const phoneFields = headers.filter(h => /phone|tel/i.test(h));
    console.log(`  Phone fields: ${phoneFields.join(', ') || '(none found by name)'}`);

    // Identify email field(s)
    const emailFields = headers.filter(h => /email|mail/i.test(h));
    console.log(`  Email fields: ${emailFields.join(', ') || '(none found by name)'}`);

    // Save all rows as JSONL
    const jsonlFile = path.join(DATA_DIR, `district-${districtNum}-all.jsonl`);
    const jsonl = rows.map(r => JSON.stringify(r)).join('\n') + '\n';
    fs.writeFileSync(jsonlFile, jsonl);

    return { district: districtNum, counties: district.counties, headers, totalRows: rows.length, rows };

  } catch (e) {
    console.log(`  Error: ${e.message}`);
    return null;
  }
}

async function filterVacationRentals(allResults) {
  // After downloading, we examine the actual data to find the type field and filter
  // This is done post-download because we don't know the exact field name until we see the CSV

  let totalAll = 0;
  let totalVR = 0;
  const vrRecords = [];

  for (const result of allResults) {
    if (!result) continue;
    totalAll += result.totalRows;

    // Look for type code field — could be various names
    // We check actual values to find which field contains '2006'/'2007'
    let typeField = null;
    const sample = result.rows.slice(0, 50);

    for (const header of result.headers) {
      const values = sample.map(r => r[header]).filter(Boolean);
      const hasVRCode = values.some(v => VACATION_RENTAL_TYPES.includes(v.trim()));
      if (hasVRCode) {
        typeField = header;
        break;
      }
    }

    if (typeField) {
      console.log(`\n  District ${result.district}: type field = "${typeField}"`);
      const filtered = result.rows.filter(r =>
        VACATION_RENTAL_TYPES.includes((r[typeField] || '').trim())
      );
      console.log(`  Vacation rentals: ${filtered.length} of ${result.totalRows}`);
      totalVR += filtered.length;

      for (const r of filtered) {
        r._district = result.district;
        r._counties = result.counties;
        vrRecords.push(r);
      }
    } else {
      console.log(`\n  District ${result.district}: could not identify type field`);
      console.log(`  Headers: ${result.headers.join(', ')}`);
      console.log(`  Check raw CSV and update filter logic.`);
    }
  }

  // Save filtered vacation rentals
  if (vrRecords.length > 0) {
    const vrFile = path.join(DATA_DIR, 'vacation-rentals-statewide.jsonl');
    const jsonl = vrRecords.map(r => JSON.stringify(r)).join('\n') + '\n';
    fs.writeFileSync(vrFile, jsonl);
    console.log(`\n  Statewide vacation rentals: ${totalVR.toLocaleString()} (of ${totalAll.toLocaleString()} total lodging)`);
    console.log(`  Saved to: ${vrFile}`);
  }

  return { totalAll, totalVR, vrRecords };
}

function showStats() {
  if (!fs.existsSync(DATA_DIR)) {
    console.log('No DBPR data yet. Run without --stats first.');
    return;
  }

  const vrFile = path.join(DATA_DIR, 'vacation-rentals-statewide.jsonl');
  if (!fs.existsSync(vrFile)) {
    console.log('No vacation rental file yet.');
    return;
  }

  const lines = fs.readFileSync(vrFile, 'utf-8').split('\n').filter(l => l.trim());
  const records = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

  console.log(`\n=== DBPR Vacation Rental License Stats ===\n`);
  console.log(`  Total records: ${records.length.toLocaleString()}`);

  // Count by district
  const byDistrict = {};
  for (const r of records) {
    const d = r._district || '?';
    byDistrict[d] = (byDistrict[d] || 0) + 1;
  }
  console.log('\n  By district:');
  for (const [d, c] of Object.entries(byDistrict).sort()) {
    console.log(`    District ${d}: ${c.toLocaleString().padStart(6)} — ${DISTRICTS[d]?.counties || ''}`);
  }

  // Count records with phone numbers
  let withPhone = 0;
  let withEmail = 0;
  for (const r of records) {
    const vals = Object.values(r).join('|');
    if (/\d{3}[-.)]\d{3}[-.)]\d{4}/.test(vals) || /\(\d{3}\)\s?\d{3}/.test(vals)) withPhone++;
    if (/@/.test(vals)) withEmail++;
  }
  console.log(`\n  With phone pattern: ${withPhone.toLocaleString()}`);
  console.log(`  With email pattern: ${withEmail.toLocaleString()}`);
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes('--list')) {
  console.log('\nDBPR Lodging License Districts:');
  for (const [num, d] of Object.entries(DISTRICTS)) {
    console.log(`  District ${num}: ${d.counties}`);
  }
  console.log('\nVacation rental type codes: 2006 (Condo), 2007 (Dwelling)');
  console.log('Source: myfloridalicense.com/sto/file_download/extracts/');
  process.exit(0);
}

if (args.includes('--stats')) {
  showStats();
  process.exit(0);
}

console.log('\n=== Pulling FL DBPR Vacation Rental Licenses ===');
console.log('Source: Florida Dept of Business & Professional Regulation');
console.log('Data: Every licensed lodging establishment, with PHONE NUMBERS\n');

const targetDistrict = args.includes('--district') ? parseInt(args[args.indexOf('--district') + 1]) : null;
const results = [];

if (targetDistrict) {
  const r = await pullDistrict(targetDistrict);
  if (r) results.push(r);
} else {
  for (const num of Object.keys(DISTRICTS)) {
    const r = await pullDistrict(parseInt(num));
    if (r) results.push(r);
  }
}

if (results.length > 0) {
  await filterVacationRentals(results);
}

console.log('\nDone.');
