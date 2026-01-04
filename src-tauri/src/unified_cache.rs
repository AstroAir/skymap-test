//! Unified cache module for Tauri
//! Provides file-system based caching for network resources

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::StorageError;
use crate::security::{self, limits};
use crate::http_client::{self, RequestConfig};

// ============================================================================
// Types
// ============================================================================

/// Cache entry metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntryMeta {
    pub key: String,
    pub content_type: String,
    pub size_bytes: u64,
    pub timestamp: i64,
    pub ttl: i64,
    pub etag: Option<String>,
}

/// Cache index
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CacheIndex {
    pub entries: HashMap<String, CacheEntryMeta>,
    pub total_size: u64,
    pub last_cleanup: Option<DateTime<Utc>>,
}

// ============================================================================
// Path Helpers
// ============================================================================

fn get_unified_cache_dir(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| StorageError::AppDataDirNotFound)?;
    
    let cache_dir = app_data_dir.join("skymap").join("unified_cache");
    
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir)?;
    }
    
    Ok(cache_dir)
}

fn get_cache_index_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let cache_dir = get_unified_cache_dir(app)?;
    Ok(cache_dir.join("index.json"))
}

fn get_cache_data_dir(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let cache_dir = get_unified_cache_dir(app)?;
    let data_dir = cache_dir.join("data");
    
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir)?;
    }
    
    Ok(data_dir)
}

