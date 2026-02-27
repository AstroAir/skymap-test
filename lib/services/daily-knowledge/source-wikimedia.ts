import { unifiedCache } from '@/lib/offline/unified-cache';
import {
  DAILY_KNOWLEDGE_USER_AGENT,
  DAILY_KNOWLEDGE_WIKI_BASE_URLS,
  DAILY_KNOWLEDGE_WIKI_PAGE_PATH,
  DAILY_KNOWLEDGE_WIKI_SEARCH_PATH,
  WIKIMEDIA_REQUEST_TIMEOUT_MS,
  WIKIMEDIA_TTL_MS,
} from './constants';
import { buildItem } from './normalizers';
import {
  createRequestSignal,
  isAbortLikeError,
  isRetryableStatus,
  parseRetryAfterMs,
  withRetry,
  withWikimediaGate,
} from './policy';
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

interface FetchWikimediaOptions {
  locale?: 'en' | 'zh';
  signal?: AbortSignal;
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

function getWikiBase(locale: 'en' | 'zh'): string {
  return DAILY_KNOWLEDGE_WIKI_BASE_URLS[locale];
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  return withRetry(
    async () =>
      withWikimediaGate(async () => {
        const res = await unifiedCache.fetch(
          url,
          {
            ttl: WIKIMEDIA_TTL_MS,
            signal,
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
      if (isAbortLikeError(error)) return false;
      if (!(error instanceof WikiHttpStatusError)) return true;
      return isRetryableStatus(error.status);
    }
  );
}

async function fetchWikimediaItemForLocale(
  dateKey: string,
  query: string,
  locale: 'en' | 'zh',
  externalSignal?: AbortSignal
): Promise<DailyKnowledgeItem | null> {
  const { signal, cleanup } = createRequestSignal(WIKIMEDIA_REQUEST_TIMEOUT_MS, externalSignal);
  const base = getWikiBase(locale);

  try {
    const searchParams = new URLSearchParams({
      q: query,
      limit: '1',
    });
    const search = await fetchJson<WikimediaSearchResponse>(
      `${base}${DAILY_KNOWLEDGE_WIKI_SEARCH_PATH}?${searchParams.toString()}`,
      signal
    );

    const hit = search.pages?.[0];
    if (!hit?.key || !hit.title) return null;

    const bare = await fetchJson<WikimediaBarePageResponse>(
      `${base}${DAILY_KNOWLEDGE_WIKI_PAGE_PATH}/${encodeURIComponent(hit.key)}/bare`,
      signal
    );

    const withHtml = await fetchJson<WikimediaHtmlPageResponse>(
      `${base}${DAILY_KNOWLEDGE_WIKI_PAGE_PATH}/${encodeURIComponent(hit.key)}/with_html`,
      signal
    );

    const bodyText = withHtml.html ? stripHtml(withHtml.html).slice(0, 2000) : '';
    const summaryText = stripHtml(hit.description ?? hit.excerpt ?? bodyText.slice(0, 240));
    const sourceUrl =
      bare.html_url ?? `${base}/wiki/${encodeURIComponent(hit.key)}`;
    const imageUrl = hit.thumbnail?.url
      ? hit.thumbnail.url.startsWith('//')
        ? `https:${hit.thumbnail.url}`
        : hit.thumbnail.url
      : undefined;

    return buildItem({
      id: `wikimedia-${locale}-${hit.key.toLowerCase()}`,
      dateKey,
      source: 'wikimedia',
      title: hit.title,
      summary: summaryText || hit.title,
      body: bodyText || summaryText || hit.title,
      contentLanguage: locale,
      categories: ['history', 'culture'],
      tags: ['wikipedia', 'wikimedia', locale],
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
      factSources: [
        {
          title: `Wikipedia: ${hit.title}`,
          url: sourceUrl,
          publisher: 'Wikimedia Foundation',
        },
      ],
      fetchedAt: Date.now(),
    });
  } finally {
    cleanup();
  }
}

export async function fetchWikimediaItem(
  dateKey: string,
  query: string,
  options: FetchWikimediaOptions = {}
): Promise<DailyKnowledgeItem | null> {
  if (!query.trim()) return null;

  const requestedLocale = options.locale ?? 'en';
  const localeOrder: Array<'en' | 'zh'> = requestedLocale === 'zh' ? ['zh', 'en'] : ['en'];
  let lastError: unknown = null;

  for (const locale of localeOrder) {
    try {
      const item = await fetchWikimediaItemForLocale(dateKey, query, locale, options.signal);
      if (item) {
        return item;
      }
    } catch (error) {
      if (isAbortLikeError(error)) {
        throw error;
      }
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}
