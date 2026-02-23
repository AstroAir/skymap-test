//! Index management: definitions, listing, downloading, deleting, and recommending indexes.

use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Emitter};

use super::astrometry::{get_local_astrometry_indexes, parse_index_number};
use super::astap::get_astap_indexes;
use super::helpers::get_default_index_path_internal;
use super::types::{
    AstrometryIndex, DownloadableIndex, DownloadableIndexFull, IndexDownloadProgress, IndexInfo,
    PlateSolverError, PlateSolverType, ScaleRange,
};

// ============================================================================
// Astrometry 4100-series Index Definitions
// ============================================================================

#[derive(Debug, Clone, Copy)]
struct Astrometry4100IndexDef {
    name: &'static str,
    scale_low: f64,
    scale_high: f64,
    size_mb: u64,
}

fn astrometry_4100_index_definitions() -> &'static [Astrometry4100IndexDef] {
    // Official Astrometry.net 4100-series skymark diameters (arcminutes).
    // Reference: https://astrometry.net/doc/readme.html
    &[
        Astrometry4100IndexDef { name: "index-4107", scale_low: 22.0, scale_high: 30.0, size_mb: 158 },
        Astrometry4100IndexDef { name: "index-4108", scale_low: 30.0, scale_high: 42.0, size_mb: 91 },
        Astrometry4100IndexDef { name: "index-4109", scale_low: 42.0, scale_high: 60.0, size_mb: 48 },
        Astrometry4100IndexDef { name: "index-4110", scale_low: 60.0, scale_high: 85.0, size_mb: 24 },
        Astrometry4100IndexDef { name: "index-4111", scale_low: 85.0, scale_high: 120.0, size_mb: 10 },
        Astrometry4100IndexDef { name: "index-4112", scale_low: 120.0, scale_high: 170.0, size_mb: 6 },
        Astrometry4100IndexDef { name: "index-4113", scale_low: 170.0, scale_high: 240.0, size_mb: 3 },
        Astrometry4100IndexDef { name: "index-4114", scale_low: 240.0, scale_high: 340.0, size_mb: 2 },
        Astrometry4100IndexDef { name: "index-4115", scale_low: 340.0, scale_high: 480.0, size_mb: 1 },
        Astrometry4100IndexDef { name: "index-4116", scale_low: 480.0, scale_high: 680.0, size_mb: 1 },
        Astrometry4100IndexDef { name: "index-4117", scale_low: 680.0, scale_high: 1000.0, size_mb: 1 },
        Astrometry4100IndexDef { name: "index-4118", scale_low: 1000.0, scale_high: 1400.0, size_mb: 1 },
        Astrometry4100IndexDef { name: "index-4119", scale_low: 1400.0, scale_high: 2000.0, size_mb: 1 },
    ]
}

fn trim_float(value: f64) -> String {
    if value.fract() == 0.0 {
        format!("{:.0}", value)
    } else {
        format!("{:.1}", value)
    }
}

/// Parse index scale range from index name (e.g. "index-4107")
pub fn parse_index_scale(name: &str) -> Option<ScaleRange> {
    if let Some(index_number) = parse_index_number(name) {
        for def in astrometry_4100_index_definitions() {
            if parse_index_number(def.name) == Some(index_number) {
                return Some(ScaleRange {
                    min_arcmin: def.scale_low,
                    max_arcmin: def.scale_high,
                });
            }
        }
    }
    None
}

fn overlap_arcmin(a_min: f64, a_max: f64, b_min: f64, b_max: f64) -> f64 {
    (a_max.min(b_max) - a_min.max(b_min)).max(0.0)
}

// ============================================================================
// Tauri Commands
// ============================================================================

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
    astrometry_4100_index_definitions()
        .iter()
        .map(|def| DownloadableIndex {
            name: def.name.to_string(),
            url: format!("https://data.astrometry.net/4100/{}.fits", def.name),
            scale_low: def.scale_low,
            scale_high: def.scale_high,
            size_mb: def.size_mb,
            description: format!(
                "Skymark diameters {}-{} arcmin",
                trim_float(def.scale_low),
                trim_float(def.scale_high)
            ),
        })
        .collect()
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

