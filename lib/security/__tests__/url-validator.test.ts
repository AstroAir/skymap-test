/**
 * Tests for url-validator.ts
 */

import {
  SecurityError,
  LIMITS,
  validateUrl,
  validateSize,
  validateJsonSize,
  validateCsvSize,
  sanitizeHtml,
  isUrlSafe,
  extractDomain,
} from '../url-validator';

describe('SecurityError', () => {
  it('should create error with message and code', () => {
    const error = new SecurityError('Test message', 'TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('SecurityError');
  });

  it('should be instanceof Error', () => {
    const error = new SecurityError('Test', 'CODE');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('LIMITS', () => {
  it('should have MAX_JSON_SIZE', () => {
    expect(LIMITS.MAX_JSON_SIZE).toBe(10 * 1024 * 1024);
  });

  it('should have MAX_CSV_SIZE', () => {
    expect(LIMITS.MAX_CSV_SIZE).toBe(50 * 1024 * 1024);
  });

  it('should have MAX_URL_LENGTH', () => {
    expect(LIMITS.MAX_URL_LENGTH).toBe(2048);
  });

  it('should have MAX_CSV_ROWS', () => {
    expect(LIMITS.MAX_CSV_ROWS).toBe(100_000);
  });
});

describe('validateUrl', () => {
  describe('valid URLs', () => {
    it('should accept valid HTTPS URL', () => {
      const url = validateUrl('https://example.com/path');
      expect(url.hostname).toBe('example.com');
    });

    it('should accept HTTP URL when allowHttp is true', () => {
      const url = validateUrl('http://example.com', { allowHttp: true });
      expect(url.protocol).toBe('http:');
    });
  });

  describe('invalid URLs', () => {
    it('should reject URL exceeding max length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      expect(() => validateUrl(longUrl)).toThrow(SecurityError);
    });

    it('should reject invalid URL format', () => {
      expect(() => validateUrl('not-a-url')).toThrow(SecurityError);
    });

    it('should reject HTTP URL by default', () => {
      expect(() => validateUrl('http://example.com')).toThrow(SecurityError);
    });
  });

  describe('blocked hosts', () => {
    it('should reject localhost', () => {
      expect(() => validateUrl('https://localhost')).toThrow(SecurityError);
    });

    it('should reject 127.0.0.1', () => {
      expect(() => validateUrl('https://127.0.0.1')).toThrow(SecurityError);
    });

    it('should reject private IP 192.168.x.x', () => {
      expect(() => validateUrl('https://192.168.1.1')).toThrow(SecurityError);
    });

    it('should reject private IP 10.x.x.x', () => {
      expect(() => validateUrl('https://10.0.0.1')).toThrow(SecurityError);
    });

    it('should reject private IP 172.16-31.x.x', () => {
      expect(() => validateUrl('https://172.16.0.1')).toThrow(SecurityError);
    });
  });

  describe('blocked schemes', () => {
    it('should reject file: scheme', () => {
      expect(() => validateUrl('file:///etc/passwd')).toThrow(SecurityError);
    });

    it('should reject javascript: scheme', () => {
      expect(() => validateUrl('javascript:alert(1)')).toThrow(SecurityError);
    });
  });

  describe('allowlist', () => {
    it('should accept URL in allowlist', () => {
      const url = validateUrl('https://api.example.com/data', {
        allowlist: ['example.com'],
      });
      expect(url.hostname).toBe('api.example.com');
    });

    it('should reject URL not in allowlist', () => {
      expect(() =>
        validateUrl('https://other.com', { allowlist: ['example.com'] })
      ).toThrow(SecurityError);
    });

    it('should accept exact domain match in allowlist', () => {
      const url = validateUrl('https://example.com/path', {
        allowlist: ['example.com'],
      });
      expect(url.hostname).toBe('example.com');
    });

    it('should pass when allowlist is empty array', () => {
      const url = validateUrl('https://example.com');
      expect(url.hostname).toBe('example.com');
    });

    it('should pass when allowlist is not provided', () => {
      const url = validateUrl('https://example.com', {});
      expect(url.hostname).toBe('example.com');
    });
  });

  describe('error codes', () => {
    it('should throw URL_TOO_LONG for long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      try {
        validateUrl(longUrl);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(SecurityError);
        expect((e as SecurityError).code).toBe('URL_TOO_LONG');
      }
    });

    it('should throw INVALID_URL for malformed URLs', () => {
      try {
        validateUrl('not-a-url');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(SecurityError);
        expect((e as SecurityError).code).toBe('INVALID_URL');
      }
    });

    it('should throw INVALID_SCHEME for HTTP when not allowed', () => {
      try {
        validateUrl('http://example.com');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(SecurityError);
        expect((e as SecurityError).code).toBe('INVALID_SCHEME');
      }
    });

    it('should throw BLOCKED_LOCALHOST for localhost', () => {
      try {
        validateUrl('https://localhost');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(SecurityError);
        expect((e as SecurityError).code).toBe('BLOCKED_LOCALHOST');
      }
    });

    it('should throw BLOCKED_PRIVATE_IP for private IPs', () => {
      try {
        validateUrl('https://192.168.1.1');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(SecurityError);
        expect((e as SecurityError).code).toBe('BLOCKED_PRIVATE_IP');
      }
    });

    it('should throw URL_NOT_ALLOWLISTED for non-allowed domains', () => {
      try {
        validateUrl('https://other.com', { allowlist: ['example.com'] });
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(SecurityError);
        expect((e as SecurityError).code).toBe('URL_NOT_ALLOWLISTED');
      }
    });
  });

  describe('more private IP ranges', () => {
    it('should reject 169.254.x.x (link-local)', () => {
      expect(() => validateUrl('https://169.254.1.1')).toThrow(SecurityError);
    });

    it('should reject 127.0.0.2 (loopback variant)', () => {
      expect(() => validateUrl('https://127.0.0.2')).toThrow(SecurityError);
    });

    it('should reject 172.31.x.x (upper bound)', () => {
      expect(() => validateUrl('https://172.31.255.1')).toThrow(SecurityError);
    });

    it('should reject 172.20.x.x (mid range)', () => {
      expect(() => validateUrl('https://172.20.0.1')).toThrow(SecurityError);
    });

    it('should allow 172.32.x.x (outside private range)', () => {
      const url = validateUrl('https://172.32.0.1');
      expect(url.hostname).toBe('172.32.0.1');
    });

    it('should allow 11.0.0.1 (outside 10.x range)', () => {
      const url = validateUrl('https://11.0.0.1');
      expect(url.hostname).toBe('11.0.0.1');
    });
  });

  describe('more localhost variants', () => {
    it('should reject foo.localhost subdomain', () => {
      expect(() => validateUrl('https://foo.localhost')).toThrow(SecurityError);
    });

    it('should reject 127.1.2.3', () => {
      expect(() => validateUrl('https://127.1.2.3')).toThrow(SecurityError);
    });
  });

  describe('more blocked schemes', () => {
    it('should reject ftp: scheme', () => {
      expect(() => validateUrl('ftp://example.com/file')).toThrow(SecurityError);
    });

    it('should reject data: scheme', () => {
      expect(() => validateUrl('data:text/html,<h1>hi</h1>')).toThrow(SecurityError);
    });

    it('should reject mailto: scheme', () => {
      expect(() => validateUrl('mailto:user@example.com')).toThrow(SecurityError);
    });

    it('should reject tel: scheme', () => {
      expect(() => validateUrl('tel:+1234567890')).toThrow(SecurityError);
    });
  });

  describe('valid URL details', () => {
    it('should preserve query parameters', () => {
      const url = validateUrl('https://example.com/path?key=value&foo=bar');
      expect(url.search).toBe('?key=value&foo=bar');
    });

    it('should preserve fragment', () => {
      const url = validateUrl('https://example.com/path#section');
      expect(url.hash).toBe('#section');
    });

    it('should preserve pathname', () => {
      const url = validateUrl('https://example.com/api/v1/data');
      expect(url.pathname).toBe('/api/v1/data');
    });

    it('should handle HTTPS URL with port', () => {
      const url = validateUrl('https://example.com:8443/path');
      expect(url.port).toBe('8443');
    });

    it('should include correct error message for INVALID_SCHEME with allowHttp', () => {
      try {
        validateUrl('ftp://example.com', { allowHttp: true });
        fail('Should have thrown');
      } catch (e) {
        expect((e as SecurityError).message).toContain('HTTP');
      }
    });
  });
});

describe('validateSize', () => {
  it('should accept data within limit', () => {
    expect(() => validateSize('hello', 100)).not.toThrow();
  });

  it('should reject data exceeding limit', () => {
    expect(() => validateSize('hello world', 5)).toThrow(SecurityError);
  });

  it('should handle ArrayBuffer', () => {
    const buffer = new ArrayBuffer(10);
    expect(() => validateSize(buffer, 100)).not.toThrow();
    expect(() => validateSize(buffer, 5)).toThrow(SecurityError);
  });

  it('should accept data exactly at the limit', () => {
    expect(() => validateSize('hello', 5)).not.toThrow();
  });

  it('should accept empty string', () => {
    expect(() => validateSize('', 100)).not.toThrow();
  });

  it('should accept empty ArrayBuffer', () => {
    const buffer = new ArrayBuffer(0);
    expect(() => validateSize(buffer, 100)).not.toThrow();
  });

  it('should throw with correct error code', () => {
    try {
      validateSize('hello world', 5);
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(SecurityError);
      expect((e as SecurityError).code).toBe('INPUT_TOO_LARGE');
    }
  });
});

describe('validateJsonSize', () => {
  it('should accept JSON within limit', () => {
    const json = JSON.stringify({ key: 'value' });
    expect(() => validateJsonSize(json)).not.toThrow();
  });

  it('should reject JSON exceeding limit', () => {
    const largeJson = 'x'.repeat(LIMITS.MAX_JSON_SIZE + 1);
    expect(() => validateJsonSize(largeJson)).toThrow(SecurityError);
  });
});

describe('validateCsvSize', () => {
  it('should accept CSV within limits', () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6';
    expect(() => validateCsvSize(csv)).not.toThrow();
  });

  it('should reject CSV with too many rows', () => {
    const rows = Array(LIMITS.MAX_CSV_ROWS + 10).fill('a,b,c').join('\n');
    expect(() => validateCsvSize(rows)).toThrow(SecurityError);
  });

  it('should throw TOO_MANY_ROWS error code for row limit', () => {
    const rows = Array(LIMITS.MAX_CSV_ROWS + 10).fill('a,b,c').join('\n');
    try {
      validateCsvSize(rows);
      fail('Should have thrown');
    } catch (e) {
      expect((e as SecurityError).code).toBe('TOO_MANY_ROWS');
    }
  });

  it('should reject CSV exceeding byte size limit', () => {
    const largeCsv = 'x'.repeat(LIMITS.MAX_CSV_SIZE + 1);
    expect(() => validateCsvSize(largeCsv)).toThrow(SecurityError);
  });

  it('should accept CSV at exactly the row limit', () => {
    const rows = Array(LIMITS.MAX_CSV_ROWS).fill('a').join('\n');
    expect(() => validateCsvSize(rows)).not.toThrow();
  });
});

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const html = '<div>Hello<script>alert(1)</script></div>';
    expect(sanitizeHtml(html)).toBe('<div>Hello</div>');
  });

  it('should remove onclick handlers', () => {
    const html = '<button onclick="alert(1)">Click</button>';
    expect(sanitizeHtml(html)).toBe('<button >Click</button>');
  });

  it('should remove javascript: in attributes', () => {
    const html = '<a href="javascript:alert(1)">Link</a>';
    expect(sanitizeHtml(html)).not.toContain('javascript:');
  });

  it('should preserve safe HTML', () => {
    const html = '<div class="test">Hello World</div>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('should remove single-quoted event handlers', () => {
    const html = "<div onmouseover='alert(1)'>Hover</div>";
    expect(sanitizeHtml(html)).toBe('<div >Hover</div>');
  });

  it('should handle empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should remove multiple script tags', () => {
    const html = '<script>a()</script>Hello<script>b()</script>';
    expect(sanitizeHtml(html)).toBe('Hello');
  });

  it('should remove multiple different event handlers', () => {
    const html = '<div onclick="a()" onmouseover="b()">Text</div>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onmouseover');
  });

  it('should handle plain text without HTML', () => {
    expect(sanitizeHtml('Hello World')).toBe('Hello World');
  });
});

describe('isUrlSafe', () => {
  it('should return true for safe HTTPS URL', () => {
    expect(isUrlSafe('https://example.com')).toBe(true);
  });

  it('should return false for HTTP URL', () => {
    expect(isUrlSafe('http://example.com')).toBe(false);
  });

  it('should return false for localhost', () => {
    expect(isUrlSafe('https://localhost')).toBe(false);
  });

  it('should return false for private IP', () => {
    expect(isUrlSafe('https://192.168.1.1')).toBe(false);
  });

  it('should return false for invalid URL', () => {
    expect(isUrlSafe('not-a-url')).toBe(false);
  });
});

describe('extractDomain', () => {
  it('should extract domain from valid URL', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
  });

  it('should extract domain with port', () => {
    expect(extractDomain('https://example.com:8080')).toBe('example.com');
  });

  it('should return empty string for invalid URL', () => {
    expect(extractDomain('not-a-url')).toBe('');
  });

  it('should handle subdomain', () => {
    expect(extractDomain('https://api.example.com')).toBe('api.example.com');
  });
});
