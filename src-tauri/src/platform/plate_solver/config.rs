//! Solver configuration persistence: save and load solver config to/from disk.

use std::fs;
use std::path::PathBuf;

use tauri::AppHandle;

use super::types::{PlateSolverError, SolverConfig};

fn get_config_path(app: &AppHandle) -> Result<PathBuf, PlateSolverError> {
    let dir = super::super::path_config::resolve_data_dir(app)
        .map_err(|e| PlateSolverError::Io(std::io::Error::new(std::io::ErrorKind::NotFound, e.to_string())))?;
    if !dir.exists() { fs::create_dir_all(&dir)?; }
    Ok(dir.join("solver_config.json"))
}

#[tauri::command]
pub async fn save_solver_config(app: AppHandle, config: SolverConfig) -> Result<(), PlateSolverError> {
    let path = get_config_path(&app)?;
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| PlateSolverError::Io(std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string())))?;
    fs::write(&path, json)?;
    Ok(())
}

#[tauri::command]
pub async fn load_solver_config(app: AppHandle) -> Result<SolverConfig, PlateSolverError> {
    let path = get_config_path(&app)?;
    if !path.exists() {
        return Ok(SolverConfig::default());
    }
    let json = fs::read_to_string(&path)?;
    serde_json::from_str(&json)
        .map_err(|e| PlateSolverError::Io(std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string())))
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_solver_config_round_trip_serialization() {
        let config = SolverConfig {
            solver_type: "astap".to_string(),
            executable_path: Some("/usr/bin/astap".to_string()),
            index_path: Some("/data/astap".to_string()),
            timeout_seconds: 60,
            downsample: 2,
            search_radius: 15.0,
            use_sip: false,
            astap_database: Some("d50".to_string()),
            astap_max_stars: 1000,
            astap_tolerance: 0.01,
            astap_speed_mode: "slow".to_string(),
            astap_min_star_size: 2.0,
            astap_equalise_background: true,
            astrometry_scale_low: Some(0.5),
            astrometry_scale_high: Some(2.0),
            astrometry_scale_units: "arcsecperpix".to_string(),
            astrometry_depth: Some("1-50".to_string()),
            astrometry_no_plots: false,
            astrometry_no_verify: true,
            astrometry_crpix_center: false,
            keep_wcs_file: false,
            auto_hints: false,
            retry_on_failure: true,
            max_retries: 5,
        };

        let json = serde_json::to_string_pretty(&config).unwrap();
        let deserialized: SolverConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.solver_type, "astap");
        assert_eq!(deserialized.executable_path, Some("/usr/bin/astap".to_string()));
        assert_eq!(deserialized.timeout_seconds, 60);
        assert_eq!(deserialized.downsample, 2);
        assert!(!deserialized.use_sip);
        assert_eq!(deserialized.astap_database, Some("d50".to_string()));
        assert_eq!(deserialized.astap_max_stars, 1000);
        assert!(deserialized.astap_equalise_background);
        assert_eq!(deserialized.astrometry_scale_low, Some(0.5));
        assert!(!deserialized.astrometry_no_plots);
        assert!(deserialized.astrometry_no_verify);
        assert!(deserialized.retry_on_failure);
        assert_eq!(deserialized.max_retries, 5);
    }

    #[test]
    fn test_solver_config_default_round_trip() {
        let config = SolverConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: SolverConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.solver_type, config.solver_type);
        assert_eq!(deserialized.timeout_seconds, config.timeout_seconds);
        assert_eq!(deserialized.use_sip, config.use_sip);
        assert_eq!(deserialized.astap_max_stars, config.astap_max_stars);
    }

    #[test]
    fn test_solver_config_deserialization_from_partial_json() {
        // Ensure that missing optional fields with defaults are handled
        let json = r#"{
            "solver_type": "astrometry_net",
            "executable_path": null,
            "index_path": null,
            "timeout_seconds": 300,
            "downsample": 0,
            "search_radius": 30.0,
            "use_sip": true,
            "astap_database": null,
            "astap_max_stars": 500,
            "astap_tolerance": 0.007,
            "astap_speed_mode": "auto",
            "astap_min_star_size": 1.5,
            "astap_equalise_background": false,
            "astrometry_scale_low": null,
            "astrometry_scale_high": null,
            "astrometry_scale_units": "deg_width",
            "astrometry_depth": null,
            "astrometry_no_plots": true,
            "astrometry_no_verify": false,
            "astrometry_crpix_center": true,
            "keep_wcs_file": true,
            "auto_hints": true,
            "retry_on_failure": false,
            "max_retries": 2
        }"#;

        let config: SolverConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.solver_type, "astrometry_net");
        assert_eq!(config.timeout_seconds, 300);
        assert!(config.astrometry_scale_low.is_none());
    }
}
