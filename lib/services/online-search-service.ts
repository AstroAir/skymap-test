/**
 * Online Astronomical Database Search Service
 * Supports SIMBAD, Sesame (CDS name resolver), VizieR, and NED
 */

import { smartFetch } from './http-fetch';

// ============================================================================
// Types
// ============================================================================

export type OnlineSearchSource = 
  | 'simbad' 
  | 'sesame' 
  | 'vizier' 
  | 'ned'
  | 'local';

export type ObjectCategory = 
  | 'galaxy' 
  | 'nebula' 
  | 'cluster' 
  | 'star' 
  | 'planet' 
  | 'comet'
  | 'asteroid'
  | 'quasar'
  | 'other';

export interface OnlineSearchResult {
  id: string;
  name: string;
  alternateNames?: string[];
  type: string;
  category: ObjectCategory;
  ra: number;
  dec: number;
  raString?: string;
  decString?: string;
  magnitude?: number;
  angularSize?: string;
  distance?: string;
  constellation?: string;
  morphologicalType?: string;
  spectralType?: string;
  redshift?: number;
  source: OnlineSearchSource;
  sourceUrl?: string;
  description?: string;
}

export interface OnlineSearchOptions {
  sources?: OnlineSearchSource[];
  limit?: number;
  timeout?: number;
  includeCoordinateSearch?: boolean;
  searchRadius?: number; // degrees for coordinate search
}

export interface CoordinateSearchParams {
  ra: number;
  dec: number;
  radius: number; // degrees
}

export interface OnlineSearchResponse {
  results: OnlineSearchResult[];
  sources: OnlineSearchSource[];
  totalCount: number;
  searchTimeMs: number;
  errors?: Array<{ source: OnlineSearchSource; error: string }>;
}

// ============================================================================
// Source Configurations
// ============================================================================

export const ONLINE_SEARCH_SOURCES = {
  simbad: {
    id: 'simbad' as const,
    name: 'SIMBAD',
    description: 'CDS astronomical database with 20M+ objects',
    baseUrl: 'https://simbad.cds.unistra.fr',
    tapEndpoint: '/simbad/sim-tap/sync',
    enabled: true,
    priority: 1,
    timeout: 15000,
  },
  sesame: {
    id: 'sesame' as const,
    name: 'Sesame',
    description: 'CDS name resolver (SIMBAD + NED + VizieR)',
    baseUrl: 'https://cds.unistra.fr',
    endpoint: '/cgi-bin/Sesame',
    enabled: true,
    priority: 0, // Highest priority for name resolution
    timeout: 10000,
  },
  vizier: {
    id: 'vizier' as const,
    name: 'VizieR',
    description: 'CDS catalog library with 27k+ catalogs',
    baseUrl: 'https://vizier.cds.unistra.fr',
    tapEndpoint: '/viz-bin/votable',
    enabled: true,
    priority: 2,
    timeout: 20000,
  },
  ned: {
    id: 'ned' as const,
    name: 'NED',
    description: 'NASA/IPAC Extragalactic Database',
    baseUrl: 'https://ned.ipac.caltech.edu',
    endpoint: '/cgi-bin/objsearch',
    enabled: true,
    priority: 3,
    timeout: 15000,
  },
};

// ============================================================================
// Object Type Mapping
// ============================================================================

