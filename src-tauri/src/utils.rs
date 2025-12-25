//! Common utilities module
//! Provides shared functionality for ID generation, async I/O helpers, and caching utilities

use once_cell::sync::Lazy;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::path::PathBuf;
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
    let random = fastrand::u32(..);
    format!("{}-{:x}{:04x}{:08x}", prefix, timestamp, counter & 0xFFFF, random)
}


// ============================================================================
// Async File I/O Helpers
// ============================================================================

/// Read file contents asynchronously using tokio
pub async fn read_file_async(path: &PathBuf) -> std::io::Result<String> {
    tokio::fs::read_to_string(path).await
}

/// Read file as bytes asynchronously
pub async fn read_file_bytes_async(path: &PathBuf) -> std::io::Result<Vec<u8>> {
    tokio::fs::read(path).await
}

/// Write string to file asynchronously
pub async fn write_file_async(path: &PathBuf, contents: &str) -> std::io::Result<()> {
    tokio::fs::write(path, contents).await
}

/// Write bytes to file asynchronously
pub async fn write_file_bytes_async(path: &PathBuf, contents: &[u8]) -> std::io::Result<()> {
    tokio::fs::write(path, contents).await
}

/// Check if file exists asynchronously
pub async fn file_exists_async(path: &PathBuf) -> bool {
    tokio::fs::metadata(path).await.is_ok()
}

/// Create directory recursively asynchronously
pub async fn create_dir_all_async(path: &PathBuf) -> std::io::Result<()> {
    tokio::fs::create_dir_all(path).await
}

/// Remove file asynchronously
pub async fn remove_file_async(path: &PathBuf) -> std::io::Result<()> {
    tokio::fs::remove_file(path).await
}

/// Remove directory recursively asynchronously
pub async fn remove_dir_all_async(path: &PathBuf) -> std::io::Result<()> {
    tokio::fs::remove_dir_all(path).await
}

// ============================================================================
// Path Caching
// ============================================================================

/// Thread-safe path cache for frequently accessed directories
pub struct PathCache {
    cache: RwLock<HashMap<String, PathBuf>>,
}

impl PathCache {
    pub fn new() -> Self {
        Self {
            cache: RwLock::new(HashMap::new()),
        }
    }

    /// Get cached path or compute and cache it
    pub fn get_or_insert<F>(&self, key: &str, compute: F) -> PathBuf
    where
        F: FnOnce() -> PathBuf,
    {
        // Fast path: read lock
        if let Some(path) = self.cache.read().get(key) {
            return path.clone();
        }

        // Slow path: write lock
        let mut cache = self.cache.write();
        // Double-check after acquiring write lock
        if let Some(path) = cache.get(key) {
            return path.clone();
        }

        let path = compute();
        cache.insert(key.to_string(), path.clone());
        path
    }

    /// Clear the cache
    pub fn clear(&self) {
        self.cache.write().clear();
    }
}

/// Global path cache instance
pub static PATH_CACHE: Lazy<PathCache> = Lazy::new(PathCache::new);

// ============================================================================
// Generic In-Memory Data Cache
// ============================================================================

/// Generic cached data wrapper with dirty flag for write-back optimization
pub struct CachedData<T> {
    data: RwLock<Option<T>>,
    dirty: RwLock<bool>,
}

impl<T: Clone> CachedData<T> {
    pub const fn new() -> Self {
        Self {
            data: RwLock::new(None),
            dirty: RwLock::new(false),
        }
    }

    /// Get cached data if available
    pub fn get(&self) -> Option<T> {
        self.data.read().clone()
    }

    /// Set cached data
    pub fn set(&self, value: T) {
        *self.data.write() = Some(value);
    }

    /// Set cached data and mark as dirty
    pub fn set_dirty(&self, value: T) {
        *self.data.write() = Some(value);
        *self.dirty.write() = true;
    }

    /// Check if cache has data
    pub fn has_data(&self) -> bool {
        self.data.read().is_some()
    }

    /// Check if data is dirty (needs to be written)
    pub fn is_dirty(&self) -> bool {
        *self.dirty.read()
    }

