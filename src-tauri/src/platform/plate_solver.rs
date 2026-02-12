//! Plate solving module
//! Integrates with ASTAP and Astrometry.net for astronomical plate solving

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use tauri::{AppHandle, Emitter};

#[derive(Debug, thiserror::Error)]
pub enum PlateSolverError {
    #[error("No solver found")]
    NoSolverFound,
    #[error("Solver not installed: {0}")]
    SolverNotInstalled(String),
    #[error("Solve failed: {0}")]
    SolveFailed(String),
    #[error("Invalid image: {0}")]
    InvalidImage(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Download failed: {0}")]
    DownloadFailed(String),
}

impl Serialize for PlateSolverError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::Serializer {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PlateSolverType {
    Astap,
    AstrometryNet,
    LocalAstrometry,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolverInfo {
    pub solver_type: PlateSolverType,
    pub name: String,
    pub version: Option<String>,
    pub path: String,
    pub available: bool,
    pub index_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlateSolverConfig {
    pub solver_type: PlateSolverType,
    pub image_path: String,
    pub ra_hint: Option<f64>,
    pub dec_hint: Option<f64>,
    pub radius_hint: Option<f64>,
    pub scale_low: Option<f64>,
    pub scale_high: Option<f64>,
    pub downsample: Option<u32>,
    pub timeout_seconds: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlateSolveResult {
    pub success: bool,
    pub ra: Option<f64>,
    pub dec: Option<f64>,
    pub rotation: Option<f64>,
    pub scale: Option<f64>,
    pub width_deg: Option<f64>,
    pub height_deg: Option<f64>,
    pub flipped: Option<bool>,
    pub error_message: Option<String>,
    pub solve_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstrometryIndex {
    pub name: String,
    pub path: String,
    pub scale_low: f64,
    pub scale_high: f64,
    pub size_mb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadableIndex {
    pub name: String,
    pub url: String,
    pub scale_low: f64,
    pub scale_high: f64,
    pub size_mb: u64,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexDownloadProgress {
    pub index_name: String,
    pub downloaded: u64,
    pub total: u64,
    pub percent: f64,
}

#[tauri::command]
pub async fn detect_plate_solvers() -> Result<Vec<SolverInfo>, PlateSolverError> {
    let mut solvers = Vec::new();

    // Check for ASTAP
    let astap_paths = get_astap_paths();
    for path in astap_paths {
        if PathBuf::from(&path).exists() {
            let version = get_astap_version(&path);
            solvers.push(SolverInfo {
                solver_type: PlateSolverType::Astap,
                name: "ASTAP".to_string(),
                version,
                path: path.clone(),
                available: true,
                index_path: get_astap_index_path(&path),
            });
            break;
        }
    }

    // Check for local Astrometry.net
    let astrometry_paths = get_astrometry_paths();
    for path in astrometry_paths {
        if PathBuf::from(&path).exists() {
            let version = get_astrometry_version(&path);
            solvers.push(SolverInfo {
                solver_type: PlateSolverType::LocalAstrometry,
                name: "Astrometry.net (local)".to_string(),
                version,
                path: path.clone(),
                available: true,
                index_path: get_astrometry_index_path(),
            });
            break;
        }
    }

    // Always add online Astrometry.net as fallback
    solvers.push(SolverInfo {
        solver_type: PlateSolverType::AstrometryNet,
        name: "Astrometry.net (online)".to_string(),
        version: None,
        path: "https://nova.astrometry.net".to_string(),
        available: true,
        index_path: None,
    });

    Ok(solvers)
}

#[tauri::command]
pub async fn plate_solve(_app: AppHandle, config: PlateSolverConfig) -> Result<PlateSolveResult, PlateSolverError> {
    let start = std::time::Instant::now();

    // Verify image exists
    if !PathBuf::from(&config.image_path).exists() {
        return Err(PlateSolverError::InvalidImage(format!("Image not found: {}", config.image_path)));
    }

    let result = match config.solver_type {
        PlateSolverType::Astap => solve_with_astap(&config).await,
        PlateSolverType::LocalAstrometry => solve_with_local_astrometry(&config).await,
        PlateSolverType::AstrometryNet => solve_with_online_astrometry(&config).await,
    };

    match result {
        Ok(mut r) => {
            r.solve_time_ms = start.elapsed().as_millis() as u64;
            Ok(r)
        }
        Err(e) => Ok(PlateSolveResult {
            success: false, ra: None, dec: None, rotation: None, scale: None,
            width_deg: None, height_deg: None, flipped: None,
            error_message: Some(e.to_string()),
            solve_time_ms: start.elapsed().as_millis() as u64,
        }),
    }
}

#[tauri::command]
pub async fn get_solver_indexes(solver_type: PlateSolverType) -> Result<Vec<AstrometryIndex>, PlateSolverError> {
    match solver_type {
        PlateSolverType::Astap => get_astap_indexes(),
        PlateSolverType::LocalAstrometry => get_local_astrometry_indexes(),
        _ => Ok(Vec::new()),
    }
}

#[tauri::command]
pub fn get_downloadable_indexes() -> Vec<DownloadableIndex> {
    vec![
        DownloadableIndex {
            name: "index-4107".to_string(),
            url: "http://data.astrometry.net/4100/index-4107.fits".to_string(),
            scale_low: 22.0, scale_high: 30.0, size_mb: 2,
            description: "Wide field (22-30 arcmin/pixel)".to_string(),
        },
        DownloadableIndex {
            name: "index-4108".to_string(),
            url: "http://data.astrometry.net/4100/index-4108.fits".to_string(),
            scale_low: 16.0, scale_high: 22.0, size_mb: 5,
            description: "Medium-wide field (16-22 arcmin/pixel)".to_string(),
        },
        DownloadableIndex {
            name: "index-4109".to_string(),
            url: "http://data.astrometry.net/4100/index-4109.fits".to_string(),
            scale_low: 11.0, scale_high: 16.0, size_mb: 11,
            description: "Medium field (11-16 arcmin/pixel)".to_string(),
        },
        DownloadableIndex {
            name: "index-4110".to_string(),
            url: "http://data.astrometry.net/4100/index-4110.fits".to_string(),
            scale_low: 8.0, scale_high: 11.0, size_mb: 22,
            description: "Medium-narrow field (8-11 arcmin/pixel)".to_string(),
        },
        DownloadableIndex {
            name: "index-4111".to_string(),
            url: "http://data.astrometry.net/4100/index-4111.fits".to_string(),
            scale_low: 5.6, scale_high: 8.0, size_mb: 44,
            description: "Narrow field (5.6-8 arcmin/pixel)".to_string(),
        },
        DownloadableIndex {
            name: "index-4112".to_string(),
            url: "http://data.astrometry.net/4100/index-4112.fits".to_string(),
            scale_low: 4.0, scale_high: 5.6, size_mb: 88,
            description: "Very narrow field (4-5.6 arcmin/pixel)".to_string(),
        },
    ]
}

#[tauri::command]
pub async fn download_index(app: AppHandle, index: DownloadableIndex, dest_path: String) -> Result<(), PlateSolverError> {
    log::info!("Downloading index {} to {}", index.name, dest_path);

    let client = reqwest::Client::new();
    let response = client.get(&index.url).send().await
        .map_err(|e| PlateSolverError::DownloadFailed(e.to_string()))?;

    let total = response.content_length().unwrap_or(index.size_mb * 1024 * 1024);
    let mut downloaded = 0u64;

    let mut file = std::fs::File::create(&dest_path)?;
    let mut stream = response.bytes_stream();

    use futures_util::StreamExt;
    use std::io::Write;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| PlateSolverError::DownloadFailed(e.to_string()))?;
        file.write_all(&chunk)?;
        downloaded += chunk.len() as u64;

        let _ = app.emit("index-download-progress", IndexDownloadProgress {
            index_name: index.name.clone(),
            downloaded, total,
            percent: (downloaded as f64 / total as f64) * 100.0,
        });
    }

    log::info!("Index {} downloaded successfully", index.name);
    Ok(())
}

// Helper functions

fn get_astap_paths() -> Vec<String> {
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

fn get_astrometry_paths() -> Vec<String> {
    #[cfg(target_os = "windows")]
    { vec![r"C:\cygwin64\bin\solve-field.exe".to_string()] }
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    { vec!["/usr/bin/solve-field".to_string(), "/usr/local/bin/solve-field".to_string()] }
}

fn get_astap_version(path: &str) -> Option<String> {
    Command::new(path).arg("-v").output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
}

fn get_astrometry_version(path: &str) -> Option<String> {
    Command::new(path).arg("--version").output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").trim().to_string())
}

fn get_astap_index_path(astap_path: &str) -> Option<String> {
    PathBuf::from(astap_path).parent()
        .map(|p| p.join("data").to_string_lossy().to_string())
}

fn get_astrometry_index_path() -> Option<String> {
    #[cfg(target_os = "windows")]
    { Some(r"C:\cygwin64\usr\share\astrometry".to_string()) }
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    { Some("/usr/share/astrometry".to_string()) }
}

fn get_astap_indexes() -> Result<Vec<AstrometryIndex>, PlateSolverError> {
    // Simplified - would scan ASTAP data directory
    Ok(Vec::new())
}

fn get_local_astrometry_indexes() -> Result<Vec<AstrometryIndex>, PlateSolverError> {
    // Simplified - would scan Astrometry.net index directory
    Ok(Vec::new())
}

async fn solve_with_astap(config: &PlateSolverConfig) -> Result<PlateSolveResult, PlateSolverError> {
    let solvers = detect_plate_solvers().await?;
    let astap = solvers.iter().find(|s| matches!(s.solver_type, PlateSolverType::Astap))
        .ok_or(PlateSolverError::SolverNotInstalled("ASTAP".to_string()))?;

    let mut cmd = Command::new(&astap.path);
    cmd.arg("-f").arg(&config.image_path);

    if let Some(ra) = config.ra_hint { cmd.arg("-ra").arg(format!("{}", ra / 15.0)); }
    if let Some(dec) = config.dec_hint { cmd.arg("-spd").arg(format!("{}", dec + 90.0)); }
    if let Some(r) = config.radius_hint { cmd.arg("-r").arg(format!("{}", r)); }

    let output = cmd.output()?;
    let stdout = String::from_utf8_lossy(&output.stdout);

    if output.status.success() && stdout.contains("Solution found") {
        parse_astap_result(&stdout)
    } else {
        Err(PlateSolverError::SolveFailed(String::from_utf8_lossy(&output.stderr).to_string()))
    }
}

async fn solve_with_local_astrometry(config: &PlateSolverConfig) -> Result<PlateSolveResult, PlateSolverError> {
    let solvers = detect_plate_solvers().await?;
    let astrometry = solvers.iter().find(|s| matches!(s.solver_type, PlateSolverType::LocalAstrometry))
        .ok_or(PlateSolverError::SolverNotInstalled("Astrometry.net".to_string()))?;

    let mut cmd = Command::new(&astrometry.path);
    cmd.arg(&config.image_path).arg("--no-plots");

    if let Some(ra) = config.ra_hint { cmd.arg("--ra").arg(format!("{}", ra)); }
    if let Some(dec) = config.dec_hint { cmd.arg("--dec").arg(format!("{}", dec)); }
    if let Some(r) = config.radius_hint { cmd.arg("--radius").arg(format!("{}", r)); }

    let output = cmd.output()?;
    if output.status.success() {
        parse_astrometry_result(&config.image_path)
    } else {
        Err(PlateSolverError::SolveFailed(String::from_utf8_lossy(&output.stderr).to_string()))
    }
}

async fn solve_with_online_astrometry(_config: &PlateSolverConfig) -> Result<PlateSolveResult, PlateSolverError> {
    // Online solving would require API key and async upload
    Err(PlateSolverError::SolveFailed("Online solving not implemented".to_string()))
}

fn parse_astap_result(output: &str) -> Result<PlateSolveResult, PlateSolverError> {
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
            result.flipped = Some(cd1 > 0.0 && cd2 > 0.0 || cd1 < 0.0 && cd2 < 0.0);
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

fn parse_astrometry_result(image_path: &str) -> Result<PlateSolveResult, PlateSolverError> {
    let wcs_path = PathBuf::from(image_path).with_extension("wcs");
    if !wcs_path.exists() {
        return Err(PlateSolverError::SolveFailed("WCS file not found".to_string()));
    }

    // Parse the FITS WCS header from the .wcs file
    let data = fs::read(&wcs_path)
        .map_err(|e| PlateSolverError::SolveFailed(format!("Failed to read WCS file: {}", e)))?;

    let header_str = parse_fits_header_from_bytes(&data);

    let mut result = PlateSolveResult {
        success: true, ra: None, dec: None, rotation: None, scale: None,
        width_deg: None, height_deg: None, flipped: None, error_message: None, solve_time_ms: 0,
    };

    let mut cdelt1: Option<f64> = None;
    let mut cdelt2: Option<f64> = None;
    let mut crota2: Option<f64> = None;
    let mut naxis1: Option<f64> = None;
    let mut naxis2: Option<f64> = None;
    let mut cd1_1: Option<f64> = None;
    let mut cd1_2: Option<f64> = None;
    let mut cd2_1: Option<f64> = None;
    let mut cd2_2: Option<f64> = None;

    for line in header_str.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("CRVAL1") { result.ra = parse_value(trimmed); }
        else if trimmed.starts_with("CRVAL2") { result.dec = parse_value(trimmed); }
        else if trimmed.starts_with("CROTA2") { crota2 = parse_value(trimmed); }
        else if trimmed.starts_with("CDELT1") { cdelt1 = parse_value(trimmed); }
        else if trimmed.starts_with("CDELT2") { cdelt2 = parse_value(trimmed); }
        else if trimmed.starts_with("NAXIS1") { naxis1 = parse_value(trimmed); }
        else if trimmed.starts_with("NAXIS2") { naxis2 = parse_value(trimmed); }
        else if trimmed.starts_with("CD1_1") { cd1_1 = parse_value(trimmed); }
        else if trimmed.starts_with("CD1_2") { cd1_2 = parse_value(trimmed); }
        else if trimmed.starts_with("CD2_1") { cd2_1 = parse_value(trimmed); }
        else if trimmed.starts_with("CD2_2") { cd2_2 = parse_value(trimmed); }
    }

    // Calculate rotation and scale from CD matrix or CDELT+CROTA
    if let (Some(c11), Some(c12), Some(c21), Some(c22)) = (cd1_1, cd1_2, cd2_1, cd2_2) {
        result.scale = Some((c11 * c11 + c21 * c21).sqrt() * 3600.0);
        result.rotation = Some(c21.atan2(c11).to_degrees());
        // Detect flipped: determinant of CD matrix > 0 means parity is flipped
        let det = c11 * c22 - c12 * c21;
        result.flipped = Some(det > 0.0);
        // Calculate FOV
        if let (Some(n1), Some(n2)) = (naxis1, naxis2) {
            let scale_x = (c11 * c11 + c21 * c21).sqrt();
            let scale_y = (c12 * c12 + c22 * c22).sqrt();
            result.width_deg = Some(scale_x * n1);
            result.height_deg = Some(scale_y * n2);
        }
    } else if let Some(cd1) = cdelt1 {
        result.scale = Some(cd1.abs() * 3600.0);
        result.rotation = crota2;
        if let Some(cd2) = cdelt2 {
            result.flipped = Some(cd1 > 0.0 && cd2 > 0.0 || cd1 < 0.0 && cd2 < 0.0);
            if let (Some(n1), Some(n2)) = (naxis1, naxis2) {
                result.width_deg = Some(cd1.abs() * n1);
                result.height_deg = Some(cd2.abs() * n2);
            }
        }
    }

    Ok(result)
}

/// Parse FITS header cards from raw bytes into a string of "KEY = VALUE" lines
fn parse_fits_header_from_bytes(data: &[u8]) -> String {
    let mut result = String::new();
    let card_size = 80;
    let block_size = 2880;
    let max_blocks = 100;
    let mut offset = 0;
    let mut blocks = 0;

    while offset + card_size <= data.len() && blocks < max_blocks {
        let card = &data[offset..offset + card_size];
        // Convert bytes to string (ASCII)
        let card_str: String = card.iter().map(|&b| {
            if b >= 0x20 && b <= 0x7E { b as char } else { ' ' }
        }).collect();

        if card_str.trim_start().starts_with("END") && card_str[3..].trim().is_empty() {
            break;
        }

        result.push_str(&card_str);
        result.push('\n');

        offset += card_size;
        // Track block boundaries
        if offset % block_size == 0 {
            blocks += 1;
        }
    }

    result
}

fn parse_value(line: &str) -> Option<f64> {
    line.split('=').nth(1)?.split('/').next()?.trim().parse().ok()
}

// ============================================================================
// Additional commands required by frontend
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScaleRange {
    pub min_arcmin: f64,
    pub max_arcmin: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexInfo {
    pub name: String,
    pub file_name: String,
    pub path: String,
    pub size_bytes: u64,
    pub scale_range: Option<ScaleRange>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolverConfig {
    pub solver_type: String,
    pub executable_path: Option<String>,
    pub index_path: Option<String>,
    pub timeout_seconds: u32,
    pub downsample: u32,
    pub search_radius: f64,
    pub use_sip: bool,
    pub astap_database: Option<String>,
    pub astap_max_stars: u32,
    pub astap_tolerance: f64,
    pub astap_speed_mode: String,
    pub astap_min_star_size: f64,
    pub astap_equalise_background: bool,
    pub astrometry_scale_low: Option<f64>,
    pub astrometry_scale_high: Option<f64>,
    pub astrometry_scale_units: String,
    pub astrometry_depth: Option<String>,
    pub astrometry_no_plots: bool,
    pub astrometry_no_verify: bool,
    pub astrometry_crpix_center: bool,
    pub keep_wcs_file: bool,
    pub auto_hints: bool,
    pub retry_on_failure: bool,
    pub max_retries: u32,
}

impl Default for SolverConfig {
    fn default() -> Self {
        Self {
            solver_type: "astap".to_string(),
            executable_path: None,
            index_path: None,
            timeout_seconds: 120,
            downsample: 0,
            search_radius: 30.0,
            use_sip: true,
            astap_database: None,
            astap_max_stars: 500,
            astap_tolerance: 0.007,
            astap_speed_mode: "auto".to_string(),
            astap_min_star_size: 1.5,
            astap_equalise_background: false,
            astrometry_scale_low: None,
            astrometry_scale_high: None,
            astrometry_scale_units: "deg_width".to_string(),
            astrometry_depth: None,
            astrometry_no_plots: true,
            astrometry_no_verify: false,
            astrometry_crpix_center: true,
            keep_wcs_file: true,
            auto_hints: true,
            retry_on_failure: false,
            max_retries: 2,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolveParameters {
    pub image_path: String,
    pub ra_hint: Option<f64>,
    pub dec_hint: Option<f64>,
    pub fov_hint: Option<f64>,
    pub search_radius: Option<f64>,
    pub downsample: Option<u32>,
    pub timeout: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolveResult {
    pub success: bool,
    pub ra: Option<f64>,
    pub dec: Option<f64>,
    pub ra_hms: Option<String>,
    pub dec_dms: Option<String>,
    pub position_angle: Option<f64>,
    pub pixel_scale: Option<f64>,
    pub fov_width: Option<f64>,
    pub fov_height: Option<f64>,
    pub flipped: Option<bool>,
    pub solver_name: String,
    pub solve_time_ms: u64,
    pub error_message: Option<String>,
    pub wcs_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadableIndexFull {
    pub name: String,
    pub file_name: String,
    pub download_url: String,
    pub size_bytes: u64,
    pub scale_range: ScaleRange,
    pub description: String,
    pub solver_type: String,
}

use tauri::Manager;
use std::fs;

fn get_config_path(app: &AppHandle) -> Result<PathBuf, PlateSolverError> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|_| PlateSolverError::Io(std::io::Error::new(std::io::ErrorKind::NotFound, "App data dir not found")))?;
    let dir = app_data_dir.join("skymap");
    if !dir.exists() { fs::create_dir_all(&dir)?; }
    Ok(dir.join("solver_config.json"))
}

#[tauri::command]
pub async fn get_solver_info(solver_type: String) -> Result<SolverInfo, PlateSolverError> {
    let solvers = detect_plate_solvers().await?;
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

#[tauri::command]
pub async fn solve_image_local(config: SolverConfig, params: SolveParameters) -> Result<SolveResult, PlateSolverError> {
    let start = std::time::Instant::now();
    
    if !PathBuf::from(&params.image_path).exists() {
        return Err(PlateSolverError::InvalidImage(format!("Image not found: {}", params.image_path)));
    }

    let solver_config = PlateSolverConfig {
        solver_type: match config.solver_type.as_str() {
            "astap" => PlateSolverType::Astap,
            "astrometry_net" => PlateSolverType::LocalAstrometry,
            _ => PlateSolverType::AstrometryNet,
        },
        image_path: params.image_path.clone(),
        ra_hint: params.ra_hint,
        dec_hint: params.dec_hint,
        radius_hint: params.search_radius,
        scale_low: config.astrometry_scale_low,
        scale_high: config.astrometry_scale_high,
        downsample: Some(config.downsample),
        timeout_seconds: Some(config.timeout_seconds),
    };

    let result = match solver_config.solver_type {
        PlateSolverType::Astap => solve_with_astap(&solver_config).await,
        PlateSolverType::LocalAstrometry => solve_with_local_astrometry(&solver_config).await,
        PlateSolverType::AstrometryNet => solve_with_online_astrometry(&solver_config).await,
    };

    let solve_time_ms = start.elapsed().as_millis() as u64;

    match result {
        Ok(r) => Ok(SolveResult {
            success: r.success,
            ra: r.ra,
            dec: r.dec,
            ra_hms: r.ra.map(format_ra_hms),
            dec_dms: r.dec.map(format_dec_dms),
            position_angle: r.rotation,
            pixel_scale: r.scale,
            fov_width: r.width_deg,
            fov_height: r.height_deg,
            flipped: r.flipped,
            solver_name: config.solver_type.clone(),
            solve_time_ms,
            error_message: r.error_message,
            wcs_file: None,
        }),
        Err(e) => Ok(SolveResult {
            success: false,
            ra: None, dec: None, ra_hms: None, dec_dms: None,
            position_angle: None, pixel_scale: None, fov_width: None, fov_height: None,
            flipped: None,
            solver_name: config.solver_type,
            solve_time_ms,
            error_message: Some(e.to_string()),
            wcs_file: None,
        }),
    }
}

fn format_ra_hms(ra_deg: f64) -> String {
    let ra_hours = ra_deg / 15.0;
    let h = ra_hours.floor() as i32;
    let m_frac = (ra_hours - h as f64) * 60.0;
    let m = m_frac.floor() as i32;
    let s = (m_frac - m as f64) * 60.0;
    format!("{:02}h {:02}m {:05.2}s", h, m, s)
}

fn format_dec_dms(dec_deg: f64) -> String {
    let sign = if dec_deg >= 0.0 { "+" } else { "-" };
    let dec = dec_deg.abs();
    let d = dec.floor() as i32;
    let m_frac = (dec - d as f64) * 60.0;
    let m = m_frac.floor() as i32;
    let s = (m_frac - m as f64) * 60.0;
    format!("{}{}° {:02}' {:05.2}\"", sign, d, m, s)
}

#[tauri::command]
pub async fn get_available_indexes(solver_type: String) -> Result<Vec<DownloadableIndexFull>, PlateSolverError> {
    let indexes = get_downloadable_indexes();
    Ok(indexes.into_iter().map(|idx| DownloadableIndexFull {
        name: idx.name.clone(),
        file_name: format!("{}.fits", idx.name),
        download_url: idx.url,
        size_bytes: idx.size_mb * 1024 * 1024,
        scale_range: ScaleRange { min_arcmin: idx.scale_low, max_arcmin: idx.scale_high },
        description: idx.description,
        solver_type: solver_type.clone(),
    }).collect())
}

#[tauri::command]
pub async fn get_installed_indexes(solver_type: String, index_path: Option<String>) -> Result<Vec<IndexInfo>, PlateSolverError> {
    let path = index_path.or_else(|| get_default_index_path_internal(&solver_type));
    
    if let Some(path) = path {
        let path_buf = PathBuf::from(&path);
        if path_buf.exists() && path_buf.is_dir() {
            let mut indexes = Vec::new();
            if let Ok(entries) = fs::read_dir(&path_buf) {
                for entry in entries.flatten() {
                    let entry_path = entry.path();
                    if entry_path.extension().map(|e| e == "fits").unwrap_or(false) {
                        let name = entry_path.file_stem()
                            .map(|s| s.to_string_lossy().to_string())
                            .unwrap_or_default();
                        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                        indexes.push(IndexInfo {
                            name: name.clone(),
                            file_name: entry_path.file_name().map(|s| s.to_string_lossy().to_string()).unwrap_or_default(),
                            path: entry_path.to_string_lossy().to_string(),
                            size_bytes: size,
                            scale_range: parse_index_scale(&name),
                            description: None,
                        });
                    }
                }
            }
            return Ok(indexes);
        }
    }
    Ok(Vec::new())
}

fn parse_index_scale(name: &str) -> Option<ScaleRange> {
    // Parse scale from index name like "index-4107"
    if let Some(num_str) = name.strip_prefix("index-") {
        if let Ok(num) = num_str.parse::<u32>() {
            let scale = match num {
                4107 => Some((22.0, 30.0)),
                4108 => Some((16.0, 22.0)),
                4109 => Some((11.0, 16.0)),
                4110 => Some((8.0, 11.0)),
                4111 => Some((5.6, 8.0)),
                4112 => Some((4.0, 5.6)),
                4113 => Some((2.8, 4.0)),
                4114 => Some((2.0, 2.8)),
                4115 => Some((1.4, 2.0)),
                4116 => Some((1.0, 1.4)),
                4117 => Some((0.7, 1.0)),
                4118 => Some((0.5, 0.7)),
                4119 => Some((0.35, 0.5)),
                _ => None,
            };
            return scale.map(|(min, max)| ScaleRange { min_arcmin: min, max_arcmin: max });
        }
    }
    None
}

#[tauri::command]
pub async fn delete_index(path: String) -> Result<(), PlateSolverError> {
    let path_buf = PathBuf::from(&path);
    if path_buf.exists() {
        if path_buf.is_dir() {
            fs::remove_dir_all(&path_buf)?;
        } else {
            fs::remove_file(&path_buf)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn get_recommended_indexes(solver_type: String, fov_degrees: f64) -> Result<Vec<DownloadableIndexFull>, PlateSolverError> {
    let fov_arcmin = fov_degrees * 60.0;
    let all_indexes = get_available_indexes(solver_type).await?;
    
    Ok(all_indexes.into_iter()
        .filter(|idx| {
            let scale_mid = (idx.scale_range.min_arcmin + idx.scale_range.max_arcmin) / 2.0;
            // Recommend indexes where FOV is roughly 10-100x the scale
            fov_arcmin >= scale_mid * 10.0 && fov_arcmin <= scale_mid * 100.0
        })
        .collect())
}

fn get_default_index_path_internal(solver_type: &str) -> Option<String> {
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

    const EPSILON: f64 = 1e-4;

    fn approx_eq(a: f64, b: f64) -> bool {
        (a - b).abs() < EPSILON
    }

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
    // Index Scale Parsing Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_parse_index_scale_4107() {
        let scale = parse_index_scale("index-4107");
        assert!(scale.is_some());
        let scale = scale.unwrap();
        assert!(approx_eq(scale.min_arcmin, 22.0));
        assert!(approx_eq(scale.max_arcmin, 30.0));
    }

    #[test]
    fn test_parse_index_scale_4112() {
        let scale = parse_index_scale("index-4112");
        assert!(scale.is_some());
        let scale = scale.unwrap();
        assert!(approx_eq(scale.min_arcmin, 4.0));
        assert!(approx_eq(scale.max_arcmin, 5.6));
    }

    #[test]
    fn test_parse_index_scale_unknown() {
        let scale = parse_index_scale("index-9999");
        assert!(scale.is_none());
    }

    #[test]
    fn test_parse_index_scale_invalid_format() {
        assert!(parse_index_scale("invalid").is_none());
        assert!(parse_index_scale("").is_none());
        assert!(parse_index_scale("4107").is_none()); // Missing "index-" prefix
    }

    // ------------------------------------------------------------------------
    // PlateSolverType Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_plate_solver_type_serialization() {
        let solver = PlateSolverType::Astap;
        let json = serde_json::to_string(&solver).unwrap();
        assert_eq!(json, "\"astap\"");

        let solver = PlateSolverType::AstrometryNet;
        let json = serde_json::to_string(&solver).unwrap();
        assert_eq!(json, "\"astrometrynet\"");
    }

    #[test]
    fn test_plate_solver_type_deserialization() {
        let solver: PlateSolverType = serde_json::from_str("\"astap\"").unwrap();
        assert!(matches!(solver, PlateSolverType::Astap));
    }

    // ------------------------------------------------------------------------
    // SolverConfig Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_solver_config_default() {
        let config = SolverConfig::default();
        assert_eq!(config.solver_type, "astap");
        assert_eq!(config.timeout_seconds, 120);
        assert!(config.use_sip);
        assert!(config.astrometry_no_plots);
    }

    #[test]
    fn test_solver_config_serialization() {
        let config = SolverConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("\"solver_type\":\"astap\""));
        assert!(json.contains("\"timeout_seconds\":120"));
    }

    // ------------------------------------------------------------------------
    // PlateSolveResult Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_plate_solve_result_success() {
        let result = PlateSolveResult {
            success: true,
            ra: Some(180.0),
            dec: Some(45.0),
            rotation: Some(0.0),
            scale: Some(1.5),
            width_deg: Some(2.0),
            height_deg: Some(1.5),
            flipped: Some(false),
            error_message: None,
            solve_time_ms: 1000,
        };
        
        assert!(result.success);
        assert!(result.ra.is_some());
        assert!(result.error_message.is_none());
    }

    #[test]
    fn test_plate_solve_result_failure() {
        let result = PlateSolveResult {
            success: false,
            ra: None,
            dec: None,
            rotation: None,
            scale: None,
            width_deg: None,
            height_deg: None,
            flipped: None,
            error_message: Some("Solve failed".to_string()),
            solve_time_ms: 500,
        };
        
        assert!(!result.success);
        assert!(result.error_message.is_some());
    }

    // ------------------------------------------------------------------------
    // SolveResult Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_solve_result_serialization() {
        let result = SolveResult {
            success: true,
            ra: Some(180.0),
            dec: Some(45.0),
            ra_hms: Some("12h 00m 00s".to_string()),
            dec_dms: Some("+45° 00' 00\"".to_string()),
            position_angle: Some(0.0),
            pixel_scale: Some(1.5),
            fov_width: Some(2.0),
            fov_height: Some(1.5),
            flipped: Some(false),
            solver_name: "astap".to_string(),
            solve_time_ms: 1000,
            error_message: None,
            wcs_file: None,
        };
        
        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"success\":true"));
        assert!(json.contains("\"ra\":180"));
    }

    // ------------------------------------------------------------------------
    // DownloadableIndex Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_get_downloadable_indexes() {
        let indexes = get_downloadable_indexes();
        assert!(!indexes.is_empty());
        
        // Should have index-4107 to index-4112
        let names: Vec<&str> = indexes.iter().map(|i| i.name.as_str()).collect();
        assert!(names.contains(&"index-4107"));
        assert!(names.contains(&"index-4112"));
    }

    #[test]
    fn test_downloadable_index_structure() {
        let indexes = get_downloadable_indexes();
        
        for idx in &indexes {
            assert!(!idx.name.is_empty());
            assert!(!idx.url.is_empty());
            assert!(idx.scale_low < idx.scale_high);
            assert!(idx.size_mb > 0);
        }
    }

    // ------------------------------------------------------------------------
    // SolverInfo Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_solver_info_structure() {
        let info = SolverInfo {
            solver_type: PlateSolverType::Astap,
            name: "ASTAP".to_string(),
            version: Some("0.9.7".to_string()),
            path: "/usr/bin/astap".to_string(),
            available: true,
            index_path: Some("/data".to_string()),
        };
        
        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("ASTAP"));
        assert!(json.contains("0.9.7"));
    }

    // ------------------------------------------------------------------------
    // IndexInfo Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_index_info_structure() {
        let info = IndexInfo {
            name: "index-4107".to_string(),
            file_name: "index-4107.fits".to_string(),
            path: "/data/index-4107.fits".to_string(),
            size_bytes: 2 * 1024 * 1024,
            scale_range: Some(ScaleRange { min_arcmin: 22.0, max_arcmin: 30.0 }),
            description: Some("Wide field".to_string()),
        };
        
        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("index-4107"));
        assert!(json.contains("scale_range"));
    }

    // ------------------------------------------------------------------------
    // ScaleRange Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_scale_range_serialization() {
        let range = ScaleRange { min_arcmin: 4.0, max_arcmin: 5.6 };
        let json = serde_json::to_string(&range).unwrap();
        assert!(json.contains("4.0") || json.contains("4"));
        assert!(json.contains("5.6"));
    }

