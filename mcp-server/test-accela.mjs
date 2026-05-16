// Test Accela search — Hillsborough County by parcel number
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

console.log('Loading HCFL Building search...');
await page.goto('https://aca-prod.accela.com/HCFL/Cap/CapHome.aspx?module=Building', { waitUntil: 'networkidle', timeout: 30000 });

// Try parcel number search (more reliable than date for bulk)
// Also try with zero-padded date format
const startDate = '04/01/2026';
const endDate = '04/30/2026';

await page.fill('#ctl00_PlaceHolderMain_generalSearchForm_txtGSStartDate', startDate);
await page.fill('#ctl00_PlaceHolderMain_generalSearchForm_txtGSEndDate', endDate);
console.log(`Date range: ${startDate} to ${endDate}`);

// Click search
await page.click('#ctl00_PlaceHolderMain_btnNewSearch');
console.log('Clicked search');

await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(5000);

const url = page.url();
console.log(`URL: ${url}`);

if (url.includes('Error')) {
  console.log('Error page — trying without dates, with street name only');

  // Go back to search
  await page.goto('https://aca-prod.accela.com/HCFL/Cap/CapHome.aspx?module=Building', { waitUntil: 'networkidle', timeout: 30000 });

  // Just search by street name (broad)
  await page.fill('#ctl00_PlaceHolderMain_generalSearchForm_txtGSStreetName', 'DALE MABRY');
  console.log('Filled street: DALE MABRY');

  await page.click('#ctl00_PlaceHolderMain_btnNewSearch');
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(5000);

  console.log(`URL: ${page.url()}`);
}

// Check for results
if (!page.url().includes('Error')) {
  // Look for the grid
  const pageText = await page.textContent('body');

  // Check for "Record Number" or permit results
  if (pageText.includes('Record Number') || pageText.includes('Permit Number') || pageText.includes('Application')) {
    console.log('Results page detected!');

    // Get all links that look like permit numbers
    const permitLinks = await page.$$eval('a[href*="CapDetail"]', links =>
      links.map(l => ({ text: l.innerText.trim(), href: l.href })).slice(0, 20)
    );
    console.log(`Permit links: ${permitLinks.length}`);
    for (const p of permitLinks.slice(0, 10)) {
      console.log(`  ${p.text}`);
    }

    // Get table row data
    const tableData = await page.$$eval('table[id*="GridView"] tr, table[id*="gvPermitList"] tr', rows =>
      rows.map(r => Array.from(r.cells || []).map(c => c.innerText.trim())).filter(r => r.length >= 3)
    );
    console.log(`\nTable rows: ${tableData.length}`);
    for (const row of tableData.slice(0, 10)) {
      console.log(`  ${row.slice(0, 6).join(' | ')}`);
    }
  } else if (pageText.includes('No Record Found') || pageText.includes('no matching')) {
    console.log('No records found for this search');
  } else {
    console.log('Unknown page state');
    console.log('Text snippet:', pageText.substring(0, 500));
  }
}

await page.screenshot({ path: 'data/florida/accela-HCFL-test3.png', fullPage: true });
console.log('\nScreenshot saved');
await browser.close();
