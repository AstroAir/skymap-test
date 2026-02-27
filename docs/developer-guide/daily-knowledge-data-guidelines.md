# Daily Knowledge Data Guidelines

This document defines the data quality rules for `lib/data/daily-knowledge-curated.ts`.

## Goals

- Keep `Daily Knowledge` bilingual (`en` + `zh`) and production-safe.
- Ensure each entry has traceable factual references.
- Keep online fallback reliable when external services are unavailable.

## Entry Requirements

Each curated entry must include:

- `id`: stable, unique, kebab-case identifier.
- `categories`: at least one valid `DailyKnowledgeCategory`.
- `tags`: meaningful retrieval tags for search/filter.
- `relatedObjects`: at least one object name for jump/navigation context.
- `localeContent.en` and `localeContent.zh`: non-empty `title`, `summary`, `body`.
- `factSources`: at least one source with:
  - `title` (human-readable)
  - `url` (must start with `https://`)
  - `publisher` (institution/site name)

Optional fields:

- `eventMonthDay` in `MM-DD` format for “today in astronomy” entries.
- `externalUrl`, `imageUrl`, `thumbnailUrl`, `imageType`.

## Attribution and Licensing

If an entry contains image URLs:

- `attribution.sourceUrl` must be present.
- `attribution.licenseName` must be present.
- Use only redistributable assets (public domain or explicit CC-compatible licenses).

## Curation Strategy

- Maintain roughly **30 curated entries**.
- Include at least **10 date-event entries** (`eventMonthDay`) for event-first selection.
- Keep the rest as high-value evergreen astronomy knowledge.

## Validation

Dataset integrity is enforced by:

- `lib/data/__tests__/daily-knowledge-curated.test.ts`
- `lib/services/daily-knowledge/__tests__/source-curated.test.ts`

When updating curated entries, run:

```bash
pnpm test lib/data/__tests__/daily-knowledge-curated.test.ts lib/services/daily-knowledge/__tests__/source-curated.test.ts
```
