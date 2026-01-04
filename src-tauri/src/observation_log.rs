//! Observation log module
//! Records and manages observation sessions and individual observations

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::StorageError;
use crate::utils::generate_id;

/// Observation session (a night of observing)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObservationSession {
    pub id: String,
    pub date: NaiveDate,
    pub location_id: Option<String>,
    pub location_name: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub weather: Option<WeatherConditions>,
    pub seeing: Option<u8>,       // 1-5 scale
    pub transparency: Option<u8>, // 1-5 scale
    pub equipment_ids: Vec<String>,
    pub notes: Option<String>,
    pub observations: Vec<Observation>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Weather conditions during observation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherConditions {
    pub temperature: Option<f64>,       // Celsius
    pub humidity: Option<f64>,          // Percentage
    pub wind_speed: Option<f64>,        // km/h
    pub cloud_cover: Option<u8>,        // Percentage
    pub moon_phase: Option<f64>,        // 0-1
    pub moon_illumination: Option<f64>, // Percentage
}

/// Individual observation of an object
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Observation {
    pub id: String,
    pub object_name: String,
    pub object_type: Option<String>,
    pub ra: Option<f64>,  // degrees
    pub dec: Option<f64>, // degrees
    pub constellation: Option<String>,
    pub observed_at: DateTime<Utc>,
    pub telescope_id: Option<String>,
    pub eyepiece_id: Option<String>,
    pub camera_id: Option<String>,
    pub filter_id: Option<String>,
    pub magnification: Option<f64>,
    pub rating: Option<u8>,     // 1-5 stars
    pub difficulty: Option<u8>, // 1-5 difficulty
    pub notes: Option<String>,
    pub sketch_path: Option<String>, // Path to sketch image
    pub image_paths: Vec<String>,    // Paths to captured images
}

/// Observation log data
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ObservationLogData {
    pub sessions: Vec<ObservationSession>,
}

/// Statistics about observations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObservationStats {
    pub total_sessions: usize,
    pub total_observations: usize,
    pub unique_objects: usize,
    pub total_hours: f64,
    pub objects_by_type: Vec<(String, usize)>,
    pub monthly_counts: Vec<(String, usize)>,
}

fn get_log_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| StorageError::AppDataDirNotFound)?;

    let dir = app_data_dir.join("skymap").join("logs");

    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }

    Ok(dir.join("observation_log.json"))
}

/// Load observation log
#[tauri::command]
pub async fn load_observation_log(app: AppHandle) -> Result<ObservationLogData, StorageError> {
    let path = get_log_path(&app)?;

    if !path.exists() {
        return Ok(ObservationLogData::default());
    }

    let data = fs::read_to_string(&path)?;
    let log: ObservationLogData = serde_json::from_str(&data)?;

    Ok(log)
}

/// Save observation log
#[tauri::command]
pub async fn save_observation_log(
    app: AppHandle,
    log: ObservationLogData,
) -> Result<(), StorageError> {
    let path = get_log_path(&app)?;
    let json = serde_json::to_string_pretty(&log)?;
    fs::write(&path, json)?;

    log::info!("Saved observation log to {:?}", path);
    Ok(())
}

