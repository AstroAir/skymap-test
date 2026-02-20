/**
 * Online Astronomical Database Search Service
 * Authoritative-first pipeline:
 * - coordinates: SIMBAD cone search first
 * - name/catalog: Sesame first, then SIMBAD enrich, VizieR/NED supplement
 * - minor objects: MPC identifier/observation services first
 */

import { smartFetch, type FetchOptions, type FetchResponse } from './http-fetch';
import { createLogger } from '@/lib/logger';
import { formatRA, formatDec } from '@/lib/astronomy/coordinates/formats';
import { parseRACoordinate, parseDecCoordinate } from '@/lib/astronomy/coordinates/conversions';
import { parseQuery } from '@/lib/astronomy/object-resolver/parser/parse-query';
import { buildCanonicalId } from '@/lib/astronomy/object-resolver/parser/normalize';

const logger = createLogger('online-search-service');

export type OnlineSearchSource =
  | 'simbad'
  | 'sesame'
  | 'vizier'
  | 'ned'
  | 'mpc'
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
  canonicalId: string;
  identifiers: string[];
  confidence: number;
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
  searchRadius?: number;
  signal?: AbortSignal;
}

export interface CoordinateSearchParams {
  ra: number;
  dec: number;
  radius: number;
}

export interface OnlineSearchResponse {
  results: OnlineSearchResult[];
  sources: OnlineSearchSource[];
  totalCount: number;
  searchTimeMs: number;
  errors?: Array<{ source: OnlineSearchSource; error: string }>;
}

type SearchErrors = Array<{ source: OnlineSearchSource; error: string }>;

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
    priority: 0,
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
  mpc: {
    id: 'mpc' as const,
    name: 'MPC',
    description: 'Minor Planet Center designation resolver',
    baseUrl: 'https://data.minorplanetcenter.net',
    identifierEndpoint: '/api/query-identifier',
    observationEndpoint: '/api/get-obs',
    enabled: true,
    priority: 0,
    timeout: 15000,
  },
};

const DEFAULT_NAME_SOURCES: OnlineSearchSource[] = ['sesame', 'simbad', 'vizier', 'ned'];
const DEFAULT_COORDINATE_SOURCES: OnlineSearchSource[] = ['simbad'];
const DEFAULT_MINOR_SOURCES: OnlineSearchSource[] = ['mpc', 'sesame', 'simbad'];

const SOURCE_TRUST: Record<OnlineSearchSource, number> = {
  mpc: 0,
  sesame: 1,
  simbad: 2,
  vizier: 3,
  ned: 4,
  local: 5,
};

const SIMBAD_TYPE_MAP: Record<string, { type: string; category: ObjectCategory }> = {
  G: { type: 'Galaxy', category: 'galaxy' },
  Galaxy: { type: 'Galaxy', category: 'galaxy' },
  GiG: { type: 'Galaxy in Group', category: 'galaxy' },
  GiC: { type: 'Galaxy in Cluster', category: 'galaxy' },
  GiP: { type: 'Galaxy in Pair', category: 'galaxy' },
  AGN: { type: 'Active Galactic Nucleus', category: 'galaxy' },
  QSO: { type: 'Quasar', category: 'quasar' },
  Sy1: { type: 'Seyfert 1 Galaxy', category: 'galaxy' },
  Sy2: { type: 'Seyfert 2 Galaxy', category: 'galaxy' },
  BLL: { type: 'BL Lac Object', category: 'galaxy' },
  IG: { type: 'Interacting Galaxies', category: 'galaxy' },
  PaG: { type: 'Pair of Galaxies', category: 'galaxy' },
  GrG: { type: 'Group of Galaxies', category: 'galaxy' },
  ClG: { type: 'Cluster of Galaxies', category: 'galaxy' },
  PN: { type: 'Planetary Nebula', category: 'nebula' },
  HII: { type: 'HII Region', category: 'nebula' },
  RNe: { type: 'Reflection Nebula', category: 'nebula' },
  SNR: { type: 'Supernova Remnant', category: 'nebula' },
  Neb: { type: 'Nebula', category: 'nebula' },
  EmO: { type: 'Emission Object', category: 'nebula' },
  DNe: { type: 'Dark Nebula', category: 'nebula' },
  GlC: { type: 'Globular Cluster', category: 'cluster' },
  OpC: { type: 'Open Cluster', category: 'cluster' },
  'Cl*': { type: 'Star Cluster', category: 'cluster' },
  'As*': { type: 'Asterism', category: 'cluster' },
  '*': { type: 'Star', category: 'star' },
  '**': { type: 'Double Star', category: 'star' },
  'V*': { type: 'Variable Star', category: 'star' },
  Psr: { type: 'Pulsar', category: 'star' },
  'WD*': { type: 'White Dwarf', category: 'star' },
  'NS*': { type: 'Neutron Star', category: 'star' },
  'BH*': { type: 'Black Hole Candidate', category: 'other' },
  Pl: { type: 'Planet', category: 'planet' },
  Com: { type: 'Comet', category: 'comet' },
  Ast: { type: 'Asteroid', category: 'asteroid' },
  MPl: { type: 'Minor Planet', category: 'asteroid' },
};

