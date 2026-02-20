export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeIdentifierToken(value: string): string {
  return normalizeWhitespace(value)
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s*-\s*/g, '-');
}

export function buildCanonicalId(value: string): string {
  return normalizeIdentifierToken(value).toUpperCase();
}

export function uniqueStrings(values: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    const trimmed = normalizeWhitespace(value);
    if (!trimmed) continue;
    const key = trimmed.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  return out;
}
