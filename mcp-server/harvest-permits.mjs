#!/usr/bin/env node
// Origin Harvest — Building Permit Recipes for Florida Counties
// Each county has a learned recipe: endpoint, field mapping, pagination, normalization
// Same model as Origin SEC IR harvest — learn once, repeat the pattern.
//
// Usage:
//   node harvest-permits.mjs --list                    # show all recipes
//   node harvest-permits.mjs --county miami-dade       # pull one county
//   node harvest-permits.mjs --county all              # pull all with recipes
//   node harvest-permits.mjs --test broward            # test recipe, 10 records
//   node harvest-permits.mjs --status                  # show last pull stats

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data', 'florida');
const RECIPE_FILE = path.join(__dirname, 'data', 'florida', 'permit-recipes.json');

// ═══════════════════════════════════════════════════════════════════
// COUNTY PERMIT RECIPES
// Each recipe defines: endpoint, field mapping, pagination, normalization
// Status: active = tested & working, draft = needs testing, blocked = no API
// ═══════════════════════════════════════════════════════════════════

const RECIPES = {

  // ─── MIAMI-DADE COUNTY (unincorporated) ────────────────────────
  'miami-dade-county': {
    status: 'active',
    name: 'Miami-Dade County',
    type: 'arcgis',
    endpoint: 'https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/BuildingPermit_gdb/FeatureServer/0',
    pagination: { method: 'offset', batchSize: 2000, delay: 300 },
    fields: {
      permitNumber: 'PROCNUM',
      address: ['STNDADDR', 'ADDRESS'],
      folio: ['FOLIO', 'GEOFOLIO'],
      type: 'TYPE',
      description: 'DESC1',
      description2: 'DESC2',
      status: 'BPSTATUS',
      resComm: 'RESCOMM',
      estimatedValue: 'ESTVALUE',
      contractor: 'CONTRNAME',
      contractorNum: 'CONTRNUM',
      issueDate: { field: 'ISSUDATE', format: 'epoch_ms' },
      completionDate: { field: 'BLDCMPDT', format: 'YYYYMMDD', nullValue: '00000000' },
      propertyUse: 'PROPUSE'
    },
    outputFile: 'building-permits.json',
    lastPull: null,
    recordCount: 262019,
    refresh: 'weekly'
  },

  // ─── CITY OF MIAMI ─────────────────────────────────────────────
  'miami-city': {
    status: 'active',
    name: 'City of Miami',
    type: 'arcgis',
    endpoint: 'https://services1.arcgis.com/CvuPhqcTQpZPT9qY/arcgis/rest/services/Building_Permits_Since_2014/FeatureServer/0',
    pagination: { method: 'offset', batchSize: 2000, delay: 300 },
    fields: {
      permitNumber: 'PROCNUM',
      address: ['STNDADDR', 'ADDRESS'],
      folio: { field: 'FolioNumber', transform: 'padStart13' },
      type: 'TYPE',
      description: 'DESC1',
      status: 'BPSTATUS',
      resComm: 'RESCOMM',
      estimatedValue: 'ESTVALUE',
      contractor: 'CONTRNAME',
      issueDate: { field: 'ISSUDATE', format: 'epoch_ms' }
    },
    outputFile: 'miami-city-permits.json',
    lastPull: null,
    recordCount: 219931,
    refresh: 'weekly'
  },

  // ─── FORT LAUDERDALE (Broward) ─────────────────────────────────
  'fort-lauderdale': {
    status: 'draft',
    name: 'Fort Lauderdale (Broward County)',
    type: 'arcgis',
    endpoint: 'https://gis.fortlauderdale.gov/arcgis/rest/services/BuildingPermitTracker/BuildingPermitTracker/MapServer/0',
    pagination: { method: 'offset', batchSize: 2000, delay: 300 },
    fields: {
      // Field mapping TBD — needs test pull to discover field names
      permitNumber: null,
      address: null,
      folio: null,
      type: null,
      description: null,
      status: null,
      issueDate: null
    },
    outputFile: 'broward-fort-lauderdale-permits.json',
    lastPull: null,
    recordCount: null,
    refresh: 'weekly',
    notes: 'City of Fort Lauderdale only, not all Broward. Need to discover field names.'
  },

  // ─── PINELLAS COUNTY ───────────────────────────────────────────
  'pinellas': {
    status: 'draft',
    name: 'Pinellas County',
    type: 'arcgis',
    endpoint: 'http://egis.pinellascounty.org/arcgis/rest/services/Accela/',
    pagination: { method: 'offset', batchSize: 2000, delay: 300 },
    fields: {},
    outputFile: 'pinellas-permits.json',
    lastPull: null,
    recordCount: null,
    refresh: 'weekly',
    notes: 'Accela folder in ArcGIS REST. Need to explore layers within this service.'
  },

  // ─── PALM BAY (Brevard County) ─────────────────────────────────
  'palm-bay': {
    status: 'draft',
    name: 'Palm Bay (Brevard County)',
    type: 'arcgis',
    endpoint: 'https://gis.palmbayflorida.org/arcgis/rest/services/GrowthManagement/BuildingPermits/FeatureServer/0',
    pagination: { method: 'offset', batchSize: 2000, delay: 300 },
    fields: {},
    outputFile: 'brevard-palm-bay-permits.json',
    lastPull: null,
    recordCount: null,
    refresh: 'weekly',
    notes: 'Model endpoint — well-structured ArcGIS FeatureServer for building permits.'
  },

  // ─── BLOCKED COUNTIES (web portal only, no API) ────────────────
  'palm-beach': {
    status: 'blocked',
    name: 'Palm Beach County',
    type: 'web_portal',
    endpoint: 'https://pbcgov.org/PermitPortal',
    system: 'Custom + Accela (municipal)',
    notes: 'No public API. Login required. Municipalities use Accela/Tyler separately.',
    workaround: 'Puppeteer scrape of individual permit lookups by folio'
  },

  'orange': {
    status: 'blocked',
    name: 'Orange County (Orlando)',
    type: 'web_portal',
    endpoint: 'https://fasttrack.ocfl.net',
    system: 'OC FastTrack (custom)',
    notes: 'Web search only. Orlando publishes downloadable data separately.',
    workaround: 'Orlando CSV download at orlando.gov/Building-Development/Permits-Inspections',
    downloadUrl: 'https://data.cityoforlando.net/api/views/XXXXX/rows.csv?accessType=DOWNLOAD'
  },

  'hillsborough': {
    status: 'blocked',
    name: 'Hillsborough County (Tampa)',
    type: 'accela',
    endpoint: 'https://aca-prod.accela.com/HCFL/',
    system: 'Accela',
    notes: 'Accela web portal. Tampa has separate Accela instance.',
    workaround: 'Puppeteer the Accela search page — same ASP.NET pattern as masslandrecords'
  },

  'duval': {
    status: 'blocked',
    name: 'Duval County (Jacksonville)',
    type: 'web_portal',
    endpoint: 'https://jaxepics.coj.net',
    system: 'JaxEPICS (custom)',
    notes: 'Custom COJ system. No public API.',
    workaround: 'Puppeteer scrape'
  },

  'lee': {
    status: 'blocked',
    name: 'Lee County (Fort Myers)',
    type: 'accela',
    endpoint: 'https://aca-prod.accela.com/LEECO/',
    system: 'Accela',
    notes: 'Accela web portal. Fort Myers city uses Tyler EnerGov separately.'
  },

  'marion': {
    status: 'blocked',
    name: 'Marion County (Ocala)',
    type: 'tyler',
    endpoint: 'https://marionfl.org/CivicAccess',
    system: 'Tyler Civic Access (launched Nov 2025, previously Accela)',
    notes: 'New Tyler system. Legacy CDPlus still available for lookups.',
    legacyEndpoint: 'https://bcc.marionfl.org/cdplus/'
  },

  'volusia': {
    status: 'blocked',
    name: 'Volusia County (Daytona)',
    type: 'web_portal',
    endpoint: 'https://connectlivepermits.org',
    system: 'Connect Live',
    notes: 'Custom system. Municipalities use mixed Accela/Tyler.'
  },

  'sarasota': {
    status: 'blocked',
    name: 'Sarasota County',
    type: 'accela',
    endpoint: 'https://building.scgov.net',
    system: 'Accela',
    notes: 'Accela web search portal.'
  }
};

