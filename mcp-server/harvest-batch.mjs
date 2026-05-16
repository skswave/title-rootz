#!/usr/bin/env node
// Batch harvester — pulls all verified FL data endpoints
// Run: node harvest-batch.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PERMITS_DIR = path.join(__dirname, 'data', 'florida', 'permits');
const TAX_DIR = path.join(__dirname, 'data', 'florida', 'tax-delinquent');
const CE_DIR = path.join(__dirname, 'data', 'florida', 'code-enforcement');

fs.mkdirSync(PERMITS_DIR, { recursive: true });
fs.mkdirSync(TAX_DIR, { recursive: true });
fs.mkdirSync(CE_DIR, { recursive: true });

const results = {};

// ─── Generic ArcGIS puller ─────────────────────────────────────
async function pullArcGIS(url, outFile, label, opts = {}) {
  const { jsonl = false, maxRecords = 2000 } = opts;
  console.log(`\n[${label}] Pulling...`);
  const records = [];
  let offset = 0;
  let stream = jsonl ? fs.createWriteStream(outFile) : null;

  while (true) {
    const params = new URLSearchParams({
      where: '1=1', outFields: '*', returnGeometry: 'false',
      resultOffset: String(offset), resultRecordCount: String(maxRecords), f: 'json'
    });
    try {
      const r = await fetch(`${url}/query?${params}`, { signal: AbortSignal.timeout(60000) });
      const data = await r.json();
      if (data.error) { console.log(`  API error: ${data.error.message}`); break; }
      const features = data?.features || [];
      if (!features.length) break;

      for (const f of features) {
        if (jsonl) stream.write(JSON.stringify(f.attributes) + '\n');
        else records.push(f.attributes);
      }
      offset += features.length;
      if (offset % 50000 < maxRecords) console.log(`  [${label}] ${offset.toLocaleString()} records...`);
      if (!data.exceededTransferLimit) break;
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`  [${label}] Error at ${offset}: ${e.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (jsonl) { stream.end(); }
  else { fs.writeFileSync(outFile, JSON.stringify(records)); }

  const total = jsonl ? offset : records.length;
  const sizeMB = fs.existsSync(outFile) ? (fs.statSync(outFile).size / 1024 / 1024).toFixed(1) : '0';
  console.log(`  [${label}] DONE: ${total.toLocaleString()} records (${sizeMB} MB)`);
  return total;
}

// ─── PERMITS ───────────────────────────────────────────────────
async function harvestPermits() {
  // Leon County (Tallahassee) — Active permits
  results.leon_permits = await pullArcGIS(
    'https://intervector.leoncountyfl.gov/intervector/rest/services/MapServices/TLC_OverlayPermitsActive_D_WM/MapServer/0',
    path.join(PERMITS_DIR, 'leon-tallahassee-active.json'),
    'Leon/Tallahassee Active Permits'
  );

  // Charlotte County — Historical 2000-2016 (312K)
  results.charlotte_historical = await pullArcGIS(
    'https://agis3.charlottecountyfl.gov/arcgis/rest/services/Essentials/CCGISLayers/MapServer/75',
    path.join(PERMITS_DIR, 'charlotte-historical-2000-2016.jsonl'),
    'Charlotte Historical Permits',
    { jsonl: true }
  );

  // Charlotte County — New Construction (recent 6 months)
  results.charlotte_new = await pullArcGIS(
    'https://agis3.charlottecountyfl.gov/arcgis/rest/services/Essentials/CCGISLayers/MapServer/67',
    path.join(PERMITS_DIR, 'charlotte-new-construction.json'),
    'Charlotte New Construction'
  );
}

// ─── TAX DELINQUENT ────────────────────────────────────────────
async function harvestTaxDelinquent() {
  // Orange County CSV (structured, direct download)
  console.log('\n[Orange Tax Delinquent] Pulling CSV...');
  try {
    const url = 'https://www.octaxcol.com/assets/uploads/2025/06/List-of-Delinquent-Taxpayers-2024-April-17th-2025.csv';
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (r.ok) {
      const csv = await r.text();
      fs.writeFileSync(path.join(TAX_DIR, 'orange-county-delinquent-2024.csv'), csv);
      const lines = csv.split('\n').filter(l => l.trim()).length - 1;
      console.log(`  [Orange Tax] DONE: ${lines} records`);
      results.orange_tax = lines;
    } else {
      console.log(`  [Orange Tax] HTTP ${r.status}`);
    }
  } catch (e) { console.log(`  [Orange Tax] Error: ${e.message}`); }

  // Miami-Dade PDF (legal notice, needs PDF parsing later)
  console.log('\n[Miami-Dade Tax Delinquent] Pulling PDF...');
  try {
    const url = 'https://www.miamidade.gov/resources/legal-ads/county/tax-collector/2026/2026-05-13-public-notice-delinquent-property-taxes.pdf';
    const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(path.join(TAX_DIR, 'miami-dade-delinquent-2026.pdf'), buf);
      console.log(`  [Miami-Dade Tax] DONE: ${(buf.length / 1024 / 1024).toFixed(1)} MB PDF`);
      results.miami_dade_tax = buf.length;
    } else {
      console.log(`  [Miami-Dade Tax] HTTP ${r.status}`);
    }
  } catch (e) { console.log(`  [Miami-Dade Tax] Error: ${e.message}`); }

  // Orange County RE legal notice PDF (50 pages of property tax delinquents)
  console.log('\n[Orange RE Tax Notice] Pulling PDF...');
  try {
    const url = 'https://www.octaxcol.com/assets/uploads/2026/04/TPCOSA61382-95693_Orange-County-RE-Version-5_V5-1.pdf';
    const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(path.join(TAX_DIR, 'orange-county-re-notice-2026.pdf'), buf);
      console.log(`  [Orange RE Tax] DONE: ${(buf.length / 1024 / 1024).toFixed(1)} MB PDF`);
      results.orange_re_tax = buf.length;
    } else {
      console.log(`  [Orange RE Tax] HTTP ${r.status}`);
    }
  } catch (e) { console.log(`  [Orange RE Tax] Error: ${e.message}`); }
}

// ─── CODE ENFORCEMENT ──────────────────────────────────────────
async function harvestCodeEnforcement() {
  // Orlando (Socrata) — verify and pull full dataset
  console.log('\n[Orlando Code Enforcement] Pulling via Socrata...');
  try {
    let allRecords = [];
    let offset = 0;
    while (true) {
      const url = `https://data.cityoforlando.net/resource/gkak-3r2m.json?$limit=50000&$offset=${offset}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
      const data = await r.json();
      if (!data.length) break;
      allRecords.push(...data);
      offset += data.length;
      console.log(`  [Orlando CE] ${allRecords.length.toLocaleString()} records...`);
      if (data.length < 50000) break;
    }
    fs.writeFileSync(path.join(CE_DIR, 'orlando-code-enforcement.json'), JSON.stringify(allRecords));
    console.log(`  [Orlando CE] DONE: ${allRecords.length.toLocaleString()} records`);
    results.orlando_ce = allRecords.length;
  } catch (e) { console.log(`  [Orlando CE] Error: ${e.message}`); }

  // Miami — search open data hub for code enforcement
  console.log('\n[Miami Code Enforcement] Searching ArcGIS Hub...');
  try {
    // Try direct known endpoint patterns for Miami code enforcement
    const tryUrls = [
      'https://services.arcgis.com/5bSMCJWI1LJMVmyx/arcgis/rest/services/Code_Enforcement_Cases/FeatureServer/0',
      'https://gis-mdc.opendata.arcgis.com/api/v3/datasets?q=code+enforcement'
    ];
    for (const url of tryUrls) {
      try {
        const r = await fetch(url + (url.includes('FeatureServer') ? '?f=json' : ''), { signal: AbortSignal.timeout(15000) });
        if (r.ok) {
          const data = await r.json();
          if (data.name || data.data) {
            console.log(`  [Miami CE] Found:`, data.name || `${data.data?.length} datasets`);
            if (data.name) {
              // Try to pull it
              results.miami_ce = await pullArcGIS(url, path.join(CE_DIR, 'miami-code-enforcement.jsonl'), 'Miami CE', { jsonl: true });
            }
            break;
          }
        }
      } catch {}
    }
  } catch (e) { console.log(`  [Miami CE] Error: ${e.message}`); }

  // Tampa — search Socrata
  console.log('\n[Tampa Code Enforcement] Searching Socrata...');
  try {
    const searchUrl = 'https://opendata.tampa.gov/api/views.json';
    const r = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
    if (r.ok) {
      const datasets = await r.json();
      const ceDatasets = datasets.filter(d => /code.*(enforcement|violation)|violation.*code/i.test(d.name + ' ' + (d.description || '')));
      console.log(`  [Tampa] Found ${ceDatasets.length} code enforcement datasets`);
      for (const ds of ceDatasets.slice(0, 3)) {
        console.log(`    - ${ds.name} (id: ${ds.id})`);
        // Try to pull
        try {
          let records = [];
          let off = 0;
          while (true) {
            const dUrl = `https://opendata.tampa.gov/resource/${ds.id}.json?$limit=50000&$offset=${off}`;
            const dr = await fetch(dUrl, { signal: AbortSignal.timeout(30000) });
            const dData = await dr.json();
            if (!dData.length) break;
            records.push(...dData);
            off += dData.length;
            if (dData.length < 50000) break;
          }
          if (records.length > 0) {
            const outFile = path.join(CE_DIR, `tampa-${ds.id}.json`);
            fs.writeFileSync(outFile, JSON.stringify(records));
            console.log(`    Pulled: ${records.length.toLocaleString()} records`);
            results[`tampa_ce_${ds.id}`] = records.length;
          }
        } catch (e2) { console.log(`    Pull error: ${e2.message}`); }
      }
    }
  } catch (e) { console.log(`  [Tampa CE] Error: ${e.message}`); }

  // Jacksonville/Duval — search
  console.log('\n[Jacksonville Code Enforcement] Searching...');
  try {
    const jaxUrl = 'https://data.coj.net/api/views.json';
    const r = await fetch(jaxUrl, { signal: AbortSignal.timeout(15000) });
    if (r.ok) {
      const datasets = await r.json();
      const ceDatasets = datasets.filter(d => /code.*(enforcement|violation)|violation|unsafe/i.test(d.name + ' ' + (d.description || '')));
      console.log(`  [Jacksonville] Found ${ceDatasets.length} datasets`);
      for (const ds of ceDatasets.slice(0, 3)) {
        console.log(`    - ${ds.name} (id: ${ds.id})`);
        try {
          let records = [];
          let off = 0;
          while (true) {
            const dUrl = `https://data.coj.net/resource/${ds.id}.json?$limit=50000&$offset=${off}`;
            const dr = await fetch(dUrl, { signal: AbortSignal.timeout(30000) });
            const dData = await dr.json();
            if (!dData.length) break;
            records.push(...dData);
            off += dData.length;
            if (dData.length < 50000) break;
          }
          if (records.length > 0) {
            const outFile = path.join(CE_DIR, `jacksonville-${ds.id}.json`);
            fs.writeFileSync(outFile, JSON.stringify(records));
            console.log(`    Pulled: ${records.length.toLocaleString()} records`);
            results[`jax_ce_${ds.id}`] = records.length;
          }
        } catch (e2) { console.log(`    Pull error: ${e2.message}`); }
      }
    } else {
      console.log(`  [Jacksonville] data.coj.net returned ${r.status}`);
    }
  } catch (e) { console.log(`  [Jacksonville CE] Error: ${e.message}`); }
}

// ─── MAIN ──────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════');
console.log(' TITLE ROOTZ — BATCH DATA HARVEST');
console.log(' ' + new Date().toISOString());
console.log('═══════════════════════════════════════════════════');

const startTime = Date.now();

await harvestPermits();
await harvestTaxDelinquent();
await harvestCodeEnforcement();

const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
console.log('\n═══════════════════════════════════════════════════');
console.log(' HARVEST COMPLETE — ' + duration + ' minutes');
console.log('═══════════════════════════════════════════════════');
console.log(JSON.stringify(results, null, 2));

// Save results summary
fs.writeFileSync(path.join(__dirname, 'data', 'harvest-results.json'), JSON.stringify({
  timestamp: new Date().toISOString(),
  durationMin: parseFloat(duration),
  results
}, null, 2));
