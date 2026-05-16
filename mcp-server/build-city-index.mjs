#!/usr/bin/env node
// Build city-level index from statewide parcel JSONL
// Splits 11GB statewide file into per-city JSONL files for fast grep
// Output: data/florida/cities/{CITY_NAME}.jsonl

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATEWIDE = path.join(__dirname, 'data', 'florida', 'statewide-parcels.jsonl');
const CITY_DIR = path.join(__dirname, 'data', 'florida', 'cities');

async function main() {
  console.log('Building city index from statewide parcels...');
  console.log(`Source: ${STATEWIDE}`);
  console.log(`Output: ${CITY_DIR}/`);

  if (!fs.existsSync(STATEWIDE)) {
    console.error('Statewide file not found!');
    process.exit(1);
  }

  // Clean output dir
  if (fs.existsSync(CITY_DIR)) {
    fs.rmSync(CITY_DIR, { recursive: true });
  }
  fs.mkdirSync(CITY_DIR, { recursive: true });

  const rl = readline.createInterface({
    input: fs.createReadStream(STATEWIDE),
    crlfDelay: Infinity
  });

  const cityStreams = {};
  const cityCounts = {};
  let total = 0;
  let noCity = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    total++;

    try {
      const rec = JSON.parse(line);
      let city = (rec.PHY_CITY || '').trim().toUpperCase();
      if (!city) {
        city = '_UNKNOWN';
        noCity++;
      }

      // Sanitize city name for filename
      const safeCity = city.replace(/[^A-Z0-9 ]/g, '').replace(/ +/g, '_');

      if (!cityStreams[safeCity]) {
        cityStreams[safeCity] = fs.createWriteStream(path.join(CITY_DIR, `${safeCity}.jsonl`));
        cityCounts[safeCity] = 0;
      }

      cityStreams[safeCity].write(line + '\n');
      cityCounts[safeCity]++;

      if (total % 500000 === 0) {
        console.log(`  ${(total / 1e6).toFixed(1)}M records, ${Object.keys(cityStreams).length} cities`);
      }
    } catch {
      // skip bad lines
    }
  }

  // Close all streams
  for (const stream of Object.values(cityStreams)) {
    stream.end();
  }

  // Sort cities by count
  const sorted = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);

  console.log(`\nComplete!`);
  console.log(`  Total records: ${total.toLocaleString()}`);
  console.log(`  Cities: ${sorted.length}`);
  console.log(`  No city: ${noCity.toLocaleString()}`);
  console.log(`\nTop 20 cities:`);
  for (const [city, count] of sorted.slice(0, 20)) {
    const filePath = path.join(CITY_DIR, `${city}.jsonl`);
    const size = fs.existsSync(filePath) ? (fs.statSync(filePath).size / 1024 / 1024).toFixed(1) : '?';
    console.log(`  ${city}: ${count.toLocaleString()} parcels (${size}MB)`);
  }

  // Save index file
  const index = sorted.map(([city, count]) => ({ city, count }));
  fs.writeFileSync(path.join(CITY_DIR, '_index.json'), JSON.stringify(index, null, 2));
  console.log(`\nIndex saved to ${CITY_DIR}/_index.json`);
}

main().catch(console.error);
