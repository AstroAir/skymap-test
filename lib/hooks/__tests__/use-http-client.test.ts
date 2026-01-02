/**
 * Tests for useHttpClient and useFetch hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useHttpClient, useFetch } from '../use-http-client';
import type { UseHttpClientOptions } from '../use-http-client';

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

jest.mock('@tauri-apps/api/event', () => ({
  listen: jest.fn(),
}));

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

// Mock smartFetch
jest.mock('@/lib/services/http-fetch', () => ({
  smartFetch: jest.fn(),
  cancelRequest: jest.fn(),
  checkUrl: jest.fn(),
  batchDownload: jest.fn(),
}));

import { smartFetch, cancelRequest, checkUrl, batchDownload } from '@/lib/services/http-fetch';

const mockSmartFetch = smartFetch as jest.MockedFunction<typeof smartFetch>;
const _mockCancelRequest = cancelRequest as jest.MockedFunction<typeof cancelRequest>;
const mockCheckUrl = checkUrl as jest.MockedFunction<typeof checkUrl>;
const mockBatchDownload = batchDownload as jest.MockedFunction<typeof batchDownload>;

describe('useHttpClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useHttpClient());

      expect(result.current.state.data).toBeNull();
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.progress).toBeNull();
    });

    it('should accept custom options', () => {
      const options: UseHttpClientOptions = {
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        defaultHeaders: { 'X-Custom': 'value' },
        allowHttp: true,
      };

      const { result } = renderHook(() => useHttpClient(options));

      expect(result.current.isTauriEnv).toBe(false);
    });

    it('should provide all HTTP methods', () => {
      const { result } = renderHook(() => useHttpClient());

      expect(typeof result.current.get).toBe('function');
      expect(typeof result.current.post).toBe('function');
      expect(typeof result.current.put).toBe('function');
      expect(typeof result.current.del).toBe('function');
      expect(typeof result.current.download).toBe('function');
      expect(typeof result.current.batchDownload).toBe('function');
      expect(typeof result.current.checkUrl).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.cancelAll).toBe('function');
    });
  });

  describe('GET requests', () => {
    it('should make a GET request and update state', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockSmartFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        url: 'https://api.example.com/data',
        text: jest.fn(),
        json: jest.fn().mockResolvedValue(mockData),
        bytes: jest.fn(),
        blob: jest.fn(),
      });

      const { result } = renderHook(() => useHttpClient());

      let response: typeof mockData | undefined;
      await act(async () => {
        response = await result.current.get<typeof mockData>('https://api.example.com/data');
      });

      expect(response).toEqual(mockData);
      expect(result.current.state.data).toEqual(mockData);
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.error).toBeNull();
    });

    it('should handle GET request errors', async () => {
      mockSmartFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {},
        url: 'https://api.example.com/data',
        text: jest.fn(),
        json: jest.fn(),
        bytes: jest.fn(),
        blob: jest.fn(),
      });

      const { result } = renderHook(() => useHttpClient());

      await act(async () => {
        await expect(result.current.get('https://api.example.com/data')).rejects.toThrow();
      });

      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.error).not.toBeNull();
    });

    it('should prepend baseUrl to relative URLs', async () => {
      mockSmartFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        url: 'https://api.example.com/data',
        text: jest.fn(),
        json: jest.fn().mockResolvedValue({}),
        bytes: jest.fn(),
        blob: jest.fn(),
      });

      const { result } = renderHook(() => useHttpClient({ baseUrl: 'https://api.example.com' }));

      await act(async () => {
        await result.current.get('/data');
      });

      expect(mockSmartFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should make a POST request with body', async () => {
      const mockResponse = { id: 1, created: true };
      mockSmartFetch.mockResolvedValue({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: {},
        url: 'https://api.example.com/data',
        text: jest.fn(),
        json: jest.fn().mockResolvedValue(mockResponse),
        bytes: jest.fn(),
        blob: jest.fn(),
      });

      const { result } = renderHook(() => useHttpClient());

      let response: typeof mockResponse | undefined;
      await act(async () => {
        response = await result.current.post<typeof mockResponse>(
          'https://api.example.com/data',
          { name: 'Test' }
        );
      });

      expect(response).toEqual(mockResponse);
    });
  });

  describe('PUT requests', () => {
    it('should make a PUT request', async () => {
      mockSmartFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        url: 'https://api.example.com/data/1',
        text: jest.fn(),
        json: jest.fn().mockResolvedValue({ updated: true }),
        bytes: jest.fn(),
        blob: jest.fn(),
      });

      const { result } = renderHook(() => useHttpClient());

      await act(async () => {
        await result.current.put('https://api.example.com/data/1', { name: 'Updated' });
      });

      expect(mockSmartFetch).toHaveBeenCalled();
    });
  });

  describe('DELETE requests', () => {
    it('should make a DELETE request', async () => {
      mockSmartFetch.mockResolvedValue({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: {},
        url: 'https://api.example.com/data/1',
        text: jest.fn(),
        json: jest.fn().mockResolvedValue(null),
        bytes: jest.fn(),
        blob: jest.fn(),
      });

      const { result } = renderHook(() => useHttpClient());

      await act(async () => {
        await result.current.del('https://api.example.com/data/1');
      });

      expect(mockSmartFetch).toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it('should download with progress callback', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        url: 'https://example.com/file.zip',
        text: jest.fn(),
        json: jest.fn(),
        bytes: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        blob: jest.fn(),
      };
      mockSmartFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useHttpClient());
      const onProgress = jest.fn();

      await act(async () => {
        await result.current.download('https://example.com/file.zip', onProgress);
      });

      expect(mockSmartFetch).toHaveBeenCalled();
    });
  });

  describe('batchDownload', () => {
    it('should batch download multiple URLs', async () => {
      mockBatchDownload.mockResolvedValue({
        success: 3,
        failed: 0,
        results: [
          { url: 'https://example.com/1', success: true },
          { url: 'https://example.com/2', success: true },
          { url: 'https://example.com/3', success: true },
        ],
      });

      const { result } = renderHook(() => useHttpClient());

      let response: { success: number; failed: number } | undefined;
      await act(async () => {
        response = await result.current.batchDownload([
          'https://example.com/1',
          'https://example.com/2',
          'https://example.com/3',
        ]);
      });

      expect(response?.success).toBe(3);
      expect(response?.failed).toBe(0);
    });

    it('should call onItemComplete for each item', async () => {
      mockBatchDownload.mockResolvedValue({
        success: 2,
        failed: 0,
        results: [
          { url: 'https://example.com/1', success: true },
          { url: 'https://example.com/2', success: true },
        ],
      });

      const { result } = renderHook(() => useHttpClient());
      const onItemComplete = jest.fn();

      await act(async () => {
        await result.current.batchDownload(
          ['https://example.com/1', 'https://example.com/2'],
          { onItemComplete }
        );
      });

      expect(mockBatchDownload).toHaveBeenCalled();
    });
  });

  describe('checkUrl', () => {
    it('should check if URL is accessible', async () => {
      mockCheckUrl.mockResolvedValue(true);

      const { result } = renderHook(() => useHttpClient());

      let isAccessible: boolean | undefined;
      await act(async () => {
        isAccessible = await result.current.checkUrl('https://example.com');
      });

      expect(isAccessible).toBe(true);
    });

    it('should return false for inaccessible URL', async () => {
      mockCheckUrl.mockResolvedValue(false);

      const { result } = renderHook(() => useHttpClient());

      let isAccessible: boolean | undefined;
      await act(async () => {
        isAccessible = await result.current.checkUrl('https://example.com/notfound');
      });

      expect(isAccessible).toBe(false);
    });
  });

  describe('cancel', () => {
    it('should cancel current request', async () => {
      const { result } = renderHook(() => useHttpClient());

      act(() => {
        result.current.cancel();
      });

      expect(result.current.state.loading).toBe(false);
    });
  });

  describe('loading state', () => {
    it('should set loading to true during request', async () => {
      // Create a delayed mock response
      mockSmartFetch.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              statusText: 'OK',
              headers: {},
              url: 'https://api.example.com/data',
              text: jest.fn(),
              json: jest.fn().mockResolvedValue({}),
              bytes: jest.fn(),
              blob: jest.fn(),
            });
          }, 100);
        })
      );

      const { result } = renderHook(() => useHttpClient());

      act(() => {
        result.current.get('https://api.example.com/data').catch(() => {});
      });

      // Loading should be true while request is pending
      expect(result.current.state.loading).toBe(true);
    });
  });
});

describe('useFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch data on mount', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockSmartFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {},
      url: 'https://api.example.com/data',
      text: jest.fn(),
      json: jest.fn().mockResolvedValue(mockData),
      bytes: jest.fn(),
      blob: jest.fn(),
    });

    const { result } = renderHook(() => useFetch<typeof mockData>('https://api.example.com/data'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch when URL is null', async () => {
    const { result } = renderHook(() => useFetch(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(mockSmartFetch).not.toHaveBeenCalled();
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(() => 
      useFetch('https://api.example.com/data', { enabled: false })
    );

    expect(result.current.loading).toBe(false);
    expect(mockSmartFetch).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    mockSmartFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFetch('https://api.example.com/data'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should handle non-OK response', async () => {
    mockSmartFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      url: 'https://api.example.com/data',
      text: jest.fn(),
      json: jest.fn(),
      bytes: jest.fn(),
      blob: jest.fn(),
    });

    const { result } = renderHook(() => useFetch('https://api.example.com/data'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
  });

  it('should provide refetch function', async () => {
    const mockData = { id: 1 };
    mockSmartFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {},
      url: 'https://api.example.com/data',
      text: jest.fn(),
      json: jest.fn().mockResolvedValue(mockData),
      bytes: jest.fn(),
      blob: jest.fn(),
    });

    const { result } = renderHook(() => useFetch('https://api.example.com/data'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    // Call refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(mockSmartFetch).toHaveBeenCalledTimes(2);
  });

  it('should use custom options', async () => {
    mockSmartFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {},
      url: 'https://api.example.com/data',
      text: jest.fn(),
      json: jest.fn().mockResolvedValue({}),
      bytes: jest.fn(),
      blob: jest.fn(),
    });

    renderHook(() => 
      useFetch('https://api.example.com/data', {
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        allowHttp: true,
      })
    );

    await waitFor(() => {
      expect(mockSmartFetch).toHaveBeenCalled();
    });

    expect(mockSmartFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        timeout: 5000,
        allowHttp: true,
      })
    );
  });

  it('should cancel previous request when URL changes', async () => {
    mockSmartFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {},
      url: 'https://api.example.com/data',
      text: jest.fn(),
      json: jest.fn().mockResolvedValue({}),
      bytes: jest.fn(),
      blob: jest.fn(),
    });

    const { result, rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: 'https://api.example.com/data1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change URL
    rerender({ url: 'https://api.example.com/data2' });

    await waitFor(() => {
      expect(mockSmartFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('HttpRequestState', () => {
  it('should have correct initial state structure', () => {
    const { result } = renderHook(() => useHttpClient());

    expect(result.current.state).toEqual({
      data: null,
      loading: false,
      error: null,
      progress: null,
    });
  });
});
