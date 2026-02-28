/**
 * @jest-environment jsdom
 */

import { fetchApodItem } from '../source-apod';

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({ warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() }),
}));

const mockFetch = jest.fn();

jest.mock('@/lib/offline/unified-cache', () => ({
  unifiedCache: {
    fetch: (...args: unknown[]) => mockFetch(...args),
  },
}));

jest.mock('../constants', () => ({
  APOD_REQUEST_TIMEOUT_MS: 5000,
  APOD_TTL_MS: 86400000,
  DAILY_KNOWLEDGE_APOD_URL: 'https://api.nasa.gov/planetary/apod',
  RETRY_DELAYS_MS: [10, 20, 40] as const,
  WIKIMEDIA_MIN_REQUEST_INTERVAL_MS: 10,
}));

function makeApodResponse(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-02-20',
    title: 'Cosmic Clouds',
    explanation: 'A beautiful nebula captured by the Hubble Space Telescope showing intricate gas formations.',
    url: 'https://apod.nasa.gov/apod/image/cosmic.jpg',
    hdurl: 'https://apod.nasa.gov/apod/image/cosmic_hd.jpg',
    media_type: 'image',
    copyright: 'NASA/ESA',
    ...overrides,
  };
}

function makeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    headers: new Headers(),
  } as unknown as Response;
}

function makeErrorResponse(status: number, retryAfter?: string): Response {
  const headers = new Headers();
  if (retryAfter) headers.set('Retry-After', retryAfter);
  return {
    ok: false,
    status,
    json: async () => ({}),
    headers,
  } as unknown as Response;
}

describe('daily-knowledge/source-apod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a DailyKnowledgeItem for a valid APOD response', async () => {
    mockFetch.mockResolvedValue(makeOkResponse(makeApodResponse()));

    const item = await fetchApodItem('2026-02-20', 'DEMO_KEY');

    expect(item).not.toBeNull();
    expect(item!.id).toBe('apod-2026-02-20');
    expect(item!.source).toBe('nasa-apod');
    expect(item!.title).toBe('Cosmic Clouds');
    expect(item!.image?.url).toBe('https://apod.nasa.gov/apod/image/cosmic_hd.jpg');
    expect(item!.image?.type).toBe('image');
    expect(item!.attribution.sourceName).toBe('NASA APOD');
    expect(item!.attribution.copyright).toBe('NASA/ESA');
    expect(item!.tags).toContain('apod');
    expect(item!.tags).toContain('nasa');
  });

  it('uses thumbnail_url for video media type', async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse(
        makeApodResponse({
          media_type: 'video',
          url: 'https://youtube.com/embed/xyz',
          thumbnail_url: 'https://img.youtube.com/vi/xyz/0.jpg',
        })
      )
    );

    const item = await fetchApodItem('2026-02-20', 'DEMO_KEY');

    expect(item).not.toBeNull();
    expect(item!.image?.url).toBe('https://img.youtube.com/vi/xyz/0.jpg');
    expect(item!.image?.type).toBe('video');
    expect(item!.categories).toContain('mission');
    expect(item!.categories).toContain('culture');
  });

  it('falls back to url when hdurl is missing', async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse(makeApodResponse({ hdurl: undefined }))
    );

    const item = await fetchApodItem('2026-02-20', 'DEMO_KEY');
    expect(item!.image?.url).toBe('https://apod.nasa.gov/apod/image/cosmic.jpg');
  });

  it('returns null when title is missing', async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse(makeApodResponse({ title: '' }))
    );

    const item = await fetchApodItem('2026-02-20', 'DEMO_KEY');
    expect(item).toBeNull();
  });

  it('returns null when explanation is missing', async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse(makeApodResponse({ explanation: '' }))
    );

    const item = await fetchApodItem('2026-02-20', 'DEMO_KEY');
    expect(item).toBeNull();
  });

  it('passes api_key and date as query params', async () => {
    mockFetch.mockResolvedValue(makeOkResponse(makeApodResponse()));

    await fetchApodItem('2026-02-20', 'MY_KEY');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('api_key=MY_KEY');
    expect(url).toContain('date=2026-02-20');
    expect(url).toContain('thumbs=true');
  });

  it('throws on non-retryable HTTP error', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(404));

    await expect(fetchApodItem('2026-02-20', 'DEMO_KEY')).rejects.toThrow(
      'APOD request failed with status 404'
    );
  });

  it('retries on 429 and succeeds', async () => {
    jest.useFakeTimers();

    mockFetch
      .mockResolvedValueOnce(makeErrorResponse(429))
      .mockResolvedValue(makeOkResponse(makeApodResponse()));

    const task = fetchApodItem('2026-02-20', 'DEMO_KEY');
    await jest.advanceTimersByTimeAsync(10);
    const item = await task;

    expect(item).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('generates truncated summary from explanation', async () => {
    const longExplanation = 'A'.repeat(500);
    mockFetch.mockResolvedValue(
      makeOkResponse(makeApodResponse({ explanation: longExplanation }))
    );

    const item = await fetchApodItem('2026-02-20', 'DEMO_KEY');
    expect(item!.summary.length).toBeLessThanOrEqual(240);
  });

  it('sets image to undefined when no media url available', async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse(
        makeApodResponse({ url: undefined, hdurl: undefined, media_type: 'image' })
      )
    );

    const item = await fetchApodItem('2026-02-20', 'DEMO_KEY');
    expect(item!.image).toBeUndefined();
  });
});
