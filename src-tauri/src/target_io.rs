//! Target list import/export module
//! Supports CSV, Stellarium, and other common formats

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::storage::StorageError;

/// Target item for import/export
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetExportItem {
    pub name: String,
    pub ra: f64,             // degrees
    pub dec: f64,            // degrees
    pub ra_string: String,   // formatted RA
    pub dec_string: String,  // formatted Dec
    pub object_type: Option<String>,
    pub constellation: Option<String>,
    pub magnitude: Option<f64>,
    pub size: Option<String>,
    pub notes: Option<String>,
    pub priority: Option<String>,
    pub tags: Option<String>,
}

/// Import result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportTargetsResult {
    pub imported: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
    pub targets: Vec<TargetExportItem>,
}

/// Export formats
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Csv,
    Json,
    Stellarium,
    Mosaic,
}

/// Export targets to file
#[tauri::command]
pub async fn export_targets(
    app: AppHandle,
    targets: Vec<TargetExportItem>,
    format: ExportFormat,
    path: Option<String>,
) -> Result<String, StorageError> {
    let export_path = if let Some(p) = path {
        PathBuf::from(p)
    } else {
        // Use dialog to get save path
        let file_path = app.dialog()
            .file()
            .set_title("Export Targets")
            .add_filter("Files", match format {
                ExportFormat::Csv => &["csv"],
                ExportFormat::Json => &["json"],
                ExportFormat::Stellarium => &["txt"],
                ExportFormat::Mosaic => &["mosaicSession"],
            })
            .set_file_name(match format {
                ExportFormat::Csv => "targets.csv",
                ExportFormat::Json => "targets.json",
                ExportFormat::Stellarium => "targets.txt",
                ExportFormat::Mosaic => "mosaic.mosaicSession",
            })
            .blocking_save_file();
        
        match file_path {
            Some(p) => p.into_path().map_err(|_| StorageError::AppDataDirNotFound)?,
            None => return Err(StorageError::Io(std::io::Error::new(
                std::io::ErrorKind::Interrupted,
                "Export cancelled",
            ))),
        }
    };
    
    let content = match format {
        ExportFormat::Csv => export_csv(&targets),
        ExportFormat::Json => export_json(&targets)?,
        ExportFormat::Stellarium => export_stellarium(&targets),
        ExportFormat::Mosaic => export_mosaic(&targets)?,
    };
    
    fs::write(&export_path, content)?;
    
    log::info!("Exported {} targets to {:?}", targets.len(), export_path);
    Ok(export_path.to_string_lossy().to_string())
}

/// Import targets from file
#[tauri::command]
pub async fn import_targets(
    app: AppHandle,
    path: Option<String>,
) -> Result<ImportTargetsResult, StorageError> {
    let import_path = if let Some(p) = path {
        PathBuf::from(p)
    } else {
        // Use dialog to get file path
        let file_path = app.dialog()
            .file()
            .set_title("Import Targets")
            .add_filter("All Supported", &["csv", "json", "txt"])
            .add_filter("CSV Files", &["csv"])
            .add_filter("JSON Files", &["json"])
            .add_filter("Text Files", &["txt"])
            .blocking_pick_file();
        
        match file_path {
            Some(p) => p.into_path().map_err(|_| StorageError::AppDataDirNotFound)?,
            None => return Err(StorageError::Io(std::io::Error::new(
                std::io::ErrorKind::Interrupted,
                "Import cancelled",
            ))),
        }
    };
    
    let content = fs::read_to_string(&import_path)?;
    let extension = import_path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    
    let result = match extension.as_str() {
        "csv" => import_csv(&content),
        "json" => import_json(&content)?,
        "txt" => import_stellarium(&content),
        _ => import_csv(&content), // Default to CSV
    };
    
    log::info!("Imported {} targets from {:?}", result.imported, import_path);
    Ok(result)
}

// ============================================================================
// CSV Format
// ============================================================================

