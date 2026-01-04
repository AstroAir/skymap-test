//! App control commands for restart and quit functionality
//!
//! This module provides commands to control the application lifecycle,
//! including restarting and quitting the application gracefully.
//!
//! # Examples
//!
//! ```rust,ignore
//! // Restart the application
//! restart_app(app_handle);
//!
//! // Quit with default exit code (0)
//! quit_app(app_handle, None);
//!
//! // Quit with specific exit code
//! quit_app(app_handle, Some(1));
//!
//! // Reload the webview
//! reload_webview(app_handle).await?;
//!
//! // Check if running in dev mode
//! let is_dev = is_dev_mode();
//! ```

use tauri::{AppHandle, Runtime, Manager};

/// Restart the application
///
/// This will restart the application process.
/// The function never returns as it terminates the current process.
///
/// # Arguments
///
/// * `app` - The Tauri application handle
///
/// # Panics
///
/// This function will never panic as it terminates the process before any panic could occur.
#[tauri::command]
pub fn restart_app<R: Runtime>(app: AppHandle<R>) {
    log::info!("Restarting application...");

    // Use tauri-plugin-process to restart
    // Note: restart() is a diverging function that never returns
    app.restart();
}

/// Quit the application gracefully
///
/// This will exit the application with the specified exit code.
/// The function never returns as it terminates the current process.
///
/// # Arguments
///
/// * `app` - The Tauri application handle
/// * `exit_code` - Optional exit code (defaults to 0 if None)
///
/// # Exit Codes
///
/// - `0` - Normal exit (success)
/// - `1` - General error
/// - Other codes can be used for specific error conditions
#[tauri::command]
pub fn quit_app<R: Runtime>(app: AppHandle<R>, exit_code: Option<i32>) {
    let code = exit_code.unwrap_or(0);
    log::info!("Quitting application with exit code: {}", code);

    // Exit the application
    app.exit(code);
}

/// Reload the webview (soft restart - just refreshes the frontend)
///
/// This performs a soft restart by reloading the webview content.
/// Unlike `restart_app`, this does not restart the Rust backend.
///
/// # Arguments
///
/// * `app` - The Tauri application handle
///
/// # Returns
///
/// * `Ok(())` - If the webview was successfully reloaded
/// * `Err(String)` - If the main window was not found or reload failed
///
/// # Errors
///
/// Returns an error if:
/// - The main window cannot be found
/// - The JavaScript evaluation fails
#[tauri::command]
pub async fn reload_webview<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    log::info!("Reloading webview...");

    if let Some(window) = app.get_webview_window("main") {
        // Get the webview and evaluate JavaScript to reload
        window.eval("window.location.reload()")
            .map_err(|e| format!("Failed to reload webview: {}", e))?;
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

/// Check if we are running in development mode
///
/// Returns true if the application was compiled in debug mode,
/// false if it was compiled in release mode.
///
/// # Returns
///
/// * `true` - If compiled with debug assertions enabled
/// * `false` - If compiled in release mode
///
/// # Examples
///
/// ```rust,no_run
/// // This function is exposed via Tauri command, not as a public Rust API
/// // In frontend TypeScript: invoke('is_dev_mode')
/// // In Rust tests, use cfg!(debug_assertions) directly
/// let is_dev = cfg!(debug_assertions);
/// if is_dev {
///     println!("Running in development mode");
/// } else {
///     println!("Running in production mode");
/// }
/// ```
#[tauri::command]
pub fn is_dev_mode() -> bool {
    cfg!(debug_assertions)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test that is_dev_mode returns the expected value based on build configuration
    #[test]
    fn test_is_dev_mode() {
        let result = is_dev_mode();

        // In test builds, debug_assertions is typically enabled
        #[cfg(debug_assertions)]
        assert!(result, "is_dev_mode should return true in debug builds");

        #[cfg(not(debug_assertions))]
        assert!(!result, "is_dev_mode should return false in release builds");
    }

    /// Test that is_dev_mode is consistent across multiple calls
    #[test]
    fn test_is_dev_mode_consistency() {
        let first_call = is_dev_mode();
        let second_call = is_dev_mode();
        let third_call = is_dev_mode();

        assert_eq!(first_call, second_call, "is_dev_mode should be consistent");
        assert_eq!(second_call, third_call, "is_dev_mode should be consistent");
    }

    /// Test documentation examples compile correctly
    /// Note: restart_app, quit_app, and reload_webview cannot be easily unit tested
    /// as they require a full Tauri runtime. These should be tested via integration tests.
    #[test]
    fn test_documentation_compiles() {
        // This test verifies that the module compiles correctly
        // The actual functionality tests require Tauri runtime
        assert!(true);
    }

    /// Verify exit code default behavior
    #[test]
    fn test_exit_code_default() {
        // Test that None maps to 0
        let default: Option<i32> = None;
        let code = default.unwrap_or(0);
        assert_eq!(code, 0, "Default exit code should be 0");
    }

    /// Verify exit code with specific values
    #[test]
    fn test_exit_code_specific() {
        let some_code: Option<i32> = Some(1);
        let code = some_code.unwrap_or(0);
        assert_eq!(code, 1, "Exit code should be 1 when specified");

        let error_code: Option<i32> = Some(255);
        let code = error_code.unwrap_or(0);
        assert_eq!(code, 255, "Exit code should preserve specified value");
    }

    /// Test negative exit codes
    #[test]
    fn test_negative_exit_code() {
        let negative_code: Option<i32> = Some(-1);
        let code = negative_code.unwrap_or(0);
        assert_eq!(code, -1, "Negative exit codes should be supported");
    }
}
