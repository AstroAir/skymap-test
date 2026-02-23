//! Online Astrometry.net plate solver integration.
//! Handles the full online workflow: login, upload, polling, and result fetching.

use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Emitter};

use super::fits::{calculate_fov_from_wcs, parse_wcs_result_from_fits_bytes};
use super::types::{
    OnlineAnnotation, OnlineSolveConfig, OnlineSolveProgress, OnlineSolveResult,
    PlateSolveResult, PlateSolverConfig, PlateSolverError, WcsResult,
};

pub(super) async fn solve_with_online_astrometry(_config: &PlateSolverConfig) -> Result<PlateSolveResult, PlateSolverError> {
    // Basic online solving via PlateSolverConfig - for full online solving use solve_online command
    Err(PlateSolverError::SolveFailed(
        "Use solve_online command with OnlineSolveConfig for online solving".to_string()
    ))
}

#[tauri::command]
pub async fn solve_online(app: AppHandle, config: OnlineSolveConfig) -> Result<OnlineSolveResult, PlateSolverError> {
    let start = std::time::Instant::now();
    let base_url = config.base_url.clone().unwrap_or_else(|| "https://nova.astrometry.net".to_string());

    if !PathBuf::from(&config.image_path).exists() {
        return Err(PlateSolverError::InvalidImage(format!("Image not found: {}", config.image_path)));
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| PlateSolverError::SolveFailed(format!("HTTP client error: {}", e)))?;

    // Step 1: Login
    emit_progress(&app, "login", 0.0, "Authenticating...", None, None);
    let session_key = astrometry_login(&client, &base_url, &config.api_key).await?;

    // Step 2: Upload image
    emit_progress(&app, "upload", 10.0, "Uploading image...", None, None);
    let sub_id = astrometry_upload(&client, &base_url, &session_key, &config).await?;

    emit_progress(&app, "processing", 30.0, "Image uploaded, waiting for processing...", Some(sub_id), None);

    // Step 3: Poll submission status to get job_id
    let timeout = config.timeout_seconds.unwrap_or(300);
    let poll_start = std::time::Instant::now();
    let jid: u64 = loop {
        if poll_start.elapsed().as_secs() > timeout as u64 {
            return Err(PlateSolverError::SolveFailed("Online solve timed out".to_string()));
        }

        tokio::time::sleep(std::time::Duration::from_secs(5)).await;

        match astrometry_check_submission(&client, &base_url, sub_id).await {
            Ok(Some(job)) => {
                emit_progress(&app, "solving", 50.0, "Job started, solving...", Some(sub_id), Some(job));
                break job;
            }
            Ok(None) => {
                let elapsed = poll_start.elapsed().as_secs();
                let progress = 30.0 + (elapsed as f64 / timeout as f64) * 20.0;
                emit_progress(&app, "processing", progress.min(49.0), "Waiting for job...", Some(sub_id), None);
            }
            Err(e) => {
                log::warn!("Submission poll error: {}", e);
            }
        }
    };

    // Step 4: Poll job status
    loop {
        if poll_start.elapsed().as_secs() > timeout as u64 {
            return Err(PlateSolverError::SolveFailed("Online solve timed out".to_string()));
        }

        tokio::time::sleep(std::time::Duration::from_secs(5)).await;

        match astrometry_check_job(&client, &base_url, jid).await {
            Ok(status) => {
                match status.as_str() {
                    "success" => {
                        emit_progress(&app, "fetching", 80.0, "Solve complete, fetching results...", Some(sub_id), Some(jid));
                        break;
                    }
                    "failure" => {
                        return Err(PlateSolverError::SolveFailed("Astrometry.net solve failed".to_string()));
                    }
                    _ => {
                        let elapsed = poll_start.elapsed().as_secs();
                        let progress = 50.0 + (elapsed as f64 / timeout as f64) * 30.0;
                        emit_progress(&app, "solving", progress.min(79.0), &format!("Solving... ({})", status), Some(sub_id), Some(jid));
                    }
                }
            }
            Err(e) => log::warn!("Job poll error: {}", e),
        }
    }

    // Step 5: Get calibration results
    let calibration = astrometry_get_calibration(&client, &base_url, jid).await?;
    let objects = astrometry_get_objects_in_field(&client, &base_url, jid).await.unwrap_or_default();
    let annotations = astrometry_get_annotations(&client, &base_url, jid).await.unwrap_or_default();
    let wcs = astrometry_get_wcs(&client, &base_url, jid).await?;
    let (derived_fov_width, derived_fov_height) = calculate_fov_from_wcs(&wcs);
    let calibration_radius = calibration.get("radius").and_then(|v| v.as_f64());
    let fov_width = derived_fov_width.or_else(|| calibration_radius.map(|r| r * 2.0));
    let fov_height = derived_fov_height.or_else(|| calibration_radius.map(|r| r * 2.0));

    emit_progress(&app, "complete", 100.0, "Solve complete!", Some(sub_id), Some(jid));

    let solve_time_ms = start.elapsed().as_millis() as u64;

    Ok(OnlineSolveResult {
        success: true,
        ra: calibration.get("ra").and_then(|v| v.as_f64()),
        dec: calibration.get("dec").and_then(|v| v.as_f64()),
        orientation: calibration.get("orientation").and_then(|v| v.as_f64()),
        pixscale: calibration.get("pixscale").and_then(|v| v.as_f64()),
        radius: calibration_radius,
        parity: calibration.get("parity").and_then(|v| v.as_f64()),
        fov_width,
        fov_height,
        objects_in_field: objects,
        annotations,
        job_id: Some(jid),
        wcs: Some(wcs),
        solve_time_ms,
        error_message: None,
    })
}