const SIMBAD_TYPE_MAP: Record<string, { type: string; category: ObjectCategory }> = {
  'G': { type: 'Galaxy', category: 'galaxy' },
  'Galaxy': { type: 'Galaxy', category: 'galaxy' },
  'GiG': { type: 'Galaxy in Group', category: 'galaxy' },
  'GiC': { type: 'Galaxy in Cluster', category: 'galaxy' },
  'GiP': { type: 'Galaxy in Pair', category: 'galaxy' },
  'AGN': { type: 'Active Galactic Nucleus', category: 'galaxy' },
  'QSO': { type: 'Quasar', category: 'quasar' },
  'Sy1': { type: 'Seyfert 1 Galaxy', category: 'galaxy' },
  'Sy2': { type: 'Seyfert 2 Galaxy', category: 'galaxy' },
  'BLL': { type: 'BL Lac Object', category: 'galaxy' },
  'IG': { type: 'Interacting Galaxies', category: 'galaxy' },
  'PaG': { type: 'Pair of Galaxies', category: 'galaxy' },
  'GrG': { type: 'Group of Galaxies', category: 'galaxy' },
  'ClG': { type: 'Cluster of Galaxies', category: 'galaxy' },
  'PN': { type: 'Planetary Nebula', category: 'nebula' },
  'HII': { type: 'HII Region', category: 'nebula' },
  'RNe': { type: 'Reflection Nebula', category: 'nebula' },
  'SNR': { type: 'Supernova Remnant', category: 'nebula' },
  'Neb': { type: 'Nebula', category: 'nebula' },
  'EmO': { type: 'Emission Object', category: 'nebula' },
  'DNe': { type: 'Dark Nebula', category: 'nebula' },
  'GlC': { type: 'Globular Cluster', category: 'cluster' },
  'OpC': { type: 'Open Cluster', category: 'cluster' },
  'Cl*': { type: 'Star Cluster', category: 'cluster' },
  'As*': { type: 'Asterism', category: 'cluster' },
  '*': { type: 'Star', category: 'star' },
  '**': { type: 'Double Star', category: 'star' },
  'V*': { type: 'Variable Star', category: 'star' },
  'Psr': { type: 'Pulsar', category: 'star' },
  'WD*': { type: 'White Dwarf', category: 'star' },
  'NS*': { type: 'Neutron Star', category: 'star' },
  'BH*': { type: 'Black Hole Candidate', category: 'other' },
  'Pl': { type: 'Planet', category: 'planet' },
  'Com': { type: 'Comet', category: 'comet' },
  'Ast': { type: 'Asteroid', category: 'asteroid' },
  'MPl': { type: 'Minor Planet', category: 'asteroid' },
};

function parseObjectType(typeStr?: string): { type: string; category: ObjectCategory } {
  if (!typeStr) return { type: 'Unknown', category: 'other' };
  
  const normalized = typeStr.trim();
  
  // Direct match
  if (SIMBAD_TYPE_MAP[normalized]) {
    return SIMBAD_TYPE_MAP[normalized];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(SIMBAD_TYPE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Keyword-based detection
  const upper = normalized.toUpperCase();
  if (upper.includes('GALAX')) return { type: 'Galaxy', category: 'galaxy' };
  if (upper.includes('NEBULA') || upper.includes('NEB')) return { type: 'Nebula', category: 'nebula' };
  if (upper.includes('CLUSTER') || upper.includes('CL')) return { type: 'Star Cluster', category: 'cluster' };
  if (upper.includes('STAR')) return { type: 'Star', category: 'star' };
  if (upper.includes('QUASAR') || upper.includes('QSO')) return { type: 'Quasar', category: 'quasar' };
  
  return { type: typeStr, category: 'other' };
}

// ============================================================================
// Coordinate Formatting
// ============================================================================

function formatRA(raDeg: number): string {
  const hours = raDeg / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h) * 60 - m) * 60;
  return `${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}m${s.toFixed(2).padStart(5, '0')}s`;
}

function formatDec(decDeg: number): string {
  const sign = decDeg >= 0 ? '+' : '-';
  const absD = Math.abs(decDeg);
  const d = Math.floor(absD);
  const m = Math.floor((absD - d) * 60);
  const s = ((absD - d) * 60 - m) * 60;
  return `${sign}${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'${s.toFixed(1).padStart(4, '0')}"`;
}

function generateResultId(name: string, source: OnlineSearchSource): string {
  return `${source}-${name.replace(/\s+/g, '_').toLowerCase()}`;
}

// ============================================================================
// Sesame Name Resolver (Primary - queries SIMBAD + NED + VizieR)
// ============================================================================

interface SesameResult {
  name: string;
  ra: number;
  dec: number;
  type?: string;
  aliases?: string[];
}