fn key_to_filename(key: &str) -> String {
    // Create a safe filename from the key using hash
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    key.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

// ============================================================================
// Cache Index Management
// ============================================================================

fn load_cache_index(app: &AppHandle) -> Result<CacheIndex, StorageError> {
    let path = get_cache_index_path(app)?;
    
    if !path.exists() {
        return Ok(CacheIndex::default());
    }
    
    let data = fs::read_to_string(&path)?;
    let index: CacheIndex = serde_json::from_str(&data)?;
    
    Ok(index)
}

fn save_cache_index(app: &AppHandle, index: &CacheIndex) -> Result<(), StorageError> {
    let path = get_cache_index_path(app)?;
    let json = serde_json::to_string_pretty(index)?;
    fs::write(&path, json)?;
    Ok(())
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Get a cache entry
#[tauri::command]
pub async fn get_unified_cache_entry(
    app: AppHandle,
    key: String,
) -> Result<Option<UnifiedCacheResponse>, StorageError> {
    let index = load_cache_index(&app)?;
    
    let meta = match index.entries.get(&key) {
        Some(m) => m,
        None => return Ok(None),
    };
    
    // Check expiration
    if meta.ttl > 0 {
        let now = Utc::now().timestamp_millis();
        if now > meta.timestamp + meta.ttl {
            // Expired - delete and return None
            delete_unified_cache_entry(app, key).await?;
            return Ok(None);
        }
    }
    
    // Load data
    let data_dir = get_cache_data_dir(&app)?;
    let filename = key_to_filename(&key);
    let data_path = data_dir.join(&filename);
    
    if !data_path.exists() {
        return Ok(None);
    }
    
    let data = fs::read(&data_path)?;
    
    Ok(Some(UnifiedCacheResponse {
        data,
        content_type: meta.content_type.clone(),
        timestamp: meta.timestamp,
        ttl: meta.ttl,
    }))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedCacheResponse {
    pub data: Vec<u8>,
    pub content_type: String,
    pub timestamp: i64,
    pub ttl: i64,
}

/// Put a cache entry
#[tauri::command]
pub async fn put_unified_cache_entry(
    app: AppHandle,
    key: String,
    data: Vec<u8>,
    content_type: String,
    ttl: i64,
) -> Result<(), StorageError> {
    let mut index = load_cache_index(&app)?;
    let data_dir = get_cache_data_dir(&app)?;

    // SECURITY: Check cache entry count limit
    if index.entries.len() >= limits::MAX_CACHE_ENTRIES {
        // Auto cleanup expired entries first
        let _ = cleanup_expired_entries(&app, &mut index);

        // If still over limit, reject
        if index.entries.len() >= limits::MAX_CACHE_ENTRIES {
            return Err(StorageError::Other(format!(
                "Cache entry limit reached ({} entries)",
                limits::MAX_CACHE_ENTRIES
            )));
        }
    }

    // SECURITY: Check total size limit
    let new_total = index.total_size + data.len() as u64;
    if new_total > limits::MAX_CACHE_TOTAL_SIZE as u64 {
        // Auto cleanup expired entries first
        let _ = cleanup_expired_entries(&app, &mut index);

        // If still over limit, reject
        if index.total_size + data.len() as u64 > limits::MAX_CACHE_TOTAL_SIZE as u64 {
            return Err(StorageError::Other(format!(
                "Cache size limit reached ({} bytes)",
                limits::MAX_CACHE_TOTAL_SIZE
            )));
        }
    }

    let filename = key_to_filename(&key);
    let data_path = data_dir.join(&filename);
    let size_bytes = data.len() as u64;
    
    // Write data
    fs::write(&data_path, &data)?;
    
    // Update index
    let now = Utc::now().timestamp_millis();
    
    // Remove old entry size from total if exists
    if let Some(old_meta) = index.entries.get(&key) {
        index.total_size = index.total_size.saturating_sub(old_meta.size_bytes);
    }
    
    index.entries.insert(key.clone(), CacheEntryMeta {
        key,
        content_type,
        size_bytes,
        timestamp: now,
        ttl,
        etag: None,
    });
    
    index.total_size += size_bytes;
    
    save_cache_index(&app, &index)?;
    
    Ok(())
}

/// Delete a cache entry
#[tauri::command]
pub async fn delete_unified_cache_entry(
    app: AppHandle,
    key: String,
) -> Result<bool, StorageError> {
    let mut index = load_cache_index(&app)?;
    
    if let Some(meta) = index.entries.remove(&key) {
        index.total_size = index.total_size.saturating_sub(meta.size_bytes);
        
        // Delete data file
        let data_dir = get_cache_data_dir(&app)?;
        let filename = key_to_filename(&key);
        let data_path = data_dir.join(&filename);
        
        if data_path.exists() {
            fs::remove_file(&data_path)?;
        }
        
        save_cache_index(&app, &index)?;
        return Ok(true);
    }
    
    Ok(false)
}

/// Clear all cache
#[tauri::command]
pub async fn clear_unified_cache(app: AppHandle) -> Result<u64, StorageError> {
    let index = load_cache_index(&app)?;
    let deleted_count = index.entries.len() as u64;
    
    // Delete data directory
    let data_dir = get_cache_data_dir(&app)?;
    if data_dir.exists() {
        fs::remove_dir_all(&data_dir)?;
        fs::create_dir_all(&data_dir)?;
    }
    
    // Reset index
    let new_index = CacheIndex::default();
    save_cache_index(&app, &new_index)?;
    
    Ok(deleted_count)
}

/// Get cache size
#[tauri::command]
pub async fn get_unified_cache_size(app: AppHandle) -> Result<u64, StorageError> {
    let index = load_cache_index(&app)?;
    Ok(index.total_size)
}

/// List all cache keys
#[tauri::command]
pub async fn list_unified_cache_keys(app: AppHandle) -> Result<Vec<String>, StorageError> {
    let index = load_cache_index(&app)?;
    Ok(index.entries.keys().cloned().collect())
}

/// Get cache statistics
#[tauri::command]
pub async fn get_unified_cache_stats(app: AppHandle) -> Result<UnifiedCacheStats, StorageError> {
    let index = load_cache_index(&app)?;
    
    let now = Utc::now().timestamp_millis();
    let mut expired_count = 0;
    let mut expired_size = 0u64;
    
    for meta in index.entries.values() {
        if meta.ttl > 0 && now > meta.timestamp + meta.ttl {
            expired_count += 1;
            expired_size += meta.size_bytes;
        }
    }
    
    Ok(UnifiedCacheStats {
        total_entries: index.entries.len(),
        total_size: index.total_size,
        expired_entries: expired_count,
        expired_size,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedCacheStats {
    pub total_entries: usize,
    pub total_size: u64,
    pub expired_entries: usize,
    pub expired_size: u64,
}

/// Internal helper to cleanup expired entries (used by put_unified_cache_entry)
fn cleanup_expired_entries(app: &AppHandle, index: &mut CacheIndex) -> Result<u64, StorageError> {
    let data_dir = get_cache_data_dir(app)?;
    let now = Utc::now().timestamp_millis();
    let mut deleted_count = 0u64;
    let mut keys_to_remove = Vec::new();

    for (key, meta) in &index.entries {
        if meta.ttl > 0 && now > meta.timestamp + meta.ttl {
            keys_to_remove.push(key.clone());
        }
    }

    for key in keys_to_remove {
        if let Some(meta) = index.entries.remove(&key) {
            index.total_size = index.total_size.saturating_sub(meta.size_bytes);
            let filename = key_to_filename(&key);
            let data_path = data_dir.join(&filename);
            if data_path.exists() {
                let _ = fs::remove_file(&data_path);
            }
            deleted_count += 1;
        }
    }

    Ok(deleted_count)
}

/// Cleanup expired entries
#[tauri::command]
pub async fn cleanup_unified_cache(app: AppHandle) -> Result<u64, StorageError> {
    let mut index = load_cache_index(&app)?;
    let data_dir = get_cache_data_dir(&app)?;
    
    let now = Utc::now().timestamp_millis();
    let mut deleted_count = 0u64;
    let mut keys_to_remove = Vec::new();
    
    for (key, meta) in &index.entries {
        if meta.ttl > 0 && now > meta.timestamp + meta.ttl {
            keys_to_remove.push(key.clone());
        }
    }
    
    for key in keys_to_remove {
        if let Some(meta) = index.entries.remove(&key) {
            index.total_size = index.total_size.saturating_sub(meta.size_bytes);
            
            let filename = key_to_filename(&key);
            let data_path = data_dir.join(&filename);
            
            if data_path.exists() {
                let _ = fs::remove_file(&data_path);
            }
            
            deleted_count += 1;
        }
    }
    
    index.last_cleanup = Some(Utc::now());
    save_cache_index(&app, &index)?;
    
    Ok(deleted_count)
}

/// Prefetch a URL and cache it using the enhanced HTTP client
#[tauri::command]
pub async fn prefetch_url(
    app: AppHandle,
    url: String,
    ttl: i64,
) -> Result<bool, StorageError> {
    log::info!("Prefetching URL: {}", url);

    // Use the enhanced HTTP client with retries and progress
    let request_id = format!("prefetch-{}", chrono::Utc::now().timestamp_millis());
    
    match http_client::http_request(
        app.clone(),
        RequestConfig {
            method: "GET".to_string(),
            url: url.clone(),
            request_id: Some(request_id),
            allow_http: false, // HTTPS only for security
            ..Default::default()
        },
    ).await {
        Ok(response) => {
            if response.status >= 200 && response.status < 300 {
                let content_type = response.content_type
                    .unwrap_or_else(|| "application/octet-stream".to_string());

                // SECURITY: Validate response size
                security::validate_size(&response.body, limits::MAX_TILE_SIZE)
                    .map_err(|e| StorageError::Other(e.to_string()))?;

                let key = url_to_cache_key(&url);
                put_unified_cache_entry(app, key, response.body, content_type, ttl).await?;
                Ok(true)
            } else {
                log::warn!("Prefetch failed with status: {}", response.status);
                Ok(false)
            }
        }
        Err(e) => {
            log::warn!("Prefetch error: {}", e);
            Ok(false)
        }
    }
}

/// Batch prefetch URLs
#[tauri::command]
pub async fn prefetch_urls(
    app: AppHandle,
    urls: Vec<String>,
    ttl: i64,
) -> Result<PrefetchResult, StorageError> {
    let mut success = 0;
    let mut failed = 0;
    
    for url in urls {
        match prefetch_url(app.clone(), url, ttl).await {
            Ok(true) => success += 1,
            _ => failed += 1,
        }
    }
    
    Ok(PrefetchResult { success, failed })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrefetchResult {
    pub success: usize,
    pub failed: usize,
}

fn url_to_cache_key(url: &str) -> String {
    url.replace("https://", "")
        .replace("http://", "")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '/' || *c == '.' || *c == '-' || *c == '_')
        .collect::<String>()
        .chars()
        .take(200)
        .collect()
}
