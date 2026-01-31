# rust-data Module

[Root](../../../CLAUDE.md) > [src-tauri/src](../) > **data**

> **Last Updated:** 2025-01-31
> **Module Type:** Rust (Data Persistence)

---

## Breadcrumb

`[Root](../../../CLAUDE.md) > [src-tauri/src](../) > **data**`

---

## Module Responsibility

The `data` module provides file-based JSON storage for all persistent application data. It uses the platform's app data directory and provides a generic storage system that works with Zustand's persistence layer.

**Design Principle:** All data is stored as JSON files in a `skymap/stores/` subdirectory of the platform's app data directory.

---

## Files

| File | Purpose |
|------|---------|
| `mod.rs` | Module exports |
| `storage.rs` | Generic JSON storage system |
| `equipment.rs` | Equipment (telescopes, cameras, etc.) management |
| `locations.rs` | Observing location management |
| `targets.rs` | Target list management |
| `markers.rs` | Sky marker persistence |
| `observation_log.rs` | Observation logging |
| `target_io.rs` | Target list import/export |

---

## Tauri Commands

### storage.rs - Generic Storage

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `save_store_data` | store_name, data | `()` | Save JSON to store file |
| `load_store_data` | store_name | `Option<String>` | Load JSON from store |
| `delete_store_data` | store_name | `bool` | Delete store file |
| `list_stores` | - | `Vec<String>` | List all stores |
| `export_all_data` | export_path | `()` | Export all stores to JSON |
| `import_all_data` | import_path | `ImportResult` | Import from JSON |
| `get_data_directory` | - | `String` | Get stores directory path |
| `get_storage_stats` | - | `StorageStats` | Get storage statistics |
| `clear_all_data` | - | `usize` | Delete all stores |

### equipment.rs

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `load_equipment` | - | `EquipmentData` | Load all equipment |
| `save_equipment` | data | `()` | Save all equipment |
| `add_telescope` | telescope | `String` (id) | Add telescope |
| `add_camera` | camera | `String` (id) | Add camera |
| `add_eyepiece` | eyepiece | `String` (id) | Add eyepiece |
| `add_filter` | filter | `String` (id) | Add filter |
| `add_barlow_reducer` | barlow | `String` (id) | Add Barlow/reducer |
| `delete_equipment` | type, id | `()` | Delete equipment item |
| `update_telescope` | id, data | `()` | Update telescope |
| `update_camera` | id, data | `()` | Update camera |
| `update_eyepiece` | id, data | `()` | Update eyepiece |
| `update_filter` | id, data | `()` | Update filter |
| `update_barlow_reducer` | id, data | `()` | Update Barlow/reducer |
| `set_default_telescope` | id | `()` | Set default telescope |
| `set_default_camera` | id | `()` | Set default camera |
| `get_default_telescope` | - | `Option<Telescope>` | Get default telescope |
| `get_default_camera` | - | `Option<Camera>` | Get default camera |

### locations.rs

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `load_locations` | - | `Vec<Location>` | Load all locations |
| `save_locations` | locations | `()` | Save all locations |
| `add_location` | location | `String` (id) | Add location |
| `update_location` | id, data | `()` | Update location |
| `delete_location` | id | `()` | Delete location |
| `set_current_location` | id | `()` | Set current location |
| `get_current_location` | - | `Option<Location>` | Get current location |

### targets.rs

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `load_target_list` | - | `TargetList` | Load target list |
| `save_target_list` | data | `()` | Save target list |
| `add_target` | target | `String` (id) | Add target |
| `add_targets_batch` | targets | `Vec<String>` (ids) | Add multiple targets |
| `update_target` | id, data | `()` | Update target |
| `remove_target` | id | `()` | Remove target |
| `remove_targets_batch` | ids | `()` | Remove multiple |
| `set_active_target` | id | `()` | Set active target |
| `toggle_target_favorite` | id | `()` | Toggle favorite |
| `toggle_target_archive` | id | `()` | Toggle archive |
| `set_targets_status_batch` | ids, status | `()` | Batch status update |
| `set_targets_priority_batch` | ids, priority | `()` | Batch priority update |
| `archive_completed_targets` | - | `()` | Archive completed |
| `clear_completed_targets` | - | `()` | Clear completed |
| `clear_all_targets` | - | `()` | Clear all |
| `add_tag_to_targets` | ids, tag | `()` | Add tag |
| `remove_tag_from_targets` | ids, tag | `()` | Remove tag |
| `search_targets` | query | `Vec<Target>` | Search targets |
| `get_target_stats` | - | `TargetStats` | Get statistics |

