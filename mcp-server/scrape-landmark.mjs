#!/usr/bin/env node
// Landmark Web Court Records Scraper (Playwright-based)
// Covers ~15 FL counties on the same platform
//
// These portals require reCAPTCHA validation, so we use a headless browser.
// For automated production use, set TWOCAPTCHA_KEY env var for solving service.
// For development/manual use, run with --visible flag to solve captcha manually.
//
// Usage:
//   node scrape-landmark.mjs --county palm-beach --name "SMITH" --type LP
//   node scrape-landmark.mjs --county indian-river --type LP --days 30
//   node scrape-landmark.mjs --county palm-beach --batch high-score.jsonl
//   node scrape-landmark.mjs --list                # Show county configs
//   node scrape-landmark.mjs --visible             # Show browser for manual captcha
//
// Doc type codes (common farming signals):
//   LP  = Lis Pendens (pre-foreclosure)         — category 20
//   LIE = Lien                                  — category 23,58
//   FJ  = Judgment                              — category 24,36,56,63,65
//   PRO = Probate / Court Papers               — category 27,64
//   DC  = Death Certificate                    — category 22
//   D   = Deed                                  — category 4,5,12,21,25,26,62

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data', 'court-records');
const LOG_FILE = path.join(DATA_DIR, 'scrape-log.jsonl');

// Landmark Web county configurations
// All use same API pattern, different base URL
const COUNTIES = {
  'palm-beach': {
    name: 'Palm Beach County',
    population: 1500000,
    baseUrl: 'https://erec.mypalmbeachclerk.com',
    path: '',
    docTypeCategories: { LP: '20', LIE: '23,58', FJ: '24,36,56,63,65', CP: '27,64', DC: '22', D: '4,5,12,21,25,26,62' }
  },
  'lee': {
    name: 'Lee County',
    population: 800000,
    baseUrl: 'https://or.leeclerk.org',
    path: '/LandMarkWeb',
    docTypeCategories: {} // Discover on first visit
  },
  'escambia': {
    name: 'Escambia County',
    population: 320000,
    baseUrl: 'https://dory.escambiaclerk.com',
    path: '/LandmarkWeb',
    docTypeCategories: {}
  },
  'st-johns': {
    name: 'St. Johns County',
    population: 290000,
    baseUrl: 'https://apps.stjohnsclerk.com',
    path: '/Landmark',
    docTypeCategories: {}
  },
  'clay': {
    name: 'Clay County',
    population: 220000,
    baseUrl: 'https://landmark.clayclerk.com',
    path: '/landmarkweb',
    docTypeCategories: {}
  },
  'hernando': {
    name: 'Hernando County',
    population: 200000,
    baseUrl: 'https://or.hernandoclerk.com',
    path: '/landmarkweb',
    docTypeCategories: {}
  },
  'bay': {
    name: 'Bay County (Panama City)',
    population: 180000,
    baseUrl: 'http://records2.baycoclerk.com',
    path: '/recording',
    docTypeCategories: {}
  },
  'charlotte': {
    name: 'Charlotte County',
    population: 190000,
    baseUrl: 'https://or.charlotteclerk.com',
    path: '/recording',
    docTypeCategories: {}
  },
  'martin': {
    name: 'Martin County',
    population: 165000,
    baseUrl: 'https://or.martinclerk.com',
    path: '/landmarkweb',
    docTypeCategories: {}
  },
  'indian-river': {
    name: 'Indian River County',
    population: 165000,
    baseUrl: 'https://landmark.indian-river.org',
    path: '',
    docTypeCategories: {}
  },
  'citrus': {
    name: 'Citrus County',
    population: 160000,
    baseUrl: 'https://search.citrusclerk.org',
    path: '/LandmarkWeb',
    docTypeCategories: {}
  },
  'flagler': {
    name: 'Flagler County',
    population: 125000,
    baseUrl: 'https://apps.flaglerclerk.com',
    path: '/Landmark',
    docTypeCategories: {}
  },
  'walton': {
    name: 'Walton County',
    population: 75000,
    baseUrl: 'https://orsearch.clerkofcourts.co.walton.fl.us',
    path: '',
    docTypeCategories: {}
  },
  'wakulla': {
    name: 'Wakulla County',
    population: 35000,
    baseUrl: 'https://wakullaclerk.org',
    path: '/landmarkweb',
    docTypeCategories: {}
  }
};

// ═══════════════════════════════════════════════════════════════
// BROWSER-BASED SCRAPER
// ═══════════════════════════════════════════════════════════════

