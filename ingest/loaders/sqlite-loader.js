/**
 * AI_CONTEXT: SQLite loader — writes records to SQLite database.
 * Creates table from first record schema if needed.
 *
 * Exports:
 *   - load(records, outputPath, recipe) — inserts into SQLite, returns { written }
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function load(records, outputPath, recipe = {}) {
  if (records.length === 0) return { written: 0 };

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(outputPath);
  db.pragma('journal_mode = WAL');

  const tableName = recipe.table || recipe.id?.replace(/-/g, '_') || 'records';

  // Create table from first record's keys
  const cols = Object.keys(records[0]).filter(k => !k.startsWith('_'));
  const createSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${cols.map(c => `"${c}" TEXT`).join(', ')})`;
  db.exec(createSQL);

  // Insert in batches
  const placeholders = cols.map(() => '?').join(', ');
  const insert = db.prepare(`INSERT INTO ${tableName} (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(...cols.map(c => row[c] ?? null));
    }
  });

  insertMany(records);
  db.close();

  return { written: records.length, table: tableName, db: outputPath };
}
