#!/usr/bin/env node
// Pull federal data layers for Florida property intelligence
// FEMA NFIP, FHFA HPI, HUD FMR, Opportunity Zones, IRS SOI

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data', 'florida');

async function fetchJSON(url, timeout = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const text = await resp.text();
    try { return JSON.parse(text); } catch { return text; }
  } catch (e) {
    clearTimeout(timer);
    console.error(`  Fetch error: ${e.message}`);
    return null;
  }
}

function saveJSON(filename, data) {
  const outPath = path.join(DATA_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  const size = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`  Saved ${filename} (${size}MB)`);
}

// ─── 1. FEMA NFIP Flood Insurance Claims (Florida) ──────────────
async function pullFemaClaims() {
  console.log('\n1. FEMA NFIP Flood Insurance Claims (FL)...');
  // OpenFEMA API — no key needed
  const allClaims = [];
  let skip = 0;
  const limit = 1000;

  while (true) {
    const url = `https://www.fema.gov/api/open/v2/FimaNfipClaims?$filter=state eq 'FL'&$top=${limit}&$skip=${skip}&$select=yearOfLoss,countyCode,amountPaidOnBuildingClaim,amountPaidOnContentsClaim,totalBuildingInsuranceCoverage,floodZone,occupancyType,originalConstructionDate,originalNBDate,postFIRMConstructionIndicator,reportedZipCode,waterDepth,dateOfLoss`;

    const data = await fetchJSON(url);
    if (!data?.FimaNfipClaims?.length) break;

    allClaims.push(...data.FimaNfipClaims);
    skip += data.FimaNfipClaims.length;
    console.log(`  Claims: ${allClaims.length.toLocaleString()}`);

    if (data.FimaNfipClaims.length < limit) break;
    if (allClaims.length > 500000) { console.log('  Capped at 500K'); break; }
    await new Promise(r => setTimeout(r, 200));
  }

  if (allClaims.length > 0) saveJSON('federal-fema-nfip-claims.json', allClaims);
  return allClaims.length;
}

