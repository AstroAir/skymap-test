export const DAILY_KNOWLEDGE_APOD_URL = 'https://api.nasa.gov/planetary/apod';
export const DAILY_KNOWLEDGE_WIKI_SEARCH_URL = 'https://en.wikipedia.org/w/rest.php/v1/search/page';
export const DAILY_KNOWLEDGE_WIKI_PAGE_URL = 'https://en.wikipedia.org/w/rest.php/v1/page';

export const APOD_TTL_MS = 24 * 60 * 60 * 1000;
export const WIKIMEDIA_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const DAILY_KNOWLEDGE_AGGREGATED_TTL_FALLBACK_MS = 24 * 60 * 60 * 1000;
export const HISTORY_LIMIT = 120;

export const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;
export const WIKIMEDIA_MIN_REQUEST_INTERVAL_MS = 250;
export const DAILY_KNOWLEDGE_USER_AGENT = 'SkyMap/0.1.0 (daily-knowledge; contact: skymap-app)';
export const APOD_REQUEST_TIMEOUT_MS = 10_000;
export const WIKIMEDIA_REQUEST_TIMEOUT_MS = 10_000;
