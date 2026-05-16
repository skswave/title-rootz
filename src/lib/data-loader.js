/**
 * AI_CONTEXT: Cached JSON file loader for static overlay data
 *
 * Dependencies: src/lib/config.js (DATA_DIR)
 * Exports: loadDataFile
 *
 * Loads JSON files from data/ directory with in-memory caching.
 * Used by proximity and overlay functions (schools, hospitals, permits, etc.)
 */

import fs from 'fs';
import path from 'path';
import { DATA_DIR } from './config.js';

const dataCache = {};

/**
 * Load a JSON file from the data directory, caching in memory.
 * @param {string} relativePath - Path relative to DATA_DIR (e.g., 'florida/schools.json')
 * @returns {any} Parsed JSON data, or null if file not found
 */
export function loadDataFile(relativePath) {
  if (dataCache[relativePath]) return dataCache[relativePath];

  const fullPath = path.join(DATA_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return null;

  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(raw);
    dataCache[relativePath] = data;
    return data;
  } catch (e) {
    console.error(`Failed to load data file ${relativePath}: ${e.message}`);
    return null;
  }
}
