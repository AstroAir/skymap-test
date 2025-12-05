//! Equipment management module
//! Manages telescope, camera, eyepiece, and filter configurations

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::StorageError;

// ============================================================================
// Types
// ============================================================================

/// Telescope configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Telescope {
    pub id: String,
    pub name: String,
    pub aperture: f64,       // mm
    pub focal_length: f64,   // mm
    pub focal_ratio: f64,
    pub telescope_type: TelescopeType,
    pub mount_type: Option<String>,
    pub notes: Option<String>,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TelescopeType {
    Refractor,
    Reflector,
    Catadioptric,
    Other,
}

/// Camera/sensor configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Camera {
    pub id: String,
    pub name: String,
    pub sensor_width: f64,   // mm
    pub sensor_height: f64,  // mm
    pub pixel_size: f64,     // μm
    pub resolution_x: u32,   // pixels
    pub resolution_y: u32,   // pixels
    pub camera_type: CameraType,
    pub has_cooler: bool,
    pub notes: Option<String>,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CameraType {
    Cmos,
    Ccd,
    Dslr,
    Mirrorless,
    Webcam,
    Other,
}

/// Eyepiece configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Eyepiece {
    pub id: String,
    pub name: String,
    pub focal_length: f64,   // mm
    pub apparent_fov: f64,   // degrees
    pub barrel_size: f64,    // inches (1.25, 2, etc.)
    pub eye_relief: Option<f64>, // mm
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Barlow/reducer configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BarlowReducer {
    pub id: String,
    pub name: String,
    pub factor: f64,         // 2x, 0.63x, etc.
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Filter configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Filter {
    pub id: String,
    pub name: String,
    pub filter_type: FilterType,
    pub bandwidth: Option<f64>, // nm for narrowband
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FilterType {
    Luminance,
    Red,
    Green,
    Blue,
    Ha,
    Oiii,
    Sii,
    UhcLps,
    Cls,
    Other,
}

/// All equipment data
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EquipmentData {
    pub telescopes: Vec<Telescope>,
    pub cameras: Vec<Camera>,
    pub eyepieces: Vec<Eyepiece>,
    pub barlow_reducers: Vec<BarlowReducer>,
    pub filters: Vec<Filter>,
}

// ============================================================================
// Path Helpers
// ============================================================================

fn get_equipment_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| StorageError::AppDataDirNotFound)?;
    
    let equipment_dir = app_data_dir.join("skymap").join("equipment");
    
    if !equipment_dir.exists() {
        fs::create_dir_all(&equipment_dir)?;
    }
    
    Ok(equipment_dir.join("equipment.json"))
}

/// Load all equipment data
#[tauri::command]
pub async fn load_equipment(app: AppHandle) -> Result<EquipmentData, StorageError> {
    let path = get_equipment_path(&app)?;
    
    if !path.exists() {
        return Ok(EquipmentData::default());
    }
    
    let data = fs::read_to_string(&path)?;
    let equipment: EquipmentData = serde_json::from_str(&data)?;
    
    Ok(equipment)
}

/// Save all equipment data
#[tauri::command]
pub async fn save_equipment(
    app: AppHandle,
    equipment: EquipmentData,
) -> Result<(), StorageError> {
    let path = get_equipment_path(&app)?;
    let json = serde_json::to_string_pretty(&equipment)?;
    fs::write(&path, json)?;
    
    log::info!("Saved equipment data to {:?}", path);
    Ok(())
}

/// Add a telescope
#[tauri::command]
pub async fn add_telescope(
    app: AppHandle,
    mut telescope: Telescope,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    telescope.id = format!("telescope-{}", uuid_simple());
    telescope.created_at = Utc::now();
    telescope.updated_at = Utc::now();
    
    // If this is the first telescope or marked as default, set it as default
    if equipment.telescopes.is_empty() || telescope.is_default {
        for t in &mut equipment.telescopes {
            t.is_default = false;
        }
        telescope.is_default = true;
    }
    
    equipment.telescopes.push(telescope);
    save_equipment(app, equipment.clone()).await?;
    
    Ok(equipment)
}

/// Add a camera
#[tauri::command]
pub async fn add_camera(
    app: AppHandle,
    mut camera: Camera,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    camera.id = format!("camera-{}", uuid_simple());
    camera.created_at = Utc::now();
    camera.updated_at = Utc::now();
    
    if equipment.cameras.is_empty() || camera.is_default {
        for c in &mut equipment.cameras {
            c.is_default = false;
        }
        camera.is_default = true;
    }
    
    equipment.cameras.push(camera);
    save_equipment(app, equipment.clone()).await?;
    
    Ok(equipment)
}

/// Add an eyepiece
#[tauri::command]
pub async fn add_eyepiece(
    app: AppHandle,
    mut eyepiece: Eyepiece,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    eyepiece.id = format!("eyepiece-{}", uuid_simple());
    eyepiece.created_at = Utc::now();
    eyepiece.updated_at = Utc::now();
    
    equipment.eyepieces.push(eyepiece);
    save_equipment(app, equipment.clone()).await?;
    
    Ok(equipment)
}

/// Delete equipment by ID
#[tauri::command]
pub async fn delete_equipment(
    app: AppHandle,
    equipment_id: String,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    equipment.telescopes.retain(|t| t.id != equipment_id);
    equipment.cameras.retain(|c| c.id != equipment_id);
    equipment.eyepieces.retain(|e| e.id != equipment_id);
    equipment.barlow_reducers.retain(|b| b.id != equipment_id);
    equipment.filters.retain(|f| f.id != equipment_id);
    
    save_equipment(app, equipment.clone()).await?;
    
    Ok(equipment)
}

/// Generate a simple UUID-like string
fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let random: u32 = rand_simple();
    format!("{:x}{:08x}", timestamp, random)
}

