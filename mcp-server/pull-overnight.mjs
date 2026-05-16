#!/usr/bin/env node
// Overnight data pull — schools, census, FRED, FEMA, HPI, OZ
// Run on server: node pull-overnight.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data', 'florida');

function saveJSON(filename, data) {
  const outPath = path.join(DATA_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  const size = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`  ✓ Saved ${filename} (${size}MB, ${Array.isArray(data) ? data.length + ' records' : 'object'})`);
}

function saveCSV(filename, content) {
  const outPath = path.join(DATA_DIR, filename);
  fs.writeFileSync(outPath, content);
  const size = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  const lines = content.split('\n').length;
  console.log(`  ✓ Saved ${filename} (${size}MB, ${lines} lines)`);
}

// ═══════════════════════════════════════════════════════════════════
// 1. SCHOOLS — FL DOE via data.gov / ArcGIS
// ═══════════════════════════════════════════════════════════════════
async function pullSchools() {
  console.log('\n═══ 1. FL SCHOOLS ═══');

  // Try multiple sources
  const sources = [
    // NCES 2022-2023 public schools
    'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICSCH_2223/MapServer/0/query?where=LSTATE%3D%27FL%27&outFields=*&returnGeometry=true&resultRecordCount=2000&f=json',
    // HIFLD public schools
    'https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Public_Schools/FeatureServer/0/query?where=STATE%3D%27FL%27&outFields=*&returnGeometry=true&resultRecordCount=2000&f=json',
    // HIFLD private schools
    'https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Private_Schools/FeatureServer/0/query?where=STATE%3D%27FL%27&outFields=*&returnGeometry=true&resultRecordCount=2000&f=json',
  ];

  const allPublic = [];
  const allPrivate = [];

  // Try HIFLD public schools (Homeland Infrastructure Foundation-Level Data)
  console.log('  Trying HIFLD public schools...');
  let offset = 0;
  while (true) {
    try {
      const url = `https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Public_Schools/FeatureServer/0/query?where=STATE%3D%27FL%27&outFields=NAME,ADDRESS,CITY,STATE,ZIP,COUNTY,PHONE,TYPE,STATUS,POPULATION,LATITUDE,LONGITUDE,NAICS_CODE,ENROLLMENT,ST_GRADE,END_GRADE,SHELTER_ID&returnGeometry=false&resultRecordCount=2000&resultOffset=${offset}&f=json`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const data = await resp.json();
      if (!data.features?.length) break;
      for (const f of data.features) allPublic.push(f.attributes);
      offset += data.features.length;
      console.log(`    Public schools: ${allPublic.length}`);
      if (data.features.length < 2000) break;
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`    Error at offset ${offset}: ${e.message}`);
      break;
    }
  }

  // Try HIFLD private schools
  console.log('  Trying HIFLD private schools...');
  offset = 0;
  while (true) {
    try {
      const url = `https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Private_Schools/FeatureServer/0/query?where=STATE%3D%27FL%27&outFields=NAME,ADDRESS,CITY,STATE,ZIP,COUNTY,PHONE,TYPE,STATUS,POPULATION,LATITUDE,LONGITUDE,ENROLLMENT,ST_GRADE,END_GRADE&returnGeometry=false&resultRecordCount=2000&resultOffset=${offset}&f=json`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const data = await resp.json();
      if (!data.features?.length) break;
      for (const f of data.features) allPrivate.push(f.attributes);
      offset += data.features.length;
      console.log(`    Private schools: ${allPrivate.length}`);
      if (data.features.length < 2000) break;
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`    Error at offset ${offset}: ${e.message}`);
      break;
    }
  }

  if (allPublic.length > 0) saveJSON('statewide-schools-public.json', allPublic);
  if (allPrivate.length > 0) saveJSON('statewide-schools-private.json', allPrivate);
  return { public: allPublic.length, private: allPrivate.length };
}

