//! Network module
//! Provides HTTP client, security utilities, and rate limiting
//!
//! Submodules:
//! - `http_client`: Enhanced HTTP client with retries, progress, and cancellation
//! - `security`: URL validation and security utilities
//! - `rate_limiter`: Request rate limiting

pub mod http_client;
pub mod security;
pub mod rate_limiter;

// Re-export HTTP client types and commands
pub use http_client::{
    // Types
    BatchDownloadResult, BatchItemResult, DownloadProgress, HttpClientConfig,
    HttpClientError, HttpResponse, RequestConfig,
    // Commands
    cancel_request, get_active_requests, get_http_config, http_batch_download,
    http_cancel_all_requests, http_cancel_request, http_check_url, http_download,
    http_get, http_head, http_post, http_request, set_http_config,
};

// Re-export security types and functions
pub use security::{
    SecurityError, limits, validate_size, validate_url,
};

// Re-export rate limiter types
pub use rate_limiter::{
    GlobalRateLimiter, RateLimitConfig, RateLimitResult, RateLimitState, SlidingWindowLimiter,
    get_command_rate_limit,
};
