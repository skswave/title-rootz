/**
 * AI_CONTEXT: Building permit record normalization.
 * Transforms raw permit data from various county sources into standard schema.
 *
 * Exports:
 *   - normalize(raw, fieldMapping) — returns standardized permit object
 */

export function normalize(raw, fieldMapping = {}) {
  const get = (field) => {
    const mapping = fieldMapping[field];
    if (!mapping) return raw[field] || '';
    if (typeof mapping === 'object') {
      const val = raw[mapping.field];
      if (mapping.format === 'epoch_ms' && val) return new Date(val).toISOString().slice(0, 10);
      if (mapping.format === 'epoch_s' && val) return new Date(val * 1000).toISOString().slice(0, 10);
      return val || '';
    }
    return raw[mapping] || '';
  };

  return {
    permitNumber: get('permitNumber'),
    address: (get('address') || '').trim().toUpperCase(),
    type: get('type'),
    description: (get('description') || '').slice(0, 500),
    status: get('status'),
    estimatedValue: parseFloat(get('estimatedValue')) || 0,
    contractor: get('contractor'),
    issueDate: get('issueDate'),
    finalDate: get('finalDate'),
    city: get('city'),
    county: get('county'),
    _source: 'harvester',
    _ingested: new Date().toISOString(),
  };
}
