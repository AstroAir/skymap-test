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
