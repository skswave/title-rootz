#!/usr/bin/env node
// Origin Harvest — Accela Bulk Permit Crawler (Playwright/headless)
// Systematically crawls all permits from Accela ACA portals
// Strategy: Iterate through common street names from statewide parcel data
// to build complete permit coverage for a county
//
// Usage:
//   node harvest-accela-bulk.mjs --agency HCFL                    # crawl all
//   node harvest-accela-bulk.mjs --agency HCFL --resume           # resume from checkpoint
//   node harvest-accela-bulk.mjs --agency HCFL --streets 50       # first 50 streets only

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data', 'florida');
const CITIES_DIR = path.join(DATA_DIR, 'cities');

const AGENCIES = {
  'HCFL': {
    name: 'Hillsborough County',
    searchUrl: 'https://aca-prod.accela.com/HCFL/Cap/CapHome.aspx?module=Building',
    streetField: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSStreetName',
    numberField: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSNumber_ChildControl0',
    searchButton: '#ctl00_PlaceHolderMain_btnNewSearch',
    cities: ['TAMPA', 'PLANT_CITY', 'TEMPLE_TERRACE'],
    outputFile: 'accela-hillsborough-permits.json'
  },
  'tampa': {
    name: 'City of Tampa',
    searchUrl: 'https://aca-prod.accela.com/tampa/Cap/CapHome.aspx?module=Building',
    streetField: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSStreetName',
    numberField: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSNumber_ChildControl0',
    searchButton: '#ctl00_PlaceHolderMain_btnNewSearch',
    cities: ['TAMPA'],
    outputFile: 'accela-tampa-permits.json'
  },
  'LEECO': {
    name: 'Lee County',
    searchUrl: 'https://aca-prod.accela.com/LEECO/Cap/CapHome.aspx?module=Building',
    streetField: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSStreetName',
    numberField: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSNumber_ChildControl0',
    searchButton: '#ctl00_PlaceHolderMain_btnNewSearch',
    cities: ['FORT_MYERS', 'CAPE_CORAL', 'LEHIGH_ACRES', 'BONITA_SPRINGS'],
    outputFile: 'accela-lee-permits.json'
  },
  'PINELLAS': {
    name: 'Pinellas County',
    searchUrl: 'https://aca-prod.accela.com/PINELLAS/Cap/CapHome.aspx?module=Building',
    streetField: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSStreetName',
    numberField: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSNumber_ChildControl0',
    searchButton: '#ctl00_PlaceHolderMain_btnNewSearch',
    cities: ['ST_PETERSBURG', 'CLEARWATER', 'LARGO', 'PINELLAS_PARK'],
    outputFile: 'accela-pinellas-permits.json'
  }
};

