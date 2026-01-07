//! Rate limiting utilities
//! Provides token bucket and sliding window rate limiters

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    pub max_requests: usize,
    pub window_seconds: u64,
    pub ban_on_exceed: bool,
    pub ban_duration_seconds: Option<u64>,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self { max_requests: 100, window_seconds: 60, ban_on_exceed: false, ban_duration_seconds: None }
    }
}

impl RateLimitConfig {
    pub fn conservative() -> Self {
        Self { max_requests: 10, window_seconds: 60, ban_on_exceed: true, ban_duration_seconds: Some(300) }
    }
    pub fn moderate() -> Self {
        Self { max_requests: 100, window_seconds: 60, ban_on_exceed: false, ban_duration_seconds: None }
    }
    pub fn permissive() -> Self {
        Self { max_requests: 1000, window_seconds: 60, ban_on_exceed: false, ban_duration_seconds: None }
    }
}

#[derive(Debug, Clone)]
pub struct SlidingWindowLimiter {
    config: RateLimitConfig,
    window: Duration,
}

impl SlidingWindowLimiter {
    pub fn new(config: RateLimitConfig) -> Self {
        Self { window: Duration::from_secs(config.window_seconds), config }
    }

    pub fn check(&self, state: &mut RateLimitState) -> RateLimitResult {
        let now = Instant::now();
        state.requests.retain(|&timestamp| now.duration_since(timestamp) < self.window);

        if let Some(banned_until) = state.banned_until {
            if now < banned_until {
                return RateLimitResult::Banned { retry_after: banned_until.duration_since(now).as_secs() };
            } else {
                state.banned_until = None;
            }
        }

        if state.requests.len() >= self.config.max_requests {
            if self.config.ban_on_exceed {
                if let Some(ban_duration) = self.config.ban_duration_seconds {
                    state.banned_until = Some(now + Duration::from_secs(ban_duration));
                    return RateLimitResult::Banned { retry_after: ban_duration };
                }
            }
            return RateLimitResult::RateLimited { retry_after: self.window.as_secs() };
        }

        state.requests.push(now);
        RateLimitResult::Allowed
    }
}

#[derive(Debug, Clone, Default)]
pub struct RateLimitState {
    requests: Vec<Instant>,
    banned_until: Option<Instant>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RateLimitResult {
    Allowed,
    RateLimited { retry_after: u64 },
    Banned { retry_after: u64 },
}

impl RateLimitResult {
    #[allow(dead_code)]
    pub fn is_allowed(&self) -> bool { matches!(self, Self::Allowed) }
}

pub struct GlobalRateLimiter {
    limiters: Arc<Mutex<HashMap<String, (SlidingWindowLimiter, RateLimitState)>>>,
}

impl GlobalRateLimiter {
    pub fn new() -> Self {
        Self { limiters: Arc::new(Mutex::new(HashMap::new())) }
    }

    pub fn check(&self, command: &str, config: RateLimitConfig) -> RateLimitResult {
        let mut limiters = self.limiters.lock().unwrap();
        let entry = limiters.entry(command.to_string())
            .or_insert_with(|| (SlidingWindowLimiter::new(config.clone()), RateLimitState::default()));
        entry.0.check(&mut entry.1)
    }

    #[allow(dead_code)]
    pub fn reset(&self, command: &str) {
        self.limiters.lock().unwrap().remove(command);
    }
}

impl Default for GlobalRateLimiter {
    fn default() -> Self { Self::new() }
}

pub fn get_command_rate_limit(command: &str) -> RateLimitConfig {
    match command {
        "open_path" | "reveal_in_file_manager" | "import_all_data" | "export_all_data" 
        | "delete_store_data" | "clear_all_data" => RateLimitConfig::conservative(),
        
        "save_store_data" | "load_store_data" | "save_cached_tile" | "import_targets" 
        | "export_targets" => RateLimitConfig::moderate(),
        
        "prefetch_url" | "load_cached_tile" | "get_unified_cache_stats" => RateLimitConfig::permissive(),
        
        "get_data_directory" | "list_stores" | "get_storage_stats" | "get_current_location" 
        | "load_equipment" | "load_locations" => RateLimitConfig {
            max_requests: 10000, window_seconds: 60, ban_on_exceed: false, ban_duration_seconds: None,
        },
        
        _ => RateLimitConfig::moderate(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rate_limit_within_window() {
        let limiter = SlidingWindowLimiter::new(RateLimitConfig { max_requests: 5, window_seconds: 1, ban_on_exceed: false, ban_duration_seconds: None });
        let mut state = RateLimitState::default();
        for _ in 0..5 { assert!(limiter.check(&mut state).is_allowed()); }
        assert!(!limiter.check(&mut state).is_allowed());
    }

    #[test]
    fn test_global_rate_limiter() {
        let limiter = GlobalRateLimiter::new();
        let config = RateLimitConfig { max_requests: 3, window_seconds: 60, ban_on_exceed: false, ban_duration_seconds: None };
        assert!(limiter.check("test", config.clone()).is_allowed());
        assert!(limiter.check("test", config.clone()).is_allowed());
        assert!(limiter.check("test", config.clone()).is_allowed());
        assert!(!limiter.check("test", config.clone()).is_allowed());
        assert!(limiter.check("other", config).is_allowed());
    }
}
