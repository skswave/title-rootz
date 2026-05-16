/**
 * AI_CONTEXT: Shared configuration — path resolution, port, data directory detection
 *
 * Dependencies: none (Node.js built-ins only)
 * Exports: __dirname, DATA_DIR, PORT, CACHE_DIR, CITIES_DIR
 *
 * All modules import paths from here. Handles the dual-mode path resolution:
 * on the server, data/ is a sibling of src/; locally it may be inside mcp-server/.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is two levels up from src/lib/
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Data directory: prefer data/ in project root, fall back to mcp-server/data/
const DATA_DIR = fs.existsSync(path.join(PROJECT_ROOT, 'data'))
  ? path.join(PROJECT_ROOT, 'data')
  : path.join(PROJECT_ROOT, 'mcp-server', 'data');

const CACHE_DIR = path.join(DATA_DIR, 'cache');
const CITIES_DIR = path.join(DATA_DIR, 'florida', 'cities');
const OHIO_DIR = path.join(DATA_DIR, 'ohio');

const PORT = parseInt(process.env.PORT || '3035', 10);

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export { __dirname, PROJECT_ROOT, DATA_DIR, CACHE_DIR, CITIES_DIR, OHIO_DIR, PORT };