async function searchSesame(query: string, timeout: number = 10000): Promise<OnlineSearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${ONLINE_SEARCH_SOURCES.sesame.baseUrl}${ONLINE_SEARCH_SOURCES.sesame.endpoint}/-ox/SNV?${encodedQuery}`;
    
    const response = await smartFetch(url, { timeout });
    
    if (!response.ok) {
      throw new Error(`Sesame API error: ${response.status}`);
    }
    
    const xmlText = await response.text();
    const results: OnlineSearchResult[] = [];
    
    // Parse XML response
    // Sesame returns XML with <Resolver> elements containing <jpos>, <oname>, <otype>
    const resolverMatches = xmlText.match(/<Resolver[^>]*>[\s\S]*?<\/Resolver>/g);
    
    if (resolverMatches) {
      for (const resolverXml of resolverMatches) {
        // Extract name
        const nameMatch = resolverXml.match(/<oname>([^<]+)<\/oname>/);
        const name = nameMatch ? nameMatch[1].trim() : query;
        
        // Extract coordinates (J2000 decimal)
        const jposMatch = resolverXml.match(/<jpos>([^<]+)<\/jpos>/);
        if (!jposMatch) continue;
        
        const [raStr, decStr] = jposMatch[1].trim().split(/\s+/);
        const ra = parseFloat(raStr);
        const dec = parseFloat(decStr);
        
        if (isNaN(ra) || isNaN(dec)) continue;
        
        // Extract type
        const typeMatch = resolverXml.match(/<otype>([^<]+)<\/otype>/);
        const rawType = typeMatch ? typeMatch[1].trim() : undefined;
        const { type, category } = parseObjectType(rawType);
        
        // Extract aliases
        const aliasMatches = resolverXml.match(/<alias>([^<]+)<\/alias>/g);
        const alternateNames = aliasMatches 
          ? aliasMatches.map(m => m.replace(/<\/?alias>/g, '').trim())
          : undefined;
        
        // Extract magnitude if available
        const magMatch = resolverXml.match(/<mag[^>]*>([^<]+)<\/mag>/);
        const magnitude = magMatch ? parseFloat(magMatch[1]) : undefined;
        
        // Use SesameResult interface for intermediate parsing
        const sesameResult: SesameResult = {
          name,
          ra,
          dec,
          type: rawType,
          aliases: alternateNames,
        };
        
        results.push({
          id: generateResultId(sesameResult.name, 'sesame'),
          name: sesameResult.name,
          alternateNames: sesameResult.aliases,
          type,
          category,
          ra: sesameResult.ra,
          dec: sesameResult.dec,
          raString: formatRA(sesameResult.ra),
          decString: formatDec(sesameResult.dec),
          magnitude: magnitude && !isNaN(magnitude) ? magnitude : undefined,
          source: 'sesame',
          sourceUrl: `https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=${encodedQuery}`,
        });
      }
    }
    
    // Fallback: Try to parse simple format if XML parsing fails
    if (results.length === 0) {
      const simpleMatch = xmlText.match(/(\d+\.?\d*)\s+([+-]?\d+\.?\d*)/);
      if (simpleMatch) {
        const ra = parseFloat(simpleMatch[1]);
        const dec = parseFloat(simpleMatch[2]);
        
        if (!isNaN(ra) && !isNaN(dec)) {
          results.push({
            id: generateResultId(query, 'sesame'),
            name: query,
            type: 'Unknown',
            category: 'other',
            ra,
            dec,
            raString: formatRA(ra),
            decString: formatDec(dec),
            source: 'sesame',
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.warn('Sesame search error:', error);
    return [];
  }
}

// ============================================================================
// SIMBAD TAP Query
// ============================================================================

interface SimbadTapRow {
  main_id: string;
  ra: number;
  dec: number;
  otype_txt?: string | null;
  sp_type?: string | null;
  flux_v?: number | null;
  galdim_majaxis?: number | null;
  galdim_minaxis?: number | null;
  morph_type?: string | null;
  rvz_redshift?: number | null;
}

async function searchSimbadByName(query: string, limit: number = 20, timeout: number = 15000): Promise<OnlineSearchResult[]> {
  try {
    // Build ADQL query for SIMBAD TAP
    const escapedQuery = query.replace(/'/g, "''");
    const adqlQuery = `
      SELECT TOP ${limit}
        main_id, ra, dec, otype_txt, sp_type, 
        flux AS flux_v, galdim_majaxis, galdim_minaxis, 
        morph_type, rvz_redshift
      FROM basic
      JOIN ident ON basic.oid = ident.oidref
      WHERE ident.id LIKE '%${escapedQuery}%'
      ORDER BY flux ASC
    `;
    
    const params = new URLSearchParams({
      request: 'doQuery',
      lang: 'adql',
      format: 'json',
      query: adqlQuery.trim(),
    });
    
    const url = `${ONLINE_SEARCH_SOURCES.simbad.baseUrl}${ONLINE_SEARCH_SOURCES.simbad.tapEndpoint}?${params}`;
    
    const response = await smartFetch(url, {
      timeout,
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`SIMBAD TAP error: ${response.status}`);
    }
    
    const data = await response.json<{ data?: (string | number | null)[][] }>();
    const results: OnlineSearchResult[] = [];
    
    if (data.data && Array.isArray(data.data)) {
      for (const row of data.data) {
        // Use SimbadTapRow interface for type safety
        const tapRow: SimbadTapRow = {
          main_id: row[0] as string,
          ra: row[1] as number,
          dec: row[2] as number,
          otype_txt: row[3] as string | null,
          sp_type: row[4] as string | null,
          flux_v: row[5] as number | null,
          galdim_majaxis: row[6] as number | null,
          galdim_minaxis: row[7] as number | null,
          morph_type: row[8] as string | null,
          rvz_redshift: row[9] as number | null,
        };
        
        if (typeof tapRow.ra !== 'number' || typeof tapRow.dec !== 'number') continue;
        
        const { type, category } = parseObjectType(tapRow.otype_txt || undefined);
        
        // Format angular size
        let angularSize: string | undefined;
        if (tapRow.galdim_majaxis && tapRow.galdim_minaxis) {
          angularSize = `${tapRow.galdim_majaxis.toFixed(1)}' × ${tapRow.galdim_minaxis.toFixed(1)}'`;
        } else if (tapRow.galdim_majaxis) {
          angularSize = `${tapRow.galdim_majaxis.toFixed(1)}'`;
        }
        
        results.push({
          id: generateResultId(tapRow.main_id, 'simbad'),
          name: tapRow.main_id,
          type,
          category,
          ra: tapRow.ra,
          dec: tapRow.dec,
          raString: formatRA(tapRow.ra),
          decString: formatDec(tapRow.dec),
          magnitude: tapRow.flux_v ?? undefined,
          angularSize,
          morphologicalType: tapRow.morph_type ?? undefined,
          spectralType: tapRow.sp_type ?? undefined,
          redshift: tapRow.rvz_redshift ?? undefined,
          source: 'simbad',
          sourceUrl: `https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=${encodeURIComponent(tapRow.main_id)}`,
        });
      }
    }
    
    return results;
  } catch (error) {
    console.warn('SIMBAD TAP search error:', error);
    return [];
  }
}