fn export_csv(targets: &[TargetExportItem]) -> String {
    let mut lines = vec![
        "Name,RA,Dec,RA_HMS,Dec_DMS,Type,Constellation,Magnitude,Size,Priority,Tags,Notes".to_string()
    ];
    
    for t in targets {
        let line = format!(
            "\"{}\",{},{},\"{}\",\"{}\",\"{}\",\"{}\",{},\"{}\",\"{}\",\"{}\",\"{}\"",
            escape_csv(&t.name),
            t.ra,
            t.dec,
            escape_csv(&t.ra_string),
            escape_csv(&t.dec_string),
            escape_csv(&t.object_type.clone().unwrap_or_default()),
            escape_csv(&t.constellation.clone().unwrap_or_default()),
            t.magnitude.map(|m| m.to_string()).unwrap_or_default(),
            escape_csv(&t.size.clone().unwrap_or_default()),
            escape_csv(&t.priority.clone().unwrap_or_default()),
            escape_csv(&t.tags.clone().unwrap_or_default()),
            escape_csv(&t.notes.clone().unwrap_or_default()),
        );
        lines.push(line);
    }
    
    lines.join("\n")
}

fn import_csv(content: &str) -> ImportTargetsResult {
    let mut targets = Vec::new();
    let mut errors = Vec::new();
    let mut skipped = 0;
    
    let lines: Vec<&str> = content.lines().collect();
    
    // Skip header
    for (i, line) in lines.iter().enumerate().skip(1) {
        if line.trim().is_empty() {
            continue;
        }
        
        let fields = parse_csv_line(line);
        if fields.len() < 4 {
            errors.push(format!("Line {}: insufficient fields", i + 1));
            skipped += 1;
            continue;
        }
        
        // Helper to get field as str
        let get_field = |idx: usize| -> &str {
            fields.get(idx).map(|s| s.as_str()).unwrap_or("")
        };
        
        // Try to parse RA/Dec
        let (ra, dec) = if let (Ok(ra), Ok(dec)) = (
            get_field(1).parse::<f64>(),
            get_field(2).parse::<f64>(),
        ) {
            (ra, dec)
        } else {
            // Try parsing from HMS/DMS strings
            match parse_coordinates(get_field(3), get_field(4)) {
                Some((ra, dec)) => (ra, dec),
                None => {
                    errors.push(format!("Line {}: invalid coordinates", i + 1));
                    skipped += 1;
                    continue;
                }
            }
        };
        
        let target = TargetExportItem {
            name: get_field(0).to_string(),
            ra,
            dec,
            ra_string: get_field(3).to_string(),
            dec_string: get_field(4).to_string(),
            object_type: fields.get(5).map(|s| s.to_string()).filter(|s| !s.is_empty()),
            constellation: fields.get(6).map(|s| s.to_string()).filter(|s| !s.is_empty()),
            magnitude: fields.get(7).and_then(|s| s.parse().ok()),
            size: fields.get(8).map(|s| s.to_string()).filter(|s| !s.is_empty()),
            priority: fields.get(9).map(|s| s.to_string()).filter(|s| !s.is_empty()),
            tags: fields.get(10).map(|s| s.to_string()).filter(|s| !s.is_empty()),
            notes: fields.get(11).map(|s| s.to_string()).filter(|s| !s.is_empty()),
        };
        
        targets.push(target);
    }
    
    ImportTargetsResult {
        imported: targets.len(),
        skipped,
        errors,
        targets,
    }
}

// ============================================================================
// JSON Format
// ============================================================================

fn export_json(targets: &[TargetExportItem]) -> Result<String, StorageError> {
    Ok(serde_json::to_string_pretty(targets)?)
}

fn import_json(content: &str) -> Result<ImportTargetsResult, StorageError> {
    let targets: Vec<TargetExportItem> = serde_json::from_str(content)?;
    
    Ok(ImportTargetsResult {
        imported: targets.len(),
        skipped: 0,
        errors: Vec::new(),
        targets,
    })
}

// ============================================================================
// Stellarium Format (observing list)
// ============================================================================

fn export_stellarium(targets: &[TargetExportItem]) -> String {
    // Stellarium observing list format
    let mut lines = Vec::new();
    lines.push("[Stellarium Observing List]".to_string());
    lines.push(format!("# Exported targets: {}", targets.len()));
    lines.push("".to_string());
    
    for t in targets {
        // Format: name (RA, Dec)
        lines.push(format!("{}\t{}\t{}", t.name, t.ra_string, t.dec_string));
    }
    
    lines.join("\n")
}

