//! Storage module for SkyMap application
//! Provides file-based persistent storage for the desktop application

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use thiserror::Error;

/// Storage-related errors
#[derive(Error, Debug)]
pub enum StorageError {
    #[error("Failed to get app data directory")]
    AppDataDirNotFound,
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Store not found: {0}")]
    StoreNotFound(String),
    #[error("{0}")]
    Other(String),
}

impl serde::Serialize for StorageError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Metadata for exported data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportMetadata {
    pub version: String,
    pub exported_at: DateTime<Utc>,
    pub app_version: String,
    pub store_count: usize,
}

/// Full export data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportData {
    pub metadata: ExportMetadata,
    pub stores: HashMap<String, serde_json::Value>,
}

/// Known store names for validation
const KNOWN_STORES: &[&str] = &[
    "starmap-target-list",
    "starmap-markers",
    "starmap-settings",
    "starmap-equipment",
    "starmap-onboarding",
    "skymap-offline",
    "skymap-locale",
];

/// Get the base storage directory for the application
fn get_storage_dir(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| StorageError::AppDataDirNotFound)?;

    let storage_dir = app_data_dir.join("skymap").join("stores");

    // Ensure the directory exists
    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir)?;
    }

    Ok(storage_dir)
}

/// Get the file path for a specific store
fn get_store_path(app: &AppHandle, store_name: &str) -> Result<PathBuf, StorageError> {
    let storage_dir = get_storage_dir(app)?;
    Ok(storage_dir.join(format!("{}.json", store_name)))
}

/// Save store data to file
#[tauri::command]
pub async fn save_store_data(
    app: AppHandle,
    store_name: String,
    data: String,
) -> Result<(), StorageError> {
    let path = get_store_path(&app, &store_name)?;

    // SECURITY: Validate input size to prevent DoS
    crate::security::validate_size(&data, crate::security::limits::MAX_JSON_SIZE)
        .map_err(|e| StorageError::Other(e.to_string()))?;

    // Validate JSON before saving
    let _: serde_json::Value = serde_json::from_str(&data)?;

    fs::write(&path, &data)?;
    log::info!(
        "Saved store '{}' to {:?} ({} bytes)",
        store_name,
        path,
        data.len()
    );

    Ok(())
}

/// Load store data from file
#[tauri::command]
pub async fn load_store_data(
    app: AppHandle,
    store_name: String,
) -> Result<Option<String>, StorageError> {
    let path = get_store_path(&app, &store_name)?;

    if !path.exists() {
        log::info!("Store '{}' not found at {:?}", store_name, path);
        return Ok(None);
    }

    let data = fs::read_to_string(&path)?;
    log::info!("Loaded store '{}' from {:?}", store_name, path);

    Ok(Some(data))
}

/// Delete store data
#[tauri::command]
pub async fn delete_store_data(app: AppHandle, store_name: String) -> Result<bool, StorageError> {
    let path = get_store_path(&app, &store_name)?;

    if path.exists() {
        fs::remove_file(&path)?;
        log::info!("Deleted store '{}' at {:?}", store_name, path);
        return Ok(true);
    }

    Ok(false)
}

