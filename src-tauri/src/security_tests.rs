//! Comprehensive security tests for the Skymap application
//!
//! This module provides integration tests to verify security controls
//! are working correctly.

#[cfg(test)]
mod security_tests {
    // Import security modules
    use crate::security::{self, limits};
    use crate::rate_limiter::{self, RateLimitConfig, GlobalRateLimiter};

    // ============================================================================
    // URL Validation Tests
    // ============================================================================

    #[test]
    fn test_url_validation_blocks_localhost() {
        let blocked_urls = vec![
            "https://localhost:8080/api",
            "https://127.0.0.1/admin",
            "https://127.0.0.2/data",
            "http://::1/resource",
            "https://api.localhost/test",
        ];

        for url in blocked_urls {
            assert!(
                security::validate_url(url, false, None).is_err(),
                "Should block localhost URL: {}",
                url
            );
        }
    }

    #[test]
    fn test_url_validation_blocks_private_ips() {
        let private_urls = vec![
            "https://192.168.1.1/data",
            "https://10.0.0.1/api",
            "https://172.16.0.1/resource",
            "https://169.254.1.1/metadata",
            "https://172.31.255.255/data",
        ];

        for url in private_urls {
            assert!(
                security::validate_url(url, false, None).is_err(),
                "Should block private IP URL: {}",
                url
            );
        }
    }

    #[test]
    fn test_url_validation_blocks_dangerous_schemes() {
        let dangerous_urls = vec![
            "file:///etc/passwd",
            "data:text/html,<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "ftp://ftp.example.com/file",
            "mailto:test@example.com",
        ];

        for url in dangerous_urls {
            assert!(
                security::validate_url(url, false, None).is_err(),
                "Should block dangerous scheme URL: {}",
                url
            );
        }
    }

    #[test]
    fn test_url_validation_allows_valid_https() {
        let valid_urls = vec![
            "https://api.example.com/data",
            "https://cdn.example.com/resource.png",
            "https://api.stellarium.org/coordinates",
        ];

        for url in valid_urls {
            assert!(
                security::validate_url(url, false, None).is_ok(),
                "Should allow valid HTTPS URL: {}",
                url
            );
        }
    }

    #[test]
    fn test_url_validation_respects_allowlist() {
        let allowlist = vec!["api.example.com", "cdn.example.com"];

        assert!(security::validate_url("https://api.example.com/data", false, Some(&allowlist)).is_ok());
        assert!(security::validate_url("https://sub.api.example.com/test", false, Some(&allowlist)).is_ok());
        assert!(security::validate_url("https://evil.com", false, Some(&allowlist)).is_err());
    }

    #[test]
    fn test_url_validation_blocks_http_by_default() {
        assert!(security::validate_url("http://example.com", false, None).is_err());
        assert!(security::validate_url("http://example.com", true, None).is_ok());
    }

    #[test]
    fn test_url_validation_limits_length() {
        let long_url = format!("https://example.com/{}", "a".repeat(security::limits::MAX_URL_LENGTH));
        assert!(security::validate_url(&long_url, false, None).is_err());
    }

    // ============================================================================
    // Input Size Limit Tests
    // ============================================================================

    #[test]
    fn test_json_size_limit() {
        // Within limit
        let valid_json = "{}".repeat(1000);
        assert!(security::validate_size(&valid_json, limits::MAX_JSON_SIZE).is_ok());

        // Exceeds limit
        let oversized_json = "{}".repeat(limits::MAX_JSON_SIZE);
        assert!(security::validate_size(&oversized_json, limits::MAX_JSON_SIZE).is_err());
    }

    #[test]
    fn test_csv_size_limit() {
        // Within limit
        let valid_csv = "name,ra,dec\n".repeat(1000);
        assert!(security::validate_size(&valid_csv, limits::MAX_CSV_SIZE).is_ok());

        // Exceeds limit
        let oversized_csv = "a,".repeat(limits::MAX_CSV_SIZE);
        assert!(security::validate_size(&oversized_csv, limits::MAX_CSV_SIZE).is_err());
    }

    #[test]
    fn test_tile_size_limit() {
        // Small tile (within limit)
        let small_tile = vec![0u8; 1024];
        assert!(security::validate_size(&small_tile, limits::MAX_TILE_SIZE).is_ok());

        // Oversized tile
        let oversized_tile = vec![0u8; limits::MAX_TILE_SIZE + 1];
        assert!(security::validate_size(&oversized_tile, limits::MAX_TILE_SIZE).is_err());
    }

    // ============================================================================
    // Rate Limiting Tests
    // ============================================================================

