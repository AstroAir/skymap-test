# Phase 2 Security Implementation Guide

**Date:** 2025-12-26
**Status:** ✅ Completed
**Severity:** HIGH Priority Improvements

## Overview

Phase 2 implements HIGH priority security fixes identified in the attack tree analysis. These changes address critical vulnerabilities related to SSRF attacks, resource exhaustion, and lack of rate limiting.

## Summary of Changes

### 1. ✅ URL Validation for SSRF Prevention

**Files Modified:**
- `src-tauri/src/security.rs` (NEW)
- `src-tauri/src/unified_cache.rs`
- `lib/security/url-validator.ts` (NEW)
- `lib/offline/unified-cache.ts`

**Vulnerability Addressed:**
- **SSRF via URL Injection** (HIGH severity)
- Previously allowed arbitrary URLs including `file:///`, `http://localhost`, private IPs

**Implementation:**

#### Backend (Rust):
```rust
use crate::security::validate_url;

// In prefetch_url command
let validated_url = security::validate_url(&url, false, None)
    .map_err(|e| StorageError::Other(e.to_string()))?;
```

**Security Rules:**
- ✅ Only HTTPS allowed by default (HTTP optionally configurable)
- ✅ Blocks private IP ranges: `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`, `169.254.x.x`
- ✅ Blocks localhost: `localhost`, `127.x.x.x`, `::1`
- ✅ Blocks dangerous schemes: `file://`, `data://`, `javascript://`, `ftp://`
- ✅ Optional domain allowlist support
- ✅ URL length limit: 2048 characters

#### Frontend (TypeScript):
```typescript
import { validateUrl } from '@/lib/security/url-validator';

// In fetch methods
try {
  validateUrl(url, { allowHttp: false });
  // Proceed with fetch
} catch (error) {
  // Handle security error
}
```

---

### 2. ✅ Input Size Limits

**Files Modified:**
- `src-tauri/src/storage.rs`
- `src-tauri/src/offline_cache.rs`
- `src-tauri/src/target_io.rs`

**Vulnerabilities Addressed:**
- **Denial of Service via Oversized Inputs** (HIGH severity)
- Previously unlimited input sizes allowed memory/disk exhaustion

**Size Limits Enforced:**

