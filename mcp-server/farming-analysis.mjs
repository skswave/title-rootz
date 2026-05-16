#!/usr/bin/env node
// Farming Signal Analysis — Analyze any FL city for real estate farming prospects
//
// Usage:
//   node farming-analysis.mjs --city CORAL_SPRINGS
//   node farming-analysis.mjs --city FORT_LAUDERDALE --top 20
//   node farming-analysis.mjs --city NAPLES --signals absentee,corporate
//   node farming-analysis.mjs --list                    # show top cities by parcel count
//   node farming-analysis.mjs --statewide               # summary across all cities

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CITIES_DIR = path.join(__dirname, 'data', 'florida', 'cities');
const INDEX_FILE = path.join(CITIES_DIR, '_index.json');

// ═══════════════════════════════════════════════════════════════════
// FARMING SIGNAL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

function detectSignals(d) {
  const signals = [];
  const name = (d.OWN_NAME || '').toUpperCase();
  const ownAddr = (d.OWN_ADDR1 || '').trim().toUpperCase();
  const phyAddr = (d.PHY_ADDR1 || '').trim().toUpperCase();
  const ownState = (d.OWN_STATE || '').trim().toUpperCase();
  const saleYr = parseInt(d.SALE_YR1) || 0;
  const salePrice = parseInt(d.SALE_PRC1) || 0;
  const justValue = parseInt(d.JV) || 0;
  const hmstd = parseInt(d.AV_HMSTD) || 0;
  const prevHmstd = parseInt(d.PREV_HMSTD) || 0;
  const livingArea = parseInt(d.TOT_LVG_AR) || 0;
  const fiduCd = parseInt(d.FIDU_CD) || 0;

  // Absentee owner
  if (ownAddr && phyAddr && ownAddr !== phyAddr) {
    signals.push('absentee');
  }

  // Out-of-state owner (full state name, not abbreviation)
  if (ownState && ownState !== 'FLORIDA' && ownState !== 'FL' && ownState !== '') {
    signals.push('out_of_state');
  }

  // Corporate/LLC owner
  const corpKeywords = ['LLC', 'CORP', 'INC ', 'INC.', 'L.L.C', 'LIMITED', 'HOLDINGS',
    'PROPERTIES', 'INVESTMENTS', 'PARTNERS', 'GROUP', 'VENTURES', 'CAPITAL', 'REALTY',
    'MANAGEMENT', 'ASSOCIATES', 'ENTERPRISES', 'COMPANY'];
  if (corpKeywords.some(kw => name.includes(kw))) {
    signals.push('corporate');
  }

  // Trust/estate owner
  if (fiduCd > 0 || ['TRUST', 'ESTATE', 'TRUSTEE', 'REVOCABLE', 'IRREVOCABLE', 'LIVING TRUST',
    'FAMILY TRUST', 'GUARDIAN'].some(kw => name.includes(kw))) {
    signals.push('trust_estate');
  }

  // Long-term owner (15+ years)
  if (saleYr > 0 && saleYr <= 2011) {
    signals.push('long_term');
  }

  // High equity (market value > 2x purchase price, min $50K gain)
  if (justValue > 0 && salePrice > 1000 && justValue > salePrice * 2 && (justValue - salePrice) > 50000) {
    signals.push('high_equity');
  }

  // Nominal transfer ($0-100 sale = estate/gift transfer)
  if (salePrice > 0 && salePrice <= 100) {
    signals.push('nominal_transfer');
  }

  // No homestead (not primary residence)
  if (hmstd === 0) {
    signals.push('no_homestead');
  }

  // Vacant lot
  if (livingArea === 0) {
    signals.push('vacant');
  }

  // Previous homestead removed (owner moved away)
  if (prevHmstd > 0) {
    signals.push('homestead_removed');
  }

  return signals;
}

// ═══════════════════════════════════════════════════════════════════
// ANALYZE A CITY
// ═══════════════════════════════════════════════════════════════════

