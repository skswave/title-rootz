/**
 * AI_CONTEXT: FL DOR statewide parcel normalization.
 * Transforms raw FL DOR pipe-delimited parcel fields into standard schema.
 *
 * Exports:
 *   - normalize(raw, fieldMapping) — returns standardized parcel object
 */

export function normalize(raw, fieldMapping = {}) {
  const get = (field) => {
    const mapping = fieldMapping[field];
    if (!mapping) return raw[field] || '';
    return raw[mapping] || '';
  };

  const jv = parseInt(raw.JV || raw.jv || 0);
  const lndVal = parseInt(raw.LND_VAL || raw.lnd_val || 0);
  const bldgVal = jv - lndVal;

  return {
    parcelNo: (raw.PARCELNO || raw.parcelno || '').trim(),
    ownerName: (raw.OWN_NAME || raw.own_name || '').trim(),
    ownerName2: (raw.OWN_NAME2 || raw.own_name2 || '').trim(),
    address: (raw.PHY_ADDR1 || raw.phy_addr1 || '').trim().toUpperCase(),
    city: (raw.PHY_CITY || raw.phy_city || '').trim(),
    zip: (raw.PHY_ZIPCD || raw.phy_zipcd || '').trim().slice(0, 5),
    county: parseInt(raw.CO_NO || raw.co_no || 0),
    dorCode: (raw.DOR_UC || raw.dor_uc || '').trim().padStart(3, '0'),
    justValue: jv,
    landValue: lndVal,
    buildingValue: bldgVal > 0 ? bldgVal : 0,
    yearBuilt: parseInt(raw.ACT_YR_BLT || raw.act_yr_blt || 0),
    livingArea: parseInt(raw.TOT_LVG_AR || raw.tot_lvg_ar || 0),
    salePrice1: parseInt(raw.SALE_PRC1 || raw.sale_prc1 || 0),
    saleYear1: parseInt(raw.SALE_YR1 || raw.sale_yr1 || 0),
    salePrice2: parseInt(raw.SALE_PRC2 || raw.sale_prc2 || 0),
    saleYear2: parseInt(raw.SALE_YR2 || raw.sale_yr2 || 0),
    homestead: !!(parseInt(raw.AV_HMSTD || raw.av_hmstd || 0)),
    ownerMailAddr: (raw.OWN_ADDR1 || raw.own_addr1 || '').trim(),
    ownerMailCity: (raw.OWN_CITY || raw.own_city || '').trim(),
    ownerMailState: (raw.OWN_STATE || raw.own_state || '').trim(),
    ownerMailZip: (raw.OWN_ZIPCD || raw.own_zipcd || '').trim(),
    fiduciary: (raw.FIDU_CD || raw.fidu_cd || '').trim(),
    _source: 'fl-dor',
    _ingested: new Date().toISOString(),
  };
}
