//! Shared utility functions: path detection, coordinate formatting, solver validation.

use std::path::PathBuf;
use std::process::Command;

use super::types::{PlateSolverError, SolverInfo};

/// Get default index path for a given solver type (platform-specific)
pub fn get_default_index_path_internal(solver_type: &str) -> Option<String> {
    match solver_type.to_lowercase().as_str() {
        "astap" => {
            #[cfg(target_os = "windows")]
            { Some(r"C:\Program Files\astap\data".to_string()) }
            #[cfg(target_os = "macos")]
            { Some("/Applications/ASTAP.app/Contents/Resources/data".to_string()) }
            #[cfg(target_os = "linux")]
            { Some("/usr/share/astap/data".to_string()) }
        }
        "astrometry_net" | "astrometry" | "localastrometry" => {
            #[cfg(target_os = "windows")]
            { Some(r"C:\cygwin64\usr\share\astrometry".to_string()) }
            #[cfg(any(target_os = "macos", target_os = "linux"))]
            { Some("/usr/share/astrometry".to_string()) }
        }
        _ => None,
    }
}

#[tauri::command]
pub async fn get_default_index_path(solver_type: String) -> Result<Option<String>, PlateSolverError> {
    Ok(get_default_index_path_internal(&solver_type))
}

#[tauri::command]
pub async fn get_solver_info(solver_type: String) -> Result<SolverInfo, PlateSolverError> {
    let solvers = super::detect_plate_solvers().await?;
    solvers.into_iter()
        .find(|s| format!("{:?}", s.solver_type).to_lowercase() == solver_type.to_lowercase()
            || s.name.to_lowercase().contains(&solver_type.to_lowercase()))
        .ok_or(PlateSolverError::SolverNotInstalled(solver_type))
}

#[tauri::command]
pub async fn validate_solver_path(solver_type: String, path: String) -> Result<bool, PlateSolverError> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        return Ok(false);
    }
    
    // Try to run version command to validate
    let result = match solver_type.to_lowercase().as_str() {
        "astap" => Command::new(&path).arg("-v").output(),
        "astrometry_net" | "astrometry" => Command::new(&path).arg("--version").output(),
        _ => return Ok(false),
    };
    
    Ok(result.map(|o| o.status.success()).unwrap_or(false))
}

pub fn format_ra_hms(ra_deg: f64) -> String {
    let ra_hours = ra_deg / 15.0;
    let h = ra_hours.floor() as i32;
    let m_frac = (ra_hours - h as f64) * 60.0;
    let m = m_frac.floor() as i32;
    let s = (m_frac - m as f64) * 60.0;
    format!("{:02}h {:02}m {:05.2}s", h, m, s)
}

pub fn format_dec_dms(dec_deg: f64) -> String {
    let sign = if dec_deg >= 0.0 { "+" } else { "-" };
    let dec = dec_deg.abs();
    let d = dec.floor() as i32;
    let m_frac = (dec - d as f64) * 60.0;
    let m = m_frac.floor() as i32;
    let s = (m_frac - m as f64) * 60.0;
    format!("{}{}° {:02}' {:05.2}\"", sign, d, m, s)
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // ------------------------------------------------------------------------
    // Coordinate Formatting Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_format_ra_hms_zero() {
        let result = format_ra_hms(0.0);
        assert!(result.starts_with("00h 00m"), "0° should be 00h 00m, got {}", result);
    }

    #[test]
    fn test_format_ra_hms_180() {
        let result = format_ra_hms(180.0);
        assert!(result.starts_with("12h 00m"), "180° should be 12h 00m, got {}", result);
    }

    #[test]
    fn test_format_ra_hms_90() {
        let result = format_ra_hms(90.0);
        assert!(result.starts_with("06h 00m"), "90° should be 06h 00m, got {}", result);
    }

    #[test]
    fn test_format_ra_hms_with_minutes() {
        // 97.5° = 6.5h = 6h 30m
        let result = format_ra_hms(97.5);
        assert!(result.starts_with("06h 30m"), "97.5° should be 06h 30m, got {}", result);
    }

    #[test]
    fn test_format_dec_dms_zero() {
        let result = format_dec_dms(0.0);
        assert!(result.starts_with("+0°"), "0° should start with +0°, got {}", result);
    }

    #[test]
    fn test_format_dec_dms_positive() {
        let result = format_dec_dms(45.0);
        assert!(result.starts_with("+45°"), "45° should start with +45°, got {}", result);
    }

    #[test]
    fn test_format_dec_dms_negative() {
        let result = format_dec_dms(-45.0);
        assert!(result.starts_with("-45°"), "-45° should start with -45°, got {}", result);
    }

    #[test]
    fn test_format_dec_dms_with_minutes() {
        // 45.5° = 45° 30'
        let result = format_dec_dms(45.5);
        assert!(result.contains("30'"), "45.5° should have 30', got {}", result);
    }

    // ------------------------------------------------------------------------
    // Default Index Path Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_get_default_index_path_internal_astap() {
        let path = get_default_index_path_internal("astap");
        assert!(path.is_some());
        // Path should contain "astap" or "ASTAP"
        let path_str = path.unwrap().to_lowercase();
        assert!(path_str.contains("astap") || path_str.contains("data"));
    }

    #[test]
    fn test_get_default_index_path_internal_astrometry() {
        let path = get_default_index_path_internal("astrometry_net");
        assert!(path.is_some());
        let path_str = path.unwrap().to_lowercase();
        assert!(path_str.contains("astrometry"));
    }

    #[test]
    fn test_get_default_index_path_internal_unknown() {
        let path = get_default_index_path_internal("unknown_solver");
        assert!(path.is_none());
    }

    #[test]
    fn test_get_default_index_path_internal_case_insensitive() {
        assert!(get_default_index_path_internal("ASTAP").is_some());
        assert!(get_default_index_path_internal("Astap").is_some());
        assert!(get_default_index_path_internal("ASTROMETRY_NET").is_some());
    }

    #[test]
    fn test_get_default_index_path_internal_localastrometry_alias() {
        assert!(get_default_index_path_internal("localastrometry").is_some());
        assert!(get_default_index_path_internal("astrometry").is_some());
    }

    // ------------------------------------------------------------------------
    // Coordinate Formatting Edge Cases
    // ------------------------------------------------------------------------

    #[test]
    fn test_format_ra_hms_full_circle() {
        // 360° = 24h = wraps to 24h 00m (edge case)
        let result = format_ra_hms(360.0);
        assert!(result.starts_with("24h 00m"), "360° should be 24h 00m, got {}", result);
    }

    #[test]
    fn test_format_ra_hms_with_seconds() {
        // 15.5° = 1.0333h = 1h 02m 00s
        let result = format_ra_hms(15.5);
        assert!(result.starts_with("01h 02m"), "15.5° should be 01h 02m, got {}", result);
    }

    #[test]
    fn test_format_dec_dms_max() {
        let result = format_dec_dms(90.0);
        assert!(result.starts_with("+90°"), "90° should start with +90°, got {}", result);
    }

    #[test]
    fn test_format_dec_dms_min() {
        let result = format_dec_dms(-90.0);
        assert!(result.starts_with("-90°"), "-90° should start with -90°, got {}", result);
    }

    #[test]
    fn test_format_dec_dms_with_seconds() {
        // 45.5125° = 45° 30' 45"
        let result = format_dec_dms(45.5125);
        assert!(result.contains("30'"), "45.5125° should have 30', got {}", result);
        assert!(result.contains("45"), "45.5125° should have 45\", got {}", result);
    }
}
