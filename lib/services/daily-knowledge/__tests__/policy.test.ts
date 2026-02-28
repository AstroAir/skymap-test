import {
  parseRetryAfterMs,
  withRetry,
  withWikimediaGate,
  isRetryableStatus,
  isAbortLikeError,
  createRequestSignal,
} from '../policy';

jest.mock('../constants', () => ({
  RETRY_DELAYS_MS: [10, 20, 40] as const,
  WIKIMEDIA_MIN_REQUEST_INTERVAL_MS: 10,
}));

describe('daily-knowledge/policy', () => {
  describe('parseRetryAfterMs', () => {
    it('returns null for null/undefined/empty', () => {
      expect(parseRetryAfterMs(null)).toBeNull();
      expect(parseRetryAfterMs(undefined)).toBeNull();
      expect(parseRetryAfterMs('')).toBeNull();
    });

    it('parses integer seconds to milliseconds', () => {
      expect(parseRetryAfterMs('5')).toBe(5000);
      expect(parseRetryAfterMs('0')).toBe(0);
      expect(parseRetryAfterMs('120')).toBe(120000);
    });

    it('parses HTTP-date to ms delta', () => {
      const futureDate = new Date(Date.now() + 5000).toUTCString();
      const result = parseRetryAfterMs(futureDate);
      expect(result).not.toBeNull();
      expect(result!).toBeGreaterThan(0);
      expect(result!).toBeLessThanOrEqual(6000);
    });

    it('returns 0 for past HTTP-date', () => {
      const pastDate = new Date(Date.now() - 10000).toUTCString();
      const result = parseRetryAfterMs(pastDate);
      expect(result).toBe(0);
    });

    it('returns null for non-parseable strings', () => {
      expect(parseRetryAfterMs('not-a-number-or-date')).toBeNull();
    });
  });

  describe('isRetryableStatus', () => {
    it('returns true for 429', () => {
      expect(isRetryableStatus(429)).toBe(true);
    });

    it('returns true for 500+', () => {
      expect(isRetryableStatus(500)).toBe(true);
      expect(isRetryableStatus(502)).toBe(true);
      expect(isRetryableStatus(503)).toBe(true);
    });

    it('returns false for 200, 400, 404', () => {
      expect(isRetryableStatus(200)).toBe(false);
      expect(isRetryableStatus(400)).toBe(false);
      expect(isRetryableStatus(404)).toBe(false);
    });
  });

  describe('isAbortLikeError', () => {
    it('returns false for null/undefined/non-object', () => {
      expect(isAbortLikeError(null)).toBe(false);
      expect(isAbortLikeError(undefined)).toBe(false);
      expect(isAbortLikeError('string')).toBe(false);
      expect(isAbortLikeError(42)).toBe(false);
    });

    it('detects AbortError by name', () => {
      const error = new DOMException('The operation was aborted', 'AbortError');
      expect(isAbortLikeError(error)).toBe(true);
    });

    it('detects AbortError by code', () => {
      expect(isAbortLikeError({ code: 'ABORT_ERR' })).toBe(true);
    });

    it('detects abort by message content', () => {
      expect(isAbortLikeError({ message: 'The user aborted the request' })).toBe(true);
      expect(isAbortLikeError({ message: 'Request was ABORTED' })).toBe(true);
    });

    it('returns false for non-abort errors', () => {
      expect(isAbortLikeError({ message: 'Network error' })).toBe(false);
      expect(isAbortLikeError({ name: 'TypeError' })).toBe(false);
    });
  });

  describe('createRequestSignal', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('creates a signal that aborts after timeout', () => {
      const { signal, cleanup } = createRequestSignal(1000);
      expect(signal.aborted).toBe(false);

      jest.advanceTimersByTime(1000);
      expect(signal.aborted).toBe(true);

      cleanup();
    });

    it('cleanup prevents timeout abort', () => {
      const { signal, cleanup } = createRequestSignal(1000);
      cleanup();
      jest.advanceTimersByTime(2000);
      expect(signal.aborted).toBe(false);
    });

    it('propagates external signal abort', () => {
      const controller = new AbortController();
      const { signal, cleanup } = createRequestSignal(10000, controller.signal);

      expect(signal.aborted).toBe(false);
      controller.abort();
      expect(signal.aborted).toBe(true);

      cleanup();
    });

    it('aborts immediately if external signal already aborted', () => {
      const controller = new AbortController();
      controller.abort();
      const { signal, cleanup } = createRequestSignal(10000, controller.signal);
      expect(signal.aborted).toBe(true);
      cleanup();
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns result on immediate success', async () => {
      const fn = jest.fn().mockResolvedValue('ok');
      const result = await withRetry(fn, () => true);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries and succeeds on second attempt', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok');

      const task = withRetry(fn, () => true);
      await jest.advanceTimersByTimeAsync(10);
      const result = await task;
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws last error after exhausting retries', async () => {
      jest.useRealTimers();
      const error = new Error('persistent fail');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, () => true)).rejects.toThrow('persistent fail');
      expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      jest.useFakeTimers();
    });

    it('stops retrying when shouldRetry returns false', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('no retry'));
      const task = withRetry(fn, () => false);
      await expect(task).rejects.toThrow('no retry');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('respects retryAfterMs on error object', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ retryAfterMs: 100, message: 'rate limited' })
        .mockResolvedValue('ok');

      const task = withRetry(fn, () => true);
      // retryAfterMs (100) > RETRY_DELAYS_MS[0] (10), so should use 100
      await jest.advanceTimersByTimeAsync(100);
      const result = await task;
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('withWikimediaGate', () => {
    // These tests use real timers since the mocked WIKIMEDIA_MIN_REQUEST_INTERVAL_MS is 10ms
    beforeEach(() => {
      jest.useRealTimers();
    });

    it('executes function and returns result', async () => {
      const result = await withWikimediaGate(async () => 'done');
      expect(result).toBe('done');
    });

    it('serializes concurrent calls', async () => {
      const order: number[] = [];

      const p1 = withWikimediaGate(async () => {
        order.push(1);
        return 'a';
      });
      const p2 = withWikimediaGate(async () => {
        order.push(2);
        return 'b';
      });

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toBe('a');
      expect(r2).toBe('b');
      expect(order).toEqual([1, 2]);
    });

    it('releases gate even if function throws', async () => {
      const failing = withWikimediaGate(async () => {
        throw new Error('fail');
      });
      await expect(failing).rejects.toThrow('fail');

      // Wait for the WIKIMEDIA_MIN_REQUEST_INTERVAL_MS (mocked to 10ms) gate
      await new Promise((r) => setTimeout(r, 50));

      const result = await withWikimediaGate(async () => 'after-failure');
      expect(result).toBe('after-failure');
    });
  });
});
