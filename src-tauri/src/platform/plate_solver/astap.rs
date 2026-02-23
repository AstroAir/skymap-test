//! ASTAP plate solver integration.
//! Handles solving, INI/WCS parsing, database management, and image analysis.

use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};

use super::fits::{parse_fits_header_from_bytes, parse_ini_value, parse_value};
use super::helpers::get_default_index_path_internal;
use super::types::{
    AstapDatabaseInfo, AstrometryIndex, ImageAnalysisResult, PlateSolveResult,
    PlateSolverConfig, PlateSolverError, PlateSolverType, SolverConfig, StarDetection,
};
use super::ACTIVE_SOLVE_PID;

pub(super) async fn solve_with_astap(config: &PlateSolverConfig) -> Result<PlateSolveResult, PlateSolverError> {
    solve_with_astap_enhanced(config, None).await
}

pub(super) async fn solve_with_astap_enhanced(config: &PlateSolverConfig, solver_config: Option<&SolverConfig>) -> Result<PlateSolveResult, PlateSolverError> {
    let solvers = super::detect_plate_solvers().await?;
    let astap = solvers.iter().find(|s| matches!(s.solver_type, PlateSolverType::Astap))
        .ok_or(PlateSolverError::SolverNotInstalled("ASTAP".to_string()))?;

    let mut cmd = Command::new(&astap.path);
    cmd.arg("-f").arg(&config.image_path);

    // Core position hints
    if let Some(ra) = config.ra_hint { cmd.arg("-ra").arg(format!("{}", ra / 15.0)); }
    if let Some(dec) = config.dec_hint { cmd.arg("-spd").arg(format!("{}", dec + 90.0)); }
    if let Some(r) = config.radius_hint { cmd.arg("-r").arg(format!("{}", r)); }

    // Downsample factor (0=auto)
    if let Some(ds) = config.downsample {
        cmd.arg("-z").arg(format!("{}", ds));
    }

    // Write WCS output file for richer result parsing
    cmd.arg("-wcs");

    // Apply solver-specific settings from SolverConfig
    if let Some(sc) = solver_config {
        // ASTAP database selection
        if let Some(ref db) = sc.astap_database {
            if !db.is_empty() {
                cmd.arg("-D").arg(db);
            }
        }

        // Custom database path
        if let Some(ref idx_path) = sc.index_path {
            if !idx_path.is_empty() {
                cmd.arg("-d").arg(idx_path);
            }
        }

        // Max stars for quad building
        if sc.astap_max_stars > 0 && sc.astap_max_stars != 500 {
            cmd.arg("-s").arg(format!("{}", sc.astap_max_stars));
        }

        // Quad tolerance
        if sc.astap_tolerance > 0.0 && (sc.astap_tolerance - 0.007).abs() > 0.0001 {
            cmd.arg("-t").arg(format!("{}", sc.astap_tolerance));
        }

        // Minimum star size (filter hot pixels)
        if sc.astap_min_star_size > 0.0 && (sc.astap_min_star_size - 1.5).abs() > 0.01 {
            cmd.arg("-m").arg(format!("{}", sc.astap_min_star_size));
        }

        // Speed mode
        if sc.astap_speed_mode == "slow" {
            cmd.arg("-speed").arg("slow");
        }

        // SIP polynomial coefficients
        if !sc.use_sip {
            cmd.arg("-sip").arg("n");
        }

        // Equalise background
        if sc.astap_equalise_background {
            cmd.arg("-check").arg("y");
        }

        // Scale hints for non-FITS files
        if let Some(sl) = sc.astrometry_scale_low {
            if sl > 0.0 {
                cmd.arg("-fov").arg(format!("{}", sl));
            }
        }

        // Update original FITS header with solution
        if sc.keep_wcs_file {
            cmd.arg("-update");
        }
    }

    // Execute with timeout and cancellation support
    let timeout_secs = config.timeout_seconds.unwrap_or(120);
    let output = tokio::time::timeout(
        std::time::Duration::from_secs(timeout_secs as u64),
        tokio::task::spawn_blocking(move || {
            cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
            let child = cmd.spawn()?;
            // Store PID for cancel support
            {
                let mut guard = ACTIVE_SOLVE_PID.lock().unwrap();
                *guard = Some(child.id());
            }
            let result = child.wait_with_output();
            // Clear PID after completion
            {
                let mut guard = ACTIVE_SOLVE_PID.lock().unwrap();
                *guard = None;
            }
            result
        })
    ).await
    .map_err(|_| {
        // On timeout, also kill the process
        let pid = ACTIVE_SOLVE_PID.lock().unwrap().take();
        if let Some(pid) = pid {
            #[cfg(target_os = "windows")]
            { let _ = Command::new("taskkill").args(["/F", "/T", "/PID", &pid.to_string()]).output(); }
            #[cfg(not(target_os = "windows"))]
            { unsafe { libc::kill(pid as i32, libc::SIGTERM); } }
        }
        PlateSolverError::SolveFailed(format!("ASTAP solve timed out after {}s", timeout_secs))
    })?
    .map_err(|e| PlateSolverError::SolveFailed(format!("Task join error: {}", e)))?
    .map_err(PlateSolverError::Io)?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    // Try parsing INI output file first (more reliable than stdout)
    let ini_path = PathBuf::from(&config.image_path).with_extension("ini");
    let wcs_path = PathBuf::from(&config.image_path).with_extension("wcs");

    if ini_path.exists() {
        match parse_astap_ini_file(&ini_path) {
            Ok(result) => return Ok(result),
            Err(e) => log::warn!("Failed to parse ASTAP INI file: {}", e),
        }
    }

    // Try parsing WCS file
    if wcs_path.exists() {
        match parse_astap_wcs_file(&wcs_path) {
            Ok(result) => return Ok(result),
            Err(e) => log::warn!("Failed to parse ASTAP WCS file: {}", e),
        }
    }

    // Fall back to stdout parsing
    if output.status.success() && stdout.contains("Solution found") {
        parse_astap_result(&stdout)
    } else {
        let err_msg = if !stderr.is_empty() { stderr.to_string() } else { stdout.to_string() };
        Err(PlateSolverError::SolveFailed(err_msg))
    }
}