function analyzeCity(cityName) {
  const file = path.join(CITIES_DIR, `${cityName}.jsonl`);
  if (!fs.existsSync(file)) {
    // Try FL_CITY_OF_ prefix
    const altFile = path.join(CITIES_DIR, `FL_CITY_OF_${cityName}.jsonl`);
    if (!fs.existsSync(altFile)) {
      console.error(`City file not found: ${cityName}`);
      return null;
    }
  }

  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(l => l.trim());
  const stats = {
    total: 0,
    signals: {},
    multiSignal: { '2+': 0, '3+': 0, '4+': 0, '5+': 0 },
    topProspects: []
  };

  for (const line of lines) {
    try {
      const d = JSON.parse(line);
      stats.total++;
      const sigs = detectSignals(d);

      for (const s of sigs) {
        stats.signals[s] = (stats.signals[s] || 0) + 1;
      }

      if (sigs.length >= 2) stats.multiSignal['2+']++;
      if (sigs.length >= 3) stats.multiSignal['3+']++;
      if (sigs.length >= 4) stats.multiSignal['4+']++;
      if (sigs.length >= 5) stats.multiSignal['5+']++;

      // Track top prospects (4+ signals)
      if (sigs.length >= 4 && stats.topProspects.length < 100) {
        stats.topProspects.push({
          address: `${d.PHY_ADDR1 || '?'}, ${d.PHY_CITY || cityName}`,
          owner: d.OWN_NAME || '?',
          ownerCity: `${d.OWN_CITY || '?'}, ${d.OWN_STATE || '?'}`,
          value: parseInt(d.JV) || 0,
          lastSale: `${d.SALE_YR1 || '?'} @ $${(parseInt(d.SALE_PRC1) || 0).toLocaleString()}`,
          signals: sigs,
          signalCount: sigs.length
        });
      }
    } catch (e) { }
  }

  return stats;
}

// ═══════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes('--list')) {
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const sorted = index.filter(c => c.count > 1000).sort((a, b) => b.count - a.count);
  console.log('\nTop FL Cities by Parcel Count:\n');
  for (const c of sorted.slice(0, 40)) {
    console.log(`  ${c.city.padEnd(30)} ${c.count.toLocaleString().padStart(10)} parcels`);
  }
  console.log(`\n  Total real cities (>1K parcels): ${sorted.length}`);
  console.log(`  Total FL parcels: ${index.reduce((s, c) => s + c.count, 0).toLocaleString()}`);
  process.exit(0);
}

const cityIdx = args.indexOf('--city');
if (cityIdx === -1) {
  console.log('Usage:');
  console.log('  node farming-analysis.mjs --city CORAL_SPRINGS');
  console.log('  node farming-analysis.mjs --city FORT_LAUDERDALE --top 20');
  console.log('  node farming-analysis.mjs --list');
  process.exit(0);
}

const city = args[cityIdx + 1].toUpperCase().replace(/ /g, '_');
const topN = parseInt(args[args.indexOf('--top') + 1]) || 10;

console.log(`\nAnalyzing ${city}...`);
const stats = analyzeCity(city);

if (!stats) process.exit(1);

console.log(`\n${'═'.repeat(60)}`);
console.log(`  FARMING SIGNAL ANALYSIS: ${city}`);
console.log(`${'═'.repeat(60)}`);
console.log(`\n  Total parcels: ${stats.total.toLocaleString()}\n`);

console.log('  Signals:');
const sigOrder = ['absentee', 'out_of_state', 'corporate', 'trust_estate', 'long_term',
  'high_equity', 'nominal_transfer', 'no_homestead', 'vacant', 'homestead_removed'];
for (const s of sigOrder) {
  const count = stats.signals[s] || 0;
  const pct = ((count / stats.total) * 100).toFixed(1);
  const bar = '#'.repeat(Math.floor(pct / 2));
  console.log(`    ${s.padEnd(22)} ${count.toLocaleString().padStart(8)} (${pct.padStart(5)}%) ${bar}`);
}

console.log('\n  Multi-signal prospects:');
for (const [k, v] of Object.entries(stats.multiSignal)) {
  console.log(`    ${k.padEnd(5)} signals: ${v.toLocaleString().padStart(8)} (${((v / stats.total) * 100).toFixed(1)}%)`);
}

if (stats.topProspects.length > 0) {
  console.log(`\n  Top ${Math.min(topN, stats.topProspects.length)} Farming Targets (${stats.topProspects[0].signalCount}+ signals):\n`);
  const sorted = stats.topProspects.sort((a, b) => b.signalCount - a.signalCount || b.value - a.value);
  for (const p of sorted.slice(0, topN)) {
    console.log(`    ${p.address}`);
    console.log(`      Owner: ${p.owner} (${p.ownerCity})`);
    console.log(`      Value: $${p.value.toLocaleString()} | Last sale: ${p.lastSale}`);
    console.log(`      Signals (${p.signalCount}): ${p.signals.join(', ')}`);
    console.log();
  }
}
