//! Rate limiting utilities
//! Reserved for future use in request throttling
//!
//! Provides token bucket and sliding window rate limiters to prevent
//! command abuse and DoS attacks.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

/// Rate limiter configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    /// Maximum number of requests allowed
    pub max_requests: usize,
    /// Time window in seconds
    pub window_seconds: u64,
    /// Whether to ban clients that exceed the limit
    pub ban_on_exceed: bool,
    /// Ban duration in seconds (if ban_on_exceed is true)
    pub ban_duration_seconds: Option<u64>,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            max_requests: 100,
            window_seconds: 60,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        }
    }
}

impl RateLimitConfig {
    /// Conservative rate limit for sensitive operations
    pub fn conservative() -> Self {
        Self {
            max_requests: 10,
            window_seconds: 60,
            ban_on_exceed: true,
            ban_duration_seconds: Some(300), // 5 minutes
        }
    }

    /// Moderate rate limit for regular operations
    pub fn moderate() -> Self {
        Self {
            max_requests: 100,
            window_seconds: 60,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        }
    }

    /// Permissive rate limit for non-sensitive operations
    pub fn permissive() -> Self {
        Self {
            max_requests: 1000,
            window_seconds: 60,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        }
    }
}

/// Rate limiter using sliding window algorithm
#[derive(Debug, Clone)]
pub struct SlidingWindowLimiter {
    config: RateLimitConfig,
    window: Duration,
}

impl SlidingWindowLimiter {
    pub fn new(config: RateLimitConfig) -> Self {
        Self {
            window: Duration::from_secs(config.window_seconds),
            config,
        }
    }

    /// Check if a request should be allowed
    pub fn check(&self, state: &mut RateLimitState) -> RateLimitResult {
        let now = Instant::now();

        // Remove requests outside the current window
        state.requests.retain(|&timestamp| {
            now.duration_since(timestamp) < self.window
        });

        // Check if currently banned
        if let Some(banned_until) = state.banned_until {
            if now < banned_until {
                return RateLimitResult::Banned {
                    retry_after: banned_until.duration_since(now).as_secs(),
                };
            } else {
                // Ban expired
                state.banned_until = None;
            }
        }

        // Check rate limit
        if state.requests.len() >= self.config.max_requests {
            // Exceeded limit - maybe ban
            if self.config.ban_on_exceed {
                if let Some(ban_duration) = self.config.ban_duration_seconds {
                    let banned_until = now + Duration::from_secs(ban_duration);
                    state.banned_until = Some(banned_until);
                    return RateLimitResult::Banned {
                        retry_after: ban_duration,
                    };
                }
            }

            return RateLimitResult::RateLimited {
                retry_after: self.window.as_secs(),
            };
        }

        // Allow request
        state.requests.push(now);
        RateLimitResult::Allowed
    }
}

/// Rate limit state for a single client
#[derive(Debug, Clone)]
pub struct RateLimitState {
    requests: Vec<Instant>,
    banned_until: Option<Instant>,
}

impl Default for RateLimitState {
    fn default() -> Self {
        Self {
            requests: Vec::new(),
            banned_until: None,
        }
    }
}

/// Result of a rate limit check
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RateLimitResult {
    /// Request is allowed
    Allowed,
    /// Rate limit exceeded
    RateLimited { retry_after: u64 },
    /// Client is temporarily banned
    Banned { retry_after: u64 },
}

impl RateLimitResult {
    pub fn is_allowed(&self) -> bool {
        matches!(self, Self::Allowed)
    }
}

/// Global rate limiter for all commands
pub struct GlobalRateLimiter {
    limiters: Arc<Mutex<HashMap<String, (SlidingWindowLimiter, RateLimitState)>>>,
}