### markers.rs

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `load_markers` | - | `Vec<Marker>` | Load all markers |
| `save_markers` | markers | `()` | Save all markers |
| `add_marker` | marker | `String` (id) | Add marker |
| `update_marker` | id, data | `()` | Update marker |
| `remove_marker` | id | `()` | Remove marker |
| `remove_markers_by_group` | group | `()` | Remove group |
| `remove_marker_group` | group | `()` | Delete group |
| `clear_all_markers` | - | `()` | Clear all markers |
| `toggle_marker_visibility` | id | `()` | Toggle visibility |
| `set_all_markers_visible` | visible | `()` | Set all visibility |
| `set_show_markers` | show | `()` | Enable/disable markers |
| `add_marker_group` | group | `()` | Add group |
| `rename_marker_group` | old, new | `()` | Rename group |
| `get_visible_markers` | - | `Vec<Marker>` | Get visible markers |

### observation_log.rs

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `load_observation_log` | - | `ObservationLog` | Load log |
| `save_observation_log` | log | `()` | Save log |
| `create_session` | session | `String` (id) | Create session |
| `add_observation` | session_id, obs | `String` (id) | Add observation |
| `update_session` | id, data | `()` | Update session |
| `end_session` | id | `()` | End session |
| `delete_session` | id | `()` | Delete session |
| `get_observation_stats` | - | `ObsStats` | Get statistics |
| `search_observations` | query | `Vec<Observation>` | Search |

### target_io.rs

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `export_targets` | path, ids | `()` | Export to CSV/JSON |
| `import_targets` | path | `ImportResult` | Import targets |

---

## Data Types

### Storage Types

```rust
pub struct StorageStats {
    pub total_size: u64,
    pub store_count: usize,
    pub stores: Vec<StoreInfo>,
    pub directory: String,
}

pub struct ExportData {
    pub metadata: ExportMetadata,
    pub stores: HashMap<String, serde_json::Value>,
}

pub struct ImportResult {
    pub imported_count: usize,
    pub skipped_count: usize,
    pub errors: Vec<String>,
    pub metadata: ExportMetadata,
}
```

### Equipment Types

```rust
pub struct Telescope {
    pub id: String,
    pub name: String,
    pub focal_length: f64,  // mm
    pub aperture: f64,      // mm
    pub is_default: bool,
}

pub struct Camera {
    pub id: String,
    pub name: String,
    pub sensor_width: f64,   // mm
    pub sensor_height: f64,  // mm
    pub pixel_size: f64,     // μm
    pub is_default: bool,
}

pub struct Eyepiece {
    pub id: String,
    pub name: String,
    pub focal_length: f64,  // mm
    pub field_of_view: f64, // degrees
}

pub struct Filter {
    pub id: String,
    pub name: String,
    pub filter_type: String,
}
```

### Target Types

```rust
pub struct Target {
    pub id: String,
    pub name: String,
    pub ra: f64,
    pub dec: f64,
    pub object_type: String,
    pub magnitude: Option<f64>,
    pub size: Option<String>,
    pub notes: Option<String>,
    pub status: TargetStatus,
    pub priority: TargetPriority,
    pub is_favorite: bool,
    pub is_archived: bool,
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

pub enum TargetStatus {
    Pending,
    Observed,
    Completed,
    Skipped,
}

pub enum TargetPriority {
    Low,
    Normal,
    High,
}
```

---

## Storage Paths

Data is stored in the platform's app data directory:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\skymap\stores\` |
| macOS | `~/Library/Application Support/skymap/stores/` |
| Linux | `~/.local/share/skymap/stores/` |

Each store is a JSON file: `<store-name>.json`

---

## Known Store Names

```rust
const KNOWN_STORES: &[&str] = &[
    "starmap-target-list",
    "starmap-markers",
    "starmap-settings",
    "starmap-equipment",
    "starmap-onboarding",
    "skymap-offline",
    "skymap-locale",
];
```

---

## Security

- All input is validated for size limits
- JSON is validated before parsing
- Path sandboxing prevents directory traversal
- File operations use platform-appropriate APIs

---

## Testing

```bash
cd src-tauri
cargo test data::storage::tests
cargo test data::equipment::tests
cargo test data::targets::tests
```

---

## Related Files

- [`mod.rs`](./mod.rs) - Module exports
- [`storage.rs`](./storage.rs) - Generic storage implementation
- [`equipment.rs`](./equipment.rs) - Equipment management
- [`targets.rs`](./targets.rs) - Target list management
- [../CLAUDE.md](../CLAUDE.md) - Backend documentation
