import { unifiedCache } from '@/lib/offline/unified-cache';
import {
  DAILY_KNOWLEDGE_USER_AGENT,
  DAILY_KNOWLEDGE_WIKI_PAGE_URL,
  DAILY_KNOWLEDGE_WIKI_SEARCH_URL,
  WIKIMEDIA_TTL_MS,
} from './constants';
import { buildItem } from './normalizers';
import { isRetryableStatus, parseRetryAfterMs, withRetry, withWikimediaGate } from './policy';
import type { DailyKnowledgeItem } from './types';

interface WikimediaSearchResult {
  key: string;
  title: string;
  description?: string;
  excerpt?: string;
  thumbnail?: {
    url?: string;
  };
}

interface WikimediaSearchResponse {
  pages?: WikimediaSearchResult[];
}

interface WikimediaBarePageResponse {
  title?: string;
  html_url?: string;
  license?: {
    name?: string;
    url?: string;
  };
}

interface WikimediaHtmlPageResponse {
  html?: string;
}

class WikiHttpStatusError extends Error {
  status: number;
  retryAfterMs: number | null;

  constructor(status: number, retryAfterMs: number | null, message: string) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson<T>(url: string): Promise<T> {
  return withRetry(
    async () =>
      withWikimediaGate(async () => {
        const res = await unifiedCache.fetch(
          url,
          {
            ttl: WIKIMEDIA_TTL_MS,
            headers: {
              'Api-User-Agent': DAILY_KNOWLEDGE_USER_AGENT,
              Accept: 'application/json',
            },
          },
          'network-first'
        );
        if (!res.ok) {
          throw new WikiHttpStatusError(
            res.status,
            parseRetryAfterMs(res.headers.get('Retry-After')),
            `Wikimedia request failed with status ${res.status}`
          );
        }
        return (await res.json()) as T;
      }),
    (error) => {
      if (!(error instanceof WikiHttpStatusError)) return true;
      return isRetryableStatus(error.status);
    }
  );
}

export async function fetchWikimediaItem(
  dateKey: string,
  query: string
): Promise<DailyKnowledgeItem | null> {
  if (!query.trim()) return null;

  const searchParams = new URLSearchParams({
    q: query,
    limit: '1',
  });
  const search = await fetchJson<WikimediaSearchResponse>(
    `${DAILY_KNOWLEDGE_WIKI_SEARCH_URL}?${searchParams.toString()}`
  );

  const hit = search.pages?.[0];
  if (!hit?.key || !hit.title) return null;

  const bare = await fetchJson<WikimediaBarePageResponse>(
    `${DAILY_KNOWLEDGE_WIKI_PAGE_URL}/${encodeURIComponent(hit.key)}/bare`
  );

  const withHtml = await fetchJson<WikimediaHtmlPageResponse>(
    `${DAILY_KNOWLEDGE_WIKI_PAGE_URL}/${encodeURIComponent(hit.key)}/with_html`
  );

  const bodyText = withHtml.html ? stripHtml(withHtml.html).slice(0, 2000) : '';
  const summaryText = stripHtml(hit.description ?? hit.excerpt ?? bodyText.slice(0, 240));
  const sourceUrl = bare.html_url ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.key)}`;
  const imageUrl = hit.thumbnail?.url
    ? hit.thumbnail.url.startsWith('//')
      ? `https:${hit.thumbnail.url}`
      : hit.thumbnail.url
    : undefined;

  return buildItem({
    id: `wikimedia-${hit.key.toLowerCase()}`,
    dateKey,
    source: 'wikimedia',
    title: hit.title,
    summary: summaryText || hit.title,
    body: bodyText || summaryText || hit.title,
    contentLanguage: 'en',
    categories: ['history', 'culture'],
    tags: ['wikipedia', 'wikimedia'],
    image: imageUrl
      ? {
          url: imageUrl,
          thumbnailUrl: imageUrl,
          type: 'image',
        }
      : undefined,
    externalUrl: sourceUrl,
    relatedObjects: [{ name: hit.title }],
    attribution: {
      sourceName: 'Wikimedia / Wikipedia',
      sourceUrl,
      licenseName: bare.license?.name,
      licenseUrl: bare.license?.url,
    },
    fetchedAt: Date.now(),
  });
}