// ═══════════════════════════════════════════════════════════════════
// 2. CENSUS — All FL block groups (ACS 5-year)
// ═══════════════════════════════════════════════════════════════════
async function pullCensus() {
  console.log('\n═══ 2. FL CENSUS BLOCK GROUPS ═══');
  const variables = [
    'B01003_001E', // population
    'B19013_001E', // median household income
    'B25077_001E', // median home value
    'B25064_001E', // median rent
    'B01002_001E', // median age
    'B19301_001E', // per capita income
    'B25002_001E', // total housing units
    'B25002_002E', // occupied
    'B25002_003E', // vacant
    'B25003_001E', // tenure total
    'B25003_002E', // owner occupied
    'B25035_001E', // median year built
    'B08301_001E', // total commuters
    'B08301_010E', // public transit
    'B15003_022E', // bachelor's degree
    'B15003_023E', // master's
    'B15003_025E', // doctorate
  ].join(',');

  const url = `https://api.census.gov/data/2022/acs/acs5?get=${variables}&for=block%20group:*&in=state:12&in=county:*`;
  console.log('  Fetching all FL block groups...');

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(120000) });
    const text = await resp.text();
    const data = JSON.parse(text);

    if (Array.isArray(data) && data.length > 1) {
      const headers = data[0];
      const records = data.slice(1).map(row => {
        const rec = {};
        headers.forEach((h, i) => { rec[h] = row[i]; });
        return rec;
      });
      saveJSON('statewide-census-blockgroups.json', records);
      return records.length;
    }
  } catch (e) {
    console.log(`  Census error: ${e.message}`);
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════════
// 3. FRED ECONOMICS — All FL metros
// ═══════════════════════════════════════════════════════════════════
async function pullFRED() {
  console.log('\n═══ 3. FRED ECONOMICS ═══');

  // FRED series IDs for FL metros (median listing price from Realtor.com via FRED)
  const metros = {
    'Miami': { fips: '33124', name: 'Miami-Fort Lauderdale-West Palm Beach' },
    'Tampa': { fips: '45300', name: 'Tampa-St. Petersburg-Clearwater' },
    'Orlando': { fips: '36740', name: 'Orlando-Kissimmee-Sanford' },
    'Jacksonville': { fips: '27260', name: 'Jacksonville' },
    'Fort_Myers': { fips: '15980', name: 'Cape Coral-Fort Myers' },
    'Sarasota': { fips: '35840', name: 'North Port-Sarasota-Bradenton' },
    'Lakeland': { fips: '29460', name: 'Lakeland-Winter Haven' },
    'Palm_Bay': { fips: '37340', name: 'Palm Bay-Melbourne-Titusville' },
    'Pensacola': { fips: '37860', name: 'Pensacola-Ferry Pass-Brent' },
    'Tallahassee': { fips: '45220', name: 'Tallahassee' },
    'Naples': { fips: '34940', name: 'Naples-Immokalee-Marco Island' },
    'Ocala': { fips: '36100', name: 'Ocala' },
    'Gainesville': { fips: '23540', name: 'Gainesville' },
  };

  // FRED series naming pattern: MEDLISPRI{FIPS} for median listing price
  const seriesTypes = {
    medianPrice: 'MEDLISPRI',
    activeListings: 'ACTLISCOU',
    daysOnMarket: 'MEDDAYONMAR',
    newListings: 'NEWLISCOU',
  };

  const results = {};

  for (const [metroKey, metro] of Object.entries(metros)) {
    console.log(`  ${metro.name}...`);
    results[metroKey] = { name: metro.name, fips: metro.fips, series: {} };

    for (const [seriesName, prefix] of Object.entries(seriesTypes)) {
      const seriesId = `${prefix}${metro.fips}`;
      try {
        const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=2023-01-01`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (resp.ok) {
          const csv = await resp.text();
          const lines = csv.trim().split('\n').slice(1); // skip header
          const data = lines.map(l => {
            const [date, value] = l.split(',');
            return { date, value: parseFloat(value) };
          }).filter(d => !isNaN(d.value));

          if (data.length > 0) {
            results[metroKey].series[seriesName] = {
              latest: data[data.length - 1],
              trend: data.slice(-12),
              count: data.length
            };
          }
        }
      } catch (e) {
        // skip failed series
      }
      await new Promise(r => setTimeout(r, 200)); // rate limit
    }

    const seriesCount = Object.keys(results[metroKey].series).length;
    console.log(`    ${seriesCount} series loaded`);
  }

  saveJSON('statewide-fred-economics.json', results);
  return Object.keys(results).length;
}

// ═══════════════════════════════════════════════════════════════════
// 4. FEMA NFIP CLAIMS — Full FL pull (paginated)
// ═══════════════════════════════════════════════════════════════════
async function pullFemaNFIP() {
  console.log('\n═══ 4. FEMA NFIP CLAIMS (FULL) ═══');
  const allClaims = [];
  let skip = 0;
  const batchSize = 1000;
  const maxRecords = 1000000; // safety cap

  while (skip < maxRecords) {
    try {
      const url = `https://www.fema.gov/api/open/v2/FimaNfipClaims?$filter=state eq 'FL'&$top=${batchSize}&$skip=${skip}&$select=yearOfLoss,countyCode,amountPaidOnBuildingClaim,amountPaidOnContentsClaim,floodZone,occupancyType,reportedZipCode,dateOfLoss,totalBuildingInsuranceCoverage,waterDepth,elevationDifference`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const data = await resp.json();
      const claims = data.FimaNfipClaims || [];
      if (claims.length === 0) break;

      allClaims.push(...claims);
      skip += claims.length;

      if (skip % 10000 < batchSize) {
        console.log(`  Claims: ${allClaims.length.toLocaleString()}`);
      }

      if (claims.length < batchSize) break;
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.log(`  Error at skip ${skip}: ${e.message}, retrying...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  if (allClaims.length > 0) {
    saveJSON('federal-fema-nfip-claims-full.json', allClaims);

    // Also build a zip code summary
    const zipSummary = {};
    for (const c of allClaims) {
      const zip = c.reportedZipCode || '?';
      if (!zipSummary[zip]) zipSummary[zip] = { count: 0, totalPaid: 0, years: [] };
      zipSummary[zip].count++;
      zipSummary[zip].totalPaid += (c.amountPaidOnBuildingClaim || 0) + (c.amountPaidOnContentsClaim || 0);
      if (c.yearOfLoss && !zipSummary[zip].years.includes(c.yearOfLoss)) {
        zipSummary[zip].years.push(c.yearOfLoss);
      }
    }
    saveJSON('federal-fema-nfip-by-zip.json', zipSummary);
  }

  return allClaims.length;
}

// ═══════════════════════════════════════════════════════════════════
// 5. FHFA HOUSE PRICE INDEX
// ═══════════════════════════════════════════════════════════════════
async function pullHPI() {
  console.log('\n═══ 5. FHFA HOUSE PRICE INDEX ═══');

  try {
    const url = 'https://www.fhfa.gov/hpi/download/monthly/hpi_at_metro.csv';
    const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!resp.ok) { console.log('  HPI download failed:', resp.status); return 0; }

    const csv = await resp.text();
    const lines = csv.split('\n');
    const header = lines[0];

    // FL metro names to match
    const flMetros = ['Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Fort Lauderdale',
      'West Palm', 'Cape Coral', 'Fort Myers', 'Sarasota', 'Lakeland', 'Deltona',
      'Palm Bay', 'Melbourne', 'Pensacola', 'Tallahassee', 'Naples', 'Ocala',
      'Gainesville', 'Port St. Lucie', 'Kissimmee', 'North Port', 'Bradenton',
      'Punta Gorda', 'Panama City', 'Crestview'];

    const flLines = lines.filter(line => {
      return flMetros.some(m => line.toLowerCase().includes(m.toLowerCase()));
    });

    if (flLines.length > 0) {
      saveCSV('federal-fhfa-hpi.csv', [header, ...flLines].join('\n'));
      console.log(`  ${flLines.length} FL metro HPI records`);
      return flLines.length;
    }
  } catch (e) {
    console.log(`  HPI error: ${e.message}`);
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════════
// 6. OPPORTUNITY ZONES
// ═══════════════════════════════════════════════════════════════════
async function pullOZ() {
  console.log('\n═══ 6. OPPORTUNITY ZONES ═══');

  // Try multiple ArcGIS endpoints
  const endpoints = [
    'https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Opportunity_Zones/FeatureServer/0/query',
    'https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Opportunity_Zones_2019/FeatureServer/0/query',
    'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Opportunity_Zones_2020/FeatureServer/0/query',
  ];

  for (const baseUrl of endpoints) {
    try {
      console.log(`  Trying: ${baseUrl.split('/rest/')[1]?.split('/query')[0] || baseUrl}`);
      const url = `${baseUrl}?where=STATE%3D'12'+OR+STATEFP%3D'12'+OR+STATE%3D'FL'&outFields=*&returnGeometry=false&resultRecordCount=1000&f=json`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const data = await resp.json();

      if (data.features?.length > 0) {
        const zones = data.features.map(f => f.attributes);
        // Paginate if needed
        let offset = zones.length;
        while (offset < 1000) {
          const nextUrl = `${baseUrl}?where=STATE%3D'12'+OR+STATEFP%3D'12'+OR+STATE%3D'FL'&outFields=*&returnGeometry=false&resultRecordCount=1000&resultOffset=${offset}&f=json`;
          const nextResp = await fetch(nextUrl, { signal: AbortSignal.timeout(15000) });
          const nextData = await nextResp.json();
          if (!nextData.features?.length) break;
          for (const f of nextData.features) zones.push(f.attributes);
          offset += nextData.features.length;
          if (nextData.features.length < 1000) break;
        }

        saveJSON('federal-opportunity-zones.json', zones);
        console.log(`  ${zones.length} opportunity zones`);
        return zones.length;
      }
    } catch (e) {
      console.log(`    Failed: ${e.message}`);
    }
  }

  // Fallback: download from HUD
  console.log('  Trying HUD download...');
  try {
    const url = 'https://hudgis-hud.opendata.arcgis.com/api/v3/datasets?q=opportunity+zones';
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const data = await resp.json();
    console.log(`  HUD search returned ${data.data?.length || 0} datasets`);
  } catch (e) {
    console.log(`  HUD fallback failed: ${e.message}`);
  }

  return 0;
}

// ═══════════════════════════════════════════════════════════════════
// 7. FEMA DISASTER DECLARATIONS — Full FL
// ═══════════════════════════════════════════════════════════════════
async function pullDisasters() {
  console.log('\n═══ 7. FEMA DISASTERS (FULL) ═══');
  const allDisasters = [];
  let skip = 0;

  while (true) {
    try {
      const url = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state eq 'FL'&$top=1000&$skip=${skip}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const data = await resp.json();
      const items = data.DisasterDeclarationsSummaries || [];
      if (items.length === 0) break;
      allDisasters.push(...items);
      skip += items.length;
      console.log(`  Disasters: ${allDisasters.length}`);
      if (items.length < 1000) break;
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.log(`  Error: ${e.message}`);
      break;
    }
  }

  if (allDisasters.length > 0) {
    saveJSON('federal-fema-disasters.json', allDisasters);

    // Build county summary
    const countySummary = {};
    for (const d of allDisasters) {
      const county = d.designatedArea || d.declaredCountyArea || '?';
      if (!countySummary[county]) countySummary[county] = { total: 0, types: {}, latest: null };
      countySummary[county].total++;
      const type = d.incidentType || '?';
      countySummary[county].types[type] = (countySummary[county].types[type] || 0) + 1;
      if (!countySummary[county].latest || d.declarationDate > countySummary[county].latest) {
        countySummary[county].latest = d.declarationDate;
      }
    }
    saveJSON('federal-fema-disasters-by-county.json', countySummary);
  }

  return allDisasters.length;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════
async function main() {
  const startTime = Date.now();
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  OVERNIGHT DATA COLLECTION — FLORIDA      ║');
  console.log('║  Origin Title Records                     ║');
  console.log(`║  Started: ${new Date().toISOString()}  ║`);
  console.log('╚════════════════════════════════════════════╝');

  const results = {};
  results.schools = await pullSchools();
  results.census = await pullCensus();
  results.fred = await pullFRED();
  results.femaClaims = await pullFemaNFIP();
  results.hpi = await pullHPI();
  results.oz = await pullOZ();
  results.disasters = await pullDisasters();

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  OVERNIGHT PULL COMPLETE                  ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`Time: ${elapsed} minutes`);
  console.log('\nResults:');
  for (const [k, v] of Object.entries(results)) {
    const display = typeof v === 'object' ? JSON.stringify(v) : v.toLocaleString();
    console.log(`  ${k}: ${display}`);
  }

  // List all data files
  console.log('\nAll data files:');
  const files = fs.readdirSync(DATA_DIR).filter(f => !f.startsWith('.'));
  let totalMB = 0;
  for (const f of files.sort()) {
    const fp = path.join(DATA_DIR, f);
    const stat = fs.statSync(fp);
    if (stat.isFile()) {
      const mb = stat.size / 1024 / 1024;
      totalMB += mb;
      if (mb > 0.1) console.log(`  ${f}: ${mb.toFixed(1)}MB`);
    }
  }
  console.log(`\nTotal data: ${totalMB.toFixed(0)}MB (${(totalMB / 1024).toFixed(1)}GB)`);

  // Disk check
  console.log('\nDisk:');
  const { execSync } = await import('child_process');
  console.log(execSync('df -h /var/www | tail -1').toString());
}

main().catch(console.error);
