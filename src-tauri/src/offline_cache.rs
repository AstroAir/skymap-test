//! Offline cache management module
//! Manages tile caching for offline use in the desktop application

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::security::limits;
use crate::storage::StorageError;
use crate::utils::generate_id;

// ============================================================================
// Types
// ============================================================================

/// Cache region definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheRegion {
    pub id: String,
    pub name: String,
    pub center_ra: f64,
    pub center_dec: f64,
    pub radius_deg: f64,
    pub min_zoom: u8,
    pub max_zoom: u8,
    pub survey_id: String,
    pub tile_count: u64,
    pub size_bytes: u64,
    pub status: CacheStatus,
    pub progress: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Cache status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CacheStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

/// Cache statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_regions: usize,
    pub total_tiles: u64,
    pub total_size_bytes: u64,
    pub completed_regions: usize,
    pub surveys: Vec<SurveyCacheInfo>,
}

/// Per-survey cache info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurveyCacheInfo {
    pub survey_id: String,
    pub tile_count: u64,
    pub size_bytes: u64,
}

/// Tile metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TileMetadata {
    pub survey_id: String,
    pub zoom: u8,
    pub x: u64,
    pub y: u64,
    pub size_bytes: u64,
    pub cached_at: DateTime<Utc>,
}

/// Cache data container
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CacheData {
    pub regions: Vec<CacheRegion>,
    pub tiles: HashMap<String, TileMetadata>,
}

// ============================================================================
// Path Helpers
// ============================================================================

fn get_cache_dir(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| StorageError::AppDataDirNotFound)?;

    let cache_dir = app_data_dir.join("skymap").join("cache");

    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir)?;
    }

    Ok(cache_dir)
}

fn get_cache_meta_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let cache_dir = get_cache_dir(app)?;
    Ok(cache_dir.join("cache_meta.json"))
}

fn get_tiles_dir(app: &AppHandle, survey_id: &str) -> Result<PathBuf, StorageError> {
    let cache_dir = get_cache_dir(app)?;
    let tiles_dir = cache_dir.join("tiles").join(survey_id);

    if !tiles_dir.exists() {
        fs::create_dir_all(&tiles_dir)?;
    }

    Ok(tiles_dir)
}

fn get_tile_path(
    app: &AppHandle,
    survey_id: &str,
    zoom: u8,
    x: u64,
    y: u64,
) -> Result<PathBuf, StorageError> {
    let tiles_dir = get_tiles_dir(app, survey_id)?;
    let zoom_dir = tiles_dir.join(zoom.to_string());

    if !zoom_dir.exists() {
        fs::create_dir_all(&zoom_dir)?;
    }

    Ok(zoom_dir.join(format!("{}_{}.jpg", x, y)))
}

// ============================================================================
// Cache Data Management
// ============================================================================

fn load_cache_data(app: &AppHandle) -> Result<CacheData, StorageError> {
    let path = get_cache_meta_path(app)?;

    if !path.exists() {
        return Ok(CacheData::default());
    }

    let data = fs::read_to_string(&path)?;
    let cache_data: CacheData = serde_json::from_str(&data)?;

    Ok(cache_data)
}

