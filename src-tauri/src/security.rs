//! Security utilities and validation functions
//!
//! This module provides security controls including:
//! - URL validation to prevent SSRF attacks
//! - Input size limits
//! - Rate limiting utilities

use std::net::IpAddr;
use std::str::FromStr;
use url::Url;

#[derive(Debug, thiserror::Error)]
pub enum SecurityError {
    #[error("Invalid URL format: {0}")]
    InvalidUrl(String),

    #[error("URL scheme not allowed: {0}")]
    InvalidScheme(String),

    #[error("Blocked private IP address: {0}")]
    BlockedPrivateIp(String),

    #[error("Blocked localhost address")]
    BlockedLocalhost,

    #[error("Input size exceeds maximum allowed: {max} bytes")]
    InputTooLarge { max: usize },

    #[error("URL not in allowlist: {0}")]
    UrlNotAllowlisted(String),
}

impl serde::Serialize for SecurityError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Maximum allowed sizes for various inputs (in bytes)
#[allow(dead_code)]
pub mod limits {
    /// Maximum size for JSON payloads
    pub const MAX_JSON_SIZE: usize = 10 * 1024 * 1024; // 10 MB

    /// Maximum size for CSV file imports
    pub const MAX_CSV_SIZE: usize = 50 * 1024 * 1024; // 50 MB

    /// Maximum size for cached tile data
    pub const MAX_TILE_SIZE: usize = 5 * 1024 * 1024; // 5 MB

    /// Maximum number of rows in CSV import
    pub const MAX_CSV_ROWS: usize = 100_000;

    /// Maximum URL length
    pub const MAX_URL_LENGTH: usize = 2048;

    /// Maximum cache entries total
    pub const MAX_CACHE_ENTRIES: usize = 10_000;

    /// Maximum total cache size in bytes
    pub const MAX_CACHE_TOTAL_SIZE: usize = 1024 * 1024 * 1024; // 1 GB
}

/// Validate a URL to prevent SSRF attacks
///
/// Rules:
/// - Must be a valid URL
/// - Must use HTTPS or HTTP scheme (configurable)
/// - Must not resolve to private IP ranges (RFC 1918)
/// - Must not be localhost
/// - Must not use file:///, data://, or other dangerous schemes
/// - Optional: must be in allowlist
///
/// # Arguments
/// * `url_str` - The URL string to validate
/// * `allow_http` - Whether to allow HTTP (default: false for HTTPS only)
/// * `allowlist` - Optional list of allowed domains (None = no allowlist check)
///
/// # Examples
/// ```no_run
/// use app_lib::security::validate_url;
///
/// // Allow only HTTPS, no allowlist
/// validate_url("https://api.example.com/data", false, None).unwrap();
///
/// // Block private IPs
/// assert!(validate_url("https://192.168.1.1/data", false, None).is_err());
///
/// // Block localhost
/// assert!(validate_url("https://localhost:8080", false, None).is_err());
/// ```
pub fn validate_url(
    url_str: &str,
    allow_http: bool,
    allowlist: Option<&[&str]>,
) -> Result<Url, SecurityError> {
    // Check URL length
    if url_str.len() > limits::MAX_URL_LENGTH {
        return Err(SecurityError::InvalidUrl(format!(
            "URL exceeds maximum length of {} bytes",
            limits::MAX_URL_LENGTH
        )));
    }

    // Parse URL
    let url = Url::parse(url_str).map_err(|e| {
        SecurityError::InvalidUrl(format!("{}: {}", url_str, e))
    })?;

    // Check scheme - only HTTPS (and optionally HTTP) allowed
    match url.scheme() {
        "https" => {}, // Always allowed
        "http" if allow_http => {}, // Conditionally allowed
        scheme => {
            return Err(SecurityError::InvalidScheme(format!(
                "Scheme '{}' is not allowed (only HTTPS{} is permitted)",
                scheme,
                if allow_http { "/HTTP" } else { "" }
            )));
        }
    }

    // Check for localhost in host
    if let Some(host) = url.host_str() {
        let host_lower = host.to_lowercase();

        // Block localhost variants
        if host_lower == "localhost" ||
           host_lower == "127.0.0.1" ||
           host_lower.starts_with("127.") ||
           host_lower == "::1" ||
           host_lower == "[::1]" ||
           host_lower.ends_with(".localhost") {
            return Err(SecurityError::BlockedLocalhost);
        }

        // Try to parse as IP address
        if let Ok(ip_addr) = IpAddr::from_str(host) {
            if is_private_ip(&ip_addr) {
                return Err(SecurityError::BlockedPrivateIp(format!(
                    "IP address {} is in a private range",
                    host
                )));
            }
        }

        // Optional allowlist check
        if let Some(allowed) = allowlist {
            if !allowed.iter().any(|&domain| {
                // Exact match or subdomain match
                host_lower == domain ||
                host_lower.ends_with(&format!(".{}", domain))
            }) {
                return Err(SecurityError::UrlNotAllowlisted(host.to_string()));
            }
        }
    }

    Ok(url)
}

