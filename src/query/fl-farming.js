/**
 * AI_CONTEXT: Florida farming prospect search — finds properties likely to list
 *
 * Dependencies:
 *   - data/florida/cities/*.jsonl (DOR statewide parcels, city-indexed)
 *   - src/query/fl-clerk.js (court record signals)
 *   - src/lib/config.js (CITIES_DIR)
 *
 * Exports:
 *   - farmingSearch({ city, lat, lng, radius, signals, limit, minScore }) → { total, prospects[], summary }
 *
 * Called by: /api/fl/farm endpoint and FARMING_TOOLS in chat-handler
 * Filters residential parcels, applies investor + clerk signals, scores and ranks.
 */

import fs from 'fs';
import path from 'path';
import { CITIES_DIR } from '../lib/config.js';
import { getClerkDb, _clerkStmts } from './fl-clerk.js';

export function farmingSearch({ city, zip, lat, lng, radius = 1.0, signals = [], limit = 50, minScore = 0 }) {
  // ZIP code search — find matching city file(s) and filter by ZIP
  const filterZip = zip ? String(zip).trim() : '';

  let cityUp, cityFile;
  if (filterZip && !city) {
    // Search all city files for properties in this ZIP
    const files = fs.readdirSync(CITIES_DIR).filter(f => f.endsWith('.jsonl'));
    const matchedFile = findCityFileByZip(filterZip, files);
    if (!matchedFile) {
      return { error: `No properties found for ZIP ${filterZip}`, hint: 'Try providing a city name along with the ZIP' };
    }
    cityUp = matchedFile.replace('.jsonl', '');
    cityFile = path.join(CITIES_DIR, matchedFile);
  } else {
    cityUp = (city || '').toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_]/g, '');
    cityFile = path.join(CITIES_DIR, `${cityUp}.jsonl`);
  }

  if (!cityUp || !fs.existsSync(cityFile)) {
    return { error: `City not found: ${city || zip}`, availableCities: 'Use /api/fl/farm?list=cities for available cities' };
  }

  const RESIDENTIAL = new Set(['000', '001', '002', '003', '004', '005', '006', '007', '008', '009']);
  const EXCLUDE = ['DEPT OF TRANSPORTATION', 'SCHOOL BOARD', 'HOUSING AUTHORITY', 'HOMEOWNERS ASSN', 'CONDOMINIUM ASSN', 'MASTER ASSN', 'STATE OF FLORIDA', 'UNITED STATES', 'CITY OF', 'COUNTY OF', 'WATER MANAGEMENT'];

  const lines = fs.readFileSync(cityFile, 'utf-8').split('\n');
  const db = getClerkDb();
  const prospects = [];
  const signalSet = new Set(signals.map(s => s.toLowerCase().trim()));
  const filterBySignal = signalSet.size > 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    let p;
    try { p = JSON.parse(line); } catch { continue; }

    const dor = String(p.DOR_UC || '').trim();
    if (!RESIDENTIAL.has(dor)) continue;

    // ZIP filter
    if (filterZip && String(p.PHY_ZIPCD || '').trim().slice(0, 5) !== filterZip) continue;

    const name = (p.OWN_NAME || '').toUpperCase();
    if (EXCLUDE.some(e => name.includes(e))) continue;

    let score = 0;
    const reasons = [];
    const ownAddr = (p.OWN_ADDR1 || '').trim().toUpperCase();
    const phyAddr = (p.PHY_ADDR1 || '').trim().toUpperCase();
    const ownState = (p.OWN_STATE || '').trim().toUpperCase();
    const hmstd = parseInt(p.AV_HMSTD) || 0;
    const jv = parseInt(p.JV) || 0;
    const sp = parseInt(p.SALE_PRC1) || 0;
    const absentee = ownAddr && phyAddr && ownAddr !== phyAddr;
    const oos = ownState && ownState !== 'FLORIDA' && ownState !== 'FL' && ownState !== '';
    const corp = ['LLC', 'CORP', 'INC ', 'INC.', 'HOLDINGS', 'TRUST', 'ESTATE', 'BANK'].some(kw => name.includes(kw));

    if (absentee && oos) { score += 12; reasons.push('Out-of-state absentee'); }
    else if (absentee) { score += 10; reasons.push('Absentee owner'); }
    if (corp) { score += 8; reasons.push('Corporate/LLC/Trust'); }
    if (hmstd === 0) { score += 5; reasons.push('No homestead'); }
    if (jv > 0 && sp > 1000 && jv > sp * 2) { score += 6; reasons.push('High equity'); }

    // Clerk signals
    let clerkHits = [];
    if (db && name.length >= 3) {
      const norm = name.replace(/[,.\s]+/g, ' ').trim();
      try {
        const rows = _clerkStmts.byName?.all(norm) || [];
        for (const r of rows) {
          if (!clerkHits.some(h => h.signal === r.signal)) {
            clerkHits.push({ signal: r.signal, date: r.record_date, caseNum: r.case_num });
          }
        }
      } catch {}
    }

    const hasLP = clerkHits.some(h => h.signal === 'lis_pendens');
    const hasProbate = clerkHits.some(h => h.signal === 'probate');
    const hasLien = clerkHits.some(h => h.signal === 'lien');
    const hasJudgment = clerkHits.some(h => h.signal === 'final_judgment');
    const hasDeath = clerkHits.some(h => h.signal === 'death');
    const hasMortgage = clerkHits.some(h => h.signal === 'mortgage');
    const hasSatisfaction = clerkHits.some(h => h.signal === 'satisfaction');

    if (hasLP) { score += 25; reasons.push('Litigation pending (pre-foreclosure)'); }
    if (hasProbate) { score += 20; reasons.push('Probate filing'); }
    if (hasLien) { score += 15; reasons.push('Lien on property'); }
    if (hasJudgment) { score += 10; reasons.push('Foreclosure judgment'); }
    if (hasDeath) { score += 12; reasons.push('Death certificate recorded'); }

    score = Math.min(100, score);
    if (score < minScore) continue;

    // Signal filter
    if (filterBySignal) {
      const propSignals = new Set();
      if (hasLP) propSignals.add('lis_pendens');
      if (hasProbate) propSignals.add('probate');
      if (hasLien) propSignals.add('lien');
      if (hasJudgment) propSignals.add('judgment');
      if (hasDeath) propSignals.add('death');
      if (hasMortgage) propSignals.add('mortgage');
      if (hasSatisfaction) propSignals.add('free_clear');
      if (absentee) propSignals.add('absentee');
      if (oos) propSignals.add('out_of_state');
      if (corp) propSignals.add('corporate');
      if (hmstd === 0) propSignals.add('no_homestead');

      let matched = false;
      for (const s of signalSet) {
        if (propSignals.has(s)) { matched = true; break; }
      }
      if (!matched) continue;
    }

    const DOR_DESC = { '000': 'Vacant Residential', '001': 'Single Family', '002': 'Mobile Home', '003': 'Multi-Family (2-9)', '004': 'Condo', '005': 'Co-op', '006': 'Retirement Home', '007': 'Misc Residential', '008': 'Multi-Family (10+)', '009': 'Non-marketable Residential' };

    const sale1Price = parseInt(p.SALE_PRC1) || 0;
    const sale1Year = parseInt(p.SALE_YR1) || 0;
    const sale1Month = p.SALE_MO1 || '';
    const sale2Price = parseInt(p.SALE_PRC2) || 0;
    const sale2Year = parseInt(p.SALE_YR2) || 0;
    const sales = [];
    if (sale1Year > 0) sales.push({ price: sale1Price, date: `${sale1Month}/${sale1Year}`, year: sale1Year });
    if (sale2Year > 0) sales.push({ price: sale2Price, date: `${p.SALE_MO2 || ''}/${sale2Year}`, year: sale2Year });

    const equityDollar = (jv > 0 && sale1Price > 100) ? jv - sale1Price : null;
    const equityPct = (jv > 0 && sale1Price > 100) ? Math.round((jv - sale1Price) / jv * 100) : null;

    prospects.push({
      address: phyAddr,
      city: (p.PHY_CITY || cityUp).replace(/_/g, ' '),
      zip: String(p.PHY_ZIPCD || ''),
      owner: name,
      ownerMailingAddress: {
        address: (p.OWN_ADDR1 || '').trim(),
        city: (p.OWN_CITY || '').trim(),
        state: ownState,
        zip: String(p.OWN_ZIPCD || '').trim()
      },
      value: jv,
      equityEstimate: equityDollar,
      equityPct,
      score,
      rating: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW',
      reasons,
      courtRecords: clerkHits.slice(0, 5),
      salesHistory: sales,
      property: {
        type: DOR_DESC[dor] || dor,
        typeCode: dor,
        yearBuilt: parseInt(p.EFF_YR_BLT || p.ACT_YR_BLT) || null,
        livingArea: parseInt(p.TOT_LVG_AR) || null,
        lotSize: parseInt(p.LND_SQFOOT) || null,
        buildings: parseInt(p.NO_BULDNG) || null,
        units: parseInt(p.NO_RES_UNT) || null
      },
      absentee,
      outOfState: oos,
      corporate: corp,
      homestead: hmstd > 0,
      bridgePageUrl: `https://title.rootz.global/p/farm?address=${encodeURIComponent(phyAddr)}&city=${encodeURIComponent((p.PHY_CITY || cityUp).replace(/_/g, ' '))}`
    });
  }

  prospects.sort((a, b) => b.score - a.score);
  const result = prospects.slice(0, limit);

  return {
    query: { city: cityUp, lat, lng, radius, signals: [...signalSet], minScore, limit },
    total: prospects.length,
    returned: result.length,
    summary: {
      high: prospects.filter(p => p.score >= 70).length,
      medium: prospects.filter(p => p.score >= 40 && p.score < 70).length,
      low: prospects.filter(p => p.score < 40).length
    },
    mapUrl: `https://title.rootz.global/farm/${cityUp.toLowerCase()}${signalSet.size ? '?signals=' + [...signalSet].join(',') : ''}`,
    prospects: result,
    source: {
      parcels: 'FL Department of Revenue (statewide)',
      courtRecords: 'Broward County Clerk of Courts (SFTP bulk)',
      coverage: '2024-2025 court filings + current DOR parcel data',
      provenance: 'Government source data with cryptographic hashing'
    }
  };
}

