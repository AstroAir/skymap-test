//! Astronomical events module
//! Calculates and provides information about astronomical events

use chrono::{DateTime, Datelike, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

use crate::astronomy::{calculate_moon_phase, calculate_moon_position, calculate_sun_position};

// ============================================================================
// Types
// ============================================================================

/// Astronomical event type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AstroEventType {
    // Moon phases
    NewMoon,
    FirstQuarter,
    FullMoon,
    LastQuarter,
    // Eclipses
    SolarEclipse,
    LunarEclipse,
    // Meteor showers
    MeteorShower,
    // Planetary events
    PlanetaryConjunction,
    PlanetaryOpposition,
    PlanetaryElongation,
    // Other
    Equinox,
    Solstice,
    Perihelion,
    Aphelion,
    Supermoon,
    BlueMoon,
}

/// Astronomical event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstroEvent {
    pub id: String,
    pub event_type: AstroEventType,
    pub name: String,
    pub description: String,
    pub date: String,
    pub time: Option<String>,
    pub timestamp: i64,
    pub magnitude: Option<f64>,
    pub visibility: Option<String>,
    pub details: Option<serde_json::Value>,
}

/// Moon phase event with additional details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoonPhaseEvent {
    pub phase_type: String,
    pub date: String,
    pub timestamp: i64,
    pub illumination: f64,
    pub is_supermoon: bool,
}

/// Meteor shower info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeteorShowerInfo {
    pub name: String,
    pub peak_date: String,
    pub active_start: String,
    pub active_end: String,
    pub zhr: u32, // Zenith Hourly Rate
    pub radiant_ra: f64,
    pub radiant_dec: f64,
    pub parent_body: Option<String>,
    pub description: String,
}

// ============================================================================
// Moon Phase Events
// ============================================================================

/// Calculate moon phases for a given month
#[tauri::command]
pub fn get_moon_phases_for_month(year: i32, month: u32) -> Vec<MoonPhaseEvent> {
    let mut events = Vec::new();

    // Get first and last day of month
    let first_day = NaiveDate::from_ymd_opt(year, month, 1).unwrap();
    let last_day = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
            .unwrap()
            .pred_opt()
            .unwrap()
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)
            .unwrap()
            .pred_opt()
            .unwrap()
    };

    let mut current = first_day;
    let mut prev_phase: Option<f64> = None;

    while current <= last_day {
        let dt = current.and_hms_opt(12, 0, 0).unwrap().and_utc();
        let phase = calculate_moon_phase(Some(dt.timestamp()));

        // Detect phase transitions
        if let Some(prev) = prev_phase {
            let phase_val = phase.phase;

            // New Moon (phase crosses 0)
            if prev > 0.9 && phase_val < 0.1 {
                events.push(MoonPhaseEvent {
                    phase_type: "New Moon".to_string(),
                    date: current.to_string(),
                    timestamp: dt.timestamp(),
                    illumination: phase.illumination,
                    is_supermoon: false,
                });
            }
            // First Quarter (phase crosses 0.25)
            else if prev < 0.25 && phase_val >= 0.25 {
                events.push(MoonPhaseEvent {
                    phase_type: "First Quarter".to_string(),
                    date: current.to_string(),
                    timestamp: dt.timestamp(),
                    illumination: phase.illumination,
                    is_supermoon: false,
                });
            }
            // Full Moon (phase crosses 0.5)
            else if prev < 0.5 && phase_val >= 0.5 {
                events.push(MoonPhaseEvent {
                    phase_type: "Full Moon".to_string(),
                    date: current.to_string(),
                    timestamp: dt.timestamp(),
                    illumination: phase.illumination,
                    is_supermoon: check_supermoon(dt.timestamp()),
                });
            }
            // Last Quarter (phase crosses 0.75)
            else if prev < 0.75 && phase_val >= 0.75 {
                events.push(MoonPhaseEvent {
                    phase_type: "Last Quarter".to_string(),
                    date: current.to_string(),
                    timestamp: dt.timestamp(),
                    illumination: phase.illumination,
                    is_supermoon: false,
                });
            }
        }

        prev_phase = Some(phase.phase);
        current = current.succ_opt().unwrap();
    }

    events
}