function parseObjectType(typeStr?: string): { type: string; category: ObjectCategory } {
  if (!typeStr) return { type: 'Unknown', category: 'other' };

  const normalized = typeStr.trim();
  if (SIMBAD_TYPE_MAP[normalized]) return SIMBAD_TYPE_MAP[normalized];

  for (const [key, value] of Object.entries(SIMBAD_TYPE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }

  const upper = normalized.toUpperCase();
  if (upper.includes('COMET')) return { type: 'Comet', category: 'comet' };
  if (upper.includes('ASTEROID') || upper.includes('MINOR PLANET')) return { type: 'Asteroid', category: 'asteroid' };
  if (upper.includes('GALAX')) return { type: 'Galaxy', category: 'galaxy' };
  if (upper.includes('NEBULA') || upper.includes('NEB')) return { type: 'Nebula', category: 'nebula' };
  if (upper.includes('CLUSTER') || upper.includes('CL')) return { type: 'Star Cluster', category: 'cluster' };
  if (upper.includes('STAR')) return { type: 'Star', category: 'star' };
  if (upper.includes('PLANET')) return { type: 'Planet', category: 'planet' };
  if (upper.includes('QUASAR') || upper.includes('QSO')) return { type: 'Quasar', category: 'quasar' };

  return { type: typeStr, category: 'other' };
}

function normalizedIdentifier(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toUpperCase();
}

function generateResultId(name: string, source: OnlineSearchSource): string {
  return `${source}-${name.replace(/\s+/g, '_').toLowerCase()}`;
}

function toCanonicalId(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (value && value.trim()) return buildCanonicalId(value);
  }
  return buildCanonicalId('UNKNOWN');
}

function parseCoordinatePair(rawRa: string, rawDec: string): { ra: number; dec: number } | null {
  const ra = parseRACoordinate(rawRa);
  const dec = parseDecCoordinate(rawDec);
  if (ra === null || dec === null) return null;
  return { ra, dec };
}

function angleDistanceArcsec(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const toRad = (d: number) => d * Math.PI / 180;
  const dRa = toRad(ra2 - ra1);
  const dDec = toRad(dec2 - dec1);
  const a = Math.sin(dDec / 2) ** 2 + Math.cos(toRad(dec1)) * Math.cos(toRad(dec2)) * Math.sin(dRa / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c * 206264.806;
}

function dedupeStrings(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = normalizedIdentifier(trimmed);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(trimmed);
    }
  }
  return out;
}

function shouldMergeResults(a: OnlineSearchResult, b: OnlineSearchResult): boolean {
  if (a.canonicalId === b.canonicalId) return true;
  if (a.identifiers.some(id => b.identifiers.map(normalizedIdentifier).includes(normalizedIdentifier(id)))) return true;
  return angleDistanceArcsec(a.ra, a.dec, b.ra, b.dec) <= 5;
}

function mergeResult(base: OnlineSearchResult, incoming: OnlineSearchResult): OnlineSearchResult {
  const preferred = SOURCE_TRUST[incoming.source] < SOURCE_TRUST[base.source] ? incoming : base;
  const secondary = preferred === incoming ? base : incoming;

  return {
    ...preferred,
    canonicalId: preferred.canonicalId || secondary.canonicalId,
    identifiers: dedupeStrings([...preferred.identifiers, ...secondary.identifiers]),
    alternateNames: dedupeStrings([...(preferred.alternateNames ?? []), ...(secondary.alternateNames ?? []), secondary.name]),
    confidence: Math.max(preferred.confidence, secondary.confidence),
    magnitude: preferred.magnitude ?? secondary.magnitude,
    angularSize: preferred.angularSize ?? secondary.angularSize,
    redshift: preferred.redshift ?? secondary.redshift,
    spectralType: preferred.spectralType ?? secondary.spectralType,
    morphologicalType: preferred.morphologicalType ?? secondary.morphologicalType,
    sourceUrl: preferred.sourceUrl ?? secondary.sourceUrl,
    description: preferred.description ?? secondary.description,
  };
}

