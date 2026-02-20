import { parseRACoordinate, parseDecCoordinate } from '@/lib/astronomy/coordinates/conversions';
import { parseQuery as parseResolverQuery } from '@/lib/astronomy/object-resolver/parser/parse-query';
import { isCatalogPrefix, type CatalogPrefix, type ParsedCoordinate, type ParsedSearchQuery } from './search-intent';

function normalizePunctuation(input: string): string {
  return input
    .replace(/，/g, ',')
    .replace(/：/g, ':')
    .replace(/；/g, ';')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/【/g, '[')
    .replace(/】/g, ']')
    .replace(/\u3000/g, ' ')
    .trim();
}

function parseCoordinate(value: string): ParsedCoordinate | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const decimalMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)$/);
  if (decimalMatch) {
    const ra = parseRACoordinate(decimalMatch[1]);
    const dec = parseDecCoordinate(decimalMatch[2]);
    if (ra !== null && dec !== null) {
      return { ra, dec };
    }
  }

  const parts = trimmed.match(/^(\S+(?:\s+\S+)?)\s+([+-]?\S+(?:\s+\S+)?)$/);
  if (parts) {
    const ra = parseRACoordinate(parts[1]);
    const dec = parseDecCoordinate(parts[2]);
    if (ra !== null && dec !== null) {
      return { ra, dec };
    }
  }

  return undefined;
}

function parseCatalog(prefix: CatalogPrefix, value: string): string | undefined {
  const cleaned = value.replace(/\s+/g, '').trim();
  if (!cleaned) return undefined;
  if (!/^[a-z0-9.+-]+$/i.test(cleaned)) return undefined;

  switch (prefix) {
    case 'm':
      return `M${cleaned}`;
    case 'ngc':
      return `NGC${cleaned}`;
    case 'ic':
      return `IC${cleaned}`;
    case 'hd':
      return `HD${cleaned}`;
    case 'hip':
      return `HIP${cleaned}`;
    default:
      return undefined;
  }
}

function parseBatchQueries(normalized: string): string[] {
  return normalized
    .split(/\r?\n/)
    .map(v => v.trim())
    .filter(Boolean);
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const normalized = normalizePunctuation(query);
  const parsed: ParsedSearchQuery = {
    raw: query,
    normalized,
    intent: 'name',
    explicitMinor: false,
  };

  if (!normalized) {
    return parsed;
  }

  const batchQueries = parseBatchQueries(normalized);
  if (batchQueries.length > 1) {
    return {
      ...parsed,
      intent: 'batch',
      batchQueries,
    };
  }

  const commandMatch = normalized.match(/^([a-zA-Z@]+)\s*:\s*(.+)$/);
  if (commandMatch) {
    const rawPrefix = commandMatch[1].toLowerCase();
    const payload = commandMatch[2].trim();

    if (rawPrefix === '@') {
      const coordinates = parseCoordinate(payload);
      return {
        ...parsed,
        intent: coordinates ? 'coordinates' : 'name',
        commandPrefix: '@',
        coordinates,
        normalized: payload,
        explicitMinor: false,
      };
    }

    if (isCatalogPrefix(rawPrefix)) {
      const catalogQuery = parseCatalog(rawPrefix, payload);
      if (catalogQuery) {
        return {
          ...parsed,
          intent: 'catalog',
          commandPrefix: rawPrefix,
          catalogQuery,
          normalized: catalogQuery,
          explicitMinor: false,
        };
      }
    }
  }

  if (normalized.startsWith('@')) {
    const coordinates = parseCoordinate(normalized.slice(1));
    if (coordinates) {
      return {
        ...parsed,
        intent: 'coordinates',
        commandPrefix: '@',
        coordinates,
        normalized: normalized.slice(1).trim(),
        explicitMinor: false,
      };
    }
  }

  const resolver = parseResolverQuery(normalized);
  if (resolver.kind === 'coordinate' && resolver.coordinate) {
    return {
      ...parsed,
      intent: 'coordinates',
      coordinates: { ra: resolver.coordinate.ra, dec: resolver.coordinate.dec },
      canonicalId: resolver.canonicalId,
      explicitMinor: false,
    };
  }

  if (resolver.kind === 'minor') {
    return {
      ...parsed,
      intent: 'minor',
      canonicalId: resolver.canonicalId,
      explicitMinor: true,
    };
  }

  const coordinates = parseCoordinate(normalized);
  if (coordinates) {
    return {
      ...parsed,
      intent: 'coordinates',
      coordinates,
      canonicalId: resolver.canonicalId,
      explicitMinor: false,
    };
  }

  return {
    ...parsed,
    canonicalId: resolver.canonicalId,
    explicitMinor: false,
  };
}
