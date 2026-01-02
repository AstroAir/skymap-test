//! Enhanced HTTP Client Module
//!
//! Provides a feature-rich HTTP client with:
//! - Configurable timeouts (connect, read, write)
//! - Automatic retry with exponential backoff
//! - Proxy support
//! - Request/response headers management
//! - Download progress reporting via Tauri events
//! - Request cancellation support
//! - Rate limiting integration
//! - Batch/parallel download functionality

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use reqwest::{Client, Method, Proxy, Response, StatusCode};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;

use crate::rate_limiter::{GlobalRateLimiter, RateLimitConfig, RateLimitResult, get_command_rate_limit};
use crate::security::{self, SecurityError};

// ============================================================================
// Error Types
// ============================================================================

#[derive(Debug, thiserror::Error)]
pub enum HttpError {
    #[error("Request error: {0}")]
    RequestError(String),

    #[error("Timeout: {0}")]
    Timeout(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Invalid URL: {0}")]
    InvalidUrl(String),

    #[error("Security error: {0}")]
    SecurityError(String),

    #[error("Rate limited: retry after {retry_after} seconds")]
    RateLimited { retry_after: u64 },

    #[error("Request cancelled")]
    Cancelled,

    #[error("Max retries exceeded: {0}")]
    MaxRetriesExceeded(String),

    #[error("Response too large: {size} bytes exceeds limit of {limit} bytes")]
    ResponseTooLarge { size: u64, limit: u64 },

    #[error("HTTP error {status}: {message}")]
    HttpStatus { status: u16, message: String },
}

impl serde::Serialize for HttpError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<reqwest::Error> for HttpError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_timeout() {
            HttpError::Timeout(err.to_string())
        } else if err.is_connect() {
            HttpError::NetworkError(format!("Connection failed: {}", err))
        } else {
            HttpError::RequestError(err.to_string())
        }
    }
}

impl From<SecurityError> for HttpError {
    fn from(err: SecurityError) -> Self {
        HttpError::SecurityError(err.to_string())
    }
}

// ============================================================================
// Configuration Types
// ============================================================================

/// HTTP client configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpClientConfig {
    /// Connection timeout in milliseconds
    pub connect_timeout_ms: u64,
    /// Read timeout in milliseconds
    pub read_timeout_ms: u64,
    /// Total request timeout in milliseconds
    pub request_timeout_ms: u64,
    /// Maximum number of retries
    pub max_retries: u32,
    /// Base delay for exponential backoff in milliseconds
    pub retry_base_delay_ms: u64,
    /// Maximum delay between retries in milliseconds
    pub retry_max_delay_ms: u64,
    /// User agent string
    pub user_agent: String,
    /// Proxy URL (optional)
    pub proxy_url: Option<String>,
    /// Maximum response size in bytes
    pub max_response_size: u64,
    /// Enable gzip/deflate compression
    pub enable_compression: bool,
    /// Follow redirects
    pub follow_redirects: bool,
    /// Maximum number of redirects to follow
    pub max_redirects: usize,
}

impl Default for HttpClientConfig {
    fn default() -> Self {
        Self {
            connect_timeout_ms: 10_000,      // 10 seconds
            read_timeout_ms: 30_000,         // 30 seconds
            request_timeout_ms: 60_000,      // 60 seconds
            max_retries: 3,
            retry_base_delay_ms: 1000,       // 1 second
            retry_max_delay_ms: 30_000,      // 30 seconds
            user_agent: format!("SkyMap/{}", env!("CARGO_PKG_VERSION")),
            proxy_url: None,
            max_response_size: 100 * 1024 * 1024, // 100 MB
            enable_compression: true,
            follow_redirects: true,
            max_redirects: 10,
        }
    }
}

/// Request configuration for individual requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestConfig {
    /// HTTP method
    pub method: String,
    /// Request URL
    pub url: String,
    /// Request headers
    pub headers: Option<HashMap<String, String>>,
    /// Request body (for POST/PUT)
    pub body: Option<Vec<u8>>,
    /// Content type
    pub content_type: Option<String>,
    /// Override timeout for this request (milliseconds)
    pub timeout_ms: Option<u64>,
    /// Skip URL security validation (dangerous - use carefully)
    pub skip_security_check: bool,
    /// Allow HTTP (non-HTTPS) URLs
    pub allow_http: bool,
    /// Request ID for tracking/cancellation
    pub request_id: Option<String>,
}