function consolidateResults(results: OnlineSearchResult[], limit: number): OnlineSearchResult[] {
  const merged: OnlineSearchResult[] = [];

  for (const item of results) {
    const idx = merged.findIndex(existing => shouldMergeResults(existing, item));
    if (idx < 0) {
      merged.push({
        ...item,
        identifiers: dedupeStrings(item.identifiers),
        alternateNames: dedupeStrings(item.alternateNames ?? []),
      });
      continue;
    }
    merged[idx] = mergeResult(merged[idx], item);
  }

  return merged
    .sort((a, b) => SOURCE_TRUST[a.source] - SOURCE_TRUST[b.source])
    .slice(0, limit);
}

const CDS_MIN_INTERVAL_MS = 200;
let cdsGate: Promise<void> = Promise.resolve();

async function rateLimitedFetch(url: string, options: FetchOptions = {}): Promise<FetchResponse> {
  const isCds = url.includes('cds.unistra.fr') || url.includes('simbad.cds.unistra.fr') || url.includes('vizier.cds.unistra.fr');
  if (!isCds) return smartFetch(url, options);

  const prev = cdsGate;
  let release: () => void;
  cdsGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;

  try {
    return await smartFetch(url, options);
  } finally {
    setTimeout(() => release(), CDS_MIN_INTERVAL_MS);
  }
}

async function fetchWithRetry(url: string, options: FetchOptions = {}, maxRetries = 1): Promise<FetchResponse> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      if (options.signal?.aborted) throw new Error('Request aborted');
      return await rateLimitedFetch(url, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (options.signal?.aborted || attempt >= maxRetries) throw lastError;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw lastError ?? new Error('Fetch failed');
}

