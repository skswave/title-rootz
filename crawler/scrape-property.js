// Land Records Scraper — Playwright script for masslandrecords.com
// Usage: Called from browser_run_code with property parameters

async function scrapeProperty(page, streetNumber, streetName, registry = 'BerkMiddle') {
  const baseUrl = `https://www.masslandrecords.com/${registry}/D/Default.aspx`;

  // 1. Fresh navigation
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Dismiss popup
  await page.evaluate(() => {
    const popup = document.getElementById('UpdatePanelRefreshButtons');
    if (popup) popup.style.display = 'none';
  });

  // 2. Switch to Property Search
  await page.locator('#SearchCriteriaName1_DDL_SearchName').selectOption('Recorded Land Property Search');
  await page.waitForTimeout(1500);

  // 3. Fill search fields using pressSequentially (triggers ASP.NET events)
  if (streetNumber) {
    const numField = page.locator('#SearchFormEx1_ACSTextBox_StreetNumber');
    await numField.click();
    await numField.pressSequentially(streetNumber, { delay: 30 });
  }

  const nameField = page.locator('#SearchFormEx1_ACSTextBox_StreetName');
  await nameField.click();
  await nameField.pressSequentially(streetName, { delay: 30 });

  // 4. Submit search
  await page.locator('#SearchFormEx1_btnSearch').click();
  await page.waitForTimeout(3000);

  // 5. Check for "0 hits" modal
  const hasModal = await page.evaluate(() => {
    const blocker = document.getElementById('MessageBoxCtrl1_ScreenBlocker');
    return blocker && blocker.style.display !== 'none' && blocker.offsetParent !== null;
  });

  if (hasModal) {
    await page.evaluate(() => {
      document.getElementById('MessageBoxCtrl1_ScreenBlocker').style.display = 'none';
      document.getElementById('MessageBoxCtrl1_UpdatePanel1').style.display = 'none';
    });
    return { streetNumber, streetName, error: '0 hits', records: [] };
  }

  // 6. Extract search info
  const searchInfo = await page.locator('#SearchInfo1_SI_Table1').textContent().catch(() => '');
  const rowMatch = searchInfo.match(/(\d+)\s*rows/);
  const totalRows = rowMatch ? parseInt(rowMatch[1]) : 0;

  // 7. Switch to view 100 per page
  if (totalRows > 20) {
    await page.evaluate(() => {
      __doPostBack('DocList1$View100', '');
    }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // 8. Extract grid records
  const records = await page.evaluate(() => {
    const results = [];
    const rows = document.querySelectorAll('table tr');
    for (const row of rows) {
      const links = row.querySelectorAll('td a');
      const cells = row.querySelectorAll('td');
      if (links.length >= 5 && cells.length >= 7) {
        const street = links[0]?.textContent?.trim();
        const date = links[1]?.textContent?.trim();
        // Skip header-like rows
        if (street === 'Street Name' || street === 'Select All') continue;
        results.push({
          street: street,
          fileDate: date,
          bookPage: links[2]?.textContent?.trim(),
          typeDesc: links[3]?.textContent?.trim(),
          numPages: links[4]?.textContent?.trim()
        });
      }
    }
    // Deduplicate (the grid sometimes renders twice)
    const seen = new Set();
    return results.filter(r => {
      const key = `${r.street}|${r.fileDate}|${r.bookPage}|${r.typeDesc}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  return {
    streetNumber,
    streetName,
    registry,
    totalRows,
    recordCount: records.length,
    searchDate: new Date().toISOString(),
    records
  };
}

// Export for use in browser_run_code
module.exports = { scrapeProperty };