/// Parse ASTAP .ini output file for solve results
fn parse_astap_ini_file(ini_path: &PathBuf) -> Result<PlateSolveResult, PlateSolverError> {
    let content = fs::read_to_string(ini_path)
        .map_err(|e| PlateSolverError::SolveFailed(format!("Failed to read INI: {}", e)))?;

    let mut solved = false;
    let mut result = PlateSolveResult {
        success: false, ra: None, dec: None, rotation: None, scale: None,
        width_deg: None, height_deg: None, flipped: None, error_message: None, solve_time_ms: 0,
    };

    let mut cdelt1: Option<f64> = None;
    let mut cdelt2: Option<f64> = None;
    let mut crota1: Option<f64> = None;
    let mut crota2: Option<f64> = None;
    let mut naxis1: Option<f64> = None;
    let mut naxis2: Option<f64> = None;
    let mut cd1_1: Option<f64> = None;
    let mut cd1_2: Option<f64> = None;
    let mut cd2_1: Option<f64> = None;
    let mut cd2_2: Option<f64> = None;

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("PLTSOLVD") {
            solved = trimmed.contains("T");
        } else if trimmed.starts_with("CRVAL1") { result.ra = parse_ini_value(trimmed); }
        else if trimmed.starts_with("CRVAL2") { result.dec = parse_ini_value(trimmed); }
        else if trimmed.starts_with("CDELT1") { cdelt1 = parse_ini_value(trimmed); }
        else if trimmed.starts_with("CDELT2") { cdelt2 = parse_ini_value(trimmed); }
        else if trimmed.starts_with("CROTA1") { crota1 = parse_ini_value(trimmed); }
        else if trimmed.starts_with("CROTA2") { crota2 = parse_ini_value(trimmed); }
        else if trimmed.starts_with("NAXIS1") { naxis1 = parse_ini_value(trimmed); }
        else if trimmed.starts_with("NAXIS2") { naxis2 = parse_ini_value(trimmed); }
        else if trimmed.starts_with("CD1_1") { cd1_1 = parse_ini_value(trimmed); }
        else if trimmed.starts_with("CD1_2") { cd1_2 = parse_ini_value(trimmed); }
        else if trimmed.starts_with("CD2_1") { cd2_1 = parse_ini_value(trimmed); }
        else if trimmed.starts_with("CD2_2") { cd2_2 = parse_ini_value(trimmed); }
    }

    if !solved {
        return Err(PlateSolverError::SolveFailed("ASTAP INI reports PLTSOLVD=F".to_string()));
    }

    result.success = true;
    result.rotation = crota2.or(crota1);

    // Calculate pixel scale and flipped from CD matrix or CDELT
    if let (Some(c11), Some(c12), Some(c21), Some(c22)) = (cd1_1, cd1_2, cd2_1, cd2_2) {
        result.scale = Some((c11 * c11 + c21 * c21).sqrt() * 3600.0);
        if result.rotation.is_none() {
            result.rotation = Some(c21.atan2(c11).to_degrees());
        }
        let det = c11 * c22 - c12 * c21;
        result.flipped = Some(det > 0.0);
    } else if let Some(cd1) = cdelt1 {
        result.scale = Some(cd1.abs() * 3600.0);
        if let Some(cd2) = cdelt2 {
            result.flipped = Some((cd1 > 0.0 && cd2 > 0.0) || (cd1 < 0.0 && cd2 < 0.0));
        }
    }

    // Calculate FOV dimensions
    if let (Some(n1), Some(n2)) = (naxis1, naxis2) {
        if let (Some(c11), Some(c12), Some(c21), Some(c22)) = (cd1_1, cd1_2, cd2_1, cd2_2) {
            let scale_x = (c11 * c11 + c21 * c21).sqrt();
            let scale_y = (c12 * c12 + c22 * c22).sqrt();
            result.width_deg = Some(scale_x * n1);
            result.height_deg = Some(scale_y * n2);
        } else if let (Some(cd1), Some(cd2)) = (cdelt1, cdelt2) {
            result.width_deg = Some(cd1.abs() * n1);
            result.height_deg = Some(cd2.abs() * n2);
        }
    }

    Ok(result)
}