/// Check if a full moon is a supermoon (moon at perigee)
fn check_supermoon(timestamp: i64) -> bool {
    // Simplified check: supermoon occurs when moon is within ~10% of perigee
    // Average distance: 384,400 km, Perigee: ~356,500 km
    let moon_pos = calculate_moon_position(0.0, 0.0, Some(timestamp));
    moon_pos.distance < 360000.0
}

// ============================================================================
// Meteor Showers
// ============================================================================

/// Get major meteor showers for a year
#[tauri::command]
pub fn get_meteor_showers(year: i32) -> Vec<MeteorShowerInfo> {
    vec![
        MeteorShowerInfo {
            name: "Quadrantids".to_string(),
            peak_date: format!("{}-01-03", year),
            active_start: format!("{}-12-28", year - 1),
            active_end: format!("{}-01-12", year),
            zhr: 120,
            radiant_ra: 230.0,
            radiant_dec: 49.0,
            parent_body: Some("2003 EH1".to_string()),
            description: "One of the best annual meteor showers with bright meteors".to_string(),
        },
        MeteorShowerInfo {
            name: "Lyrids".to_string(),
            peak_date: format!("{}-04-22", year),
            active_start: format!("{}-04-16", year),
            active_end: format!("{}-04-25", year),
            zhr: 18,
            radiant_ra: 271.0,
            radiant_dec: 34.0,
            parent_body: Some("C/1861 G1 Thatcher".to_string()),
            description: "Medium strength shower with occasional bright fireballs".to_string(),
        },
        MeteorShowerInfo {
            name: "Eta Aquariids".to_string(),
            peak_date: format!("{}-05-06", year),
            active_start: format!("{}-04-19", year),
            active_end: format!("{}-05-28", year),
            zhr: 50,
            radiant_ra: 338.0,
            radiant_dec: -1.0,
            parent_body: Some("1P/Halley".to_string()),
            description: "Fast meteors from Halley's Comet debris".to_string(),
        },
        MeteorShowerInfo {
            name: "Delta Aquariids".to_string(),
            peak_date: format!("{}-07-30", year),
            active_start: format!("{}-07-12", year),
            active_end: format!("{}-08-23", year),
            zhr: 20,
            radiant_ra: 340.0,
            radiant_dec: -16.0,
            parent_body: Some("96P/Machholz".to_string()),
            description: "Best viewed from southern latitudes".to_string(),
        },
        MeteorShowerInfo {
            name: "Perseids".to_string(),
            peak_date: format!("{}-08-12", year),
            active_start: format!("{}-07-17", year),
            active_end: format!("{}-08-24", year),
            zhr: 100,
            radiant_ra: 48.0,
            radiant_dec: 58.0,
            parent_body: Some("109P/Swift-Tuttle".to_string()),
            description: "Most popular meteor shower with many bright meteors".to_string(),
        },
        MeteorShowerInfo {
            name: "Orionids".to_string(),
            peak_date: format!("{}-10-21", year),
            active_start: format!("{}-10-02", year),
            active_end: format!("{}-11-07", year),
            zhr: 20,
            radiant_ra: 95.0,
            radiant_dec: 16.0,
            parent_body: Some("1P/Halley".to_string()),
            description: "Fast meteors from Halley's Comet debris".to_string(),
        },
        MeteorShowerInfo {
            name: "Leonids".to_string(),
            peak_date: format!("{}-11-17", year),
            active_start: format!("{}-11-06", year),
            active_end: format!("{}-11-30", year),
            zhr: 15,
            radiant_ra: 152.0,
            radiant_dec: 22.0,
            parent_body: Some("55P/Tempel-Tuttle".to_string()),
            description: "Can produce meteor storms every 33 years".to_string(),
        },
        MeteorShowerInfo {
            name: "Geminids".to_string(),
            peak_date: format!("{}-12-14", year),
            active_start: format!("{}-12-04", year),
            active_end: format!("{}-12-17", year),
            zhr: 150,
            radiant_ra: 112.0,
            radiant_dec: 33.0,
            parent_body: Some("3200 Phaethon".to_string()),
            description: "King of meteor showers with many bright, colorful meteors".to_string(),
        },
        MeteorShowerInfo {
            name: "Ursids".to_string(),
            peak_date: format!("{}-12-22", year),
            active_start: format!("{}-12-17", year),
            active_end: format!("{}-12-26", year),
            zhr: 10,
            radiant_ra: 217.0,
            radiant_dec: 76.0,
            parent_body: Some("8P/Tuttle".to_string()),
            description: "Minor shower near the winter solstice".to_string(),
        },
    ]
}

