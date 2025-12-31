//! Observation locations management module
//! Manages saved observation sites with geographic coordinates

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::StorageError;
use crate::utils::generate_id;

/// Observation location/site
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObservationLocation {
    pub id: String,
    pub name: String,
    pub latitude: f64,       // degrees, positive = North
    pub longitude: f64,      // degrees, positive = East
    pub altitude: f64,       // meters above sea level
    pub timezone: Option<String>,
    pub bortle_class: Option<u8>, // 1-9 light pollution scale
    pub notes: Option<String>,
    pub is_default: bool,
    pub is_current: bool,    // Currently active location
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
pub async fn save_locations(
    app: AppHandle,
    locations: LocationsData,
) -> Result<(), StorageError> {
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