/// Parse ASTAP .wcs output file (FITS header format)
fn parse_astap_wcs_file(wcs_path: &PathBuf) -> Result<PlateSolveResult, PlateSolverError> {
    let data = fs::read(wcs_path)
        .map_err(|e| PlateSolverError::SolveFailed(format!("Failed to read WCS: {}", e)))?;

    let header_str = parse_fits_header_from_bytes(&data);
    parse_astap_result(&header_str)
}

pub(super) fn parse_astap_result(output: &str) -> Result<PlateSolveResult, PlateSolverError> {
    let mut result = PlateSolveResult {
        success: true, ra: None, dec: None, rotation: None, scale: None,
        width_deg: None, height_deg: None, flipped: None, error_message: None, solve_time_ms: 0,
    };

    let mut cdelt1: Option<f64> = None;
    let mut cdelt2: Option<f64> = None;
    let mut naxis1: Option<f64> = None;
    let mut naxis2: Option<f64> = None;
    let mut cd1_1: Option<f64> = None;
    let mut cd1_2: Option<f64> = None;
    let mut cd2_1: Option<f64> = None;
    let mut cd2_2: Option<f64> = None;

    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("CRVAL1") { result.ra = parse_value(trimmed); }
        else if trimmed.starts_with("CRVAL2") { result.dec = parse_value(trimmed); }
        else if trimmed.starts_with("CROTA2") { result.rotation = parse_value(trimmed); }
        else if trimmed.starts_with("CDELT1") { cdelt1 = parse_value(trimmed); }
        else if trimmed.starts_with("CDELT2") { cdelt2 = parse_value(trimmed); }
        else if trimmed.starts_with("NAXIS1") { naxis1 = parse_value(trimmed); }
        else if trimmed.starts_with("NAXIS2") { naxis2 = parse_value(trimmed); }
        else if trimmed.starts_with("CD1_1") { cd1_1 = parse_value(trimmed); }
        else if trimmed.starts_with("CD1_2") { cd1_2 = parse_value(trimmed); }
        else if trimmed.starts_with("CD2_1") { cd2_1 = parse_value(trimmed); }
        else if trimmed.starts_with("CD2_2") { cd2_2 = parse_value(trimmed); }
    }

    // Calculate pixel scale and rotation from CD matrix or CDELT
    if let (Some(c11), Some(c12), Some(c21), Some(c22)) = (cd1_1, cd1_2, cd2_1, cd2_2) {
        result.scale = Some((c11 * c11 + c21 * c21).sqrt() * 3600.0);
        if result.rotation.is_none() {
            result.rotation = Some(c21.atan2(c11).to_degrees());
        }
        // Detect flipped: determinant of CD matrix > 0 means parity is flipped
        let det = c11 * c22 - c12 * c21;
        result.flipped = Some(det > 0.0);
    } else if let Some(cd1) = cdelt1 {
        result.scale = Some(cd1.abs() * 3600.0);
        // Detect flipped from CDELT signs: normally CDELT1 < 0 and CDELT2 > 0
        if let Some(cd2) = cdelt2 {
            result.flipped = Some((cd1 > 0.0 && cd2 > 0.0) || (cd1 < 0.0 && cd2 < 0.0));
        }
    }

    // Calculate FOV dimensions
    if let (Some(n1), Some(n2)) = (naxis1, naxis2) {
        if let (Some(c11), Some(c12), Some(c21), Some(c22)) = (cd1_1, cd1_2, cd2_1, cd2_2) {
            let scale_x = (c11 * c11 + c21 * c21).sqrt();
            let scale_y = (c12 * c12 + c22 * c22).sqrt();
            result.width_deg = Some(scale_x * n1);
            result.height_deg = Some(scale_y * n2);
        } else if let (Some(cd1), Some(cd2)) = (cdelt1, cdelt2) {
            result.width_deg = Some(cd1.abs() * n1);
            result.height_deg = Some(cd2.abs() * n2);
        }
    }

    Ok(result)
}

