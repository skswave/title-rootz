/**
 * AI_CONTEXT: HTTP CSV/Excel download transport.
 * Downloads and parses CSV files from HTTP endpoints.
 *
 * Exports:
 *   - pull(source, options) — returns array of parsed row objects
 */

export async function pull(source, options = {}) {
  const { url, headers = {}, delimiter = ',' } = source;
  const maxRecords = options.limit || Infinity;

  const resp = await fetch(url, { headers, signal: AbortSignal.timeout(60000) });
  if (!resp.ok) throw new Error(`Download error ${resp.status}: ${resp.statusText}`);

  const text = await resp.text();
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const cols = parseCSVLine(headerLine, delimiter);

  // Parse rows
  const records = [];
  for (let i = 1; i < lines.length && records.length < maxRecords; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const row = {};
    for (let j = 0; j < cols.length; j++) {
      row[cols[j]] = values[j] || '';
    }
    records.push(row);
  }

  return records;
}

function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
