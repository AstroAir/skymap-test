//! Astronomy module
//! Provides high-performance astronomical calculations for the desktop application
//!
//! Submodules:
//! - `calculations`: Core astronomical calculations (coordinates, time, visibility, imaging)
//! - `events`: Astronomical events (moon phases, meteor showers, seasonal events)

pub mod calculations;
pub mod events;

// Re-export commonly used items
pub use calculations::{
    // Coordinate types
    EquatorialCoords, EclipticCoords, GalacticCoords, GeoLocation, HorizontalCoords,
    // Result types
    FOVResult, MoonPhase, MoonPosition, MosaicCoverage, SunPosition, TwilightTimes, VisibilityInfo,
    // Tauri commands
    angular_separation, calculate_fov, calculate_moon_phase, calculate_moon_position,
    calculate_mosaic_coverage, calculate_sun_position, calculate_twilight, calculate_visibility,
    ecliptic_to_equatorial, equatorial_to_ecliptic, equatorial_to_galactic, equatorial_to_horizontal,
    format_dec_dms, format_ra_hms, galactic_to_equatorial, horizontal_to_equatorial,
    parse_dec_dms, parse_ra_hms,
};

pub use events::{
    // Types
    AstroEvent, AstroEventType, MeteorShowerInfo, MoonPhaseEvent,
    // Tauri commands
    get_astro_events, get_meteor_showers, get_moon_phases_for_month, get_seasonal_events,
    get_daily_astro_events, get_tonight_highlights,
};
