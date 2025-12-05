//! Astronomy calculations module
//! Provides high-performance astronomical calculations for the desktop application

use chrono::{DateTime, NaiveDate, Utc, Datelike, Timelike};
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

// ============================================================================
// Constants
// ============================================================================

const DEG_TO_RAD: f64 = PI / 180.0;
const RAD_TO_DEG: f64 = 180.0 / PI;
const HOURS_TO_DEG: f64 = 15.0;

// ============================================================================
// Coordinate Types
// ============================================================================

/// Equatorial coordinates (RA/Dec)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EquatorialCoords {
    pub ra: f64,  // Right Ascension in degrees (0-360)
    pub dec: f64, // Declination in degrees (-90 to +90)
}

/// Horizontal/Altazimuth coordinates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HorizontalCoords {
    pub alt: f64, // Altitude in degrees (-90 to +90)
    pub az: f64,  // Azimuth in degrees (0-360, N=0, E=90)
}

/// Geographic location
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoLocation {
    pub latitude: f64,  // degrees, positive = North
    pub longitude: f64, // degrees, positive = East
    pub altitude: f64,  // meters above sea level
}

/// Galactic coordinates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalacticCoords {
    pub l: f64, // Galactic longitude in degrees
    pub b: f64, // Galactic latitude in degrees
}

/// Ecliptic coordinates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EclipticCoords {
    pub lon: f64, // Ecliptic longitude in degrees
    pub lat: f64, // Ecliptic latitude in degrees
}

// ============================================================================
// Time Calculations
// ============================================================================

/// Calculate Julian Date from DateTime
pub fn datetime_to_jd(dt: &DateTime<Utc>) -> f64 {
    let year = dt.year() as f64;
    let month = dt.month() as f64;
    let day = dt.day() as f64;
    let hour = dt.hour() as f64;
    let minute = dt.minute() as f64;
    let second = dt.second() as f64;
    
    let day_fraction = day + (hour + minute / 60.0 + second / 3600.0) / 24.0;
    
    let (y, m) = if month <= 2.0 {
        (year - 1.0, month + 12.0)
    } else {
        (year, month)
    };
    
    let a = (y / 100.0).floor();
    let b = 2.0 - a + (a / 4.0).floor();
    
    (365.25 * (y + 4716.0)).floor() + (30.6001 * (m + 1.0)).floor() + day_fraction + b - 1524.5
}

/// Calculate Julian Date from NaiveDate
pub fn date_to_jd(date: &NaiveDate) -> f64 {
    let year = date.year() as f64;
    let month = date.month() as f64;
    let day = date.day() as f64;
    
    let (y, m) = if month <= 2.0 {
        (year - 1.0, month + 12.0)
    } else {
        (year, month)
    };
    
    let a = (y / 100.0).floor();
    let b = 2.0 - a + (a / 4.0).floor();
    
    (365.25 * (y + 4716.0)).floor() + (30.6001 * (m + 1.0)).floor() + day + b - 1524.5
}

/// Calculate Greenwich Mean Sidereal Time (GMST) in degrees
pub fn calculate_gmst(jd: f64) -> f64 {
    let t = (jd - 2451545.0) / 36525.0;
    let gmst = 280.46061837 
        + 360.98564736629 * (jd - 2451545.0)
        + 0.000387933 * t * t
        - t * t * t / 38710000.0;
    
    normalize_degrees(gmst)
}

/// Calculate Local Sidereal Time (LST) in degrees
pub fn calculate_lst(jd: f64, longitude: f64) -> f64 {
    let gmst = calculate_gmst(jd);
    normalize_degrees(gmst + longitude)
}

/// Calculate hour angle in degrees
pub fn calculate_hour_angle(lst: f64, ra: f64) -> f64 {
    normalize_degrees(lst - ra)
}

// ============================================================================
// Coordinate Conversions
// ============================================================================