// ============================================================================
// Seasonal Events
// ============================================================================

/// Get equinoxes and solstices for a year
#[tauri::command]
pub fn get_seasonal_events(year: i32) -> Vec<AstroEvent> {
    // Approximate dates (actual calculation would require more complex algorithms)
    vec![
        AstroEvent {
            id: format!("vernal-equinox-{}", year),
            event_type: AstroEventType::Equinox,
            name: "Vernal Equinox".to_string(),
            description: "First day of spring in Northern Hemisphere".to_string(),
            date: format!("{}-03-20", year),
            time: Some("12:00".to_string()),
            timestamp: NaiveDate::from_ymd_opt(year, 3, 20)
                .unwrap()
                .and_hms_opt(12, 0, 0)
                .unwrap()
                .and_utc()
                .timestamp(),
            magnitude: None,
            visibility: Some("Global".to_string()),
            details: None,
        },
        AstroEvent {
            id: format!("summer-solstice-{}", year),
            event_type: AstroEventType::Solstice,
            name: "Summer Solstice".to_string(),
            description: "Longest day in Northern Hemisphere".to_string(),
            date: format!("{}-06-21", year),
            time: Some("12:00".to_string()),
            timestamp: NaiveDate::from_ymd_opt(year, 6, 21)
                .unwrap()
                .and_hms_opt(12, 0, 0)
                .unwrap()
                .and_utc()
                .timestamp(),
            magnitude: None,
            visibility: Some("Global".to_string()),
            details: None,
        },
        AstroEvent {
            id: format!("autumnal-equinox-{}", year),
            event_type: AstroEventType::Equinox,
            name: "Autumnal Equinox".to_string(),
            description: "First day of autumn in Northern Hemisphere".to_string(),
            date: format!("{}-09-22", year),
            time: Some("12:00".to_string()),
            timestamp: NaiveDate::from_ymd_opt(year, 9, 22)
                .unwrap()
                .and_hms_opt(12, 0, 0)
                .unwrap()
                .and_utc()
                .timestamp(),
            magnitude: None,
            visibility: Some("Global".to_string()),
            details: None,
        },
        AstroEvent {
            id: format!("winter-solstice-{}", year),
            event_type: AstroEventType::Solstice,
            name: "Winter Solstice".to_string(),
            description: "Shortest day in Northern Hemisphere".to_string(),
            date: format!("{}-12-21", year),
            time: Some("12:00".to_string()),
            timestamp: NaiveDate::from_ymd_opt(year, 12, 21)
                .unwrap()
                .and_hms_opt(12, 0, 0)
                .unwrap()
                .and_utc()
                .timestamp(),
            magnitude: None,
            visibility: Some("Global".to_string()),
            details: None,
        },
    ]
}

// ============================================================================
// Combined Events
// ============================================================================

