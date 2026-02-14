//! Built-in mount simulator
//!
//! Provides a virtual mount for development and testing without real hardware.
//! Simulates sidereal tracking, async slewing, parking, and pier side changes.

use std::time::Instant;

use crate::mount::types::*;

/// Simulated slew speed in degrees per second
const SLEW_SPEED_DEG_PER_SEC: f64 = 5.0;

/// Park position (Celestial pole)
const PARK_RA: f64 = 0.0;
const PARK_DEC: f64 = 90.0;

/// Internal simulator state
pub struct MountSimulator {
    connected: bool,
    ra: f64,
    dec: f64,
    tracking: bool,
    tracking_rate: TrackingRate,
    slewing: bool,
    parked: bool,
    at_home: bool,
    pier_side: PierSide,
    slew_rate_index: usize,

    // Slew target (when slewing)
    slew_target_ra: f64,
    slew_target_dec: f64,

    // Axis motion (manual NSEW)
    primary_axis_rate: f64,
    secondary_axis_rate: f64,

    // Timing
    last_tick: Instant,
}

impl MountSimulator {
    pub fn new() -> Self {
        Self {
            connected: false,
            ra: PARK_RA,
            dec: PARK_DEC,
            tracking: false,
            tracking_rate: TrackingRate::Sidereal,
            slewing: false,
            parked: true,
            at_home: true,
            pier_side: PierSide::West,
            slew_rate_index: 3,
            slew_target_ra: 0.0,
            slew_target_dec: 0.0,
            primary_axis_rate: 0.0,
            secondary_axis_rate: 0.0,
            last_tick: Instant::now(),
        }
    }

    /// Advance simulation by elapsed time
    pub fn tick(&mut self) {
        if !self.connected {
            return;
        }

        let now = Instant::now();
        let dt = now.duration_since(self.last_tick).as_secs_f64();
        self.last_tick = now;

        if dt <= 0.0 || dt > 10.0 {
            return;
        }

        // Handle goto slewing
        if self.slewing {
            let dra = self.slew_target_ra - self.ra;
            let ddec = self.slew_target_dec - self.dec;

            // Wrap RA difference to [-180, 180]
            let dra = ((dra + 180.0) % 360.0 + 360.0) % 360.0 - 180.0;

            let dist = (dra * dra + ddec * ddec).sqrt();

            if dist < 0.01 {
                // Arrived
                self.ra = self.slew_target_ra;
                self.dec = self.slew_target_dec;
                self.slewing = false;
            } else {
                let step = SLEW_SPEED_DEG_PER_SEC * dt;
                if step >= dist {
                    self.ra = self.slew_target_ra;
                    self.dec = self.slew_target_dec;
                    self.slewing = false;
                } else {
                    let factor = step / dist;
                    self.ra += dra * factor;
                    self.dec += ddec * factor;
                }
            }

            self.normalize_coordinates();
            self.update_pier_side();
            return;
        }

        // Handle manual axis motion
        if self.primary_axis_rate.abs() > 0.001 || self.secondary_axis_rate.abs() > 0.001 {
            self.ra += self.primary_axis_rate * SIDEREAL_RATE_DEG_PER_SEC * dt;
            self.dec += self.secondary_axis_rate * SIDEREAL_RATE_DEG_PER_SEC * dt;
            self.dec = self.dec.clamp(-90.0, 90.0);
            self.normalize_coordinates();
            self.update_pier_side();
        }

        // Handle sidereal tracking
        if self.tracking && !self.parked {
            let rate = match self.tracking_rate {
                TrackingRate::Sidereal => SIDEREAL_RATE_DEG_PER_SEC,
                TrackingRate::Lunar => SIDEREAL_RATE_DEG_PER_SEC * 0.9673,
                TrackingRate::Solar => SIDEREAL_RATE_DEG_PER_SEC * 0.9973,
                TrackingRate::Stopped => 0.0,
            };
            self.ra += rate * dt;
            self.normalize_coordinates();
        }
    }

    fn normalize_coordinates(&mut self) {
        self.ra = ((self.ra % 360.0) + 360.0) % 360.0;
    }

    fn update_pier_side(&mut self) {
        // Simplified heuristic: RA 0-180 → West, 180-360 → East.
        // A real GEM determines pier side from hour angle (HA = LST − RA),
        // which requires the observer's longitude and current sidereal time.
        // This approximation is sufficient for the simulator's UI testing
        // purposes but will not match real hardware behaviour.
        if self.ra >= 0.0 && self.ra < 180.0 {
            self.pier_side = PierSide::West;
        } else {
            self.pier_side = PierSide::East;
        }
    }

    // ========================================================================
    // Public API (mirrors MountDriver trait)
    // ========================================================================