/// Convert equatorial to horizontal coordinates
#[tauri::command]
pub fn equatorial_to_horizontal(
    ra: f64,
    dec: f64,
    latitude: f64,
    longitude: f64,
    timestamp: Option<i64>,
) -> HorizontalCoords {
    let dt = timestamp
        .map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(Utc::now);
    
    let jd = datetime_to_jd(&dt);
    let lst = calculate_lst(jd, longitude);
    let ha = calculate_hour_angle(lst, ra);
    
    let ha_rad = ha * DEG_TO_RAD;
    let dec_rad = dec * DEG_TO_RAD;
    let lat_rad = latitude * DEG_TO_RAD;
    
    let sin_alt = dec_rad.sin() * lat_rad.sin() 
        + dec_rad.cos() * lat_rad.cos() * ha_rad.cos();
    let alt = sin_alt.asin();
    
    let cos_az = (dec_rad.sin() - alt.sin() * lat_rad.sin()) 
        / (alt.cos() * lat_rad.cos());
    let az = if ha_rad.sin() > 0.0 {
        2.0 * PI - cos_az.clamp(-1.0, 1.0).acos()
    } else {
        cos_az.clamp(-1.0, 1.0).acos()
    };
    
    HorizontalCoords {
        alt: alt * RAD_TO_DEG,
        az: az * RAD_TO_DEG,
    }
}

/// Convert horizontal to equatorial coordinates
#[tauri::command]
pub fn horizontal_to_equatorial(
    alt: f64,
    az: f64,
    latitude: f64,
    longitude: f64,
    timestamp: Option<i64>,
) -> EquatorialCoords {
    let dt = timestamp
        .map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(Utc::now);
    
    let jd = datetime_to_jd(&dt);
    let lst = calculate_lst(jd, longitude);
    
    let alt_rad = alt * DEG_TO_RAD;
    let az_rad = az * DEG_TO_RAD;
    let lat_rad = latitude * DEG_TO_RAD;
    
    let sin_dec = alt_rad.sin() * lat_rad.sin() 
        + alt_rad.cos() * lat_rad.cos() * az_rad.cos();
    let dec = sin_dec.asin();
    
    let cos_ha = (alt_rad.sin() - lat_rad.sin() * dec.sin()) 
        / (lat_rad.cos() * dec.cos());
    let ha = if az_rad.sin() > 0.0 {
        2.0 * PI - cos_ha.clamp(-1.0, 1.0).acos()
    } else {
        cos_ha.clamp(-1.0, 1.0).acos()
    };
    
    let ra = normalize_degrees(lst - ha * RAD_TO_DEG);
    
    EquatorialCoords {
        ra,
        dec: dec * RAD_TO_DEG,
    }
}

/// Convert equatorial to galactic coordinates
#[tauri::command]
pub fn equatorial_to_galactic(ra: f64, dec: f64) -> GalacticCoords {
    // North Galactic Pole (J2000): RA = 192.85948°, Dec = 27.12825°
    // Galactic center longitude from celestial pole: 122.93192°
    const NGP_RA: f64 = 192.85948;
    const NGP_DEC: f64 = 27.12825;
    const L_NCP: f64 = 122.93192;
    
    let ra_rad = ra * DEG_TO_RAD;
    let dec_rad = dec * DEG_TO_RAD;
    let ngp_ra_rad = NGP_RA * DEG_TO_RAD;
    let ngp_dec_rad = NGP_DEC * DEG_TO_RAD;
    
    let sin_b = dec_rad.sin() * ngp_dec_rad.sin() 
        + dec_rad.cos() * ngp_dec_rad.cos() * (ra_rad - ngp_ra_rad).cos();
    let b = sin_b.asin();
    
    let y = dec_rad.cos() * (ra_rad - ngp_ra_rad).sin();
    let x = dec_rad.sin() * ngp_dec_rad.cos() 
        - dec_rad.cos() * ngp_dec_rad.sin() * (ra_rad - ngp_ra_rad).cos();
    
    let l = normalize_degrees(L_NCP - y.atan2(x) * RAD_TO_DEG);
    
    GalacticCoords {
        l,
        b: b * RAD_TO_DEG,
    }
}