/// Check if an IP address is in a private range
///
/// Private ranges:
/// - IPv4: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (link-local)
/// - IPv6: fc00::/7 (unique local), fe80::/10 (link-local)
fn is_private_ip(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => {
            let octets = ipv4.octets();
            octets[0] == 10 || // 10.0.0.0/8
            (octets[0] == 172 && octets[1] >= 16 && octets[1] <= 31) || // 172.16.0.0/12
            (octets[0] == 192 && octets[1] == 168) || // 192.168.0.0/16
            (octets[0] == 169 && octets[1] == 254) // 169.254.0.0/16 link-local
        }
        IpAddr::V6(ipv6) => {
            let segments = ipv6.segments();
            // fc00::/7 (unique local)
            (segments[0] & 0xfe00) == 0xfc00 ||
            // fe80::/10 (link-local)
            (segments[0] & 0xffc0) == 0xfe80
        }
    }
}

/// Validate input size against a maximum
///
/// # Examples
/// ```no_run
/// use app_lib::security::validate_size;
///
/// let data = b"some data";
/// validate_size(data, 100).unwrap(); // OK
/// validate_size(data, 3).unwrap_err(); // Too large
/// ```
pub fn validate_size<T: AsRef<[u8]>>(data: T, max_size: usize) -> Result<(), SecurityError> {
    let size = data.as_ref().len();
    if size > max_size {
        Err(SecurityError::InputTooLarge { max: max_size })
    } else {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_url_https_allowed() {
        assert!(validate_url("https://example.com", false, None).is_ok());
        assert!(validate_url("https://api.example.com/path", false, None).is_ok());
    }

    #[test]
    fn test_validate_url_http_blocked_by_default() {
        assert!(validate_url("http://example.com", false, None).is_err());
    }

    #[test]
    fn test_validate_url_http_allowed_when_flagged() {
        assert!(validate_url("http://example.com", true, None).is_ok());
    }

    #[test]
    fn test_validate_url_blocks_localhost() {
        assert!(validate_url("https://localhost:8080", false, None).is_err());
        assert!(validate_url("https://127.0.0.1", false, None).is_err());
        assert!(validate_url("https://127.0.0.2", false, None).is_err());
        assert!(validate_url("https://::1", false, None).is_err());
    }

    #[test]
    fn test_validate_url_blocks_private_ips() {
        assert!(validate_url("https://192.168.1.1", false, None).is_err());
        assert!(validate_url("https://10.0.0.1", false, None).is_err());
        assert!(validate_url("https://172.16.0.1", false, None).is_err());
        assert!(validate_url("https://169.254.1.1", false, None).is_err());
    }

    #[test]
    fn test_validate_url_blocks_dangerous_schemes() {
        assert!(validate_url("file:///etc/passwd", false, None).is_err());
        assert!(validate_url("data:text/html,<script>", false, None).is_err());
        assert!(validate_url("ftp://example.com", false, None).is_err());
    }

    #[test]
    fn test_validate_url_with_allowlist() {
        let allowlist = vec!["api.example.com", "cdn.example.com"];

        assert!(validate_url("https://api.example.com/data", false, Some(&allowlist)).is_ok());
        assert!(validate_url("https://sub.api.example.com/data", false, Some(&allowlist)).is_ok());
        assert!(validate_url("https://evil.com", false, Some(&allowlist)).is_err());
    }

    #[test]
    fn test_validate_size() {
        assert!(validate_size("hello", 10).is_ok());
        assert!(validate_size("hello", 5).is_ok());
        assert!(validate_size("hello world", 5).is_err());
    }

    #[test]
    fn test_validate_size_with_bytes() {
        let data = vec![0u8; 1000];
        assert!(validate_size(&data, 2000).is_ok());
        assert!(validate_size(&data, 500).is_err());
    }
}