async function searchSimbadByCoordinates(
  ra: number, 
  dec: number, 
  radius: number = 0.5, 
  limit: number = 20, 
  timeout: number = 15000
): Promise<OnlineSearchResult[]> {
  try {
    const adqlQuery = `
      SELECT TOP ${limit}
        main_id, ra, dec, otype_txt, sp_type, 
        flux AS flux_v, galdim_majaxis, galdim_minaxis, 
        morph_type, rvz_redshift,
        DISTANCE(POINT('ICRS', ra, dec), POINT('ICRS', ${ra}, ${dec})) AS dist
      FROM basic
      WHERE CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', ${ra}, ${dec}, ${radius})) = 1
      ORDER BY dist ASC
    `;
    
    const params = new URLSearchParams({
      request: 'doQuery',
      lang: 'adql',
      format: 'json',
      query: adqlQuery.trim(),
    });
    
    const url = `${ONLINE_SEARCH_SOURCES.simbad.baseUrl}${ONLINE_SEARCH_SOURCES.simbad.tapEndpoint}?${params}`;
    
    const response = await smartFetch(url, {
      timeout,
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`SIMBAD coordinate search error: ${response.status}`);
    }
    
    const data = await response.json<{ data?: (string | number | null)[][] }>();
    const results: OnlineSearchResult[] = [];
    
    if (data.data && Array.isArray(data.data)) {
      for (const row of data.data) {
        // Use SimbadTapRow interface for type safety
        const tapRow: SimbadTapRow = {
          main_id: row[0] as string,
          ra: row[1] as number,
          dec: row[2] as number,
          otype_txt: row[3] as string | null,
          sp_type: row[4] as string | null,
          flux_v: row[5] as number | null,
          galdim_majaxis: row[6] as number | null,
          galdim_minaxis: row[7] as number | null,
          morph_type: row[8] as string | null,
          rvz_redshift: row[9] as number | null,
        };
        
        if (typeof tapRow.ra !== 'number' || typeof tapRow.dec !== 'number') continue;
        
        const { type, category } = parseObjectType(tapRow.otype_txt || undefined);
        
        let angularSize: string | undefined;
        if (tapRow.galdim_majaxis && tapRow.galdim_minaxis) {
          angularSize = `${tapRow.galdim_majaxis.toFixed(1)}' × ${tapRow.galdim_minaxis.toFixed(1)}'`;
        } else if (tapRow.galdim_majaxis) {
          angularSize = `${tapRow.galdim_majaxis.toFixed(1)}'`;
        }
        
        results.push({
          id: generateResultId(tapRow.main_id, 'simbad'),
          name: tapRow.main_id,
          type,
          category,
          ra: tapRow.ra,
          dec: tapRow.dec,
          raString: formatRA(tapRow.ra),
          decString: formatDec(tapRow.dec),
          magnitude: tapRow.flux_v ?? undefined,
          angularSize,
          morphologicalType: tapRow.morph_type ?? undefined,
          spectralType: tapRow.sp_type ?? undefined,
          redshift: tapRow.rvz_redshift ?? undefined,
          source: 'simbad',
          sourceUrl: `https://simbad.cds.unistra.fr/simbad/sim-coo?Coord=${tapRow.ra}+${tapRow.dec}&Radius=2&Radius.unit=arcmin`,
        });
      }
    }
    
    return results;
  } catch (error) {
    console.warn('SIMBAD coordinate search error:', error);
    return [];
  }
}

