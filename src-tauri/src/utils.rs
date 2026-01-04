//! Common utilities module
//! Provides shared functionality for ID generation

use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

// ============================================================================
// Fast ID Generation
// ============================================================================

/// Atomic counter for unique IDs within the same millisecond
static ID_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Generate a fast, unique ID with a given prefix
/// Uses timestamp + counter + random for uniqueness without UUID overhead
#[inline]
pub fn generate_id(prefix: &str) -> String {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;
    let counter = ID_COUNTER.fetch_add(1, Ordering::Relaxed);
    // Simple random based on nanoseconds
    let random = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos()
        .wrapping_mul(1103515245)
        .wrapping_add(12345);
    format!(
        "{}-{:x}{:04x}{:08x}",
        prefix,
        timestamp,
        counter & 0xFFFF,
        random
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_id_uniqueness() {
        let id1 = generate_id("test");
        let id2 = generate_id("test");
        assert!(id1.starts_with("test-"));
        assert!(id2.starts_with("test-"));
        assert_ne!(id1, id2, "IDs should be unique");
    }

    #[test]
    fn test_generate_id_prefix() {
        let id = generate_id("marker");
        assert!(id.starts_with("marker-"));

        let id2 = generate_id("session");
        assert!(id2.starts_with("session-"));
    }

    #[test]
    fn test_generate_id_format() {
        let id = generate_id("test");
        // Format: prefix-timestamp_hex+counter_hex+random_hex
        let parts: Vec<&str> = id.split('-').collect();
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[0], "test");
        // The second part should be hex characters
        assert!(parts[1].chars().all(|c| c.is_ascii_hexdigit()));
    }
}