fn save_cache_data(app: &AppHandle, data: &CacheData) -> Result<(), StorageError> {
    let path = get_cache_meta_path(app)?;
    let json = serde_json::to_string_pretty(data)?;
    fs::write(&path, json)?;
    Ok(())
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Get cache statistics
#[tauri::command]
pub async fn get_cache_stats(app: AppHandle) -> Result<CacheStats, StorageError> {
    let data = load_cache_data(&app)?;

    let total_regions = data.regions.len();
    let completed_regions = data
        .regions
        .iter()
        .filter(|r| r.status == CacheStatus::Completed)
        .count();

    let total_tiles: u64 = data.regions.iter().map(|r| r.tile_count).sum();
    let total_size_bytes: u64 = data.regions.iter().map(|r| r.size_bytes).sum();

    // Group by survey
    let mut survey_map: HashMap<String, (u64, u64)> = HashMap::new();
    for region in &data.regions {
        let entry = survey_map.entry(region.survey_id.clone()).or_insert((0, 0));
        entry.0 += region.tile_count;
        entry.1 += region.size_bytes;
    }

    let surveys: Vec<SurveyCacheInfo> = survey_map
        .into_iter()
        .map(|(survey_id, (tile_count, size_bytes))| SurveyCacheInfo {
            survey_id,
            tile_count,
            size_bytes,
        })
        .collect();

    Ok(CacheStats {
        total_regions,
        total_tiles,
        total_size_bytes,
        completed_regions,
        surveys,
    })
}

/// List all cache regions
#[tauri::command]
pub async fn list_cache_regions(app: AppHandle) -> Result<Vec<CacheRegion>, StorageError> {
    let data = load_cache_data(&app)?;
    Ok(data.regions)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRegionArgs {
    pub name: String,
    pub center_ra: f64,
    pub center_dec: f64,
    pub radius_deg: f64,
    pub min_zoom: u8,
    pub max_zoom: u8,
    pub survey_id: String,
}

/// Create a new cache region
#[tauri::command]
pub async fn create_cache_region(
    app: AppHandle,
    args: CreateRegionArgs,
) -> Result<CacheRegion, StorageError> {
    let mut data = load_cache_data(&app)?;

    // Estimate tile count (simplified)
    let tile_count = estimate_tile_count(args.radius_deg, args.min_zoom, args.max_zoom);

    let region = CacheRegion {
        id: generate_id("region"),
        name: args.name,
        center_ra: args.center_ra,
        center_dec: args.center_dec,
        radius_deg: args.radius_deg,
        min_zoom: args.min_zoom,
        max_zoom: args.max_zoom,
        survey_id: args.survey_id,
        tile_count,
        size_bytes: 0,
        status: CacheStatus::Pending,
        progress: 0.0,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    data.regions.push(region.clone());
    save_cache_data(&app, &data)?;

    Ok(region)
}

/// Update cache region status
#[tauri::command]
pub async fn update_cache_region(
    app: AppHandle,
    region_id: String,
    status: Option<CacheStatus>,
    progress: Option<f64>,
    size_bytes: Option<u64>,
) -> Result<CacheRegion, StorageError> {
    let mut data = load_cache_data(&app)?;

    let region = data
        .regions
        .iter_mut()
        .find(|r| r.id == region_id)
        .ok_or_else(|| StorageError::StoreNotFound(region_id.clone()))?;

    if let Some(s) = status {
        region.status = s;
    }
    if let Some(p) = progress {
        region.progress = p;
    }
    if let Some(size) = size_bytes {
        region.size_bytes = size;
    }
    region.updated_at = Utc::now();

    let result = region.clone();
    save_cache_data(&app, &data)?;

    Ok(result)
}

/// Delete a cache region
#[tauri::command]
pub async fn delete_cache_region(
    app: AppHandle,
    region_id: String,
    delete_tiles: bool,
) -> Result<(), StorageError> {
    let mut data = load_cache_data(&app)?;

    // Find region
    let region = data.regions.iter().find(|r| r.id == region_id).cloned();

    if let Some(region) = region {
        // Remove from list
        data.regions.retain(|r| r.id != region_id);

        // Optionally delete tiles
        if delete_tiles {
            // Remove tiles for this region from metadata
            let prefix = format!("{}_", region.survey_id);
            data.tiles.retain(|k, _| !k.starts_with(&prefix));

            // Note: actual file deletion would require tracking which tiles belong to which region
            // For simplicity, we just remove metadata
        }

        save_cache_data(&app, &data)?;
    }

    Ok(())
}

/// Save a tile to cache
#[tauri::command]
pub async fn save_cached_tile(
    app: AppHandle,
    survey_id: String,
    zoom: u8,
    x: u64,
    y: u64,
    data: Vec<u8>,
) -> Result<(), StorageError> {
    // SECURITY: Validate tile size to prevent DoS attacks
    crate::security::validate_size(&data, crate::security::limits::MAX_TILE_SIZE)
        .map_err(|e| StorageError::Other(e.to_string()))?;

    // SECURITY: Check total cache size limit
    let cache_data = load_cache_data(&app)?;
    let current_total: u64 = cache_data.tiles.values().map(|t| t.size_bytes).sum();
    let new_total = current_total + data.len() as u64;

    if new_total > limits::MAX_CACHE_TOTAL_SIZE as u64 {
        return Err(StorageError::Other(format!(
            "Offline cache size limit reached ({} bytes)",
            limits::MAX_CACHE_TOTAL_SIZE
        )));
    }

    let tile_path = get_tile_path(&app, &survey_id, zoom, x, y)?;
    fs::write(&tile_path, &data)?;

    // Update metadata
    let mut cache_data = load_cache_data(&app)?;
    let tile_key = format!("{}_{}_{}_{}", survey_id, zoom, x, y);

    cache_data.tiles.insert(
        tile_key,
        TileMetadata {
            survey_id,
            zoom,
            x,
            y,
            size_bytes: data.len() as u64,
            cached_at: Utc::now(),
        },
    );

    save_cache_data(&app, &cache_data)?;

    Ok(())
}

/// Load a tile from cache
#[tauri::command]
pub async fn load_cached_tile(
    app: AppHandle,
    survey_id: String,
    zoom: u8,
    x: u64,
    y: u64,
) -> Result<Option<Vec<u8>>, StorageError> {
    let tile_path = get_tile_path(&app, &survey_id, zoom, x, y)?;

    if tile_path.exists() {
        let data = fs::read(&tile_path)?;
        return Ok(Some(data));
    }

    Ok(None)
}

/// Check if a tile is cached
#[tauri::command]
pub async fn is_tile_cached(
    app: AppHandle,
    survey_id: String,
    zoom: u8,
    x: u64,
    y: u64,
) -> Result<bool, StorageError> {
    let tile_path = get_tile_path(&app, &survey_id, zoom, x, y)?;
    Ok(tile_path.exists())
}

/// Clear all cached tiles for a survey
#[tauri::command]
pub async fn clear_survey_cache(app: AppHandle, survey_id: String) -> Result<u64, StorageError> {
    let tiles_dir = get_tiles_dir(&app, &survey_id)?;

    let mut deleted_count = 0u64;

    if tiles_dir.exists() {
        deleted_count = count_files_recursive(&tiles_dir)?;
        fs::remove_dir_all(&tiles_dir)?;
    }

    // Update metadata
    let mut cache_data = load_cache_data(&app)?;
    cache_data.tiles.retain(|_, v| v.survey_id != survey_id);
    cache_data.regions.retain(|r| r.survey_id != survey_id);
    save_cache_data(&app, &cache_data)?;

    Ok(deleted_count)
}

/// Clear all cached data
#[tauri::command]
pub async fn clear_all_cache(app: AppHandle) -> Result<u64, StorageError> {
    let cache_dir = get_cache_dir(&app)?;
    let tiles_dir = cache_dir.join("tiles");

    let mut deleted_count = 0u64;

    if tiles_dir.exists() {
        deleted_count = count_files_recursive(&tiles_dir)?;
        fs::remove_dir_all(&tiles_dir)?;
    }

    // Clear metadata
    let cache_data = CacheData::default();
    save_cache_data(&app, &cache_data)?;

    Ok(deleted_count)
}

/// Get cache directory path
#[tauri::command]
pub async fn get_cache_directory(app: AppHandle) -> Result<String, StorageError> {
    let cache_dir = get_cache_dir(&app)?;
    Ok(cache_dir.to_string_lossy().to_string())
}

// ============================================================================
// Helper Functions
// ============================================================================

fn estimate_tile_count(radius_deg: f64, min_zoom: u8, max_zoom: u8) -> u64 {
    let mut total = 0u64;

    for zoom in min_zoom..=max_zoom {
        // Tiles per degree at this zoom level
        let tiles_per_deg = 2f64.powi(zoom as i32) / 360.0;
        let tiles_in_radius = (radius_deg * tiles_per_deg).ceil() as u64;
        let tiles_at_zoom = tiles_in_radius * tiles_in_radius * 4; // Approximate square area
        total += tiles_at_zoom;
    }

    total
}

fn count_files_recursive(dir: &PathBuf) -> Result<u64, StorageError> {
    let mut count = 0u64;

    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                count += count_files_recursive(&path)?;
            } else {
                count += 1;
            }
        }
    }

    Ok(count)
}