fn emit_progress(app: &AppHandle, stage: &str, progress: f64, message: &str, sub_id: Option<u64>, job_id: Option<u64>) {
    let _ = app.emit("astrometry-progress", OnlineSolveProgress {
        stage: stage.to_string(),
        progress,
        message: message.to_string(),
        sub_id,
        job_id,
    });
}

async fn astrometry_login(client: &reqwest::Client, base_url: &str, api_key: &str) -> Result<String, PlateSolverError> {
    let url = format!("{}/api/login", base_url);
    let body = serde_json::json!({ "apikey": api_key });

    let resp = client.post(&url)
        .form(&[("request-json", serde_json::to_string(&body).unwrap())])
        .send().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Login request failed: {}", e)))?;

    let json: serde_json::Value = resp.json().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Login response parse failed: {}", e)))?;

    if json.get("status").and_then(|v| v.as_str()) == Some("success") {
        json.get("session").and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| PlateSolverError::SolveFailed("No session key in login response".to_string()))
    } else {
        let err = json.get("errormessage").and_then(|v| v.as_str()).unwrap_or("Unknown login error");
        Err(PlateSolverError::SolveFailed(format!("Login failed: {}", err)))
    }
}

async fn astrometry_upload(client: &reqwest::Client, base_url: &str, session_key: &str, config: &OnlineSolveConfig) -> Result<u64, PlateSolverError> {
    let url = format!("{}/api/upload", base_url);

    let mut settings = serde_json::json!({
        "session": session_key,
        "allow_commercial_use": "n",
        "allow_modifications": "n",
        "publicly_visible": if config.publicly_visible.unwrap_or(false) { "y" } else { "n" },
    });

    if let Some(ra) = config.ra_hint {
        settings["center_ra"] = serde_json::json!(ra);
    }
    if let Some(dec) = config.dec_hint {
        settings["center_dec"] = serde_json::json!(dec);
    }
    if let Some(r) = config.radius {
        settings["radius"] = serde_json::json!(r);
    }
    if let Some(ref units) = config.scale_units {
        settings["scale_units"] = serde_json::json!(units);
    }
    if let Some(sl) = config.scale_lower {
        settings["scale_lower"] = serde_json::json!(sl);
    }
    if let Some(su) = config.scale_upper {
        settings["scale_upper"] = serde_json::json!(su);
    }
    if let Some(se) = config.scale_est {
        settings["scale_est"] = serde_json::json!(se);
    }
    if let Some(serr) = config.scale_err {
        settings["scale_err"] = serde_json::json!(serr);
    }
    if let Some(ds) = config.downsample_factor {
        settings["downsample_factor"] = serde_json::json!(ds);
    }
    if let Some(tw) = config.tweak_order {
        settings["tweak_order"] = serde_json::json!(tw);
    }
    if let Some(cc) = config.crpix_center {
        settings["crpix_center"] = serde_json::json!(cc);
    }
    if let Some(p) = config.parity {
        settings["parity"] = serde_json::json!(p);
    }

    let file_bytes = fs::read(&config.image_path)
        .map_err(|e| PlateSolverError::InvalidImage(format!("Failed to read image: {}", e)))?;

    let file_name = PathBuf::from(&config.image_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "image.fits".to_string());

    let file_part = reqwest::multipart::Part::bytes(file_bytes)
        .file_name(file_name)
        .mime_str("application/octet-stream")
        .map_err(|e| PlateSolverError::SolveFailed(format!("MIME error: {}", e)))?;

    let form = reqwest::multipart::Form::new()
        .text("request-json", serde_json::to_string(&settings).unwrap())
        .part("file", file_part);

    let resp = client.post(&url)
        .multipart(form)
        .send().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Upload failed: {}", e)))?;

    let json: serde_json::Value = resp.json().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Upload response parse failed: {}", e)))?;

    if json.get("status").and_then(|v| v.as_str()) == Some("success") {
        json.get("subid").and_then(|v| v.as_u64())
            .ok_or_else(|| PlateSolverError::SolveFailed("No submission ID in upload response".to_string()))
    } else {
        let err = json.get("errormessage").and_then(|v| v.as_str()).unwrap_or("Unknown upload error");
        Err(PlateSolverError::SolveFailed(format!("Upload failed: {}", err)))
    }
}