// ============================================================================
// VizieR Catalog Search
// ============================================================================

async function searchVizierCatalogs(
  query: string, 
  catalogs: string[] = ['VII/118', 'VII/239B', 'I/355/gaiadr3'], // NGC/IC, Tycho-2, Gaia DR3
  limit: number = 20, 
  timeout: number = 20000
): Promise<OnlineSearchResult[]> {
  try {
    const catalogParam = catalogs.join(',');
    const params = new URLSearchParams({
      '-source': catalogParam,
      '-words': query,
      '-out.max': limit.toString(),
      '-out.form': 'JSON',
      '-out': '_RAJ2000,_DEJ2000,Name,Vmag,SpType',
    });
    
    const url = `${ONLINE_SEARCH_SOURCES.vizier.baseUrl}/viz-bin/VizieR-4?${params}`;
    
    const response = await smartFetch(url, { timeout });
    
    if (!response.ok) {
      throw new Error(`VizieR search error: ${response.status}`);
    }
    
    // VizieR JSON response parsing
    const text = await response.text();
    const results: OnlineSearchResult[] = [];
    
    try {
      // Try parsing as JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        // Process VizieR JSON structure
        if (data.data) {
          for (const row of data.data) {
            if (row._RAJ2000 && row._DEJ2000) {
              results.push({
                id: generateResultId(row.Name || `${row._RAJ2000}_${row._DEJ2000}`, 'vizier'),
                name: row.Name || `J${row._RAJ2000.toFixed(4)}${row._DEJ2000 >= 0 ? '+' : ''}${row._DEJ2000.toFixed(4)}`,
                type: row.SpType ? 'Star' : 'Unknown',
                category: row.SpType ? 'star' : 'other',
                ra: parseFloat(row._RAJ2000),
                dec: parseFloat(row._DEJ2000),
                raString: formatRA(parseFloat(row._RAJ2000)),
                decString: formatDec(parseFloat(row._DEJ2000)),
                magnitude: row.Vmag ? parseFloat(row.Vmag) : undefined,
                spectralType: row.SpType,
                source: 'vizier',
                sourceUrl: `https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=${catalogParam}&-c=${encodeURIComponent(query)}`,
              });
            }
          }
        }
      }
    } catch {
      // Fallback: parse as VOTable or plain text
      console.warn('VizieR JSON parse failed, trying VOTable format');
    }
    
    return results;
  } catch (error) {
    console.warn('VizieR search error:', error);
    return [];
  }
}

// ============================================================================
// NED (NASA/IPAC Extragalactic Database)
// ============================================================================