    // ------------------------------------------------------------------------
    // PlateSolverError Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_plate_solver_error_display() {
        let err = PlateSolverError::NoSolverFound;
        assert_eq!(format!("{}", err), "No solver found");
        
        let err = PlateSolverError::SolveFailed("Test error".to_string());
        assert!(format!("{}", err).contains("Test error"));
    }

    #[test]
    fn test_plate_solver_error_serialization() {
        let err = PlateSolverError::NoSolverFound;
        let json = serde_json::to_string(&err).unwrap();
        assert!(json.contains("No solver found"));
    }

    // ------------------------------------------------------------------------
    // Path Helper Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_get_astap_paths() {
        let paths = get_astap_paths();
        assert!(!paths.is_empty());
        // Just verify paths are reasonable strings
        for path in &paths {
            assert!(path.contains("astap"));
        }
    }

    #[test]
    fn test_get_astrometry_paths() {
        let paths = get_astrometry_paths();
        assert!(!paths.is_empty());
        for path in &paths {
            assert!(path.contains("solve-field"));
        }
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

    // ------------------------------------------------------------------------
    // Parse Value Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_parse_value_basic() {
        let value = parse_value("CRVAL1 = 180.0 / comment");
        assert!(value.is_some());
        assert!(approx_eq(value.unwrap(), 180.0));
    }

