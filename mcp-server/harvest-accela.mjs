#!/usr/bin/env node
// Origin Harvest — Accela Permit Scraper (Playwright/headless)
// Scrapes building permits from Accela ACA portals used by FL counties
// Runs headless on server — no GUI needed
//
// Usage:
//   node harvest-accela.mjs --agency HCFL --discover       # discover fields/modules
//   node harvest-accela.mjs --agency HCFL --search "123 Main"  # test search
//   node harvest-accela.mjs --agency HCFL --bulk --days 30     # pull last 30 days
//   node harvest-accela.mjs --list                              # show known agencies
//
// Requires: npm install playwright
// First run: npx playwright install chromium

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data', 'florida');

// ═══════════════════════════════════════════════════════════════════
// ACCELA AGENCY RECIPES — FL counties using Accela
// ═══════════════════════════════════════════════════════════════════

const AGENCIES = {
  'HCFL': {
    name: 'Hillsborough County (Tampa)',
    url: 'https://aca-prod.accela.com/HCFL/',
    module: 'Building',
    searchUrl: 'https://aca-prod.accela.com/HCFL/Cap/CapHome.aspx?module=Building',
    population: 1500000,
    status: 'ready'
  },
  'tampa': {
    name: 'City of Tampa',
    url: 'https://aca-prod.accela.com/tampa/',
    module: 'Building',
    searchUrl: 'https://aca-prod.accela.com/tampa/Cap/CapHome.aspx?module=Building',
    population: 400000,
    status: 'ready'
  },
  'LEECO': {
    name: 'Lee County (Fort Myers)',
    url: 'https://aca-prod.accela.com/LEECO/',
    module: 'Building',
    searchUrl: 'https://aca-prod.accela.com/LEECO/Cap/CapHome.aspx?module=Building',
    population: 800000,
    status: 'ready'
  },
  'PINELLAS': {
    name: 'Pinellas County (St Petersburg)',
    url: 'https://aca-prod.accela.com/PINELLAS/',
    module: 'Building',
    searchUrl: 'https://aca-prod.accela.com/PINELLAS/Cap/CapHome.aspx?module=Building',
    population: 1000000,
    status: 'ready'
  },
  'KEYBISCAYNE': {
    name: 'Village of Key Biscayne',
    url: 'https://aca-prod.accela.com/KEYBISCAYNE/',
    module: 'Building',
    searchUrl: 'https://aca-prod.accela.com/KEYBISCAYNE/Cap/CapHome.aspx?module=Building',
    population: 15000,
    status: 'ready'
  },
  'BOCC': {
    name: 'Sarasota County',
    url: 'https://aca-prod.accela.com/BOCC/',
    module: 'Building',
    searchUrl: 'https://aca-prod.accela.com/BOCC/Cap/CapHome.aspx?module=Building',
    population: 450000,
    status: 'draft'
  }
};

// ═══════════════════════════════════════════════════════════════════
// BROWSER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

async function launchBrowser() {
  return await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
}

// ═══════════════════════════════════════════════════════════════════
// DISCOVER — Find available modules and form fields for an agency
// ═══════════════════════════════════════════════════════════════════

async function discoverAgency(agencyCode) {
  const agency = AGENCIES[agencyCode];
  if (!agency) { console.log(`Unknown agency: ${agencyCode}`); return; }

  console.log(`\nDiscovering: ${agency.name} (${agencyCode})`);
  console.log(`URL: ${agency.searchUrl}`);

  const browser = await launchBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(agency.searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`  Page loaded: ${page.url()}`);
    console.log(`  Title: ${await page.title()}`);

    // Find all module tabs
    const tabs = await page.$$eval('a[id*="Tab"]', els =>
      els.map(el => ({ text: el.innerText.trim(), href: el.href, id: el.id }))
    );
    if (tabs.length) {
      console.log(`\n  Modules/Tabs (${tabs.length}):`);
      for (const t of tabs) console.log(`    ${t.text} → ${t.href}`);
    }

    // Find search form fields
    const inputs = await page.$$eval('input[type="text"], select', els =>
      els.map(el => ({
        id: el.id,
        name: el.name,
        type: el.type,
        placeholder: el.placeholder,
        label: el.labels?.[0]?.innerText || ''
      })).filter(el => el.id && !el.id.includes('__'))
    );
    if (inputs.length) {
      console.log(`\n  Search Form Fields (${inputs.length}):`);
      for (const inp of inputs) {
        console.log(`    ${inp.id.split('$').pop()} | label: "${inp.label}" | type: ${inp.type}`);
      }
    }

    // Find search buttons
    const buttons = await page.$$eval('input[type="submit"], button, a.ACA_LinkButton', els =>
      els.map(el => ({ text: el.innerText || el.value, id: el.id })).filter(el => el.text)
    );
    if (buttons.length) {
      console.log(`\n  Buttons:`);
      for (const b of buttons) console.log(`    "${b.text}" → ${b.id}`);
    }

    // Take screenshot for reference
    const ssPath = path.join(DATA_DIR, `accela-${agencyCode}-discover.png`);
    await page.screenshot({ path: ssPath, fullPage: true });
    console.log(`\n  Screenshot: ${ssPath}`);

  } catch (e) {
    console.log(`  Error: ${e.message}`);
  } finally {
    await browser.close();
  }
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH — Search for permits by address
// ═══════════════════════════════════════════════════════════════════