// ============================================================================
// ASTAP Path and Version Helpers
// ============================================================================

pub fn get_astap_paths() -> Vec<String> {
    #[cfg(target_os = "windows")]
    { vec![
        r"C:\Program Files\astap\astap.exe".to_string(),
        r"C:\Program Files (x86)\astap\astap.exe".to_string(),
    ]}
    #[cfg(target_os = "macos")]
    { vec!["/Applications/ASTAP.app/Contents/MacOS/astap".to_string()] }
    #[cfg(target_os = "linux")]
    { vec!["/usr/bin/astap".to_string(), "/usr/local/bin/astap".to_string()] }
}

pub fn get_astap_version(path: &str) -> Option<String> {
    Command::new(path).arg("-v").output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
}

pub fn get_astap_index_path(astap_path: &str) -> Option<String> {
    PathBuf::from(astap_path).parent()
        .map(|p| p.join("data").to_string_lossy().to_string())
}

// ============================================================================
// ASTAP Index / Database Helpers
// ============================================================================

pub fn get_astap_indexes() -> Result<Vec<AstrometryIndex>, PlateSolverError> {
    let data_path = get_default_index_path_internal("astap");
    if let Some(path_str) = data_path {
        let path = PathBuf::from(&path_str);
        if path.exists() && path.is_dir() {
            let mut indexes = Vec::new();
            if let Ok(entries) = fs::read_dir(&path) {
                for entry in entries.flatten() {
                    let entry_path = entry.path();
                    let name = entry_path.file_stem()
                        .map(|s| s.to_string_lossy().to_lowercase())
                        .unwrap_or_default();
                    // ASTAP databases are directories or .1476 files matching d80/d50/d20/d05/g05/w08/v17/h17/h18/t2
                    if is_astap_database_file(&name) || (entry_path.is_dir() && is_astap_database_dir(&name)) {
                        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                        let (scale_low, scale_high) = get_astap_db_scale_range(&name);
                        indexes.push(AstrometryIndex {
                            name: name.clone(),
                            path: entry_path.to_string_lossy().to_string(),
                            scale_low,
                            scale_high,
                            size_mb: size / (1024 * 1024),
                        });
                    }
                }
            }
            return Ok(indexes);
        }
    }
    Ok(Vec::new())
}

fn is_astap_database_file(name: &str) -> bool {
    // ASTAP database files follow pattern like d80_*, d50_*, d20_*, d05_*, g05_*, etc.
    let prefixes = ["d80", "d50", "d20", "d05", "g05", "g17", "g18", "w08", "v17", "h17", "h18", "t2"];
    prefixes.iter().any(|p| name.starts_with(p))
}

fn is_astap_database_dir(name: &str) -> bool {
    is_astap_database_file(name)
}

fn get_astap_db_scale_range(name: &str) -> (f64, f64) {
    // FOV ranges for ASTAP databases (in degrees)
    if name.starts_with("d80") { (0.3, 10.0) }
    else if name.starts_with("d50") { (0.3, 10.0) }
    else if name.starts_with("d20") { (0.3, 10.0) }
    else if name.starts_with("d05") { (0.2, 5.0) }
    else if name.starts_with("g05") { (0.1, 2.0) }
    else if name.starts_with("g17") || name.starts_with("g18") { (0.1, 2.0) }
    else if name.starts_with("w08") { (0.5, 20.0) }
    else if name.starts_with("v17") { (0.5, 20.0) }
    else if name.starts_with("h17") || name.starts_with("h18") { (0.1, 5.0) }
    else { (0.3, 10.0) }
}

// ============================================================================
// ASTAP Database Management Commands
// ============================================================================

