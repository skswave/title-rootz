#!/usr/bin/env node
// Pull Florida Statewide Parcel Data from FL GIO Cadastral Service
// 10.8M parcels, 121 fields, free public ArcGIS REST service
// Uses OBJECTID pagination (not resultOffset) to avoid ArcGIS offset limits
// Supports resume — reads last OBJECTID from existing file

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';
const PAGE_SIZE = 2000;
const TOTAL_EXPECTED = 10834415;
const OUT_FILE = path.join(__dirname, 'data', 'florida', 'statewide-parcels.jsonl');

const FIELDS = [
  'OBJECTID', 'CO_NO', 'PARCEL_ID', 'DOR_UC', 'PA_UC',
  'JV', 'AV_SD', 'AV_NSD', 'TV_SD', 'TV_NSD',
  'JV_HMSTD', 'AV_HMSTD', 'JV_NON_HMS', 'AV_NON_HMS',
  'LND_VAL', 'LND_SQFOOT', 'NO_LND_UNT',
  'EFF_YR_BLT', 'ACT_YR_BLT', 'TOT_LVG_AR', 'NO_BULDNG', 'NO_RES_UNT',
  'IMP_QUAL', 'CONST_CLAS',
  'SALE_PRC1', 'SALE_YR1', 'SALE_MO1', 'OR_BOOK1', 'OR_PAGE1', 'QUAL_CD1', 'VI_CD1',
  'SALE_PRC2', 'SALE_YR2', 'SALE_MO2', 'OR_BOOK2', 'OR_PAGE2', 'QUAL_CD2', 'VI_CD2',
  'OWN_NAME', 'OWN_ADDR1', 'OWN_ADDR2', 'OWN_CITY', 'OWN_STATE', 'OWN_ZIPCD',
  'FIDU_NAME', 'FIDU_CD',
  'PHY_ADDR1', 'PHY_ADDR2', 'PHY_CITY', 'PHY_ZIPCD',
  'S_LEGAL', 'TWN', 'RNG', 'SEC', 'CENSUS_BK',
  'TAX_AUTH_C', 'NBRHD_CD', 'MKT_AR',
  'PREV_HMSTD', 'SPEC_FEAT_',
  'PARCELNO', 'STATE_PAR_'
].join(',');

async function fetchPage(lastOID) {
  const where = lastOID > 0 ? `OBJECTID>${lastOID}` : '1=1';
  const params = new URLSearchParams({
    where,
    outFields: FIELDS,
    returnGeometry: 'false',
    resultRecordCount: String(PAGE_SIZE),
    orderByFields: 'OBJECTID ASC',
    f: 'json'
  });

  const url = `${BASE_URL}?${params}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const resp = await fetch(url, { signal: controller.signal });
    const data = await resp.json();
    clearTimeout(timer);

    if (data.error) {
      console.error(`  API error after OID ${lastOID}:`, data.error.message);
      return null;
    }
    return data.features || [];
  } catch (e) {
    clearTimeout(timer);
    console.error(`  Fetch error after OID ${lastOID}: ${e.message}`);
    return null;
  }
}

function getLastOID() {
  if (!fs.existsSync(OUT_FILE)) return { oid: 0, count: 0 };

  // Read last line to get the last OBJECTID
  const stats = fs.statSync(OUT_FILE);
  const bufSize = Math.min(stats.size, 4096);
  const fd = fs.openSync(OUT_FILE, 'r');
  const buf = Buffer.alloc(bufSize);
  fs.readSync(fd, buf, 0, bufSize, stats.size - bufSize);
  fs.closeSync(fd);

  const lines = buf.toString().split('\n').filter(l => l.trim());
  const lastLine = lines[lines.length - 1];

  try {
    const rec = JSON.parse(lastLine);
    // Count lines efficiently with wc -l equivalent
    const content = fs.readFileSync(OUT_FILE, 'utf-8');
    const count = content.split('\n').filter(l => l.trim()).length;
    return { oid: rec.OBJECTID, count };
  } catch {
    return { oid: 0, count: 0 };
  }
}

async function main() {
  console.log('Florida Statewide Parcel Pull (OBJECTID pagination)');
  console.log(`Target: ~${(TOTAL_EXPECTED / 1e6).toFixed(1)}M parcels`);
  console.log(`Output: ${OUT_FILE}`);
  console.log(`Page size: ${PAGE_SIZE}`);
  console.log();

  // Resume support
  const { oid: startOID, count: lineCount } = getLastOID();
  if (startOID > 0) {
    console.log(`Resuming after OBJECTID ${startOID} (${lineCount.toLocaleString()} records on disk)`);
  }

  const stream = fs.createWriteStream(OUT_FILE, { flags: startOID > 0 ? 'a' : 'w' });
  let lastOID = startOID;
  let totalPulled = lineCount;
  let retries = 0;
  const maxRetries = 10;
  const startTime = Date.now();

  while (true) {
    const features = await fetchPage(lastOID);

    if (features === null) {
      retries++;
      if (retries > maxRetries) {
        console.error(`Max retries exceeded after OID ${lastOID}. Stopping — rerun to resume.`);
        break;
      }
      const wait = Math.min(retries * 5, 30);
      console.log(`  Retry ${retries}/${maxRetries} in ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }

    retries = 0;

    if (features.length === 0) {
      console.log(`No more records after OID ${lastOID}. Done!`);
      break;
    }

    // Write records
    for (const feat of features) {
      stream.write(JSON.stringify(feat.attributes) + '\n');
    }
    totalPulled += features.length;
    lastOID = features[features.length - 1].attributes.OBJECTID;

    // Progress every 20K records
    if (totalPulled % 20000 < PAGE_SIZE) {
      const pct = ((totalPulled / TOTAL_EXPECTED) * 100).toFixed(2);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const pulled = totalPulled - lineCount;
      const rate = pulled > 0 ? (pulled / ((Date.now() - startTime) / 1000)).toFixed(0) : '?';
      const remaining = TOTAL_EXPECTED - totalPulled;
      const eta = rate > 0 ? ((remaining / rate) / 3600).toFixed(1) : '?';

      const stats = fs.statSync(OUT_FILE);
      const sizeGB = (stats.size / 1024 / 1024 / 1024).toFixed(2);

      console.log(`  ${totalPulled.toLocaleString()} / ${TOTAL_EXPECTED.toLocaleString()} (${pct}%) | ${elapsed}s | ${rate} rec/s | ETA: ${eta}h | ${sizeGB}GB | OID: ${lastOID}`);
    }

    // Rate limit — be nice to the service
    await new Promise(r => setTimeout(r, 150));
  }

  stream.end();

  const finalSize = fs.existsSync(OUT_FILE) ? fs.statSync(OUT_FILE).size : 0;
  console.log(`\nComplete!`);
  console.log(`  Records: ${totalPulled.toLocaleString()}`);
  console.log(`  File size: ${(finalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`  Time: ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} minutes`);
}

main().catch(console.error);
