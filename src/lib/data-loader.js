/**
 * AI_CONTEXT: Cached data file loader for static overlay data
 *
 * Dependencies: src/lib/config.js (DATA_DIR)
 * Exports: loadDataFile
 *
 * Loads JSON or CSV files from data/ directory with in-memory caching.
 * CSV files are returned as raw strings (callers handle their own parsing).
 * JSON files are returned as parsed objects.
 * Used by proximity and overlay functions (schools, hospitals, permits, etc.)
 */

import fs from 'fs';
import path from 'path';
import { DATA_DIR } from './config.js';

const dataCache = {};

/**
 * Load a data file from the data directory, caching in memory.
 * @param {string} relativePath - Path relative to DATA_DIR (e.g., 'florida/schools.json')
 * @returns {any} Parsed JSON object, raw CSV string, or null if file not found
 */
export function loadDataFile(relativePath) {
  if (dataCache[relativePath] !== undefined) return dataCache[relativePath];

  const fullPath = path.join(DATA_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return null;

  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    // CSV files: return raw string — callers handle CSV parsing themselves
    if (relativePath.endsWith('.csv')) {
      dataCache[relativePath] = raw;
      return raw;
    }
    // JSON files: parse and return object
    const data = JSON.parse(raw);
    dataCache[relativePath] = data;
    return data;
  } catch (e) {
    console.error(`Failed to load data file ${relativePath}: ${e.message}`);
    return null;
  }
}
