/**
 * AI_CONTEXT: Cross-reference module — resolves property owners against external registries.
 * Joins property owners to FL business registry (private.rootz.global) and SEC companies (origin.rootz.global).
 *
 * Dependencies:
 *   - None (makes HTTP calls to sibling Rootz services)
 *
 * Exports:
 *   - crossRefPrivateEntity(ownerName, state) — LLC/Corp -> Sunbiz officers
 *   - crossRefPublicEntity(ownerName) — check if owner is SEC company/REIT
 *   - crossRefOwnerIntel(ownerName, owner2) — full owner intelligence (both joins)
 *   - isEntityOwner(ownerName) — detect LLC/Corp/Trust owner
 */

const PRIVATE_API = 'https://private.rootz.global';
const ORIGIN_API = 'https://origin.rootz.global';

function normalizeEntityName(name) {
  if (!name) return '';
  return name.toUpperCase().replace(/[,.']/g, '').replace(/\s+/g, ' ').trim();
}

export function isEntityOwner(ownerName) {
  if (!ownerName) return false;
  const upper = ownerName.toUpperCase();
  return /\b(LLC|L\.L\.C|INC|CORP|LP|L\.P|LTD|PARTNERS|PARTNERSHIP|HOLDINGS|GROUP|ENTERPRISES|TRUST|TRS|REVOCABLE|IRREVOCABLE)\b/.test(upper);
}

function extractEntitySearchTerm(ownerName) {
  if (!ownerName) return '';
  return ownerName
    .toUpperCase()
    .replace(/\s+(TRS|TRUSTEE|AS TRUSTEE|REVOCABLE TRUST|IRREVOCABLE TRUST|LIVING TRUST|FAMILY TRUST)$/i, '')
    .replace(/[,.']/g, '')
    .trim();
}

async function fetchCrossRef(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function crossRefPrivateEntity(ownerName, state = 'FL') {
  const searchTerm = extractEntitySearchTerm(ownerName);
  if (!searchTerm || searchTerm.length < 3) return null;

  const encoded = encodeURIComponent(searchTerm);
  const searchResult = await fetchCrossRef(`${PRIVATE_API}/api/search?q=${encoded}&state=${state}&limit=5`);
  if (!searchResult?.results?.length) return null;

  const normalized = normalizeEntityName(searchTerm);
  let best = searchResult.results[0];
  for (const r of searchResult.results) {
    if (normalizeEntityName(r.entity_name) === normalized) {
      best = r;
      break;
    }
  }

  const detail = await fetchCrossRef(`${PRIVATE_API}/api/entity/${best.state}/${best.state_id}`);

  return {
    match: {
      entity_name: best.entity_name,
      state: best.state,
      state_id: best.state_id,
      entity_type: best.entity_type_normalized,
      filing_year: best.filing_year,
      business_age_years: best.business_age_years,
      status: best.status,
      confidence: normalizeEntityName(best.entity_name) === normalized ? 'exact' : 'partial'
    },
    officers: detail?.officers || [],
    agent: detail ? { name: detail.agent_name, address: detail.agent_address, city: detail.agent_city, state: detail.agent_state } : null,
    succession_signal: detail?.officers?.some(o =>
      o.is_same_as_agent && ['ceo', 'president', 'chairman', 'manager'].includes(o.title_normalized)
    ) || false,
    ein: detail?.fei_ein || null,
    principal_address: detail ? { address: detail.principal_address1, city: detail.principal_city, state: detail.principal_state, zip: detail.principal_zip } : null,
    source: 'private.rootz.global',
    query_used: searchTerm
  };
}

export async function crossRefPublicEntity(ownerName) {
  const searchTerm = extractEntitySearchTerm(ownerName);
  if (!searchTerm || searchTerm.length < 3) return null;

  const encoded = encodeURIComponent(searchTerm);
  const searchResult = await fetchCrossRef(`${ORIGIN_API}/api/search?q=${encoded}`);
  if (!searchResult?.results?.length) return null;

  const matches = searchResult.results.slice(0, 3).map(r => ({
    ticker: r.ticker,
    company_name: r.name || r.company_name,
    sector: r.sector,
    industry: r.industry,
    match_type: 'name_search'
  }));

  if (!matches.length) return null;

  const top = matches[0];
  const detail = await fetchCrossRef(`${ORIGIN_API}/api/company/${top.ticker}`);

  return {
    matches,
    top_match: detail ? {
      ticker: top.ticker,
      company_name: detail.name || detail.company_name,
      sector: detail.sector,
      industry: detail.industry,
      cik: detail.cik,
      state: detail.state,
      sic: detail.sic
    } : top,
    is_reit: detail?.sic ? ['6500', '6510', '6512', '6552', '6798'].includes(String(detail.sic)) : false,
    source: 'origin.rootz.global',
    query_used: searchTerm
  };
}

export async function crossRefOwnerIntel(ownerName, owner2 = '') {
  const entity = isEntityOwner(ownerName);

  const [privateMatch, publicMatch] = await Promise.all([
    entity ? crossRefPrivateEntity(ownerName, 'FL') : null,
    crossRefPublicEntity(ownerName)
  ]);

  let privateMatch2 = null;
  if (owner2 && isEntityOwner(owner2)) {
    privateMatch2 = await crossRefPrivateEntity(owner2, 'FL');
  }

  return {
    owner: ownerName,
    owner2: owner2 || null,
    isEntity: entity,
    private: privateMatch,
    private2: privateMatch2,
    public: publicMatch,
    is_reit: publicMatch?.is_reit || false,
    succession_risk: privateMatch?.succession_signal || false,
  };
}