async function runSource<T>(
  source: OnlineSearchSource,
  task: () => Promise<T>,
  errors: SearchErrors
): Promise<T | null> {
  try {
    return await task();
  } catch (error) {
    errors.push({ source, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

async function searchSesame(query: string, timeout = 10000, signal?: AbortSignal): Promise<OnlineSearchResult[]> {
  const encoded = encodeURIComponent(query);
  const url = `${ONLINE_SEARCH_SOURCES.sesame.baseUrl}${ONLINE_SEARCH_SOURCES.sesame.endpoint}/-oxpI/SNV?${encoded}`;
  const response = await fetchWithRetry(url, { timeout, signal });
  if (!response.ok) throw new Error(`Sesame API error: ${response.status}`);

  const xmlText = await response.text();
  const resolverMatches = xmlText.match(/<Resolver[^>]*>[\s\S]*?<\/Resolver>/g) ?? [];
  const results: OnlineSearchResult[] = [];

  for (const resolverXml of resolverMatches) {
    const oname = resolverXml.match(/<oname>([^<]+)<\/oname>/)?.[1]?.trim() || query;
    const raDeg = resolverXml.match(/<jradeg>([^<]+)<\/jradeg>/)?.[1]?.trim();
    const decDeg = resolverXml.match(/<jdedeg>([^<]+)<\/jdedeg>/)?.[1]?.trim();
    const jpos = resolverXml.match(/<jpos>([^<]+)<\/jpos>/)?.[1]?.trim();

    let ra: number | null = null;
    let dec: number | null = null;

    if (raDeg && decDeg) {
      const parsedRa = Number.parseFloat(raDeg);
      const parsedDec = Number.parseFloat(decDeg);
      if (Number.isFinite(parsedRa) && Number.isFinite(parsedDec)) {
        ra = parsedRa;
        dec = parsedDec;
      }
    } else if (jpos) {
      const [rawRa, rawDec] = jpos.split(/\s+/);
      const parsed = parseCoordinatePair(rawRa ?? '', rawDec ?? '');
      if (parsed) {
        ra = parsed.ra;
        dec = parsed.dec;
      }
    }

    if (ra === null || dec === null) continue;

    const rawType = resolverXml.match(/<otype>([^<]+)<\/otype>/)?.[1]?.trim();
    const { type, category } = parseObjectType(rawType);
    const aliases = (resolverXml.match(/<alias>([^<]+)<\/alias>/g) ?? [])
      .map(token => token.replace(/<\/?alias>/g, '').trim());
    const magnitude = resolverXml.match(/<mag[^>]*><v>([^<]+)<\/v><\/mag>/)?.[1];

    const canonicalId = toCanonicalId(oname, aliases[0], query);
    const identifiers = dedupeStrings([oname, ...aliases, query]);

    results.push({
      id: generateResultId(oname, 'sesame'),
      name: oname,
      canonicalId,
      identifiers,
      confidence: 0.95,
      alternateNames: aliases,
      type,
      category,
      ra,
      dec,
      raString: formatRA(ra),
      decString: formatDec(dec),
      magnitude: magnitude ? Number.parseFloat(magnitude) : undefined,
      source: 'sesame',
      sourceUrl: `https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=${encoded}`,
    });
  }

  return results;
}

function escapeAdqlLike(value: string): string {
  let escaped = value.replace(/'/g, "''");
  escaped = escaped.replace(/%/g, '\\%');
  escaped = escaped.replace(/_/g, '\\_');
  return escaped;
}

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

async function querySimbad(adqlQuery: string, timeout: number, signal?: AbortSignal): Promise<SimbadTapRow[]> {
  const params = new URLSearchParams({
    request: 'doQuery',
    lang: 'adql',
    format: 'json',
    query: adqlQuery.trim(),
  });
  const url = `${ONLINE_SEARCH_SOURCES.simbad.baseUrl}${ONLINE_SEARCH_SOURCES.simbad.tapEndpoint}?${params}`;

  const response = await fetchWithRetry(url, {
    timeout,
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`SIMBAD TAP error: ${response.status}`);

  const data = await response.json<{ data?: (string | number | null)[][] }>();
  const rows: SimbadTapRow[] = [];

  for (const row of data.data ?? []) {
    if (typeof row[0] !== 'string' || typeof row[1] !== 'number' || typeof row[2] !== 'number') continue;
    rows.push({
      main_id: row[0],
      ra: row[1],
      dec: row[2],
      otype_txt: row[3] as string | null,
      sp_type: row[4] as string | null,
      flux_v: row[5] as number | null,
      galdim_majaxis: row[6] as number | null,
      galdim_minaxis: row[7] as number | null,
      morph_type: row[8] as string | null,
      rvz_redshift: row[9] as number | null,
    });
  }

  return rows;
}

function simbadRowsToResults(rows: SimbadTapRow[], queryHint: string): OnlineSearchResult[] {
  return rows.map((row) => {
    const { type, category } = parseObjectType(row.otype_txt || undefined);
    const angularSize = row.galdim_majaxis
      ? row.galdim_minaxis
        ? `${row.galdim_majaxis.toFixed(1)}' × ${row.galdim_minaxis.toFixed(1)}'`
        : `${row.galdim_majaxis.toFixed(1)}'`
      : undefined;

    const identifiers = dedupeStrings([row.main_id, queryHint]);
    return {
      id: generateResultId(row.main_id, 'simbad'),
      name: row.main_id,
      canonicalId: toCanonicalId(row.main_id, queryHint),
      identifiers,
      confidence: 0.92,
      type,
      category,
      ra: row.ra,
      dec: row.dec,
      raString: formatRA(row.ra),
      decString: formatDec(row.dec),
      magnitude: row.flux_v ?? undefined,
      angularSize,
      morphologicalType: row.morph_type ?? undefined,
      spectralType: row.sp_type ?? undefined,
      redshift: row.rvz_redshift ?? undefined,
      source: 'simbad',
      sourceUrl: `https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=${encodeURIComponent(row.main_id)}`,
    };
  });
}

async function searchSimbadByName(query: string, limit = 20, timeout = 15000, signal?: AbortSignal): Promise<OnlineSearchResult[]> {
  if (!query.trim()) return [];
  const escapedQuery = escapeAdqlLike(query);
  const adqlQuery = `
    SELECT TOP ${limit}
      b.main_id, b.ra, b.dec, b.otype_txt, b.sp_type,
      f.V AS flux_v, b.galdim_majaxis, b.galdim_minaxis,
      b.morph_type, b.rvz_redshift
    FROM basic AS b
    JOIN ident ON b.oid = ident.oidref
    LEFT JOIN allfluxes AS f ON b.oid = f.oidref
    WHERE ident.id LIKE '%${escapedQuery}%'
    ORDER BY f.V ASC
  `;
  const rows = await querySimbad(adqlQuery, timeout, signal);
  return simbadRowsToResults(rows, query);
}

async function searchSimbadByCoordinates(
  ra: number,
  dec: number,
  radius = 0.5,
  limit = 20,
  timeout = 15000,
  signal?: AbortSignal
): Promise<OnlineSearchResult[]> {
  const adqlQuery = `
    SELECT TOP ${limit}
      b.main_id, b.ra, b.dec, b.otype_txt, b.sp_type,
      f.V AS flux_v, b.galdim_majaxis, b.galdim_minaxis,
      b.morph_type, b.rvz_redshift,
      DISTANCE(POINT('ICRS', b.ra, b.dec), POINT('ICRS', ${ra}, ${dec})) AS dist
    FROM basic AS b
    LEFT JOIN allfluxes AS f ON b.oid = f.oidref
    WHERE CONTAINS(POINT('ICRS', b.ra, b.dec), CIRCLE('ICRS', ${ra}, ${dec}, ${radius})) = 1
    ORDER BY dist ASC
  `;
  const rows = await querySimbad(adqlQuery, timeout, signal);
  return simbadRowsToResults(rows, `${ra},${dec}`);
}

async function searchVizierCatalogs(
  query: string,
  catalogs: string[] = ['VII/118', 'VII/239B', 'I/355/gaiadr3'],
  limit = 20,
  timeout = 20000,
  signal?: AbortSignal
): Promise<OnlineSearchResult[]> {
  const params = new URLSearchParams({
    '-source': catalogs.join(','),
    '-words': query,
    '-out.max': limit.toString(),
    '-mime': 'json',
    '-out': '_RAJ2000,_DEJ2000,Name,Vmag,SpType',
  });
  const url = `${ONLINE_SEARCH_SOURCES.vizier.baseUrl}/viz-bin/VizieR-4?${params}`;
  const response = await fetchWithRetry(url, { timeout, signal });
  if (!response.ok) throw new Error(`VizieR search error: ${response.status}`);

  const text = await response.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]) as Record<string, unknown>;
  }

  const rows = (parsed?.data as Record<string, unknown>[] | undefined) ?? [];
  const results: OnlineSearchResult[] = [];

  for (const row of rows) {
    const ra = Number.parseFloat(String(row._RAJ2000 ?? ''));
    const dec = Number.parseFloat(String(row._DEJ2000 ?? ''));
    if (!Number.isFinite(ra) || !Number.isFinite(dec)) continue;

    const name = row.Name ? String(row.Name) : `J${ra.toFixed(4)}${dec >= 0 ? '+' : ''}${dec.toFixed(4)}`;
    const identifiers = dedupeStrings([name, query]);

    results.push({
      id: generateResultId(name, 'vizier'),
      name,
      canonicalId: toCanonicalId(name, query),
      identifiers,
      confidence: 0.75,
      type: row.SpType ? 'Star' : 'Unknown',
      category: row.SpType ? 'star' : 'other',
      ra,
      dec,
      raString: formatRA(ra),
      decString: formatDec(dec),
      magnitude: row.Vmag ? Number.parseFloat(String(row.Vmag)) : undefined,
      spectralType: row.SpType ? String(row.SpType) : undefined,
      source: 'vizier',
      sourceUrl: `https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=${encodeURIComponent(catalogs.join(','))}&-c=${encodeURIComponent(query)}`,
    });
  }

  return results;
}

async function searchNED(query: string, limit = 20, timeout = 15000, signal?: AbortSignal): Promise<OnlineSearchResult[]> {
  const params = new URLSearchParams({
    objname: query,
    extend: 'no',
    of: 'xml_main',
    img_stamp: 'NO',
  });
  const url = `${ONLINE_SEARCH_SOURCES.ned.baseUrl}${ONLINE_SEARCH_SOURCES.ned.endpoint}?${params}`;
  const response = await fetchWithRetry(url, { timeout, signal });
  if (!response.ok) throw new Error(`NED search error: ${response.status}`);

  const xmlText = await response.text();
  const objectMatches = xmlText.match(/<OBJECT>[\s\S]*?<\/OBJECT>/g) ?? [];
  const results: OnlineSearchResult[] = [];

  for (const objXml of objectMatches.slice(0, limit)) {
    const name = objXml.match(/<OBJNAME>([^<]+)<\/OBJNAME>/)?.[1]?.trim() || query;
    const ra = Number.parseFloat(objXml.match(/<RA>([^<]+)<\/RA>/)?.[1] ?? '');
    const dec = Number.parseFloat(objXml.match(/<DEC>([^<]+)<\/DEC>/)?.[1] ?? '');
    if (!Number.isFinite(ra) || !Number.isFinite(dec)) continue;

    const rawType = objXml.match(/<OBJTYPE>([^<]+)<\/OBJTYPE>/)?.[1]?.trim();
    const { type, category } = parseObjectType(rawType);
    const redshift = Number.parseFloat(objXml.match(/<REDSHIFT>([^<]+)<\/REDSHIFT>/)?.[1] ?? '');
    const magnitude = Number.parseFloat(objXml.match(/<MAGNITUDE>([^<]+)<\/MAGNITUDE>/)?.[1] ?? '');
    const identifiers = dedupeStrings([name, query]);

    results.push({
      id: generateResultId(name, 'ned'),
      name,
      canonicalId: toCanonicalId(name, query),
      identifiers,
      confidence: 0.72,
      type,
      category,
      ra,
      dec,
      raString: formatRA(ra),
      decString: formatDec(dec),
      magnitude: Number.isFinite(magnitude) ? magnitude : undefined,
      redshift: Number.isFinite(redshift) ? redshift : undefined,
      source: 'ned',
      sourceUrl: `https://ned.ipac.caltech.edu/byname?objname=${encodeURIComponent(name)}`,
    });
  }

  return results;
}

interface MpcIdentifierResult {
  found?: number;
  iau_designation?: string | null;
  name?: string | null;
  object_type?: [string, number] | string | null;
  permid?: string | null;
  packed_permid?: string | null;
  packed_primary_provisional_designation?: string | null;
  packed_secondary_provisional_designations?: string[] | null;
  unpacked_primary_provisional_designation?: string | null;
  unpacked_secondary_provisional_designations?: string[] | null;
}

function extractMpcIdentifier(payload: unknown, originalId: string): MpcIdentifierResult | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  if (typeof record.found === 'number') return record as MpcIdentifierResult;

  const direct = record[originalId];
  if (direct && typeof direct === 'object') return direct as MpcIdentifierResult;

  const firstObject = Object.values(record).find(value => !!value && typeof value === 'object');
  return firstObject ? (firstObject as MpcIdentifierResult) : null;
}

function extractObjectTypeLabel(objectType: MpcIdentifierResult['object_type']): string {
  if (Array.isArray(objectType)) return String(objectType[0] ?? '');
  return objectType ? String(objectType) : '';
}

function isMpcComet(objectTypeLabel: string): boolean {
  return objectTypeLabel.toLowerCase().includes('comet');
}

function firstNonEmpty(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (value && value.trim()) return value;
  }
  return null;
}

function parseMpcObservationRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    const first = payload[0];
    if (first && typeof first === 'object' && Array.isArray((first as { ADES_DF?: unknown }).ADES_DF)) {
      return ((first as { ADES_DF: Record<string, unknown>[] }).ADES_DF) ?? [];
    }
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { ADES_DF?: unknown }).ADES_DF)) {
    return ((payload as { ADES_DF: Record<string, unknown>[] }).ADES_DF) ?? [];
  }
  return [];
}

