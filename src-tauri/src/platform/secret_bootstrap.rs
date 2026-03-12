use rand::distributions::{Alphanumeric, DistString};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

use crate::data::StorageError;

const SECRET_BOOTSTRAP_SERVICE: &str = "com.skymap.desktop.secret-vault";
const SECRET_BOOTSTRAP_ACCOUNT: &str = "bootstrap";
const SECRET_CLIENT_NAME: &str = "skymap";
const SECRET_STORE_NAME: &str = "secrets";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SecretVaultBootstrap {
    pub password: String,
    pub vault_path: String,
    pub client_name: String,
    pub store_name: String,
}

fn build_vault_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let data_dir = super::path_config::resolve_data_dir(app)?;
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir)?;
    }
    Ok(data_dir.join("secret-vault.hold"))
}

fn get_bootstrap_entry() -> Result<keyring::Entry, StorageError> {
    keyring::Entry::new(SECRET_BOOTSTRAP_SERVICE, SECRET_BOOTSTRAP_ACCOUNT)
        .map_err(|error| StorageError::Other(format!("Failed to create bootstrap keyring entry: {error}")))
}

fn load_or_create_password() -> Result<String, StorageError> {
    let entry = get_bootstrap_entry()?;

    match entry.get_password() {
        Ok(password) if !password.trim().is_empty() => Ok(password),
        Ok(_) | Err(keyring::Error::NoEntry) => {
            let password = Alphanumeric.sample_string(&mut rand::thread_rng(), 64);
            entry
                .set_password(&password)
                .map_err(|error| StorageError::Other(format!("Failed to save bootstrap password: {error}")))?;
            Ok(password)
        }
        Err(error) => Err(StorageError::Other(format!(
            "Failed to load bootstrap password: {error}"
        ))),
    }
}

#[tauri::command]
pub async fn get_or_create_secret_vault_bootstrap(
    app: AppHandle,
) -> Result<SecretVaultBootstrap, StorageError> {
    let password = load_or_create_password()?;
    let vault_path = build_vault_path(&app)?;

    Ok(SecretVaultBootstrap {
        password,
        vault_path: vault_path.to_string_lossy().to_string(),
        client_name: SECRET_CLIENT_NAME.to_string(),
        store_name: SECRET_STORE_NAME.to_string(),
    })
}