#[tauri::command]
pub async fn get_astap_databases() -> Result<Vec<AstapDatabaseInfo>, PlateSolverError> {
    let data_path = get_default_index_path_internal("astap");

    let db_definitions = vec![
        ("D80", "d80", 0.3, 10.0, "Star database magnitude 18, FOV 0.3°-10°, ~1.2GB", 1200, "https://github.com/han-k59/astap/releases/download/databases/d80_database.zip"),
        ("D50", "d50", 0.3, 10.0, "Star database magnitude 17, FOV 0.3°-10°, ~400MB", 400, "https://github.com/han-k59/astap/releases/download/databases/d50_database.zip"),
        ("D20", "d20", 0.3, 10.0, "Star database magnitude 15, FOV 0.3°-10°, ~100MB", 100, "https://github.com/han-k59/astap/releases/download/databases/d20_database.zip"),
        ("D05", "d05", 0.2, 5.0, "Star database magnitude 12, FOV 0.2°-5°, ~50MB", 50, "https://github.com/han-k59/astap/releases/download/databases/d05_database.zip"),
        ("G05", "g05", 0.1, 2.0, "Gaia DR2 database, deep sky, FOV 0.1°-2°, ~5GB", 5000, "https://github.com/han-k59/astap/releases/download/databases/g05_database.zip"),
        ("G17", "g17", 0.1, 2.0, "Gaia DR2 mag 17 database, ~2GB", 2000, "https://github.com/han-k59/astap/releases/download/databases/g17_database.zip"),
        ("G18", "g18", 0.1, 2.0, "Gaia DR2 mag 18 database, ~4GB", 4000, "https://github.com/han-k59/astap/releases/download/databases/g18_database.zip"),
        ("W08", "w08", 0.5, 20.0, "Wide field database, FOV 0.5°-20°, ~100MB", 100, "https://github.com/han-k59/astap/releases/download/databases/w08_database.zip"),
        ("V17", "v17", 0.5, 20.0, "V17 UCAC4 database, FOV 0.5°-20°, ~200MB", 200, "https://github.com/han-k59/astap/releases/download/databases/v17_database.zip"),
        ("H17", "h17", 0.1, 5.0, "H-alpha database mag 17, ~500MB", 500, "https://github.com/han-k59/astap/releases/download/databases/h17_database.zip"),
        ("H18", "h18", 0.1, 5.0, "H-alpha database mag 18, ~1GB", 1000, "https://github.com/han-k59/astap/releases/download/databases/h18_database.zip"),
    ];

    let mut databases = Vec::new();

    for (name, abbr, fov_min, fov_max, desc, size, url) in &db_definitions {
        let mut installed = false;
        let mut db_path = None;

        if let Some(ref dp) = data_path {
            let dir = PathBuf::from(dp);
            if dir.exists() {
                // Check if any files in the data dir start with this abbreviation
                if let Ok(entries) = fs::read_dir(&dir) {
                    for entry in entries.flatten() {
                        let fname = entry.file_name().to_string_lossy().to_lowercase();
                        if fname.starts_with(abbr) {
                            installed = true;
                            db_path = Some(dir.to_string_lossy().to_string());
                            break;
                        }
                    }
                }
            }
        }

        databases.push(AstapDatabaseInfo {
            name: name.to_string(),
            abbreviation: abbr.to_string(),
            installed,
            path: db_path,
            fov_min_deg: *fov_min,
            fov_max_deg: *fov_max,
            description: desc.to_string(),
            size_mb: *size,
            download_url: Some(url.to_string()),
        });
    }

    Ok(databases)
}

#[tauri::command]
pub async fn recommend_astap_database(fov_degrees: f64) -> Result<Vec<AstapDatabaseInfo>, PlateSolverError> {
    let all = get_astap_databases().await?;
    Ok(all.into_iter()
        .filter(|db| fov_degrees >= db.fov_min_deg && fov_degrees <= db.fov_max_deg)
        .collect())
}

// ============================================================================
// Image Analysis (ASTAP)
// ============================================================================