// ─── 2. FEMA Disaster Declarations (Florida) ────────────────────
async function pullFemaDisasters() {
  console.log('\n2. FEMA Disaster Declarations (FL)...');
  const url = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state eq 'FL'&$select=disasterNumber,declarationDate,disasterType,incidentType,title,incidentBeginDate,incidentEndDate,declaredCountyArea,designatedArea`;

  const data = await fetchJSON(url);
  if (data?.DisasterDeclarationsSummaries) {
    saveJSON('federal-fema-disasters.json', data.DisasterDeclarationsSummaries);
    console.log(`  ${data.DisasterDeclarationsSummaries.length} disaster declarations`);
    return data.DisasterDeclarationsSummaries.length;
  }
  return 0;
}

// ─── 3. FHFA House Price Index (FL metros) ──────────────────────
async function pullHPI() {
  console.log('\n3. FHFA House Price Index...');
  // Try the FHFA download
  const url = 'https://www.fhfa.gov/hpi/download/monthly/hpi_at_metro.csv';
  const resp = await fetch(url);
  if (resp.ok) {
    const csv = await resp.text();
    // Filter to FL metros
    const lines = csv.split('\n');
    const header = lines[0];
    const flLines = lines.filter(l => l.includes(',FL,') || l.includes('Miami') || l.includes('Tampa') || l.includes('Orlando') || l.includes('Jacksonville') || l.includes('Fort Lauderdale'));
    const filtered = [header, ...flLines].join('\n');
    fs.writeFileSync(path.join(DATA_DIR, 'federal-fhfa-hpi.csv'), filtered);
    console.log(`  ${flLines.length} FL metro HPI records`);
    return flLines.length;
  }
  console.log('  HPI download failed');
  return 0;
}

// ─── 4. HUD Fair Market Rents (FL counties) ─────────────────────
async function pullFMR() {
  console.log('\n4. HUD Fair Market Rents (FL)...');
  const url = 'https://www.huduser.gov/hudapi/public/fmr/statedata/12'; // FL FIPS = 12
  const data = await fetchJSON(url);
  if (data?.data) {
    saveJSON('federal-hud-fmr.json', data.data);
    console.log(`  ${Object.keys(data.data).length} FMR entries`);
    return Object.keys(data.data).length;
  }
  // Try alternate
  console.log('  HUD API may need token, trying catalog...');
  return 0;
}

// ─── 5. Opportunity Zones (FL) ──────────────────────────────────
async function pullOZ() {
  console.log('\n5. Opportunity Zones (FL)...');
  // HUD OZ data via ArcGIS
  const url = 'https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Opportunity_Zones/FeatureServer/0/query'
    + '?where=STATE%3D%2712%27&outFields=GEOID,STATE,COUNTY,TRACT,TYPE,ACS_YEAR,POPULATION,POVERTY_RATE,MEDHHINCOME'
    + '&returnGeometry=false&resultRecordCount=2000&f=json';

  const allZones = [];
  let offset = 0;
  while (true) {
    const pageUrl = url + `&resultOffset=${offset}`;
    const data = await fetchJSON(pageUrl);
    if (!data?.features?.length) break;
    for (const f of data.features) {
      allZones.push(f.attributes);
    }
    offset += data.features.length;
    if (data.features.length < 2000) break;
  }

  if (allZones.length > 0) {
    saveJSON('federal-opportunity-zones.json', allZones);
    console.log(`  ${allZones.length} opportunity zones in FL`);
  }
  return allZones.length;
}

// ─── 6. IRS SOI Income Data (by zip code) ───────────────────────
async function pullIRS() {
  console.log('\n6. IRS SOI Income Statistics...');
  // IRS SOI zip code data — large CSV download
  const url = 'https://www.irs.gov/pub/irs-soi/21zpallagi.csv'; // 2021 latest available
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (resp.ok) {
      const csv = await resp.text();
      const lines = csv.split('\n');
      const header = lines[0];
      // Filter to FL state code (STATEFIPS = 12)
      const flLines = lines.filter(l => l.startsWith('12,') || l.startsWith('"12"'));
      const filtered = [header, ...flLines].join('\n');
      fs.writeFileSync(path.join(DATA_DIR, 'federal-irs-soi-income.csv'), filtered);
      console.log(`  ${flLines.length} FL zip code income records`);
      return flLines.length;
    }
  } catch (e) {
    console.log(`  IRS download error: ${e.message}`);
  }
  return 0;
}

// ─── 7. EPA Brownfields ─────────────────────────────────────────
async function pullBrownfields() {
  console.log('\n7. EPA Brownfields (FL)...');
  const url = 'https://echodata.epa.gov/echo/echo_rest_services.get_facilities?output=JSON&p_st=FL&p_bf=Y';
  const data = await fetchJSON(url);
  if (data?.Results) {
    const qid = data.Results.QueryID;
    const count = data.Results.QueryRows;
    console.log(`  ${count} brownfield sites in FL (QueryID: ${qid})`);
    saveJSON('federal-epa-brownfields-query.json', data.Results);
    return parseInt(count) || 0;
  }
  return 0;
}

// ─── 8. FEMA NFIP Policies in Force (FL) ────────────────────────
async function pullNFIPPolicies() {
  console.log('\n8. FEMA NFIP Policies in Force (FL)...');
  const url = `https://www.fema.gov/api/open/v1/FimaNfipPolicies?$filter=policyState eq 'FL'&$top=1000&$select=policyCount,policyEffectiveDate,policyTerminationDate,censusTract,reportedZipCode,floodZone,occupancyType,originalConstructionDate,totalBuildingInsuranceCoverage,totalContentsInsuranceCoverage,crsClassCode&$orderby=policyEffectiveDate desc`;

  const data = await fetchJSON(url);
  if (data?.FimaNfipPolicies) {
    saveJSON('federal-fema-nfip-policies.json', data.FimaNfipPolicies);
    console.log(`  ${data.FimaNfipPolicies.length} NFIP policy records`);
    return data.FimaNfipPolicies.length;
  }
  return 0;
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('Federal Data Pull for Florida Property Intelligence');
  console.log(`Output: ${DATA_DIR}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const results = {};
  results.femaDisasters = await pullFemaDisasters();
  results.femaClaims = await pullFemaClaims();
  results.femaPolicies = await pullNFIPPolicies();
  results.hpi = await pullHPI();
  results.fmr = await pullFMR();
  results.opportunityZones = await pullOZ();
  results.irsSoi = await pullIRS();
  results.brownfields = await pullBrownfields();

  console.log('\n=== Federal Data Summary ===');
  for (const [k, v] of Object.entries(results)) {
    console.log(`  ${k}: ${v.toLocaleString()} records`);
  }

  // List federal files
  const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('federal-'));
  console.log('\nFederal data files:');
  let totalMB = 0;
  for (const f of files) {
    const size = fs.statSync(path.join(DATA_DIR, f)).size;
    totalMB += size / 1024 / 1024;
    console.log(`  ${f}: ${(size / 1024 / 1024).toFixed(1)}MB`);
  }
  console.log(`Total: ${totalMB.toFixed(1)}MB`);
}

main().catch(console.error);