    pub fn connect(&mut self) -> Result<(), MountError> {
        self.connected = true;
        self.last_tick = Instant::now();
        log::info!("Mount simulator connected");
        Ok(())
    }

    pub fn disconnect(&mut self) -> Result<(), MountError> {
        self.connected = false;
        self.tracking = false;
        self.slewing = false;
        self.primary_axis_rate = 0.0;
        self.secondary_axis_rate = 0.0;
        log::info!("Mount simulator disconnected");
        Ok(())
    }

    pub fn get_state(&mut self) -> MountState {
        self.tick();
        MountState {
            connected: self.connected,
            ra: self.ra,
            dec: self.dec,
            tracking: self.tracking,
            tracking_rate: self.tracking_rate,
            slewing: self.slewing,
            parked: self.parked,
            at_home: self.at_home,
            pier_side: self.pier_side,
            slew_rate_index: self.slew_rate_index,
        }
    }

    pub fn get_capabilities(&self) -> MountCapabilities {
        MountCapabilities::default()
    }

    pub fn slew_to(&mut self, ra: f64, dec: f64) -> Result<(), MountError> {
        if !self.connected {
            return Err(MountError::NotConnected);
        }
        if self.parked {
            return Err(MountError::Parked);
        }

        self.slew_target_ra = ((ra % 360.0) + 360.0) % 360.0;
        self.slew_target_dec = dec.clamp(-90.0, 90.0);
        self.slewing = true;
        self.at_home = false;
        self.last_tick = Instant::now();
        log::info!(
            "Simulator slewing to RA={:.4}° Dec={:.4}°",
            self.slew_target_ra,
            self.slew_target_dec
        );
        Ok(())
    }

    pub fn sync_to(&mut self, ra: f64, dec: f64) -> Result<(), MountError> {
        if !self.connected {
            return Err(MountError::NotConnected);
        }
        self.ra = ((ra % 360.0) + 360.0) % 360.0;
        self.dec = dec.clamp(-90.0, 90.0);
        self.update_pier_side();
        log::info!("Simulator synced to RA={:.4}° Dec={:.4}°", self.ra, self.dec);
        Ok(())
    }

    pub fn abort_slew(&mut self) -> Result<(), MountError> {
        self.slewing = false;
        self.primary_axis_rate = 0.0;
        self.secondary_axis_rate = 0.0;
        log::info!("Simulator slew aborted");
        Ok(())
    }

    pub fn park(&mut self) -> Result<(), MountError> {
        if !self.connected {
            return Err(MountError::NotConnected);
        }
        self.slew_target_ra = PARK_RA;
        self.slew_target_dec = PARK_DEC;
        self.slewing = true;
        self.tracking = false;
        // Will set parked=true when slew completes
        // For simplicity, set it immediately after starting slew
        self.parked = true;
        self.at_home = true;
        log::info!("Simulator parking");
        Ok(())
    }

    pub fn unpark(&mut self) -> Result<(), MountError> {
        if !self.connected {
            return Err(MountError::NotConnected);
        }
        self.parked = false;
        self.tracking = true;
        log::info!("Simulator unparked");
        Ok(())
    }

    pub fn set_tracking(&mut self, enabled: bool) -> Result<(), MountError> {
        if !self.connected {
            return Err(MountError::NotConnected);
        }
        if self.parked {
            return Err(MountError::Parked);
        }
        self.tracking = enabled;
        log::info!("Simulator tracking: {}", enabled);
        Ok(())
    }

    pub fn set_tracking_rate(&mut self, rate: TrackingRate) -> Result<(), MountError> {
        if !self.connected {
            return Err(MountError::NotConnected);
        }
        self.tracking_rate = rate;
        log::info!("Simulator tracking rate: {:?}", rate);
        Ok(())
    }

    pub fn move_axis(&mut self, axis: MountAxis, rate: f64) -> Result<(), MountError> {
        if !self.connected {
            return Err(MountError::NotConnected);
        }
        if self.parked {
            return Err(MountError::Parked);
        }
        match axis {
            MountAxis::Primary => self.primary_axis_rate = rate,
            MountAxis::Secondary => self.secondary_axis_rate = rate,
        }
        Ok(())
    }

    pub fn stop_axis(&mut self, axis: MountAxis) -> Result<(), MountError> {
        match axis {
            MountAxis::Primary => self.primary_axis_rate = 0.0,
            MountAxis::Secondary => self.secondary_axis_rate = 0.0,
        }
        Ok(())
    }

    pub fn set_slew_rate_index(&mut self, index: usize) {
        if index < SLEW_RATES.len() {
            self.slew_rate_index = index;
        }
    }
}