impl Default for RequestConfig {
    fn default() -> Self {
        Self {
            method: "GET".to_string(),
            url: String::new(),
            headers: None,
            body: None,
            content_type: None,
            timeout_ms: None,
            skip_security_check: false,
            allow_http: false,
            request_id: None,
        }
    }
}

// ============================================================================
// Response Types
// ============================================================================

/// HTTP response data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpResponse {
    /// HTTP status code
    pub status: u16,
    /// Status text
    pub status_text: String,
    /// Response headers
    pub headers: HashMap<String, String>,
    /// Response body as bytes
    pub body: Vec<u8>,
    /// Content type
    pub content_type: Option<String>,
    /// Content length
    pub content_length: Option<u64>,
    /// Final URL (after redirects)
    pub final_url: String,
    /// Response time in milliseconds
    pub response_time_ms: u64,
}

/// Download progress event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    /// Request ID
    pub request_id: String,
    /// URL being downloaded
    pub url: String,
    /// Bytes downloaded so far
    pub downloaded: u64,
    /// Total bytes (if known)
    pub total: Option<u64>,
    /// Progress percentage (0-100)
    pub percentage: Option<f64>,
    /// Download speed in bytes per second
    pub speed_bps: Option<u64>,
    /// Estimated time remaining in seconds
    pub eta_seconds: Option<u64>,
    /// Is download complete
    pub is_complete: bool,
    /// Error message if failed
    pub error: Option<String>,
}

/// Batch download result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchDownloadResult {
    /// Total number of requests
    pub total: usize,
    /// Number of successful downloads
    pub success: usize,
    /// Number of failed downloads
    pub failed: usize,
    /// Individual results
    pub results: Vec<BatchItemResult>,
    /// Total time in milliseconds
    pub total_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchItemResult {
    pub url: String,
    pub success: bool,
    pub status: Option<u16>,
    pub size: Option<u64>,
    pub error: Option<String>,
}

// ============================================================================
// Cancellation Support
// ============================================================================

/// Global cancellation registry
pub struct CancellationRegistry {
    tokens: RwLock<HashMap<String, Arc<AtomicBool>>>,
}

impl CancellationRegistry {
    pub fn new() -> Self {
        Self {
            tokens: RwLock::new(HashMap::new()),
        }
    }

    pub async fn register(&self, request_id: &str) -> Arc<AtomicBool> {
        let token = Arc::new(AtomicBool::new(false));
        self.tokens.write().await.insert(request_id.to_string(), token.clone());
        token
    }

    pub async fn cancel(&self, request_id: &str) -> bool {
        if let Some(token) = self.tokens.read().await.get(request_id) {
            token.store(true, Ordering::SeqCst);
            true
        } else {
            false
        }
    }

    pub async fn cancel_all(&self) {
        for token in self.tokens.read().await.values() {
            token.store(true, Ordering::SeqCst);
        }
    }

    pub async fn remove(&self, request_id: &str) {
        self.tokens.write().await.remove(request_id);
    }

    pub async fn is_cancelled(&self, request_id: &str) -> bool {
        if let Some(token) = self.tokens.read().await.get(request_id) {
            token.load(Ordering::SeqCst)
        } else {
            false
        }
    }
}

impl Default for CancellationRegistry {
    fn default() -> Self {
        Self::new()
    }
}

// Global instances
lazy_static::lazy_static! {
    static ref CANCELLATION_REGISTRY: CancellationRegistry = CancellationRegistry::new();
    static ref RATE_LIMITER: GlobalRateLimiter = GlobalRateLimiter::new();
    static ref HTTP_CONFIG: RwLock<HttpClientConfig> = RwLock::new(HttpClientConfig::default());
}

// ============================================================================
// HTTP Client Implementation
// ============================================================================

/// Build a reqwest client from configuration
fn build_client(config: &HttpClientConfig) -> Result<Client, HttpError> {
    let mut builder = Client::builder()
        .connect_timeout(Duration::from_millis(config.connect_timeout_ms))
        .timeout(Duration::from_millis(config.request_timeout_ms))
        .user_agent(&config.user_agent)
        .gzip(config.enable_compression)
        .deflate(config.enable_compression)
        .redirect(if config.follow_redirects {
            reqwest::redirect::Policy::limited(config.max_redirects)
        } else {
            reqwest::redirect::Policy::none()
        });

    if let Some(proxy_url) = &config.proxy_url {
        let proxy = Proxy::all(proxy_url)
            .map_err(|e| HttpError::InvalidUrl(format!("Invalid proxy URL: {}", e)))?;
        builder = builder.proxy(proxy);
    }

    builder.build().map_err(|e| HttpError::RequestError(e.to_string()))
}

