//! Observation locations management module
//! Manages saved observation sites with geographic coordinates

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use super::storage::StorageError;
use crate::utils::generate_id;

/// Observation location/site
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObservationLocation {
    pub id: String,
    pub name: String,
    pub latitude: f64,  // degrees, positive = North
    pub longitude: f64, // degrees, positive = East
    pub altitude: f64,  // meters above sea level
    pub timezone: Option<String>,
    pub bortle_class: Option<u8>, // 1-9 light pollution scale
    pub notes: Option<String>,
    pub is_default: bool,
    pub is_current: bool, // Currently active location
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Location data container
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LocationsData {
    pub locations: Vec<ObservationLocation>,
    pub current_location_id: Option<String>,
}

fn get_locations_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| StorageError::AppDataDirNotFound)?;

    let dir = app_data_dir.join("skymap").join("locations");

    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }

    Ok(dir.join("locations.json"))
}

/// Load all locations
#[tauri::command]
pub async fn load_locations(app: AppHandle) -> Result<LocationsData, StorageError> {
    let path = get_locations_path(&app)?;

    if !path.exists() {
        return Ok(LocationsData::default());
    }

    let data = fs::read_to_string(&path)?;
    let locations: LocationsData = serde_json::from_str(&data)?;

    Ok(locations)
}

/// Save all locations
#[tauri::command]
pub async fn save_locations(app: AppHandle, locations: LocationsData) -> Result<(), StorageError> {
    let path = get_locations_path(&app)?;
    let json = serde_json::to_string_pretty(&locations)?;
    fs::write(&path, json)?;

    log::info!("Saved locations data to {:?}", path);
    Ok(())
}

/// Add a new location
#[tauri::command]
pub async fn add_location(
    app: AppHandle,
    mut location: ObservationLocation,
) -> Result<LocationsData, StorageError> {
    let mut data = load_locations(app.clone()).await?;

    location.id = generate_id("location");
    location.created_at = Utc::now();
    location.updated_at = Utc::now();

    // If first location or marked as default, set as default
    if data.locations.is_empty() || location.is_default {
        for loc in &mut data.locations {
            loc.is_default = false;
        }
        location.is_default = true;
    }

    // If marked as current, update current_location_id
    if location.is_current {
        for loc in &mut data.locations {
            loc.is_current = false;
        }
        data.current_location_id = Some(location.id.clone());
    }

    data.locations.push(location);
    save_locations(app, data.clone()).await?;

    Ok(data)
}

/// Update a location
#[tauri::command]
pub async fn update_location(
    app: AppHandle,
    location: ObservationLocation,
) -> Result<LocationsData, StorageError> {
    let mut data = load_locations(app.clone()).await?;

    if let Some(existing) = data.locations.iter_mut().find(|l| l.id == location.id) {
        // Update fields
        existing.name = location.name;
        existing.latitude = location.latitude;
        existing.longitude = location.longitude;
        existing.altitude = location.altitude;
        existing.timezone = location.timezone;
        existing.bortle_class = location.bortle_class;
        existing.notes = location.notes;
        existing.updated_at = Utc::now();

        // Handle default flag
        if location.is_default {
            for loc in &mut data.locations {
                loc.is_default = loc.id == location.id;
            }
        }

        // Handle current flag
        if location.is_current {
            for loc in &mut data.locations {
                loc.is_current = loc.id == location.id;
            }
            data.current_location_id = Some(location.id.clone());
        }
    }

    save_locations(app, data.clone()).await?;

    Ok(data)
}

/// Delete a location
#[tauri::command]
pub async fn delete_location(
    app: AppHandle,
    location_id: String,
) -> Result<LocationsData, StorageError> {
    let mut data = load_locations(app.clone()).await?;

    data.locations.retain(|l| l.id != location_id);

    // Update current_location_id if deleted
    if data.current_location_id.as_ref() == Some(&location_id) {
        data.current_location_id = data.locations.first().map(|l| l.id.clone());
        if let Some(id) = &data.current_location_id {
            if let Some(loc) = data.locations.iter_mut().find(|l| &l.id == id) {
                loc.is_current = true;
            }
        }
    }

    save_locations(app, data.clone()).await?;

    Ok(data)
}

/// Set current location
#[tauri::command]
pub async fn set_current_location(
    app: AppHandle,
    location_id: String,
) -> Result<LocationsData, StorageError> {
    let mut data = load_locations(app.clone()).await?;

    for loc in &mut data.locations {
        loc.is_current = loc.id == location_id;
    }
    data.current_location_id = Some(location_id);

    save_locations(app, data.clone()).await?;

    Ok(data)
}