#[tauri::command]
pub async fn analyse_image(image_path: String, snr_minimum: Option<f64>) -> Result<ImageAnalysisResult, PlateSolverError> {
    if !PathBuf::from(&image_path).exists() {
        return Err(PlateSolverError::InvalidImage(format!("Image not found: {}", image_path)));
    }

    let solvers = super::detect_plate_solvers().await?;
    let astap = solvers.iter().find(|s| matches!(s.solver_type, PlateSolverType::Astap))
        .ok_or(PlateSolverError::SolverNotInstalled("ASTAP".to_string()))?;

    let astap_path = astap.path.clone();
    let snr = snr_minimum.unwrap_or(10.0);
    let img_path = image_path.clone();

    let output = tokio::task::spawn_blocking(move || {
        Command::new(&astap_path)
            .arg("-f").arg(&img_path)
            .arg("-analyse").arg(format!("{}", snr))
            .output()
    }).await
    .map_err(|e| PlateSolverError::SolveFailed(format!("Task join error: {}", e)))?
    .map_err(PlateSolverError::Io)?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();

    // Parse ASTAP analyse output
    let mut median_hfd = None;
    let mut star_count = 0u32;
    let mut background = None;

    for line in stdout.lines() {
        let trimmed = line.trim().to_lowercase();
        if trimmed.contains("hfd") {
            // Try to extract HFD value
            if let Some(val) = extract_float_after(&trimmed, "hfd") {
                median_hfd = Some(val);
            }
        }
        if trimmed.contains("stars") || trimmed.contains("star count") {
            if let Some(val) = extract_int_after(&trimmed, "star") {
                star_count = val;
            }
        }
        if trimmed.contains("background") {
            if let Some(val) = extract_float_after(&trimmed, "background") {
                background = Some(val);
            }
        }
    }

    // On Windows, ASTAP returns info via errorlevel: HFD*100M + star_count
    #[cfg(target_os = "windows")]
    if let Some(code) = output.status.code() {
        if code > 0 {
            let code_u64 = code as u64;
            let hfd_raw = code_u64 / 1_000_000;
            let stars_raw = code_u64 % 1_000_000;
            if median_hfd.is_none() && hfd_raw > 0 {
                median_hfd = Some(hfd_raw as f64 / 100.0);
            }
            if star_count == 0 && stars_raw > 0 {
                star_count = stars_raw as u32;
            }
        }
    }

    Ok(ImageAnalysisResult {
        success: median_hfd.is_some() || star_count > 0,
        median_hfd,
        star_count,
        background,
        noise: None,
        stars: Vec::new(),
        error_message: if median_hfd.is_none() && star_count == 0 {
            Some("Could not parse analysis output".to_string())
        } else {
            None
        },
    })
}

#[tauri::command]
pub async fn extract_stars(image_path: String, snr_minimum: Option<f64>, include_coordinates: bool) -> Result<ImageAnalysisResult, PlateSolverError> {
    if !PathBuf::from(&image_path).exists() {
        return Err(PlateSolverError::InvalidImage(format!("Image not found: {}", image_path)));
    }

    let solvers = super::detect_plate_solvers().await?;
    let astap = solvers.iter().find(|s| matches!(s.solver_type, PlateSolverType::Astap))
        .ok_or(PlateSolverError::SolverNotInstalled("ASTAP".to_string()))?;

    let astap_path = astap.path.clone();
    let snr = snr_minimum.unwrap_or(10.0);
    let img_path = image_path.clone();
    let extract_flag = if include_coordinates { "-extract2" } else { "-extract" };

    let output = tokio::task::spawn_blocking(move || {
        Command::new(&astap_path)
            .arg("-f").arg(&img_path)
            .arg(extract_flag).arg(format!("{}", snr))
            .output()
    }).await
    .map_err(|e| PlateSolverError::SolveFailed(format!("Task join error: {}", e)))?
    .map_err(PlateSolverError::Io)?;

    // Parse the CSV output file
    let csv_path = PathBuf::from(&image_path).with_extension("csv");
    let mut stars = Vec::new();

    if csv_path.exists() {
        if let Ok(csv_content) = fs::read_to_string(&csv_path) {
            for (i, line) in csv_content.lines().enumerate() {
                if i == 0 { continue; } // skip header
                let fields: Vec<&str> = line.split(',').collect();
                if fields.len() >= 5 {
                    let x = fields[0].trim().parse::<f64>().unwrap_or(0.0);
                    let y = fields[1].trim().parse::<f64>().unwrap_or(0.0);
                    let hfd = fields[2].trim().parse::<f64>().unwrap_or(0.0);
                    let flux = fields[3].trim().parse::<f64>().unwrap_or(0.0);
                    let snr_val = fields[4].trim().parse::<f64>().unwrap_or(0.0);

                    let (ra, dec) = if include_coordinates && fields.len() >= 7 {
                        (
                            fields[5].trim().parse::<f64>().ok(),
                            fields[6].trim().parse::<f64>().ok(),
                        )
                    } else {
                        (None, None)
                    };

                    stars.push(StarDetection {
                        x, y, hfd, flux, snr: snr_val, ra, dec, magnitude: None,
                    });
                }
            }
        }
    }

    // Calculate median HFD
    let median_hfd = if !stars.is_empty() {
        let mut hfds: Vec<f64> = stars.iter().map(|s| s.hfd).collect();
        hfds.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        Some(hfds[hfds.len() / 2])
    } else {
        None
    };

    let star_count = stars.len() as u32;

    Ok(ImageAnalysisResult {
        success: !stars.is_empty(),
        median_hfd,
        star_count,
        background: None,
        noise: None,
        stars,
        error_message: if star_count == 0 {
            Some(String::from_utf8_lossy(&output.stderr).to_string())
        } else {
            None
        },
    })
}

