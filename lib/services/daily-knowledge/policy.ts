import { RETRY_DELAYS_MS, WIKIMEDIA_MIN_REQUEST_INTERVAL_MS } from './constants';

let wikiGate: Promise<void> = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseRetryAfterMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const seconds = Number.parseInt(value, 10);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return null;
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  shouldRetry: (error: unknown) => boolean
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= RETRY_DELAYS_MS.length || !shouldRetry(error)) {
        break;
      }
      const retryAfterMs =
        typeof error === 'object' &&
        error !== null &&
        'retryAfterMs' in error &&
        typeof (error as { retryAfterMs?: unknown }).retryAfterMs === 'number'
          ? ((error as { retryAfterMs: number }).retryAfterMs ?? 0)
          : 0;
      await sleep(Math.max(RETRY_DELAYS_MS[attempt], retryAfterMs));
    }
  }
  throw lastError;
}

export async function withWikimediaGate<T>(fn: () => Promise<T>): Promise<T> {
  const prev = wikiGate;
  let release: () => void = () => {};
  wikiGate = new Promise((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    return await fn();
  } finally {
    setTimeout(release, WIKIMEDIA_MIN_REQUEST_INTERVAL_MS);
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if ('name' in error && (error as { name?: string }).name === 'AbortError') return true;
  if ('code' in error && (error as { code?: string }).code === 'ABORT_ERR') return true;
  if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message.toLowerCase().includes('abort');
  }
  return false;
}

export function createRequestSignal(
  timeoutMs: number,
  externalSignal?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    },
  };
}
