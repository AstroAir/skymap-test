import { unifiedCache } from '@/lib/offline/unified-cache';
import { APOD_REQUEST_TIMEOUT_MS, APOD_TTL_MS, DAILY_KNOWLEDGE_APOD_URL } from './constants';
import { buildItem } from './normalizers';
import { createRequestSignal, isAbortLikeError, isRetryableStatus, parseRetryAfterMs, withRetry } from './policy';
import type { DailyKnowledgeItem } from './types';

interface ApodResponse {
  date: string;
  title: string;
  explanation: string;
  url?: string;
  hdurl?: string;
  media_type?: 'image' | 'video';
  thumbnail_url?: string;
  copyright?: string;
}

class HttpStatusError extends Error {
  status: number;
  retryAfterMs: number | null;

  constructor(status: number, retryAfterMs: number | null, message: string) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

interface FetchApodOptions {
  signal?: AbortSignal;
}

export async function fetchApodItem(
  dateKey: string,
  apiKey: string,
  options: FetchApodOptions = {}
): Promise<DailyKnowledgeItem | null> {
  const query = new URLSearchParams({
    api_key: apiKey,
    date: dateKey,
    thumbs: 'true',
  });
  const url = `${DAILY_KNOWLEDGE_APOD_URL}?${query.toString()}`;
  const { signal, cleanup } = createRequestSignal(APOD_REQUEST_TIMEOUT_MS, options.signal);

  try {
    const response = await withRetry(
      async () => {
        const res = await unifiedCache.fetch(
          url,
          { ttl: APOD_TTL_MS, signal },
          'network-first'
        );
        if (!res.ok) {
          throw new HttpStatusError(
            res.status,
            parseRetryAfterMs(res.headers.get('Retry-After')),
            `APOD request failed with status ${res.status}`
          );
        }
        return res;
      },
      (error) => {
        if (isAbortLikeError(error)) return false;
        if (!(error instanceof HttpStatusError)) return true;
        return isRetryableStatus(error.status);
      }
    );

    const apod = (await response.json()) as ApodResponse;
    if (!apod?.title || !apod?.explanation) return null;

    const mediaType = apod.media_type === 'video' ? 'video' : 'image';
    const mediaUrl = mediaType === 'video' ? apod.thumbnail_url : apod.hdurl ?? apod.url;

    return buildItem({
      id: `apod-${apod.date}`,
      dateKey,
      source: 'nasa-apod',
      title: apod.title,
      summary: apod.explanation.slice(0, 240).trim(),
      body: apod.explanation,
      contentLanguage: 'en',
      categories: mediaType === 'video' ? ['mission', 'culture'] : ['object', 'mission'],
      tags: ['apod', 'nasa'],
      image: mediaUrl
        ? {
            url: mediaUrl,
            thumbnailUrl: apod.thumbnail_url,
            type: mediaType,
          }
        : undefined,
      externalUrl: apod.url,
      relatedObjects: [],
      attribution: {
        sourceName: 'NASA APOD',
        sourceUrl: apod.url ?? DAILY_KNOWLEDGE_APOD_URL,
        copyright: apod.copyright,
      },
      factSources: [
        {
          title: `NASA Astronomy Picture of the Day (${apod.date})`,
          url: apod.url ?? DAILY_KNOWLEDGE_APOD_URL,
          publisher: 'NASA',
        },
      ],
      fetchedAt: Date.now(),
    });
  } finally {
    cleanup();
  }
}
