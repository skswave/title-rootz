#!/usr/bin/env node
// Pull Ohio counties using OBJECTID range queries (most compatible)
import fs from 'fs';

const DATA_DIR = '/var/www/title.rootz.global/data/ohio';

const counties = [
  {
    id: 'cuyahoga', name: 'Cuyahoga (Cleveland)', expected: 500000,
    url: 'https://gis.cuyahogacounty.us/server/rest/services/CCFO/APPRAISAL_PARCELS_CAMA_WGS84/MapServer/2',
    fields: 'OBJECTID,PARCELPIN,parcel_owner,second_owner,par_addr_all,par_city,par_zip,mail_addr_all,certified_tax_total,tax_market_total,tax_market_land,tax_market_bldg,last_sales_amount,last_transfer_date,property_class,zoning_code,homestead_flag,foreclosure_flag,total_res_liv_area,year_built_str,occupancy_cd,land_use_code,county_assessment,num_bedrooms,num_full_baths,num_half_baths,num_rooms,num_fireplaces,basement_code,air_conditioning_code',
    batch: 5000
  },
  {
    id: 'hamilton', name: 'Hamilton (Cincinnati)', expected: 350000,
    url: 'https://cagisonline.hamilton-co.org/arcgis/rest/services/COUNTYWIDE/HCE_Parcels_With_Auditor_Data/MapServer/0',
    fields: '*', batch: 1000
  },
  {
    id: 'summit', name: 'Summit (Akron)', expected: 250000,
    url: 'https://scgis.summitoh.net/hosted/rest/services/parcels_web_GEODATA_Tax_Parcels/FeatureServer/0',
    fields: '*', batch: 3000
  },
  {
    id: 'montgomery', name: 'Montgomery (Dayton)', expected: 250000,
    url: 'https://gis.mcohio.org/server/rest/services/VantagePoints/AUDGIS_B1/MapServer/7',
    fields: '*', batch: 2000
  }
];

async function pullCounty(county) {
  console.log(`\nPulling: ${county.name}`);
  const outFile = `${DATA_DIR}/${county.id}-parcels.jsonl`;
  const stream = fs.createWriteStream(outFile);
  let oidStart = 0;
  let total = 0;
  let emptyBatches = 0;
  const start = Date.now();

  // Use OBJECTID range queries: WHERE OBJECTID > X AND OBJECTID <= X+batch
  while (emptyBatches < 3) {
    const oidEnd = oidStart + county.batch;
    const where = `OBJECTID>${oidStart} AND OBJECTID<=${oidEnd}`;

    try {
      const params = new URLSearchParams({
        where,
        outFields: county.fields,
        returnGeometry: 'false',
        f: 'json'
      });

      const r = await fetch(`${county.url}/query?${params}`, { signal: AbortSignal.timeout(60000) });
      const d = await r.json();

      if (d.error) {
        console.log(`  Error at OID ${oidStart}: ${d.error.message}`);
        emptyBatches++;
        oidStart = oidEnd;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const feats = d.features || [];
      if (feats.length === 0) {
        emptyBatches++;
      } else {
        emptyBatches = 0;
        for (const f of feats) {
          stream.write(JSON.stringify(f.attributes) + '\n');
        }
        total += feats.length;
      }

      oidStart = oidEnd;

      if (total % 30000 < county.batch || feats.length > 0 && total % 10000 < county.batch) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(0);
        const rate = total > 0 ? (total / ((Date.now() - start) / 1000)).toFixed(0) : '0';
        console.log(`  ${total.toLocaleString()} records | ${elapsed}s | ${rate}/s | OID range: ${oidStart}`);
      }

      // Safety cap
      if (oidStart > county.expected * 3) {
        console.log(`  OID range exceeded expected. Stopping.`);
        break;
      }

      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.log(`  Fetch error: ${e.message}`);
      oidStart = oidEnd;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  stream.end();
  const mb = fs.existsSync(outFile) ? (fs.statSync(outFile).size / 1024 / 1024).toFixed(1) : '0';
  console.log(`  Done: ${total.toLocaleString()} records (${mb}MB) in ${((Date.now() - start) / 60000).toFixed(1)}min`);
  return total;
}

(async () => {
  const results = {};
  for (const county of counties) {
    results[county.id] = await pullCounty(county);
  }

  console.log('\n=== OHIO COUNTY PULL SUMMARY ===');
  let grandTotal = 0;
  for (const [id, count] of Object.entries(results)) {
    const f = `${DATA_DIR}/${id}-parcels.jsonl`;
    const mb = fs.existsSync(f) ? (fs.statSync(f).size / 1024 / 1024).toFixed(1) : '0';
    console.log(`  ${id}: ${count.toLocaleString()} records (${mb}MB)`);
    grandTotal += count;
  }
  console.log(`  TOTAL: ${grandTotal.toLocaleString()} records`);
  console.log(`  + Franklin: 493,866 (already pulled)`);
  console.log(`  = ${(grandTotal + 493866).toLocaleString()} total Ohio parcels`);
})();
