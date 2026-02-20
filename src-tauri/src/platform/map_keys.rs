//! Secure map API key storage.
//! Stores key metadata on disk and key secrets in OS secure credential storage.

use chrono::Utc;
use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

use crate::data::StorageError;

const KEYRING_SERVICE: &str = "com.skymap.desktop.mapkeys";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MapApiKeyQuota {
    pub daily: Option<u64>,
    pub monthly: Option<u64>,
    pub used: Option<u64>,
    pub reset_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MapApiKeyRestrictions {
    pub domains: Option<Vec<String>>,
    pub ips: Option<Vec<String>>,
    pub regions: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MapApiKeyMeta {
    pub id: String,
    pub provider: String,
    pub label: Option<String>,
    pub is_default: Option<bool>,
    pub is_active: Option<bool>,
    pub quota: Option<MapApiKeyQuota>,
    pub restrictions: Option<MapApiKeyRestrictions>,
    pub created_at: String,
    pub last_used: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MapApiKeyRecord {
    #[serde(flatten)]
    pub meta: MapApiKeyMeta,
    pub api_key: String,
}

fn get_meta_path(app: &AppHandle) -> Result<PathBuf, StorageError> {
    let dir = super::path_config::resolve_data_dir(app)?;
    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }
    Ok(dir.join("map_keys_meta.json"))
}

fn load_meta(app: &AppHandle) -> Result<Vec<MapApiKeyMeta>, StorageError> {
    let path = get_meta_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(path)?;
    Ok(serde_json::from_str(&content)?)
}

fn save_meta(app: &AppHandle, metas: &[MapApiKeyMeta]) -> Result<(), StorageError> {
    let path = get_meta_path(app)?;
    let content = serde_json::to_string_pretty(metas)?;
    fs::write(path, content)?;
    Ok(())
}

fn entry_for_key(key_id: &str) -> Result<Entry, StorageError> {
    Entry::new(KEYRING_SERVICE, key_id)
        .map_err(|e| StorageError::Other(format!("Failed to create keyring entry: {e}")))
}

#[tauri::command]
pub async fn save_map_api_key(app: AppHandle, key: MapApiKeyRecord) -> Result<(), StorageError> {
    let entry = entry_for_key(&key.meta.id)?;
    entry
        .set_password(&key.api_key)
        .map_err(|e| StorageError::Other(format!("Failed to save key to secure storage: {e}")))?;

    let mut metas = load_meta(&app)?;
    if let Some(existing) = metas.iter_mut().find(|m| m.id == key.meta.id) {
        *existing = key.meta.clone();
    } else {
        metas.push(key.meta.clone());
    }

    if key.meta.is_active.unwrap_or(false) {
        for meta in metas.iter_mut() {
            if meta.provider == key.meta.provider && meta.id != key.meta.id {
                meta.is_active = Some(false);
            }
        }
    }

    if key.meta.is_default.unwrap_or(false) {
        for meta in metas.iter_mut() {
            if meta.provider == key.meta.provider && meta.id != key.meta.id {
                meta.is_default = Some(false);
            }
        }
    }

    save_meta(&app, &metas)
}

#[tauri::command]
pub async fn list_map_api_keys_meta(app: AppHandle) -> Result<Vec<MapApiKeyMeta>, StorageError> {
    load_meta(&app)
}

#[tauri::command]
pub async fn get_map_api_key(key_id: String) -> Result<Option<String>, StorageError> {
    let entry = entry_for_key(&key_id)?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(StorageError::Other(format!(
            "Failed to read key from secure storage: {e}"
        ))),
    }
}

#[tauri::command]
pub async fn delete_map_api_key(app: AppHandle, key_id: String) -> Result<(), StorageError> {
    let entry = entry_for_key(&key_id)?;
    match entry.delete_credential() {
        Ok(_) | Err(keyring::Error::NoEntry) => {}
        Err(e) => {
            return Err(StorageError::Other(format!(
                "Failed to delete key from secure storage: {e}"
            )))
        }
    }

    let mut metas = load_meta(&app)?;
    let removed = metas.iter().find(|m| m.id == key_id).cloned();
    metas.retain(|m| m.id != key_id);

    if let Some(removed_meta) = removed {
        let same_provider: Vec<usize> = metas
            .iter()
            .enumerate()
            .filter_map(|(idx, meta)| (meta.provider == removed_meta.provider).then_some(idx))
            .collect();

        if !same_provider.is_empty() {
            let has_active = same_provider
                .iter()
                .any(|idx| metas[*idx].is_active.unwrap_or(false));
            let has_default = same_provider
                .iter()
                .any(|idx| metas[*idx].is_default.unwrap_or(false));

            if !has_default {
                metas[same_provider[0]].is_default = Some(true);
            }
            if !has_active {
                metas[same_provider[0]].is_active = Some(true);
            }
        }
    }

    save_meta(&app, &metas)
}

#[tauri::command]
pub async fn set_active_map_api_key(
    app: AppHandle,
    provider: String,
    key_id: String,
) -> Result<(), StorageError> {
    let mut metas = load_meta(&app)?;
    let mut found = false;

    for meta in metas.iter_mut() {
        if meta.provider == provider {
            meta.is_active = Some(meta.id == key_id);
            if meta.id == key_id {
                meta.last_used = Some(Utc::now().to_rfc3339());
                found = true;
            }
        }
    }

    if !found {
        return Err(StorageError::Other(format!(
            "Key {key_id} not found for provider {provider}"
        )));
    }

    save_meta(&app, &metas)
}