/// Convert galactic to equatorial coordinates
#[tauri::command]
pub fn galactic_to_equatorial(l: f64, b: f64) -> EquatorialCoords {
    const NGP_RA: f64 = 192.85948;
    const NGP_DEC: f64 = 27.12825;
    const L_NCP: f64 = 122.93192;
    
    let l_rad = l * DEG_TO_RAD;
    let b_rad = b * DEG_TO_RAD;
    let ngp_dec_rad = NGP_DEC * DEG_TO_RAD;
    let l_ncp_rad = L_NCP * DEG_TO_RAD;
    
    let sin_dec = b_rad.sin() * ngp_dec_rad.sin() 
        + b_rad.cos() * ngp_dec_rad.cos() * (l_ncp_rad - l_rad).sin();
    let dec = sin_dec.asin();
    
    let y = b_rad.cos() * (l_ncp_rad - l_rad).cos();
    let x = b_rad.sin() * ngp_dec_rad.cos() 
        - b_rad.cos() * ngp_dec_rad.sin() * (l_ncp_rad - l_rad).sin();
    
    let ra = normalize_degrees(NGP_RA + y.atan2(x) * RAD_TO_DEG);
    
    EquatorialCoords {
        ra,
        dec: dec * RAD_TO_DEG,
    }
}

/// Convert equatorial to ecliptic coordinates
#[tauri::command]
pub fn equatorial_to_ecliptic(ra: f64, dec: f64, timestamp: Option<i64>) -> EclipticCoords {
    let dt = timestamp
        .map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(Utc::now);
    
    let jd = datetime_to_jd(&dt);
    let obliquity = calculate_obliquity(jd);
    
    let ra_rad = ra * DEG_TO_RAD;
    let dec_rad = dec * DEG_TO_RAD;
    let eps_rad = obliquity * DEG_TO_RAD;
    
    let sin_lat = dec_rad.sin() * eps_rad.cos() 
        - dec_rad.cos() * eps_rad.sin() * ra_rad.sin();
    let lat = sin_lat.asin();
    
    let y = ra_rad.sin() * eps_rad.cos() + dec_rad.tan() * eps_rad.sin();
    let x = ra_rad.cos();
    let lon = normalize_degrees(y.atan2(x) * RAD_TO_DEG);
    
    EclipticCoords {
        lon,
        lat: lat * RAD_TO_DEG,
    }
}

/// Convert ecliptic to equatorial coordinates
#[tauri::command]
pub fn ecliptic_to_equatorial(lon: f64, lat: f64, timestamp: Option<i64>) -> EquatorialCoords {
    let dt = timestamp
        .map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(Utc::now);
    
    let jd = datetime_to_jd(&dt);
    let obliquity = calculate_obliquity(jd);
    
    let lon_rad = lon * DEG_TO_RAD;
    let lat_rad = lat * DEG_TO_RAD;
    let eps_rad = obliquity * DEG_TO_RAD;
    
    let sin_dec = lat_rad.sin() * eps_rad.cos() 
        + lat_rad.cos() * eps_rad.sin() * lon_rad.sin();
    let dec = sin_dec.asin();
    
    let y = lon_rad.sin() * eps_rad.cos() - lat_rad.tan() * eps_rad.sin();
    let x = lon_rad.cos();
    let ra = normalize_degrees(y.atan2(x) * RAD_TO_DEG);
    
    EquatorialCoords {
        ra,
        dec: dec * RAD_TO_DEG,
    }
}

// ============================================================================
// Visibility Calculations
// ============================================================================

/// Target visibility information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisibilityInfo {
    pub is_visible: bool,
    pub current_altitude: f64,
    pub current_azimuth: f64,
    pub rise_time: Option<i64>,
    pub set_time: Option<i64>,
    pub transit_time: Option<i64>,
    pub transit_altitude: f64,
    pub is_circumpolar: bool,
    pub never_rises: bool,
    pub hours_visible: f64,
}