fn import_stellarium(content: &str) -> ImportTargetsResult {
    let mut targets = Vec::new();
    let mut errors = Vec::new();
    let mut skipped = 0;
    
    for (i, line) in content.lines().enumerate() {
        let line = line.trim();
        
        // Skip comments and headers
        if line.is_empty() || line.starts_with('#') || line.starts_with('[') {
            continue;
        }
        
        // Parse tab-separated values
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() < 3 {
            // Try comma separation
            let parts: Vec<&str> = line.split(',').collect();
            if parts.len() < 3 {
                errors.push(format!("Line {}: invalid format", i + 1));
                skipped += 1;
                continue;
            }
        }
        
        let name = parts[0].trim();
        let ra_str = parts.get(1).unwrap_or(&"").trim();
        let dec_str = parts.get(2).unwrap_or(&"").trim();
        
        match parse_coordinates(ra_str, dec_str) {
            Some((ra, dec)) => {
                targets.push(TargetExportItem {
                    name: name.to_string(),
                    ra,
                    dec,
                    ra_string: ra_str.to_string(),
                    dec_string: dec_str.to_string(),
                    object_type: None,
                    constellation: None,
                    magnitude: None,
                    size: None,
                    priority: None,
                    tags: None,
                    notes: None,
                });
            }
            None => {
                errors.push(format!("Line {}: invalid coordinates", i + 1));
                skipped += 1;
            }
        }
    }
    
    ImportTargetsResult {
        imported: targets.len(),
        skipped,
        errors,
        targets,
    }
}

// ============================================================================
// N.I.N.A Mosaic Format
// ============================================================================

fn export_mosaic(targets: &[TargetExportItem]) -> Result<String, StorageError> {
    // Simplified N.I.N.A mosaic session format
    #[derive(Serialize)]
    struct MosaicSession {
        targets: Vec<MosaicTarget>,
    }
    
    #[derive(Serialize)]
    struct MosaicTarget {
        name: String,
        ra: f64,
        dec: f64,
    }
    
    let session = MosaicSession {
        targets: targets.iter().map(|t| MosaicTarget {
            name: t.name.clone(),
            ra: t.ra,
            dec: t.dec,
        }).collect(),
    };
    
    Ok(serde_json::to_string_pretty(&session)?)
}

// ============================================================================
// Helpers
// ============================================================================

fn escape_csv(s: &str) -> String {
    s.replace('"', "\"\"")
}

fn parse_csv_line(line: &str) -> Vec<String> {
    let mut fields = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut chars = line.chars().peekable();
    
    while let Some(c) = chars.next() {
        match c {
            '"' => {
                if in_quotes && chars.peek() == Some(&'"') {
                    current.push('"');
                    chars.next();
                } else {
                    in_quotes = !in_quotes;
                }
            }
            ',' if !in_quotes => {
                fields.push(current.trim().to_string());
                current = String::new();
            }
            _ => current.push(c),
        }
    }
    fields.push(current.trim().to_string());
    
    fields
}

fn parse_coordinates(ra_str: &str, dec_str: &str) -> Option<(f64, f64)> {
    let ra = parse_ra(ra_str)?;
    let dec = parse_dec(dec_str)?;
    Some((ra, dec))
}

fn parse_ra(s: &str) -> Option<f64> {
    let s = s.trim();
    
    // Try decimal degrees first
    if let Ok(deg) = s.parse::<f64>() {
        return Some(deg);
    }
    
    // Try HMS format: "12h 34m 56.7s" or "12:34:56.7"
    let re_hms = regex_lite::Regex::new(r"(\d+)[h:\s]+(\d+)[m:\s]+(\d+\.?\d*)s?").ok()?;
    if let Some(caps) = re_hms.captures(s) {
        let h: f64 = caps.get(1)?.as_str().parse().ok()?;
        let m: f64 = caps.get(2)?.as_str().parse().ok()?;
        let sec: f64 = caps.get(3)?.as_str().parse().ok()?;
        return Some((h + m / 60.0 + sec / 3600.0) * 15.0);
    }
    
    None
}

fn parse_dec(s: &str) -> Option<f64> {
    let s = s.trim();
    
    // Try decimal degrees first
    if let Ok(deg) = s.parse::<f64>() {
        return Some(deg);
    }
    
    // Try DMS format: "+41° 16' 09" or "-41:16:09"
    let re_dms = regex_lite::Regex::new(r#"([+-]?\d+)[°:\s]+(\d+)[':\s]+(\d+\.?\d*)"?"#).ok()?;
    if let Some(caps) = re_dms.captures(s) {
        let d: f64 = caps.get(1)?.as_str().parse().ok()?;
        let m: f64 = caps.get(2)?.as_str().parse().ok()?;
        let sec: f64 = caps.get(3)?.as_str().parse().ok()?;
        let sign = if d < 0.0 { -1.0 } else { 1.0 };
        return Some(sign * (d.abs() + m / 60.0 + sec / 3600.0));
    }
    
    None
}
