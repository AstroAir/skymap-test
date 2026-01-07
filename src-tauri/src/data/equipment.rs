//! Equipment management module
//! Manages telescope, camera, eyepiece, and filter configurations

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use super::storage::StorageError;
use crate::utils::generate_id;

// ============================================================================
// Types
// ============================================================================

/// Telescope configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Telescope {
    pub id: String,
    pub name: String,
    pub aperture: f64,     // mm
    pub focal_length: f64, // mm
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
    pub sensor_width: f64,  // mm
    pub sensor_height: f64, // mm
    pub pixel_size: f64,    // μm
    pub resolution_x: u32,  // pixels
    pub resolution_y: u32,  // pixels
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
    pub focal_length: f64,       // mm
    pub apparent_fov: f64,       // degrees
    pub barrel_size: f64,        // inches (1.25, 2, etc.)
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
    pub factor: f64, // 2x, 0.63x, etc.
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
pub async fn save_equipment(app: AppHandle, equipment: EquipmentData) -> Result<(), StorageError> {
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

    telescope.id = generate_id("telescope");
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
pub async fn add_camera(app: AppHandle, mut camera: Camera) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;

    camera.id = generate_id("camera");
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

    eyepiece.id = generate_id("eyepiece");
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

    barlow.id = generate_id("barlow");
    barlow.created_at = Utc::now();
    barlow.updated_at = Utc::now();

    equipment.barlow_reducers.push(barlow);
    save_equipment(app, equipment.clone()).await?;

    Ok(equipment)
}