/// Calculate target visibility
#[tauri::command]
pub fn calculate_visibility(
    ra: f64,
    dec: f64,
    latitude: f64,
    longitude: f64,
    timestamp: Option<i64>,
    min_altitude: Option<f64>,
) -> VisibilityInfo {
    let min_alt = min_altitude.unwrap_or(0.0);
    let dt = timestamp
        .map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(Utc::now);
    
    // Current position
    let current = equatorial_to_horizontal(ra, dec, latitude, longitude, Some(dt.timestamp()));
    
    // Transit altitude (when object crosses meridian)
    let transit_alt = 90.0 - (latitude - dec).abs();
    
    // Check if circumpolar or never rises
    let lat_rad = latitude * DEG_TO_RAD;
    let dec_rad = dec * DEG_TO_RAD;
    
    let cos_h0 = (-lat_rad.tan() * dec_rad.tan()).clamp(-1.0, 1.0);
    
    let is_circumpolar = cos_h0 <= -1.0;
    let never_rises = cos_h0 >= 1.0;
    
    // Calculate rise/set times
    let (rise_time, set_time, transit_time, hours_visible) = if is_circumpolar {
        (None, None, None, 24.0)
    } else if never_rises {
        (None, None, None, 0.0)
    } else {
        let h0 = cos_h0.acos() * RAD_TO_DEG;
        let hours = h0 / HOURS_TO_DEG * 2.0;
        
        // Simplified: just return hours visible, not exact times
        // Full implementation would calculate exact rise/set times
        (None, None, None, hours)
    };
    
    VisibilityInfo {
        is_visible: current.alt >= min_alt,
        current_altitude: current.alt,
        current_azimuth: current.az,
        rise_time,
        set_time,
        transit_time,
        transit_altitude: transit_alt,
        is_circumpolar,
        never_rises,
        hours_visible,
    }
}

// ============================================================================
// Twilight Calculations
// ============================================================================

/// Twilight times for a given date and location
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TwilightTimes {
    pub date: String,
    pub sunrise: Option<i64>,
    pub sunset: Option<i64>,
    pub civil_dawn: Option<i64>,
    pub civil_dusk: Option<i64>,
    pub nautical_dawn: Option<i64>,
    pub nautical_dusk: Option<i64>,
    pub astronomical_dawn: Option<i64>,
    pub astronomical_dusk: Option<i64>,
    pub solar_noon: Option<i64>,
    pub is_polar_day: bool,
    pub is_polar_night: bool,
}

/// Calculate twilight times for a date
#[tauri::command]
pub fn calculate_twilight(
    date: String,
    latitude: f64,
    _longitude: f64,
) -> Result<TwilightTimes, String> {
    let naive_date = NaiveDate::parse_from_str(&date, "%Y-%m-%d")
        .map_err(|e| format!("Invalid date format: {}", e))?;
    
    let jd = date_to_jd(&naive_date);
    
    // Calculate sun position at noon
    let sun_dec = calculate_sun_declination(jd + 0.5);
    let lat_rad = latitude * DEG_TO_RAD;
    let dec_rad = sun_dec * DEG_TO_RAD;
    
    // Check for polar day/night
    let cos_h0 = -lat_rad.tan() * dec_rad.tan();
    let is_polar_day = cos_h0 < -1.0;
    let is_polar_night = cos_h0 > 1.0;
    
    // For now, return simplified result
    // Full implementation would calculate exact times
    Ok(TwilightTimes {
        date,
        sunrise: None,
        sunset: None,
        civil_dawn: None,
        civil_dusk: None,
        nautical_dawn: None,
        nautical_dusk: None,
        astronomical_dawn: None,
        astronomical_dusk: None,
        solar_noon: None,
        is_polar_day,
        is_polar_night,
    })
}

// ============================================================================
// Moon Calculations
// ============================================================================

/// Moon phase information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoonPhase {
    pub phase: f64,           // 0-1 (0 = new, 0.5 = full)
    pub illumination: f64,    // 0-100%
    pub age: f64,             // days since new moon
    pub phase_name: String,
    pub is_waxing: bool,
}

