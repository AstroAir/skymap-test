import { buildCanonicalId, normalizeIdentifierToken, normalizeWhitespace } from './normalize';

export type MinorObjectKind =
  | 'numbered'
  | 'provisional'
  | 'packed_provisional'
  | 'old_style'
  | 'survey'
  | 'comet';

export interface ParsedMinorIdentifier {
  kind: MinorObjectKind;
  category: 'asteroid' | 'comet';
  originalInput: string;
  normalized: string;
  canonicalId: string;
  number?: number;
}

const GREEK_OLD_STYLE = [
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta',
  'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu',
  'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau',
  'upsilon', 'phi', 'chi', 'psi', 'omega',
];

export function parseMinorIdentifier(input: string): ParsedMinorIdentifier | null {
  const trimmed = normalizeWhitespace(input);
  if (!trimmed) return null;

  const parenNumberMatch = trimmed.match(/^\(\s*(\d{1,7})\s*\)$/);
  if (parenNumberMatch) {
    const number = Number.parseInt(parenNumberMatch[1], 10);
    return {
      kind: 'numbered',
      category: 'asteroid',
      originalInput: input,
      normalized: `(${number})`,
      canonicalId: `(${number})`,
      number,
    };
  }

  const plainNumberMatch = trimmed.match(/^\d{1,7}$/);
  if (plainNumberMatch) {
    const number = Number.parseInt(plainNumberMatch[0], 10);
    return {
      kind: 'numbered',
      category: 'asteroid',
      originalInput: input,
      normalized: `${number}`,
      canonicalId: `(${number})`,
      number,
    };
  }

  const cometNumberedMatch = trimmed.match(/^(\d{1,4})([PCXDAI])(?:-([A-Z]{1,2}))?$/i);
  if (cometNumberedMatch) {
    const number = Number.parseInt(cometNumberedMatch[1], 10);
    const type = cometNumberedMatch[2].toUpperCase();
    const fragment = cometNumberedMatch[3]?.toUpperCase();
    const normalized = fragment ? `${number}${type}-${fragment}` : `${number}${type}`;
    return {
      kind: 'comet',
      category: 'comet',
      originalInput: input,
      normalized,
      canonicalId: buildCanonicalId(normalized),
      number,
    };
  }

  const cometProvisionalMatch = trimmed.match(/^([PCXDAI])\s*\/\s*([12]\d{3})\s*([A-Z])\s*(\d{1,3})(?:-([A-Z]{1,2}))?$/i);
  if (cometProvisionalMatch) {
    const prefix = cometProvisionalMatch[1].toUpperCase();
    const year = cometProvisionalMatch[2];
    const halfMonth = cometProvisionalMatch[3].toUpperCase();
    const order = cometProvisionalMatch[4];
    const fragment = cometProvisionalMatch[5]?.toUpperCase();
    const normalized = fragment
      ? `${prefix}/${year} ${halfMonth}${order}-${fragment}`
      : `${prefix}/${year} ${halfMonth}${order}`;
    return {
      kind: 'comet',
      category: 'comet',
      originalInput: input,
      normalized,
      canonicalId: buildCanonicalId(normalized),
    };
  }

  const cometPackedMatch = trimmed.match(/^[PCXDAI][IJK][0-9]{2}[A-Z][A-Za-z0-9]{3}[0-9a-z]$/);
  if (cometPackedMatch) {
    return {
      kind: 'comet',
      category: 'comet',
      originalInput: input,
      normalized: trimmed,
      canonicalId: buildCanonicalId(trimmed),
    };
  }

  const surveyMatch = trimmed.match(/^(\d{1,4})\s*(P-L|T-[123])$/i);
  if (surveyMatch) {
    const normalized = `${Number.parseInt(surveyMatch[1], 10)} ${surveyMatch[2].toUpperCase()}`;
    return {
      kind: 'survey',
      category: 'asteroid',
      originalInput: input,
      normalized,
      canonicalId: buildCanonicalId(normalized),
    };
  }

  const packedSurveyMatch = trimmed.match(/^(PLS|T1S|T2S|T3S)(\d{1,4})$/i);
  if (packedSurveyMatch) {
    const normalized = `${packedSurveyMatch[1].toUpperCase()}${Number.parseInt(packedSurveyMatch[2], 10)}`;
    return {
      kind: 'survey',
      category: 'asteroid',
      originalInput: input,
      normalized,
      canonicalId: buildCanonicalId(normalized),
    };
  }

  const provisionalMatch = trimmed.match(/^([12]\d{3})\s*([A-HJ-NP-Y])([A-HJ-Z])\s*(\d{0,4})$/i);
  if (provisionalMatch) {
    const year = provisionalMatch[1];
    const halfMonth = provisionalMatch[2].toUpperCase();
    const seq = provisionalMatch[3].toUpperCase();
    const cycle = provisionalMatch[4];
    const suffix = cycle ? `${seq}${cycle}` : seq;
    const normalized = `${year} ${halfMonth}${suffix}`;
    return {
      kind: 'provisional',
      category: 'asteroid',
      originalInput: input,
      normalized,
      canonicalId: buildCanonicalId(normalized),
    };
  }

  const packedProvisionalMatch = trimmed.match(/^[IJK][0-9]{2}[A-Z][A-Za-z0-9]{2}[A-Z]$/);
  if (packedProvisionalMatch) {
    return {
      kind: 'packed_provisional',
      category: 'asteroid',
      originalInput: input,
      normalized: trimmed,
      canonicalId: buildCanonicalId(trimmed),
    };
  }

  const oldStyleLowerMatch = trimmed.match(/^\d{4}\s+[a-z]{1,2}$/);
  if (oldStyleLowerMatch) {
    const normalized = normalizeIdentifierToken(trimmed);
    return {
      kind: 'old_style',
      category: 'asteroid',
      originalInput: input,
      normalized,
      canonicalId: buildCanonicalId(normalized),
    };
  }

  const oldStyleClassicMatch = trimmed.match(/^\d{4}\s+[A-HJ-Z]{1,2}$/);
  if (oldStyleClassicMatch) {
    const normalized = normalizeIdentifierToken(trimmed);
    return {
      kind: 'old_style',
      category: 'asteroid',
      originalInput: input,
      normalized,
      canonicalId: buildCanonicalId(normalized),
    };
  }

  const oldStyleGreekMatch = trimmed.match(/^(\d{4})\s+([A-Za-z]+)$/);
  if (oldStyleGreekMatch && GREEK_OLD_STYLE.includes(oldStyleGreekMatch[2].toLowerCase())) {
    const normalized = `${oldStyleGreekMatch[1]} ${oldStyleGreekMatch[2].toLowerCase()}`;
    return {
      kind: 'old_style',
      category: 'asteroid',
      originalInput: input,
      normalized,
      canonicalId: buildCanonicalId(normalized),
    };
  }

  const sigmaMatch = trimmed.match(/^(?:(\d{4})\s+)?SIG(?:MA)?\s+([A-Za-z0-9]+)$/i);
  if (sigmaMatch) {
    const year = sigmaMatch[1] ?? '';
    const token = sigmaMatch[2];
    const normalized = year ? `${year} SIGMA ${token}` : `SIGMA ${token}`;
    return {
      kind: 'old_style',
      category: 'asteroid',
      originalInput: input,
      normalized,
      canonicalId: buildCanonicalId(normalized),
    };
  }

  return null;
}

export function isExplicitMinorObjectQuery(input: string): boolean {
  return parseMinorIdentifier(input) !== null;
}
