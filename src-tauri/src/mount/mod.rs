//! Mount control module
//!
//! Provides telescope mount communication via:
//! - ASCOM Alpaca REST API
//! - Built-in simulator (for development/testing)
//!
//! Submodules:
//! - `types`: Shared type definitions
//! - `simulator`: Built-in mount simulator
//! - `alpaca_client`: ASCOM Alpaca REST client
//! - `commands`: Tauri commands

pub mod types;
pub mod simulator;
pub mod alpaca_client;
pub mod commands;

pub use commands::{
    mount_connect,
    mount_disconnect,
    mount_get_state,
    mount_get_capabilities,
    mount_slew_to,
    mount_sync_to,
    mount_abort_slew,
    mount_park,
    mount_unpark,
    mount_set_tracking,
    mount_set_tracking_rate,
    mount_move_axis,
    mount_stop_axis,
    mount_set_slew_rate,
    mount_discover,
};
