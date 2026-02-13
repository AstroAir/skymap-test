//! Mount control type definitions
//!
//! Shared types for mount communication (Alpaca client and simulator).

use serde::{Deserialize, Serialize};

// ============================================================================
// Protocol & Connection
// ============================================================================

/// Supported mount communication protocols
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MountProtocol {
    Alpaca,
    Simulator,
}

/// Connection configuration for a mount device
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub protocol: MountProtocol,
    pub host: String,
    pub port: u16,
    pub device_id: u32,
}

impl Default for ConnectionConfig {
    fn default() -> Self {
        Self {
            protocol: MountProtocol::Simulator,
            host: "localhost".to_string(),
            port: 11111,
            device_id: 0,
        }
    }
}

// ============================================================================
// Mount State
// ============================================================================

/// Tracking rate presets
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TrackingRate {
    Sidereal,
    Lunar,
    Solar,
    Stopped,
}

/// Pier side (for German Equatorial Mounts)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PierSide {
    East,
    West,
    Unknown,
}

/// Mount axis identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MountAxis {
    /// Right Ascension / Azimuth axis
    Primary,
    /// Declination / Altitude axis
    Secondary,
}

/// Slew speed presets (multiples of sidereal rate)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct SlewRate {
    pub label: &'static str,
    pub value: f64,
}

/// Common slew rate presets
pub const SLEW_RATES: &[SlewRate] = &[
    SlewRate { label: "1x", value: 1.0 },
    SlewRate { label: "2x", value: 2.0 },
    SlewRate { label: "8x", value: 8.0 },
    SlewRate { label: "16x", value: 16.0 },
    SlewRate { label: "64x", value: 64.0 },
    SlewRate { label: "Max", value: 800.0 },
];

/// Sidereal rate in degrees per second
pub const SIDEREAL_RATE_DEG_PER_SEC: f64 = 15.0 / 3600.0;

/// Full mount state snapshot returned to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MountState {
    pub connected: bool,
    pub ra: f64,
    pub dec: f64,
    pub tracking: bool,
    pub tracking_rate: TrackingRate,
    pub slewing: bool,
    pub parked: bool,
    pub at_home: bool,
    pub pier_side: PierSide,
    pub slew_rate_index: usize,
}

impl Default for MountState {
    fn default() -> Self {
        Self {
            connected: false,
            ra: 0.0,
            dec: 90.0,
            tracking: false,
            tracking_rate: TrackingRate::Sidereal,
            slewing: false,
            parked: true,
            at_home: true,
            pier_side: PierSide::Unknown,
            slew_rate_index: 3,
        }
    }
}

// ============================================================================
// Mount Capabilities
// ============================================================================

/// Reported device capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MountCapabilities {
    pub can_slew: bool,
    pub can_slew_async: bool,
    pub can_sync: bool,
    pub can_park: bool,
    pub can_unpark: bool,
    pub can_set_tracking: bool,
    pub can_move_axis: bool,
    pub can_pulse_guide: bool,
    pub alignment_mode: String,
    pub equatorial_system: String,
}

impl Default for MountCapabilities {
    fn default() -> Self {
        Self {
            can_slew: true,
            can_slew_async: true,
            can_sync: true,
            can_park: true,
            can_unpark: true,
            can_set_tracking: true,
            can_move_axis: true,
            can_pulse_guide: true,
            alignment_mode: "GermanPolar".to_string(),
            equatorial_system: "J2000".to_string(),
        }
    }
}

// ============================================================================
// Alpaca Discovery
// ============================================================================

/// A device discovered via Alpaca UDP broadcast
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredDevice {
    pub host: String,
    pub port: u16,
    pub device_id: u32,
    pub device_name: String,
    pub device_type: String,
}

// ============================================================================
// Error Types
// ============================================================================

/// Mount operation errors
#[derive(Debug, thiserror::Error)]
pub enum MountError {
    #[error("Mount not connected")]
    NotConnected,

    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Alpaca error ({code}): {message}")]
    AlpacaError { code: i32, message: String },

    #[error("HTTP request failed: {0}")]
    HttpError(String),

    #[error("Mount is parked")]
    Parked,

    #[error("Mount is already slewing")]
    AlreadySlewing,

    #[error("Target below horizon")]
    BelowHorizon,

    #[error("Operation not supported: {0}")]
    NotSupported(String),

    #[error("Timeout: {0}")]
    Timeout(String),

    #[error("{0}")]
    Other(String),
}

impl From<reqwest::Error> for MountError {
    fn from(e: reqwest::Error) -> Self {
        MountError::HttpError(e.to_string())
    }
}

impl Serialize for MountError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