/// Get current location
#[tauri::command]
pub async fn get_current_location(
    app: AppHandle,
) -> Result<Option<ObservationLocation>, StorageError> {
    let data = load_locations(app).await?;

    if let Some(id) = data.current_location_id {
        Ok(data.locations.into_iter().find(|l| l.id == id))
    } else {
        Ok(data.locations.into_iter().find(|l| l.is_default))
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // ------------------------------------------------------------------------
    // ObservationLocation Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_observation_location_serialization() {
        let location = ObservationLocation {
            id: "loc-1".to_string(),
            name: "Dark Sky Site".to_string(),
            latitude: 34.0522,
            longitude: -118.2437,
            altitude: 100.0,
            timezone: Some("America/Los_Angeles".to_string()),
            bortle_class: Some(3),
            notes: Some("Great for deep sky".to_string()),
            is_default: true,
            is_current: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&location).unwrap();
        assert!(json.contains("loc-1"));
        assert!(json.contains("Dark Sky Site"));
        assert!(json.contains("34.0522"));
        assert!(json.contains("-118.2437"));
        assert!(json.contains("bortle_class"));
    }

    #[test]
    fn test_observation_location_deserialization() {
        let json = r#"{
            "id": "l1",
            "name": "Home Observatory",
            "latitude": 51.5074,
            "longitude": -0.1278,
            "altitude": 50.0,
            "timezone": "Europe/London",
            "bortle_class": 6,
            "notes": null,
            "is_default": false,
            "is_current": true,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }"#;

        let location: ObservationLocation = serde_json::from_str(json).unwrap();
        assert_eq!(location.name, "Home Observatory");
        assert_eq!(location.latitude, 51.5074);
        assert_eq!(location.bortle_class, Some(6));
        assert!(location.is_current);
    }

    #[test]
    fn test_observation_location_clone() {
        let location = ObservationLocation {
            id: "clone-test".to_string(),
            name: "Test".to_string(),
            latitude: 0.0,
            longitude: 0.0,
            altitude: 0.0,
            timezone: None,
            bortle_class: None,
            notes: None,
            is_default: false,
            is_current: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let cloned = location.clone();
        assert_eq!(cloned.id, location.id);
        assert_eq!(cloned.name, location.name);
    }

    #[test]
    fn test_observation_location_without_optional_fields() {
        let json = r#"{
            "id": "l2",
            "name": "Basic Site",
            "latitude": 45.0,
            "longitude": 10.0,
            "altitude": 200.0,
            "timezone": null,
            "bortle_class": null,
            "notes": null,
            "is_default": true,
            "is_current": false,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }"#;

        let location: ObservationLocation = serde_json::from_str(json).unwrap();
        assert!(location.timezone.is_none());
        assert!(location.bortle_class.is_none());
        assert!(location.notes.is_none());
    }

    // ------------------------------------------------------------------------
    // LocationsData Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_locations_data_default() {
        let data = LocationsData::default();
        assert!(data.locations.is_empty());
        assert!(data.current_location_id.is_none());
    }

    #[test]
    fn test_locations_data_serialization() {
        let mut data = LocationsData::default();
        data.locations.push(ObservationLocation {
            id: "l1".to_string(),
            name: "Site 1".to_string(),
            latitude: 30.0,
            longitude: -90.0,
            altitude: 10.0,
            timezone: None,
            bortle_class: Some(4),
            notes: None,
            is_default: true,
            is_current: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        });
        data.current_location_id = Some("l1".to_string());

        let json = serde_json::to_string(&data).unwrap();
        assert!(json.contains("locations"));
        assert!(json.contains("current_location_id"));
        assert!(json.contains("l1"));
    }

    #[test]
    fn test_locations_data_deserialization() {
        let json = r#"{
            "locations": [
                {
                    "id": "loc1",
                    "name": "Location 1",
                    "latitude": 40.0,
                    "longitude": -74.0,
                    "altitude": 50.0,
                    "timezone": null,
                    "bortle_class": null,
                    "notes": null,
                    "is_default": true,
                    "is_current": true,
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            ],
            "current_location_id": "loc1"
        }"#;

        let data: LocationsData = serde_json::from_str(json).unwrap();
        assert_eq!(data.locations.len(), 1);
        assert_eq!(data.current_location_id, Some("loc1".to_string()));
    }

    #[test]
    fn test_locations_data_clone() {
        let mut data = LocationsData::default();
        data.current_location_id = Some("test-id".to_string());

        let cloned = data.clone();
        assert_eq!(cloned.current_location_id, data.current_location_id);
    }

    // ------------------------------------------------------------------------
    // Coordinate Validation Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_location_coordinates_range() {
        // Valid coordinates at extremes
        let north_pole = ObservationLocation {
            id: "np".to_string(),
            name: "North Pole".to_string(),
            latitude: 90.0,
            longitude: 0.0,
            altitude: 0.0,
            timezone: None,
            bortle_class: None,
            notes: None,
            is_default: false,
            is_current: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&north_pole).unwrap();
        let back: ObservationLocation = serde_json::from_str(&json).unwrap();
        assert_eq!(back.latitude, 90.0);
    }

    #[test]
    fn test_location_negative_coordinates() {
        let location = ObservationLocation {
            id: "south".to_string(),
            name: "Southern Site".to_string(),
            latitude: -45.0,
            longitude: -120.0,
            altitude: 500.0,
            timezone: None,
            bortle_class: None,
            notes: None,
            is_default: false,
            is_current: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&location).unwrap();
        assert!(json.contains("-45"));
        assert!(json.contains("-120"));
    }

    // ------------------------------------------------------------------------
    // Bortle Scale Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_bortle_class_range() {
        // Bortle scale is 1-9
        for bortle in 1..=9u8 {
            let location = ObservationLocation {
                id: format!("b{}", bortle),
                name: format!("Bortle {} Site", bortle),
                latitude: 0.0,
                longitude: 0.0,
                altitude: 0.0,
                timezone: None,
                bortle_class: Some(bortle),
                notes: None,
                is_default: false,
                is_current: false,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            let json = serde_json::to_string(&location).unwrap();
            let back: ObservationLocation = serde_json::from_str(&json).unwrap();
            assert_eq!(back.bortle_class, Some(bortle));
        }
    }
}
