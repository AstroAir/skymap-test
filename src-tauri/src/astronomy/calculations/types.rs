//! Astronomy calculation types
//! All coordinate and result types used across calculation submodules

use serde::{Deserialize, Serialize};

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
// Visibility Types
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

// ============================================================================
// Twilight Types
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

// ============================================================================
// Celestial Body Types
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

/// Moon position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoonPosition {
    pub ra: f64,
    pub dec: f64,
    pub altitude: f64,
    pub azimuth: f64,
    pub distance: f64, // km
}

/// Sun position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SunPosition {
    pub ra: f64,
    pub dec: f64,
    pub altitude: f64,
    pub azimuth: f64,
}

// ============================================================================
// Imaging Types
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

/// Mosaic coverage result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MosaicCoverage {
    pub total_width_deg: f64,
    pub total_height_deg: f64,
    pub total_panels: u32,
    pub panel_width_deg: f64,
    pub panel_height_deg: f64,
}