    /// Clear dirty flag
    pub fn clear_dirty(&self) {
        *self.dirty.write() = false;
    }

    /// Clear the cache
    pub fn clear(&self) {
        *self.data.write() = None;
        *self.dirty.write() = false;
    }

    /// Get or load data using provided loader function
    pub fn get_or_load<F, E>(&self, loader: F) -> Result<T, E>
    where
        F: FnOnce() -> Result<T, E>,
    {
        if let Some(data) = self.get() {
            return Ok(data);
        }

        let data = loader()?;
        self.set(data.clone());
        Ok(data)
    }
}

// ============================================================================
// LRU Cache for bounded caching
// ============================================================================

/// Simple LRU cache with size limit
pub struct LruCache<K, V> {
    capacity: usize,
    entries: RwLock<Vec<(K, V)>>,
}

impl<K: Eq + Clone, V: Clone> LruCache<K, V> {
    pub fn new(capacity: usize) -> Self {
        Self {
            capacity,
            entries: RwLock::new(Vec::with_capacity(capacity)),
        }
    }

    /// Get value from cache, moving it to front (most recently used)
    pub fn get(&self, key: &K) -> Option<V> {
        let mut entries = self.entries.write();
        if let Some(pos) = entries.iter().position(|(k, _)| k == key) {
            let entry = entries.remove(pos);
            let value = entry.1.clone();
            entries.push(entry);
            Some(value)
        } else {
            None
        }
    }

    /// Insert value into cache, evicting oldest if at capacity
    pub fn insert(&self, key: K, value: V) {
        let mut entries = self.entries.write();
        
        // Remove existing entry with same key
        if let Some(pos) = entries.iter().position(|(k, _)| k == &key) {
            entries.remove(pos);
        }
        
        // Evict oldest if at capacity
        while entries.len() >= self.capacity {
            entries.remove(0);
        }
        
        entries.push((key, value));
    }

    /// Remove entry from cache
    pub fn remove(&self, key: &K) -> Option<V> {
        let mut entries = self.entries.write();
        if let Some(pos) = entries.iter().position(|(k, _)| k == key) {
            Some(entries.remove(pos).1)
        } else {
            None
        }
    }

    /// Clear the cache
    pub fn clear(&self) {
        self.entries.write().clear();
    }

    /// Get current size
    pub fn len(&self) -> usize {
        self.entries.read().len()
    }

    /// Check if empty
    pub fn is_empty(&self) -> bool {
        self.entries.read().is_empty()
    }
}

// ============================================================================
// Timing utilities for performance logging
// ============================================================================

/// Simple timer for measuring operation duration
pub struct Timer {
    start: std::time::Instant,
    name: String,
}

impl Timer {
    pub fn new(name: &str) -> Self {
        Self {
            start: std::time::Instant::now(),
            name: name.to_string(),
        }
    }

    pub fn elapsed_ms(&self) -> u128 {
        self.start.elapsed().as_millis()
    }

    pub fn log_if_slow(&self, threshold_ms: u128) {
        let elapsed = self.elapsed_ms();
        if elapsed > threshold_ms {
            log::warn!("{} took {}ms (threshold: {}ms)", self.name, elapsed, threshold_ms);
        }
    }
}

impl Drop for Timer {
    fn drop(&mut self) {
        let elapsed = self.elapsed_ms();
        if elapsed > 100 {
            log::debug!("{} completed in {}ms", self.name, elapsed);
        }
    }
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

    #[test]
    fn test_lru_cache_basic() {
        let cache: LruCache<String, i32> = LruCache::new(3);
        
        cache.insert("a".to_string(), 1);
        cache.insert("b".to_string(), 2);
        cache.insert("c".to_string(), 3);
        
        assert_eq!(cache.get(&"a".to_string()), Some(1));
        assert_eq!(cache.get(&"b".to_string()), Some(2));
        assert_eq!(cache.get(&"c".to_string()), Some(3));
        assert_eq!(cache.len(), 3);
    }

