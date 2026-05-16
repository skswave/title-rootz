/**
 * AI_CONTEXT: JSONL city-indexed loader.
 * Writes records to city-indexed JSONL files (one file per city).
 * Pattern: data/florida/cities/{city}.jsonl
 *
 * Exports:
 *   - load(records, outputPath, recipe) — writes to JSONL, returns { written }
 */
import fs from 'fs';
import path from 'path';

export async function load(records, outputPath, recipe = {}) {
  // If outputPath is a single file, write all records there
  if (outputPath.endsWith('.jsonl')) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const lines = records.map(r => JSON.stringify(r)).join('\n') + '\n';
    fs.writeFileSync(outputPath, lines);
    return { written: records.length, file: outputPath };
  }

  // Otherwise, index by city
  const byCity = {};
  for (const r of records) {
    const city = (r.city || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (!byCity[city]) byCity[city] = [];
    byCity[city].push(r);
  }

  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

  let total = 0;
  for (const [city, cityRecords] of Object.entries(byCity)) {
    const filePath = path.join(outputPath, `${city}.jsonl`);
    const lines = cityRecords.map(r => JSON.stringify(r)).join('\n') + '\n';
    fs.appendFileSync(filePath, lines);
    total += cityRecords.length;
  }

  return { written: total, cities: Object.keys(byCity).length };
}
