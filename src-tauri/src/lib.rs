//! SkyMap Tauri Backend
//! 
//! Organized into the following modules:
//! - `astronomy`: Astronomical calculations and events
//! - `data`: Data storage, equipment, locations, targets, markers, observation logs
//! - `cache`: Offline tile caching and unified network caching
//! - `network`: HTTP client, security, rate limiting
//! - `platform`: App settings, control, updater, plate solver (desktop only)
//! - `utils`: Common utilities

pub mod astronomy;
pub mod data;
pub mod cache;
pub mod network;
pub mod utils;

#[cfg(desktop)]
pub mod platform;

// Re-export for backward compatibility and ease of use
use data::{
    // Storage
    clear_all_data, delete_store_data, export_all_data, get_data_directory, get_storage_stats,
    import_all_data, list_stores, load_store_data, save_store_data,
    // Equipment
    add_barlow_reducer, add_camera, add_eyepiece, add_filter, add_telescope, delete_equipment,
    get_default_camera, get_default_telescope, load_equipment, save_equipment, set_default_camera,
    set_default_telescope, update_barlow_reducer, update_camera, update_eyepiece, update_filter,
    update_telescope,
    // Locations
    add_location, delete_location, get_current_location, load_locations, save_locations,
    set_current_location, update_location,
    // Observation log
    add_observation, create_session, delete_session, end_session, get_observation_stats,
    load_observation_log, save_observation_log, search_observations, update_session,
    // Target I/O
    export_targets, import_targets,
    // Target list
    add_tag_to_targets, add_target, add_targets_batch, archive_completed_targets,
    clear_all_targets, clear_completed_targets, get_target_stats, load_target_list,
    remove_tag_from_targets, remove_target, remove_targets_batch, save_target_list, search_targets,
    set_active_target, set_targets_priority_batch, set_targets_status_batch, toggle_target_archive,
    toggle_target_favorite, update_target,
    // Markers
    add_marker, add_marker_group, clear_all_markers, get_visible_markers, load_markers,
    remove_marker, remove_marker_group, remove_markers_by_group, rename_marker_group, save_markers,
    set_all_markers_visible, set_show_markers, toggle_marker_visibility, update_marker,
};

use astronomy::{
    // Calculations
    angular_separation, calculate_fov, calculate_moon_phase, calculate_moon_position,
    calculate_mosaic_coverage, calculate_sun_position, calculate_twilight, calculate_visibility,
    ecliptic_to_equatorial, equatorial_to_ecliptic, equatorial_to_galactic,
    equatorial_to_horizontal, format_dec_dms, format_ra_hms, galactic_to_equatorial,
    horizontal_to_equatorial, parse_dec_dms, parse_ra_hms,
    // Events
    get_astro_events, get_meteor_showers, get_moon_phases_for_month, get_seasonal_events,
    get_tonight_highlights,
};

use cache::{
    // Offline cache
    clear_all_cache, clear_survey_cache, create_cache_region, delete_cache_region,
    get_cache_directory, get_cache_stats, is_tile_cached, list_cache_regions, load_cached_tile,
    save_cached_tile, update_cache_region,
    // Unified cache
    cleanup_unified_cache, clear_unified_cache, delete_unified_cache_entry,
    flush_unified_cache, get_unified_cache_entry, get_unified_cache_size,
    get_unified_cache_stats, list_unified_cache_keys, prefetch_url, prefetch_urls,
    put_unified_cache_entry,
};

use network::{
    cancel_request, get_active_requests, get_http_config, http_batch_download,
    http_cancel_all_requests, http_cancel_request, http_check_url, http_download,
    http_get, http_head, http_post, http_request, set_http_config,
};

#[cfg(desktop)]
use platform::{
    // App settings
    add_recent_file, clear_recent_files, get_system_info, load_app_settings, open_path,
    restore_window_state, reveal_in_file_manager, save_app_settings, save_window_state,
    // App control
    is_dev_mode, quit_app, reload_webview, restart_app,
    // Updater
    check_for_update, clear_pending_update, download_and_install_update, download_update,
    get_current_version, has_pending_update, install_update,
    // Plate solver
    delete_index, detect_plate_solvers, download_index, get_available_indexes,
    get_default_index_path, get_downloadable_indexes, get_installed_indexes,
    get_recommended_indexes, get_solver_indexes, get_solver_info, load_solver_config,
    plate_solve, save_solver_config, solve_image_local, validate_solver_path,
};

#[cfg(desktop)]
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Single instance plugin must be registered FIRST (desktop only)
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Focus the main window when a new instance is attempted
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Geolocation plugin (mobile only)
            #[cfg(mobile)]
            app.handle().plugin(tauri_plugin_geolocation::init())?;

            // Updater and process plugins (desktop only)
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle().plugin(tauri_plugin_process::init())?;
            }

            // Enable logging in both debug and release builds
            // Debug: Info level, Release: Warn level
            let log_level = if cfg!(debug_assertions) {
                log::LevelFilter::Debug
            } else {
                log::LevelFilter::Info
            };
            
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log_level)
                    .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                    .max_file_size(5_000_000) // 5MB max file size
                    .build(),
            )?;
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
            flush_unified_cache,
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
            // HTTP Client
            http_request,
            http_download,
            cancel_request,
            get_active_requests,
            get_http_config,
            set_http_config,
            http_get,
            http_post,
            http_head,
            http_check_url,
            http_cancel_request,
            http_cancel_all_requests,
            http_batch_download,
            // Desktop-only commands
            #[cfg(desktop)]
            load_app_settings,
            #[cfg(desktop)]
            save_app_settings,
            #[cfg(desktop)]
            save_window_state,
            #[cfg(desktop)]
            restore_window_state,
            #[cfg(desktop)]
            add_recent_file,
            #[cfg(desktop)]
            clear_recent_files,
            #[cfg(desktop)]
            get_system_info,
            #[cfg(desktop)]
            open_path,
            #[cfg(desktop)]
            reveal_in_file_manager,
            // Updater (desktop only)
            #[cfg(desktop)]
            check_for_update,
            #[cfg(desktop)]
            download_update,
            #[cfg(desktop)]
            install_update,
            #[cfg(desktop)]
            download_and_install_update,
            #[cfg(desktop)]
            get_current_version,
            #[cfg(desktop)]
            clear_pending_update,
            #[cfg(desktop)]
            has_pending_update,
            // App control (desktop only)
            #[cfg(desktop)]
            restart_app,
            #[cfg(desktop)]
            quit_app,
            #[cfg(desktop)]
            reload_webview,
            #[cfg(desktop)]
            is_dev_mode,
            // Plate Solver (desktop only)
            #[cfg(desktop)]
            detect_plate_solvers,
            #[cfg(desktop)]
            plate_solve,
            #[cfg(desktop)]
            get_solver_indexes,
            #[cfg(desktop)]
            get_downloadable_indexes,
            #[cfg(desktop)]
            download_index,
            #[cfg(desktop)]
            get_solver_info,
            #[cfg(desktop)]
            validate_solver_path,
            #[cfg(desktop)]
            solve_image_local,
            #[cfg(desktop)]
            get_available_indexes,
            #[cfg(desktop)]
            get_installed_indexes,
            #[cfg(desktop)]
            delete_index,
            #[cfg(desktop)]
            get_recommended_indexes,
            #[cfg(desktop)]
            get_default_index_path,
            #[cfg(desktop)]
            save_solver_config,
            #[cfg(desktop)]
            load_solver_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
