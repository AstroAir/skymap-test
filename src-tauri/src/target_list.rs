//! Target list management module
//! Manages observation target lists with persistence

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::StorageError;

// ============================================================================
// Types
// ============================================================================

/// Observable window for a target
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObservableWindow {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
    pub max_altitude: f64,
    pub transit_time: DateTime<Utc>,
    pub is_circumpolar: bool,
}

/// Target priority
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TargetPriority {
    Low,
    Medium,
    High,
}

/// Target status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TargetStatus {
    Planned,
    InProgress,
    Completed,
}

/// Mosaic settings for a target
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MosaicSettings {
    pub enabled: bool,
    pub rows: u32,
    pub cols: u32,
    pub overlap: f64,
}

/// Exposure plan for a target
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExposurePlan {
    pub single_exposure: f64,  // seconds
    pub total_exposure: f64,   // minutes
    pub sub_frames: u32,
    pub filter: Option<String>,
}

/// Target item for shot planning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetItem {
    pub id: String,
    pub name: String,
    pub ra: f64,              // degrees
    pub dec: f64,             // degrees
    pub ra_string: String,
    pub dec_string: String,
    // Camera/FOV settings at time of adding
    pub sensor_width: Option<f64>,
    pub sensor_height: Option<f64>,
    pub focal_length: Option<f64>,
    pub rotation_angle: Option<f64>,
    // Mosaic settings
    pub mosaic: Option<MosaicSettings>,
    // Exposure plan
    pub exposure_plan: Option<ExposurePlan>,
    // Notes
    pub notes: Option<String>,
    // Timestamps
    pub added_at: i64,
    pub priority: TargetPriority,
    pub status: TargetStatus,
    // Tags for grouping
    pub tags: Vec<String>,
    // Cached observable window
    pub observable_window: Option<ObservableWindow>,
    // Favorite/archived flags
    pub is_favorite: bool,
    pub is_archived: bool,
}

/// Target list data
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TargetListData {
    pub targets: Vec<TargetItem>,
    pub available_tags: Vec<String>,
    pub active_target_id: Option<String>,
}

/// Target input for adding new targets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetInput {
    pub name: String,
    pub ra: f64,
    pub dec: f64,
    pub ra_string: String,
    pub dec_string: String,
    pub sensor_width: Option<f64>,
    pub sensor_height: Option<f64>,
    pub focal_length: Option<f64>,
    pub rotation_angle: Option<f64>,
    pub mosaic: Option<MosaicSettings>,
    pub exposure_plan: Option<ExposurePlan>,
    pub notes: Option<String>,
    pub priority: Option<TargetPriority>,
    pub tags: Option<Vec<String>>,
}

/// Batch target input
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchTargetInput {
    pub name: String,
    pub ra: f64,
    pub dec: f64,
    pub ra_string: String,
    pub dec_string: String,
}

// ============================================================================
// Path Helpers
// ============================================================================

fn get_target_list_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| StorageError::AppDataDirNotFound)?;
    
    let dir = app_data_dir.join("skymap").join("targets");
    
    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }
    
    Ok(dir.join("target_list.json"))
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Load target list
#[tauri::command]
pub async fn load_target_list(app: AppHandle) -> Result<TargetListData, StorageError> {
    let path = get_target_list_path(&app)?;
    
    if !path.exists() {
        return Ok(TargetListData {
            targets: Vec::new(),
            available_tags: vec![
                "galaxy".to_string(),
                "nebula".to_string(),
                "cluster".to_string(),
                "planetary".to_string(),
                "tonight".to_string(),
                "priority".to_string(),
            ],
            active_target_id: None,
        });
    }
    
    let data = fs::read_to_string(&path)?;
    let target_list: TargetListData = serde_json::from_str(&data)?;
    
    Ok(target_list)
}

/// Save target list
#[tauri::command]
pub async fn save_target_list(
    app: AppHandle,
    target_list: TargetListData,
) -> Result<(), StorageError> {
    let path = get_target_list_path(&app)?;
    let json = serde_json::to_string_pretty(&target_list)?;
    fs::write(&path, json)?;
    
    log::info!("Saved target list to {:?}", path);
    Ok(())
}