/// Simple random number generator (no external dependency)
fn rand_simple() -> u32 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    nanos.wrapping_mul(1103515245).wrapping_add(12345)
}

// ============================================================================
// Additional Equipment Commands
// ============================================================================

/// Add a barlow/reducer
#[tauri::command]
pub async fn add_barlow_reducer(
    app: AppHandle,
    mut barlow: BarlowReducer,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    barlow.id = format!("barlow-{}", uuid_simple());
    barlow.created_at = Utc::now();
    barlow.updated_at = Utc::now();
    
    equipment.barlow_reducers.push(barlow);
    save_equipment(app, equipment.clone()).await?;
    
    Ok(equipment)
}

/// Add a filter
#[tauri::command]
pub async fn add_filter(
    app: AppHandle,
    mut filter: Filter,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    filter.id = format!("filter-{}", uuid_simple());
    filter.created_at = Utc::now();
    filter.updated_at = Utc::now();
    
    equipment.filters.push(filter);
    save_equipment(app, equipment.clone()).await?;
    
    Ok(equipment)
}

/// Update a telescope
#[tauri::command]
pub async fn update_telescope(
    app: AppHandle,
    telescope: Telescope,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    if let Some(existing) = equipment.telescopes.iter_mut().find(|t| t.id == telescope.id) {
        existing.name = telescope.name;
        existing.aperture = telescope.aperture;
        existing.focal_length = telescope.focal_length;
        existing.focal_ratio = telescope.focal_ratio;
        existing.telescope_type = telescope.telescope_type;
        existing.mount_type = telescope.mount_type;
        existing.notes = telescope.notes;
        existing.updated_at = Utc::now();
        
        if telescope.is_default {
            for t in &mut equipment.telescopes {
                t.is_default = t.id == telescope.id;
            }
        }
    }
    
    save_equipment(app, equipment.clone()).await?;
    Ok(equipment)
}

/// Update a camera
#[tauri::command]
pub async fn update_camera(
    app: AppHandle,
    camera: Camera,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    if let Some(existing) = equipment.cameras.iter_mut().find(|c| c.id == camera.id) {
        existing.name = camera.name;
        existing.sensor_width = camera.sensor_width;
        existing.sensor_height = camera.sensor_height;
        existing.pixel_size = camera.pixel_size;
        existing.resolution_x = camera.resolution_x;
        existing.resolution_y = camera.resolution_y;
        existing.camera_type = camera.camera_type;
        existing.has_cooler = camera.has_cooler;
        existing.notes = camera.notes;
        existing.updated_at = Utc::now();
        
        if camera.is_default {
            for c in &mut equipment.cameras {
                c.is_default = c.id == camera.id;
            }
        }
    }
    
    save_equipment(app, equipment.clone()).await?;
    Ok(equipment)
}

/// Update an eyepiece
#[tauri::command]
pub async fn update_eyepiece(
    app: AppHandle,
    eyepiece: Eyepiece,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    if let Some(existing) = equipment.eyepieces.iter_mut().find(|e| e.id == eyepiece.id) {
        existing.name = eyepiece.name;
        existing.focal_length = eyepiece.focal_length;
        existing.apparent_fov = eyepiece.apparent_fov;
        existing.barrel_size = eyepiece.barrel_size;
        existing.eye_relief = eyepiece.eye_relief;
        existing.notes = eyepiece.notes;
        existing.updated_at = Utc::now();
    }
    
    save_equipment(app, equipment.clone()).await?;
    Ok(equipment)
}

/// Update a barlow/reducer
#[tauri::command]
pub async fn update_barlow_reducer(
    app: AppHandle,
    barlow: BarlowReducer,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    if let Some(existing) = equipment.barlow_reducers.iter_mut().find(|b| b.id == barlow.id) {
        existing.name = barlow.name;
        existing.factor = barlow.factor;
        existing.notes = barlow.notes;
        existing.updated_at = Utc::now();
    }
    
    save_equipment(app, equipment.clone()).await?;
    Ok(equipment)
}

/// Update a filter
#[tauri::command]
pub async fn update_filter(
    app: AppHandle,
    filter: Filter,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    if let Some(existing) = equipment.filters.iter_mut().find(|f| f.id == filter.id) {
        existing.name = filter.name;
        existing.filter_type = filter.filter_type;
        existing.bandwidth = filter.bandwidth;
        existing.notes = filter.notes;
        existing.updated_at = Utc::now();
    }
    
    save_equipment(app, equipment.clone()).await?;
    Ok(equipment)
}

/// Set default telescope
#[tauri::command]
pub async fn set_default_telescope(
    app: AppHandle,
    telescope_id: String,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    for t in &mut equipment.telescopes {
        t.is_default = t.id == telescope_id;
    }
    
    save_equipment(app, equipment.clone()).await?;
    Ok(equipment)
}

/// Set default camera
#[tauri::command]
pub async fn set_default_camera(
    app: AppHandle,
    camera_id: String,
) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;
    
    for c in &mut equipment.cameras {
        c.is_default = c.id == camera_id;
    }
    
    save_equipment(app, equipment.clone()).await?;
    Ok(equipment)
}

/// Get default telescope
#[tauri::command]
pub async fn get_default_telescope(
    app: AppHandle,
) -> Result<Option<Telescope>, StorageError> {
    let equipment = load_equipment(app).await?;
    Ok(equipment.telescopes.into_iter().find(|t| t.is_default))
}

/// Get default camera
#[tauri::command]
pub async fn get_default_camera(
    app: AppHandle,
) -> Result<Option<Camera>, StorageError> {
    let equipment = load_equipment(app).await?;
    Ok(equipment.cameras.into_iter().find(|c| c.is_default))
}
