mod storage;
mod equipment;
mod locations;
mod observation_log;
mod target_io;
mod app_settings;

use storage::{
    clear_all_data, delete_store_data, export_all_data, get_data_directory,
    get_storage_stats, import_all_data, list_stores, load_store_data, save_store_data,
};

use equipment::{
    load_equipment, save_equipment, add_telescope, add_camera, add_eyepiece, delete_equipment,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
