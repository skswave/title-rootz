#!/usr/bin/env node
// Pull Cuyahoga, Summit, Montgomery using curl (Node fetch re-encodes > < which these servers reject)

import fs from 'fs';
import { execSync } from 'child_process';

const DATA_DIR = '/var/www/title.rootz.global/data/ohio';

const counties = [
  {
    id: 'cuyahoga', name: 'Cuyahoga (Cleveland)', expected: 500000,
    url: 'https://gis.cuyahogacounty.us/server/rest/services/CCFO/APPRAISAL_PARCELS_CAMA_WGS84/MapServer/2/query',
    fields: 'OBJECTID,PARCELPIN,parcel_owner,second_owner,par_addr_all,par_city,par_zip,mail_addr_all,certified_tax_total,tax_market_total,tax_market_land,tax_market_bldg,last_sales_amount,last_transfer_date,property_class,zoning_code,homestead_flag,foreclosure_flag,total_res_liv_area,year_built_str,occupancy_cd,land_use_code,county_assessment,num_bedrooms,num_full_baths,num_half_baths,num_rooms,num_fireplaces,basement_code,air_conditioning_code',
    batch: 5000
  },
  {
    id: 'summit', name: 'Summit (Akron)', expected: 250000,
    url: 'https://scgis.summitoh.net/hosted/rest/services/parcels_web_GEODATA_Tax_Parcels/FeatureServer/0/query',
    fields: '*',
    batch: 3000
  },
  {
    id: 'montgomery', name: 'Montgomery (Dayton)', expected: 250000,
    url: 'https://gis.mcohio.org/server/rest/services/VantagePoints/AUDGIS_B1/MapServer/7/query',
    fields: '*',
    batch: 2000
  }
];

function curlFetch(url) {
  try {
    const result = execSync(`curl -s --max-time 60 "${url}"`, { maxBuffer: 50 * 1024 * 1024 });
    return JSON.parse(result.toString());
  } catch (e) {
    return { error: { message: e.message.substring(0, 200) } };
  }
}

function pullCounty(county) {
  console.log(`\nPulling: ${county.name}`);
  const outFile = `${DATA_DIR}/${county.id}-parcels.jsonl`;
  const stream = fs.createWriteStream(outFile);
  let oidStart = 0;
  let total = 0;
  let emptyRuns = 0;
  const start = Date.now();

  while (emptyRuns < 5) {
    const oidEnd = oidStart + county.batch;
    // Build URL with literal > <= (curl won't re-encode)
    const url = `${county.url}?where=OBJECTID+%3E+${oidStart}+AND+OBJECTID+%3C%3D+${oidEnd}&outFields=${county.fields === '*' ? '*' : encodeURIComponent(county.fields)}&returnGeometry=false&f=json`;

    const d = curlFetch(url);

    if (d.error) {
      emptyRuns++;
      oidStart = oidEnd;
      continue;
    }

    const feats = d.features || [];
    if (feats.length === 0) {
      emptyRuns++;
    } else {
      emptyRuns = 0;
      for (const f of feats) {
        stream.write(JSON.stringify(f.attributes) + '\n');
      }
      total += feats.length;
    }

    oidStart = oidEnd;

    if (total > 0 && total % 30000 < county.batch) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      const rate = (total / ((Date.now() - start) / 1000)).toFixed(0);
      console.log(`  ${total.toLocaleString()} records | ${elapsed}s | ${rate}/s | OID: ${oidStart}`);
    }

    if (oidStart > county.expected * 3) break;
  }

  stream.end();
  const mb = fs.existsSync(outFile) ? (fs.statSync(outFile).size / 1024 / 1024).toFixed(1) : '0';
  console.log(`  Done: ${total.toLocaleString()} records (${mb}MB) in ${((Date.now() - start) / 60000).toFixed(1)}min`);
  return total;
}

console.log('Ohio Remaining Counties — curl-based pull');
console.log('='.repeat(50));

const results = {};
for (const county of counties) {
  results[county.id] = pullCounty(county);
}

console.log('\n=== SUMMARY ===');
let grandTotal = 0;
for (const [id, count] of Object.entries(results)) {
  console.log(`  ${id}: ${count.toLocaleString()}`);
  grandTotal += count;
}
console.log(`  + Franklin (493,866) + Hamilton (329,092)`);
console.log(`  = ${(grandTotal + 493866 + 329092).toLocaleString()} total OH parcels`);