// ZIP lookup — scan first 100 lines of random city files to find which city contains this ZIP
function findCityFileByZip(zip, files) {
  // Common FL ZIP-to-city mappings for speed
  const ZIP_HINTS = {
    '33': ['FORT_LAUDERDALE', 'MIAMI', 'MIAMI_BEACH', 'HOLLYWOOD', 'CORAL_SPRINGS', 'PEMBROKE_PINES', 'POMPANO_BEACH', 'BOCA_RATON', 'DEERFIELD_BEACH', 'PLANTATION'],
    '34': ['ORLANDO', 'TAMPA', 'CLEARWATER', 'ST_PETERSBURG', 'LAKELAND', 'OCALA', 'PORT_CHARLOTTE'],
    '32': ['JACKSONVILLE', 'GAINESVILLE', 'TALLAHASSEE', 'DAYTONA_BEACH', 'ORLANDO'],
  };

  const prefix = zip.slice(0, 2);
  const hints = ZIP_HINTS[prefix] || [];

  // Check hint cities first
  for (const hint of hints) {
    const file = `${hint}.jsonl`;
    if (!files.includes(file)) continue;
    const filePath = path.join(CITIES_DIR, file);
    const sample = fs.readFileSync(filePath, 'utf-8').slice(0, 50000);
    if (sample.includes(`"PHY_ZIPCD":"${zip}"`)) return file;
  }

  // Brute force — check up to 20 files
  for (const file of files.slice(0, 20)) {
    const filePath = path.join(CITIES_DIR, file);
    const sample = fs.readFileSync(filePath, 'utf-8').slice(0, 50000);
    if (sample.includes(`"PHY_ZIPCD":"${zip}"`)) return file;
  }

  return null;
}