    #[test]
    fn test_parse_value_no_comment() {
        let value = parse_value("CRVAL2 = 45.5");
        assert!(value.is_some());
        assert!(approx_eq(value.unwrap(), 45.5));
    }

    #[test]
    fn test_parse_value_invalid() {
        assert!(parse_value("invalid").is_none());
        assert!(parse_value("KEY = abc").is_none());
    }

    // ------------------------------------------------------------------------
    // SolveParameters Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_solve_parameters_structure() {
        let params = SolveParameters {
            image_path: "/path/to/image.fits".to_string(),
            ra_hint: Some(180.0),
            dec_hint: Some(45.0),
            fov_hint: Some(2.0),
            search_radius: Some(10.0),
            downsample: Some(2),
            timeout: Some(60),
        };
        
        let json = serde_json::to_string(&params).unwrap();
        assert!(json.contains("image_path"));
        assert!(json.contains("ra_hint"));
    }

    // ------------------------------------------------------------------------
    // DownloadableIndexFull Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_downloadable_index_full_structure() {
        let idx = DownloadableIndexFull {
            name: "index-4107".to_string(),
            file_name: "index-4107.fits".to_string(),
            download_url: "http://example.com/index-4107.fits".to_string(),
            size_bytes: 2 * 1024 * 1024,
            scale_range: ScaleRange { min_arcmin: 22.0, max_arcmin: 30.0 },
            description: "Wide field".to_string(),
            solver_type: "astap".to_string(),
        };
        
        let json = serde_json::to_string(&idx).unwrap();
        assert!(json.contains("download_url"));
        assert!(json.contains("solver_type"));
    }

    // ------------------------------------------------------------------------
    // IndexDownloadProgress Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_index_download_progress_structure() {
        let progress = IndexDownloadProgress {
            index_name: "index-4107".to_string(),
            downloaded: 1024 * 1024,
            total: 2 * 1024 * 1024,
            percent: 50.0,
        };
        
        let json = serde_json::to_string(&progress).unwrap();
        assert!(json.contains("index_name"));
        assert!(json.contains("percent"));
    }
}
