mod storage;
mod equipment;
mod locations;
mod observation_log;
mod target_io;
mod app_settings;
mod astronomy;
mod offline_cache;
mod unified_cache;
mod astro_events;
mod target_list;
mod markers;

use storage::{
    clear_all_data, delete_store_data, export_all_data, get_data_directory,
    get_storage_stats, import_all_data, list_stores, load_store_data, save_store_data,
};

use equipment::{
    load_equipment, save_equipment, add_telescope, add_camera, add_eyepiece, delete_equipment,
    add_barlow_reducer, add_filter, update_telescope, update_camera, update_eyepiece,
    update_barlow_reducer, update_filter, set_default_telescope, set_default_camera,
    get_default_telescope, get_default_camera,
};

use locations::{
    load_locations, save_locations, add_location, update_location, delete_location,
    set_current_location, get_current_location,
};

use observation_log::{
    load_observation_log, save_observation_log, create_session, add_observation,
    update_session, end_session, delete_session, get_observation_stats, search_observations,
};

use target_io::{
    export_targets, import_targets,
};

use app_settings::{
    load_app_settings, save_app_settings, save_window_state, restore_window_state,
    add_recent_file, clear_recent_files, get_system_info, open_path, reveal_in_file_manager,
};

use astronomy::{
    equatorial_to_horizontal, horizontal_to_equatorial, equatorial_to_galactic,
    galactic_to_equatorial, equatorial_to_ecliptic, ecliptic_to_equatorial,
    calculate_visibility, calculate_twilight, calculate_moon_phase, calculate_moon_position,
    calculate_sun_position, calculate_fov, calculate_mosaic_coverage, angular_separation,
    format_ra_hms, format_dec_dms, parse_ra_hms, parse_dec_dms,
};

use offline_cache::{
    get_cache_stats, list_cache_regions, create_cache_region, update_cache_region,
    delete_cache_region, save_cached_tile, load_cached_tile, is_tile_cached,
    clear_survey_cache, clear_all_cache, get_cache_directory,
};

use unified_cache::{
    get_unified_cache_entry, put_unified_cache_entry, delete_unified_cache_entry,
    clear_unified_cache, get_unified_cache_size, list_unified_cache_keys,
    get_unified_cache_stats, cleanup_unified_cache, prefetch_url, prefetch_urls,
};

use astro_events::{
    get_moon_phases_for_month, get_meteor_showers, get_seasonal_events,
    get_astro_events, get_tonight_highlights,
};

use target_list::{
    load_target_list, save_target_list, add_target, add_targets_batch,
    update_target, remove_target, remove_targets_batch, set_active_target,
    toggle_target_favorite, toggle_target_archive, set_targets_status_batch,
    set_targets_priority_batch, add_tag_to_targets, remove_tag_from_targets,
    archive_completed_targets, clear_completed_targets, clear_all_targets,
    search_targets, get_target_stats,
};

use markers::{
    load_markers, save_markers, add_marker, update_marker, remove_marker,
    remove_markers_by_group, clear_all_markers, toggle_marker_visibility,
    set_all_markers_visible, set_show_markers, add_marker_group,
    remove_marker_group, rename_marker_group, get_visible_markers,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Storage
            save_store_data,
            load_store_data,
            delete_store_data,
            list_stores,
            export_all_data,
            import_all_data,
            get_data_directory,
            get_storage_stats,
            clear_all_data,
            // Equipment
            load_equipment,
            save_equipment,
            add_telescope,
            add_camera,
            add_eyepiece,
            delete_equipment,
            add_barlow_reducer,
            add_filter,
            update_telescope,
            update_camera,
            update_eyepiece,
            update_barlow_reducer,
            update_filter,
            set_default_telescope,
            set_default_camera,
            get_default_telescope,
            get_default_camera,
            // Locations
            load_locations,
            save_locations,
            add_location,
            update_location,
            delete_location,
            set_current_location,
            get_current_location,
            // Observation log
            load_observation_log,
            save_observation_log,
            create_session,
            add_observation,
            update_session,
            end_session,
            delete_session,
            get_observation_stats,
            search_observations,
            // Target import/export
            export_targets,
            import_targets,
            // App settings
            load_app_settings,
            save_app_settings,
            save_window_state,
            restore_window_state,
            add_recent_file,
            clear_recent_files,
            get_system_info,
            open_path,
            reveal_in_file_manager,
            // Astronomy calculations
            equatorial_to_horizontal,
            horizontal_to_equatorial,
            equatorial_to_galactic,
            galactic_to_equatorial,
            equatorial_to_ecliptic,
            ecliptic_to_equatorial,
            calculate_visibility,
            calculate_twilight,
            calculate_moon_phase,
            calculate_moon_position,
            calculate_sun_position,
            calculate_fov,
            calculate_mosaic_coverage,
            angular_separation,
            format_ra_hms,
            format_dec_dms,
            parse_ra_hms,
            parse_dec_dms,
            // Offline cache
            get_cache_stats,
            list_cache_regions,
            create_cache_region,
            update_cache_region,
            delete_cache_region,
            save_cached_tile,
            load_cached_tile,
            is_tile_cached,
            clear_survey_cache,
            clear_all_cache,
            get_cache_directory,
            // Unified cache
            get_unified_cache_entry,
            put_unified_cache_entry,
            delete_unified_cache_entry,
            clear_unified_cache,
            get_unified_cache_size,
            list_unified_cache_keys,
            get_unified_cache_stats,
            cleanup_unified_cache,
            prefetch_url,
            prefetch_urls,
            // Astro events
            get_moon_phases_for_month,
            get_meteor_showers,
            get_seasonal_events,
            get_astro_events,
            get_tonight_highlights,
            // Target list
            load_target_list,
            save_target_list,
            add_target,
            add_targets_batch,
            update_target,
            remove_target,
            remove_targets_batch,
            set_active_target,
            toggle_target_favorite,
            toggle_target_archive,
            set_targets_status_batch,
            set_targets_priority_batch,
            add_tag_to_targets,
            remove_tag_from_targets,
            archive_completed_targets,
            clear_completed_targets,
            clear_all_targets,
            search_targets,
            get_target_stats,
            // Markers
            load_markers,
            save_markers,
            add_marker,
            update_marker,
            remove_marker,
            remove_markers_by_group,
            clear_all_markers,
            toggle_marker_visibility,
            set_all_markers_visible,
            set_show_markers,
            add_marker_group,
            remove_marker_group,
            rename_marker_group,
            get_visible_markers,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