/// Calculate moon phase
#[tauri::command]
pub fn calculate_moon_phase(timestamp: Option<i64>) -> MoonPhase {
    let dt = timestamp
        .map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(Utc::now);
    
    let jd = datetime_to_jd(&dt);
    
    // Synodic month in days
    const SYNODIC_MONTH: f64 = 29.530588853;
    
    // Known new moon (Jan 6, 2000 18:14 UTC)
    const KNOWN_NEW_MOON: f64 = 2451550.1;
    
    let days_since = jd - KNOWN_NEW_MOON;
    let lunations = days_since / SYNODIC_MONTH;
    let phase = lunations.fract();
    let phase = if phase < 0.0 { phase + 1.0 } else { phase };
    
    let age = phase * SYNODIC_MONTH;
    
    // Illumination (simplified)
    let illumination = (1.0 - (2.0 * PI * phase).cos()) / 2.0 * 100.0;
    
    let is_waxing = phase < 0.5;
    
    let phase_name = match phase {
        p if p < 0.0625 => "New Moon",
        p if p < 0.1875 => "Waxing Crescent",
        p if p < 0.3125 => "First Quarter",
        p if p < 0.4375 => "Waxing Gibbous",
        p if p < 0.5625 => "Full Moon",
        p if p < 0.6875 => "Waning Gibbous",
        p if p < 0.8125 => "Last Quarter",
        p if p < 0.9375 => "Waning Crescent",
        _ => "New Moon",
    }.to_string();
    
    MoonPhase {
        phase,
        illumination,
        age,
        phase_name,
        is_waxing,
    }
}

/// Moon position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoonPosition {
    pub ra: f64,
    pub dec: f64,
    pub altitude: f64,
    pub azimuth: f64,
    pub distance: f64, // km
}

/// Calculate moon position
#[tauri::command]
pub fn calculate_moon_position(
    latitude: f64,
    longitude: f64,
    timestamp: Option<i64>,
) -> MoonPosition {
    let dt = timestamp
        .map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(Utc::now);
    
    let jd = datetime_to_jd(&dt);
    let t = (jd - 2451545.0) / 36525.0;
    
    // Simplified moon position calculation
    // Mean longitude
    let l0 = normalize_degrees(218.3164477 + 481267.88123421 * t);
    
    // Mean anomaly
    let m = normalize_degrees(134.9633964 + 477198.8675055 * t);
    
    // Mean elongation (unused in simplified calculation but kept for reference)
    let _d = normalize_degrees(297.8501921 + 445267.1114034 * t);
    
    // Simplified ecliptic longitude
    let lon = l0 + 6.289 * (m * DEG_TO_RAD).sin();
    let lat = 5.128 * (m * DEG_TO_RAD).sin();
    
    // Convert to equatorial
    let eq = ecliptic_to_equatorial(lon, lat, Some(dt.timestamp()));
    
    // Convert to horizontal
    let hor = equatorial_to_horizontal(eq.ra, eq.dec, latitude, longitude, Some(dt.timestamp()));
    
    // Distance (simplified)
    let distance = 385000.0 - 20905.0 * (m * DEG_TO_RAD).cos();
    
    MoonPosition {
        ra: eq.ra,
        dec: eq.dec,
        altitude: hor.alt,
        azimuth: hor.az,
        distance,
    }
}

// ============================================================================
// Sun Calculations
// ============================================================================

/// Sun position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SunPosition {
    pub ra: f64,
    pub dec: f64,
    pub altitude: f64,
    pub azimuth: f64,
}

/// Calculate sun position
#[tauri::command]
pub fn calculate_sun_position(
    latitude: f64,
    longitude: f64,
    timestamp: Option<i64>,
) -> SunPosition {
    let dt = timestamp
        .map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(Utc::now);
    
    let jd = datetime_to_jd(&dt);
    let t = (jd - 2451545.0) / 36525.0;
    
    // Mean longitude
    let l0 = normalize_degrees(280.46646 + 36000.76983 * t);
    
    // Mean anomaly
    let m = normalize_degrees(357.52911 + 35999.05029 * t);
    let m_rad = m * DEG_TO_RAD;
    
    // Equation of center
    let c = (1.914602 - 0.004817 * t) * m_rad.sin()
        + 0.019993 * (2.0 * m_rad).sin();
    
    // Sun's true longitude
    let sun_lon = l0 + c;
    
    // Obliquity (used internally by ecliptic_to_equatorial)
    let _obliquity = calculate_obliquity(jd);
    
    // Convert to equatorial
    let eq = ecliptic_to_equatorial(sun_lon, 0.0, Some(dt.timestamp()));
    
    // Convert to horizontal
    let hor = equatorial_to_horizontal(eq.ra, eq.dec, latitude, longitude, Some(dt.timestamp()));
    
    SunPosition {
        ra: eq.ra,
        dec: eq.dec,
        altitude: hor.alt,
        azimuth: hor.az,
    }
}