fn extract_float_after(text: &str, keyword: &str) -> Option<f64> {
    if let Some(pos) = text.find(keyword) {
        let after = &text[pos + keyword.len()..];
        for word in after.split_whitespace() {
            let cleaned: String = word.chars().filter(|c| c.is_ascii_digit() || *c == '.' || *c == '-').collect();
            if let Ok(v) = cleaned.parse::<f64>() {
                return Some(v);
            }
        }
    }
    None
}

fn extract_int_after(text: &str, keyword: &str) -> Option<u32> {
    if let Some(pos) = text.find(keyword) {
        let after = &text[pos + keyword.len()..];
        for word in after.split_whitespace() {
            let cleaned: String = word.chars().filter(|c| c.is_ascii_digit()).collect();
            if let Ok(v) = cleaned.parse::<u32>() {
                return Some(v);
            }
        }
    }
    None
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    const EPSILON: f64 = 1e-4;

    fn approx_eq(a: f64, b: f64) -> bool {
        (a - b).abs() < EPSILON
    }

    // ------------------------------------------------------------------------
    // Path Helper Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_get_astap_paths() {
        let paths = get_astap_paths();
        assert!(!paths.is_empty());
        for path in &paths {
            assert!(path.contains("astap"));
        }
    }

    #[test]
    fn test_get_astap_index_path() {
        #[cfg(target_os = "windows")]
        {
            let path = get_astap_index_path(r"C:\Program Files\astap\astap.exe");
            assert!(path.is_some());
            assert!(path.unwrap().contains("data"));
        }
        #[cfg(not(target_os = "windows"))]
        {
            let path = get_astap_index_path("/usr/bin/astap");
            assert!(path.is_some());
            assert!(path.unwrap().contains("data"));
        }
    }

    // ------------------------------------------------------------------------
    // parse_astap_result Tests (FITS header stdout format)
    // ------------------------------------------------------------------------

    #[test]
    fn test_parse_astap_result_with_cd_matrix() {
        let output = "\
CRVAL1  =        180.0000000 / RA center
CRVAL2  =         45.0000000 / DEC center
CD1_1   =      -0.0003000000 / scale
CD1_2   =       0.0000000000
CD2_1   =       0.0000000000
CD2_2   =       0.0003000000
NAXIS1  =               2000
NAXIS2  =               1500
";
        let result = parse_astap_result(output).unwrap();
        assert!(result.success);
        assert!(approx_eq(result.ra.unwrap(), 180.0));
        assert!(approx_eq(result.dec.unwrap(), 45.0));
        // scale = sqrt(cd1_1^2 + cd2_1^2) * 3600 = 0.0003 * 3600 = 1.08
        assert!(approx_eq(result.scale.unwrap(), 1.08));
        // flipped: det = cd1_1*cd2_2 - cd1_2*cd2_1 = -0.0003*0.0003 - 0 < 0 => false
        assert_eq!(result.flipped, Some(false));
        // FOV: scale_x * naxis1 = 0.0003 * 2000 = 0.6
        assert!(approx_eq(result.width_deg.unwrap(), 0.6));
        assert!(approx_eq(result.height_deg.unwrap(), 0.45));
    }

    #[test]
    fn test_parse_astap_result_with_cdelt() {
        let output = "\
CRVAL1  =        83.6330000 / RA
CRVAL2  =        22.0140000 / DEC
CDELT1  =      -0.0001200000
CDELT2  =       0.0001200000
CROTA2  =        1.50000000
NAXIS1  =               3000
NAXIS2  =               2000
";
        let result = parse_astap_result(output).unwrap();
        assert!(result.success);
        assert!(approx_eq(result.ra.unwrap(), 83.633));
        assert!(approx_eq(result.dec.unwrap(), 22.014));
        assert!(approx_eq(result.rotation.unwrap(), 1.5));
        // scale = |cdelt1| * 3600 = 0.00012 * 3600 = 0.432
        assert!(approx_eq(result.scale.unwrap(), 0.432));
        // flipped: cdelt1 < 0 and cdelt2 > 0 => (false && false) || (true && true) = true?
        // Actually: (cd1 > 0.0 && cd2 > 0.0) || (cd1 < 0.0 && cd2 < 0.0)
        // cd1 = -0.00012 (neg), cd2 = 0.00012 (pos) => false || false = false
        assert_eq!(result.flipped, Some(false));
        // FOV = |cdelt1| * naxis1 = 0.00012 * 3000 = 0.36
        assert!(approx_eq(result.width_deg.unwrap(), 0.36));
        assert!(approx_eq(result.height_deg.unwrap(), 0.24));
    }

    #[test]
    fn test_parse_astap_result_empty_output() {
        let result = parse_astap_result("").unwrap();
        assert!(result.success);
        assert!(result.ra.is_none());
        assert!(result.dec.is_none());
        assert!(result.scale.is_none());
    }

    #[test]
    fn test_parse_astap_result_flipped_image() {
        // Both CDELT positive => flipped
        let output = "\
CRVAL1  =        180.0
CRVAL2  =         45.0
CDELT1  =       0.0001
CDELT2  =       0.0001
";
        let result = parse_astap_result(output).unwrap();
        assert_eq!(result.flipped, Some(true));
    }

    // ------------------------------------------------------------------------
    // extract_float_after / extract_int_after Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_extract_float_after_basic() {
        assert!(approx_eq(extract_float_after("hfd 3.25 pixels", "hfd").unwrap(), 3.25));
    }

    #[test]
    fn test_extract_float_after_negative() {
        assert!(approx_eq(extract_float_after("offset -1.5 arcmin", "offset").unwrap(), -1.5));
    }

    #[test]
    fn test_extract_float_after_missing_keyword() {
        assert!(extract_float_after("no keyword here", "hfd").is_none());
    }

    #[test]
    fn test_extract_float_after_no_number() {
        assert!(extract_float_after("hfd unknown", "hfd").is_none());
    }

    #[test]
    fn test_extract_int_after_basic() {
        assert_eq!(extract_int_after("star count: 142 detected", "star").unwrap(), 142);
    }

    #[test]
    fn test_extract_int_after_missing_keyword() {
        assert!(extract_int_after("no keyword here", "star").is_none());
    }

    #[test]
    fn test_extract_int_after_no_number() {
        assert!(extract_int_after("star detection failed", "star").is_none());
    }

    // ------------------------------------------------------------------------
    // ASTAP Database Helpers Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_is_astap_database_file_valid() {
        assert!(is_astap_database_file("d80_stars"));
        assert!(is_astap_database_file("d50_index"));
        assert!(is_astap_database_file("d20_catalog"));
        assert!(is_astap_database_file("d05_data"));
        assert!(is_astap_database_file("g05_gaia"));
        assert!(is_astap_database_file("g17_dr2"));
        assert!(is_astap_database_file("g18_dr2"));
        assert!(is_astap_database_file("w08_wide"));
        assert!(is_astap_database_file("v17_ucac"));
        assert!(is_astap_database_file("h17_halpha"));
        assert!(is_astap_database_file("h18_halpha"));
        assert!(is_astap_database_file("t2_tycho"));
    }

    #[test]
    fn test_is_astap_database_file_invalid() {
        assert!(!is_astap_database_file("readme"));
        assert!(!is_astap_database_file("config.ini"));
        assert!(!is_astap_database_file(""));
        assert!(!is_astap_database_file("x99_unknown"));
    }

    #[test]
    fn test_get_astap_db_scale_range() {
        let (low, high) = get_astap_db_scale_range("d80_stars");
        assert!(approx_eq(low, 0.3));
        assert!(approx_eq(high, 10.0));

        let (low, high) = get_astap_db_scale_range("g05_gaia");
        assert!(approx_eq(low, 0.1));
        assert!(approx_eq(high, 2.0));

        let (low, high) = get_astap_db_scale_range("w08_wide");
        assert!(approx_eq(low, 0.5));
        assert!(approx_eq(high, 20.0));

        let (low, high) = get_astap_db_scale_range("h17_halpha");
        assert!(approx_eq(low, 0.1));
        assert!(approx_eq(high, 5.0));

        // Unknown defaults
        let (low, high) = get_astap_db_scale_range("unknown");
        assert!(approx_eq(low, 0.3));
        assert!(approx_eq(high, 10.0));
    }

    #[test]
    fn test_is_astap_database_dir_delegates() {
        // is_astap_database_dir delegates to is_astap_database_file
        assert!(is_astap_database_dir("d50_data"));
        assert!(!is_astap_database_dir("random_dir"));
    }
}