/// Get all astronomical events for a date range
#[tauri::command]
pub fn get_astro_events(start_date: String, end_date: String) -> Result<Vec<AstroEvent>, String> {
    let start = NaiveDate::parse_from_str(&start_date, "%Y-%m-%d")
        .map_err(|e| format!("Invalid start date: {}", e))?;
    let end = NaiveDate::parse_from_str(&end_date, "%Y-%m-%d")
        .map_err(|e| format!("Invalid end date: {}", e))?;

    let mut events = Vec::new();

    // Get years covered
    let start_year = start.year();
    let end_year = end.year();

    for year in start_year..=end_year {
        // Add seasonal events
        for event in get_seasonal_events(year) {
            let event_date = NaiveDate::parse_from_str(&event.date, "%Y-%m-%d").ok();
            if let Some(date) = event_date {
                if date >= start && date <= end {
                    events.push(event);
                }
            }
        }

        // Add meteor showers
        for shower in get_meteor_showers(year) {
            let peak_date = NaiveDate::parse_from_str(&shower.peak_date, "%Y-%m-%d").ok();
            if let Some(date) = peak_date {
                if date >= start && date <= end {
                    events.push(AstroEvent {
                        id: format!(
                            "meteor-{}-{}",
                            shower.name.to_lowercase().replace(' ', "-"),
                            year
                        ),
                        event_type: AstroEventType::MeteorShower,
                        name: shower.name.clone(),
                        description: shower.description,
                        date: shower.peak_date,
                        time: None,
                        timestamp: date.and_hms_opt(0, 0, 0).unwrap().and_utc().timestamp(),
                        magnitude: None,
                        visibility: Some(format!("ZHR: {}", shower.zhr)),
                        details: Some(serde_json::json!({
                            "zhr": shower.zhr,
                            "radiant_ra": shower.radiant_ra,
                            "radiant_dec": shower.radiant_dec,
                            "parent_body": shower.parent_body,
                            "active_start": shower.active_start,
                            "active_end": shower.active_end,
                        })),
                    });
                }
            }
        }

        // Add moon phases
        for month in 1..=12 {
            let month_start = NaiveDate::from_ymd_opt(year, month, 1).unwrap();
            let month_end = if month == 12 {
                NaiveDate::from_ymd_opt(year + 1, 1, 1)
                    .unwrap()
                    .pred_opt()
                    .unwrap()
            } else {
                NaiveDate::from_ymd_opt(year, month + 1, 1)
                    .unwrap()
                    .pred_opt()
                    .unwrap()
            };

            // Only process if month overlaps with date range
            if month_end >= start && month_start <= end {
                for phase in get_moon_phases_for_month(year, month) {
                    let phase_date = NaiveDate::parse_from_str(&phase.date, "%Y-%m-%d").ok();
                    if let Some(date) = phase_date {
                        if date >= start && date <= end {
                            let event_type = match phase.phase_type.as_str() {
                                "New Moon" => AstroEventType::NewMoon,
                                "First Quarter" => AstroEventType::FirstQuarter,
                                "Full Moon" => AstroEventType::FullMoon,
                                "Last Quarter" => AstroEventType::LastQuarter,
                                _ => continue,
                            };

                            let name = if phase.is_supermoon {
                                format!("{} (Supermoon)", phase.phase_type)
                            } else {
                                phase.phase_type.clone()
                            };

                            events.push(AstroEvent {
                                id: format!(
                                    "moon-{}-{}",
                                    phase.phase_type.to_lowercase().replace(' ', "-"),
                                    phase.timestamp
                                ),
                                event_type,
                                name,
                                description: format!(
                                    "Moon illumination: {:.1}%",
                                    phase.illumination
                                ),
                                date: phase.date,
                                time: None,
                                timestamp: phase.timestamp,
                                magnitude: None,
                                visibility: None,
                                details: Some(serde_json::json!({
                                    "illumination": phase.illumination,
                                    "is_supermoon": phase.is_supermoon,
                                })),
                            });
                        }
                    }
                }
            }
        }
    }

    // Sort by date
    events.sort_by_key(|e| e.timestamp);

    Ok(events)
}

/// Get tonight's astronomical highlights
#[tauri::command]
pub fn get_tonight_highlights(
    latitude: f64,
    longitude: f64,
    timestamp: Option<i64>,
) -> Vec<String> {
    let dt = timestamp
        .map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(Utc::now);

    let mut highlights = Vec::new();

    // Moon phase
    let moon_phase = calculate_moon_phase(Some(dt.timestamp()));
    highlights.push(format!(
        "Moon: {} ({:.0}% illuminated)",
        moon_phase.phase_name, moon_phase.illumination
    ));

    // Moon position
    let moon_pos = calculate_moon_position(latitude, longitude, Some(dt.timestamp()));
    if moon_pos.altitude > 0.0 {
        highlights.push(format!(
            "Moon altitude: {:.1}° (azimuth {:.1}°)",
            moon_pos.altitude, moon_pos.azimuth
        ));
    } else {
        highlights.push("Moon is below the horizon".to_string());
    }

    // Sun position (for twilight info)
    let sun_pos = calculate_sun_position(latitude, longitude, Some(dt.timestamp()));
    if sun_pos.altitude < -18.0 {
        highlights.push("Astronomical darkness - ideal for deep sky observation".to_string());
    } else if sun_pos.altitude < -12.0 {
        highlights.push("Nautical twilight - good for bright objects".to_string());
    } else if sun_pos.altitude < -6.0 {
        highlights.push("Civil twilight - planets and bright stars visible".to_string());
    } else if sun_pos.altitude < 0.0 {
        highlights.push("Sun just below horizon".to_string());
    } else {
        highlights.push("Daytime - wait for sunset".to_string());
    }

    highlights
}
