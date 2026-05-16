#!/usr/bin/env node
/**
 * AI_CONTEXT: Harvester Framework — stateless recipe-driven data ingestion.
 * Loads a recipe (JSON config), pulls from source, transforms, loads to data lake.
 *
 * Usage:
 *   node ingest/harvester.js --recipe fl-permits-miami-dade
 *   node ingest/harvester.js --recipe fl-permits-miami-dade --test
 *   node ingest/harvester.js --state FL
 *   node ingest/harvester.js --scheduled
 *   node ingest/harvester.js --status
 *
 * Exports:
 *   - runRecipe(recipeId, options) — run a single recipe
 *   - runAll(filter) — run all matching recipes
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_DIR = path.join(__dirname, 'recipes');

// ─── Transport registry ──────────────────────────────────────
const transports = {};

async function loadTransport(name) {
  if (transports[name]) return transports[name];
  const mod = await import(`./transports/${name}.js`);
  transports[name] = mod;
  return mod;
}

// ─── Transform registry ──────────────────────────────────────
const transforms = {};

async function loadTransform(name) {
  if (transforms[name]) return transforms[name];
  const mod = await import(`./transforms/${name}.js`);
  transforms[name] = mod;
  return mod;
}

// ─── Loader registry ─────────────────────────────────────────
const loaders = {};

async function loadLoader(name) {
  if (loaders[name]) return loaders[name];
  const mod = await import(`./loaders/${name}.js`);
  loaders[name] = mod;
  return mod;
}

// ─── Recipe loading ──────────────────────────────────────────
function loadRecipe(recipeId) {
  const filePath = path.join(RECIPES_DIR, `${recipeId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Recipe not found: ${recipeId} (looked at ${filePath})`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listRecipes() {
  if (!fs.existsSync(RECIPES_DIR)) return [];
  return fs.readdirSync(RECIPES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const recipe = JSON.parse(fs.readFileSync(path.join(RECIPES_DIR, f), 'utf8'));
      return { id: recipe.id, name: recipe.name, transport: recipe.transport, schedule: recipe.schedule, lastRun: recipe.lastRun, recordCount: recipe.recordCount };
    });
}

// ─── Core runner ─────────────────────────────────────────────
export async function runRecipe(recipeId, options = {}) {
  const recipe = loadRecipe(recipeId);
  const startTime = Date.now();
  const testMode = options.test || false;
  const limit = testMode ? 10 : undefined;

  console.log(`\n  Harvester: ${recipe.name}`);
  console.log(`  Transport: ${recipe.transport} | Transform: ${recipe.transform} | Loader: ${recipe.loader}`);
  if (testMode) console.log(`  TEST MODE — pulling max 10 records`);

  try {
    // 1. Pull raw data from source
    const transport = await loadTransport(recipe.transport);
    const rawRecords = await transport.pull(recipe.source, { limit, fieldMapping: recipe.fieldMapping });
    console.log(`  Pulled: ${rawRecords.length} records`);

    // 2. Transform to standard schema
    const transform = await loadTransform(recipe.transform);
    const transformed = rawRecords.map(r => transform.normalize(r, recipe.fieldMapping));
    console.log(`  Transformed: ${transformed.length} records`);

    // 3. Load into data lake
    if (!testMode) {
      const loader = await loadLoader(recipe.loader);
      const loadResult = await loader.load(transformed, recipe.output, recipe);
      console.log(`  Loaded: ${loadResult.written} records to ${recipe.output}`);
    } else {
      console.log(`  Test mode — skipping load. First record:`);
      console.log(`    ${JSON.stringify(transformed[0], null, 2).slice(0, 500)}`);
    }

    // 4. Update recipe metadata
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    if (!testMode) {
      recipe.lastRun = new Date().toISOString();
      recipe.recordCount = transformed.length;
      recipe.lastDuration = `${duration}s`;
      fs.writeFileSync(path.join(RECIPES_DIR, `${recipeId}.json`), JSON.stringify(recipe, null, 2));
    }

    console.log(`  Done in ${duration}s\n`);
    return { success: true, records: transformed.length, duration: `${duration}s` };

  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
    return { success: false, error: e.message };
  }
}

export async function runAll(filter = {}) {
  const recipes = listRecipes();
  const results = [];

  for (const r of recipes) {
    if (filter.state && !r.id.startsWith(filter.state.toLowerCase())) continue;
    if (filter.scheduled && !isDue(r)) continue;

    const result = await runRecipe(r.id, filter);
    results.push({ id: r.id, ...result });
  }
  return results;
}

function isDue(recipe) {
  if (!recipe.schedule || !recipe.lastRun) return true;
  // Simple cron check — just check if last run was > 1 day ago for daily, > 7 for weekly
  const lastRun = new Date(recipe.lastRun);
  const hoursSince = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
  if (recipe.schedule.includes('* * 1')) return hoursSince > 168; // weekly
  if (recipe.schedule.includes('* * *')) return hoursSince > 24;  // daily
  return hoursSince > 720; // monthly
}

// ─── CLI ─────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes('--status')) {
  const recipes = listRecipes();
  console.log(`\n  Harvester Status — ${recipes.length} recipes\n`);
  console.log('  ID'.padEnd(35) + 'Transport'.padEnd(12) + 'Last Run'.padEnd(22) + 'Records');
  console.log('  ' + '-'.repeat(80));
  for (const r of recipes) {
    console.log(`  ${r.id.padEnd(33)}${(r.transport || '?').padEnd(12)}${(r.lastRun || 'never').slice(0, 19).padEnd(22)}${r.recordCount ?? '?'}`);
  }
  console.log('');
} else if (args.includes('--recipe')) {
  const recipeId = args[args.indexOf('--recipe') + 1];
  const test = args.includes('--test');
  if (!recipeId) { console.error('  Usage: --recipe <recipe-id>'); process.exit(1); }
  runRecipe(recipeId, { test }).then(r => {
    if (!r.success) process.exit(1);
  });
} else if (args.includes('--state')) {
  const state = args[args.indexOf('--state') + 1];
  runAll({ state });
} else if (args.includes('--scheduled')) {
  runAll({ scheduled: true });
} else {
  console.log(`
  Usage:
    node ingest/harvester.js --recipe <id>          Run one recipe
    node ingest/harvester.js --recipe <id> --test   Pull 10 records (no load)
    node ingest/harvester.js --state FL             Run all FL recipes
    node ingest/harvester.js --scheduled            Run all due recipes
    node ingest/harvester.js --status               Show recipe status
  `);
}
