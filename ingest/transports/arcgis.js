/**
 * AI_CONTEXT: ArcGIS REST FeatureServer transport.
 * Pulls records from ArcGIS with offset pagination.
 * Used by: Miami-Dade permits, Broward permits, Brevard permits, etc.
 *
 * Exports:
 *   - pull(source, options) — returns array of raw records
 */

export async function pull(source, options = {}) {
  const { endpoint, pagination = {} } = source;
  const batchSize = pagination.batchSize || 2000;
  const delay = pagination.delay || 300;
  const maxRecords = options.limit || Infinity;

  const records = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore && records.length < maxRecords) {
    const url = `${endpoint}/query?where=1%3D1&outFields=*&resultOffset=${offset}&resultRecordCount=${Math.min(batchSize, maxRecords - records.length)}&f=json`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!resp.ok) throw new Error(`ArcGIS error ${resp.status}: ${await resp.text()}`);

    const data = await resp.json();
    if (data.error) throw new Error(`ArcGIS API error: ${data.error.message}`);

    const features = data.features || [];
    if (features.length === 0) {
      hasMore = false;
    } else {
      for (const f of features) {
        records.push(f.attributes || f);
        if (records.length >= maxRecords) break;
      }
      offset += features.length;

      if (!data.exceededTransferLimit && features.length < batchSize) {
        hasMore = false;
      }
    }

    if (hasMore && delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return records;
}