/// Create a new observation session
#[tauri::command]
pub async fn create_session(
    app: AppHandle,
    date: String,
    location_id: Option<String>,
    location_name: Option<String>,
) -> Result<ObservationSession, StorageError> {
    let mut log = load_observation_log(app.clone()).await?;

    let date = NaiveDate::parse_from_str(&date, "%Y-%m-%d").map_err(|e| {
        StorageError::Json(serde_json::Error::io(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            e.to_string(),
        )))
    })?;

    let session = ObservationSession {
        id: generate_id("session"),
        date,
        location_id,
        location_name,
        start_time: Some(Utc::now()),
        end_time: None,
        weather: None,
        seeing: None,
        transparency: None,
        equipment_ids: Vec::new(),
        notes: None,
        observations: Vec::new(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    log.sessions.push(session.clone());
    save_observation_log(app, log).await?;

    Ok(session)
}

/// Add an observation to a session
#[tauri::command]
pub async fn add_observation(
    app: AppHandle,
    session_id: String,
    observation: Observation,
) -> Result<ObservationSession, StorageError> {
    let mut log = load_observation_log(app.clone()).await?;

    let session = log
        .sessions
        .iter_mut()
        .find(|s| s.id == session_id)
        .ok_or_else(|| StorageError::StoreNotFound(session_id.clone()))?;

    let mut obs = observation;
    obs.id = generate_id("obs");
    obs.observed_at = Utc::now();

    session.observations.push(obs);
    session.updated_at = Utc::now();

    let result = session.clone();
    save_observation_log(app, log).await?;

    Ok(result)
}

/// Update a session
#[tauri::command]
pub async fn update_session(
    app: AppHandle,
    session: ObservationSession,
) -> Result<ObservationSession, StorageError> {
    let mut log = load_observation_log(app.clone()).await?;

    if let Some(existing) = log.sessions.iter_mut().find(|s| s.id == session.id) {
        existing.location_id = session.location_id;
        existing.location_name = session.location_name;
        existing.start_time = session.start_time;
        existing.end_time = session.end_time;
        existing.weather = session.weather;
        existing.seeing = session.seeing;
        existing.transparency = session.transparency;
        existing.equipment_ids = session.equipment_ids;
        existing.notes = session.notes;
        existing.updated_at = Utc::now();

        let result = existing.clone();
        save_observation_log(app, log).await?;
        return Ok(result);
    }

    Err(StorageError::StoreNotFound(session.id))
}

/// End a session
#[tauri::command]
pub async fn end_session(
    app: AppHandle,
    session_id: String,
) -> Result<ObservationSession, StorageError> {
    let mut log = load_observation_log(app.clone()).await?;

    let session = log
        .sessions
        .iter_mut()
        .find(|s| s.id == session_id)
        .ok_or_else(|| StorageError::StoreNotFound(session_id.clone()))?;

    session.end_time = Some(Utc::now());
    session.updated_at = Utc::now();

    let result = session.clone();
    save_observation_log(app, log).await?;

    Ok(result)
}

/// Delete a session
#[tauri::command]
pub async fn delete_session(app: AppHandle, session_id: String) -> Result<(), StorageError> {
    let mut log = load_observation_log(app.clone()).await?;
    log.sessions.retain(|s| s.id != session_id);
    save_observation_log(app, log).await?;
    Ok(())
}

/// Get observation statistics
#[tauri::command]
pub async fn get_observation_stats(app: AppHandle) -> Result<ObservationStats, StorageError> {
    let log = load_observation_log(app).await?;

    let total_sessions = log.sessions.len();
    let total_observations: usize = log.sessions.iter().map(|s| s.observations.len()).sum();

    // Unique objects
    let mut unique_objects = std::collections::HashSet::new();
    for session in &log.sessions {
        for obs in &session.observations {
            unique_objects.insert(obs.object_name.to_lowercase());
        }
    }

    // Total hours
    let total_hours: f64 = log
        .sessions
        .iter()
        .filter_map(|s| match (s.start_time, s.end_time) {
            (Some(start), Some(end)) => Some((end - start).num_minutes() as f64 / 60.0),
            _ => None,
        })
        .sum();

    // Objects by type
    let mut type_counts: std::collections::HashMap<String, usize> =
        std::collections::HashMap::new();
    for session in &log.sessions {
        for obs in &session.observations {
            let obj_type = obs
                .object_type
                .clone()
                .unwrap_or_else(|| "Unknown".to_string());
            *type_counts.entry(obj_type).or_insert(0) += 1;
        }
    }
    let mut objects_by_type: Vec<(String, usize)> = type_counts.into_iter().collect();
    objects_by_type.sort_by(|a, b| b.1.cmp(&a.1));

    // Monthly counts
    let mut monthly: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for session in &log.sessions {
        let month = session.date.format("%Y-%m").to_string();
        *monthly.entry(month).or_insert(0) += session.observations.len();
    }
    let mut monthly_counts: Vec<(String, usize)> = monthly.into_iter().collect();
    monthly_counts.sort_by(|a, b| a.0.cmp(&b.0));

    Ok(ObservationStats {
        total_sessions,
        total_observations,
        unique_objects: unique_objects.len(),
        total_hours,
        objects_by_type,
        monthly_counts,
    })
}

/// Search observations
#[tauri::command]
pub async fn search_observations(
    app: AppHandle,
    query: String,
) -> Result<Vec<Observation>, StorageError> {
    let log = load_observation_log(app).await?;
    let query_lower = query.to_lowercase();

    let mut results = Vec::new();
    for session in log.sessions {
        for obs in session.observations {
            if obs.object_name.to_lowercase().contains(&query_lower)
                || obs
                    .constellation
                    .as_ref()
                    .map(|c| c.to_lowercase().contains(&query_lower))
                    .unwrap_or(false)
                || obs
                    .notes
                    .as_ref()
                    .map(|n| n.to_lowercase().contains(&query_lower))
                    .unwrap_or(false)
            {
                results.push(obs);
            }
        }
    }

    Ok(results)
}
