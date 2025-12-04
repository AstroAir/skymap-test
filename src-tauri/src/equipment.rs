//! Equipment management module
//! Manages telescope, camera, eyepiece, and filter configurations

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::StorageError;

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
