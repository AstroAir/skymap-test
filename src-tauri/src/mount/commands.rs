//! Tauri commands for mount control
//!
//! All commands are async and use a global `Mutex` to hold the active mount instance.

use once_cell::sync::Lazy;
use tokio::sync::Mutex;

use crate::mount::alpaca_client::AlpacaClient;
use crate::mount::simulator::MountSimulator;
use crate::mount::types::*;

// ============================================================================
// Mount driver abstraction
// ============================================================================

enum MountDriver {
    Simulator(MountSimulator),
    Alpaca(AlpacaClient),
}

static MOUNT: Lazy<Mutex<Option<MountDriver>>> = Lazy::new(|| Mutex::new(None));

// ============================================================================
// Connection commands
// ============================================================================

#[tauri::command]
pub async fn mount_connect(
    protocol: MountProtocol,
    host: String,
    port: u16,
    device_id: u32,
) -> Result<MountCapabilities, MountError> {
    let mut guard = MOUNT.lock().await;

    // Disconnect existing if any
    if let Some(ref mut driver) = *guard {
        match driver {
            MountDriver::Simulator(sim) => { let _ = sim.disconnect(); }
            MountDriver::Alpaca(client) => { let _ = client.disconnect().await; }
        }
    }

    match protocol {
        MountProtocol::Simulator => {
            let mut sim = MountSimulator::new();
            sim.connect()?;
            let caps = sim.get_capabilities();
            *guard = Some(MountDriver::Simulator(sim));
            log::info!("Mount connected via Simulator");
            Ok(caps)
        }
        MountProtocol::Alpaca => {
            let client = AlpacaClient::new(&host, port, device_id);
            client.connect().await.map_err(|e| {
                MountError::ConnectionFailed(format!("Alpaca connection to {}:{} failed: {}", host, port, e))
            })?;
            let caps = client.get_capabilities().await.unwrap_or_default();
            *guard = Some(MountDriver::Alpaca(client));
            log::info!("Mount connected via Alpaca to {}:{}", host, port);
            Ok(caps)
        }
    }
}

#[tauri::command]
pub async fn mount_disconnect() -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    if let Some(ref mut driver) = *guard {
        match driver {
            MountDriver::Simulator(sim) => sim.disconnect()?,
            MountDriver::Alpaca(client) => client.disconnect().await?,
        }
    }
    *guard = None;
    Ok(())
}

// ============================================================================
// State query
// ============================================================================

#[tauri::command]
pub async fn mount_get_state() -> Result<MountState, MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => Ok(sim.get_state()),
        Some(MountDriver::Alpaca(client)) => client.get_state().await,
        None => Ok(MountState::default()),
    }
}

#[tauri::command]
pub async fn mount_get_capabilities() -> Result<MountCapabilities, MountError> {
    let guard = MOUNT.lock().await;
    match guard.as_ref() {
        Some(MountDriver::Simulator(sim)) => Ok(sim.get_capabilities()),
        Some(MountDriver::Alpaca(client)) => client.get_capabilities().await,
        None => Err(MountError::NotConnected),
    }
}

// ============================================================================
// Slew / Sync / Abort
// ============================================================================

/// Slew to coordinates (RA in degrees, Dec in degrees)
#[tauri::command]
pub async fn mount_slew_to(ra: f64, dec: f64) -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => sim.slew_to(ra, dec),
        Some(MountDriver::Alpaca(client)) => {
            // Alpaca expects RA in hours
            let ra_hours = ra / 15.0;
            client.slew_to_coordinates_async(ra_hours, dec).await
        }
        None => Err(MountError::NotConnected),
    }
}

/// Sync mount to coordinates (RA in degrees, Dec in degrees)
#[tauri::command]
pub async fn mount_sync_to(ra: f64, dec: f64) -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => sim.sync_to(ra, dec),
        Some(MountDriver::Alpaca(client)) => {
            let ra_hours = ra / 15.0;
            client.sync_to_coordinates(ra_hours, dec).await
        }
        None => Err(MountError::NotConnected),
    }
}

#[tauri::command]
pub async fn mount_abort_slew() -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => sim.abort_slew(),
        Some(MountDriver::Alpaca(client)) => client.abort_slew().await,
        None => Err(MountError::NotConnected),
    }
}

// ============================================================================
// Park / Unpark
// ============================================================================

#[tauri::command]
pub async fn mount_park() -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => sim.park(),
        Some(MountDriver::Alpaca(client)) => client.park().await,
        None => Err(MountError::NotConnected),
    }
}

#[tauri::command]
pub async fn mount_unpark() -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => sim.unpark(),
        Some(MountDriver::Alpaca(client)) => client.unpark().await,
        None => Err(MountError::NotConnected),
    }
}

// ============================================================================
// Tracking
// ============================================================================

#[tauri::command]
pub async fn mount_set_tracking(enabled: bool) -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => sim.set_tracking(enabled),
        Some(MountDriver::Alpaca(client)) => client.set_tracking(enabled).await,
        None => Err(MountError::NotConnected),
    }
}

#[tauri::command]
pub async fn mount_set_tracking_rate(rate: TrackingRate) -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => sim.set_tracking_rate(rate),
        Some(MountDriver::Alpaca(client)) => client.set_tracking_rate(rate).await,
        None => Err(MountError::NotConnected),
    }
}

// ============================================================================
// Manual motion
// ============================================================================

/// Move axis at a rate multiplier (e.g., 16.0 = 16x sidereal)
#[tauri::command]
pub async fn mount_move_axis(axis: MountAxis, rate: f64) -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => sim.move_axis(axis, rate),
        Some(MountDriver::Alpaca(client)) => {
            // Alpaca MoveAxis expects rate in degrees/sec
            let deg_per_sec = rate * SIDEREAL_RATE_DEG_PER_SEC;
            client.move_axis(axis, deg_per_sec).await
        }
        None => Err(MountError::NotConnected),
    }
}

#[tauri::command]
pub async fn mount_stop_axis(axis: MountAxis) -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => sim.stop_axis(axis),
        Some(MountDriver::Alpaca(client)) => client.stop_axis(axis).await,
        None => Err(MountError::NotConnected),
    }
}

/// Set the slew rate index (for UI display, simulator uses internally)
#[tauri::command]
pub async fn mount_set_slew_rate(index: usize) -> Result<(), MountError> {
    let mut guard = MOUNT.lock().await;
    match guard.as_mut() {
        Some(MountDriver::Simulator(sim)) => {
            sim.set_slew_rate_index(index);
            Ok(())
        }
        Some(MountDriver::Alpaca(_)) => {
            // Alpaca doesn't have a slew rate concept — rate is passed per MoveAxis call
            Ok(())
        }
        None => Err(MountError::NotConnected),
    }
}

// ============================================================================
// Discovery
// ============================================================================

#[tauri::command]
pub async fn mount_discover() -> Result<Vec<DiscoveredDevice>, MountError> {
    AlpacaClient::discover(3000).await
}
