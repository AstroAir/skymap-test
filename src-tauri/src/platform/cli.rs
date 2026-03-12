use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_cli::{CliExt, Matches};

pub const CLI_SECOND_INSTANCE_EVENT: &str = "cli-second-instance";

#[derive(Debug, Clone, Serialize)]
pub struct ForwardedCliInvocation {
    pub args: Vec<String>,
    pub cwd: Option<String>,
}

#[tauri::command]
pub fn parse_cli_matches_from_args(app: AppHandle, args: Vec<String>) -> Result<Matches, String> {
    app.cli().matches_from(args).map_err(|error| error.to_string())
}

pub fn handle_forwarded_cli_invocation<R: Runtime>(app: &AppHandle<R>, args: Vec<String>, cwd: String) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }

    let _ = app.emit(
        CLI_SECOND_INSTANCE_EVENT,
        ForwardedCliInvocation {
            args,
            cwd: if cwd.is_empty() { None } else { Some(cwd) },
        },
    );
}