async function mpcGetJson(url: string, body: Record<string, unknown>, timeout: number, signal?: AbortSignal): Promise<unknown> {
  const response = await fetchWithRetry(url, {
    method: 'GET',
    timeout,
    signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  }, 0);

  if (!response.ok) throw new Error(`MPC API error: ${response.status}`);
  return response.json<unknown>();
}

async function searchMpcMinorObject(query: string, timeout = 15000, signal?: AbortSignal): Promise<OnlineSearchResult[]> {
  const identifierUrl = `${ONLINE_SEARCH_SOURCES.mpc.baseUrl}${ONLINE_SEARCH_SOURCES.mpc.identifierEndpoint}`;
  const identifierPayload = await mpcGetJson(identifierUrl, { ids: [query] }, timeout, signal);
  const resolved = extractMpcIdentifier(identifierPayload, query);
  if (!resolved || (resolved.found ?? 0) < 1) return [];

  const objectTypeLabel = extractObjectTypeLabel(resolved.object_type);
  const category: ObjectCategory = isMpcComet(objectTypeLabel) ? 'comet' : 'asteroid';
  const type = category === 'comet' ? 'Comet' : 'Asteroid';

  const primaryDesignation = firstNonEmpty([
    resolved.unpacked_primary_provisional_designation ?? null,
    resolved.iau_designation ?? null,
    resolved.permid ?? null,
    query,
  ]);
  if (!primaryDesignation) return [];

  const obsUrl = `${ONLINE_SEARCH_SOURCES.mpc.baseUrl}${ONLINE_SEARCH_SOURCES.mpc.observationEndpoint}`;
  let rows: Array<Record<string, unknown>> = [];
  try {
    const obsPayload = await mpcGetJson(
      obsUrl,
      { desigs: [primaryDesignation], output_format: ['ADES_DF'] },
      timeout,
      signal
    );
    rows = parseMpcObservationRows(obsPayload);
  } catch (error) {
    logger.warn('MPC observation lookup failed', error);
  }

  const latest = rows
    .filter(row => typeof row.ra === 'string' && typeof row.dec === 'string')
    .sort((a, b) => {
      const ta = Date.parse(String(a.obstime ?? ''));
      const tb = Date.parse(String(b.obstime ?? ''));
      return Number.isFinite(tb - ta) ? tb - ta : 0;
    })[0];

  const ra = Number.parseFloat(String(latest?.ra ?? ''));
  const dec = Number.parseFloat(String(latest?.dec ?? ''));
  if (!Number.isFinite(ra) || !Number.isFinite(dec)) return [];

  const identifiers = dedupeStrings([
    query,
    resolved.iau_designation ?? undefined,
    resolved.name ?? undefined,
    resolved.permid ?? undefined,
    resolved.packed_permid ?? undefined,
    resolved.packed_primary_provisional_designation ?? undefined,
    ...(resolved.packed_secondary_provisional_designations ?? []),
    resolved.unpacked_primary_provisional_designation ?? undefined,
    ...(resolved.unpacked_secondary_provisional_designations ?? []),
  ]);

  const name = firstNonEmpty([
    resolved.iau_designation ?? null,
    resolved.unpacked_primary_provisional_designation ?? null,
    resolved.name ?? null,
    query,
  ]) || query;

  const magnitude = Number.parseFloat(String(latest?.mag ?? ''));
  const canonicalId = toCanonicalId(
    resolved.iau_designation ?? undefined,
    resolved.permid ?? undefined,
    resolved.unpacked_primary_provisional_designation ?? undefined,
    query
  );

  return [{
    id: generateResultId(name, 'mpc'),
    name,
    canonicalId,
    identifiers,
    confidence: 0.99,
    alternateNames: dedupeStrings([resolved.name ?? undefined, ...identifiers.filter(v => v !== name)]),
    type,
    category,
    ra,
    dec,
    raString: formatRA(ra),
    decString: formatDec(dec),
    magnitude: Number.isFinite(magnitude) ? magnitude : undefined,
    source: 'mpc',
    sourceUrl: `${ONLINE_SEARCH_SOURCES.mpc.baseUrl}${ONLINE_SEARCH_SOURCES.mpc.identifierEndpoint}`,
    description: objectTypeLabel || undefined,
  }];
}