async fn astrometry_check_submission(client: &reqwest::Client, base_url: &str, sub_id: u64) -> Result<Option<u64>, PlateSolverError> {
    let url = format!("{}/api/submissions/{}", base_url, sub_id);
    let resp = client.get(&url).send().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Submission check failed: {}", e)))?;

    let json: serde_json::Value = resp.json().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Parse failed: {}", e)))?;

    // Check if jobs array has a non-null entry
    if let Some(jobs) = json.get("jobs").and_then(|v| v.as_array()) {
        for job in jobs {
            if let Some(jid) = job.as_u64() {
                return Ok(Some(jid));
            }
        }
    }
    Ok(None)
}

async fn astrometry_check_job(client: &reqwest::Client, base_url: &str, job_id: u64) -> Result<String, PlateSolverError> {
    let url = format!("{}/api/jobs/{}", base_url, job_id);
    let resp = client.get(&url).send().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Job check failed: {}", e)))?;

    let json: serde_json::Value = resp.json().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Parse failed: {}", e)))?;

    json.get("status").and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| PlateSolverError::SolveFailed("No status in job response".to_string()))
}

async fn astrometry_get_calibration(client: &reqwest::Client, base_url: &str, job_id: u64) -> Result<serde_json::Value, PlateSolverError> {
    let url = format!("{}/api/jobs/{}/calibration/", base_url, job_id);
    let resp = client.get(&url).send().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Calibration fetch failed: {}", e)))?;

    resp.json().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Calibration parse failed: {}", e)))
}

async fn astrometry_get_objects_in_field(client: &reqwest::Client, base_url: &str, job_id: u64) -> Result<Vec<String>, PlateSolverError> {
    let url = format!("{}/api/jobs/{}/objects_in_field/", base_url, job_id);
    let resp = client.get(&url).send().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Objects fetch failed: {}", e)))?;

    let json: serde_json::Value = resp.json().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Objects parse failed: {}", e)))?;

    Ok(json.get("objects_in_field")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
        .unwrap_or_default())
}

async fn astrometry_get_annotations(client: &reqwest::Client, base_url: &str, job_id: u64) -> Result<Vec<OnlineAnnotation>, PlateSolverError> {
    let url = format!("{}/api/jobs/{}/annotations/", base_url, job_id);
    let resp = client.get(&url).send().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Annotations fetch failed: {}", e)))?;

    let json: serde_json::Value = resp.json().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("Annotations parse failed: {}", e)))?;

    let mut annotations = Vec::new();
    if let Some(arr) = json.get("annotations").and_then(|v| v.as_array()) {
        for ann in arr {
            let names: Vec<String> = ann.get("names")
                .and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
                .unwrap_or_default();

            annotations.push(OnlineAnnotation {
                names,
                annotation_type: ann.get("type").and_then(|v| v.as_str()).unwrap_or("unknown").to_string(),
                pixelx: ann.get("pixelx").and_then(|v| v.as_f64()).unwrap_or(0.0),
                pixely: ann.get("pixely").and_then(|v| v.as_f64()).unwrap_or(0.0),
                radius: ann.get("radius").and_then(|v| v.as_f64()).unwrap_or(0.0),
            });
        }
    }

    Ok(annotations)
}

