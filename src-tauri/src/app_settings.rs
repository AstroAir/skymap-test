//! Application settings module
//! Manages window state, recent files, and app preferences

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};

use crate::storage::StorageError;

/// Window state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub maximized: bool,
    pub fullscreen: bool,
}

impl Default for WindowState {
    fn default() -> Self {
        Self {
            width: 1280,
            height: 800,
            x: 100,
            y: 100,
            maximized: false,
            fullscreen: false,
        }
    }
}

/// Recent file entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentFile {
    pub path: String,
    pub name: String,
    pub file_type: String,
    pub accessed_at: i64, // timestamp
}

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub window_state: WindowState,
    pub recent_files: Vec<RecentFile>,
    pub last_export_dir: Option<String>,
    pub last_import_dir: Option<String>,
    pub auto_save_interval: u32, // seconds, 0 = disabled
    pub check_updates: bool,
    pub telemetry_enabled: bool,
    pub theme: String, // "system", "light", "dark"
    pub sidebar_collapsed: bool,
    pub show_welcome: bool,
    pub language: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            window_state: WindowState::default(),
            recent_files: Vec::new(),
            last_export_dir: None,
            last_import_dir: None,
            auto_save_interval: 300, // 5 minutes
            check_updates: true,
            telemetry_enabled: false,
            theme: "system".to_string(),
            sidebar_collapsed: false,
            show_welcome: true,
            language: "en".to_string(),
        }
    }
}

fn get_settings_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| StorageError::AppDataDirNotFound)?;

    let dir = app_data_dir.join("skymap");

    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }

    Ok(dir.join("app_settings.json"))
}

/// Load app settings
#[tauri::command]
pub async fn load_app_settings(app: AppHandle) -> Result<AppSettings, StorageError> {
    let path = get_settings_path(&app)?;

    if !path.exists() {
        return Ok(AppSettings::default());
    }

    let data = fs::read_to_string(&path)?;
    let settings: AppSettings = serde_json::from_str(&data)?;

    Ok(settings)
}

/// Save app settings
#[tauri::command]
pub async fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<(), StorageError> {
    let path = get_settings_path(&app)?;
    let json = serde_json::to_string_pretty(&settings)?;
    fs::write(&path, json)?;

    Ok(())
}

/// Save window state
#[tauri::command]
pub async fn save_window_state(app: AppHandle) -> Result<(), StorageError> {
    let window = app.get_webview_window("main").ok_or_else(|| {
        StorageError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Main window not found",
        ))
    })?;

    let mut settings = load_app_settings(app.clone()).await?;

    if let Ok(size) = window.outer_size() {
        settings.window_state.width = size.width;
        settings.window_state.height = size.height;
    }

    if let Ok(pos) = window.outer_position() {
        settings.window_state.x = pos.x;
        settings.window_state.y = pos.y;
    }

    if let Ok(maximized) = window.is_maximized() {
        settings.window_state.maximized = maximized;
    }

    if let Ok(fullscreen) = window.is_fullscreen() {
        settings.window_state.fullscreen = fullscreen;
    }

    save_app_settings(app, settings).await?;

    Ok(())
}

/// Restore window state
#[tauri::command]
pub async fn restore_window_state(app: AppHandle) -> Result<(), StorageError> {
    let settings = load_app_settings(app.clone()).await?;
    let state = settings.window_state;

    let window = app.get_webview_window("main").ok_or_else(|| {
        StorageError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Main window not found",
        ))
    })?;

    // Restore size
    let _ = window.set_size(PhysicalSize::new(state.width, state.height));

    // Restore position
    let _ = window.set_position(PhysicalPosition::new(state.x, state.y));

    // Restore maximized/fullscreen state
    if state.fullscreen {
        let _ = window.set_fullscreen(true);
    } else if state.maximized {
        let _ = window.maximize();
    }

    Ok(())
}

/// Add recent file
#[tauri::command]
pub async fn add_recent_file(
    app: AppHandle,
    path: String,
    file_type: String,
) -> Result<(), StorageError> {
    let mut settings = load_app_settings(app.clone()).await?;

    // Extract file name from path
    let name = std::path::Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());

    // Remove existing entry with same path
    settings.recent_files.retain(|f| f.path != path);

    // Add new entry at the beginning
    settings.recent_files.insert(
        0,
        RecentFile {
            path,
            name,
            file_type,
            accessed_at: chrono::Utc::now().timestamp(),
        },
    );

    // Keep only last 20 files
    settings.recent_files.truncate(20);

    save_app_settings(app, settings).await?;

    Ok(())
}

/// Clear recent files
#[tauri::command]
pub async fn clear_recent_files(app: AppHandle) -> Result<(), StorageError> {
    let mut settings = load_app_settings(app.clone()).await?;
    settings.recent_files.clear();
    save_app_settings(app, settings).await?;
    Ok(())
}

/// Get system info
#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, StorageError> {
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        tauri_version: tauri::VERSION.to_string(),
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub app_version: String,
    pub tauri_version: String,
}

/// Open file in system default app
#[tauri::command]
pub async fn open_path(path: String) -> Result<(), StorageError> {
    open::that(&path).map_err(|e| StorageError::Io(std::io::Error::other(e.to_string())))?;
    Ok(())
}

/// Reveal file in file manager
#[tauri::command]
pub async fn reveal_in_file_manager(path: String) -> Result<(), StorageError> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(StorageError::Io)?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(StorageError::Io)?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try common file managers
        let parent = std::path::Path::new(&path)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| path.clone());

        std::process::Command::new("xdg-open")
            .arg(&parent)
            .spawn()
            .map_err(StorageError::Io)?;
    }

    Ok(())
}