async function createSession(countyId, options = {}) {
  const county = COUNTIES[countyId];
  if (!county) throw new Error(`Unknown county: ${countyId}`);

  const headless = !options.visible;
  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 50 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const url = county.baseUrl + (county.path || '');
  console.log(`  Opening ${county.name}: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Accept disclaimer if present
  const disclaimerBtn = await page.$('button:has-text("Accept"), a:has-text("Accept"), input[value="Accept"]');
  if (disclaimerBtn) {
    await disclaimerBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('  Disclaimer accepted');
  }

  // Check for reCAPTCHA
  const hasCaptcha = await page.$('iframe[src*="recaptcha"]');
  if (hasCaptcha) {
    if (options.visible) {
      if (!process.stdin.isTTY) {
        console.log('  ERROR: --visible requires an interactive terminal (not piped/PM2)');
        await browser.close();
        process.exit(1);
      }
      console.log('  ⚠️  CAPTCHA detected — solve it manually in the browser window');
      console.log('  Press Enter in this terminal when done...');
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    } else if (process.env.TWOCAPTCHA_KEY) {
      console.log('  Solving CAPTCHA via 2captcha service...');
      await solveCaptchaVia2Captcha(page);
    } else {
      console.log('  ⚠️  CAPTCHA required. Run with --visible for manual solve or set TWOCAPTCHA_KEY');
    }
  }

  return { browser, context, page, county };
}

async function solveCaptchaVia2Captcha(page) {
  // Extract sitekey from reCAPTCHA iframe
  const sitekey = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[src*="recaptcha"]');
    if (!iframe) return null;
    const match = iframe.src.match(/k=([^&]+)/);
    return match ? match[1] : null;
  });

  if (!sitekey) { console.log('  Could not extract reCAPTCHA sitekey'); return; }

  const apiKey = process.env.TWOCAPTCHA_KEY;
  const pageUrl = page.url();

  // Submit to 2captcha
  const submitUrl = `http://2captcha.com/in.php?key=${apiKey}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`;
  const submitResp = await fetch(submitUrl);
  const submitData = await submitResp.json();

  if (submitData.status !== 1) {
    console.log('  2captcha submit failed:', submitData.request);
    return;
  }

  const taskId = submitData.request;
  console.log(`  2captcha task: ${taskId}, waiting...`);

  // Poll for result (up to 120 seconds)
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const resultResp = await fetch(`http://2captcha.com/res.php?key=${apiKey}&action=get&id=${taskId}&json=1`);
    const resultData = await resultResp.json();

    if (resultData.status === 1) {
      // Inject the token
      await page.evaluate((token) => {
        document.querySelector('#g-recaptcha-response').value = token;
        // Trigger callback if exists
        if (typeof ___grecaptcha_cfg !== 'undefined') {
          const clients = Object.keys(___grecaptcha_cfg.clients);
          if (clients.length) {
            const callback = ___grecaptcha_cfg.clients[clients[0]]?.S?.S?.callback;
            if (callback) callback(token);
          }
        }
      }, resultData.request);
      console.log('  CAPTCHA solved!');
      return;
    }
    if (resultData.request !== 'CAPCHA_NOT_READY') {
      console.log('  2captcha error:', resultData.request);
      return;
    }
  }
  console.log('  2captcha timeout');
}

// ═══════════════════════════════════════════════════════════════
// SEARCH FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function searchByName(session, name, options = {}) {
  const { page, county } = session;
  const { docType, beginDate, endDate } = options;

  // Navigate to name search tab
  await page.click('[data-toshow="searchCriteriaName"], .searchNav:has-text("Name")');
  await page.waitForTimeout(500);

  // Fill name field
  await page.fill('#name, input[name="name"]', name);

  // Set date range if provided
  if (beginDate) {
    const beginInput = await page.$('#beginDate-Name, input[name="beginDate"]');
    if (beginInput) { await beginInput.fill(''); await beginInput.type(beginDate); }
  }
  if (endDate) {
    const endInput = await page.$('#endDate-Name, input[name="endDate"]');
    if (endInput) { await endInput.fill(''); await endInput.type(endDate); }
  }

  // Select doc type category if specified
  if (docType && county.docTypeCategories[docType]) {
    const catSelect = await page.$('#documentCategory-Name');
    if (catSelect) {
      await catSelect.selectOption(county.docTypeCategories[docType]);
    }
  }

  // Submit search
  await page.click('.nameSearchSubmit, button[formname="nameSearchForm"]');

  // Wait for results
  await page.waitForSelector('#searchResults:not(:empty)', { timeout: 30000 });
  await page.waitForTimeout(1000); // Let DataTable render

  // Parse results
  return await parseResults(page);
}

async function searchByDocType(session, docTypeCategory, options = {}) {
  const { page } = session;
  const { beginDate, endDate } = options;

  // Navigate to doc type search tab
  await page.click('[data-toshow="searchCriteriaDocumentType"], .searchNav:has-text("Document")');
  await page.waitForTimeout(500);

  // Set date range
  if (beginDate) {
    const input = await page.$('#beginDate-DocumentType, input[name="beginDate"]');
    if (input) { await input.fill(''); await input.type(beginDate); }
  }
  if (endDate) {
    const input = await page.$('#endDate-DocumentType, input[name="endDate"]');
    if (input) { await input.fill(''); await input.type(endDate); }
  }

  // Check the doc type checkbox(es)
  const ids = docTypeCategory.split(',');
  for (const id of ids) {
    const cb = await page.$(`#dt-DocumentType-${id.trim()}`);
    if (cb) await cb.check();
  }

  // Submit
  await page.click('button[formname="documentTypeSearchForm"]');
  await page.waitForSelector('#searchResults:not(:empty)', { timeout: 30000 });
  await page.waitForTimeout(1000);

  return await parseResults(page);
}

