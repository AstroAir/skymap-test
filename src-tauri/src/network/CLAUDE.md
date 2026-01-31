# rust-network Module

[Root](../../../CLAUDE.md) > [src-tauri/src](../) > **network**

> **Last Updated:** 2025-01-31
> **Module Type:** Rust (HTTP Client)

---

## Breadcrumb

`[Root](../../../CLAUDE.md) > [src-tauri/src](../) > **network**`

---

## Module Responsibility

The `network` module provides a secure HTTP client with rate limiting, progress reporting, and request cancellation. It enforces security policies to prevent SSRF attacks and API abuse.

**Design Principle:** Security-first with configurable limits and comprehensive error handling.

---

## Files

| File | Purpose |
|------|---------|
| `mod.rs` | Module exports |
| `http_client.rs` | HTTP client with retries and progress |
| `security.rs` | URL validation and SSRF protection |
| `rate_limiter.rs` | Request rate limiting |

---

## Tauri Commands

### HTTP Client Commands

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `http_get` | config | `HttpResponse` | GET request |
| `http_post` | config, body | `HttpResponse` | POST request |
| `http_head` | config | `HttpResponse` | HEAD request |
| `http_request` | config, method, body | `HttpResponse` | Generic request |
| `http_download` | url, path, config | `DownloadProgress` | Download to file |
| `http_batch_download` | items | `BatchDownloadResult` | Batch download |
| `http_check_url` | url | `bool` | Check URL validity |
| `cancel_request` | id | `()` | Cancel request |
| `get_active_requests` | - | `Vec<RequestInfo>` | List active |
| `http_cancel_all_requests` | - | `()` | Cancel all |
| `get_http_config` | - | `HttpClientConfig` | Get config |
| `set_http_config` | config | `()` | Set config |

---

## Data Types

### Request Config

```rust
pub struct RequestConfig {
    pub url: String,
    pub headers: HashMap<String, String>,
    pub timeout_ms: Option<u64>,
    pub retry_count: Option<u32>,
    pub retry_delay_ms: Option<u64>,
}

pub struct HttpClientConfig {
    pub default_timeout_ms: u64,
    pub max_retries: u32,
    pub retry_delay_ms: u64,
    pub max_concurrent_requests: usize,
    pub user_agent: String,
}
```

### Response Types

```rust
pub struct HttpResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub success: bool,
}

pub struct DownloadProgress {
    pub url: String,
    pub path: String,
    pub total_bytes: u64,
    pub downloaded_bytes: u64,
    pub percentage: f64,
    pub is_complete: bool,
    pub error: Option<String>,
}

pub struct BatchDownloadResult {
    pub results: Vec<BatchItemResult>,
    pub total_count: usize,
    pub success_count: usize,
    pub failed_count: usize,
}
```

---

## Security Features

### URL Validation

```rust
pub fn validate_url(url: &str) -> Result<(), SecurityError>
```

Validates:
- URL format and scheme (http, https, file only)
- Blocks private IPs (127.0.0.0/8, 10.0.0.0/8, etc.)
- Blocks localhost variants
- Blocks dangerous protocols (javascript:, data:, etc.)

### Size Limits

```rust
pub fn validate_size(data: &str, max_size: usize) -> Result<(), SecurityError>
```

Default limits:
- `MAX_JSON_SIZE`: 10 MB
- `MAX_CSV_SIZE`: 50 MB
- `MAX_TILE_SIZE`: 5 MB
- `MAX_URL_LENGTH`: 2048

---

## Rate Limiting

### Sliding Window Algorithm

```rust
pub struct RateLimiter {
    max_requests: usize,
    window_duration: Duration,
    requests: VecDeque<Instant>,
}
```

Default limits:
- 100 requests per 60 seconds (global)
- Per-command limits configured individually

### Rate Limit Response

```rust
pub struct RateLimitResult {
    pub allowed: bool,
    pub retry_after: Option<Duration>,
    pub limit: usize,
    pub remaining: usize,
}
```

---

## HTTP Client Features

### Automatic Retry

Retries on:
- Connection errors
- Timeout errors
- 5xx server errors

### Progress Reporting

For downloads, progress events include:
- Bytes downloaded
- Total bytes
- Percentage complete
- Current speed

### Request Cancellation

```rust
// Cancel by request ID
cancel_request(request_id)

// Cancel all
http_cancel_all_requests()
```

---

## Testing

```bash
cd src-tauri
cargo test network::http_client::tests
cargo test network::security::tests
cargo test network::rate_limiter::tests
```

Security tests:

```bash
cargo test security_tests
```

---

## Related Files

- [`mod.rs`](./mod.rs) - Module exports
- [`http_client.rs`](./http_client.rs) - HTTP client
- [`security.rs`](./security.rs) - Security utilities
- [`rate_limiter.rs`](./rate_limiter.rs) - Rate limiting
- [../CLAUDE.md](../CLAUDE.md) - Backend documentation