// ============================================================================
// Imaging Calculations
// ============================================================================

/// FOV calculation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FOVResult {
    pub width_deg: f64,
    pub height_deg: f64,
    pub width_arcmin: f64,
    pub height_arcmin: f64,
    pub image_scale: f64, // arcsec/pixel
    pub f_ratio: f64,
}

/// Calculate field of view
#[tauri::command]
pub fn calculate_fov(
    sensor_width: f64,  // mm
    sensor_height: f64, // mm
    focal_length: f64,  // mm
    pixel_size: f64,    // μm
    aperture: f64,      // mm
) -> FOVResult {
    let width_rad = 2.0 * (sensor_width / (2.0 * focal_length)).atan();
    let height_rad = 2.0 * (sensor_height / (2.0 * focal_length)).atan();
    
    let width_deg = width_rad * RAD_TO_DEG;
    let height_deg = height_rad * RAD_TO_DEG;
    
    // Image scale in arcsec/pixel
    let image_scale = (206.265 * pixel_size) / focal_length;
    
    let f_ratio = if aperture > 0.0 { focal_length / aperture } else { 0.0 };
    
    FOVResult {
        width_deg,
        height_deg,
        width_arcmin: width_deg * 60.0,
        height_arcmin: height_deg * 60.0,
        image_scale,
        f_ratio,
    }
}

/// Mosaic coverage result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MosaicCoverage {
    pub total_width_deg: f64,
    pub total_height_deg: f64,
    pub total_panels: u32,
    pub panel_width_deg: f64,
    pub panel_height_deg: f64,
}

/// Calculate mosaic coverage
#[tauri::command]
pub fn calculate_mosaic_coverage(
    sensor_width: f64,
    sensor_height: f64,
    focal_length: f64,
    rows: u32,
    cols: u32,
    overlap_percent: f64,
) -> MosaicCoverage {
    let fov = calculate_fov(sensor_width, sensor_height, focal_length, 1.0, 1.0);
    
    let overlap_factor = 1.0 - overlap_percent / 100.0;
    
    let total_width = fov.width_deg * cols as f64 * overlap_factor 
        + fov.width_deg * (1.0 - overlap_factor);
    let total_height = fov.height_deg * rows as f64 * overlap_factor 
        + fov.height_deg * (1.0 - overlap_factor);
    
    MosaicCoverage {
        total_width_deg: total_width,
        total_height_deg: total_height,
        total_panels: rows * cols,
        panel_width_deg: fov.width_deg,
        panel_height_deg: fov.height_deg,
    }
}

// ============================================================================
// Angular Separation
// ============================================================================