async function parseResults(page) {
  // Extract results from the DataTable
  const results = await page.evaluate(() => {
    const rows = document.querySelectorAll('#resultsTable tbody tr');
    const records = [];

    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) continue;

      // Column order: #, Status, [eye], Direct Name, Reverse Name, Record Date, Doc Type, Book Type, Book, Page, Instrument #, Legal...
      const getText = (idx) => cells[idx]?.textContent?.trim() || '';
      records.push({
        directName: getText(3) || getText(2),
        reverseName: getText(4) || getText(3),
        recordDate: getText(5) || getText(4),
        docType: getText(6) || getText(5),
        bookType: getText(7) || getText(6),
        book: getText(8) || getText(7),
        pageNum: getText(9) || getText(8),
        instrumentNum: getText(10) || getText(9),
        legal: getText(11) || getText(10)
      });
    }
    return records;
  });

  // Get total count
  const totalText = await page.textContent('.dataTables_info') || '';
  const totalMatch = totalText.match(/(\d+)\s*records/);
  const total = totalMatch ? parseInt(totalMatch[1]) : results.length;

  return { results, total, page: 1 };
}

// ═══════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes('--list')) {
  console.log('\nLandmark Web Counties (Playwright scraper):');
  console.log('─'.repeat(60));
  for (const [id, c] of Object.entries(COUNTIES)) {
    console.log(`  ${id.padEnd(15)} ${c.name.padEnd(30)} pop: ${(c.population/1000).toFixed(0)}K`);
  }
  console.log('\nDoc types: LP (lis pendens), LIE (lien), FJ (judgment), CP (court papers), DC (death), D (deed)');
  console.log('\nRequirements:');
  console.log('  --visible     Show browser for manual CAPTCHA solve');
  console.log('  TWOCAPTCHA_KEY env var for automated solving (~$2/1000 solves)');
  process.exit(0);
}

const countyId = args[args.indexOf('--county') + 1];
const name = args.includes('--name') ? args[args.indexOf('--name') + 1] : '';
const docType = args.includes('--type') ? args[args.indexOf('--type') + 1] : 'LP';
const days = args.includes('--days') ? parseInt(args[args.indexOf('--days') + 1]) : 90;
const visible = args.includes('--visible');

if (!countyId || !COUNTIES[countyId]) {
  console.log('Usage: node scrape-landmark.mjs --county <id> [--name "NAME"] [--type LP] [--days 90] [--visible]');
  console.log('Run --list to see available counties');
  process.exit(1);
}

// Calculate date range
const endDate = new Date();
const beginDate = new Date();
beginDate.setDate(beginDate.getDate() - days);
const fmt = (d) => `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}/${d.getFullYear()}`;

console.log(`\n=== Landmark Web Scraper ===`);
console.log(`County: ${COUNTIES[countyId].name}`);
console.log(`Search: ${name || '(by doc type)'} | Type: ${docType} | ${fmt(beginDate)} — ${fmt(endDate)}`);
console.log(`Mode: ${visible ? 'VISIBLE (manual captcha)' : 'headless'}`);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

try {
  const session = await createSession(countyId, { visible });
  let results;

  if (name) {
    results = await searchByName(session, name, {
      docType, beginDate: fmt(beginDate), endDate: fmt(endDate)
    });
  } else {
    const category = COUNTIES[countyId].docTypeCategories[docType] || '20'; // default LP
    results = await searchByDocType(session, category, {
      beginDate: fmt(beginDate), endDate: fmt(endDate)
    });
  }

  console.log(`\nResults: ${results.total} records found`);
  for (const r of results.results.slice(0, 10)) {
    console.log(`  ${r.recordDate} | ${r.docType} | ${r.directName} → ${r.reverseName} | ${r.instrumentNum}`);
  }

  // Save results
  const outFile = path.join(DATA_DIR, `${countyId}-${docType.toLowerCase()}-${Date.now()}.jsonl`);
  const jsonl = results.results.map(r => JSON.stringify({ ...r, county: countyId, scraped: new Date().toISOString() })).join('\n') + '\n';
  fs.writeFileSync(outFile, jsonl);
  console.log(`\nSaved: ${outFile}`);

  // Log
  fs.appendFileSync(LOG_FILE, JSON.stringify({
    county: countyId, type: docType, name, records: results.total,
    date: new Date().toISOString(), days
  }) + '\n');

  await session.browser.close();
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
