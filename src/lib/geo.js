/**
 * AI_CONTEXT: Geospatial utility functions
 *
 * Dependencies: none (pure math)
 * Exports: distanceMiles, getCentroid
 *
 * Used by proximity queries (schools, hospitals, EV, TRI) and property lookups.
 */

/**
 * Haversine distance between two lat/lng points in miles
 */
export function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Extract centroid from ArcGIS polygon geometry (rings array)
 */
export function getCentroid(geometry) {
  if (!geometry?.rings?.length) return { lat: null, lng: null };
  const ring = geometry.rings[0];
  let sumX = 0, sumY = 0;
  for (const [x, y] of ring) {
    sumX += x;
    sumY += y;
  }
  return { lng: sumX / ring.length, lat: sumY / ring.length };
}
