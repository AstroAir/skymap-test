import type { SearchResultItem } from '@/lib/core/types';

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

function getSource(item: SearchResultItem): string {
  return item._onlineSource || 'local';
}

function getPriority(item: SearchResultItem, sourcePriority: Record<string, number>): number {
  const source = getSource(item);
  return sourcePriority[source] ?? sourcePriority.unknown ?? 100;
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

    for (const existing of merged) {
      const existingName = normalizeName(existing.Name);
      const existingAliases = new Set(aliasesFromCommonNames(existing['Common names']));

      const coordMatch = shouldMergeByCoordinates(existing, incoming, thresholdArcsec);
      const nameMatch =
        incomingName &&
        (incomingName === existingName || incomingAliases.has(existingName) || existingAliases.has(incomingName));

      if (coordMatch.merge || nameMatch) {
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
        const idx = merged.indexOf(existing);
        merged[idx] = next;
        return;
      }
    }

    const toAdd = { ...incoming };
    toAdd._sourcePriority = getPriority(toAdd, sourcePriority);
    attachContextDistance(toAdd, options.coordinateContext);
    merged.push(toAdd);
  };

  for (const item of localResults) mergeInto(item);
  for (const item of onlineResults) mergeInto(item);

  return merged
    .sort((a, b) => (a._sourcePriority ?? 999) - (b._sourcePriority ?? 999))
    .slice(0, options.maxResults);
}
