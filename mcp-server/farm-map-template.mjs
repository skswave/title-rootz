// Farm Map Template — neighborhood farming map with scored pins
// Shows multiple prospects on a map, click to drill into property intelligence page

export function renderFarmMap(prospects, city, zip, center) {
  const total = prospects.length;
  const high = prospects.filter(p => p.score >= 60).length;
  const med = prospects.filter(p => p.score >= 40 && p.score < 60).length;
  const low = prospects.filter(p => p.score < 40).length;

  // Build marker data for the map (limit to 100 for performance)
  const markers = prospects.slice(0, 100).map((p, i) => {
    const color = p.score >= 60 ? 'red' : p.score >= 40 ? 'orange' : 'green';
    const signals = p.signals?.length ? p.signals.join(', ') : (p.absentee ? 'absentee' : '') + (p.corp ? ' corporate' : '');
    return {
      address: p.address,
      owner: p.owner,
      value: p.value,
      score: p.score,
      color,
      signals: signals.trim(),
      searchUrl: `/p/farm?address=${encodeURIComponent(p.address)}&city=${encodeURIComponent(city.replace(/_/g, ' '))}`
    };
  });

  const markersJson = JSON.stringify(markers);

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Farm Map — ${city.replace(/_/g, ' ')}${zip ? ' ' + zip : ''} | Rootz</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b}
.hdr{background:linear-gradient(135deg,#1e3a5f 0%,#0f766e 100%);color:#fff;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.hdr h1{font-size:20px;font-weight:700}
.hdr .sub{font-size:13px;opacity:.8}
.stats{display:flex;gap:16px;flex-wrap:wrap}
.stat{text-align:center}
.stat .n{font-size:24px;font-weight:800}
.stat .l{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.5px}
.pill{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}
.pill-r{background:#fef2f2;color:#dc2626}.pill-y{background:#fffbeb;color:#d97706}.pill-g{background:#f0fdf4;color:#16a34a}
#map{width:100%;height:calc(100vh - 200px);min-height:400px}
.legend{position:absolute;bottom:30px;right:10px;background:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.15);z-index:1000;font-size:12px}
.legend div{margin:3px 0;display:flex;align-items:center;gap:6px}
.legend .dot{width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.list{max-width:900px;margin:0 auto;padding:16px}
.prop{background:#fff;border-radius:8px;padding:14px;margin:8px 0;box-shadow:0 1px 3px rgba(0,0,0,.06);display:flex;align-items:center;gap:14px;cursor:pointer;transition:box-shadow .2s}
.prop:hover{box-shadow:0 4px 12px rgba(0,0,0,.12)}
.prop .sc{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:#fff;flex-shrink:0}
.prop .info{flex:1;min-width:0}
.prop .addr{font-weight:600;font-size:14px}
.prop .det{font-size:12px;color:#64748b;margin-top:2px}
.prop .val{font-weight:700;font-size:15px;text-align:right}
.ft{text-align:center;padding:16px;color:#94a3b8;font-size:11px}
.ft a{color:#0f766e;text-decoration:none}
</style>
</head><body>

<div class="hdr">
  <div>
    <h1>\u{1f3af} Farm Map — ${city.replace(/_/g, ' ')}${zip ? ', ' + zip : ''}</h1>
    <div class="sub">Rootz Property Intelligence &bull; ${total} farming prospects</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="n" style="color:#ff6b6b">${high}</div><div class="l">High Score</div></div>
    <div class="stat"><div class="n" style="color:#fbbf24">${med}</div><div class="l">Medium</div></div>
    <div class="stat"><div class="n" style="color:#34d399">${low}</div><div class="l">Low</div></div>
    <div class="stat"><div class="n">${total}</div><div class="l">Total</div></div>
  </div>
</div>

<div id="map"></div>

<div class="list">
  <h2 style="font-size:16px;color:#1e3a5f;margin:16px 0 8px;border-bottom:2px solid #e2e8f0;padding-bottom:6px">TOP FARMING PROSPECTS</h2>
  ${markers.slice(0, 30).map(m => `
    <a href="${m.searchUrl}" style="text-decoration:none;color:inherit">
      <div class="prop">
        <div class="sc" style="background:${m.color === 'red' ? '#dc2626' : m.color === 'orange' ? '#f59e0b' : '#22c55e'}">${m.score}</div>
        <div class="info">
          <div class="addr">${m.address}</div>
          <div class="det">${m.owner}${m.signals ? ' \u2022 ' + m.signals : ''}</div>
        </div>
        <div class="val">${m.value > 0 ? '$' + m.value.toLocaleString() : ''}</div>
      </div>
    </a>
  `).join('')}
</div>

<div class="ft">
  <strong>Rootz Property Intelligence</strong> \u2014 Government data with cryptographic proof<br>
  <a href="https://title.rootz.global">title.rootz.global</a> &bull; Click any property to see full intelligence page
</div>

<script>
const markers = ${markersJson};
const map = L.map('map').setView([${center?.lat || 26.12}, ${center?.lng || -80.14}], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add legend
const legend = L.control({position: 'bottomright'});
legend.onAdd = function() {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = '<strong>Farming Score</strong>' +
    '<div><span class="dot" style="background:#dc2626"></span> 60+ High</div>' +
    '<div><span class="dot" style="background:#f59e0b"></span> 40-59 Medium</div>' +
    '<div><span class="dot" style="background:#22c55e"></span> 20-39 Low</div>';
  return div;
};
legend.addTo(map);

// Geocode and place markers (using Nominatim with delays)
let placed = 0;
const bounds = [];

async function geocodeAndPlace(m, idx) {
  try {
    const q = encodeURIComponent(m.address + ', ${city.replace(/_/g, ' ')}, FL');
    const resp = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + q + '&limit=1', {
      headers: {'User-Agent': 'RootzFarming/1.0'}
    });
    const data = await resp.json();
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const color = m.score >= 60 ? '#dc2626' : m.score >= 40 ? '#f59e0b' : '#22c55e';
      const size = m.score >= 60 ? 14 : m.score >= 40 ? 10 : 7;
      const marker = L.circleMarker([lat, lng], {
        radius: size,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.85
      }).addTo(map);
      marker.bindPopup(
        '<div style="min-width:200px">' +
        '<strong>' + m.address + '</strong><br>' +
        '<span style="font-size:20px;font-weight:800;color:' + color + '">' + m.score + '</span> Farming Score<br>' +
        'Owner: ' + m.owner + '<br>' +
        (m.value > 0 ? 'Value: $' + m.value.toLocaleString() + '<br>' : '') +
        (m.signals ? 'Signals: ' + m.signals + '<br>' : '') +
        '<br><a href="' + m.searchUrl + '" style="color:#0f766e;font-weight:600">View Full Intelligence &rarr;</a>' +
        '</div>'
      );
      bounds.push([lat, lng]);
      placed++;
      if (placed === markers.length || placed % 10 === 0) {
        if (bounds.length > 1) map.fitBounds(bounds, {padding: [30, 30]});
      }
    }
  } catch(e) {}
}

// Stagger geocoding requests (Nominatim rate limit: 1/sec)
markers.forEach((m, i) => {
  setTimeout(() => geocodeAndPlace(m, i), i * 1100);
});
</script>

</body></html>`;
}