| Input Type | Max Size | Location |
|------------|----------|----------|
| JSON payloads | 10 MB | [storage.rs:92](src-tauri/src/storage.rs#L92) |
| CSV imports | 50 MB + 100K rows | [target_io.rs:130](src-tauri/src/target_io.rs#L130) |
| Tile data | 5 MB | [offline_cache.rs:320](src-tauri/src/offline_cache.rs#L320) |
| URL length | 2048 chars | [security.rs:60](src-tauri/src/security.rs#L60) |

**Implementation Examples:**

```rust
// JSON size validation
use crate::security::{self, limits};

pub async fn save_store_data(
    app: AppHandle,
    store_name: String,
    data: String,
) -> Result<(), StorageError> {
    // SECURITY: Validate input size
    crate::security::validate_size(&data, limits::MAX_JSON_SIZE)
        .map_err(|e| StorageError::Other(e.to_string()))?;

    // ... rest of function
}

// CSV size validation with row count limit
fn import_csv(content: &str) -> ImportTargetsResult {
    let lines: Vec<&str> = content.lines().collect();

    // SECURITY: Validate row count
    if lines.len() > limits::MAX_CSV_ROWS {
        return ImportTargetsResult {
            errors: vec![
                format!("CSV exceeds maximum rows: {} (max: {})",
                    lines.len(), limits::MAX_CSV_ROWS)
            ],
            // ...
        };
    }
    // ... rest of function
}
```

---

### 3. ✅ Rate Limiting Infrastructure

**Files Created:**
- `src-tauri/src/rate_limiter.rs` (NEW)

**Vulnerability Addressed:**
- **API Abuse / Resource Exhaustion** (HIGH severity)
- Previously unlimited command invocation allowed abuse

**Features:**
- Sliding window rate limiting algorithm
- Per-command rate limit configuration
- Automatic banning for repeat offenders
- Global rate limiter for all commands

**Rate Limit Tiers:**

| Tier | Requests/Minute | Use Cases | Ban on Exceed |
|------|-----------------|-----------|---------------|
| **Conservative** | 10 | Sensitive operations (file access, data import/export) | ✅ Yes (5 min) |
| **Moderate** | 100 | Regular operations (CRUD, cache operations) | ❌ No |
| **Permissive** | 1000 | Cache prefetch, tile loading | ❌ No |
| **Read-Only** | 10000 | Read queries (get, list, stats) | ❌ No |

**Implementation:**

```rust
use crate::rate_limiter::{GlobalRateLimiter, RateLimitConfig};

// Global rate limiter instance
static RATE_LIMITER: once_cell::sync::Lazy<GlobalRateLimiter> =
    once_cell::sync::Lazy::new(GlobalRateLimiter::new);

// Usage in command handlers
#[tauri::command]
pub async fn sensitive_operation(
    // ... parameters
) -> Result<(), StorageError> {
    let config = rate_limiter::get_command_rate_limit("sensitive_operation");

    match RATE_LIMITER.check("sensitive_operation", config) {
        rate_limiter::RateLimitResult::Allowed => {
            // Proceed with operation
        }
        rate_limiter::RateLimitResult::RateLimited { retry_after } => {
            return Err(StorageError::Other(format!(
                "Rate limited. Try again in {} seconds.",
                retry_after
            )));
        }
        rate_limiter::RateLimitResult::Banned { retry_after } => {
            return Err(StorageError::Other(format!(
                "Banned for excessive requests. Try again in {} seconds.",
                retry_after
            )));
        }
    }

    // ... actual command logic
}
```

---

### 4. ✅ Comprehensive Security Tests

**Files Created:**
- `src-tauri/src/security_tests.rs` (NEW)

**Test Coverage:**
- URL validation (localhost, private IPs, dangerous schemes, allowlists)
- Input size limits (JSON, CSV, tiles)
- Rate limiting (window expiry, ban behavior, per-command limits)
- Integration tests (defense in depth)

**Running Tests:**

```bash
# Run all security tests
cd src-tauri
cargo test security_tests

# Run specific test
cargo test test_url_validation_blocks_localhost

# Run with output
cargo test security_tests -- --nocapture
```

---

## Configuration Guide

### Adjusting Size Limits

Edit `src-tauri/src/security.rs`:

```rust
pub mod limits {
    pub const MAX_JSON_SIZE: usize = 10 * 1024 * 1024; // Adjust as needed
    pub const MAX_CSV_SIZE: usize = 50 * 1024 * 1024;
    pub const MAX_TILE_SIZE: usize = 5 * 1024 * 1024;
    pub const MAX_CSV_ROWS: usize = 100_000;
}
```

### Configuring Rate Limits

Edit `src-tauri/src/rate_limiter.rs` in `get_command_rate_limit()`:

```rust
pub fn get_command_rate_limit(command: &str) -> RateLimitConfig {
    match command {
        "my_sensitive_command" => RateLimitConfig {
            max_requests: 5,      // Custom limit
            window_seconds: 60,
            ban_on_exceed: true,
            ban_duration_seconds: Some(300),
        },
        // ... other commands
    }
}
```

### URL Allowlist Configuration

```rust
// Backend
let allowlist = vec!["api.trusted.com", "cdn.trusted.com"];
let validated_url = validate_url(&url, false, Some(&allowlist))?;

// Frontend
validateUrl(url, {
    allowHttp: false,
    allowlist: ['api.trusted.com', 'cdn.trusted.com']
});
```

---

## Migration Guide

### For Existing Commands

#### 1. Add URL Validation (for commands accepting URLs)

**Before:**
```rust
#[tauri::command]
pub async fn fetch_resource(url: String) -> Result<Response, Error> {
    let response = reqwest::get(&url).await?;
    // ...
}
```

**After:**
```rust
#[tauri::command]
pub async fn fetch_resource(url: String) -> Result<Response, Error> {
    // Validate URL first
    let validated_url = security::validate_url(&url, false, None)
        .map_err(|e| Error::Security(e.to_string()))?;

    let response = reqwest::get(validated_url.as_str()).await?;
    // ...
}
```

#### 2. Add Size Validation (for commands accepting large data)

**Before:**
```rust
#[tauri::command]
pub async fn process_data(data: String) -> Result<(), Error> {
    let parsed: MyData = serde_json::from_str(&data)?;
    // ...
}
```

**After:**
```rust
#[tauri::command]
pub async fn process_data(data: String) -> Result<(), Error> {
    // Validate size
    security::validate_size(&data, limits::MAX_JSON_SIZE)
        .map_err(|e| Error::Security(e.to_string()))?;

    let parsed: MyData = serde_json::from_str(&data)?;
    // ...
}
```

#### 3. Add Rate Limiting (for frequently used commands)

**Before:**
```rust
#[tauri::command]
pub async fn my_command() -> Result<(), Error> {
    // Command logic
}
```

**After:**
```rust
static RATE_LIMITER: Lazy<GlobalRateLimiter> = Lazy::new(GlobalRateLimiter::new);

#[tauri::command]
pub async fn my_command() -> Result<(), Error> {
    // Check rate limit
    let config = rate_limiter::get_command_rate_limit("my_command");
    match RATE_LIMITER.check("my_command", config) {
        rate_limiter::RateLimitResult::Allowed => {},
        rate_limiter::RateLimitResult::RateLimited { retry_after } => {
            return Err(Error::RateLimited(format!(
                "Try again in {}s", retry_after
            )));
        },
        rate_limiter::RateLimitResult::Banned { retry_after } => {
            return Err(Error::Banned(format!(
                "Banned for {}s", retry_after
            )));
        },
    }

    // Command logic
}
```

---

## Security Improvements Summary

### Before Phase 2:
- ❌ Arbitrary URLs allowed (SSRF risk)
- ❌ Unlimited input sizes (DoS risk)
- ❌ No rate limiting (abuse risk)
- ❌ No security tests

### After Phase 2:
- ✅ URL validation blocks SSRF attacks
- ✅ Size limits prevent resource exhaustion
- ✅ Rate limiting prevents abuse
- ✅ Comprehensive security test suite

---

## Testing Checklist

- [x] All security tests pass: `cargo test security_tests`
- [x] URL validation blocks localhost: `cargo test test_url_validation_blocks_localhost`
- [x] URL validation blocks private IPs: `cargo test test_url_validation_blocks_private_ips`
- [x] Size limits enforced: `cargo test test_json_size_limit`
- [x] Rate limiting works: `cargo test test_global_rate_limiter`
- [x] Integration tests verify defense in depth: `cargo test test_security_defense_in_depth`

---

## Dependencies Added

### Cargo.toml:
```toml
[dependencies]
url = "2.5"  # For URL parsing and validation
```

### Frontend:
No new dependencies - uses native URL API.

---

## Next Steps (Phase 3 - Medium Priority)

1. **Authentication/Authorization Layer**
   - Implement user authentication
   - Add permission checks to all commands
   - Role-based access control

2. **Data Encryption**
   - Encrypt sensitive data at rest
   - Use system credential storage
   - Implement key management

3. **Audit Logging**
   - Log all security-relevant operations
   - Implement tamper-evident logs
   - Add alerting for suspicious activities

4. **CSP Implementation**
   - Remove `"csp": null` from tauri.conf.json
   - Implement strict Content Security Policy
   - Add CSP report-only mode for testing

---

## References

- Original Attack Tree Analysis: [docs/security/attack-trees-analysis.md](attack-trees-analysis.md)
- Security Vulnerability Report: [llmdoc/agent/security-vulnerability-report.md](../../llmdoc/agent/security-vulnerability-report.md)
- Tauri Security Guide: https://tauri.app/v1/guides/security/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- SSRF Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

---

**Implementation completed:** 2025-12-26
**Implemented by:** Claude Code Security Agent
**Review status:** Ready for code review and testing
