// Bridge page HTML template — generates the visual property intelligence page
// This is imported by server.mjs for the /p/ route

const DOR_CODES = {
  "000": "Vacant Residential", "001": "Single Family", "002": "Mobile Home",
  "003": "Multi-Family (2-9)", "004": "Condo", "005": "Co-op",
  "006": "Retirement Home", "007": "Misc Residential", "008": "Multi-Family (10+)",
  "009": "Non-marketable Res", "010": "Vacant Commercial",
  "011": "Store/Retail", "012": "Mixed Use", "013": "Dept Store",
  "014": "Supermarket", "015": "Shopping Center (regional)",
  "016": "Hotel/Motel", "017": "Office", "018": "Office+Retail",
  "019": "Professional Services", "020": "Shopping Center", "021": "Restaurant",
  "022": "Gas Station", "023": "Medical Office", "024": "Nursing Home",
  "025": "Warehouse", "026": "Auto Repair", "027": "Auto Dealer",
  "028": "Parking Lot/Garage", "029": "Wholesale Outlet",
  "030": "Florist/Greenhouse", "031": "Drive-in Theater", "032": "Amusement",
  "033": "Bowling Alley", "034": "Campground", "035": "Tourist Attraction",
  "036": "Marina", "037": "Funeral Home", "038": "Club/Lodge",
  "039": "Theater", "040": "Vacant Industrial", "041": "Light Manufacturing",
  "042": "Heavy Manufacturing", "043": "Lumber Yard", "044": "Packing Plant",
  "045": "Bottling Plant", "046": "Food Processing", "047": "Mineral Processing",
  "048": "Mining", "049": "Industrial (other)",
  "050": "Improved Agricultural", "051": "Cropland (row crops)",
  "052": "Improved Pasture", "053": "Timberland", "054": "Timberland (not 100%)",
  "060": "Grazing (improved)", "061": "Grazing (semi-improved)",
  "062": "Grazing (native)", "063": "Bees/Tropical Fish", "064": "Orchards",
  "065": "Poultry", "066": "Dairy", "067": "Horse/Cattle Ranch",
  "069": "Ornamental/Sod", "070": "Church/Religious",
  "071": "Private School", "072": "Privately Owned Hospital",
  "073": "Home for Aged", "074": "Orphanage", "075": "Mortuary/Cemetery",
  "076": "Club/Union Hall", "077": "Lodge Hall",
  "080": "Undefined Government", "081": "Military", "082": "Forest/Park",
  "083": "Government Leased", "084": "Utility", "085": "Waste Treatment",
  "086": "County Property", "087": "State Property", "088": "Federal Property",
  "089": "Municipal Property", "090": "Leasehold Interest",
  "091": "Utility/Railroad", "092": "Mining/Petroleum Rights",
  "093": "Subsurface Rights", "094": "Right-of-Way", "095": "Rivers/Lakes",
  "096": "Sewage Disposal", "097": "Outdoor Recreation", "098": "Centrally Assessed",
  "099": "Non-agricultural Acreage"
};

// Residential DOR codes (for farming filter)
export const RESIDENTIAL_CODES = new Set(["000","001","002","003","004","005","006","007","008","009"]);

// Fetch property photos from Broward County Property Appraiser
async function fetchBCPAPhotos(folio) {
  if (!folio || folio.length < 10) return [];
  try {
    const resp = await fetch(`https://bcpa.net/Photographs.asp?Folio=${folio}`, {
      signal: AbortSignal.timeout(5000)
    });
    const html = await resp.text();
    const matches = [...html.matchAll(/src='(\/Photographs\/[^']+\.jpg)'/g)];
    return matches.map(m => {
      const url = `https://bcpa.net${m[1]}`;
      // Extract date from filename
      const fname = m[1].split('/').pop();
      let date = '';
      // Pattern: folio_M_D_YYYY or folio_YYYYMMDD or PUBLIC PHOTO-YYYYMMDD
      const dateMatch = fname.match(/(\d{4})(\d{2})(\d{2})/) || fname.match(/(\d{1,2})_(\d{1,2})_(\d{4})/);
      if (dateMatch) {
        if (dateMatch[1].length === 4) date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        else date = `${dateMatch[3]}-${dateMatch[1].padStart(2,'0')}-${dateMatch[2].padStart(2,'0')}`;
      }
      return { url, date, filename: fname };
    });
  } catch (e) { /* timeout or error */ }
  return [];
}

