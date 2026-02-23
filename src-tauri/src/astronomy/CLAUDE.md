# rust-astronomy Module

[Root](../../../CLAUDE.md) > [src-tauri/src](../) > **astronomy**

> **Last Updated:** 2026-02-23
> **Module Type:** Rust

---

## Breadcrumb

`[Root](../../../CLAUDE.md) > [src-tauri/src](../) > **astronomy**`

---

## Module Responsibility

The `astronomy` module provides high-performance astronomical calculations in Rust. It includes coordinate transformations, visibility calculations, celestial body positions, twilight times, and astronomical events.

**Design Principle:** All functions are pure (no side effects) for easy testing and thread safety.

---

## Files

| File | Purpose |
|------|---------|
| `mod.rs` | Module exports and command registration |
| `calculations/mod.rs` | Calculations submodule declarations and re-exports |
| `calculations/types.rs` | All coordinate and result struct definitions |
| `calculations/common.rs` | Constants, regex patterns, helper functions |
| `calculations/time.rs` | Julian Date, GMST, LST, hour angle |
| `calculations/coordinates.rs` | Equatorial/horizontal/galactic/ecliptic conversions, angular separation |
| `calculations/visibility.rs` | Target visibility with rise/set/transit times |
| `calculations/twilight.rs` | Sunrise, sunset, and twilight calculations |
| `calculations/moon.rs` | Moon phase and position |
| `calculations/sun.rs` | Sun position (VSOP87 simplified) |
| `calculations/imaging.rs` | FOV and mosaic coverage |
| `calculations/formatting.rs` | RA/Dec formatting and parsing (HMS/DMS) |
| `events.rs` | Astronomical events (moon phases, meteor showers) |

---

## Tauri Commands

### calculations/ (coordinates, visibility, twilight, moon, sun, imaging, formatting)

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `equatorial_to_horizontal` | ra, dec, latitude, longitude, timestamp, apply_refraction | `HorizontalCoords` | Convert RA/Dec to Alt/Az (with optional atmospheric refraction) |
| `horizontal_to_equatorial` | alt, az, latitude, longitude, timestamp | `EquatorialCoords` | Convert Alt/Az to RA/Dec |
| `equatorial_to_galactic` | ra, dec | `GalacticCoords` | Convert to galactic coordinates |
| `galactic_to_equatorial` | l, b | `EquatorialCoords` | Convert from galactic |
| `equatorial_to_ecliptic` | ra, dec, timestamp | `EclipticCoords` | Convert to ecliptic |
| `ecliptic_to_equatorial` | lon, lat, timestamp | `EquatorialCoords` | Convert from ecliptic |
| `calculate_visibility` | ra, dec, lat, lon, timestamp, min_alt | `VisibilityInfo` | Target visibility info |
| `calculate_twilight` | date, latitude, longitude | `TwilightTimes` | Twilight times |
| `calculate_moon_phase` | timestamp | `MoonPhase` | Moon phase info |
| `calculate_moon_position` | lat, lon, timestamp | `MoonPosition` | Moon position |
| `calculate_sun_position` | lat, lon, timestamp | `SunPosition` | Sun position |
| `calculate_fov` | sensor_w, sensor_h, focal, pixel, aperture | `FOVResult` | Field of view |
| `calculate_mosaic_coverage` | sensor_w, sensor_h, focal, rows, cols, overlap | `MosaicCoverage` | Mosaic dimensions |
| `angular_separation` | ra1, dec1, ra2, dec2 | `f64` | Angular distance |
| `format_ra_hms` | ra_degrees | `String` | RA as HMS string |
| `format_dec_dms` | dec_degrees | `String` | Dec as DMS string |
| `parse_ra_hms` | ra_string | `f64` | Parse HMS to degrees |
| `parse_dec_dms` | dec_string | `f64` | Parse DMS to degrees |

### events.rs

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `get_moon_phases_for_month` | year, month | `Vec<MoonPhase>` | Monthly moon phases |
| `get_meteor_showers` | year, month | `Vec<MeteorShower>` | Meteor showers |
| `get_seasonal_events` | year, month | `Vec<SeasonalEvent>` | Solstices, equinoxes |
| `get_astro_events` | year, month | `AstroEvents` | All events for month |
| `get_tonight_highlights` | latitude, longitude, date | `TonightHighlights` | Tonight's best objects |

---

## Data Types

### Coordinate Types

```rust
pub struct EquatorialCoords {
    pub ra: f64,   // Right Ascension in degrees (0-360)
    pub dec: f64,  // Declination in degrees (-90 to +90)
}

pub struct HorizontalCoords {
    pub alt: f64,  // Altitude in degrees (-90 to +90)
    pub az: f64,   // Azimuth in degrees (0-360, N=0, E=90)
}

pub struct GalacticCoords {
    pub l: f64,    // Galactic longitude in degrees
    pub b: f64,    // Galactic latitude in degrees
}

pub struct EclipticCoords {
    pub lon: f64,  // Ecliptic longitude in degrees
    pub lat: f64,  // Ecliptic latitude in degrees
}
```

### Visibility Types

```rust
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
```

### Celestial Types

```rust
pub struct MoonPhase {
    pub phase: f64,        // 0-1 (0 = new, 0.5 = full)
    pub illumination: f64, // 0-100%
    pub age: f64,          // days since new moon
    pub phase_name: String,
    pub is_waxing: bool,
}

pub struct MoonPosition {
    pub ra: f64,
    pub dec: f64,
    pub altitude: f64,
    pub azimuth: f64,
    pub distance: f64,  // km
}

pub struct SunPosition {
    pub ra: f64,
    pub dec: f64,
    pub altitude: f64,
    pub azimuth: f64,
}
```

---

## Constants

```rust
const DEG_TO_RAD: f64 = PI / 180.0;
const RAD_TO_DEG: f64 = 180.0 / PI;
const HOURS_TO_DEG: f64 = 15.0;

// North Galactic Pole (J2000)
const NGP_RA: f64 = 192.85948;
const NGP_DEC: f64 = 27.12825;

// Known new moon for phase calculations
const KNOWN_NEW_MOON: f64 = 2451550.1;  // Jan 6, 2000 18:14 UTC
```

---

## Algorithm Notes

### Coordinate Conversions

- Equatorial ↔ Horizontal uses standard spherical trigonometry
- Galactic conversion uses J2000 pole positions
- Ecliptic conversion includes obliquity calculation

### Time Calculations

- Julian Date from Gregorian calendar
- GMST/LST using standard formulas
- Hour angle for rise/set calculations

### Visibility

- Circumpolar check: `cos_h0 <= -1.0`
- Never rises check: `cos_h0 >= 1.0`
- Transit altitude: `90° - |lat - dec|`

### Moon Phase

- Synodic month: 29.53058885 days
- Known new moon epoch for calculations
- Illumination approximation

---

## Testing

```bash
cd src-tauri
cargo test astronomy::calculations       # All calculation submodule tests
cargo test astronomy::calculations::time  # Specific submodule tests
cargo test astronomy::events::tests
```

---

## Related Files

- [`mod.rs`](./mod.rs) - Module exports
- [`calculations/`](./calculations/) - Core calculations (10 submodules)
- [`events.rs`](./events.rs) - Event calculations
- [../CLAUDE.md](../CLAUDE.md) - Backend documentation
- [../../../lib/astronomy/CLAUDE.md](../../../lib/astronomy/CLAUDE.md) - TypeScript equivalents