// ─── Extract top street names from statewide parcel data ─────────
function getTopStreets(cityCodes, maxStreets = 200) {
  const streetCounts = {};

  for (const cityCode of cityCodes) {
    const cityFile = path.join(CITIES_DIR, `${cityCode}.jsonl`);
    if (!fs.existsSync(cityFile)) {
      console.log(`  City file not found: ${cityCode}.jsonl`);
      continue;
    }

    const lines = fs.readFileSync(cityFile, 'utf-8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const rec = JSON.parse(line);
        const addr = rec.PHY_ADDR1 || '';
        // Extract street name (remove house number)
        const match = addr.match(/^\d+\s+(.+)$/);
        if (match) {
          // Normalize: remove unit/apt, take first 3 words of street
          let street = match[1].trim().toUpperCase();
          street = street.replace(/\s+(APT|UNIT|STE|BLDG|FL|#).*$/i, '').trim();
          // Keep directional prefix — Accela needs "N DALE MABRY" not just "DALE MABRY"
          // Only strip trailing suffix like HWY, AVE, ST, etc. for dedup, but keep full name for search
          if (street.length >= 3) {
            streetCounts[street] = (streetCounts[street] || 0) + 1;
          }
        }
      } catch {}
    }
  }

  // Sort by frequency and return top N
  const sorted = Object.entries(streetCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxStreets);

  console.log(`  Found ${Object.keys(streetCounts).length} unique streets, using top ${sorted.length}`);
  return sorted.map(([name, count]) => ({ name, propertyCount: count }));
}

// ─── Scrape one search page of results ───────────────────────────
async function scrapeResultsPage(page) {
  const records = [];

  // Extract permit links and row data
  const rows = await page.$$eval('table[id*="GridView"] tr, table[id*="gvPermitList"] tr, table[id*="gdvPermitList"] tr', trs => {
    return trs.map(tr => {
      const cells = Array.from(tr.cells || []);
      if (cells.length < 3) return null;
      const data = cells.map(c => c.innerText.trim());
      // Also get any link to permit detail
      const link = tr.querySelector('a[href*="CapDetail"]');
      const permitUrl = link ? link.href : null;
      return { cells: data, permitUrl };
    }).filter(Boolean);
  });

  // Get headers from first row
  const headers = await page.$$eval('table[id*="GridView"] tr:first-child th, table[id*="gdvPermitList"] tr:first-child th', ths =>
    ths.map(th => th.innerText.trim())
  );

  for (const row of rows) {
    // Skip header rows
    if (row.cells.some(c => c === 'Record Number' || c === 'Date')) continue;

    const record = {};
    if (headers.length > 0) {
      headers.forEach((h, i) => {
        if (h && row.cells[i]) record[h] = row.cells[i];
      });
    } else {
      // Fallback: positional mapping (common Accela layout)
      record.date = row.cells[0] || '';
      record.recordNumber = row.cells[1] || '';
      record.recordType = row.cells[2] || '';
      record.address = row.cells[3] || '';
      record.description = row.cells[4] || '';
    }
    if (record.permitUrl) record.url = row.permitUrl;
    if (Object.keys(record).length >= 2) records.push(record);
  }

  return records;
}

// ─── Search and paginate through all results for a street ────────
async function searchStreet(page, agency, streetName) {
  const allRecords = [];

  try {
    // Navigate to search page (fresh for each street to clear state)
    await page.goto(agency.searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Split direction from street name and use the direction dropdown
    const dirMatch = streetName.match(/^([NSEW])\s+(.+)$/);
    let actualStreet = streetName;
    if (dirMatch) {
      const dirMap = { 'N': 'North', 'S': 'South', 'E': 'East', 'W': 'West' };
      const dirValue = dirMap[dirMatch[1]] || '';
      actualStreet = dirMatch[2];
      // Try to set direction dropdown
      try {
        const dirSelect = agency.searchUrl.includes('HCFL')
          ? '#ctl00_PlaceHolderMain_generalSearchForm_ddlGSDirection'
          : 'select[id*="Direction"]';
        await page.selectOption(dirSelect, { label: dirValue }).catch(() => {});
      } catch {}
    }
    await page.fill(agency.streetField, actualStreet);

    // Click search
    await page.click(agency.searchButton);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Check for error page
    if (page.url().includes('Error')) return [];

    // Check for "no records"
    const pageText = await page.textContent('body').catch(() => '');
    if (pageText.includes('No Record Found') || pageText.includes('no matching records')) return [];

    // Scrape first page
    let pageRecords = await scrapeResultsPage(page);
    allRecords.push(...pageRecords);

    // Check if there are more pages ("100+" indicator)
    if (pageText.includes('100+') || pageText.includes('Showing 1-10')) {
      // Try to use "Download results" link if available
      const downloadLink = await page.$('a[id*="Download"], a[title*="Download"]');
      if (downloadLink) {
        // TODO: handle CSV download for bulk results
      }

      // Otherwise paginate
      let maxPages = 10; // cap at 100 results per street
      for (let p = 2; p <= maxPages; p++) {
        const nextBtn = await page.$('a[id*="Next"], a.aca_pagination_next, a[title*="Next"]');
        if (!nextBtn) break;

        const isDisabled = await nextBtn.getAttribute('disabled') || await nextBtn.getAttribute('class') || '';
        if (isDisabled.includes('disabled') || isDisabled === 'true') break;

        await nextBtn.click();
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(2000);

        const moreRecords = await scrapeResultsPage(page);
        if (moreRecords.length === 0) break;
        allRecords.push(...moreRecords);
      }
    }
  } catch (e) {
    // Silently handle errors for individual streets
  }

  return allRecords;
}

// ─── Main bulk crawl ─────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const agencyIdx = args.indexOf('--agency');
  const agencyCode = agencyIdx >= 0 ? args[agencyIdx + 1] : null;

  if (!agencyCode || !AGENCIES[agencyCode]) {
    console.log('Usage: node harvest-accela-bulk.mjs --agency HCFL [--streets 50] [--resume]');
    console.log('Agencies:', Object.keys(AGENCIES).join(', '));
    return;
  }

  const agency = AGENCIES[agencyCode];
  const maxStreetsIdx = args.indexOf('--streets');
  const maxStreets = maxStreetsIdx >= 0 ? parseInt(args[maxStreetsIdx + 1]) : 200;
  const resume = args.includes('--resume');

  console.log(`╔════════════════════════════════════════════╗`);
  console.log(`║  Accela Bulk Permit Crawler                ║`);
  console.log(`║  ${agency.name.padEnd(40)} ║`);
  console.log(`╚════════════════════════════════════════════╝`);

  // Get street list from parcel data
  console.log('\nBuilding street list from parcel data...');
  const streets = getTopStreets(agency.cities, maxStreets);

  if (streets.length === 0) {
    console.log('No streets found! Check city files in cities/ directory.');
    return;
  }
  console.log(`Top 5 streets: ${streets.slice(0, 5).map(s => `${s.name} (${s.propertyCount})`).join(', ')}`);

  // Resume checkpoint
  const checkpointFile = path.join(DATA_DIR, `accela-${agencyCode.toLowerCase()}-checkpoint.json`);
  let completedStreets = new Set();
  let allPermits = [];

  if (resume && fs.existsSync(checkpointFile)) {
    const cp = JSON.parse(fs.readFileSync(checkpointFile, 'utf-8'));
    completedStreets = new Set(cp.completedStreets || []);
    console.log(`Resuming from checkpoint: ${completedStreets.size} streets already done`);

    // Load existing permits
    const existingFile = path.join(DATA_DIR, agency.outputFile);
    if (fs.existsSync(existingFile)) {
      allPermits = JSON.parse(fs.readFileSync(existingFile, 'utf-8'));
      console.log(`Loaded ${allPermits.length} existing permits`);
    }
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const startTime = Date.now();
  let streetsSearched = 0;
  let permitsFound = 0;
  let errors = 0;

  for (const street of streets) {
    if (completedStreets.has(street.name)) continue;

    const records = await searchStreet(page, agency, street.name);
    permitsFound += records.length;
    streetsSearched++;

    // Tag each record with the search street for dedup
    for (const r of records) {
      r._searchStreet = street.name;
      r._agency = agencyCode;
      r._crawlDate = new Date().toISOString().split('T')[0];
    }
    allPermits.push(...records);

    completedStreets.add(street.name);

    // Progress
    if (streetsSearched % 5 === 0 || records.length > 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const remaining = streets.length - completedStreets.size;
      console.log(`  [${completedStreets.size}/${streets.length}] "${street.name}": ${records.length} permits | Total: ${allPermits.length} | ${elapsed}min | ~${remaining} streets left`);
    }

    // Save checkpoint every 10 streets
    if (streetsSearched % 10 === 0) {
      fs.writeFileSync(checkpointFile, JSON.stringify({
        agency: agencyCode,
        completedStreets: [...completedStreets],
        totalPermits: allPermits.length,
        lastUpdate: new Date().toISOString()
      }));

      // Save permits
      const outPath = path.join(DATA_DIR, agency.outputFile);
      fs.writeFileSync(outPath, JSON.stringify(allPermits, null, 2));
    }

    // Rate limit — don't hammer the server
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

    // Re-create context every 50 streets to avoid memory leaks
    if (streetsSearched % 50 === 0) {
      await context.clearCookies();
    }
  }

  await browser.close();

  // Deduplicate by record number
  const seen = new Set();
  const deduped = allPermits.filter(p => {
    const key = p['Record Number'] || p.recordNumber || JSON.stringify(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Final save
  const outPath = path.join(DATA_DIR, agency.outputFile);
  fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2));
  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);

  // Clean up checkpoint
  if (fs.existsSync(checkpointFile)) fs.unlinkSync(checkpointFile);

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║  CRAWL COMPLETE                            ║`);
  console.log(`╚════════════════════════════════════════════╝`);
  console.log(`  Agency: ${agency.name}`);
  console.log(`  Streets searched: ${streetsSearched}`);
  console.log(`  Permits found: ${deduped.length} (${allPermits.length - deduped.length} duplicates removed)`);
  console.log(`  File: ${agency.outputFile} (${sizeMB}MB)`);
  console.log(`  Time: ${elapsed} minutes`);
}

main().catch(console.error);