function collectUsedSources(results: OnlineSearchResult[]): OnlineSearchSource[] {
  const seen = new Set<OnlineSearchSource>();
  for (const result of results) seen.add(result.source);
  return Array.from(seen);
}

export async function searchOnlineByName(
  query: string,
  options: OnlineSearchOptions = {}
): Promise<OnlineSearchResponse> {
  const {
    sources = DEFAULT_NAME_SOURCES,
    limit = 20,
    timeout = 15000,
    searchRadius = 0.5,
    signal,
  } = options;

  if (!query.trim()) {
    return { results: [], sources: [], totalCount: 0, searchTimeMs: 0 };
  }

  const parsed = parseQuery(query);
  const start = performance.now();
  const errors: SearchErrors = [];
  const stagedResults: OnlineSearchResult[] = [];

  if (parsed.kind === 'coordinate' && parsed.coordinate) {
    return searchOnlineByCoordinates({
      ra: parsed.coordinate.ra,
      dec: parsed.coordinate.dec,
      radius: searchRadius,
    }, {
      ...options,
      sources: sources.filter(source => source === 'simbad' || source === 'local'),
      limit,
      timeout,
      signal,
    });
  }

  if (parsed.kind === 'minor') {
    const minorSources = sources.length > 0 ? sources : DEFAULT_MINOR_SOURCES;

    if (minorSources.includes('mpc')) {
      const mpcResults = await runSource('mpc', () => searchMpcMinorObject(query, timeout, signal), errors);
      if (mpcResults?.length) stagedResults.push(...mpcResults);
    }
    if (minorSources.includes('sesame')) {
      const sesameResults = await runSource('sesame', () => searchSesame(query, timeout, signal), errors);
      if (sesameResults?.length) stagedResults.push(...sesameResults);
    }
    if (minorSources.includes('simbad')) {
      const simbadResults = await runSource('simbad', () => searchSimbadByName(query, limit, timeout, signal), errors);
      if (simbadResults?.length) stagedResults.push(...simbadResults);
    }
  } else {
    if (sources.includes('sesame')) {
      const sesameResults = await runSource('sesame', () => searchSesame(query, timeout, signal), errors);
      if (sesameResults?.length) stagedResults.push(...sesameResults);
    }

    if (sources.includes('simbad')) {
      const simbadResults = await runSource('simbad', () => searchSimbadByName(query, limit, timeout, signal), errors);
      if (simbadResults?.length) stagedResults.push(...simbadResults);
    }

    const supplements = await Promise.all([
      sources.includes('vizier')
        ? runSource('vizier', () => searchVizierCatalogs(query, undefined, limit, timeout, signal), errors)
        : Promise.resolve(null),
      sources.includes('ned')
        ? runSource('ned', () => searchNED(query, limit, timeout, signal), errors)
        : Promise.resolve(null),
    ]);

    for (const supplemental of supplements) {
      if (supplemental?.length) stagedResults.push(...supplemental);
    }
  }

  const results = consolidateResults(stagedResults, limit);
  const searchTimeMs = Math.round(performance.now() - start);

  return {
    results,
    sources: collectUsedSources(results),
    totalCount: results.length,
    searchTimeMs,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function searchOnlineByCoordinates(
  params: CoordinateSearchParams,
  options: OnlineSearchOptions = {}
): Promise<OnlineSearchResponse> {
  const {
    sources = DEFAULT_COORDINATE_SOURCES,
    limit = 20,
    timeout = 15000,
    signal,
  } = options;

  const start = performance.now();
  const errors: SearchErrors = [];
  const results: OnlineSearchResult[] = [];

  if (sources.includes('simbad')) {
    const simbadResults = await runSource(
      'simbad',
      () => searchSimbadByCoordinates(params.ra, params.dec, params.radius, limit, timeout, signal),
      errors
    );
    if (simbadResults?.length) results.push(...simbadResults);
  }

  const merged = consolidateResults(results, limit);
  const searchTimeMs = Math.round(performance.now() - start);

  return {
    results: merged,
    sources: collectUsedSources(merged),
    totalCount: merged.length,
    searchTimeMs,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function resolveObjectName(name: string): Promise<OnlineSearchResult | null> {
  try {
    const response = await searchOnlineByName(name, {
      limit: 1,
      sources: ['sesame', 'simbad', 'mpc'],
      timeout: 8000,
    });
    return response.results[0] ?? null;
  } catch {
    return null;
  }
}

export async function checkOnlineSearchAvailability(): Promise<Record<OnlineSearchSource, boolean>> {
  const result: Record<OnlineSearchSource, boolean> = {
    simbad: false,
    sesame: false,
    vizier: false,
    ned: false,
    mpc: false,
    local: true,
  };

  const checks = [
    smartFetch(`${ONLINE_SEARCH_SOURCES.sesame.baseUrl}${ONLINE_SEARCH_SOURCES.sesame.endpoint}/-ox/SNV?M31`, { timeout: 5000 })
      .then(r => { result.sesame = r.ok; })
      .catch(() => { result.sesame = false; }),
    smartFetch(`${ONLINE_SEARCH_SOURCES.simbad.baseUrl}/simbad/`, { timeout: 5000 })
      .then(r => { result.simbad = r.ok; })
      .catch(() => { result.simbad = false; }),
    smartFetch(`${ONLINE_SEARCH_SOURCES.vizier.baseUrl}/viz-bin/VizieR`, { timeout: 5000 })
      .then(r => { result.vizier = r.ok; })
      .catch(() => { result.vizier = false; }),
    smartFetch(`${ONLINE_SEARCH_SOURCES.ned.baseUrl}/`, { timeout: 5000 })
      .then(r => { result.ned = r.ok; })
      .catch(() => { result.ned = false; }),
    smartFetch(`${ONLINE_SEARCH_SOURCES.mpc.baseUrl}${ONLINE_SEARCH_SOURCES.mpc.identifierEndpoint}`, { timeout: 5000 })
      .then(r => { result.mpc = r.ok; })
      .catch(() => { result.mpc = false; }),
  ];

  await Promise.allSettled(checks);
  return result;
}