    #[test]
    fn test_lru_cache_eviction() {
        let cache: LruCache<String, i32> = LruCache::new(3);
        
        cache.insert("a".to_string(), 1);
        cache.insert("b".to_string(), 2);
        cache.insert("c".to_string(), 3);
        
        // Access "a" to make it recently used
        assert_eq!(cache.get(&"a".to_string()), Some(1));
        
        // Insert d, should evict b (oldest not recently accessed)
        cache.insert("d".to_string(), 4);
        
        assert_eq!(cache.get(&"b".to_string()), None);
        assert_eq!(cache.get(&"a".to_string()), Some(1));
        assert_eq!(cache.get(&"c".to_string()), Some(3));
        assert_eq!(cache.get(&"d".to_string()), Some(4));
    }

    #[test]
    fn test_lru_cache_update() {
        let cache: LruCache<String, i32> = LruCache::new(3);
        
        cache.insert("a".to_string(), 1);
        cache.insert("a".to_string(), 10); // Update existing key
        
        assert_eq!(cache.get(&"a".to_string()), Some(10));
        assert_eq!(cache.len(), 1);
    }

    #[test]
    fn test_lru_cache_remove() {
        let cache: LruCache<String, i32> = LruCache::new(3);
        
        cache.insert("a".to_string(), 1);
        cache.insert("b".to_string(), 2);
        
        let removed = cache.remove(&"a".to_string());
        assert_eq!(removed, Some(1));
        assert_eq!(cache.get(&"a".to_string()), None);
        assert_eq!(cache.len(), 1);
    }

    #[test]
    fn test_lru_cache_clear() {
        let cache: LruCache<String, i32> = LruCache::new(3);
        
        cache.insert("a".to_string(), 1);
        cache.insert("b".to_string(), 2);
        
        cache.clear();
        assert!(cache.is_empty());
        assert_eq!(cache.len(), 0);
    }

    #[test]
    fn test_cached_data_basic() {
        let cached: CachedData<String> = CachedData::new();
        
        assert!(!cached.has_data());
        assert_eq!(cached.get(), None);
        
        cached.set("hello".to_string());
        assert!(cached.has_data());
        assert_eq!(cached.get(), Some("hello".to_string()));
    }

    #[test]
    fn test_cached_data_dirty_flag() {
        let cached: CachedData<i32> = CachedData::new();
        
        assert!(!cached.is_dirty());
        
        cached.set_dirty(42);
        assert!(cached.is_dirty());
        assert_eq!(cached.get(), Some(42));
        
        cached.clear_dirty();
        assert!(!cached.is_dirty());
        assert_eq!(cached.get(), Some(42));
    }

    #[test]
    fn test_cached_data_clear() {
        let cached: CachedData<i32> = CachedData::new();
        
        cached.set_dirty(42);
        cached.clear();
        
        assert!(!cached.has_data());
        assert!(!cached.is_dirty());
        assert_eq!(cached.get(), None);
    }

    #[test]
    fn test_timer_elapsed() {
        let timer = Timer::new("test_op");
        std::thread::sleep(std::time::Duration::from_millis(10));
        let elapsed = timer.elapsed_ms();
        assert!(elapsed >= 10, "Timer should measure at least 10ms");
    }

    #[test]
    fn test_path_cache() {
        let cache = PathCache::new();
        
        let path1 = cache.get_or_insert("key1", || PathBuf::from("/test/path1"));
        assert_eq!(path1, PathBuf::from("/test/path1"));
        
        // Should return cached value
        let path1_again = cache.get_or_insert("key1", || PathBuf::from("/different/path"));
        assert_eq!(path1_again, PathBuf::from("/test/path1"));
        
        // Different key should compute new value
        let path2 = cache.get_or_insert("key2", || PathBuf::from("/test/path2"));
        assert_eq!(path2, PathBuf::from("/test/path2"));
    }

    // Note: Async tests require tokio::test feature which is not enabled.
    // These tests can be run manually with `cargo test --features tokio/rt-multi-thread`
    // For now, we test the sync wrappers or skip async tests.
}