async function searchPermits(agencyCode, searchAddress) {
  const agency = AGENCIES[agencyCode];
  if (!agency) { console.log(`Unknown agency: ${agencyCode}`); return []; }

  console.log(`\nSearching ${agency.name} for: "${searchAddress}"`);

  const browser = await launchBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [];

  try {
    await page.goto(agency.searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Find address input field — common patterns in Accela
    const addrSelectors = [
      'input[id*="txtAddress"]',
      'input[id*="StreetName"]',
      'input[id*="txtStreet"]',
      'input[id*="Address"]',
    ];

    let filled = false;
    for (const sel of addrSelectors) {
      const input = await page.$(sel);
      if (input) {
        await input.fill(searchAddress);
        console.log(`  Filled: ${sel}`);
        filled = true;
        break;
      }
    }

    if (!filled) {
      // Try filling the street number and name separately
      const numField = await page.$('input[id*="HouseNumberFrom"]') || await page.$('input[id*="txtHouseNumber"]');
      const streetField = await page.$('input[id*="txtStreetName"]') || await page.$('input[id*="StreetName"]');

      const parts = searchAddress.match(/^(\d+)\s+(.+)$/);
      if (parts && numField && streetField) {
        await numField.fill(parts[1]);
        await streetField.fill(parts[2]);
        console.log(`  Filled: number=${parts[1]}, street=${parts[2]}`);
        filled = true;
      }
    }

    if (!filled) {
      console.log('  Could not find address input field');
      const ssPath = path.join(DATA_DIR, `accela-${agencyCode}-noinput.png`);
      await page.screenshot({ path: ssPath, fullPage: true });
      console.log(`  Screenshot saved: ${ssPath}`);
      await browser.close();
      return [];
    }

    // Click search button
    const searchBtn = await page.$('a[id*="btnNewSearch"]') ||
                      await page.$('input[id*="btnSearch"]') ||
                      await page.$('a[title*="Search"]') ||
                      await page.$('button[id*="Search"]');

    if (searchBtn) {
      await searchBtn.click();
      console.log('  Search clicked, waiting for results...');
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(3000); // ASP.NET postback needs time
    }

    // Extract results from the grid
    const rows = await page.$$eval('tr.ACA_Grid_Row, tr.ACA_Grid_Row_Odd', rows =>
      rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return cells.map(c => c.innerText.trim());
      })
    );

    if (rows.length > 0) {
      // Get column headers
      const headers = await page.$$eval('th.ACA_Grid_Header, th.ACA_Header', ths =>
        ths.map(th => th.innerText.trim())
      );

      console.log(`  Results: ${rows.length} permits found`);
      console.log(`  Columns: ${headers.join(' | ')}`);

      for (const row of rows) {
        const record = {};
        headers.forEach((h, i) => { record[h] = row[i] || ''; });
        results.push(record);
        if (results.length <= 5) {
          console.log(`    ${row.slice(0, 4).join(' | ')}`);
        }
      }
    } else {
      console.log('  No results found');
      const ssPath = path.join(DATA_DIR, `accela-${agencyCode}-noresults.png`);
      await page.screenshot({ path: ssPath, fullPage: true });
    }

  } catch (e) {
    console.log(`  Error: ${e.message}`);
  } finally {
    await browser.close();
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════
// BULK — Crawl permits by date range
// ═══════════════════════════════════════════════════════════════════

async function bulkPull(agencyCode, days = 30) {
  const agency = AGENCIES[agencyCode];
  if (!agency) { console.log(`Unknown agency: ${agencyCode}`); return; }

  console.log(`\nBulk pull: ${agency.name} — last ${days} days`);

  const browser = await launchBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  const allResults = [];

  try {
    await page.goto(agency.searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const fmtDate = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

    // Find and fill date range fields
    const dateFromSelectors = [
      'input[id*="txtFromDate"]', 'input[id*="PermitDateFrom"]',
      'input[id*="OpenDateFrom"]', 'input[id*="txtDateFrom"]',
      'input[id*="FileDate_DateFrom"]'
    ];
    const dateToSelectors = [
      'input[id*="txtToDate"]', 'input[id*="PermitDateTo"]',
      'input[id*="OpenDateTo"]', 'input[id*="txtDateTo"]',
      'input[id*="FileDate_DateTo"]'
    ];

    let dateFrom = null, dateTo = null;
    for (const sel of dateFromSelectors) {
      const el = await page.$(sel);
      if (el) { dateFrom = el; break; }
    }
    for (const sel of dateToSelectors) {
      const el = await page.$(sel);
      if (el) { dateTo = el; break; }
    }

    if (dateFrom && dateTo) {
      await dateFrom.fill(fmtDate(startDate));
      await dateTo.fill(fmtDate(endDate));
      console.log(`  Date range: ${fmtDate(startDate)} to ${fmtDate(endDate)}`);
    } else {
      console.log('  Could not find date range fields — trying without dates');
    }

    // Click search
    const searchBtn = await page.$('a[id*="btnNewSearch"]') ||
                      await page.$('input[id*="btnSearch"]') ||
                      await page.$('a[title*="Search"]');

    if (searchBtn) {
      await searchBtn.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }

    // Extract all pages of results
    let pageNum = 1;
    while (true) {
      const rows = await page.$$eval('tr.ACA_Grid_Row, tr.ACA_Grid_Row_Odd', rows =>
        rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          return cells.map(c => c.innerText.trim());
        })
      );

      const headers = await page.$$eval('th.ACA_Grid_Header, th.ACA_Header', ths =>
        ths.map(th => th.innerText.trim())
      );

      for (const row of rows) {
        const record = {};
        headers.forEach((h, i) => { record[h] = row[i] || ''; });
        allResults.push(record);
      }

      console.log(`  Page ${pageNum}: ${rows.length} records (total: ${allResults.length})`);

      if (rows.length === 0) break;

      // Try to click "Next" for pagination
      const nextLink = await page.$('a[id*="Next"]') ||
                       await page.$('a.aca_pagination_next') ||
                       await page.$('a[title*="Next"]');

      if (!nextLink) break;

      const isDisabled = await nextLink.getAttribute('disabled');
      if (isDisabled) break;

      await nextLink.click();
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      pageNum++;

      if (pageNum > 100) break; // safety cap
    }

  } catch (e) {
    console.log(`  Error: ${e.message}`);
  } finally {
    await browser.close();
  }

  if (allResults.length > 0) {
    const outFile = `accela-${agencyCode.toLowerCase()}-permits.json`;
    const outPath = path.join(DATA_DIR, outFile);
    fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
    const size = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
    console.log(`\n  Saved: ${outFile} (${allResults.length} records, ${size}MB)`);
  }

  return allResults;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CLI
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--list') {
    console.log('\nAccela Agency Recipes (FL):');
    console.log('─'.repeat(70));
    for (const [code, a] of Object.entries(AGENCIES)) {
      console.log(`  ${code.padEnd(15)} ${a.name.padEnd(35)} ${a.status}`);
    }
    return;
  }

  const agencyIdx = args.indexOf('--agency');
  const agencyCode = agencyIdx >= 0 ? args[agencyIdx + 1] : null;

  if (args.includes('--discover') && agencyCode) {
    await discoverAgency(agencyCode);
    return;
  }

  const searchIdx = args.indexOf('--search');
  if (searchIdx >= 0 && agencyCode) {
    const address = args[searchIdx + 1];
    await searchPermits(agencyCode, address);
    return;
  }

  if (args.includes('--bulk') && agencyCode) {
    const daysIdx = args.indexOf('--days');
    const days = daysIdx >= 0 ? parseInt(args[daysIdx + 1]) : 30;
    await bulkPull(agencyCode, days);
    return;
  }

  console.log(`
Origin Harvest — Accela Permit Scraper (Playwright/headless)

Usage:
  node harvest-accela.mjs --list                                    Show agencies
  node harvest-accela.mjs --agency HCFL --discover                  Discover form fields
  node harvest-accela.mjs --agency HCFL --search "123 Main St"      Test search
  node harvest-accela.mjs --agency HCFL --bulk --days 30            Pull last 30 days

Agencies: ${Object.keys(AGENCIES).join(', ')}

Requires: npm install playwright && npx playwright install chromium
  `);
}

main().catch(console.error);