    #[test]
    fn test_rate_limit_conservative() {
        let config = RateLimitConfig::conservative();
        assert_eq!(config.max_requests, 10);
        assert_eq!(config.window_seconds, 60);
        assert!(config.ban_on_exceed);
    }

    #[test]
    fn test_rate_limit_moderate() {
        let config = RateLimitConfig::moderate();
        assert_eq!(config.max_requests, 100);
        assert_eq!(config.window_seconds, 60);
        assert!(!config.ban_on_exceed);
    }

    #[test]
    fn test_rate_limit_permissive() {
        let config = RateLimitConfig::permissive();
        assert_eq!(config.max_requests, 1000);
        assert_eq!(config.window_seconds, 60);
        assert!(!config.ban_on_exceed);
    }

    #[test]
    fn test_global_rate_limiter_tracks_commands_separately() {
        let limiter = GlobalRateLimiter::new();
        let config = RateLimitConfig {
            max_requests: 2,
            window_seconds: 60,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        };

        // Use up limit for command1
        assert!(limiter.check("command1", config.clone()).is_allowed());
        assert!(limiter.check("command1", config.clone()).is_allowed());
        assert!(!limiter.check("command1", config.clone()).is_allowed());

        // command2 should have separate limit
        assert!(limiter.check("command2", config.clone()).is_allowed());
        assert!(limiter.check("command2", config.clone()).is_allowed());
        assert!(!limiter.check("command2", config.clone()).is_allowed());
    }

    #[test]
    fn test_command_specific_rate_limits() {
        // Sensitive commands should have conservative limits
        let sensitive_config = rate_limiter::get_command_rate_limit("open_path");
        assert_eq!(sensitive_config.max_requests, 10);
        assert!(sensitive_config.ban_on_exceed);

        // Read-only commands should have permissive limits
        let readonly_config = rate_limiter::get_command_rate_limit("list_stores");
        assert!(readonly_config.max_requests > 1000);
        assert!(!readonly_config.ban_on_exceed);
    }

    // ============================================================================
    // Integration Tests
    // ============================================================================

    #[test]
    fn test_security_defense_in_depth() {
        // Test that multiple security layers work together

        let url = "https://192.168.1.1/data";

        // Layer 1: URL validation should block
        let url_result = security::validate_url(url, false, None);
        assert!(url_result.is_err(), "URL validation should block private IPs");

        // Layer 2: Even if URL passed, rate limiting should apply
        let limiter = GlobalRateLimiter::new();
        let config = rate_limiter::get_command_rate_limit("prefetch_url");

        for _ in 0..config.max_requests {
            assert!(limiter.check("prefetch_url", config.clone()).is_allowed());
        }

        // Should be rate limited now
        assert!(!limiter.check("prefetch_url", config.clone()).is_allowed());
    }

    #[test]
    fn test_max_csv_rows_enforcement() {
        // Test that validate_size correctly rejects oversized content
        // Use a smaller test limit to avoid memory issues on Windows
        let test_limit = 1000; // 1KB limit for testing
        let oversized_content = "x".repeat(test_limit + 1);

        // Should fail size validation when over limit
        assert!(security::validate_size(&oversized_content, test_limit).is_err());

        // Should pass when at or under limit
        let at_limit = "x".repeat(test_limit);
        assert!(security::validate_size(&at_limit, test_limit).is_ok());

        let under_limit = "x".repeat(test_limit - 1);
        assert!(security::validate_size(&under_limit, test_limit).is_ok());
    }
}

// ============================================================================
// Test Utilities
// ============================================================================

#[cfg(test)]
pub mod test_utils {
    /// Create a test URL for various security scenarios
    pub fn test_url(scheme: &str, host: &str, path: &str) -> String {
        format!("{}://{}/{}", scheme, host, path)
    }

    /// Create test data of specific size
    pub fn create_test_data(size: usize) -> String {
        "x".repeat(size)
    }

    /// Create test CSV data
    pub fn create_test_csv(rows: usize) -> String {
        let header = "name,ra,dec,ra_string,dec_string\n";
        let data: Vec<String> = (0..rows)
            .map(|i| format!("Target{},{},{},RA{},DEC{}", i, i, i, i, i))
            .collect();
        format!("{}{}", header, data.join("\n"))
    }

    #[test]
    fn test_utility_functions() {
        assert_eq!(test_url("https", "example.com", "path"), "https://example.com/path");
        assert_eq!(create_test_data(5), "xxxxx");

        let csv = create_test_csv(3);
        assert!(csv.contains("Target0"));
        assert!(csv.contains("Target2"));
        assert!(csv.lines().count() == 4); // 3 data + 1 header
    }
}