/// Add a target
#[tauri::command]
pub async fn add_target(
    app: AppHandle,
    target: TargetInput,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    let new_target = TargetItem {
        id: format!("target-{}", uuid_simple()),
        name: target.name,
        ra: target.ra,
        dec: target.dec,
        ra_string: target.ra_string,
        dec_string: target.dec_string,
        sensor_width: target.sensor_width,
        sensor_height: target.sensor_height,
        focal_length: target.focal_length,
        rotation_angle: target.rotation_angle,
        mosaic: target.mosaic,
        exposure_plan: target.exposure_plan,
        notes: target.notes,
        added_at: Utc::now().timestamp_millis(),
        priority: target.priority.unwrap_or(TargetPriority::Medium),
        status: TargetStatus::Planned,
        tags: target.tags.unwrap_or_default(),
        observable_window: None,
        is_favorite: false,
        is_archived: false,
    };
    
    data.targets.push(new_target);
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Add multiple targets in batch
#[tauri::command]
pub async fn add_targets_batch(
    app: AppHandle,
    targets: Vec<BatchTargetInput>,
    default_priority: Option<TargetPriority>,
    default_tags: Option<Vec<String>>,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    for target in targets {
        let new_target = TargetItem {
            id: format!("target-{}", uuid_simple()),
            name: target.name,
            ra: target.ra,
            dec: target.dec,
            ra_string: target.ra_string,
            dec_string: target.dec_string,
            sensor_width: None,
            sensor_height: None,
            focal_length: None,
            rotation_angle: None,
            mosaic: None,
            exposure_plan: None,
            notes: None,
            added_at: Utc::now().timestamp_millis(),
            priority: default_priority.clone().unwrap_or(TargetPriority::Medium),
            status: TargetStatus::Planned,
            tags: default_tags.clone().unwrap_or_default(),
            observable_window: None,
            is_favorite: false,
            is_archived: false,
        };
        data.targets.push(new_target);
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Update a target
#[tauri::command]
pub async fn update_target(
    app: AppHandle,
    target_id: String,
    updates: serde_json::Value,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    if let Some(target) = data.targets.iter_mut().find(|t| t.id == target_id) {
        // Apply updates from JSON
        if let Some(name) = updates.get("name").and_then(|v| v.as_str()) {
            target.name = name.to_string();
        }
        if let Some(notes) = updates.get("notes").and_then(|v| v.as_str()) {
            target.notes = Some(notes.to_string());
        }
        if let Some(priority) = updates.get("priority").and_then(|v| v.as_str()) {
            target.priority = match priority {
                "low" => TargetPriority::Low,
                "high" => TargetPriority::High,
                _ => TargetPriority::Medium,
            };
        }
        if let Some(status) = updates.get("status").and_then(|v| v.as_str()) {
            target.status = match status {
                "in_progress" => TargetStatus::InProgress,
                "completed" => TargetStatus::Completed,
                _ => TargetStatus::Planned,
            };
        }
        if let Some(is_favorite) = updates.get("is_favorite").and_then(|v| v.as_bool()) {
            target.is_favorite = is_favorite;
        }
        if let Some(is_archived) = updates.get("is_archived").and_then(|v| v.as_bool()) {
            target.is_archived = is_archived;
        }
        if let Some(tags) = updates.get("tags").and_then(|v| v.as_array()) {
            target.tags = tags.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect();
        }
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Remove a target
#[tauri::command]
pub async fn remove_target(
    app: AppHandle,
    target_id: String,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    data.targets.retain(|t| t.id != target_id);
    
    if data.active_target_id.as_ref() == Some(&target_id) {
        data.active_target_id = None;
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Remove multiple targets
#[tauri::command]
pub async fn remove_targets_batch(
    app: AppHandle,
    target_ids: Vec<String>,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    let ids_set: std::collections::HashSet<_> = target_ids.iter().collect();
    data.targets.retain(|t| !ids_set.contains(&t.id));
    
    if let Some(ref active_id) = data.active_target_id {
        if ids_set.contains(active_id) {
            data.active_target_id = None;
        }
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Set active target
#[tauri::command]
pub async fn set_active_target(
    app: AppHandle,
    target_id: Option<String>,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    data.active_target_id = target_id;
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Toggle target favorite status
#[tauri::command]
pub async fn toggle_target_favorite(
    app: AppHandle,
    target_id: String,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    if let Some(target) = data.targets.iter_mut().find(|t| t.id == target_id) {
        target.is_favorite = !target.is_favorite;
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Toggle target archive status
#[tauri::command]
pub async fn toggle_target_archive(
    app: AppHandle,
    target_id: String,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    if let Some(target) = data.targets.iter_mut().find(|t| t.id == target_id) {
        target.is_archived = !target.is_archived;
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Set status for multiple targets
#[tauri::command]
pub async fn set_targets_status_batch(
    app: AppHandle,
    target_ids: Vec<String>,
    status: String,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    let ids_set: std::collections::HashSet<_> = target_ids.iter().collect();
    let new_status = match status.as_str() {
        "in_progress" => TargetStatus::InProgress,
        "completed" => TargetStatus::Completed,
        _ => TargetStatus::Planned,
    };
    
    for target in &mut data.targets {
        if ids_set.contains(&target.id) {
            target.status = new_status.clone();
        }
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Set priority for multiple targets
#[tauri::command]
pub async fn set_targets_priority_batch(
    app: AppHandle,
    target_ids: Vec<String>,
    priority: String,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    let ids_set: std::collections::HashSet<_> = target_ids.iter().collect();
    let new_priority = match priority.as_str() {
        "low" => TargetPriority::Low,
        "high" => TargetPriority::High,
        _ => TargetPriority::Medium,
    };
    
    for target in &mut data.targets {
        if ids_set.contains(&target.id) {
            target.priority = new_priority.clone();
        }
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Add tag to multiple targets
#[tauri::command]
pub async fn add_tag_to_targets(
    app: AppHandle,
    target_ids: Vec<String>,
    tag: String,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    let ids_set: std::collections::HashSet<_> = target_ids.iter().collect();
    
    for target in &mut data.targets {
        if ids_set.contains(&target.id) && !target.tags.contains(&tag) {
            target.tags.push(tag.clone());
        }
    }
    
    // Add to available tags if not present
    if !data.available_tags.contains(&tag) {
        data.available_tags.push(tag);
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Remove tag from multiple targets
#[tauri::command]
pub async fn remove_tag_from_targets(
    app: AppHandle,
    target_ids: Vec<String>,
    tag: String,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    let ids_set: std::collections::HashSet<_> = target_ids.iter().collect();
    
    for target in &mut data.targets {
        if ids_set.contains(&target.id) {
            target.tags.retain(|t| t != &tag);
        }
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Archive all completed targets
#[tauri::command]
pub async fn archive_completed_targets(
    app: AppHandle,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    for target in &mut data.targets {
        if matches!(target.status, TargetStatus::Completed) {
            target.is_archived = true;
        }
    }
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Clear all completed targets
#[tauri::command]
pub async fn clear_completed_targets(
    app: AppHandle,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    data.targets.retain(|t| !matches!(t.status, TargetStatus::Completed));
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Clear all targets
#[tauri::command]
pub async fn clear_all_targets(
    app: AppHandle,
) -> Result<TargetListData, StorageError> {
    let mut data = load_target_list(app.clone()).await?;
    
    data.targets.clear();
    data.active_target_id = None;
    
    save_target_list(app, data.clone()).await?;
    
    Ok(data)
}

/// Search targets
#[tauri::command]
pub async fn search_targets(
    app: AppHandle,
    query: String,
) -> Result<Vec<TargetItem>, StorageError> {
    let data = load_target_list(app).await?;
    let query_lower = query.to_lowercase();
    
    let results: Vec<TargetItem> = data.targets.into_iter()
        .filter(|t| {
            t.name.to_lowercase().contains(&query_lower) ||
            t.notes.as_ref().map(|n| n.to_lowercase().contains(&query_lower)).unwrap_or(false) ||
            t.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
        })
        .collect();
    
    Ok(results)
}

/// Get target statistics
#[tauri::command]
pub async fn get_target_stats(
    app: AppHandle,
) -> Result<TargetStats, StorageError> {
    let data = load_target_list(app).await?;
    
    let total = data.targets.len();
    let planned = data.targets.iter().filter(|t| matches!(t.status, TargetStatus::Planned)).count();
    let in_progress = data.targets.iter().filter(|t| matches!(t.status, TargetStatus::InProgress)).count();
    let completed = data.targets.iter().filter(|t| matches!(t.status, TargetStatus::Completed)).count();
    let favorites = data.targets.iter().filter(|t| t.is_favorite).count();
    let archived = data.targets.iter().filter(|t| t.is_archived).count();
    
    // Count by priority
    let high_priority = data.targets.iter().filter(|t| matches!(t.priority, TargetPriority::High)).count();
    let medium_priority = data.targets.iter().filter(|t| matches!(t.priority, TargetPriority::Medium)).count();
    let low_priority = data.targets.iter().filter(|t| matches!(t.priority, TargetPriority::Low)).count();
    
    // Count by tags
    let mut tag_counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for target in &data.targets {
        for tag in &target.tags {
            *tag_counts.entry(tag.clone()).or_insert(0) += 1;
        }
    }
    
    Ok(TargetStats {
        total,
        planned,
        in_progress,
        completed,
        favorites,
        archived,
        high_priority,
        medium_priority,
        low_priority,
        by_tag: tag_counts.into_iter().collect(),
    })
}

/// Target statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetStats {
    pub total: usize,
    pub planned: usize,
    pub in_progress: usize,
    pub completed: usize,
    pub favorites: usize,
    pub archived: usize,
    pub high_priority: usize,
    pub medium_priority: usize,
    pub low_priority: usize,
    pub by_tag: Vec<(String, usize)>,
}

// ============================================================================
// Helper Functions
// ============================================================================

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let random: u32 = rand_simple();
    format!("{:x}{:08x}", timestamp, random)
}

fn rand_simple() -> u32 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    nanos.wrapping_mul(1103515245).wrapping_add(12345)
}
