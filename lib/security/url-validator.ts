/**
 * Security utilities for frontend
 *
 * Provides URL validation, input sanitization, and other security controls
 */

/**
 * Security error types
 */
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Maximum allowed sizes for various inputs (in bytes)
 */
export const LIMITS = {
  MAX_JSON_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_CSV_SIZE: 50 * 1024 * 1024, // 50 MB
  MAX_URL_LENGTH: 2048,
  MAX_CSV_ROWS: 100_000,
} as const;

/**
 * Private IP ranges to block
 */
const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^127\./,
  /^::1$/,
  /^localhost$/i,
  /\.localhost$/i,
];

/**
 * Dangerous URL schemes to block
 */
const BLOCKED_SCHEMES = [
  'file:',
  'data:',
  'javascript:',
  'vbscript:',
  'ftp:',
  'mailto:',
  'tel:',
];

/**
 * Validate a URL to prevent SSRF attacks
 *
 * Security rules:
 * - Must be a valid URL
 * - Must use HTTPS (or HTTP if allowHttp = true)
 * - Must not resolve to private IP ranges (RFC 1918)
 * - Must not be localhost
 * - Must not use dangerous schemes (file://, data://, etc.)
 * - Optional: must be in allowlist
 *
 * @param urlStr - The URL string to validate
 * @param options - Validation options
 * @returns The validated URL object
 * @throws SecurityError if validation fails
 *
 * @example
 * ```ts
 * // Allow only HTTPS, no allowlist
 * validateUrl('https://api.example.com/data');
 *
 * // Block private IPs
 * validateUrl('https://192.168.1.1/data'); // throws SecurityError
 *
 * // Block localhost
 * validateUrl('https://localhost:8080'); // throws SecurityError
 * ```
 */
export function validateUrl(
  urlStr: string,
  options: {
    allowHttp?: boolean;
    allowlist?: string[];
  } = {}
): URL {
  const { allowHttp = false, allowlist } = options;

  // Check URL length
  if (urlStr.length > LIMITS.MAX_URL_LENGTH) {
    throw new SecurityError(
      `URL exceeds maximum length of ${LIMITS.MAX_URL_LENGTH} bytes`,
      'URL_TOO_LONG'
    );
  }

  // Parse URL
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch (e) {
    throw new SecurityError(
      `Invalid URL format: ${urlStr}`,
      'INVALID_URL'
    );
  }

  // Check scheme - only HTTPS (and optionally HTTP) allowed
  const scheme = url.protocol.toLowerCase();
  if (scheme === 'https:') {
    // Always allowed
  } else if (scheme === 'http:' && allowHttp) {
    // Conditionally allowed
  } else {
    throw new SecurityError(
      `Scheme '${scheme}' is not allowed (only HTTPS${allowHttp ? '/HTTP' : ''} is permitted)`,
      'INVALID_SCHEME'
    );
  }

  // Check for blocked schemes (defense in depth)
  if (BLOCKED_SCHEMES.some(s => urlStr.toLowerCase().startsWith(s))) {
    throw new SecurityError(
      `URL scheme is not allowed for security reasons`,
      'BLOCKED_SCHEME'
    );
  }

  // Check hostname
  const hostname = url.hostname.toLowerCase();

  // Block localhost variants
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('127.') ||
    hostname === '::1' ||
    hostname.endsWith('.localhost')
  ) {
    throw new SecurityError(
      'Localhost addresses are not allowed for security reasons',
      'BLOCKED_LOCALHOST'
    );
  }

  // Block private IP ranges
  if (PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
    throw new SecurityError(
      `IP address ${hostname} is in a private range and is not allowed`,
      'BLOCKED_PRIVATE_IP'
    );
  }

  // Optional allowlist check
  if (allowlist && allowlist.length > 0) {
    const isAllowed = allowlist.some(domain =>
      hostname === domain ||
      hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      throw new SecurityError(
        `Domain ${hostname} is not in the allowlist`,
        'URL_NOT_ALLOWLISTED'
      );
    }
  }

  return url;
}

/**
 * Validate input size against a maximum
 *
 * @param data - The data to validate (string or bytes)
 * @param maxSize - Maximum allowed size in bytes
 * @throws SecurityError if size exceeds maximum
 *
 * @example
 * ```ts
 * validateSize('hello', 100); // OK
 * validateSize('hello world', 5); // throws SecurityError
 * ```
 */
export function validateSize(data: string | ArrayBuffer, maxSize: number): void {
  const size = typeof data === 'string' ? data.length : data.byteLength;

  if (size > maxSize) {
    throw new SecurityError(
      `Input size (${size} bytes) exceeds maximum allowed (${maxSize} bytes)`,
      'INPUT_TOO_LARGE'
    );
  }
}

/**
 * Validate JSON size before parsing
 *
 * @param jsonString - The JSON string to validate
 * @throws SecurityError if size exceeds maximum
 */
export function validateJsonSize(jsonString: string): void {
  validateSize(jsonString, LIMITS.MAX_JSON_SIZE);
}

/**
 * Validate CSV size before parsing
 *
 * @param csvString - The CSV string to validate
 * @throws SecurityError if size or row count exceeds maximum
 */
export function validateCsvSize(csvString: string): void {
  validateSize(csvString, LIMITS.MAX_CSV_SIZE);

  // Also check row count
  const lines = csvString.split('\n');
  if (lines.length > LIMITS.MAX_CSV_ROWS) {
    throw new SecurityError(
      `CSV file exceeds maximum allowed rows: ${lines.length} (max: ${LIMITS.MAX_CSV_ROWS})`,
      'TOO_MANY_ROWS'
    );
  }
}

/**
 * Sanitize HTML to prevent XSS attacks
 *
 * Note: This is a basic implementation. For production, use a library like DOMPurify.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Check if a URL is safe for common use cases
 *
 * @param url - The URL to check
 * @returns true if the URL is safe
 */
export function isUrlSafe(url: string): boolean {
  try {
    validateUrl(url, { allowHttp: false });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL for display/logging purposes
 *
 * @param url - The URL string
 * @returns The domain name or empty string if invalid
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}
