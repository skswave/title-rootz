// CSV Export — generates clean Excel-compatible CSV from farming search results
// Every row includes a bridge page URL so the spreadsheet connects to the AI platform

export function farmingToCSV(prospects) {
  const header = [
    'Property Address', 'City', 'State', 'ZIP',
    'Owner Name',
    'Owner Mailing Address', 'Owner Mailing City', 'Owner Mailing State', 'Owner Mailing ZIP',
    'Assessed Value', 'Property Type', 'Year Built', 'Living Area (sqft)', 'Lot Size (sqft)',
    'Farming Score', 'Rating', 'Signals',
    'Court Records', 'Equity Estimate', 'Last Sale',
    'Rootz Intelligence URL'
  ].join(',');

  const rows = prospects.map(p => {
    const ma = p.ownerMailingAddress || {};
    const prop = p.property || {};
    const signals = (p.reasons || []).join('; ');
    const court = (p.courtRecords || []).map(c => (c.signal || '') + ' ' + (c.date || '')).join('; ');
    const sale = (p.salesHistory || []).length > 0
      ? p.salesHistory[0].date + ' $' + (p.salesHistory[0].price || 0)
      : '';

    return [
      esc(p.address), esc(p.city), 'FL', esc(p.zip),
      esc(p.owner),
      esc(ma.address), esc(ma.city), esc(ma.state), esc(ma.zip),
      p.value || '', esc(prop.type || ''), prop.yearBuilt || '', prop.livingArea || '', prop.lotSize || '',
      p.score, esc(p.rating), esc(signals),
      esc(court), p.equityEstimate || '', esc(sale),
      esc(p.bridgePageUrl)
    ].join(',');
  });

  return header + '\n' + rows.join('\n');
}

export function farmingToMailerCSV(prospects) {
  const header = [
    'First Name', 'Last Name',
    'Property Address', 'City', 'State', 'ZIP',
    'Owner Mailing Address', 'Mailing City', 'Mailing State', 'Mailing ZIP',
    'Farming Score', 'Signals',
    'Rootz Intelligence URL'
  ].join(',');

  const rows = prospects.map(p => {
    const ma = p.ownerMailingAddress || {};
    const nameParts = (p.owner || '').split(',');
    const lastName = (nameParts[0] || '').trim();
    const firstName = (nameParts[1] || '').trim();
    const signals = (p.reasons || []).slice(0, 3).join('; ');

    return [
      esc(firstName), esc(lastName),
      esc(p.address), esc(p.city), 'FL', esc(p.zip),
      esc(ma.address), esc(ma.city), esc(ma.state), esc(ma.zip),
      p.score, esc(signals),
      esc(p.bridgePageUrl)
    ].join(',');
  });

  return header + '\n' + rows.join('\n');
}

function esc(s) {
  if (s === null || s === undefined) return '';
  const str = String(s);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
