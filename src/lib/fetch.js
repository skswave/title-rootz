/**
 * AI_CONTEXT: HTTP fetch helper with timeout and error handling
 *
 * Dependencies: none (uses global fetch)
 * Exports: fetchJSON
 *
 * Used by all modules that call external APIs (FEMA, Census, MDC GIS, etc.)
 */

/**
 * Fetch JSON from URL with timeout and error handling
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in ms (default 15000)
 * @returns {any|null} Parsed JSON or null on error
 */
export async function fetchJSON(url, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    const data = await resp.json();
    return data;
  } catch (e) {
    console.error(`Fetch error for ${url.substring(0, 80)}: ${e.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
