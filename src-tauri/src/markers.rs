//! Sky markers management module
//! Manages custom markers on the celestial sphere

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::StorageError;
use crate::utils::generate_id;

// ============================================================================
// Types
// ============================================================================

/// Marker icon type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MarkerIcon {
    Star,
    Circle,
    Crosshair,
    Pin,
    Diamond,
    Triangle,
    Square,
    Flag,
}

/// Sky marker for annotating positions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkyMarker {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub ra: f64,              // degrees
    pub dec: f64,             // degrees
    pub ra_string: String,
    pub dec_string: String,
    // Visual properties
    pub color: String,        // hex color
    pub icon: MarkerIcon,
    // Metadata
    pub created_at: i64,
    pub updated_at: i64,
    // Grouping
    pub group: Option<String>,
    // Visibility
    pub visible: bool,
}

/// Marker input for creating new markers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkerInput {
    pub name: String,
    pub description: Option<String>,
    pub ra: f64,
    pub dec: f64,
    pub ra_string: String,
    pub dec_string: String,
    pub color: String,
    pub icon: MarkerIcon,
    pub group: Option<String>,
}

/// Markers data container
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MarkersData {
    pub markers: Vec<SkyMarker>,
    pub groups: Vec<String>,
    pub show_markers: bool,
}

// ============================================================================
// Path Helpers
// ============================================================================

fn get_markers_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| StorageError::AppDataDirNotFound)?;
    
    let dir = app_data_dir.join("skymap").join("markers");
    
    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }
    
    Ok(dir.join("markers.json"))
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Load markers
#[tauri::command]
pub async fn load_markers(app: AppHandle) -> Result<MarkersData, StorageError> {
    let path = get_markers_path(&app)?;
    
    if !path.exists() {
        return Ok(MarkersData {
            markers: Vec::new(),
            groups: vec!["Default".to_string()],
            show_markers: true,
        });
    }
    
    let data = fs::read_to_string(&path)?;
    let markers_data: MarkersData = serde_json::from_str(&data)?;
    
    Ok(markers_data)
}

/// Save markers
#[tauri::command]
pub async fn save_markers(
    app: AppHandle,
    markers_data: MarkersData,
) -> Result<(), StorageError> {
    let path = get_markers_path(&app)?;
    let json = serde_json::to_string_pretty(&markers_data)?;
    fs::write(&path, json)?;
    
    log::info!("Saved markers to {:?}", path);
    Ok(())
}

/// Add a marker
#[tauri::command]
pub async fn add_marker(
    app: AppHandle,
    marker: MarkerInput,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    let now = Utc::now().timestamp_millis();
    let new_marker = SkyMarker {
        id: generate_id("marker"),
        name: marker.name,
        description: marker.description,
        ra: marker.ra,
        dec: marker.dec,
        ra_string: marker.ra_string,
        dec_string: marker.dec_string,
        color: marker.color,
        icon: marker.icon,
        created_at: now,
        updated_at: now,
        group: marker.group.clone(),
        visible: true,
    };
    
    // Add group if not present
    if let Some(ref group) = new_marker.group {
        if !data.groups.contains(group) {
            data.groups.push(group.clone());
        }
    }
    
    data.markers.push(new_marker);
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Update a marker
#[tauri::command]
pub async fn update_marker(
    app: AppHandle,
    marker_id: String,
    updates: serde_json::Value,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    if let Some(marker) = data.markers.iter_mut().find(|m| m.id == marker_id) {
        if let Some(name) = updates.get("name").and_then(|v| v.as_str()) {
            marker.name = name.to_string();
        }
        if let Some(description) = updates.get("description").and_then(|v| v.as_str()) {
            marker.description = Some(description.to_string());
        }
        if let Some(color) = updates.get("color").and_then(|v| v.as_str()) {
            marker.color = color.to_string();
        }
        if let Some(group) = updates.get("group").and_then(|v| v.as_str()) {
            marker.group = Some(group.to_string());
            if !data.groups.contains(&group.to_string()) {
                data.groups.push(group.to_string());
            }
        }
        if let Some(visible) = updates.get("visible").and_then(|v| v.as_bool()) {
            marker.visible = visible;
        }
        marker.updated_at = Utc::now().timestamp_millis();
    }
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Remove a marker
#[tauri::command]
pub async fn remove_marker(
    app: AppHandle,
    marker_id: String,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    data.markers.retain(|m| m.id != marker_id);
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Remove markers by group
#[tauri::command]
pub async fn remove_markers_by_group(
    app: AppHandle,
    group: String,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    data.markers.retain(|m| m.group.as_ref() != Some(&group));
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Clear all markers
#[tauri::command]
pub async fn clear_all_markers(
    app: AppHandle,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    data.markers.clear();
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Toggle marker visibility
#[tauri::command]
pub async fn toggle_marker_visibility(
    app: AppHandle,
    marker_id: String,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    if let Some(marker) = data.markers.iter_mut().find(|m| m.id == marker_id) {
        marker.visible = !marker.visible;
    }
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Set all markers visible/hidden
#[tauri::command]
pub async fn set_all_markers_visible(
    app: AppHandle,
    visible: bool,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    for marker in &mut data.markers {
        marker.visible = visible;
    }
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Set show markers flag
#[tauri::command]
pub async fn set_show_markers(
    app: AppHandle,
    show: bool,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    data.show_markers = show;
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Add a marker group
#[tauri::command]
pub async fn add_marker_group(
    app: AppHandle,
    group: String,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    if !data.groups.contains(&group) {
        data.groups.push(group);
    }
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Remove a marker group
#[tauri::command]
pub async fn remove_marker_group(
    app: AppHandle,
    group: String,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    data.groups.retain(|g| g != &group);
    
    // Move markers in this group to "Default"
    for marker in &mut data.markers {
        if marker.group.as_ref() == Some(&group) {
            marker.group = Some("Default".to_string());
        }
    }
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Rename a marker group
#[tauri::command]
pub async fn rename_marker_group(
    app: AppHandle,
    old_name: String,
    new_name: String,
) -> Result<MarkersData, StorageError> {
    let mut data = load_markers(app.clone()).await?;
    
    // Update group name
    if let Some(group) = data.groups.iter_mut().find(|g| *g == &old_name) {
        *group = new_name.clone();
    }
    
    // Update markers
    for marker in &mut data.markers {
        if marker.group.as_ref() == Some(&old_name) {
            marker.group = Some(new_name.clone());
        }
    }
    
    save_markers(app, data.clone()).await?;
    
    Ok(data)
}

/// Get visible markers
#[tauri::command]
pub async fn get_visible_markers(
    app: AppHandle,
) -> Result<Vec<SkyMarker>, StorageError> {
    let data = load_markers(app).await?;
    
    if !data.show_markers {
        return Ok(Vec::new());
    }
    
    let visible: Vec<SkyMarker> = data.markers.into_iter()
        .filter(|m| m.visible)
        .collect();
    
    Ok(visible)
}

