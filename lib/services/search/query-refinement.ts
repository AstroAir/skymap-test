import type { SearchRefinementHint } from './search-intent';

export interface SearchQueryRefinement {
  normalized: string;
  executionQuery: string;
  normalizationSteps: string[];
  refinementHints: SearchRefinementHint[];
}

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
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

function normalizeLineWhitespace(input: string): string {
  return input.replace(/[ \t]+/g, ' ').trim();
}

function normalizeCatalogAlias(input: string): { value: string; step?: string } {
  if (/^[a-z@]+\s*:/i.test(input)) {
    return { value: input };
  }

  const messier = input.match(/^(messier|m)\s*[-:]?\s*(\d+[a-z]?)$/i);
  if (messier) {
    return {
      value: `M${messier[2].toUpperCase()}`,
      step: 'Normalized Messier alias to canonical catalog form',
    };
  }

  const prefixed = input.match(/^(ngc|ic|hip|hd)\s*[-:]?\s*([a-z0-9.+-]+)$/i);
  if (prefixed) {
    return {
      value: `${prefixed[1].toUpperCase()}${prefixed[2].toUpperCase()}`,
      step: `Normalized ${prefixed[1].toUpperCase()} alias to canonical catalog form`,
    };
  }

  return { value: input };
}

function normalizeCoordinateFormat(input: string): { value: string; step?: string; hint?: SearchRefinementHint } {
  const raDecKeywords = input.match(
    /^@?\s*ra\s*[:=]?\s*([^\s,;]+(?:\s+[^\s,;]+)?)\s*[,;\s]+\s*dec\s*[:=]?\s*([^\s,;]+(?:\s+[^\s,;]+)?)$/i
  );
  if (raDecKeywords) {
    return {
      value: `${raDecKeywords[1]}, ${raDecKeywords[2]}`,
      step: 'Normalized RA/Dec keyword coordinate format',
    };
  }

  if (input.startsWith('@')) {
    const raw = input.slice(1).trim().replace(/\s*;\s*/g, ', ');
    if (/^.+[, ]\s*[+-]?\S+$/.test(raw)) {
      return {
        value: `@${raw}`,
        step: 'Normalized @-prefixed coordinate separators',
      };
    }

    return {
      value: input,
      hint: {
        code: 'COORDINATE_FORMAT_HINT',
        level: 'warning',
        message: 'Invalid coordinate format. Use @RA, Dec (example: @05:34:32, +22:00:52).',
      },
    };
  }

  return { value: input };
}

function normalizeMinorPattern(input: string): { value: string; step?: string } {
  const strippedPrefix = input.match(/^(asteroid|comet)\s*:\s*(.+)$/i);
  if (strippedPrefix) {
    return {
      value: strippedPrefix[2].trim(),
      step: `Normalized ${strippedPrefix[1].toLowerCase()} prefix query`,
    };
  }

  const provisional = input.match(/^(\d{4})\s*([a-z]{1,2})\s*-?\s*(\d{1,3})$/i);
  if (provisional) {
    return {
      value: `${provisional[1]} ${provisional[2].toUpperCase()}${provisional[3]}`,
      step: 'Normalized minor provisional designation format',
    };
  }

  const packed = input.match(/^[a-z]\d{2}[a-z0-9]{4}$/i);
  if (packed) {
    return {
      value: input.toUpperCase(),
      step: 'Normalized packed minor designation case',
    };
  }

  return { value: input };
}

function refineSingleLine(line: string): {
  executionQuery: string;
  steps: string[];
  hints: SearchRefinementHint[];
} {
  const steps: string[] = [];
  const hints: SearchRefinementHint[] = [];
  let executionQuery = normalizeLineWhitespace(line);

  const catalog = normalizeCatalogAlias(executionQuery);
  executionQuery = catalog.value;
  if (catalog.step) {
    steps.push(catalog.step);
    hints.push({
      code: 'CATALOG_ALIAS_NORMALIZED',
      level: 'info',
      message: `Catalog alias normalized to "${executionQuery}".`,
    });
  }

  const coordinate = normalizeCoordinateFormat(executionQuery);
  executionQuery = coordinate.value;
  if (coordinate.step) {
    steps.push(coordinate.step);
    hints.push({
      code: 'COORDINATE_FORMAT_NORMALIZED',
      level: 'info',
      message: 'Coordinate query normalized before execution.',
    });
  }
  if (coordinate.hint) {
    hints.push(coordinate.hint);
  }

  const minor = normalizeMinorPattern(executionQuery);
  executionQuery = minor.value;
  if (minor.step) {
    steps.push(minor.step);
    hints.push({
      code: 'MINOR_IDENTIFIER_NORMALIZED',
      level: 'info',
      message: `Minor object identifier normalized to "${executionQuery}".`,
    });
  }

  return { executionQuery, steps, hints };
}

export function refineSearchQuery(query: string): SearchQueryRefinement {
  const normalized = normalizePunctuation(query);
  const lines = normalized.split('\n');
  const normalizationSteps: string[] = [];
  const refinementHints: SearchRefinementHint[] = [];

  const refinedLines = lines.map((line, index) => {
    const refined = refineSingleLine(line);
    if (refined.steps.length > 0) {
      normalizationSteps.push(
        ...refined.steps.map(step =>
          lines.length > 1 ? `Line ${index + 1}: ${step}` : step
        )
      );
    }
    if (refined.hints.length > 0) {
      refinementHints.push(
        ...refined.hints.map(hint =>
          lines.length > 1
            ? { ...hint, message: `Line ${index + 1}: ${hint.message}` }
            : hint
        )
      );
    }
    return refined.executionQuery;
  });

  return {
    normalized: refinedLines.map(normalizeLineWhitespace).join('\n').trim(),
    executionQuery: refinedLines.join('\n').trim(),
    normalizationSteps,
    refinementHints,
  };
}