async function searchNED(query: string, limit: number = 20, timeout: number = 15000): Promise<OnlineSearchResult[]> {
  try {
    const params = new URLSearchParams({
      objname: query,
      extend: 'no',
      of: 'xml_main',
      img_stamp: 'NO',
    });
    
    const url = `${ONLINE_SEARCH_SOURCES.ned.baseUrl}${ONLINE_SEARCH_SOURCES.ned.endpoint}?${params}`;
    
    const response = await smartFetch(url, { timeout });
    
    if (!response.ok) {
      throw new Error(`NED search error: ${response.status}`);
    }
    
    const xmlText = await response.text();
    const results: OnlineSearchResult[] = [];
    
    // Parse NED XML response
    const objectMatches = xmlText.match(/<OBJECT>[\s\S]*?<\/OBJECT>/g);
    
    if (objectMatches) {
      for (const objXml of objectMatches.slice(0, limit)) {
        // Extract name
        const nameMatch = objXml.match(/<OBJNAME>([^<]+)<\/OBJNAME>/);
        const name = nameMatch ? nameMatch[1].trim() : query;
        
        // Extract RA/Dec
        const raMatch = objXml.match(/<RA>([^<]+)<\/RA>/);
        const decMatch = objXml.match(/<DEC>([^<]+)<\/DEC>/);
        
        if (!raMatch || !decMatch) continue;
        
        const ra = parseFloat(raMatch[1]);
        const dec = parseFloat(decMatch[1]);
        
        if (isNaN(ra) || isNaN(dec)) continue;
        
        // Extract type
        const typeMatch = objXml.match(/<OBJTYPE>([^<]+)<\/OBJTYPE>/);
        const rawType = typeMatch ? typeMatch[1].trim() : undefined;
        const { type, category } = parseObjectType(rawType);
        
        // Extract redshift
        const zMatch = objXml.match(/<REDSHIFT>([^<]+)<\/REDSHIFT>/);
        const redshift = zMatch ? parseFloat(zMatch[1]) : undefined;
        
        // Extract magnitude
        const magMatch = objXml.match(/<MAGNITUDE>([^<]+)<\/MAGNITUDE>/);
        const magnitude = magMatch ? parseFloat(magMatch[1]) : undefined;
        
        results.push({
          id: generateResultId(name, 'ned'),
          name,
          type,
          category,
          ra,
          dec,
          raString: formatRA(ra),
          decString: formatDec(dec),
          magnitude: magnitude && !isNaN(magnitude) ? magnitude : undefined,
          redshift: redshift && !isNaN(redshift) ? redshift : undefined,
          source: 'ned',
          sourceUrl: `https://ned.ipac.caltech.edu/byname?objname=${encodeURIComponent(name)}`,
        });
      }
    }
    
    return results;
  } catch (error) {
    console.warn('NED search error:', error);
    return [];
  }
}

// ============================================================================
// Unified Search API
// ============================================================================

/**
 * Search online astronomical databases by object name
 */