export async function renderBridgePage(data, parcelId) {
  const p = data.property || {};
  const fs2 = data.farmingScore || {};
  const cr = data.courtRecords || {};
  const flood = data.flood || {};
  const demos = data.demographics || {};
  const permits = data.buildingPermits || {};
  const inv = data.investorSignals || {};
  const lat = p.coordinates?.lat;
  const lng = p.coordinates?.lng;

  // Value — try multiple sources (statewide data puts values in different places)
  const assessedTotal = inv.assessedValue?.total || 0;
  const assessedLand = inv.assessedValue?.land || 0;
  const assessedBldg = inv.assessedValue?.building || 0;
  // For statewide DOR data, values might be in the property object directly
  const propVal = data._rawValue || 0;
  const displayValue = assessedTotal || (assessedLand + assessedBldg) || propVal || 0;
  const landValue = assessedLand || 0;
  const bldgValue = assessedBldg || 0;

  const dorCode = p.classification?.dorCode || '?';
  const dorDesc = DOR_CODES[dorCode] || dorCode;

  const scoreColor = fs2.rating === 'HIGH' ? '#dc2626' : fs2.rating === 'MEDIUM' ? '#f59e0b' : '#22c55e';
  const floodColor = (flood.zone === 'X' || !flood.zone) ? '#16a34a' : '#dc2626';

  // Schools
  const schoolList = (data.schools?.nearestPublic || []).slice(0, 5).map(s =>
    `<li>${s.name || '?'}${s.distanceMiles ? ` (${s.distanceMiles.toFixed(1)} mi)` : ''}</li>`
  ).join('');

  // Court records — translate Latin/legal jargon to plain English
  const PLAIN_ENGLISH = {
    'Lis Pendens (pre-foreclosure)': 'Litigation Pending (pre-foreclosure)',
    'Final Judgment (foreclosure)': 'Foreclosure Judgment',
    'Certified Final Judgment': 'Certified Foreclosure Judgment',
    'Release/Satisfy/Terminate': 'Lien/Mortgage Released',
    'Deed Transfer': 'Ownership Transfer (deed recorded)',
    'Mortgage/Modification': 'Mortgage Recorded',
    'Death Certificate': 'Death Certificate Recorded',
    'Lien': 'Lien Filed Against Property',
    'Corporate Lien Warrant': 'Corporate Lien Warrant',
    'Probate': 'Probate Filing (estate proceeding)',
    'Easement': 'Easement Recorded',
    'Agreement for Deed': 'Agreement for Deed',
    'Notice of Homestead': 'Homestead Status Change',
  };

  const courtHTML = (cr.signals || []).map(s => {
    const c = s.signal === 'lis_pendens' ? '#dc2626' : s.signal === 'probate' ? '#9333ea' : s.signal === 'lien' ? '#f59e0b' : '#64748b';
    const label = PLAIN_ENGLISH[s.description] || s.description;
    const matchBadge = s.matchType === 'confirmed'
      ? '<span style="background:#f0fdf4;color:#16a34a;padding:1px 6px;border-radius:3px;font-size:10px;margin-left:6px">Confirmed</span>'
      : '<span style="background:#fffbeb;color:#d97706;padding:1px 6px;border-radius:3px;font-size:10px;margin-left:6px">Name match — verify</span>';
    return `<div style="padding:6px 0;border-bottom:1px solid #f1f5f9">
      <span style="color:${c};font-weight:600;font-size:14px">${label}</span>${matchBadge}<br>
      <span style="color:#94a3b8;font-size:12px">Filed: ${s.recordDate} ${s.caseNum ? '| Case: ' + s.caseNum : ''} | Inst# ${s.instrumentNum}</span>
    </div>`;
  }).join('') || '<div style="color:#94a3b8;padding:6px 0">No court filings found for this owner (2024-2025)</div>';

  // Reasons
  const reasonsHTML = (fs2.reasons || []).map(r => `<li style="margin:3px 0">${r}</li>`).join('');

  // Permits
  const permitList = (permits.recentPermits || []).slice(0, 3).map(p =>
    `<li>${p.description || p.ApplicationDescription || p.TYPE || '?'}</li>`
  ).join('');

  // Map
  const osmUrl = lat && lng ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.006},${lat - 0.004},${lng + 0.006},${lat + 0.004}&layer=mapnik&marker=${lat},${lng}` : '';
  const gmapUrl = lat && lng ? `https://www.google.com/maps/place/${encodeURIComponent((p.address || '') + ', ' + (p.city || '') + ', FL ' + (p.zip || ''))}` : '#';

  // Property photos from Broward County Property Appraiser
  const folio = p.folio || parcelId || '';
  let bcpaUrl = folio.length >= 10 ? `https://bcpa.net/Photographs.asp?Folio=${folio}` : '';
  const photos = await fetchBCPAPhotos(folio);
  const photoUrl = photos.length > 0 ? photos[0].url : '';
  const photoDate = photos.length > 0 ? photos[0].date : '';
  const photoCount = photos.length;

  // Sales history
  const salesHTML = (inv.salesHistory || []).map(s =>
    `<div style="font-size:13px;padding:2px 0"><strong>${s.date || '?'}</strong> — $${(s.price || 0).toLocaleString()}</div>`
  ).join('');

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.address || parcelId} — Rootz Property Intelligence</title>
<meta name="description" content="Property intelligence: ${p.address}, ${p.city} FL. Farming score ${fs2.score}/100.">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.5}
.c{max-width:840px;margin:0 auto;padding:16px}
.hdr{background:linear-gradient(135deg,#1e3a5f 0%,#0f766e 100%);color:#fff;padding:24px;border-radius:12px 12px 0 0}
.hdr h1{font-size:15px;opacity:.8;font-weight:400;margin-bottom:2px}
.hdr .addr{font-size:26px;font-weight:700;letter-spacing:-.5px}
.hdr .sub{opacity:.75;font-size:13px;margin-top:6px}
.sb{display:flex;align-items:center;gap:16px;background:#fff;padding:16px 24px;border-bottom:3px solid ${scoreColor};box-shadow:0 2px 8px rgba(0,0,0,.06)}
.sn{font-size:48px;font-weight:800;color:${scoreColor};line-height:1}
.sl{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}
.sr{font-size:15px;font-weight:700;color:${scoreColor}}
.cd{background:#fff;border-radius:8px;margin:10px 0;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.cd h2{font-size:13px;color:#1e3a5f;margin-bottom:10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.gi .lb{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
.gi .vl{font-size:14px;font-weight:600}
.bv{font-size:20px;font-weight:700;color:#1e3a5f}
.mf{width:100%;height:250px;border:none;border-radius:8px}
.pv{background:#f1f5f9;border-radius:8px;padding:12px;margin-top:10px;font-size:11px;color:#64748b}
.pv code{background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:10px}
.ft{text-align:center;padding:16px;color:#94a3b8;font-size:11px}
.ft a{color:#0f766e;text-decoration:none}
a{color:#0f766e;text-decoration:none}a:hover{text-decoration:underline}
ul{padding-left:16px}
@media(max-width:600px){.g2,.g3{grid-template-columns:1fr}.hdr .addr{font-size:20px}.sn{font-size:36px}}
</style>
</head><body>
<div class="c">

<div class="hdr">
  <h1>Rootz Property Intelligence</h1>
  <div class="addr">${p.address || '?'}</div>
  <div class="sub">${p.city || '?'}, ${p.state || 'FL'} ${p.zip || ''} &bull; ${dorDesc} &bull; Folio: ${p.folio || parcelId}</div>
</div>

<div class="sb">
  <div><div class="sn">${fs2.score ?? '?'}</div><div class="sl">Farming Score</div></div>
  <div style="flex:1">
    <div class="sr">${fs2.rating || '?'} LISTING PROBABILITY</div>
    <div style="font-size:12px;color:#64748b;margin-top:2px">${fs2.signalCount || 0} signals &bull; ${cr.totalFilings || 0} court filings</div>
  </div>
</div>

${bcpaUrl || osmUrl ? `<div class="cd" style="padding:0;overflow:hidden">
  <div style="display:flex;gap:0">
    ${photoUrl ? `<div style="flex:3;min-width:0;position:relative">
      <a href="${bcpaUrl}" target="_blank">
        <img src="${photoUrl}" style="width:100%;height:300px;object-fit:cover" alt="Property Photo — Broward County Property Appraiser">
      </a>
      <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.7));padding:8px 12px;color:#fff;font-size:11px;display:flex;justify-content:space-between">
        <span>Photo: Broward County Property Appraiser${photoDate ? ' &bull; ' + photoDate : ''}</span>
        <span>${photoCount > 1 ? photoCount + ' photos available' : ''}</span>
      </div>
    </div>` : bcpaUrl ? `<div style="flex:3;min-width:0;background:#f1f5f9;display:flex;align-items:center;justify-content:center;height:300px">
      <div style="text-align:center;color:#94a3b8;padding:20px">
        <div style="font-size:36px;margin-bottom:8px">&#x1f3e0;</div>
        <a href="${bcpaUrl}" target="_blank" style="color:#0f766e;font-weight:600">View Property Photos (BCPA) &rarr;</a>
      </div>
    </div>` : ''}
    ${osmUrl ? `<div style="flex:2;min-width:0">
      <iframe src="${osmUrl}" style="width:100%;height:300px;border:none" loading="lazy" title="Map"></iframe>
    </div>` : ''}
  </div>
  <div style="padding:8px 14px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:11px;color:#94a3b8"><a href="${bcpaUrl}" target="_blank">More Photos (BCPA) &rarr;</a></span>
    <a href="${gmapUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#1e3a5f;color:#fff;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none">&#x1f4cd; View on Google Maps &amp; Street View</a>
    ${lat && lng ? `<span style="font-size:10px;color:#c0c8d0">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>` : ''}
  </div>
</div>` : osmUrl ? `<div class="cd" style="padding:0;overflow:hidden">
  <iframe src="${osmUrl}" class="mf" loading="lazy" title="Map"></iframe>
  <div style="padding:6px 14px;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between">
    <a href="${gmapUrl}" target="_blank">Google Maps &rarr;</a>
    ${lat && lng ? `<span>${lat.toFixed(4)}, ${lng.toFixed(4)}</span>` : ''}
  </div>
</div>` : ''}

<div class="cd">
  <h2>Property</h2>
  <div class="g3">
    <div class="gi"><div class="lb">Assessed Value</div><div class="bv">${displayValue > 0 ? '$' + displayValue.toLocaleString() : 'N/A'}</div></div>
    <div class="gi"><div class="lb">Land</div><div class="vl">${landValue > 0 ? '$' + landValue.toLocaleString() : '—'}</div></div>
    <div class="gi"><div class="lb">Building</div><div class="vl">${bldgValue > 0 ? '$' + bldgValue.toLocaleString() : '—'}</div></div>
  </div>
  <div class="g2" style="margin-top:10px">
    <div class="gi"><div class="lb">Type</div><div class="vl">${dorDesc}</div></div>
    <div class="gi"><div class="lb">Year Built</div><div class="vl">${p.building?.yearBuilt || '?'}</div></div>
    <div class="gi"><div class="lb">Living Area</div><div class="vl">${(p.building?.heatedArea || 0) > 0 ? p.building.heatedArea.toLocaleString() + ' sqft' : '—'}</div></div>
    <div class="gi"><div class="lb">Lot Size</div><div class="vl">${(p.lot?.size || 0) > 0 ? (p.lot.size >= 43560 ? (p.lot.size / 43560).toFixed(2) + ' acres' : p.lot.size.toLocaleString() + ' sqft') : '—'}</div></div>
    ${(p.building?.bedrooms || 0) > 0 ? `<div class="gi"><div class="lb">Bedrooms</div><div class="vl">${p.building.bedrooms}</div></div>` : ''}
    ${(p.building?.bathrooms || 0) > 0 ? `<div class="gi"><div class="lb">Bathrooms</div><div class="vl">${p.building.bathrooms}</div></div>` : ''}
  </div>
  ${salesHTML ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0"><div class="lb" style="margin-bottom:4px">Sales History</div>${salesHTML}</div>` : ''}
</div>

<div class="cd">
  <h2>Why This Is a Farming Prospect</h2>
  <ul style="font-size:13px">${reasonsHTML || '<li>No farming signals detected</li>'}</ul>
</div>

<div class="cd">
  <h2>Owner</h2>
  <div class="g2">
    <div class="gi"><div class="lb">Owner</div><div class="vl">${p.owner?.name1 || '?'}</div></div>
    <div class="gi"><div class="lb">Owner 2</div><div class="vl">${p.owner?.name2?.trim() || '\u2014'}</div></div>
    <div class="gi"><div class="lb">Owner Occupied</div><div class="vl">${inv.ownerOccupied ? '\u2705 Yes' : '\u274c No \u2014 Absentee'}</div></div>
    <div class="gi"><div class="lb">Out of State</div><div class="vl">${inv.outOfStateOwner ? '\u274c Yes' : '\u2705 No'}</div></div>
    <div class="gi"><div class="lb">Corporate/LLC</div><div class="vl">${inv.corporateOwner ? '\ud83c\udfe2 Yes' : 'No'}</div></div>
    <div class="gi"><div class="lb">Homestead</div><div class="vl">${inv.homesteadExemption ? '\u2705 Yes' : '\u274c No'}</div></div>
  </div>
  ${inv.ownerLookupUrl ? `<div style="margin-top:8px"><a href="${inv.ownerLookupUrl}" target="_blank">\ud83d\udd0d Owner Lookup &rarr;</a></div>` : ''}
</div>

<div class="cd">
  <h2>Court Records \u2014 Broward County Clerk</h2>
  ${courtHTML}
  ${cr.provenance ? `<div style="font-size:10px;color:#94a3b8;margin-top:6px">Source: ${cr.provenance.source} | ${cr.provenance.method} | ${cr.provenance.coverage}</div>` : ''}
</div>

<div class="cd">
  <h2>Neighborhood</h2>
  <div class="g2">
    <div class="gi">
      <div class="lb">Flood Zone</div>
      <div class="vl" style="color:${floodColor}">${flood.zone || '?'} ${flood.zone === 'X' ? '(Minimal Risk)' : flood.zone === 'AE' ? '(High Risk \u26a0\ufe0f)' : flood.zone === 'VE' ? '(Coastal \u26a0\ufe0f)' : ''}</div>
      ${data.elevation?.elevationFt ? `<div style="font-size:11px;color:#64748b">Elevation: ${data.elevation.elevationFt} ft${flood.baseFloodElevation ? ' | BFE: ' + flood.baseFloodElevation + ' ft' : ''}</div>` : ''}
      ${flood.zone && flood.zone !== 'X' && flood.zone !== 'UNKNOWN' ? '<div style="font-size:11px;color:#dc2626;margin-top:2px">Flood insurance required. Est. $2-4K/yr extra.</div>' : ''}
    </div>
    <div class="gi">
      <div class="lb">Demographics</div>
      ${demos.medianHouseholdIncome ? `<div class="vl">$${demos.medianHouseholdIncome.toLocaleString()} median income</div>` : ''}
      ${demos.medianHomeValue ? `<div style="font-size:12px;color:#64748b">$${demos.medianHomeValue.toLocaleString()} median home</div>` : '<div class="vl" style="color:#94a3b8">Census data loading...</div>'}
    </div>
  </div>
  ${schoolList ? `<div style="margin-top:10px"><div class="lb">Nearby Schools</div><ul style="font-size:12px;margin-top:4px">${schoolList}</ul></div>` : ''}
  ${permitList ? `<div style="margin-top:10px"><div class="lb">Recent Building Permits</div><ul style="font-size:12px;margin-top:4px">${permitList}</ul></div>` : `<div style="margin-top:10px"><div class="lb">Building Permits</div><div style="font-size:12px;color:#64748b">${permits.count || 0} on record</div></div>`}
</div>

<div class="pv">
  <strong>Data Provenance</strong> \u2014 Every data point traced to source<br>
  Hash: <code>${data.origin?.documentHash?.slice(0, 16) || '?'}...</code> | ${(data.origin?.sources || []).length} sources | Confidence: ${((data.origin?.confidence || 0) * 100).toFixed(0)}%
</div>

<div class="ft">
  <strong>Rootz Property Intelligence</strong> \u2014 Government data with cryptographic proof<br>
  <a href="https://title.rootz.global">title.rootz.global</a>
</div>

</div></body></html>`;
}
