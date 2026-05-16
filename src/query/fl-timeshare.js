/**
 * AI_CONTEXT: Florida timeshare intelligence — DBPR registry + parcel cross-reference
 *
 * Dependencies:
 *   - src/lib/data-loader.js (loadDataFile)
 *   - src/query/fl-property.js (lookupByAddress, getInvestorSignals)
 *   - src/query/fl-overlays.js (getFloodZone, getElevation)
 *   - src/query/fl-proximity.js (findNearestSchools, findNearestHospitals, findBuildingPermits)
 *
 * Exports:
 *   - searchDBPRTimeshare(query) — search FL DBPR timeshare registry
 *   - assembleTimeshareIntelligence(query, city, explicitAddress) — full timeshare package
 */

import { loadDataFile } from '../lib/data-loader.js';
import { lookupByAddress, getInvestorSignals } from './fl-property.js';
import { getFloodZone, getElevation } from './fl-overlays.js';
import { findNearestSchools, findNearestHospitals, findBuildingPermits } from './fl-proximity.js';

let _dbprTimeshareIndex = null;

function getDBPRTimeshareIndex() {
  if (_dbprTimeshareIndex) return _dbprTimeshareIndex;

  const raw = loadDataFile('florida/dbpr-timeshare-projects.csv') || loadDataFile('dbpr-timeshare-projects.csv');
  if (!raw || typeof raw !== 'string') return null;

  _dbprTimeshareIndex = { byAddress: {}, byName: {}, all: [] };
  const lines = raw.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    fields.push(current.trim());
    if (fields.length < 10) continue;

    const project = {
      dbprNumber: fields[0], projectId: fields[1], projectName: fields[2],
      county: fields[3], address: fields[4], city: fields[5],
      state: fields[6], zip: fields[7],
      units: parseFloat((fields[8] || '0').replace(/,/g, '')) || 0,
      status: fields[11] || '', mailingId: fields[13] || '',
      associationName: fields[14] || '', mailingAddress: fields[16] || '',
      mailingCity: fields[17] || '', mailingState: fields[18] || '', mailingZip: fields[19] || ''
    };

    _dbprTimeshareIndex.all.push(project);
    const addrKey = (project.address + ' ' + project.city).toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
    if (addrKey.length > 5) {
      if (!_dbprTimeshareIndex.byAddress[addrKey]) _dbprTimeshareIndex.byAddress[addrKey] = [];
      _dbprTimeshareIndex.byAddress[addrKey].push(project);
    }
    const nameKey = project.projectName.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
    if (nameKey.length > 3) _dbprTimeshareIndex.byName[nameKey] = project;
  }

  return _dbprTimeshareIndex;
}

export function searchDBPRTimeshare(query) {
  const idx = getDBPRTimeshareIndex();
  if (!idx) return [];

  const q = query.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();

  for (const [key, projects] of Object.entries(idx.byAddress)) {
    if (key.includes(q) || q.includes(key)) return projects;
  }

  const nameMatches = idx.all.filter(p => {
    const name = p.projectName.toUpperCase();
    return name.includes(q) || q.split(' ').every(word => name.includes(word));
  });
  if (nameMatches.length > 0) return nameMatches;

  return idx.all.filter(p => {
    const combined = (p.projectName + ' ' + p.address + ' ' + p.city).toUpperCase();
    return q.split(' ').some(word => word.length > 3 && combined.includes(word));
  }).slice(0, 10);
}

