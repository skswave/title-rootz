/**
 * AI_CONTEXT: Socrata SODA API transport.
 * Pulls records from open data portals (Orlando, NYC, etc).
 *
 * Exports:
 *   - pull(source, options) — returns array of raw records
 */

export async function pull(source, options = {}) {
  const { endpoint, pagination = {} } = source;
  const batchSize = pagination.batchSize || 5000;
  const delay = pagination.delay || 200;
  const maxRecords = options.limit || Infinity;
  const appToken = source.appToken || process.env.SOCRATA_APP_TOKEN || '';

  const records = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore && records.length < maxRecords) {
    const limit = Math.min(batchSize, maxRecords - records.length);
    const url = `${endpoint}?$limit=${limit}&$offset=${offset}&$order=:id`;

    const headers = {};
    if (appToken) headers['X-App-Token'] = appToken;

    const resp = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
    if (!resp.ok) throw new Error(`Socrata error ${resp.status}: ${await resp.text()}`);

    const data = await resp.json();
    if (data.length === 0) {
      hasMore = false;
    } else {
      records.push(...data);
      offset += data.length;
      if (data.length < batchSize) hasMore = false;
    }

    if (hasMore && delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return records;
}