/// Calculate angular separation between two points
#[tauri::command]
pub fn angular_separation(ra1: f64, dec1: f64, ra2: f64, dec2: f64) -> f64 {
    let ra1_rad = ra1 * DEG_TO_RAD;
    let dec1_rad = dec1 * DEG_TO_RAD;
    let ra2_rad = ra2 * DEG_TO_RAD;
    let dec2_rad = dec2 * DEG_TO_RAD;
    
    let cos_sep = dec1_rad.sin() * dec2_rad.sin()
        + dec1_rad.cos() * dec2_rad.cos() * (ra1_rad - ra2_rad).cos();
    
    cos_sep.clamp(-1.0, 1.0).acos() * RAD_TO_DEG
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Normalize angle to 0-360 degrees
fn normalize_degrees(deg: f64) -> f64 {
    let mut result = deg % 360.0;
    if result < 0.0 {
        result += 360.0;
    }
    result
}

/// Calculate obliquity of the ecliptic
fn calculate_obliquity(jd: f64) -> f64 {
    let t = (jd - 2451545.0) / 36525.0;
    23.439291 - 0.0130042 * t - 0.00000016 * t * t + 0.000000504 * t * t * t
}

/// Calculate sun declination (simplified)
fn calculate_sun_declination(jd: f64) -> f64 {
    let t = (jd - 2451545.0) / 36525.0;
    let l0 = normalize_degrees(280.46646 + 36000.76983 * t);
    let m = normalize_degrees(357.52911 + 35999.05029 * t);
    let m_rad = m * DEG_TO_RAD;
    
    let c = (1.914602 - 0.004817 * t) * m_rad.sin();
    let sun_lon = (l0 + c) * DEG_TO_RAD;
    
    let obliquity = calculate_obliquity(jd) * DEG_TO_RAD;
    
    (obliquity.sin() * sun_lon.sin()).asin() * RAD_TO_DEG
}

// ============================================================================
// Coordinate Formatting
// ============================================================================

/// Format RA as HMS string
#[tauri::command]
pub fn format_ra_hms(ra_deg: f64) -> String {
    let ra_hours = ra_deg / 15.0;
    let h = ra_hours.floor() as i32;
    let m_float = (ra_hours - h as f64) * 60.0;
    let m = m_float.floor() as i32;
    let s = (m_float - m as f64) * 60.0;
    
    format!("{:02}h {:02}m {:05.2}s", h, m, s)
}

/// Format Dec as DMS string
#[tauri::command]
pub fn format_dec_dms(dec_deg: f64) -> String {
    let sign = if dec_deg >= 0.0 { "+" } else { "-" };
    let dec_abs = dec_deg.abs();
    let d = dec_abs.floor() as i32;
    let m_float = (dec_abs - d as f64) * 60.0;
    let m = m_float.floor() as i32;
    let s = (m_float - m as f64) * 60.0;
    
    format!("{}{}° {:02}' {:05.2}\"", sign, d, m, s)
}

/// Parse RA from HMS string
#[tauri::command]
pub fn parse_ra_hms(ra_str: String) -> Result<f64, String> {
    // Try various formats
    let re = regex_lite::Regex::new(r"(\d+)[h:\s]+(\d+)[m:\s]+(\d+\.?\d*)s?")
        .map_err(|e| e.to_string())?;
    
    if let Some(caps) = re.captures(&ra_str) {
        let h: f64 = caps.get(1).unwrap().as_str().parse().map_err(|e: std::num::ParseFloatError| e.to_string())?;
        let m: f64 = caps.get(2).unwrap().as_str().parse().map_err(|e: std::num::ParseFloatError| e.to_string())?;
        let s: f64 = caps.get(3).unwrap().as_str().parse().map_err(|e: std::num::ParseFloatError| e.to_string())?;
        
        return Ok((h + m / 60.0 + s / 3600.0) * 15.0);
    }
    
    // Try decimal degrees
    ra_str.trim().parse::<f64>().map_err(|e| e.to_string())
}

/// Parse Dec from DMS string
#[tauri::command]
pub fn parse_dec_dms(dec_str: String) -> Result<f64, String> {
    let re = regex_lite::Regex::new(r#"([+-]?\d+)[°:\s]+(\d+)[':\s]+(\d+\.?\d*)"?"#)
        .map_err(|e| e.to_string())?;
    
    if let Some(caps) = re.captures(&dec_str) {
        let d: f64 = caps.get(1).unwrap().as_str().parse().map_err(|e: std::num::ParseFloatError| e.to_string())?;
        let m: f64 = caps.get(2).unwrap().as_str().parse().map_err(|e: std::num::ParseFloatError| e.to_string())?;
        let s: f64 = caps.get(3).unwrap().as_str().parse().map_err(|e: std::num::ParseFloatError| e.to_string())?;
        
        let sign = if d < 0.0 { -1.0 } else { 1.0 };
        return Ok(sign * (d.abs() + m / 60.0 + s / 3600.0));
    }
    
    // Try decimal degrees
    dec_str.trim().parse::<f64>().map_err(|e| e.to_string())
}
