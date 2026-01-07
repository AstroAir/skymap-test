//! App control commands for restart and quit functionality

use tauri::{AppHandle, Manager, Runtime};

#[tauri::command]
pub fn restart_app<R: Runtime>(app: AppHandle<R>) {
    log::info!("Restarting application...");
    app.restart();
}

#[tauri::command]
pub fn quit_app<R: Runtime>(app: AppHandle<R>, exit_code: Option<i32>) {
    let code = exit_code.unwrap_or(0);
    log::info!("Quitting application with exit code: {}", code);
    app.exit(code);
}

#[tauri::command]
pub async fn reload_webview<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    log::info!("Reloading webview...");
    if let Some(window) = app.get_webview_window("main") {
        window.eval("window.location.reload()").map_err(|e| format!("Failed to reload: {}", e))?;
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

#[tauri::command]
pub fn is_dev_mode() -> bool {
    cfg!(debug_assertions)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_dev_mode() {
        let result = is_dev_mode();
        #[cfg(debug_assertions)]
        assert!(result);
        #[cfg(not(debug_assertions))]
        assert!(!result);
    }

    #[test]
    fn test_is_dev_mode_consistency() {
        assert_eq!(is_dev_mode(), is_dev_mode());
    }
}
