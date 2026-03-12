import type { SearchResultItem } from '@/lib/core/types';
import { getResultId } from '@/lib/core/search-utils';

export interface MergedResultMeta {
  mergedFrom?: string[];
  matchDistanceArcsec?: number;
}

export interface MergeSearchOptions {
  maxResults: number;
  coordinateContext?: { ra: number; dec: number };
  sourcePriority?: Record<string, number>;
  coordinateThresholdArcsec?: number;
}

const DEFAULT_SOURCE_PRIORITY: Record<string, number> = {
  mpc: 0,
  sesame: 1,
  simbad: 2,
  vizier: 3,
  ned: 4,
  local: 5,
  unknown: 10,
};

const DEFAULT_THRESHOLD_ARCSEC = 5;
const DEFAULT_MATCH_CONFIDENCE = 0.5;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function angularSeparationArcsec(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const dRa = toRadians(ra2 - ra1);
  const dDec = toRadians(dec2 - dec1);
  const a =
    Math.sin(dDec / 2) ** 2 +
    Math.cos(toRadians(dec1)) * Math.cos(toRadians(dec2)) * Math.sin(dRa / 2) ** 2;
  const rad = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (rad * 180 * 3600) / Math.PI;
}

function normalizeName(value: string | undefined): string {
  if (!value) return '';
  return value
    .replace(/^(name\s+|\*\s+|v\*\s+)/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function aliasesFromCommonNames(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(v => normalizeName(v))
    .filter(Boolean);
}

function normalizeCanonicalId(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function identifiers(item: SearchResultItem): string[] {
  const canonical = normalizeCanonicalId(item.CanonicalId);
  const extras = (item.Identifiers ?? []).map(normalizeCanonicalId).filter(Boolean);
  return canonical ? [canonical, ...extras] : extras;
}

function getSource(item: SearchResultItem): string {
  return item._onlineSource || 'local';
}

function getPriority(item: SearchResultItem, sourcePriority: Record<string, number>): number {
  const source = getSource(item);
  return sourcePriority[source] ?? sourcePriority.unknown ?? 100;
}

function getCanonicalQuality(item: SearchResultItem): number {
  if (item.CanonicalId) return 2;
  if ((item.Identifiers?.length ?? 0) > 0) return 1;
  return 0;
}

function getMatchConfidence(item: SearchResultItem): number {
  const score = item._fuzzyScore;
  if (typeof score === 'number' && Number.isFinite(score)) return score;
  return DEFAULT_MATCH_CONFIDENCE;
}

function getCoordinateProximityScore(
  item: SearchResultItem,
  coordinateContext?: { ra: number; dec: number }
): number {
  if (!coordinateContext || item.RA === undefined || item.Dec === undefined) return 0;
  const separationArcsec = angularSeparationArcsec(coordinateContext.ra, coordinateContext.dec, item.RA, item.Dec);
  return Math.max(0, 1 - separationArcsec / 3600);
}

function computeMergeScore(
  item: SearchResultItem,
  sourcePriority: Record<string, number>,
  coordinateContext?: { ra: number; dec: number }
): number {
  const priority = getPriority(item, sourcePriority);
  const sourceBonus = Math.max(0, 1 - priority / 10);
  const canonicalBonus = getCanonicalQuality(item);
  const matchBonus = getMatchConfidence(item);
  const proximityBonus = getCoordinateProximityScore(item, coordinateContext);
  return canonicalBonus * 100 + matchBonus * 25 + proximityBonus * 10 + sourceBonus;
}

function shouldMergeByCoordinates(
  base: SearchResultItem,
  candidate: SearchResultItem,
  thresholdArcsec: number
): { merge: boolean; distanceArcsec?: number } {
  if (base.RA === undefined || base.Dec === undefined || candidate.RA === undefined || candidate.Dec === undefined) {
    return { merge: false };
  }
  const distanceArcsec = angularSeparationArcsec(base.RA, base.Dec, candidate.RA, candidate.Dec);
  return {
    merge: distanceArcsec <= thresholdArcsec,
    distanceArcsec,
  };
}

function mergeNames(base: SearchResultItem, candidate: SearchResultItem): SearchResultItem {
  const names = new Set<string>();
  if (base.Name) {
    names.add(base.Name);
  }
  if (base['Common names']) {
    for (const alias of base['Common names'].split(',').map(v => v.trim()).filter(Boolean)) {
      names.add(alias);
    }
  }
  if (candidate.Name && normalizeName(candidate.Name) !== normalizeName(base.Name)) {
    names.add(candidate.Name);
  }
  if (candidate['Common names']) {
    for (const alias of candidate['Common names'].split(',').map(v => v.trim()).filter(Boolean)) {
      names.add(alias);
    }
  }
  if (names.size > 0) {
    base['Common names'] = Array.from(names).join(', ');
  }
  return base;
}

function mergePreferredFields(base: SearchResultItem, candidate: SearchResultItem): SearchResultItem {
  if (base.Magnitude === undefined && candidate.Magnitude !== undefined) base.Magnitude = candidate.Magnitude;
  if (!base.Size && candidate.Size) base.Size = candidate.Size;
  if (base.RA === undefined && candidate.RA !== undefined) base.RA = candidate.RA;
  if (base.Dec === undefined && candidate.Dec !== undefined) base.Dec = candidate.Dec;
  if (!base.Type && candidate.Type) base.Type = candidate.Type;
  if (!base.CanonicalId && candidate.CanonicalId) base.CanonicalId = candidate.CanonicalId;

  const mergedIdentifiers = new Set<string>([
    ...(base.Identifiers ?? []),
    ...(candidate.Identifiers ?? []),
  ]);
  if (mergedIdentifiers.size > 0) {
    base.Identifiers = Array.from(mergedIdentifiers);
  }
  return base;
}

function attachContextDistance(item: SearchResultItem, coordinateContext?: { ra: number; dec: number }) {
  if (!coordinateContext || item.RA === undefined || item.Dec === undefined) return;
  item._angularSeparation = angularSeparationArcsec(coordinateContext.ra, coordinateContext.dec, item.RA, item.Dec);
}

export function mergeSearchItems(
  localResults: SearchResultItem[],
  onlineResults: SearchResultItem[],
  options: MergeSearchOptions
): SearchResultItem[] {
  const sourcePriority = { ...DEFAULT_SOURCE_PRIORITY, ...(options.sourcePriority || {}) };
  const thresholdArcsec = options.coordinateThresholdArcsec ?? DEFAULT_THRESHOLD_ARCSEC;
  const merged: SearchResultItem[] = [];

  const mergeInto = (incoming: SearchResultItem) => {
    const incomingName = normalizeName(incoming.Name);
    const incomingAliases = new Set(aliasesFromCommonNames(incoming['Common names']));
    const incomingCanonical = new Set(identifiers(incoming));

    for (const existing of merged) {
      const existingName = normalizeName(existing.Name);
      const existingAliases = new Set(aliasesFromCommonNames(existing['Common names']));
      const existingCanonical = new Set(identifiers(existing));

      const coordMatch = shouldMergeByCoordinates(existing, incoming, thresholdArcsec);
      const canonicalMatch =
        incomingCanonical.size > 0 &&
        Array.from(incomingCanonical).some((canonical) => existingCanonical.has(canonical));
      const nameMatch =
        incomingName &&
        (incomingName === existingName || incomingAliases.has(existingName) || existingAliases.has(incomingName));
      const canUseNameMergeFallback =
        nameMatch &&
        !canonicalMatch &&
        !coordMatch.merge &&
        (existing.RA === undefined ||
          existing.Dec === undefined ||
          incoming.RA === undefined ||
          incoming.Dec === undefined) &&
        !!existing.Type &&
        existing.Type === incoming.Type;

      if (canonicalMatch || coordMatch.merge || canUseNameMergeFallback) {
        const preservedStableId = existing._stableId;
        const incomingPriority = getPriority(incoming, sourcePriority);
        const existingPriority = getPriority(existing, sourcePriority);
        const primary = incomingPriority < existingPriority ? incoming : existing;
        const secondary = primary === incoming ? existing : incoming;
        const next = { ...primary };
        mergeNames(next, secondary);
        mergePreferredFields(next, secondary);
        if (coordMatch.distanceArcsec !== undefined) {
          next._angularSeparation = coordMatch.distanceArcsec;
        }
        next._sourcePriority = getPriority(next, sourcePriority);
        next._mergeScore = computeMergeScore(next, sourcePriority, options.coordinateContext);
        next._stableId = preservedStableId || getResultId(next);
        const idx = merged.indexOf(existing);
        merged[idx] = next;
        return;
      }
    }

    const toAdd = { ...incoming };
    toAdd._sourcePriority = getPriority(toAdd, sourcePriority);
    attachContextDistance(toAdd, options.coordinateContext);
    toAdd._mergeScore = computeMergeScore(toAdd, sourcePriority, options.coordinateContext);
    toAdd._stableId = getResultId(toAdd);
    merged.push(toAdd);
  };

  for (const item of localResults) mergeInto(item);
  for (const item of onlineResults) mergeInto(item);

  return merged
    .sort((a, b) => {
      const scoreDelta = (b._mergeScore ?? 0) - (a._mergeScore ?? 0);
      if (Math.abs(scoreDelta) > 1e-9) return scoreDelta;
      const priorityDelta = (a._sourcePriority ?? 999) - (b._sourcePriority ?? 999);
      if (priorityDelta !== 0) return priorityDelta;
      return a.Name.localeCompare(b.Name);
    })
    .slice(0, options.maxResults);
}