/// Add a filter
#[tauri::command]
pub async fn add_filter(app: AppHandle, mut filter: Filter) -> Result<EquipmentData, StorageError> {
    let mut equipment = load_equipment(app.clone()).await?;

    filter.id = generate_id("filter");
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

    if let Some(existing) = equipment
        .telescopes
        .iter_mut()
        .find(|t| t.id == telescope.id)
    {
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
pub async fn update_camera(app: AppHandle, camera: Camera) -> Result<EquipmentData, StorageError> {
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

    if let Some(existing) = equipment
        .barlow_reducers
        .iter_mut()
        .find(|b| b.id == barlow.id)
    {
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
pub async fn update_filter(app: AppHandle, filter: Filter) -> Result<EquipmentData, StorageError> {
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
pub async fn get_default_telescope(app: AppHandle) -> Result<Option<Telescope>, StorageError> {
    let equipment = load_equipment(app).await?;
    Ok(equipment.telescopes.into_iter().find(|t| t.is_default))
}

/// Get default camera
#[tauri::command]
pub async fn get_default_camera(app: AppHandle) -> Result<Option<Camera>, StorageError> {
    let equipment = load_equipment(app).await?;
    Ok(equipment.cameras.into_iter().find(|c| c.is_default))
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // ------------------------------------------------------------------------
    // TelescopeType Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_telescope_type_serialization() {
        let t = TelescopeType::Refractor;
        let json = serde_json::to_string(&t).unwrap();
        assert_eq!(json, "\"refractor\"");

        let t = TelescopeType::Reflector;
        let json = serde_json::to_string(&t).unwrap();
        assert_eq!(json, "\"reflector\"");

        let t = TelescopeType::Catadioptric;
        let json = serde_json::to_string(&t).unwrap();
        assert_eq!(json, "\"catadioptric\"");
    }

    #[test]
    fn test_telescope_type_deserialization() {
        let t: TelescopeType = serde_json::from_str("\"refractor\"").unwrap();
        assert!(matches!(t, TelescopeType::Refractor));

        let t: TelescopeType = serde_json::from_str("\"other\"").unwrap();
        assert!(matches!(t, TelescopeType::Other));
    }

    // ------------------------------------------------------------------------
    // Telescope Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_telescope_serialization() {
        let telescope = Telescope {
            id: "telescope-1".to_string(),
            name: "My Refractor".to_string(),
            aperture: 80.0,
            focal_length: 400.0,
            focal_ratio: 5.0,
            telescope_type: TelescopeType::Refractor,
            mount_type: Some("Alt-Az".to_string()),
            notes: Some("Great for wide field".to_string()),
            is_default: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&telescope).unwrap();
        assert!(json.contains("telescope-1"));
        assert!(json.contains("My Refractor"));
        assert!(json.contains("80"));
        assert!(json.contains("refractor"));
    }

    #[test]
    fn test_telescope_deserialization() {
        let json = r#"{
            "id": "t1",
            "name": "Test Scope",
            "aperture": 200.0,
            "focal_length": 1000.0,
            "focal_ratio": 5.0,
            "telescope_type": "reflector",
            "mount_type": null,
            "notes": null,
            "is_default": false,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }"#;

        let telescope: Telescope = serde_json::from_str(json).unwrap();
        assert_eq!(telescope.id, "t1");
        assert_eq!(telescope.aperture, 200.0);
        assert!(matches!(telescope.telescope_type, TelescopeType::Reflector));
    }

    // ------------------------------------------------------------------------
    // CameraType Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_camera_type_serialization() {
        let all_types = vec![
            (CameraType::Cmos, "\"cmos\""),
            (CameraType::Ccd, "\"ccd\""),
            (CameraType::Dslr, "\"dslr\""),
            (CameraType::Mirrorless, "\"mirrorless\""),
            (CameraType::Webcam, "\"webcam\""),
            (CameraType::Other, "\"other\""),
        ];

        for (camera_type, expected) in all_types {
            let json = serde_json::to_string(&camera_type).unwrap();
            assert_eq!(json, expected);
        }
    }

    // ------------------------------------------------------------------------
    // Camera Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_camera_serialization() {
        let camera = Camera {
            id: "camera-1".to_string(),
            name: "ASI294MC".to_string(),
            sensor_width: 23.2,
            sensor_height: 15.5,
            pixel_size: 4.63,
            resolution_x: 4144,
            resolution_y: 2822,
            camera_type: CameraType::Cmos,
            has_cooler: true,
            notes: None,
            is_default: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&camera).unwrap();
        assert!(json.contains("ASI294MC"));
        assert!(json.contains("4144"));
        assert!(json.contains("cmos"));
        assert!(json.contains("has_cooler"));
    }

    #[test]
    fn test_camera_deserialization() {
        let json = r#"{
            "id": "c1",
            "name": "Test Camera",
            "sensor_width": 36.0,
            "sensor_height": 24.0,
            "pixel_size": 5.0,
            "resolution_x": 6000,
            "resolution_y": 4000,
            "camera_type": "dslr",
            "has_cooler": false,
            "notes": "Full frame",
            "is_default": true,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }"#;

        let camera: Camera = serde_json::from_str(json).unwrap();
        assert_eq!(camera.name, "Test Camera");
        assert_eq!(camera.resolution_x, 6000);
        assert!(!camera.has_cooler);
    }

    // ------------------------------------------------------------------------
    // Eyepiece Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_eyepiece_serialization() {
        let eyepiece = Eyepiece {
            id: "eyepiece-1".to_string(),
            name: "Nagler 13mm".to_string(),
            focal_length: 13.0,
            apparent_fov: 82.0,
            barrel_size: 1.25,
            eye_relief: Some(12.0),
            notes: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&eyepiece).unwrap();
        assert!(json.contains("Nagler 13mm"));
        assert!(json.contains("82"));
        assert!(json.contains("1.25"));
    }

    #[test]
    fn test_eyepiece_deserialization() {
        let json = r#"{
            "id": "e1",
            "name": "Plössl 25mm",
            "focal_length": 25.0,
            "apparent_fov": 52.0,
            "barrel_size": 1.25,
            "eye_relief": null,
            "notes": null,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }"#;

        let eyepiece: Eyepiece = serde_json::from_str(json).unwrap();
        assert_eq!(eyepiece.focal_length, 25.0);
        assert!(eyepiece.eye_relief.is_none());
    }

    // ------------------------------------------------------------------------
    // BarlowReducer Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_barlow_reducer_serialization() {
        let barlow = BarlowReducer {
            id: "barlow-1".to_string(),
            name: "2x Barlow".to_string(),
            factor: 2.0,
            notes: Some("TeleVue".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&barlow).unwrap();
        assert!(json.contains("2x Barlow"));
        assert!(json.contains("\"factor\":2"));
    }

    #[test]
    fn test_barlow_reducer_deserialization() {
        let json = r#"{
            "id": "b1",
            "name": "0.63x Reducer",
            "factor": 0.63,
            "notes": null,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }"#;

        let reducer: BarlowReducer = serde_json::from_str(json).unwrap();
        assert_eq!(reducer.factor, 0.63);
        assert!(reducer.notes.is_none());
    }

    // ------------------------------------------------------------------------
    // FilterType Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_filter_type_serialization() {
        let types = vec![
            (FilterType::Luminance, "\"luminance\""),
            (FilterType::Red, "\"red\""),
            (FilterType::Green, "\"green\""),
            (FilterType::Blue, "\"blue\""),
            (FilterType::Ha, "\"ha\""),
            (FilterType::Oiii, "\"oiii\""),
            (FilterType::Sii, "\"sii\""),
        ];

        for (filter_type, expected) in types {
            let json = serde_json::to_string(&filter_type).unwrap();
            assert_eq!(json, expected);
        }
    }

    // ------------------------------------------------------------------------
    // Filter Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_filter_serialization() {
        let filter = Filter {
            id: "filter-1".to_string(),
            name: "Ha 7nm".to_string(),
            filter_type: FilterType::Ha,
            bandwidth: Some(7.0),
            notes: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&filter).unwrap();
        assert!(json.contains("Ha 7nm"));
        assert!(json.contains("\"ha\""));
        assert!(json.contains("7"));
    }

    #[test]
    fn test_filter_deserialization() {
        let json = r#"{
            "id": "f1",
            "name": "OIII Filter",
            "filter_type": "oiii",
            "bandwidth": 3.0,
            "notes": "Narrowband",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }"#;

        let filter: Filter = serde_json::from_str(json).unwrap();
        assert_eq!(filter.bandwidth, Some(3.0));
        assert!(matches!(filter.filter_type, FilterType::Oiii));
    }

    // ------------------------------------------------------------------------
    // EquipmentData Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_equipment_data_default() {
        let data = EquipmentData::default();
        assert!(data.telescopes.is_empty());
        assert!(data.cameras.is_empty());
        assert!(data.eyepieces.is_empty());
        assert!(data.barlow_reducers.is_empty());
        assert!(data.filters.is_empty());
    }

    #[test]
    fn test_equipment_data_serialization() {
        let mut data = EquipmentData::default();
        data.telescopes.push(Telescope {
            id: "t1".to_string(),
            name: "Test".to_string(),
            aperture: 100.0,
            focal_length: 500.0,
            focal_ratio: 5.0,
            telescope_type: TelescopeType::Refractor,
            mount_type: None,
            notes: None,
            is_default: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        });

        let json = serde_json::to_string(&data).unwrap();
        assert!(json.contains("telescopes"));
        assert!(json.contains("cameras"));
        assert!(json.contains("t1"));
    }

    #[test]
    fn test_equipment_data_clone() {
        let mut data = EquipmentData::default();
        data.filters.push(Filter {
            id: "f1".to_string(),
            name: "Test Filter".to_string(),
            filter_type: FilterType::Luminance,
            bandwidth: None,
            notes: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        });

        let cloned = data.clone();
        assert_eq!(cloned.filters.len(), 1);
        assert_eq!(cloned.filters[0].name, "Test Filter");
    }

    // ------------------------------------------------------------------------
    // Edge Cases
    // ------------------------------------------------------------------------

    #[test]
    fn test_telescope_with_all_optional_fields() {
        let telescope = Telescope {
            id: "t1".to_string(),
            name: "Complete Telescope".to_string(),
            aperture: 150.0,
            focal_length: 750.0,
            focal_ratio: 5.0,
            telescope_type: TelescopeType::Catadioptric,
            mount_type: Some("EQ".to_string()),
            notes: Some("My favorite scope".to_string()),
            is_default: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&telescope).unwrap();
        let back: Telescope = serde_json::from_str(&json).unwrap();
        assert_eq!(back.mount_type, Some("EQ".to_string()));
        assert_eq!(back.notes, Some("My favorite scope".to_string()));
    }

    #[test]
    fn test_camera_without_cooler() {
        let camera = Camera {
            id: "c1".to_string(),
            name: "DSLR".to_string(),
            sensor_width: 22.3,
            sensor_height: 14.9,
            pixel_size: 4.3,
            resolution_x: 5472,
            resolution_y: 3648,
            camera_type: CameraType::Dslr,
            has_cooler: false,
            notes: None,
            is_default: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&camera).unwrap();
        assert!(json.contains("\"has_cooler\":false"));
    }
}
