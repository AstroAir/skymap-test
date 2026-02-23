//! Astronomy calculations module
//! Provides high-performance astronomical calculations for the desktop application
//!
//! Submodules:
//! - `types`: Coordinate and result types
//! - `common`: Constants, regex patterns, and helper functions
//! - `time`: Julian Date, GMST, LST, hour angle
//! - `coordinates`: Coordinate conversions (equatorial, horizontal, galactic, ecliptic)
//! - `visibility`: Target visibility calculations
//! - `twilight`: Twilight and sunrise/sunset calculations
//! - `moon`: Moon phase and position
//! - `sun`: Sun position
//! - `imaging`: FOV and mosaic coverage
//! - `formatting`: RA/Dec formatting and parsing

pub mod types;
pub mod common;
pub mod time;
pub mod coordinates;
pub mod visibility;
pub mod twilight;
pub mod moon;
pub mod sun;
pub mod imaging;
pub mod formatting;

// Re-export all public types
pub use types::{
    EclipticCoords, EquatorialCoords, FOVResult, GalacticCoords, GeoLocation, HorizontalCoords,
    MoonPhase, MoonPosition, MosaicCoverage, SunPosition, TwilightTimes, VisibilityInfo,
};

// Re-export all Tauri commands
pub use coordinates::{
    angular_separation, ecliptic_to_equatorial, equatorial_to_ecliptic, equatorial_to_galactic,
    equatorial_to_horizontal, galactic_to_equatorial, horizontal_to_equatorial,
};
pub use formatting::{format_dec_dms, format_ra_hms, parse_dec_dms, parse_ra_hms};
pub use imaging::{calculate_fov, calculate_mosaic_coverage};
pub use moon::{calculate_moon_phase, calculate_moon_position};
pub use sun::calculate_sun_position;
pub use twilight::calculate_twilight;
pub use visibility::calculate_visibility;
