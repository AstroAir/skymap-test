/**
 * Tests for HTTP Client API
 */

import {
  responseToString,
  responseToJson,
  responseToBytes,
  responseToBlob,
  generateRequestId,
} from '../http-api';
import type { HttpResponse } from '../http-api';

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

describe('HTTP API Helper Functions', () => {
  describe('responseToString', () => {
    it('should convert response body to string', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: [72, 101, 108, 108, 111], // "Hello"
        content_type: 'text/plain',
        content_length: 5,
        final_url: 'https://example.com',
        response_time_ms: 100,
      };

      expect(responseToString(response)).toBe('Hello');
    });

    it('should handle empty body', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: [],
        content_type: null,
        content_length: 0,
        final_url: 'https://example.com',
        response_time_ms: 50,
      };

      expect(responseToString(response)).toBe('');
    });

    it('should handle UTF-8 characters', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: [228, 184, 173, 230, 150, 135], // "中文"
        content_type: 'text/plain; charset=utf-8',
        content_length: 6,
        final_url: 'https://example.com',
        response_time_ms: 100,
      };

      expect(responseToString(response)).toBe('中文');
    });
  });

  describe('responseToJson', () => {
    it('should parse JSON response', () => {
      const jsonData = { name: 'test', value: 123 };
      const jsonString = JSON.stringify(jsonData);
      const body = Array.from(new TextEncoder().encode(jsonString));

      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body,
        content_type: 'application/json',
        content_length: body.length,
        final_url: 'https://example.com',
        response_time_ms: 100,
      };

      expect(responseToJson(response)).toEqual(jsonData);
    });

    it('should handle nested JSON', () => {
      const jsonData = {
        user: { id: 1, name: 'test' },
        items: [1, 2, 3],
        active: true,
      };
      const jsonString = JSON.stringify(jsonData);
      const body = Array.from(new TextEncoder().encode(jsonString));

      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body,
        content_type: 'application/json',
        content_length: body.length,
        final_url: 'https://example.com',
        response_time_ms: 100,
      };

      expect(responseToJson(response)).toEqual(jsonData);
    });

    it('should throw on invalid JSON', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: [123, 105, 110, 118, 97, 108, 105, 100], // "{invalid"
        content_type: 'application/json',
        content_length: 8,
        final_url: 'https://example.com',
        response_time_ms: 100,
      };

      expect(() => responseToJson(response)).toThrow();
    });
  });

  describe('responseToBytes', () => {
    it('should convert response body to Uint8Array', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: [1, 2, 3, 4, 5],
        content_type: 'application/octet-stream',
        content_length: 5,
        final_url: 'https://example.com',
        response_time_ms: 100,
      };

      const bytes = responseToBytes(response);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(5);
      expect(Array.from(bytes)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty body', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: [],
        content_type: null,
        content_length: 0,
        final_url: 'https://example.com',
        response_time_ms: 50,
      };

      const bytes = responseToBytes(response);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(0);
    });
  });

  describe('responseToBlob', () => {
    it('should convert response body to Blob', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: [1, 2, 3, 4, 5],
        content_type: 'application/octet-stream',
        content_length: 5,
        final_url: 'https://example.com',
        response_time_ms: 100,
      };

      const blob = responseToBlob(response);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBe(5);
      expect(blob.type).toBe('application/octet-stream');
    });

    it('should use default content type when null', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: [1, 2, 3],
        content_type: null,
        content_length: 3,
        final_url: 'https://example.com',
        response_time_ms: 50,
      };

      const blob = responseToBlob(response);
      expect(blob.type).toBe('application/octet-stream');
    });

    it('should handle image content type', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: [0x89, 0x50, 0x4E, 0x47], // PNG header
        content_type: 'image/png',
        content_length: 4,
        final_url: 'https://example.com/image.png',
        response_time_ms: 100,
      };

      const blob = responseToBlob(response);
      expect(blob.type).toBe('image/png');
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).not.toBe(id2);
    });

    it('should use default prefix', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^req-\d+-[a-z0-9]+$/);
    });

    it('should use custom prefix', () => {
      const id = generateRequestId('download');
      expect(id).toMatch(/^download-\d+-[a-z0-9]+$/);
    });

    it('should generate IDs with expected format', () => {
      const id = generateRequestId('test');
      const parts = id.split('-');

      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('test');
      expect(Number(parts[1])).toBeGreaterThan(0);
      expect(parts[2].length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('HTTP API Types', () => {
  describe('HttpResponse', () => {
    it('should have correct structure', () => {
      const response: HttpResponse = {
        status: 200,
        status_text: 'OK',
        headers: { 'content-type': 'application/json' },
        body: [123, 125],
        content_type: 'application/json',
        content_length: 2,
        final_url: 'https://api.example.com/data',
        response_time_ms: 150,
      };

      expect(response.status).toBe(200);
      expect(response.status_text).toBe('OK');
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.body).toEqual([123, 125]);
      expect(response.content_type).toBe('application/json');
      expect(response.content_length).toBe(2);
      expect(response.final_url).toBe('https://api.example.com/data');
      expect(response.response_time_ms).toBe(150);
    });

    it('should handle nullable fields', () => {
      const response: HttpResponse = {
        status: 404,
        status_text: 'Not Found',
        headers: {},
        body: [],
        content_type: null,
        content_length: null,
        final_url: 'https://api.example.com/missing',
        response_time_ms: 50,
      };

      expect(response.content_type).toBeNull();
      expect(response.content_length).toBeNull();
    });
  });
});

describe('HTTP API Integration (mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when not in Tauri environment', async () => {
    const { httpApi } = await import('../http-api');

    await expect(httpApi.get('https://example.com')).rejects.toThrow(
      'Tauri HTTP API is only available in desktop environment'
    );
  });

  it('should throw when calling post outside Tauri', async () => {
    const { httpApi } = await import('../http-api');

    await expect(httpApi.post('https://example.com', 'data')).rejects.toThrow(
      'Tauri HTTP API is only available in desktop environment'
    );
  });

  it('should throw when calling download outside Tauri', async () => {
    const { httpApi } = await import('../http-api');

    await expect(httpApi.download('https://example.com')).rejects.toThrow(
      'Tauri HTTP API is only available in desktop environment'
    );
  });

  it('should report unavailable in web environment', async () => {
    const { httpApi } = await import('../http-api');

    expect(httpApi.isAvailable()).toBe(false);
  });
});

describe('Convenience Functions', () => {
  it('should throw when fetchJson is called outside Tauri', async () => {
    const { fetchJson } = await import('../http-api');

    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'Tauri HTTP API is only available in desktop environment'
    );
  });

  it('should throw when fetchText is called outside Tauri', async () => {
    const { fetchText } = await import('../http-api');

    await expect(fetchText('https://example.com')).rejects.toThrow(
      'Tauri HTTP API is only available in desktop environment'
    );
  });

  it('should throw when fetchBytes is called outside Tauri', async () => {
    const { fetchBytes } = await import('../http-api');

    await expect(fetchBytes('https://example.com')).rejects.toThrow(
      'Tauri HTTP API is only available in desktop environment'
    );
  });
});
