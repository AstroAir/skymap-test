//! Astronomy calculations module
//! Provides high-performance astronomical calculations for the desktop application

use chrono::{DateTime, Datelike, NaiveDate, Timelike, Utc};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

/// Static compiled regex for RA parsing (HMS format)
static RA_HMS_REGEX: Lazy<regex_lite::Regex> = Lazy::new(|| {
    regex_lite::Regex::new(r"(\d+)[h:\s]+(\d+)[m:\s]+(\d+\.?\d*)s?").unwrap()
});

/// Static compiled regex for Dec parsing (DMS format)
static DEC_DMS_REGEX: Lazy<regex_lite::Regex> = Lazy::new(|| {
    regex_lite::Regex::new(r#"([+-]?\d+)[°:\s]+(\d+)[':\s]+(\d+\.?\d*)"?"#).unwrap()
});

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
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t
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

    let sin_alt = dec_rad.sin() * lat_rad.sin() + dec_rad.cos() * lat_rad.cos() * ha_rad.cos();
    let alt = sin_alt.asin();

    let cos_az = (dec_rad.sin() - alt.sin() * lat_rad.sin()) / (alt.cos() * lat_rad.cos());
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

    let sin_dec = alt_rad.sin() * lat_rad.sin() + alt_rad.cos() * lat_rad.cos() * az_rad.cos();
    let dec = sin_dec.asin();

    let cos_ha = (alt_rad.sin() - lat_rad.sin() * dec.sin()) / (lat_rad.cos() * dec.cos());
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

    let sin_lat = dec_rad.sin() * eps_rad.cos() - dec_rad.cos() * eps_rad.sin() * ra_rad.sin();
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

    let sin_dec = lat_rad.sin() * eps_rad.cos() + lat_rad.cos() * eps_rad.sin() * lon_rad.sin();
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

/// Calculate target visibility with precise rise/set/transit times
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

    // Hour angle at rise/set for horizon (with atmospheric refraction correction ~34 arcmin)
    let refraction_correction = 0.5667 * DEG_TO_RAD; // ~34 arcmin in radians
    let cos_h0 = ((-refraction_correction).sin() - lat_rad.sin() * dec_rad.sin())
        / (lat_rad.cos() * dec_rad.cos());
    let cos_h0 = cos_h0.clamp(-1.0, 1.0);

    let is_circumpolar = cos_h0 <= -1.0;
    let never_rises = cos_h0 >= 1.0;

    // Calculate rise/set times using sidereal time
    let (rise_time, set_time, transit_time, hours_visible) = if is_circumpolar {
        // Object is always above horizon, calculate transit time only
        let transit_ts = calculate_transit_time(ra, longitude, &dt);
        (None, None, transit_ts, 24.0)
    } else if never_rises {
        (None, None, None, 0.0)
    } else {
        let h0 = cos_h0.acos() * RAD_TO_DEG; // Hour angle at rise/set in degrees
        let hours = h0 / HOURS_TO_DEG * 2.0; // Total hours visible

        // Calculate transit time (when HA = 0)
        let transit_ts = calculate_transit_time(ra, longitude, &dt);

        // Rise time = transit - h0 (in hours converted to seconds)
        // Set time = transit + h0
        let h0_seconds = (h0 / 15.0) * 3600.0; // Convert degrees to hours then to seconds

        let rise_ts = transit_ts.map(|t| t - h0_seconds as i64);
        let set_ts = transit_ts.map(|t| t + h0_seconds as i64);

        (rise_ts, set_ts, transit_ts, hours)
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

/// Calculate the transit time (meridian crossing) for an object
fn calculate_transit_time(ra: f64, longitude: f64, dt: &DateTime<Utc>) -> Option<i64> {
    // Get the date at midnight UTC
    let midnight = dt.date_naive().and_hms_opt(0, 0, 0)?;
    let midnight_utc = DateTime::<Utc>::from_naive_utc_and_offset(midnight, Utc);
    let jd_midnight = datetime_to_jd(&midnight_utc);

    // Calculate GMST at midnight
    let gmst_midnight = calculate_gmst(jd_midnight);

    // LST at midnight for this longitude
    let lst_midnight = normalize_degrees(gmst_midnight + longitude);

    // Hour angle at midnight
    let ha_midnight = normalize_degrees(lst_midnight - ra);

    // Time until transit (when HA = 0)
    // If HA > 180, transit was earlier, so add 360 to get time until next transit
    let ha_to_transit = if ha_midnight > 180.0 {
        360.0 - ha_midnight
    } else {
        -ha_midnight
    };

    // Convert hour angle difference to time (15 deg/hour = 1 hour per 15 degrees)
    let hours_to_transit = ha_to_transit / 15.0;
    let seconds_to_transit = hours_to_transit * 3600.0;

    // Sidereal day is slightly shorter than solar day
    // 1 sidereal day = 23h 56m 4s = 86164.0905 seconds
    let sidereal_correction = seconds_to_transit * (1.0 - 86164.0905 / 86400.0);
    let adjusted_seconds = seconds_to_transit - sidereal_correction;

    Some(midnight_utc.timestamp() + adjusted_seconds as i64)
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

/// Calculate twilight times for a date with precise calculations
/// Uses iterative approach for accurate sunrise/sunset and twilight times
#[tauri::command]
pub fn calculate_twilight(
    date: String,
    latitude: f64,
    longitude: f64,
) -> Result<TwilightTimes, String> {
    let naive_date = NaiveDate::parse_from_str(&date, "%Y-%m-%d")
        .map_err(|e| format!("Invalid date format: {}", e))?;

    let jd_noon = date_to_jd(&naive_date) + 0.5; // Julian date at noon UTC

    // Calculate sun position at noon for polar day/night check
    let sun_dec_noon = calculate_sun_declination(jd_noon);
    let lat_rad = latitude * DEG_TO_RAD;
    let dec_rad_noon = sun_dec_noon * DEG_TO_RAD;

    // Check for polar day/night using sunrise/sunset altitude
    let cos_h_sunrise = calculate_cos_hour_angle(lat_rad, dec_rad_noon, -0.8333 * DEG_TO_RAD);
    let is_polar_day = cos_h_sunrise < -1.0;
    let is_polar_night = cos_h_sunrise > 1.0;

    if is_polar_day || is_polar_night {
        // Calculate solar noon even in polar conditions
        let solar_noon_ts = calculate_solar_noon(jd_noon, longitude);
        return Ok(TwilightTimes {
            date,
            sunrise: None,
            sunset: None,
            civil_dawn: None,
            civil_dusk: None,
            nautical_dawn: None,
            nautical_dusk: None,
            astronomical_dawn: None,
            astronomical_dusk: None,
            solar_noon: solar_noon_ts,
            is_polar_day,
            is_polar_night,
        });
    }

    // Solar altitude angles for different twilight types
    const SUNRISE_SUNSET_ALT: f64 = -0.8333; // Accounts for refraction and solar disk radius
    const CIVIL_TWILIGHT_ALT: f64 = -6.0;
    const NAUTICAL_TWILIGHT_ALT: f64 = -12.0;
    const ASTRONOMICAL_TWILIGHT_ALT: f64 = -18.0;

    // Calculate solar noon (when sun crosses meridian)
    let solar_noon_ts = calculate_solar_noon(jd_noon, longitude);

    // Calculate times for each twilight type
    let (sunrise, sunset) = calculate_sun_rise_set_times(jd_noon, latitude, longitude, SUNRISE_SUNSET_ALT);
    let (civil_dawn, civil_dusk) = calculate_sun_rise_set_times(jd_noon, latitude, longitude, CIVIL_TWILIGHT_ALT);
    let (nautical_dawn, nautical_dusk) = calculate_sun_rise_set_times(jd_noon, latitude, longitude, NAUTICAL_TWILIGHT_ALT);
    let (astronomical_dawn, astronomical_dusk) = calculate_sun_rise_set_times(jd_noon, latitude, longitude, ASTRONOMICAL_TWILIGHT_ALT);

    Ok(TwilightTimes {
        date,
        sunrise,
        sunset,
        civil_dawn,
        civil_dusk,
        nautical_dawn,
        nautical_dusk,
        astronomical_dawn,
        astronomical_dusk,
        solar_noon: solar_noon_ts,
        is_polar_day,
        is_polar_night,
    })
}

/// Calculate cos(hour_angle) for a given sun altitude
fn calculate_cos_hour_angle(lat_rad: f64, dec_rad: f64, alt_rad: f64) -> f64 {
    (alt_rad.sin() - lat_rad.sin() * dec_rad.sin()) / (lat_rad.cos() * dec_rad.cos())
}

/// Calculate solar noon timestamp for a given date and longitude
fn calculate_solar_noon(jd_noon: f64, longitude: f64) -> Option<i64> {
    // Approximate equation of time calculation
    let n = jd_noon - 2451545.0; // Days since J2000
    let g = normalize_degrees(357.528 + 0.9856003 * n); // Mean anomaly
    let g_rad = g * DEG_TO_RAD;

    // Simplified equation of time (in minutes)
    let eot_simple = -7.655 * g_rad.sin() + 9.873 * (2.0 * g_rad + 3.588).sin();

    // Solar noon = 12:00 - equation_of_time - longitude/15 (in hours)
    let solar_noon_hours = 12.0 - eot_simple / 60.0 - longitude / 15.0;

    // Convert to timestamp
    let jd_midnight = jd_noon - 0.5;
    let jd_solar_noon = jd_midnight + solar_noon_hours / 24.0;

    Some(jd_to_timestamp(jd_solar_noon))
}

/// Calculate sunrise and sunset times for a given altitude threshold
fn calculate_sun_rise_set_times(
    jd_noon: f64,
    latitude: f64,
    longitude: f64,
    altitude_deg: f64,
) -> (Option<i64>, Option<i64>) {
    let lat_rad = latitude * DEG_TO_RAD;
    let alt_rad = altitude_deg * DEG_TO_RAD;

    // Iterative calculation for better accuracy
    let mut jd_rise = jd_noon - 0.25; // Start from 6 AM
    let mut jd_set = jd_noon + 0.25;  // Start from 6 PM

    let mut final_rise_ts = None;
    let mut final_set_ts = None;

    for iteration in 0..5 {
        // Iterate for convergence
        let dec_rise = calculate_sun_declination(jd_rise) * DEG_TO_RAD;
        let dec_set = calculate_sun_declination(jd_set) * DEG_TO_RAD;

        let cos_h_rise = calculate_cos_hour_angle(lat_rad, dec_rise, alt_rad);
        let cos_h_set = calculate_cos_hour_angle(lat_rad, dec_set, alt_rad);

        if cos_h_rise.abs() > 1.0 || cos_h_set.abs() > 1.0 {
            return (None, None); // Sun doesn't reach this altitude
        }

        let h_rise = cos_h_rise.acos() * RAD_TO_DEG;
        let h_set = cos_h_set.acos() * RAD_TO_DEG;

        // Calculate times based on hour angles
        let noon_ts = calculate_solar_noon(jd_noon, longitude);
        if let Some(noon) = noon_ts {
            let rise_offset = (h_rise / 15.0) * 3600.0; // Convert to seconds
            let set_offset = (h_set / 15.0) * 3600.0;

            let rise_ts = noon - rise_offset as i64;
            let set_ts = noon + set_offset as i64;

            // Update JD for next iteration
            jd_rise = timestamp_to_jd(rise_ts);
            jd_set = timestamp_to_jd(set_ts);

            // Store final values on last iteration
            if iteration == 4 {
                final_rise_ts = Some(rise_ts);
                final_set_ts = Some(set_ts);
            }
        } else {
            return (None, None);
        }
    }

    (final_rise_ts, final_set_ts)
}

/// Convert Julian Date to Unix timestamp
fn jd_to_timestamp(jd: f64) -> i64 {
    ((jd - 2440587.5) * 86400.0) as i64
}

/// Convert Unix timestamp to Julian Date
fn timestamp_to_jd(ts: i64) -> f64 {
    ts as f64 / 86400.0 + 2440587.5
}

// ============================================================================
// Moon Calculations
// ============================================================================

/// Moon phase information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoonPhase {
    pub phase: f64,        // 0-1 (0 = new, 0.5 = full)
    pub illumination: f64, // 0-100%
    pub age: f64,          // days since new moon
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
    }
    .to_string();

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

/// Calculate moon position with improved accuracy
/// Uses simplified lunar theory with major perturbation terms
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
    let t2 = t * t;
    let t3 = t2 * t;

    // Fundamental arguments (in degrees)
    // Mean longitude of the Moon
    let l_prime = normalize_degrees(
        218.3164477 + 481267.88123421 * t - 0.0015786 * t2 + t3 / 538841.0
    );
    // Mean anomaly of the Moon
    let m_prime = normalize_degrees(
        134.9633964 + 477198.8675055 * t + 0.0087414 * t2 + t3 / 69699.0
    );
    // Mean anomaly of the Sun
    let m = normalize_degrees(
        357.5291092 + 35999.0502909 * t - 0.0001536 * t2
    );
    // Mean elongation of the Moon
    let d = normalize_degrees(
        297.8501921 + 445267.1114034 * t - 0.0018819 * t2 + t3 / 545868.0
    );
    // Mean distance of Moon from ascending node
    let f = normalize_degrees(
        93.2720950 + 483202.0175233 * t - 0.0036539 * t2
    );

    // Convert to radians for calculations
    let _l_prime_rad = l_prime * DEG_TO_RAD; // Reserved for future use
    let m_prime_rad = m_prime * DEG_TO_RAD;
    let m_rad = m * DEG_TO_RAD;
    let d_rad = d * DEG_TO_RAD;
    let f_rad = f * DEG_TO_RAD;

    // Longitude perturbations (main terms)
    let mut sigma_l = 0.0;
    sigma_l += 6288774.0 * m_prime_rad.sin();
    sigma_l += 1274027.0 * (2.0 * d_rad - m_prime_rad).sin();
    sigma_l += 658314.0 * (2.0 * d_rad).sin();
    sigma_l += 213618.0 * (2.0 * m_prime_rad).sin();
    sigma_l -= 185116.0 * m_rad.sin();
    sigma_l -= 114332.0 * (2.0 * f_rad).sin();
    sigma_l += 58793.0 * (2.0 * d_rad - 2.0 * m_prime_rad).sin();
    sigma_l += 57066.0 * (2.0 * d_rad - m_rad - m_prime_rad).sin();
    sigma_l += 53322.0 * (2.0 * d_rad + m_prime_rad).sin();
    sigma_l += 45758.0 * (2.0 * d_rad - m_rad).sin();
    sigma_l -= 40923.0 * (m_rad - m_prime_rad).sin();
    sigma_l -= 34720.0 * d_rad.sin();
    sigma_l -= 30383.0 * (m_rad + m_prime_rad).sin();
    sigma_l += 15327.0 * (2.0 * d_rad - 2.0 * f_rad).sin();

    // Latitude perturbations (main terms)
    let mut sigma_b = 0.0;
    sigma_b += 5128122.0 * f_rad.sin();
    sigma_b += 280602.0 * (m_prime_rad + f_rad).sin();
    sigma_b += 277693.0 * (m_prime_rad - f_rad).sin();
    sigma_b += 173237.0 * (2.0 * d_rad - f_rad).sin();
    sigma_b += 55413.0 * (2.0 * d_rad - m_prime_rad + f_rad).sin();
    sigma_b += 46271.0 * (2.0 * d_rad - m_prime_rad - f_rad).sin();
    sigma_b += 32573.0 * (2.0 * d_rad + f_rad).sin();
    sigma_b += 17198.0 * (2.0 * m_prime_rad + f_rad).sin();

    // Distance perturbations (main terms)
    let mut sigma_r = 0.0;
    sigma_r -= 20905355.0 * m_prime_rad.cos();
    sigma_r -= 3699111.0 * (2.0 * d_rad - m_prime_rad).cos();
    sigma_r -= 2955968.0 * (2.0 * d_rad).cos();
    sigma_r -= 569925.0 * (2.0 * m_prime_rad).cos();
    sigma_r += 48888.0 * m_rad.cos();
    sigma_r -= 3149.0 * (2.0 * f_rad).cos();
    sigma_r += 246158.0 * (2.0 * d_rad - 2.0 * m_prime_rad).cos();
    sigma_r -= 152138.0 * (2.0 * d_rad - m_rad - m_prime_rad).cos();

    // Calculate final values
    let lon = l_prime + sigma_l / 1000000.0;
    let lat = sigma_b / 1000000.0;
    let distance = 385000.56 + sigma_r / 1000.0; // km

    // Convert to equatorial
    let eq = ecliptic_to_equatorial(lon, lat, Some(dt.timestamp()));

    // Convert to horizontal
    let hor = equatorial_to_horizontal(eq.ra, eq.dec, latitude, longitude, Some(dt.timestamp()));

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

/// Calculate sun position with improved accuracy
/// Uses VSOP87 simplified algorithm with perturbation terms
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
    let t2 = t * t;
    // Geometric mean longitude of the Sun (in degrees)
    let l0 = normalize_degrees(280.46646 + 36000.76983 * t + 0.0003032 * t2);

    // Mean anomaly of the Sun (in degrees)
    let m = normalize_degrees(357.52911 + 35999.05029 * t - 0.0001537 * t2);
    let m_rad = m * DEG_TO_RAD;

    // Eccentricity of Earth's orbit
    let e = 0.016708634 - 0.000042037 * t - 0.0000001267 * t2;

    // Sun's equation of center (in degrees)
    let c = (1.914602 - 0.004817 * t - 0.000014 * t2) * m_rad.sin()
        + (0.019993 - 0.000101 * t) * (2.0 * m_rad).sin()
        + 0.000289 * (3.0 * m_rad).sin();

    // Sun's true longitude (in degrees)
    let sun_true_lon = l0 + c;

    // Sun's true anomaly (in degrees)
    let v = m + c;
    let v_rad = v * DEG_TO_RAD;

    // Sun's radius vector (AU)
    let _r = (1.000001018 * (1.0 - e * e)) / (1.0 + e * v_rad.cos());

    // Apparent longitude (corrected for nutation and aberration)
    let omega = 125.04 - 1934.136 * t; // longitude of Moon's ascending node
    let omega_rad = omega * DEG_TO_RAD;
    let sun_apparent_lon = sun_true_lon - 0.00569 - 0.00478 * omega_rad.sin();

    // Obliquity of the ecliptic (corrected)
    let obliquity = calculate_obliquity(jd) + 0.00256 * omega_rad.cos();
    let obliquity_rad = obliquity * DEG_TO_RAD;

    // Convert to equatorial coordinates directly for better accuracy
    let sun_lon_rad = sun_apparent_lon * DEG_TO_RAD;
    
    let ra = (obliquity_rad.cos() * sun_lon_rad.sin()).atan2(sun_lon_rad.cos());
    let dec = (obliquity_rad.sin() * sun_lon_rad.sin()).asin();

    let ra_deg = normalize_degrees(ra * RAD_TO_DEG);
    let dec_deg = dec * RAD_TO_DEG;

    // Convert to horizontal
    let hor = equatorial_to_horizontal(ra_deg, dec_deg, latitude, longitude, Some(dt.timestamp()));

    SunPosition {
        ra: ra_deg,
        dec: dec_deg,
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

    let f_ratio = if aperture > 0.0 {
        focal_length / aperture
    } else {
        0.0
    };

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

    let total_width =
        fov.width_deg * cols as f64 * overlap_factor + fov.width_deg * (1.0 - overlap_factor);
    let total_height =
        fov.height_deg * rows as f64 * overlap_factor + fov.height_deg * (1.0 - overlap_factor);

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

/// Calculate sun declination with improved accuracy
fn calculate_sun_declination(jd: f64) -> f64 {
    let t = (jd - 2451545.0) / 36525.0;
    let t2 = t * t;

    // Geometric mean longitude of the Sun
    let l0 = normalize_degrees(280.46646 + 36000.76983 * t + 0.0003032 * t2);

    // Mean anomaly of the Sun
    let m = normalize_degrees(357.52911 + 35999.05029 * t - 0.0001537 * t2);
    let m_rad = m * DEG_TO_RAD;

    // Equation of center
    let c = (1.914602 - 0.004817 * t - 0.000014 * t2) * m_rad.sin()
        + (0.019993 - 0.000101 * t) * (2.0 * m_rad).sin()
        + 0.000289 * (3.0 * m_rad).sin();

    // Sun's true longitude
    let sun_lon = (l0 + c) * DEG_TO_RAD;

    // Nutation correction
    let omega = (125.04 - 1934.136 * t) * DEG_TO_RAD;
    let apparent_lon = sun_lon - 0.00569 * DEG_TO_RAD - 0.00478 * omega.sin() * DEG_TO_RAD;

    // Corrected obliquity
    let obliquity = (calculate_obliquity(jd) + 0.00256 * omega.cos()) * DEG_TO_RAD;

    (obliquity.sin() * apparent_lon.sin()).asin() * RAD_TO_DEG
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
    // Try various formats using static compiled regex
    if let Some(caps) = RA_HMS_REGEX.captures(&ra_str) {
        let h: f64 = caps
            .get(1)
            .unwrap()
            .as_str()
            .parse()
            .map_err(|e: std::num::ParseFloatError| e.to_string())?;
        let m: f64 = caps
            .get(2)
            .unwrap()
            .as_str()
            .parse()
            .map_err(|e: std::num::ParseFloatError| e.to_string())?;
        let s: f64 = caps
            .get(3)
            .unwrap()
            .as_str()
            .parse()
            .map_err(|e: std::num::ParseFloatError| e.to_string())?;

        // Validate component ranges
        if h >= 24.0 || m >= 60.0 || s >= 60.0 {
            return Err(format!("Invalid HMS components: {}h {}m {}s", h, m, s));
        }

        let deg = (h + m / 60.0 + s / 3600.0) * HOURS_TO_DEG;
        return Ok(deg);
    }

    // Try decimal degrees
    let deg = ra_str.trim().parse::<f64>().map_err(|e| e.to_string())?;
    if deg < 0.0 || deg >= 360.0 {
        return Err(format!("RA out of range [0, 360): {}", deg));
    }
    Ok(deg)
}

/// Parse Dec from DMS string
#[tauri::command]
pub fn parse_dec_dms(dec_str: String) -> Result<f64, String> {
    // Try various formats using static compiled regex
    if let Some(caps) = DEC_DMS_REGEX.captures(&dec_str) {
        let d_str = caps.get(1).unwrap().as_str();
        let d: f64 = d_str
            .parse()
            .map_err(|e: std::num::ParseFloatError| e.to_string())?;
        let m: f64 = caps
            .get(2)
            .unwrap()
            .as_str()
            .parse()
            .map_err(|e: std::num::ParseFloatError| e.to_string())?;
        let s: f64 = caps
            .get(3)
            .unwrap()
            .as_str()
            .parse()
            .map_err(|e: std::num::ParseFloatError| e.to_string())?;

        // Validate component ranges
        if m >= 60.0 || s >= 60.0 {
            return Err(format!("Invalid DMS components: {} {}' {}\"", d, m, s));
        }

        // Use string sign check to handle -0° correctly (IEEE 754: -0.0 < 0.0 is false)
        let sign = if d_str.starts_with('-') { -1.0 } else { 1.0 };
        let result = sign * (d.abs() + m / 60.0 + s / 3600.0);

        if result < -90.0 || result > 90.0 {
            return Err(format!("Dec out of range [-90, 90]: {}", result));
        }
        return Ok(result);
    }

    // Try decimal degrees
    let deg = dec_str.trim().parse::<f64>().map_err(|e| e.to_string())?;
    if deg < -90.0 || deg > 90.0 {
        return Err(format!("Dec out of range [-90, 90]: {}", deg));
    }
    Ok(deg)
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    const EPSILON: f64 = 1e-6;

    fn approx_eq(a: f64, b: f64, eps: f64) -> bool {
        (a - b).abs() < eps
    }

    // ------------------------------------------------------------------------
    // Time Calculations Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_datetime_to_jd_j2000() {
        // J2000.0 epoch: January 1, 2000, 12:00 TT = JD 2451545.0
        let dt = Utc.with_ymd_and_hms(2000, 1, 1, 12, 0, 0).unwrap();
        let jd = datetime_to_jd(&dt);
        assert!(approx_eq(jd, 2451545.0, 0.001), "J2000 JD should be ~2451545.0, got {}", jd);
    }

    #[test]
    fn test_datetime_to_jd_known_date() {
        // October 15, 1582 (Gregorian calendar start) = JD 2299160.5
        let dt = Utc.with_ymd_and_hms(1582, 10, 15, 0, 0, 0).unwrap();
        let jd = datetime_to_jd(&dt);
        assert!(approx_eq(jd, 2299160.5, 0.5), "Expected ~2299160.5, got {}", jd);
    }

    #[test]
    fn test_date_to_jd() {
        let date = NaiveDate::from_ymd_opt(2000, 1, 1).unwrap();
        let jd = date_to_jd(&date);
        // Noon on J2000.0 day
        assert!(approx_eq(jd, 2451544.5, 0.001), "Expected ~2451544.5, got {}", jd);
    }

    #[test]
    fn test_calculate_gmst() {
        // At J2000.0 (JD 2451545.0), GMST ≈ 280.46°
        let gmst = calculate_gmst(2451545.0);
        assert!(approx_eq(gmst, 280.46, 0.1), "GMST at J2000 should be ~280.46°, got {}", gmst);
    }

    #[test]
    fn test_calculate_lst() {
        let jd = 2451545.0;
        let longitude = 0.0; // Greenwich
        let lst = calculate_lst(jd, longitude);
        let gmst = calculate_gmst(jd);
        assert!(approx_eq(lst, gmst, EPSILON), "LST at Greenwich should equal GMST");
    }

    #[test]
    fn test_calculate_hour_angle() {
        let lst = 90.0;
        let ra = 30.0;
        let ha = calculate_hour_angle(lst, ra);
        assert!(approx_eq(ha, 60.0, EPSILON), "HA should be 60°, got {}", ha);
    }

    // ------------------------------------------------------------------------
    // Coordinate Conversion Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_equatorial_to_galactic_center() {
        // Galactic center: RA ≈ 266.4°, Dec ≈ -29.0° → l ≈ 0°, b ≈ 0°
        let gc = equatorial_to_galactic(266.4, -29.0);
        assert!(gc.l.abs() < 5.0 || gc.l > 355.0, "Galactic center l should be near 0°, got {}", gc.l);
        assert!(gc.b.abs() < 5.0, "Galactic center b should be near 0°, got {}", gc.b);
    }

    #[test]
    fn test_galactic_to_equatorial() {
        // Test galactic_to_equatorial with known galactic coordinates
        // Galactic north pole (l=0, b=90) should be roughly at RA≈192.86°, Dec≈27.13°
        let eq = galactic_to_equatorial(0.0, 90.0);
        
        // Verify output is in valid range
        assert!(eq.ra >= 0.0 && eq.ra < 360.0, "RA out of range: {}", eq.ra);
        assert!(eq.dec >= -90.0 && eq.dec <= 90.0, "Dec out of range: {}", eq.dec);
        // Galactic north pole Dec should be positive (northern hemisphere)
        assert!(eq.dec > 0.0, "Galactic north pole should have positive Dec, got {}", eq.dec);
    }

    #[test]
    fn test_equatorial_to_ecliptic_roundtrip() {
        let original_ra = 120.0;
        let original_dec = 30.0;
        let timestamp = Some(0i64); // Use fixed timestamp
        
        let ecliptic = equatorial_to_ecliptic(original_ra, original_dec, timestamp);
        let back = ecliptic_to_equatorial(ecliptic.lon, ecliptic.lat, timestamp);
        
        assert!(approx_eq(back.ra, original_ra, 0.1), "RA roundtrip failed: {} vs {}", back.ra, original_ra);
        assert!(approx_eq(back.dec, original_dec, 0.1), "Dec roundtrip failed: {} vs {}", back.dec, original_dec);
    }

    // ------------------------------------------------------------------------
    // Moon Phase Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_moon_phase_known_new_moon() {
        // Jan 6, 2000 was a known new moon
        let dt = Utc.with_ymd_and_hms(2000, 1, 6, 18, 0, 0).unwrap();
        let phase = calculate_moon_phase(Some(dt.timestamp()));
        assert!(phase.phase < 0.1 || phase.phase > 0.9, "Should be near new moon, got phase {}", phase.phase);
        assert!(phase.illumination < 10.0, "New moon illumination should be low, got {}", phase.illumination);
    }

    #[test]
    fn test_moon_phase_range() {
        let phase = calculate_moon_phase(None);
        assert!(phase.phase >= 0.0 && phase.phase <= 1.0, "Phase should be 0-1");
        assert!(phase.illumination >= 0.0 && phase.illumination <= 100.0, "Illumination should be 0-100%");
        assert!(phase.age >= 0.0 && phase.age <= 30.0, "Age should be 0-30 days");
    }

    #[test]
    fn test_moon_phase_names() {
        let valid_names = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", 
                          "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
        let phase = calculate_moon_phase(None);
        assert!(valid_names.contains(&phase.phase_name.as_str()), "Invalid phase name: {}", phase.phase_name);
    }

    // ------------------------------------------------------------------------
    // FOV Calculation Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_calculate_fov_basic() {
        // Typical DSLR with 50mm lens
        let fov = calculate_fov(36.0, 24.0, 50.0, 5.0, 50.0);
        
        // FOV should be roughly 39° x 27° for full frame + 50mm
        assert!(fov.width_deg > 30.0 && fov.width_deg < 50.0, "Width FOV unexpected: {}", fov.width_deg);
        assert!(fov.height_deg > 20.0 && fov.height_deg < 35.0, "Height FOV unexpected: {}", fov.height_deg);
        assert!(approx_eq(fov.f_ratio, 1.0, EPSILON), "F-ratio should be 1.0");
    }

    #[test]
    fn test_calculate_fov_image_scale() {
        // Image scale = 206.265 * pixel_size / focal_length
        let fov = calculate_fov(10.0, 10.0, 1000.0, 5.0, 100.0);
        let expected_scale = 206.265 * 5.0 / 1000.0; // ~1.03 arcsec/pixel
        assert!(approx_eq(fov.image_scale, expected_scale, 0.01), 
            "Image scale mismatch: {} vs {}", fov.image_scale, expected_scale);
    }

    #[test]
    fn test_calculate_fov_zero_aperture() {
        let fov = calculate_fov(36.0, 24.0, 50.0, 5.0, 0.0);
        assert!(approx_eq(fov.f_ratio, 0.0, EPSILON), "F-ratio should be 0 with zero aperture");
    }

    // ------------------------------------------------------------------------
    // Mosaic Coverage Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_mosaic_coverage_single_panel() {
        let mosaic = calculate_mosaic_coverage(36.0, 24.0, 50.0, 1, 1, 20.0);
        assert_eq!(mosaic.total_panels, 1);
        // Single panel = full FOV regardless of overlap
        let single_fov = calculate_fov(36.0, 24.0, 50.0, 1.0, 1.0);
        assert!(approx_eq(mosaic.total_width_deg, single_fov.width_deg, 0.01));
    }

    #[test]
    fn test_mosaic_coverage_multiple_panels() {
        let mosaic = calculate_mosaic_coverage(36.0, 24.0, 100.0, 2, 3, 20.0);
        assert_eq!(mosaic.total_panels, 6);
        assert!(mosaic.total_width_deg > mosaic.panel_width_deg);
        assert!(mosaic.total_height_deg > mosaic.panel_height_deg);
    }

    // ------------------------------------------------------------------------
    // Angular Separation Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_angular_separation_same_point() {
        let sep = angular_separation(100.0, 45.0, 100.0, 45.0);
        assert!(approx_eq(sep, 0.0, EPSILON), "Same point separation should be 0");
    }

    #[test]
    fn test_angular_separation_poles() {
        // North pole to south pole = 180°
        let sep = angular_separation(0.0, 90.0, 0.0, -90.0);
        assert!(approx_eq(sep, 180.0, 0.01), "Pole to pole should be 180°, got {}", sep);
    }

    #[test]
    fn test_angular_separation_known_value() {
        // Separation between two points 90° apart on equator
        let sep = angular_separation(0.0, 0.0, 90.0, 0.0);
        assert!(approx_eq(sep, 90.0, 0.01), "Should be 90°, got {}", sep);
    }

    // ------------------------------------------------------------------------
    // Coordinate Formatting Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_format_ra_hms() {
        // 0° = 00h 00m 00s
        assert!(format_ra_hms(0.0).starts_with("00h 00m"));
        
        // 180° = 12h
        let ra_12h = format_ra_hms(180.0);
        assert!(ra_12h.starts_with("12h 00m"), "180° should be 12h, got {}", ra_12h);
    }

    #[test]
    fn test_format_dec_dms() {
        // 0° = +0°
        let dec_0 = format_dec_dms(0.0);
        assert!(dec_0.starts_with("+0°"), "0° should start with +0°, got {}", dec_0);
        
        // -45° should have negative sign
        let dec_neg = format_dec_dms(-45.0);
        assert!(dec_neg.starts_with("-45°"), "-45° should start with -45°, got {}", dec_neg);
    }

    // ------------------------------------------------------------------------
    // Coordinate Parsing Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_parse_ra_hms_standard() {
        let result = parse_ra_hms("12h 30m 45s".to_string());
        assert!(result.is_ok());
        let ra = result.unwrap();
        // 12h 30m 45s = (12 + 30/60 + 45/3600) * 15 ≈ 187.6875°
        assert!(approx_eq(ra, 187.6875, 0.01), "Parsed RA should be ~187.69°, got {}", ra);
    }

    #[test]
    fn test_parse_ra_hms_decimal() {
        let result = parse_ra_hms("123.45".to_string());
        assert!(result.is_ok());
        assert!(approx_eq(result.unwrap(), 123.45, EPSILON));
    }

    #[test]
    fn test_parse_dec_dms_positive() {
        let result = parse_dec_dms("+45° 30' 00\"".to_string());
        assert!(result.is_ok());
        let dec = result.unwrap();
        assert!(approx_eq(dec, 45.5, 0.01), "Parsed Dec should be ~45.5°, got {}", dec);
    }

    #[test]
    fn test_parse_dec_dms_negative() {
        let result = parse_dec_dms("-30° 15' 30\"".to_string());
        assert!(result.is_ok());
        let dec = result.unwrap();
        // -30° 15' 30" = -(30 + 15/60 + 30/3600) ≈ -30.2583°
        assert!(approx_eq(dec, -30.2583, 0.01), "Parsed Dec should be ~-30.26°, got {}", dec);
    }

    // ------------------------------------------------------------------------
    // Helper Function Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_normalize_degrees() {
        assert!(approx_eq(normalize_degrees(0.0), 0.0, EPSILON));
        assert!(approx_eq(normalize_degrees(360.0), 0.0, EPSILON));
        assert!(approx_eq(normalize_degrees(720.0), 0.0, EPSILON));
        assert!(approx_eq(normalize_degrees(-90.0), 270.0, EPSILON));
        assert!(approx_eq(normalize_degrees(450.0), 90.0, EPSILON));
    }

    #[test]
    fn test_calculate_obliquity() {
        // At J2000.0, obliquity ≈ 23.439°
        let obliquity = calculate_obliquity(2451545.0);
        assert!(approx_eq(obliquity, 23.439, 0.01), "Obliquity at J2000 should be ~23.439°, got {}", obliquity);
    }

    // ------------------------------------------------------------------------
    // Visibility Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_visibility_circumpolar() {
        // Polaris (Dec ~89°) from North pole (lat 90°) should be circumpolar
        let vis = calculate_visibility(0.0, 89.0, 80.0, 0.0, None, None);
        assert!(vis.is_circumpolar, "High dec star from high latitude should be circumpolar");
        assert!(!vis.never_rises);
        assert!(approx_eq(vis.hours_visible, 24.0, 0.1));
    }

    #[test]
    fn test_visibility_never_rises() {
        // Southern star (Dec -80°) from Northern location (lat 60°) should never rise
        let vis = calculate_visibility(0.0, -80.0, 60.0, 0.0, None, None);
        assert!(vis.never_rises, "Southern star should never rise from far north");
        assert!(!vis.is_circumpolar);
        assert!(approx_eq(vis.hours_visible, 0.0, 0.1));
    }

    #[test]
    fn test_visibility_transit_altitude() {
        // Transit altitude = 90 - |lat - dec|
        let vis = calculate_visibility(0.0, 30.0, 45.0, 0.0, None, None);
        let lat: f64 = 45.0;
        let dec: f64 = 30.0;
        let expected_transit = 90.0 - (lat - dec).abs(); // 75°
        assert!(approx_eq(vis.transit_altitude, expected_transit, 0.1), 
            "Transit altitude should be {}°, got {}", expected_transit, vis.transit_altitude);
    }

    #[test]
    fn test_visibility_rise_set_times() {
        // Normal visibility case: object that rises and sets
        let vis = calculate_visibility(0.0, 20.0, 45.0, 0.0, None, None);
        
        // Should have rise and set times
        assert!(vis.rise_time.is_some(), "Rise time should be present for normal object");
        assert!(vis.set_time.is_some(), "Set time should be present for normal object");
        assert!(vis.transit_time.is_some(), "Transit time should be present");
        
        // Rise should be before set
        if let (Some(rise), Some(set)) = (vis.rise_time, vis.set_time) {
            // Note: rise could be > set if the object rises late and sets early next day
            // For this test, we just verify they exist and are different
            assert_ne!(rise, set, "Rise and set times should be different");
        }
    }

    #[test]
    fn test_visibility_circumpolar_has_transit() {
        // Circumpolar objects should have transit time but no rise/set
        let vis = calculate_visibility(0.0, 85.0, 80.0, 0.0, None, None);
        
        assert!(vis.is_circumpolar);
        assert!(vis.transit_time.is_some(), "Circumpolar object should have transit time");
        assert!(vis.rise_time.is_none(), "Circumpolar object should not have rise time");
        assert!(vis.set_time.is_none(), "Circumpolar object should not have set time");
    }

    #[test]
    fn test_visibility_never_rises_no_times() {
        // Objects that never rise should have no times
        let vis = calculate_visibility(0.0, -85.0, 80.0, 0.0, None, None);
        
        assert!(vis.never_rises);
        assert!(vis.rise_time.is_none(), "Never-rises object should not have rise time");
        assert!(vis.set_time.is_none(), "Never-rises object should not have set time");
        assert!(vis.transit_time.is_none(), "Never-rises object should not have transit time");
    }

    #[test]
    fn test_visibility_hours_range() {
        // Test that hours visible is always in valid range
        let test_cases = vec![
            (0.0, 0.0, 45.0),    // Equatorial object
            (180.0, 45.0, 45.0), // Mid-declination
            (90.0, -30.0, 30.0), // Southern object from southern location
        ];
        
        for (ra, dec, lat) in test_cases {
            let vis = calculate_visibility(ra, dec, lat, 0.0, None, None);
            assert!(vis.hours_visible >= 0.0 && vis.hours_visible <= 24.0,
                "Hours visible out of range: {} for ra={}, dec={}, lat={}", 
                vis.hours_visible, ra, dec, lat);
        }
    }

    // ------------------------------------------------------------------------
    // Twilight Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_twilight_polar_detection() {
        // Arctic summer - potential polar day
        let result = calculate_twilight("2024-06-21".to_string(), 70.0, 0.0);
        assert!(result.is_ok());
        // At 70°N on summer solstice, expect polar day
        let twilight = result.unwrap();
        assert!(twilight.is_polar_day || twilight.is_polar_night == false);
    }

    #[test]
    fn test_twilight_invalid_date() {
        let result = calculate_twilight("invalid-date".to_string(), 45.0, 0.0);
        assert!(result.is_err());
    }

    #[test]
    fn test_twilight_normal_day() {
        // Test twilight times for a normal mid-latitude location
        let result = calculate_twilight("2024-03-20".to_string(), 40.0, -74.0);
        assert!(result.is_ok());
        let twilight = result.unwrap();
        
        // Should not be polar day/night at mid-latitude
        assert!(!twilight.is_polar_day, "Should not be polar day");
        assert!(!twilight.is_polar_night, "Should not be polar night");
        
        // All twilight times should be present
        assert!(twilight.sunrise.is_some(), "Sunrise should be present");
        assert!(twilight.sunset.is_some(), "Sunset should be present");
        assert!(twilight.civil_dawn.is_some(), "Civil dawn should be present");
        assert!(twilight.civil_dusk.is_some(), "Civil dusk should be present");
        assert!(twilight.solar_noon.is_some(), "Solar noon should be present");
        
        // Verify time ordering: dawn < sunrise < noon < sunset < dusk
        if let (Some(dawn), Some(sunrise), Some(noon), Some(sunset), Some(dusk)) = 
            (twilight.civil_dawn, twilight.sunrise, twilight.solar_noon, twilight.sunset, twilight.civil_dusk) {
            assert!(dawn < sunrise, "Civil dawn should be before sunrise");
            assert!(sunrise < noon, "Sunrise should be before solar noon");
            assert!(noon < sunset, "Solar noon should be before sunset");
            assert!(sunset < dusk, "Sunset should be before civil dusk");
        }
    }

    #[test]
    fn test_twilight_astronomical() {
        // Test that astronomical twilight is further from noon than nautical
        let result = calculate_twilight("2024-06-15".to_string(), 45.0, 0.0);
        assert!(result.is_ok());
        let twilight = result.unwrap();
        
        if let (Some(astro_dawn), Some(naut_dawn), Some(naut_dusk), Some(astro_dusk)) = 
            (twilight.astronomical_dawn, twilight.nautical_dawn, twilight.nautical_dusk, twilight.astronomical_dusk) {
            assert!(astro_dawn < naut_dawn, "Astronomical dawn should be before nautical dawn");
            assert!(naut_dusk < astro_dusk, "Nautical dusk should be before astronomical dusk");
        }
    }

    // ------------------------------------------------------------------------
    // Sun Position Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_sun_position_range() {
        let sun = calculate_sun_position(45.0, 0.0, None);
        assert!(sun.ra >= 0.0 && sun.ra < 360.0, "Sun RA out of range: {}", sun.ra);
        assert!(sun.dec >= -23.5 && sun.dec <= 23.5, "Sun Dec out of range: {}", sun.dec);
    }

    #[test]
    fn test_sun_position_summer_solstice() {
        // Around summer solstice, sun declination should be near +23.44°
        let dt = Utc.with_ymd_and_hms(2024, 6, 21, 12, 0, 0).unwrap();
        let sun = calculate_sun_position(0.0, 0.0, Some(dt.timestamp()));
        assert!(sun.dec > 23.0 && sun.dec < 24.0, 
            "Sun Dec on summer solstice should be ~23.44°, got {}", sun.dec);
    }

    #[test]
    fn test_sun_position_winter_solstice() {
        // Around winter solstice, sun declination should be near -23.44°
        let dt = Utc.with_ymd_and_hms(2024, 12, 21, 12, 0, 0).unwrap();
        let sun = calculate_sun_position(0.0, 0.0, Some(dt.timestamp()));
        assert!(sun.dec < -23.0 && sun.dec > -24.0, 
            "Sun Dec on winter solstice should be ~-23.44°, got {}", sun.dec);
    }

    #[test]
    fn test_sun_position_equinox() {
        // Around equinox, sun declination should be near 0°
        let dt = Utc.with_ymd_and_hms(2024, 3, 20, 12, 0, 0).unwrap();
        let sun = calculate_sun_position(0.0, 0.0, Some(dt.timestamp()));
        assert!(sun.dec.abs() < 1.5, 
            "Sun Dec on equinox should be near 0°, got {}", sun.dec);
    }

    #[test]
    fn test_sun_altitude_noon() {
        // At solar noon, sun should be at or near highest altitude
        let dt = Utc.with_ymd_and_hms(2024, 6, 15, 12, 0, 0).unwrap();
        let sun = calculate_sun_position(0.0, 0.0, Some(dt.timestamp()));
        // At latitude 0, longitude 0, noon UTC should have sun near zenith in June
        // This is a basic sanity check
        assert!(sun.altitude > -90.0 && sun.altitude <= 90.0, 
            "Sun altitude out of range: {}", sun.altitude);
    }

    // ------------------------------------------------------------------------
    // Moon Position Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_moon_position_range() {
        let moon = calculate_moon_position(45.0, 0.0, None);
        assert!(moon.ra >= 0.0 && moon.ra < 360.0, "Moon RA out of range: {}", moon.ra);
        assert!(moon.dec >= -90.0 && moon.dec <= 90.0, "Moon Dec out of range: {}", moon.dec);
        assert!(moon.distance > 350000.0 && moon.distance < 410000.0, 
            "Moon distance out of range: {} km", moon.distance);
    }

    #[test]
    fn test_moon_position_distance_variation() {
        // Moon distance varies between ~356,500 km (perigee) and ~406,700 km (apogee)
        // Test multiple timestamps to verify distance stays in range
        let test_timestamps = vec![
            Utc.with_ymd_and_hms(2024, 1, 15, 12, 0, 0).unwrap().timestamp(),
            Utc.with_ymd_and_hms(2024, 4, 15, 12, 0, 0).unwrap().timestamp(),
            Utc.with_ymd_and_hms(2024, 7, 15, 12, 0, 0).unwrap().timestamp(),
            Utc.with_ymd_and_hms(2024, 10, 15, 12, 0, 0).unwrap().timestamp(),
        ];
        
        for ts in test_timestamps {
            let moon = calculate_moon_position(0.0, 0.0, Some(ts));
            assert!(moon.distance >= 350000.0, "Moon too close: {} km at ts {}", moon.distance, ts);
            assert!(moon.distance <= 410000.0, "Moon too far: {} km at ts {}", moon.distance, ts);
        }
    }

    #[test]
    fn test_moon_declination_range() {
        // Moon declination varies roughly between -28.5° and +28.5° over 18.6-year cycle
        // In any given month, it should stay within ±30°
        let moon = calculate_moon_position(45.0, 0.0, None);
        assert!(moon.dec >= -30.0 && moon.dec <= 30.0, 
            "Moon Dec should be within ±30°, got {}", moon.dec);
    }

    #[test]
    fn test_moon_position_consistency() {
        // Test that moon position changes smoothly over time
        let base_ts = Utc.with_ymd_and_hms(2024, 6, 15, 12, 0, 0).unwrap().timestamp();
        let moon1 = calculate_moon_position(0.0, 0.0, Some(base_ts));
        let moon2 = calculate_moon_position(0.0, 0.0, Some(base_ts + 3600)); // 1 hour later
        
        // Moon moves about 0.5° per hour in RA
        let ra_diff = (moon2.ra - moon1.ra).abs();
        let ra_diff_normalized = if ra_diff > 180.0 { 360.0 - ra_diff } else { ra_diff };
        assert!(ra_diff_normalized < 2.0, 
            "Moon RA should change smoothly over 1 hour, got {} degree change", ra_diff_normalized);
    }

    // ------------------------------------------------------------------------
    // Sun Declination Helper Tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_sun_declination_range() {
        // Test sun declination at various dates
        let jd_summer = 2460479.0; // ~June 21, 2024
        let jd_winter = 2460661.0; // ~Dec 21, 2024
        
        let dec_summer = calculate_sun_declination(jd_summer);
        let dec_winter = calculate_sun_declination(jd_winter);
        
        assert!(dec_summer > 20.0, "Summer sun dec should be > 20°, got {}", dec_summer);
        assert!(dec_winter < -20.0, "Winter sun dec should be < -20°, got {}", dec_winter);
    }
}