export async function assembleTimeshareIntelligence(query, city, explicitAddress = null) {
  const timestamp = new Date().toISOString();
  const dbprMatches = searchDBPRTimeshare(query);

  let address, searchCity;
  if (explicitAddress && city) { address = explicitAddress; searchCity = city; }
  else if (/^\d+\s+\w/.test(query) && city) { address = query; searchCity = city; }
  else { address = null; searchCity = city || ''; }

  let properties = [];
  if (address) properties = await lookupByAddress(address, searchCity);
  if (!properties.length && address !== query && /^\d+\s+\w/.test(query)) {
    properties = await lookupByAddress(query, city || '');
  }

  const prop = properties.length > 0 ? properties[0] : null;
  const lat = prop?.lat;
  const lng = prop?.lng;

  let flood = null, elevation = null, schools = null, hospitals = null;
  if (lat && lng) {
    [flood, elevation] = await Promise.all([getFloodZone(lat, lng), getElevation(lat, lng)]);
    schools = findNearestSchools(lat, lng, 5.0);
    hospitals = findNearestHospitals(lat, lng, 15.0);
  }

  const permits = prop ? findBuildingPermits(prop.FOLIO, prop.TRUE_SITE_ADDR) : [];
  let investorSignals = null;
  if (prop) investorSignals = await getInvestorSignals(prop, lat, lng);

  const isTimeshare = prop ? ['043', '044', '0443', '0442'].includes(prop.DOR_CODE_CUR) ||
    (prop.TRUE_OWNER1 || '').toUpperCase().match(/VACATION|TIMESHARE|RESORT|INTERVAL|HILTON GRAND|MARRIOTT OWNERSHIP|WESTGATE|DISNEY VACATION|WYNDHAM|BLUEGREEN/) : false;

  const ownerType = prop ? (
    (prop.TRUE_OWNER1 || '').toUpperCase().includes('DISNEY') ? 'Disney Vacation Club' :
    (prop.TRUE_OWNER1 || '').toUpperCase().includes('MARRIOTT') ? 'Marriott Vacations Worldwide' :
    (prop.TRUE_OWNER1 || '').toUpperCase().includes('HILTON GRAND') ? 'Hilton Grand Vacations' :
    (prop.TRUE_OWNER1 || '').toUpperCase().includes('WESTGATE') ? 'Westgate Resorts' :
    (prop.TRUE_OWNER1 || '').toUpperCase().includes('WYNDHAM') ? 'Wyndham Destinations' :
    (prop.TRUE_OWNER1 || '').toUpperCase().includes('BLUEGREEN') ? 'Bluegreen Vacations' :
    'Independent/Other'
  ) : null;

  return {
    origin: {
      version: '0.5-timeshare', type: 'timeshare-intelligence', assembledDate: timestamp, query,
      sources: [
        prop ? 'FL DOR Statewide Parcels' : null,
        dbprMatches.length ? 'FL DBPR Timeshare Registry' : null,
        flood ? 'FEMA NFHL' : null, elevation ? 'USGS 3DEP' : null,
        permits.length ? 'County Building Permits' : null,
        schools?.public?.length ? 'NCES Schools' : null,
        hospitals?.length ? 'CMS Hospitals' : null
      ].filter(Boolean)
    },
    dbprProject: dbprMatches.length > 0 ? {
      projectName: dbprMatches[0].projectName, dbprNumber: dbprMatches[0].dbprNumber,
      county: dbprMatches[0].county,
      registeredAddress: `${dbprMatches[0].address}, ${dbprMatches[0].city}, ${dbprMatches[0].state} ${dbprMatches[0].zip}`,
      units: dbprMatches[0].units, status: dbprMatches[0].status,
      association: dbprMatches[0].associationName, totalMatches: dbprMatches.length,
      allProjects: dbprMatches.length > 1 ? dbprMatches.map(p => ({ name: p.projectName, dbprNumber: p.dbprNumber, units: p.units })) : undefined
    } : { note: 'No matching DBPR project found' },
    countyRecord: prop ? {
      address: prop.TRUE_SITE_ADDR, city: prop.TRUE_SITE_CITY, state: 'FL',
      zip: prop.TRUE_SITE_ZIP_CODE, folio: prop.FOLIO, owner: prop.TRUE_OWNER1,
      assessedValue: prop.TOTAL_VAL_CUR, yearBuilt: prop.YEAR_BUILT,
      coordinates: lat && lng ? { lat, lng } : null,
      isTimeshareCode: isTimeshare, ownerBrand: ownerType
    } : { note: `Property not found: ${address}, ${searchCity}` },
    flood, elevation,
    buildingPermits: { count: permits.length, recentPermits: permits.slice(0, 10) },
    investorSignals: investorSignals ? {
      flags: investorSignals.flags, ownerOccupied: investorSignals.ownerOccupied,
      corporateOwner: investorSignals.corporateOwner, outOfState: investorSignals.outOfStateOwner,
      salesHistory: investorSignals.salesHistory, assessedValue: investorSignals.assessedValue
    } : null,
    verificationSummary: {
      ownerVerified: prop && dbprMatches.length > 0,
      floodRisk: flood?.zone === 'X' ? 'LOW' : flood?.zone ? `ZONE ${flood.zone}` : 'UNKNOWN',
      permitActivity: permits.length > 0 ? `${permits.length} permits on record` : 'No permits found',
      isRegistered: dbprMatches.length > 0 && dbprMatches[0].status === 'Approved'
    }
  };
}
