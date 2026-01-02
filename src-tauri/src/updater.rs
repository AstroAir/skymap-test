use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Runtime};
use tauri_plugin_updater::{Update, UpdaterExt};
use time::OffsetDateTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub date: Option<String>,
    pub body: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProgress {
    pub downloaded: u64,
    pub total: Option<u64>,
    pub percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", content = "data")]
pub enum UpdateStatus {
    #[serde(rename = "idle")]
    Idle,
    #[serde(rename = "checking")]
    Checking,
    #[serde(rename = "available")]
    Available(UpdateInfo),
    #[serde(rename = "not_available")]
    NotAvailable,
    #[serde(rename = "downloading")]
    Downloading(UpdateProgress),
    #[serde(rename = "ready")]
    Ready(UpdateInfo),
    #[serde(rename = "error")]
    Error(String),
}

#[derive(Debug, thiserror::Error)]
pub enum UpdaterError {
    #[allow(dead_code)]
    #[error("Updater not available")]
    NotAvailable,
    #[error("No update pending")]
    NoPendingUpdate,
    #[error("Update check failed: {0}")]
    CheckFailed(String),
    #[error("Download failed: {0}")]
    DownloadFailed(String),
    #[error("Install failed: {0}")]
    InstallFailed(String),
}

impl Serialize for UpdaterError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

use std::sync::Mutex;
use once_cell::sync::Lazy;

static PENDING_UPDATE: Lazy<Mutex<Option<Update>>> = Lazy::new(|| Mutex::new(None));

#[tauri::command]
pub async fn check_for_update<R: Runtime>(app: AppHandle<R>) -> Result<UpdateStatus, UpdaterError> {
    let updater = app.updater().map_err(|e| UpdaterError::CheckFailed(e.to_string()))?;
    
    match updater.check().await {
        Ok(Some(update)) => {
            let info = UpdateInfo {
                version: update.version.clone(),
                current_version: update.current_version.clone(),
                date: update.date.map(|d| format_datetime(d)),
                body: update.body.clone(),
            };
            
            // Store the update for later
            if let Ok(mut pending) = PENDING_UPDATE.lock() {
                *pending = Some(update);
            }
            
            Ok(UpdateStatus::Available(info))
        }
        Ok(None) => Ok(UpdateStatus::NotAvailable),
        Err(e) => Err(UpdaterError::CheckFailed(e.to_string())),
    }
}

#[tauri::command]
pub async fn download_update<R: Runtime>(
    _app: AppHandle<R>,
    window: tauri::Window<R>,
) -> Result<UpdateStatus, UpdaterError> {
    let update = {
        let pending = PENDING_UPDATE.lock().map_err(|_| UpdaterError::NoPendingUpdate)?;
        pending.clone().ok_or(UpdaterError::NoPendingUpdate)?
    };
    
    let info = UpdateInfo {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
        date: update.date.map(|d| format_datetime(d)),
        body: update.body.clone(),
    };
    
    let window_clone = window.clone();
    let mut total_downloaded: u64 = 0;
    
    update.download(
        |chunk_length, content_length| {
            total_downloaded += chunk_length as u64;
            let progress = UpdateProgress {
                downloaded: total_downloaded,
                total: content_length.map(|l| l as u64),
                percent: content_length.map(|l| (total_downloaded as f64 / l as f64) * 100.0).unwrap_or(0.0),
            };
            let _ = window_clone.emit("update-progress", UpdateStatus::Downloading(progress));
        },
        || {
            log::info!("Download finished");
        },
    ).await.map_err(|e| UpdaterError::DownloadFailed(e.to_string()))?;
    
    // Store downloaded bytes for install
    if let Ok(mut pending) = PENDING_UPDATE.lock() {
        *pending = Some(update);
    }
    
    Ok(UpdateStatus::Ready(info))
}

#[tauri::command]
pub async fn install_update<R: Runtime>(app: AppHandle<R>) -> Result<(), UpdaterError> {
    // Get the pending update and download + install it
    let update = {
        let mut pending = PENDING_UPDATE.lock().map_err(|_| UpdaterError::NoPendingUpdate)?;
        pending.take().ok_or(UpdaterError::NoPendingUpdate)?
    };
    
    // Download and install the update
    update.download_and_install(
        |_, _| {},  // Progress is optional for this function
        || log::info!("Install completed"),
    ).await.map_err(|e| UpdaterError::InstallFailed(e.to_string()))?;
    
    // Restart the app
    app.restart();
}

#[tauri::command]
pub async fn download_and_install_update<R: Runtime>(
    app: AppHandle<R>,
    window: tauri::Window<R>,
) -> Result<(), UpdaterError> {
    let update = {
        let mut pending = PENDING_UPDATE.lock().map_err(|_| UpdaterError::NoPendingUpdate)?;
        pending.take().ok_or(UpdaterError::NoPendingUpdate)?
    };
    
    let window_clone = window.clone();
    let mut downloaded: u64 = 0;
    
    update.download_and_install(
        |chunk_length, content_length| {
            downloaded += chunk_length as u64;
            let progress = UpdateProgress {
                downloaded,
                total: content_length.map(|l| l as u64),
                percent: content_length.map(|l| (downloaded as f64 / l as f64) * 100.0).unwrap_or(0.0),
            };
            let _ = window_clone.emit("update-progress", UpdateStatus::Downloading(progress));
        },
        || {
            log::info!("Download finished, installing...");
        },
    ).await.map_err(|e| UpdaterError::InstallFailed(e.to_string()))?;
    
    // Restart the app
    app.restart();
}

#[tauri::command]
pub fn get_current_version<R: Runtime>(app: AppHandle<R>) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
pub fn clear_pending_update() -> Result<(), UpdaterError> {
    if let Ok(mut pending) = PENDING_UPDATE.lock() {
        *pending = None;
    }
    Ok(())
}

#[tauri::command]
pub fn has_pending_update() -> bool {
    PENDING_UPDATE.lock().map(|p| p.is_some()).unwrap_or(false)
}

/// Format OffsetDateTime to RFC3339 string
fn format_datetime(dt: OffsetDateTime) -> String {
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        dt.year(),
        dt.month() as u8,
        dt.day(),
        dt.hour(),
        dt.minute(),
        dt.second()
    )
}