async fn astrometry_get_wcs(client: &reqwest::Client, base_url: &str, job_id: u64) -> Result<WcsResult, PlateSolverError> {
    let url = format!("{}/wcs_file/{}", base_url, job_id);
    let resp = client.get(&url).send().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("WCS fetch failed: {}", e)))?;

    if !resp.status().is_success() {
        return Err(PlateSolverError::SolveFailed(format!(
            "WCS fetch failed with status {}",
            resp.status()
        )));
    }

    let bytes = resp.bytes().await
        .map_err(|e| PlateSolverError::SolveFailed(format!("WCS bytes read failed: {}", e)))?;

    parse_wcs_result_from_fits_bytes(&bytes)
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::types::{PlateSolverConfig, PlateSolverType};

    #[test]
    fn test_online_solve_config_serialization() {
        let config = OnlineSolveConfig {
            api_key: "test_key".to_string(),
            image_path: "/path/to/image.fits".to_string(),
            base_url: Some("https://nova.astrometry.net".to_string()),
            ra_hint: Some(180.0),
            dec_hint: Some(45.0),
            radius: Some(5.0),
            scale_units: Some("degwidth".to_string()),
            scale_lower: Some(0.5),
            scale_upper: Some(2.0),
            scale_est: None,
            scale_err: None,
            downsample_factor: Some(2),
            tweak_order: Some(2),
            crpix_center: Some(true),
            parity: None,
            timeout_seconds: Some(300),
            publicly_visible: Some(false),
        };

        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("test_key"));
        assert!(json.contains("nova.astrometry.net"));
        assert!(json.contains("180"));

        // Round-trip
        let deserialized: OnlineSolveConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.api_key, "test_key");
        assert_eq!(deserialized.ra_hint, Some(180.0));
        assert_eq!(deserialized.timeout_seconds, Some(300));
    }

    #[test]
    fn test_online_solve_result_structure() {
        let result = OnlineSolveResult {
            success: true,
            ra: Some(83.633),
            dec: Some(22.014),
            orientation: Some(45.0),
            pixscale: Some(1.2),
            radius: Some(0.5),
            parity: Some(1.0),
            fov_width: Some(0.6),
            fov_height: Some(0.4),
            objects_in_field: vec!["M42".to_string(), "NGC 1976".to_string()],
            annotations: vec![OnlineAnnotation {
                names: vec!["M42".to_string()],
                annotation_type: "nebula".to_string(),
                pixelx: 500.0,
                pixely: 400.0,
                radius: 30.0,
            }],
            job_id: Some(12345),
            wcs: None,
            solve_time_ms: 5000,
            error_message: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("M42"));
        assert!(json.contains("\"success\":true"));
        assert!(json.contains("12345"));
    }

    #[test]
    fn test_online_solve_progress_serialization() {
        let progress = OnlineSolveProgress {
            stage: "solving".to_string(),
            progress: 50.0,
            message: "Job started".to_string(),
            sub_id: Some(100),
            job_id: Some(200),
        };

        let json = serde_json::to_string(&progress).unwrap();
        assert!(json.contains("solving"));
        assert!(json.contains("50"));
    }

    #[test]
    fn test_online_annotation_serialization() {
        let ann = OnlineAnnotation {
            names: vec!["NGC 7000".to_string(), "North America Nebula".to_string()],
            annotation_type: "nebula".to_string(),
            pixelx: 1024.5,
            pixely: 768.3,
            radius: 50.0,
        };

        let json = serde_json::to_string(&ann).unwrap();
        let deserialized: OnlineAnnotation = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.names.len(), 2);
        assert_eq!(deserialized.annotation_type, "nebula");
    }

    #[tokio::test]
    async fn test_solve_with_online_astrometry_returns_error() {
        let config = PlateSolverConfig {
            solver_type: PlateSolverType::AstrometryNet,
            image_path: "/fake/image.fits".to_string(),
            ra_hint: None,
            dec_hint: None,
            radius_hint: None,
            scale_low: None,
            scale_high: None,
            downsample: None,
            timeout_seconds: None,
        };
        let result = solve_with_online_astrometry(&config).await;
        assert!(result.is_err());
        let err_msg = result.unwrap_err().to_string();
        assert!(err_msg.contains("solve_online"), "Error should mention solve_online command, got: {}", err_msg);
    }
}
