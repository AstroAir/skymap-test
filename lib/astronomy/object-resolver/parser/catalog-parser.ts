import { buildCanonicalId, normalizeIdentifierToken, normalizeWhitespace } from './normalize';

export interface ParsedCatalogIdentifier {
  catalog: string;
  number: number | null;
  suffix?: string;
  token?: string;
  originalInput: string;
  normalized: string;
}

interface PatternDefinition {
  catalog: string;
  patterns: RegExp[];
  format: (match: RegExpMatchArray) => ParsedCatalogIdentifier;
}

const DSO_PATTERNS: PatternDefinition[] = [
  {
    catalog: 'M',
    patterns: [/^M(?:ESSIER)?\s*(\d{1,3})$/i],
    format: (m) => ({
      catalog: 'M',
      number: Number.parseInt(m[1], 10),
      originalInput: m.input || '',
      normalized: `M${Number.parseInt(m[1], 10)}`,
    }),
  },
  {
    catalog: 'NGC',
    patterns: [/^NGC\s*(\d+)\s*([A-Z])?$/i, /^N\s*(\d+)\s*([A-Z])?$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      const suffix = m[2]?.toUpperCase();
      return {
        catalog: 'NGC',
        number,
        suffix,
        originalInput: m.input || '',
        normalized: suffix ? `NGC${number}${suffix}` : `NGC${number}`,
      };
    },
  },
  {
    catalog: 'IC',
    patterns: [/^IC\s*(\d+)\s*([A-Z])?$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      const suffix = m[2]?.toUpperCase();
      return {
        catalog: 'IC',
        number,
        suffix,
        originalInput: m.input || '',
        normalized: suffix ? `IC${number}${suffix}` : `IC${number}`,
      };
    },
  },
  {
    catalog: 'C',
    patterns: [/^C(?:ALDWELL)?\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'C',
        number,
        originalInput: m.input || '',
        normalized: `C${number}`,
      };
    },
  },
  {
    catalog: 'Sh2',
    patterns: [/^SH\s*2[-\s]*(\d+)$/i, /^SHARPLESS\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'Sh2',
        number,
        originalInput: m.input || '',
        normalized: `Sh2${number}`,
      };
    },
  },
  {
    catalog: 'B',
    patterns: [/^B(?:ARNARD)?\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'B',
        number,
        originalInput: m.input || '',
        normalized: `B${number}`,
      };
    },
  },
  {
    catalog: 'Abell',
    patterns: [/^ABELL\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'Abell',
        number,
        originalInput: m.input || '',
        normalized: `Abell${number}`,
      };
    },
  },
  {
    catalog: 'Mel',
    patterns: [/^MEL(?:OTTE)?\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'Mel',
        number,
        originalInput: m.input || '',
        normalized: `Mel${number}`,
      };
    },
  },
  {
    catalog: 'Cr',
    patterns: [/^CR(?:OLLINDER)?\s*(\d+)$/i, /^COLLINDER\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'Cr',
        number,
        originalInput: m.input || '',
        normalized: `Cr${number}`,
      };
    },
  },
  {
    catalog: 'Tr',
    patterns: [/^TR(?:UMPLER)?\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'Tr',
        number,
        originalInput: m.input || '',
        normalized: `Tr${number}`,
      };
    },
  },
  {
    catalog: 'vdB',
    patterns: [/^VDB\s*(\d+)$/i, /^VD\s*B\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'vdB',
        number,
        originalInput: m.input || '',
        normalized: `vdB${number}`,
      };
    },
  },
  {
    catalog: 'LDN',
    patterns: [/^LDN\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'LDN',
        number,
        originalInput: m.input || '',
        normalized: `LDN${number}`,
      };
    },
  },
  {
    catalog: 'LBN',
    patterns: [/^LBN\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'LBN',
        number,
        originalInput: m.input || '',
        normalized: `LBN${number}`,
      };
    },
  },
  {
    catalog: 'PGC',
    patterns: [/^PGC\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'PGC',
        number,
        originalInput: m.input || '',
        normalized: `PGC${number}`,
      };
    },
  },
  {
    catalog: 'UGC',
    patterns: [/^UGC\s*(\d+)$/i],
    format: (m) => {
      const number = Number.parseInt(m[1], 10);
      return {
        catalog: 'UGC',
        number,
        originalInput: m.input || '',
        normalized: `UGC${number}`,
      };
    },
  },
];

export function parseCatalogIdentifier(input: string): ParsedCatalogIdentifier | null {
  const trimmed = normalizeWhitespace(input);
  if (!trimmed) return null;

  for (const def of DSO_PATTERNS) {
    for (const pattern of def.patterns) {
      const match = trimmed.match(pattern);
      if (!match) continue;
      const parsed = def.format(match);
      return {
        ...parsed,
        originalInput: input,
      };
    }
  }

  const tycMatch = trimmed.match(/^TYC\s*(\d{1,5})[-\s](\d{1,5})[-\s](\d)$/i);
  if (tycMatch) {
    const token = `${Number.parseInt(tycMatch[1], 10)}-${Number.parseInt(tycMatch[2], 10)}-${tycMatch[3]}`;
    return {
      catalog: 'TYC',
      number: null,
      token,
      originalInput: input,
      normalized: `TYC ${token}`,
    };
  }

  const twoMassMatch = trimmed.match(/^2MASS\s*J?([0-9]{6,}[+-][0-9]{6,})$/i);
  if (twoMassMatch) {
    const token = twoMassMatch[1];
    return {
      catalog: '2MASS',
      number: null,
      token,
      originalInput: input,
      normalized: `2MASS J${token}`,
    };
  }

  const psrMatch = trimmed.match(/^(?:PSR\s*)?(J\d{4,6}(?:\.\d+)?[+-]\d{4,6})$/i);
  if (psrMatch) {
    const token = psrMatch[1].toUpperCase();
    return {
      catalog: 'PSR',
      number: null,
      token,
      originalInput: input,
      normalized: `PSR ${token}`,
    };
  }

  const simpleStarPatterns: Array<{ catalog: string; regex: RegExp }> = [
    { catalog: 'HD', regex: /^HD\s*(\d{1,9})$/i },
    { catalog: 'HIP', regex: /^HIP\s*(\d{1,9})$/i },
    { catalog: 'SAO', regex: /^SAO\s*(\d{1,9})$/i },
    { catalog: 'Gaia', regex: /^(?:GAIA(?:\s*DR\d+)?|GAIA\s*SOURCE)\s*(\d{6,20})$/i },
  ];

  for (const starPattern of simpleStarPatterns) {
    const match = trimmed.match(starPattern.regex);
    if (!match) continue;
    const number = Number.parseInt(match[1], 10);
    return {
      catalog: starPattern.catalog,
      number: Number.isFinite(number) ? number : null,
      token: match[1],
      originalInput: input,
      normalized: `${starPattern.catalog} ${match[1]}`,
    };
  }

  return null;
}

export function normalizeCatalogIdentifier(input: string): string {
  const parsed = parseCatalogIdentifier(input);
  if (parsed) {
    return parsed.normalized;
  }

  return buildCanonicalId(normalizeIdentifierToken(input));
}