/// Calculate exponential backoff delay
fn calculate_backoff(attempt: u32, base_delay: u64, max_delay: u64) -> Duration {
    let delay = base_delay * 2u64.pow(attempt);
    Duration::from_millis(delay.min(max_delay))
}

/// Check if status code is retryable
fn is_retryable_status(status: StatusCode) -> bool {
    status == StatusCode::TOO_MANY_REQUESTS
        || status == StatusCode::SERVICE_UNAVAILABLE
        || status == StatusCode::GATEWAY_TIMEOUT
        || status == StatusCode::BAD_GATEWAY
        || status.is_server_error()
}

/// Execute HTTP request with retries
async fn execute_request_with_retry(
    client: &Client,
    config: &HttpClientConfig,
    req_config: &RequestConfig,
    cancel_token: Option<Arc<AtomicBool>>,
) -> Result<Response, HttpError> {
    let method = Method::from_bytes(req_config.method.as_bytes())
        .map_err(|_| HttpError::RequestError(format!("Invalid method: {}", req_config.method)))?;

    let mut last_error = None;

    for attempt in 0..=config.max_retries {
        // Check cancellation
        if let Some(ref token) = cancel_token {
            if token.load(Ordering::SeqCst) {
                return Err(HttpError::Cancelled);
            }
        }

        // Build request
        let mut request = client.request(method.clone(), &req_config.url);

        // Add headers
        if let Some(ref headers) = req_config.headers {
            for (key, value) in headers {
                request = request.header(key, value);
            }
        }

        // Add content type
        if let Some(ref content_type) = req_config.content_type {
            request = request.header("Content-Type", content_type);
        }

        // Add body
        if let Some(ref body) = req_config.body {
            request = request.body(body.clone());
        }

        // Override timeout if specified
        if let Some(timeout_ms) = req_config.timeout_ms {
            request = request.timeout(Duration::from_millis(timeout_ms));
        }

        // Execute request
        match request.send().await {
            Ok(response) => {
                if response.status().is_success() || !is_retryable_status(response.status()) {
                    return Ok(response);
                }

                // Retryable error
                if attempt < config.max_retries {
                    let delay = calculate_backoff(attempt, config.retry_base_delay_ms, config.retry_max_delay_ms);
                    log::warn!(
                        "Request failed with status {}, retrying in {:?} (attempt {}/{})",
                        response.status(),
                        delay,
                        attempt + 1,
                        config.max_retries
                    );
                    tokio::time::sleep(delay).await;
                    last_error = Some(HttpError::HttpStatus {
                        status: response.status().as_u16(),
                        message: response.status().to_string(),
                    });
                } else {
                    return Err(HttpError::HttpStatus {
                        status: response.status().as_u16(),
                        message: response.status().to_string(),
                    });
                }
            }
            Err(e) => {
                if e.is_timeout() || e.is_connect() {
                    if attempt < config.max_retries {
                        let delay = calculate_backoff(attempt, config.retry_base_delay_ms, config.retry_max_delay_ms);
                        log::warn!(
                            "Request failed: {}, retrying in {:?} (attempt {}/{})",
                            e,
                            delay,
                            attempt + 1,
                            config.max_retries
                        );
                        tokio::time::sleep(delay).await;
                        last_error = Some(e.into());
                    } else {
                        return Err(e.into());
                    }
                } else {
                    return Err(e.into());
                }
            }
        }
    }

    Err(HttpError::MaxRetriesExceeded(
        last_error.map(|e| e.to_string()).unwrap_or_else(|| "Unknown error".to_string())
    ))
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Get current HTTP client configuration
#[tauri::command]
pub async fn get_http_config() -> Result<HttpClientConfig, HttpError> {
    Ok(HTTP_CONFIG.read().await.clone())
}

/// Update HTTP client configuration
#[tauri::command]
pub async fn set_http_config(config: HttpClientConfig) -> Result<(), HttpError> {
    *HTTP_CONFIG.write().await = config;
    Ok(())
}

/// Execute an HTTP request
#[tauri::command]
pub async fn http_request(
    app: AppHandle,
    config: RequestConfig,
) -> Result<HttpResponse, HttpError> {
    let start_time = std::time::Instant::now();
    let http_config = HTTP_CONFIG.read().await.clone();

    // Security validation
    if !config.skip_security_check {
        security::validate_url(&config.url, config.allow_http, None)?;
    }

    // Rate limiting check - use domain-specific rate limiting
    let domain = url::Url::parse(&config.url)
        .map(|u| u.host_str().unwrap_or("unknown").to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    // Get rate limit config based on domain characteristics
    let rate_limit_config = get_rate_limit_for_domain(&domain);
    let rate_limit_result = RATE_LIMITER.check(
        &format!("http:{}", domain),
        rate_limit_config,
    );

    if let RateLimitResult::RateLimited { retry_after } | RateLimitResult::Banned { retry_after } = rate_limit_result {
        return Err(HttpError::RateLimited { retry_after });
    }

    // Register cancellation token
    let cancel_token = if let Some(ref request_id) = config.request_id {
        Some(CANCELLATION_REGISTRY.register(request_id).await)
    } else {
        None
    };

    // Build client
    let client = build_client(&http_config)?;

    // Execute request
    let response = execute_request_with_retry(&client, &http_config, &config, cancel_token).await?;

    // Process response
    let status = response.status().as_u16();
    let status_text = response.status().to_string();
    let final_url = response.url().to_string();

    let mut headers = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(v) = value.to_str() {
            headers.insert(key.to_string(), v.to_string());
        }
    }

    let content_type = headers.get("content-type").cloned();
    let content_length = headers.get("content-length").and_then(|v| v.parse().ok());

    // Check response size before downloading
    if let Some(length) = content_length {
        if length > http_config.max_response_size {
            return Err(HttpError::ResponseTooLarge {
                size: length,
                limit: http_config.max_response_size,
            });
        }
    }

    // Download body with progress
    let body = if let Some(ref request_id) = config.request_id {
        download_with_progress(&app, request_id, &config.url, response, content_length, &http_config).await?
    } else {
        let bytes = response.bytes().await?;
        if bytes.len() as u64 > http_config.max_response_size {
            return Err(HttpError::ResponseTooLarge {
                size: bytes.len() as u64,
                limit: http_config.max_response_size,
            });
        }
        bytes.to_vec()
    };

    // Cleanup cancellation token
    if let Some(ref request_id) = config.request_id {
        CANCELLATION_REGISTRY.remove(request_id).await;
    }

    let response_time_ms = start_time.elapsed().as_millis() as u64;

    Ok(HttpResponse {
        status,
        status_text,
        headers,
        body,
        content_type,
        content_length,
        final_url,
        response_time_ms,
    })
}

/// Download response body with progress reporting
async fn download_with_progress(
    app: &AppHandle,
    request_id: &str,
    url: &str,
    response: Response,
    total_size: Option<u64>,
    config: &HttpClientConfig,
) -> Result<Vec<u8>, HttpError> {
    let mut downloaded: u64 = 0;
    let mut body = Vec::new();
    let start_time = std::time::Instant::now();
    let mut stream = response.bytes_stream();

    use futures_util::StreamExt;

    while let Some(chunk) = stream.next().await {
        // Check cancellation
        if CANCELLATION_REGISTRY.is_cancelled(request_id).await {
            let _ = app.emit("download-progress", DownloadProgress {
                request_id: request_id.to_string(),
                url: url.to_string(),
                downloaded,
                total: total_size,
                percentage: None,
                speed_bps: None,
                eta_seconds: None,
                is_complete: false,
                error: Some("Cancelled".to_string()),
            });
            return Err(HttpError::Cancelled);
        }

        let chunk = chunk.map_err(|e| HttpError::NetworkError(e.to_string()))?;
        downloaded += chunk.len() as u64;

        // Check size limit
        if downloaded > config.max_response_size {
            return Err(HttpError::ResponseTooLarge {
                size: downloaded,
                limit: config.max_response_size,
            });
        }

        body.extend_from_slice(&chunk);

        // Calculate progress
        let elapsed = start_time.elapsed().as_secs_f64();
        let speed_bps = if elapsed > 0.0 {
            Some((downloaded as f64 / elapsed) as u64)
        } else {
            None
        };

        let (percentage, eta_seconds) = if let Some(total) = total_size {
            let pct = (downloaded as f64 / total as f64) * 100.0;
            let eta = if let Some(speed) = speed_bps {
                if speed > 0 {
                    Some((total - downloaded) / speed)
                } else {
                    None
                }
            } else {
                None
            };
            (Some(pct), eta)
        } else {
            (None, None)
        };

        // Emit progress event
        let _ = app.emit("download-progress", DownloadProgress {
            request_id: request_id.to_string(),
            url: url.to_string(),
            downloaded,
            total: total_size,
            percentage,
            speed_bps,
            eta_seconds,
            is_complete: false,
            error: None,
        });
    }

    // Emit completion event
    let _ = app.emit("download-progress", DownloadProgress {
        request_id: request_id.to_string(),
        url: url.to_string(),
        downloaded,
        total: total_size,
        percentage: Some(100.0),
        speed_bps: None,
        eta_seconds: Some(0),
        is_complete: true,
        error: None,
    });

    Ok(body)
}

/// Simple GET request
#[tauri::command]
pub async fn http_get(
    app: AppHandle,
    url: String,
    headers: Option<HashMap<String, String>>,
    allow_http: Option<bool>,
) -> Result<HttpResponse, HttpError> {
    http_request(app, RequestConfig {
        method: "GET".to_string(),
        url,
        headers,
        allow_http: allow_http.unwrap_or(false),
        ..Default::default()
    }).await
}

/// Simple POST request
#[tauri::command]
pub async fn http_post(
    app: AppHandle,
    url: String,
    body: Vec<u8>,
    content_type: Option<String>,
    headers: Option<HashMap<String, String>>,
    allow_http: Option<bool>,
) -> Result<HttpResponse, HttpError> {
    http_request(app, RequestConfig {
        method: "POST".to_string(),
        url,
        body: Some(body),
        content_type,
        headers,
        allow_http: allow_http.unwrap_or(false),
        ..Default::default()
    }).await
}

/// Download file to cache with progress
#[tauri::command]
pub async fn http_download(
    app: AppHandle,
    url: String,
    request_id: String,
    allow_http: Option<bool>,
) -> Result<HttpResponse, HttpError> {
    http_request(app, RequestConfig {
        method: "GET".to_string(),
        url,
        request_id: Some(request_id),
        allow_http: allow_http.unwrap_or(false),
        ..Default::default()
    }).await
}

/// Cancel a request by ID
#[tauri::command]
pub async fn http_cancel_request(request_id: String) -> Result<bool, HttpError> {
    Ok(CANCELLATION_REGISTRY.cancel(&request_id).await)
}

/// Cancel all pending requests
#[tauri::command]
pub async fn http_cancel_all_requests() -> Result<(), HttpError> {
    CANCELLATION_REGISTRY.cancel_all().await;
    Ok(())
}

/// Batch download multiple URLs
#[tauri::command]
pub async fn http_batch_download(
    app: AppHandle,
    urls: Vec<String>,
    concurrency: Option<usize>,
    allow_http: Option<bool>,
) -> Result<BatchDownloadResult, HttpError> {
    use futures_util::stream::{self, StreamExt};

    let start_time = std::time::Instant::now();
    let concurrency = concurrency.unwrap_or(4).min(10); // Max 10 concurrent downloads
    let total = urls.len();
    let allow_http = allow_http.unwrap_or(false);

    let results: Vec<BatchItemResult> = stream::iter(urls)
        .map(|url| {
            let app = app.clone();
            async move {
                let request_id = format!("batch-{}", uuid_simple());
                match http_request(app, RequestConfig {
                    method: "GET".to_string(),
                    url: url.clone(),
                    request_id: Some(request_id),
                    allow_http,
                    ..Default::default()
                }).await {
                    Ok(response) => BatchItemResult {
                        url,
                        success: true,
                        status: Some(response.status),
                        size: Some(response.body.len() as u64),
                        error: None,
                    },
                    Err(e) => BatchItemResult {
                        url,
                        success: false,
                        status: None,
                        size: None,
                        error: Some(e.to_string()),
                    },
                }
            }
        })
        .buffer_unordered(concurrency)
        .collect()
        .await;

    let success = results.iter().filter(|r| r.success).count();
    let failed = results.iter().filter(|r| !r.success).count();
    let total_time_ms = start_time.elapsed().as_millis() as u64;

    Ok(BatchDownloadResult {
        total,
        success,
        failed,
        results,
        total_time_ms,
    })
}

/// Check URL accessibility (HEAD request)
#[tauri::command]
pub async fn http_check_url(
    url: String,
    allow_http: Option<bool>,
) -> Result<bool, HttpError> {
    let http_config = HTTP_CONFIG.read().await.clone();

    // Security validation
    security::validate_url(&url, allow_http.unwrap_or(false), None)?;

    let client = build_client(&http_config)?;

    match client.head(&url)
        .timeout(Duration::from_secs(10))
        .send()
        .await
    {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

/// Get response headers only (HEAD request)
#[tauri::command]
pub async fn http_head(
    url: String,
    allow_http: Option<bool>,
) -> Result<HashMap<String, String>, HttpError> {
    let http_config = HTTP_CONFIG.read().await.clone();

    // Security validation
    security::validate_url(&url, allow_http.unwrap_or(false), None)?;

    let client = build_client(&http_config)?;

    let response = client.head(&url)
        .timeout(Duration::from_secs(10))
        .send()
        .await?;

    let mut headers = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(v) = value.to_str() {
            headers.insert(key.to_string(), v.to_string());
        }
    }

    Ok(headers)
}

/// Simple UUID generator
fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{:x}{:x}", duration.as_secs(), duration.subsec_nanos())
}

/// Get rate limit configuration based on domain
/// Different domains get different rate limits based on their expected usage patterns
fn get_rate_limit_for_domain(domain: &str) -> RateLimitConfig {
    // Known astronomy API domains - more permissive
    let astronomy_domains = [
        "simbad.u-strasbg.fr",
        "alasky.cds.unistra.fr",
        "archive.stsci.edu",
        "skyview.gsfc.nasa.gov",
        "aa.usno.navy.mil",
        "celestrak.org",
        "minorplanetcenter.net",
    ];
    
    // Tile/image servers - very permissive for tile loading
    let tile_domains = [
        "alasky.cds.unistra.fr",
        "hips.cds.unistra.fr",
    ];
    
    // Check domain type and return appropriate config
    if tile_domains.iter().any(|d| domain.contains(d)) {
        // Tile servers need high request rates
        RateLimitConfig {
            max_requests: 500,
            window_seconds: 60,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        }
    } else if astronomy_domains.iter().any(|d| domain.contains(d)) {
        // Astronomy APIs - moderate rate limiting
        RateLimitConfig {
            max_requests: 100,
            window_seconds: 60,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        }
    } else {
        // Unknown domains - use conservative defaults
        get_command_rate_limit("http_request")
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_backoff() {
        let base = 1000;
        let max = 30000;

        assert_eq!(calculate_backoff(0, base, max), Duration::from_millis(1000));
        assert_eq!(calculate_backoff(1, base, max), Duration::from_millis(2000));
        assert_eq!(calculate_backoff(2, base, max), Duration::from_millis(4000));
        assert_eq!(calculate_backoff(3, base, max), Duration::from_millis(8000));
        assert_eq!(calculate_backoff(4, base, max), Duration::from_millis(16000));
        assert_eq!(calculate_backoff(5, base, max), Duration::from_millis(30000)); // Capped at max
    }

    #[test]
    fn test_calculate_backoff_edge_cases() {
        // Test with very small base
        assert_eq!(calculate_backoff(0, 100, 1000), Duration::from_millis(100));
        assert_eq!(calculate_backoff(10, 100, 1000), Duration::from_millis(1000)); // Capped
        
        // Test with same base and max
        assert_eq!(calculate_backoff(5, 1000, 1000), Duration::from_millis(1000));
    }

    #[test]
    fn test_is_retryable_status() {
        assert!(is_retryable_status(StatusCode::TOO_MANY_REQUESTS));
        assert!(is_retryable_status(StatusCode::SERVICE_UNAVAILABLE));
        assert!(is_retryable_status(StatusCode::GATEWAY_TIMEOUT));
        assert!(is_retryable_status(StatusCode::INTERNAL_SERVER_ERROR));
        assert!(!is_retryable_status(StatusCode::OK));
        assert!(!is_retryable_status(StatusCode::NOT_FOUND));
        assert!(!is_retryable_status(StatusCode::BAD_REQUEST));
    }

    #[test]
    fn test_is_retryable_status_more_codes() {
        // Additional success codes - not retryable
        assert!(!is_retryable_status(StatusCode::CREATED));
        assert!(!is_retryable_status(StatusCode::ACCEPTED));
        assert!(!is_retryable_status(StatusCode::NO_CONTENT));
        
        // Client errors - not retryable
        assert!(!is_retryable_status(StatusCode::UNAUTHORIZED));
        assert!(!is_retryable_status(StatusCode::FORBIDDEN));
        assert!(!is_retryable_status(StatusCode::METHOD_NOT_ALLOWED));
        
        // More server errors that are retryable
        assert!(is_retryable_status(StatusCode::BAD_GATEWAY));
    }

    #[test]
    fn test_default_config() {
        let config = HttpClientConfig::default();
        assert_eq!(config.connect_timeout_ms, 10_000);
        assert_eq!(config.max_retries, 3);
        assert!(config.enable_compression);
        assert!(config.follow_redirects);
    }

    #[test]
    fn test_default_config_all_fields() {
        let config = HttpClientConfig::default();
        
        // Timeouts
        assert_eq!(config.connect_timeout_ms, 10_000);
        assert_eq!(config.read_timeout_ms, 30_000);
        assert_eq!(config.request_timeout_ms, 60_000);
        
        // Retry settings
        assert_eq!(config.max_retries, 3);
        assert_eq!(config.retry_base_delay_ms, 1_000);
        assert_eq!(config.retry_max_delay_ms, 30_000);
        
        // Other settings
        assert!(config.enable_compression);
        assert!(config.follow_redirects);
        assert_eq!(config.max_redirects, 10);
        assert_eq!(config.max_response_size, 100 * 1024 * 1024); // 100MB
        assert!(config.proxy_url.is_none());
    }

    #[test]
    fn test_uuid_simple() {
        let uuid1 = uuid_simple();
        let uuid2 = uuid_simple();
        // UUIDs should be non-empty and potentially different
        assert!(!uuid1.is_empty());
        assert!(!uuid2.is_empty());
    }

    #[test]
    fn test_uuid_simple_format() {
        let uuid = uuid_simple();
        // UUID should be hexadecimal characters only
        assert!(uuid.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_get_rate_limit_for_domain_tile_servers() {
        // Tile servers should have high rate limits
        let config = get_rate_limit_for_domain("alasky.cds.unistra.fr");
        assert_eq!(config.max_requests, 500);
        assert_eq!(config.window_seconds, 60);
        assert!(!config.ban_on_exceed);
        
        let config2 = get_rate_limit_for_domain("hips.cds.unistra.fr");
        assert_eq!(config2.max_requests, 500);
    }

    #[test]
    fn test_get_rate_limit_for_domain_astronomy_apis() {
        // Astronomy APIs should have moderate rate limits
        let config = get_rate_limit_for_domain("simbad.u-strasbg.fr");
        assert_eq!(config.max_requests, 100);
        assert_eq!(config.window_seconds, 60);
        
        let config2 = get_rate_limit_for_domain("celestrak.org");
        assert_eq!(config2.max_requests, 100);
        
        let config3 = get_rate_limit_for_domain("aa.usno.navy.mil");
        assert_eq!(config3.max_requests, 100);
    }

    #[test]
    fn test_get_rate_limit_for_domain_unknown() {
        // Unknown domains should use default conservative config
        let config = get_rate_limit_for_domain("unknown-domain.com");
        // Should use get_command_rate_limit defaults
        assert!(config.max_requests > 0);
        assert!(config.window_seconds > 0);
    }

    #[test]
    fn test_get_rate_limit_for_domain_subdomain_matching() {
        // Should match subdomains
        let config = get_rate_limit_for_domain("api.simbad.u-strasbg.fr");
        assert_eq!(config.max_requests, 100); // Astronomy API rate
        
        let config2 = get_rate_limit_for_domain("data.celestrak.org");
        assert_eq!(config2.max_requests, 100);
    }

    #[test]
    fn test_request_config_defaults() {
        let config = RequestConfig {
            method: "GET".to_string(),
            url: "https://example.com".to_string(),
            headers: None,
            body: None,
            content_type: None,
            timeout_ms: None,
            skip_security_check: false,
            allow_http: false,
            request_id: None,
        };
        
        assert_eq!(config.method, "GET");
        assert!(!config.skip_security_check);
        assert!(!config.allow_http);
    }

    #[test]
    fn test_http_response_structure() {
        let response = HttpResponse {
            status: 200,
            status_text: "OK".to_string(),
            headers: std::collections::HashMap::new(),
            body: vec![1, 2, 3],
            content_type: Some("application/json".to_string()),
            content_length: Some(3),
            final_url: "https://example.com".to_string(),
            response_time_ms: 100,
        };
        
        assert_eq!(response.status, 200);
        assert_eq!(response.status_text, "OK");
        assert_eq!(response.body.len(), 3);
        assert!(response.content_type.is_some());
        assert_eq!(response.response_time_ms, 100);
    }

    #[test]
    fn test_download_progress_structure() {
        let progress = DownloadProgress {
            request_id: "test-123".to_string(),
            url: "https://example.com/file.zip".to_string(),
            downloaded: 1024,
            total: Some(2048),
            percentage: Some(50.0),
            speed_bps: Some(10240),
            eta_seconds: Some(10),
            is_complete: false,
            error: None,
        };
        
        assert_eq!(progress.request_id, "test-123");
        assert_eq!(progress.downloaded, 1024);
        assert_eq!(progress.total, Some(2048));
        assert_eq!(progress.percentage, Some(50.0));
        assert!(!progress.is_complete);
        assert!(progress.error.is_none());
    }

    #[test]
    fn test_download_progress_complete() {
        let progress = DownloadProgress {
            request_id: "test-456".to_string(),
            url: "https://example.com/file.zip".to_string(),
            downloaded: 2048,
            total: Some(2048),
            percentage: Some(100.0),
            speed_bps: None,
            eta_seconds: Some(0),
            is_complete: true,
            error: None,
        };
        
        assert!(progress.is_complete);
        assert_eq!(progress.percentage, Some(100.0));
    }

    #[test]
    fn test_download_progress_with_error() {
        let progress = DownloadProgress {
            request_id: "test-789".to_string(),
            url: "https://example.com/file.zip".to_string(),
            downloaded: 512,
            total: None,
            percentage: None,
            speed_bps: None,
            eta_seconds: None,
            is_complete: true,
            error: Some("Connection reset".to_string()),
        };
        
        assert!(progress.is_complete);
        assert!(progress.error.is_some());
        assert_eq!(progress.error.unwrap(), "Connection reset");
    }

    #[test]
    fn test_batch_download_result_structure() {
        let result = BatchDownloadResult {
            total: 5,
            success: 4,
            failed: 1,
            results: vec![
                BatchItemResult {
                    url: "https://example.com/1".to_string(),
                    success: true,
                    status: Some(200),
                    size: Some(1024),
                    error: None,
                },
                BatchItemResult {
                    url: "https://example.com/2".to_string(),
                    success: false,
                    status: None,
                    size: None,
                    error: Some("Timeout".to_string()),
                },
            ],
            total_time_ms: 5000,
        };
        
        assert_eq!(result.total, 5);
        assert_eq!(result.success, 4);
        assert_eq!(result.failed, 1);
        assert_eq!(result.results.len(), 2);
        assert_eq!(result.total_time_ms, 5000);
    }

    #[test]
    fn test_http_error_display() {
        let err = HttpError::RequestError("Connection failed".to_string());
        assert!(err.to_string().contains("Connection failed"));
        
        let err2 = HttpError::Timeout("Request timed out".to_string());
        assert!(err2.to_string().contains("Timeout") || err2.to_string().contains("timed out"));
        
        let err3 = HttpError::Cancelled;
        assert!(err3.to_string().contains("cancel") || err3.to_string().contains("Cancel"));
    }

    #[test]
    fn test_http_error_rate_limited() {
        let err = HttpError::RateLimited { retry_after: 30 };
        let display = err.to_string();
        assert!(display.contains("Rate") || display.contains("rate") || display.contains("30"));
    }

    #[test]
    fn test_cancellation_registry() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let registry = CancellationRegistry::new();
            
            // Register a token
            let token = registry.register("test-request").await;
            assert!(!token.load(Ordering::SeqCst));
            
            // Cancel it
            let cancelled = registry.cancel("test-request").await;
            assert!(cancelled);
            assert!(token.load(Ordering::SeqCst));
            
            // Try to cancel non-existent
            let not_cancelled = registry.cancel("non-existent").await;
            assert!(!not_cancelled);
        });
    }

    #[test]
    fn test_cancellation_registry_cancel_all() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let registry = CancellationRegistry::new();
            
            // Register multiple tokens
            let token1 = registry.register("request-1").await;
            let token2 = registry.register("request-2").await;
            let token3 = registry.register("request-3").await;
            
            assert!(!token1.load(Ordering::SeqCst));
            assert!(!token2.load(Ordering::SeqCst));
            assert!(!token3.load(Ordering::SeqCst));
            
            // Cancel all
            registry.cancel_all().await;
            
            assert!(token1.load(Ordering::SeqCst));
            assert!(token2.load(Ordering::SeqCst));
            assert!(token3.load(Ordering::SeqCst));
        });
    }

    #[test]
    fn test_cancellation_registry_remove() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let registry = CancellationRegistry::new();
            
            // Register and then remove
            let _token = registry.register("test-request").await;
            registry.remove("test-request").await;
            
            // is_cancelled should return false (not found)
            let result = registry.is_cancelled("test-request").await;
            assert!(!result);
        });
    }
}
