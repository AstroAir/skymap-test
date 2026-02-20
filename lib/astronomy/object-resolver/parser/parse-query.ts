import { parseCatalogIdentifier, type ParsedCatalogIdentifier } from './catalog-parser';
import { parseCoordinateQuery, type ParsedCoordinate } from './coordinate-parser';
import { parseMinorIdentifier, type ParsedMinorIdentifier } from './minor-parser';
import { buildCanonicalId, normalizeWhitespace } from './normalize';

export type ParsedQueryKind = 'coordinate' | 'minor' | 'catalog' | 'name';

export interface ParsedQuery {
  originalInput: string;
  normalizedInput: string;
  kind: ParsedQueryKind;
  canonicalId: string;
  coordinate?: ParsedCoordinate;
  minor?: ParsedMinorIdentifier;
  catalog?: ParsedCatalogIdentifier;
  explicitMinor: boolean;
}

export function parseQuery(input: string): ParsedQuery {
  const normalizedInput = normalizeWhitespace(input);

  const coordinate = parseCoordinateQuery(normalizedInput);
  if (coordinate) {
    return {
      originalInput: input,
      normalizedInput,
      kind: 'coordinate',
      canonicalId: `COORD:${coordinate.ra.toFixed(7)},${coordinate.dec.toFixed(7)}`,
      coordinate,
      explicitMinor: false,
    };
  }

  const minor = parseMinorIdentifier(normalizedInput);
  if (minor) {
    return {
      originalInput: input,
      normalizedInput,
      kind: 'minor',
      canonicalId: minor.canonicalId,
      minor,
      explicitMinor: true,
    };
  }

  const catalog = parseCatalogIdentifier(normalizedInput);
  if (catalog) {
    return {
      originalInput: input,
      normalizedInput,
      kind: 'catalog',
      canonicalId: buildCanonicalId(catalog.normalized),
      catalog,
      coordinate: parseCoordinateQuery(catalog.normalized) ?? undefined,
      explicitMinor: false,
    };
  }

  return {
    originalInput: input,
    normalizedInput,
    kind: 'name',
    canonicalId: buildCanonicalId(normalizedInput),
    explicitMinor: false,
  };
}