#[tauri::command]
pub async fn get_recommended_indexes(solver_type: String, fov_degrees: f64) -> Result<Vec<DownloadableIndexFull>, PlateSolverError> {
    if !fov_degrees.is_finite() || fov_degrees <= 0.0 {
        return Ok(Vec::new());
    }

    let fov_arcmin = fov_degrees * 60.0;
    let desired_min = fov_arcmin * 0.1;
    let desired_max = fov_arcmin;
    let desired_width = (desired_max - desired_min).max(1e-9);
    let all_indexes = get_available_indexes(solver_type).await?;

    let mut ranked: Vec<(DownloadableIndexFull, f64, f64)> = all_indexes
        .into_iter()
        .filter_map(|idx| {
            let intersects = idx.scale_range.max_arcmin >= desired_min
                && idx.scale_range.min_arcmin <= desired_max;
            if !intersects {
                return None;
            }

            let overlap = overlap_arcmin(
                idx.scale_range.min_arcmin,
                idx.scale_range.max_arcmin,
                desired_min,
                desired_max,
            );

            let index_width = (idx.scale_range.max_arcmin - idx.scale_range.min_arcmin).max(1e-9);
            let coverage_in_target = overlap / desired_width;
            let coverage_in_index = overlap / index_width;
            let score = (coverage_in_target * 0.6) + (coverage_in_index * 0.4);
            let center = (idx.scale_range.min_arcmin + idx.scale_range.max_arcmin) / 2.0;
            let target_center = (desired_min + desired_max) / 2.0;
            let center_delta = (center - target_center).abs();
            Some((idx, score, center_delta))
        })
        .collect();

    ranked.sort_by(|a, b| {
        b.1.partial_cmp(&a.1)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.2.partial_cmp(&b.2).unwrap_or(std::cmp::Ordering::Equal))
            .then_with(|| {
                a.0.scale_range
                    .min_arcmin
                    .partial_cmp(&b.0.scale_range.min_arcmin)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
    });

    Ok(ranked.into_iter().map(|(idx, _, _)| idx).collect())
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
        assert!(approx_eq(scale.min_arcmin, 120.0));
        assert!(approx_eq(scale.max_arcmin, 170.0));
    }

    #[test]
    fn test_parse_index_scale_4119() {
        let scale = parse_index_scale("index-4119");
        assert!(scale.is_some());
        let scale = scale.unwrap();
        assert!(approx_eq(scale.min_arcmin, 1400.0));
        assert!(approx_eq(scale.max_arcmin, 2000.0));
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
    // DownloadableIndex Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_get_downloadable_indexes() {
        let indexes = get_downloadable_indexes();
        assert!(!indexes.is_empty());
        
        // Should have the full 4107..4119 set
        let names: Vec<&str> = indexes.iter().map(|i| i.name.as_str()).collect();
        assert!(names.contains(&"index-4107"));
        assert!(names.contains(&"index-4119"));
        assert_eq!(indexes.len(), 13);
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

    #[tokio::test]
    async fn test_get_recommended_indexes_for_two_degree_fov() {
        let recommended = get_recommended_indexes("astrometry_net".to_string(), 2.0).await.unwrap();
        let names: Vec<&str> = recommended.iter().map(|i| i.name.as_str()).collect();

        // 2° = 120 arcmin -> target skymark range is roughly 12..120 arcmin
        assert!(names.contains(&"index-4107"));
        assert!(names.contains(&"index-4110"));
        assert!(names.contains(&"index-4111"));
        assert!(names.contains(&"index-4112"));
        assert!(!names.contains(&"index-4118"));
        assert!(!names.contains(&"index-4119"));
    }

    #[tokio::test]
    async fn test_get_recommended_indexes_invalid_fov() {
        let r1 = get_recommended_indexes("astrometry_net".to_string(), 0.0).await.unwrap();
        assert!(r1.is_empty());

        let r2 = get_recommended_indexes("astrometry_net".to_string(), -1.0).await.unwrap();
        assert!(r2.is_empty());

        let r3 = get_recommended_indexes("astrometry_net".to_string(), f64::NAN).await.unwrap();
        assert!(r3.is_empty());

        let r4 = get_recommended_indexes("astrometry_net".to_string(), f64::INFINITY).await.unwrap();
        assert!(r4.is_empty());
    }

    #[tokio::test]
    async fn test_get_recommended_indexes_wide_field() {
        // 35° = 2100 arcmin -> desired range 210..2100 -> should include wide-field indexes
        let recommended = get_recommended_indexes("astrometry_net".to_string(), 35.0).await.unwrap();
        let names: Vec<&str> = recommended.iter().map(|i| i.name.as_str()).collect();
        assert!(names.contains(&"index-4119")); // 1400-2000 arcmin
        assert!(names.contains(&"index-4118")); // 1000-1400 arcmin
        // Should not include narrow-field indexes
        assert!(!names.contains(&"index-4107")); // 22-30 arcmin
    }

    // ------------------------------------------------------------------------
    // overlap_arcmin Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_overlap_arcmin_full_overlap() {
        // B is fully within A
        assert!(approx_eq(overlap_arcmin(0.0, 100.0, 20.0, 80.0), 60.0));
    }

    #[test]
    fn test_overlap_arcmin_partial() {
        assert!(approx_eq(overlap_arcmin(0.0, 50.0, 30.0, 100.0), 20.0));
    }

    #[test]
    fn test_overlap_arcmin_no_overlap() {
        assert!(approx_eq(overlap_arcmin(0.0, 10.0, 20.0, 30.0), 0.0));
    }

    #[test]
    fn test_overlap_arcmin_touching() {
        assert!(approx_eq(overlap_arcmin(0.0, 10.0, 10.0, 20.0), 0.0));
    }

    #[test]
    fn test_overlap_arcmin_identical() {
        assert!(approx_eq(overlap_arcmin(10.0, 50.0, 10.0, 50.0), 40.0));
    }

    // ------------------------------------------------------------------------
    // trim_float Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_trim_float_integer() {
        assert_eq!(trim_float(120.0), "120");
        assert_eq!(trim_float(0.0), "0");
        assert_eq!(trim_float(1400.0), "1400");
    }

    #[test]
    fn test_trim_float_fractional() {
        assert_eq!(trim_float(22.5), "22.5");
        assert_eq!(trim_float(0.3), "0.3");
    }

    // ------------------------------------------------------------------------
    // get_available_indexes Tests
    // ------------------------------------------------------------------------

    #[tokio::test]
    async fn test_get_available_indexes_has_solver_type() {
        let indexes = get_available_indexes("astap".to_string()).await.unwrap();
        assert!(!indexes.is_empty());
        for idx in &indexes {
            assert_eq!(idx.solver_type, "astap");
            assert!(!idx.download_url.is_empty());
            assert!(idx.size_bytes > 0);
        }
    }

    // ------------------------------------------------------------------------
    // delete_index Tests
    // ------------------------------------------------------------------------

    #[tokio::test]
    async fn test_delete_index_file() {
        let temp = std::env::temp_dir().join(format!(
            "skymap-delete-test-{}.fits",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos()
        ));
        std::fs::write(&temp, b"test").unwrap();
        assert!(temp.exists());

        delete_index(temp.to_string_lossy().to_string()).await.unwrap();
        assert!(!temp.exists());
    }

    #[tokio::test]
    async fn test_delete_index_nonexistent() {
        // Should not error on missing path
        let result = delete_index("/nonexistent/path/index.fits".to_string()).await;
        assert!(result.is_ok());
    }
}