// ═══════════════════════════════════════════════════════════════════
// GENERIC ARCGIS PULLER
// ═══════════════════════════════════════════════════════════════════

async function pullArcGIS(recipe, testOnly = false) {
  const { endpoint, pagination, name } = recipe;
  const limit = testOnly ? 10 : null;
  const allRecords = [];
  let offset = 0;
  let retries = 0;

  console.log(`  Pulling ${name} from ${endpoint.split('/rest/')[1]?.split('/query')[0] || endpoint}`);

  while (true) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      outSR: '4326',
      resultOffset: String(offset),
      resultRecordCount: String(pagination.batchSize),
      f: 'json'
    });

    try {
      const resp = await fetch(`${endpoint}/query?${params}`, {
        signal: AbortSignal.timeout(30000)
      });
      const data = await resp.json();

      if (data.error) {
        console.log(`  Error: ${data.error.message}`);
        break;
      }

      const features = data.features || [];
      if (features.length === 0) break;

      for (const f of features) {
        const rec = { ...f.attributes };
        if (f.geometry) {
          rec._lat = f.geometry.y;
          rec._lng = f.geometry.x;
        }
        allRecords.push(rec);
      }

      offset += features.length;
      retries = 0;

      if (testOnly && allRecords.length >= limit) break;

      if (offset % 20000 < pagination.batchSize) {
        console.log(`    ${allRecords.length.toLocaleString()} records...`);
      }

      if (!data.exceededTransferLimit && features.length < pagination.batchSize) break;
      await new Promise(r => setTimeout(r, pagination.delay));

    } catch (e) {
      retries++;
      if (retries > 3) {
        console.log(`  Max retries at offset ${offset}`);
        break;
      }
      console.log(`  Retry ${retries}/3: ${e.message}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  return allRecords;
}

// ═══════════════════════════════════════════════════════════════════
// RECIPE DISCOVERY — Test an endpoint and discover field names
// ═══════════════════════════════════════════════════════════════════

async function discoverFields(recipe) {
  console.log(`\nDiscovering fields for ${recipe.name}...`);

  // Get layer metadata
  try {
    const resp = await fetch(`${recipe.endpoint}?f=json`, { signal: AbortSignal.timeout(15000) });
    const meta = await resp.json();

    if (meta.fields) {
      console.log(`  Fields (${meta.fields.length}):`);
      for (const f of meta.fields) {
        console.log(`    ${f.name} (${f.type}) ${f.alias || ''}`);
      }
    }

    if (meta.name) console.log(`  Layer name: ${meta.name}`);
    if (meta.description) console.log(`  Description: ${meta.description}`);

    // Also get a sample record
    const records = await pullArcGIS(recipe, true);
    if (records.length > 0) {
      console.log(`\n  Sample record (${Object.keys(records[0]).length} fields):`);
      for (const [k, v] of Object.entries(records[0])) {
        if (v !== null && v !== '' && v !== 0) {
          console.log(`    ${k}: ${String(v).substring(0, 80)}`);
        }
      }
    }

    return { fields: meta.fields, sample: records[0] };
  } catch (e) {
    console.log(`  Discovery failed: ${e.message}`);

    // Try as MapServer (not FeatureServer)
    if (recipe.endpoint.includes('MapServer')) {
      console.log('  Trying MapServer query...');
      const records = await pullArcGIS(recipe, true);
      if (records.length > 0) {
        console.log(`  Sample record:`);
        for (const [k, v] of Object.entries(records[0])) {
          if (v !== null && v !== '') console.log(`    ${k}: ${String(v).substring(0, 80)}`);
        }
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CLI
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const target = args[1];

  if (cmd === '--list') {
    console.log('\nFL County Permit Recipes:');
    console.log('─'.repeat(80));
    for (const [id, r] of Object.entries(RECIPES)) {
      const status = r.status === 'active' ? '✓ ACTIVE' :
                     r.status === 'draft' ? '⟳ DRAFT' :
                     '✗ BLOCKED';
      const count = r.recordCount ? `${r.recordCount.toLocaleString()} records` : '—';
      console.log(`  ${status.padEnd(12)} ${id.padEnd(25)} ${r.name.padEnd(35)} ${count}`);
    }
    console.log(`\nActive: ${Object.values(RECIPES).filter(r => r.status === 'active').length}`);
    console.log(`Draft:  ${Object.values(RECIPES).filter(r => r.status === 'draft').length}`);
    console.log(`Blocked: ${Object.values(RECIPES).filter(r => r.status === 'blocked').length}`);
    return;
  }

  if (cmd === '--test' && target) {
    const recipe = RECIPES[target];
    if (!recipe) { console.log(`Recipe not found: ${target}`); return; }
    if (recipe.status === 'blocked') {
      console.log(`${recipe.name} is BLOCKED — ${recipe.system || recipe.type}`);
      console.log(`  Endpoint: ${recipe.endpoint}`);
      console.log(`  Notes: ${recipe.notes}`);
      if (recipe.workaround) console.log(`  Workaround: ${recipe.workaround}`);
      return;
    }
    await discoverFields(recipe);
    return;
  }

  if (cmd === '--discover' && target) {
    const recipe = RECIPES[target];
    if (!recipe) { console.log(`Recipe not found: ${target}`); return; }
    await discoverFields(recipe);
    return;
  }

  if (cmd === '--county' && target) {
    const recipesToPull = target === 'all'
      ? Object.entries(RECIPES).filter(([, r]) => r.status === 'active' && r.type === 'arcgis')
      : [[target, RECIPES[target]]];

    for (const [id, recipe] of recipesToPull) {
      if (!recipe) { console.log(`Recipe not found: ${id}`); continue; }
      if (recipe.status === 'blocked') { console.log(`Skipping ${recipe.name} (blocked)`); continue; }

      console.log(`\nPulling: ${recipe.name}`);
      const records = await pullArcGIS(recipe);
      if (records.length > 0) {
        const outPath = path.join(DATA_DIR, recipe.outputFile);
        fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
        const size = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
        console.log(`  Saved: ${recipe.outputFile} (${records.length.toLocaleString()} records, ${size}MB)`);

        // Update recipe metadata
        recipe.lastPull = new Date().toISOString();
        recipe.recordCount = records.length;
      }
    }

    // Save updated recipe metadata
    const meta = {};
    for (const [id, r] of Object.entries(RECIPES)) {
      meta[id] = { status: r.status, name: r.name, lastPull: r.lastPull, recordCount: r.recordCount, type: r.type };
    }
    fs.writeFileSync(RECIPE_FILE, JSON.stringify(meta, null, 2));
    console.log('\nRecipe metadata saved.');
    return;
  }

  if (cmd === '--status') {
    if (fs.existsSync(RECIPE_FILE)) {
      const meta = JSON.parse(fs.readFileSync(RECIPE_FILE, 'utf-8'));
      console.log('\nPermit Harvest Status:');
      for (const [id, m] of Object.entries(meta)) {
        console.log(`  ${id}: ${m.recordCount?.toLocaleString() || '—'} records, last pull: ${m.lastPull || 'never'}`);
      }
    } else {
      console.log('No harvest metadata yet. Run --county to pull data.');
    }
    return;
  }

  // Default: show help
  console.log(`
Origin Harvest — Building Permit Recipes

Usage:
  node harvest-permits.mjs --list                  Show all recipes
  node harvest-permits.mjs --test {county}         Test recipe, discover fields
  node harvest-permits.mjs --discover {county}     Discover endpoint field names
  node harvest-permits.mjs --county {county}       Pull permits for one county
  node harvest-permits.mjs --county all            Pull all active counties
  node harvest-permits.mjs --status                Show last pull stats

Counties: ${Object.keys(RECIPES).join(', ')}
  `);
}

main().catch(console.error);