export async function searchOnlineByName(
  query: string,
  options: OnlineSearchOptions = {}
): Promise<OnlineSearchResponse> {
  const {
    sources = ['sesame', 'simbad'],
    limit = 20,
    timeout = 15000,
  } = options;
  
  const startTime = performance.now();
  const allResults: OnlineSearchResult[] = [];
  const errors: Array<{ source: OnlineSearchSource; error: string }> = [];
  const usedSources: OnlineSearchSource[] = [];
  
  // Execute searches in parallel
  const searchPromises: Promise<{ source: OnlineSearchSource; results: OnlineSearchResult[] }>[] = [];
  
  if (sources.includes('sesame')) {
    searchPromises.push(
      searchSesame(query, timeout)
        .then(results => ({ source: 'sesame' as const, results }))
        .catch(error => {
          errors.push({ source: 'sesame', error: error.message });
          return { source: 'sesame' as const, results: [] };
        })
    );
  }
  
  if (sources.includes('simbad')) {
    searchPromises.push(
      searchSimbadByName(query, limit, timeout)
        .then(results => ({ source: 'simbad' as const, results }))
        .catch(error => {
          errors.push({ source: 'simbad', error: error.message });
          return { source: 'simbad' as const, results: [] };
        })
    );
  }
  
  if (sources.includes('vizier')) {
    searchPromises.push(
      searchVizierCatalogs(query, undefined, limit, timeout)
        .then(results => ({ source: 'vizier' as const, results }))
        .catch(error => {
          errors.push({ source: 'vizier', error: error.message });
          return { source: 'vizier' as const, results: [] };
        })
    );
  }
  
  if (sources.includes('ned')) {
    searchPromises.push(
      searchNED(query, limit, timeout)
        .then(results => ({ source: 'ned' as const, results }))
        .catch(error => {
          errors.push({ source: 'ned', error: error.message });
          return { source: 'ned' as const, results: [] };
        })
    );
  }
  
  const searchResults = await Promise.all(searchPromises);
  
  // Deduplicate results by coordinates (within 1 arcmin)
  const seenPositions = new Map<string, OnlineSearchResult>();
  
  for (const { source, results } of searchResults) {
    if (results.length > 0) {
      usedSources.push(source);
    }
    
    for (const result of results) {
      // Create position key with 0.01 degree precision (~36 arcsec)
      const posKey = `${Math.round(result.ra * 100)}_${Math.round(result.dec * 100)}`;
      
      if (!seenPositions.has(posKey)) {
        seenPositions.set(posKey, result);
        allResults.push(result);
      } else {
        // Merge alternate names if same object
        const existing = seenPositions.get(posKey)!;
        if (existing.name !== result.name) {
          existing.alternateNames = existing.alternateNames || [];
          if (!existing.alternateNames.includes(result.name)) {
            existing.alternateNames.push(result.name);
          }
        }
      }
    }
  }
  
  const endTime = performance.now();
  
  return {
    results: allResults.slice(0, limit),
    sources: usedSources,
    totalCount: allResults.length,
    searchTimeMs: Math.round(endTime - startTime),
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Search online astronomical databases by coordinates
 */
export async function searchOnlineByCoordinates(
  params: CoordinateSearchParams,
  options: OnlineSearchOptions = {}
): Promise<OnlineSearchResponse> {
  const {
    sources = ['simbad'],
    limit = 20,
    timeout = 15000,
  } = options;
  
  const startTime = performance.now();
  const allResults: OnlineSearchResult[] = [];
  const errors: Array<{ source: OnlineSearchSource; error: string }> = [];
  const usedSources: OnlineSearchSource[] = [];
  
  // SIMBAD is the primary source for coordinate searches
  if (sources.includes('simbad')) {
    try {
      const results = await searchSimbadByCoordinates(
        params.ra, 
        params.dec, 
        params.radius, 
        limit, 
        timeout
      );
      if (results.length > 0) {
        usedSources.push('simbad');
        allResults.push(...results);
      }
    } catch (error) {
      errors.push({ source: 'simbad', error: (error as Error).message });
    }
  }
  
  const endTime = performance.now();
  
  return {
    results: allResults.slice(0, limit),
    sources: usedSources,
    totalCount: allResults.length,
    searchTimeMs: Math.round(endTime - startTime),
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Quick name resolution using Sesame
 * Returns the first match with coordinates
 */
export async function resolveObjectName(name: string): Promise<OnlineSearchResult | null> {
  const results = await searchSesame(name, 8000);
  return results.length > 0 ? results[0] : null;
}

/**
 * Check if online search services are available
 */
export async function checkOnlineSearchAvailability(): Promise<Record<OnlineSearchSource, boolean>> {
  const results: Record<OnlineSearchSource, boolean> = {
    simbad: false,
    sesame: false,
    vizier: false,
    ned: false,
    local: true,
  };
  
  const checks = [
    smartFetch(`${ONLINE_SEARCH_SOURCES.sesame.baseUrl}${ONLINE_SEARCH_SOURCES.sesame.endpoint}/-ox/SNV?M31`, { timeout: 5000 })
      .then(r => { results.sesame = r.ok; })
      .catch(() => { results.sesame = false; }),
    smartFetch(`${ONLINE_SEARCH_SOURCES.simbad.baseUrl}/simbad/`, { timeout: 5000 })
      .then(r => { results.simbad = r.ok; })
      .catch(() => { results.simbad = false; }),
  ];
  
  await Promise.allSettled(checks);
  
  return results;
}