/// List all available stores
#[tauri::command]
pub async fn list_stores(app: AppHandle) -> Result<Vec<String>, StorageError> {
    let storage_dir = get_storage_dir(&app)?;

    let mut stores = Vec::new();

    if storage_dir.exists() {
        for entry in fs::read_dir(&storage_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "json" {
                        if let Some(name) = path.file_stem() {
                            stores.push(name.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }
    }

    Ok(stores)
}

/// Export all store data to a JSON file
#[tauri::command]
pub async fn export_all_data(app: AppHandle, export_path: String) -> Result<(), StorageError> {
    let storage_dir = get_storage_dir(&app)?;
    let mut stores: HashMap<String, serde_json::Value> = HashMap::new();

    // Read all known stores
    for store_name in KNOWN_STORES {
        let store_path = storage_dir.join(format!("{}.json", store_name));

        if store_path.exists() {
            let data = fs::read_to_string(&store_path)?;
            let value: serde_json::Value = serde_json::from_str(&data)?;
            stores.insert(store_name.to_string(), value);
        }
    }

    // Also read any additional stores that exist
    if storage_dir.exists() {
        for entry in fs::read_dir(&storage_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "json" {
                        if let Some(name) = path.file_stem() {
                            let name_str = name.to_string_lossy().to_string();
                            if let std::collections::hash_map::Entry::Vacant(e) =
                                stores.entry(name_str)
                            {
                                let data = fs::read_to_string(&path)?;
                                let value: serde_json::Value = serde_json::from_str(&data)?;
                                e.insert(value);
                            }
                        }
                    }
                }
            }
        }
    }

    let export_data = ExportData {
        metadata: ExportMetadata {
            version: "1.0".to_string(),
            exported_at: Utc::now(),
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            store_count: stores.len(),
        },
        stores,
    };

    let json = serde_json::to_string_pretty(&export_data)?;
    fs::write(&export_path, json)?;

    log::info!(
        "Exported {} stores to {}",
        export_data.metadata.store_count,
        export_path
    );

    Ok(())
}

/// Import all store data from a JSON file
#[tauri::command]
pub async fn import_all_data(
    app: AppHandle,
    import_path: String,
) -> Result<ImportResult, StorageError> {
    let data = fs::read_to_string(&import_path)?;
    let export_data: ExportData = serde_json::from_str(&data)?;

    let storage_dir = get_storage_dir(&app)?;
    let mut imported_count = 0;
    let mut skipped_count = 0;
    let mut errors: Vec<String> = Vec::new();

    for (store_name, value) in export_data.stores {
        let store_path = storage_dir.join(format!("{}.json", store_name));

        match serde_json::to_string_pretty(&value) {
            Ok(json) => match fs::write(&store_path, json) {
                Ok(_) => {
                    imported_count += 1;
                    log::info!("Imported store '{}' to {:?}", store_name, store_path);
                }
                Err(e) => {
                    errors.push(format!("{}: {}", store_name, e));
                    skipped_count += 1;
                }
            },
            Err(e) => {
                errors.push(format!("{}: {}", store_name, e));
                skipped_count += 1;
            }
        }
    }

    Ok(ImportResult {
        imported_count,
        skipped_count,
        errors,
        metadata: export_data.metadata,
    })
}

/// Result of import operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported_count: usize,
    pub skipped_count: usize,
    pub errors: Vec<String>,
    pub metadata: ExportMetadata,
}

/// Get the data directory path
#[tauri::command]
pub async fn get_data_directory(app: AppHandle) -> Result<String, StorageError> {
    let storage_dir = get_storage_dir(&app)?;
    Ok(storage_dir.to_string_lossy().to_string())
}

/// Get storage statistics
#[tauri::command]
pub async fn get_storage_stats(app: AppHandle) -> Result<StorageStats, StorageError> {
    let storage_dir = get_storage_dir(&app)?;

    let mut total_size: u64 = 0;
    let mut store_count: usize = 0;
    let mut stores: Vec<StoreInfo> = Vec::new();

    if storage_dir.exists() {
        for entry in fs::read_dir(&storage_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "json" {
                        let metadata = entry.metadata()?;
                        let size = metadata.len();
                        total_size += size;
                        store_count += 1;

                        if let Some(name) = path.file_stem() {
                            stores.push(StoreInfo {
                                name: name.to_string_lossy().to_string(),
                                size,
                                modified: metadata
                                    .modified()
                                    .ok()
                                    .map(|t| DateTime::<Utc>::from(t)),
                            });
                        }
                    }
                }
            }
        }
    }

    Ok(StorageStats {
        total_size,
        store_count,
        stores,
        directory: storage_dir.to_string_lossy().to_string(),
    })
}

/// Storage statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_size: u64,
    pub store_count: usize,
    pub stores: Vec<StoreInfo>,
    pub directory: String,
}

/// Individual store information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoreInfo {
    pub name: String,
    pub size: u64,
    pub modified: Option<DateTime<Utc>>,
}

/// Clear all stored data
#[tauri::command]
pub async fn clear_all_data(app: AppHandle) -> Result<usize, StorageError> {
    let storage_dir = get_storage_dir(&app)?;
    let mut deleted_count = 0;

    if storage_dir.exists() {
        for entry in fs::read_dir(&storage_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "json" {
                        fs::remove_file(&path)?;
                        deleted_count += 1;
                    }
                }
            }
        }
    }

    log::info!("Cleared {} stores from {:?}", deleted_count, storage_dir);
    Ok(deleted_count)
}