impl GlobalRateLimiter {
    pub fn new() -> Self {
        Self {
            limiters: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Check if a command should be rate limited
    pub fn check(
        &self,
        command: &str,
        config: RateLimitConfig,
    ) -> RateLimitResult {
        let mut limiters = self.limiters.lock().unwrap();

        let entry = limiters
            .entry(command.to_string())
            .or_insert_with(|| (SlidingWindowLimiter::new(config.clone()), RateLimitState::default()));

        entry.0.check(&mut entry.1)
    }

    /// Reset rate limit state for a command (for testing/admin)
    pub fn reset(&self, command: &str) {
        let mut limiters = self.limiters.lock().unwrap();
        limiters.remove(command);
    }

    /// Get current state for a command
    pub fn get_state(&self, command: &str) -> Option<(usize, Option<Instant>)> {
        let limiters = self.limiters.lock().unwrap();
        limiters.get(command).map(|(_, state)| {
            (state.requests.len(), state.banned_until)
        })
    }
}

impl Default for GlobalRateLimiter {
    fn default() -> Self {
        Self::new()
    }
}

/// Rate limit configurations for specific commands
pub fn get_command_rate_limit(command: &str) -> RateLimitConfig {
    match command {
        // Sensitive commands - conservative limits
        | "open_path"
        | "reveal_in_file_manager"
        | "import_all_data"
        | "export_all_data"
        | "delete_store_data"
        | "clear_all_data"
        => RateLimitConfig::conservative(),

        // File operations - moderate limits
        | "save_store_data"
        | "load_store_data"
        | "save_cached_tile"
        | "import_targets"
        | "export_targets"
        => RateLimitConfig::moderate(),

        // Cache operations - permissive limits
        | "prefetch_url"
        | "load_cached_tile"
        | "get_unified_cache_stats"
        => RateLimitConfig::permissive(),

        // Read-only operations - very permissive
        | "get_data_directory"
        | "list_stores"
        | "get_storage_stats"
        | "get_current_location"
        | "load_equipment"
        | "load_locations"
        => RateLimitConfig {
            max_requests: 10000,
            window_seconds: 60,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        },

        // Default - moderate limits
        _ => RateLimitConfig::moderate(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rate_limit_within_window() {
        let config = RateLimitConfig {
            max_requests: 5,
            window_seconds: 1,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        };

        let limiter = SlidingWindowLimiter::new(config);
        let mut state = RateLimitState::default();

        // First 5 requests should be allowed
        for _ in 0..5 {
            assert!(limiter.check(&mut state).is_allowed());
        }

        // 6th request should be rate limited
        assert!(!limiter.check(&mut state).is_allowed());
    }

    #[test]
    fn test_rate_limit_window_expires() {
        let config = RateLimitConfig {
            max_requests: 2,
            window_seconds: 1,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        };

        let limiter = SlidingWindowLimiter::new(config);
        let mut state = RateLimitState::default();

        // Use up the limit
        assert!(limiter.check(&mut state).is_allowed());
        assert!(limiter.check(&mut state).is_allowed());
        assert!(!limiter.check(&mut state).is_allowed());

        // Wait for window to expire
        std::thread::sleep(Duration::from_secs(2));

        // Should be allowed again
        assert!(limiter.check(&mut state).is_allowed());
    }

    #[test]
    fn test_ban_on_exceed() {
        let config = RateLimitConfig {
            max_requests: 2,
            window_seconds: 1, // Short window so requests expire quickly
            ban_on_exceed: true,
            ban_duration_seconds: Some(1),
        };

        let limiter = SlidingWindowLimiter::new(config);
        let mut state = RateLimitState::default();

        // Use up the limit
        assert!(limiter.check(&mut state).is_allowed());
        assert!(limiter.check(&mut state).is_allowed());

        // Exceed limit - should get banned
        match limiter.check(&mut state) {
            RateLimitResult::Banned { retry_after } => {
                assert!(retry_after > 0);
            }
            _ => panic!("Expected banned result"),
        }

        // While banned, all requests should be rejected
        match limiter.check(&mut state) {
            RateLimitResult::Banned { .. } => {},
            _ => panic!("Expected banned result"),
        }

        // Wait for ban to expire
        std::thread::sleep(Duration::from_secs(2));

        // Should be allowed again
        assert!(limiter.check(&mut state).is_allowed());
    }

    #[test]
    fn test_global_rate_limiter() {
        let limiter = GlobalRateLimiter::new();
        let config = RateLimitConfig {
            max_requests: 3,
            window_seconds: 60,
            ban_on_exceed: false,
            ban_duration_seconds: None,
        };

        // Check within limit
        assert!(limiter.check("test_command", config.clone()).is_allowed());
        assert!(limiter.check("test_command", config.clone()).is_allowed());
        assert!(limiter.check("test_command", config.clone()).is_allowed());

        // Exceed limit
        assert!(!limiter.check("test_command", config.clone()).is_allowed());

        // Different command should have separate limit
        assert!(limiter.check("other_command", config.clone()).is_allowed());

        // Reset and try again
        limiter.reset("test_command");
        assert!(limiter.check("test_command", config.clone()).is_allowed());
    }
}
