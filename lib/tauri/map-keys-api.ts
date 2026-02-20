import { isTauri } from '@/lib/storage/platform';

export type MapKeyProvider = 'openstreetmap' | 'google' | 'mapbox';

export interface MapApiKeyQuota {
  daily?: number;
  monthly?: number;
  used?: number;
  resetDate?: string;
}

export interface MapApiKeyRestrictions {
  domains?: string[];
  ips?: string[];
  regions?: string[];
}

export interface MapApiKeyMeta {
  id: string;
  provider: MapKeyProvider;
  label?: string;
  isDefault?: boolean;
  isActive?: boolean;
  quota?: MapApiKeyQuota;
  restrictions?: MapApiKeyRestrictions;
  createdAt: string;
  lastUsed?: string;
}

export interface MapApiKeySecureRecord extends MapApiKeyMeta {
  apiKey: string;
}

async function getInvoke() {
  if (!isTauri()) {
    throw new Error('Tauri API is only available in desktop environment');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

export const mapKeysApi = {
  async save(key: MapApiKeySecureRecord): Promise<void> {
    const invoke = await getInvoke();
    await invoke('save_map_api_key', { key });
  },

  async listMeta(): Promise<MapApiKeyMeta[]> {
    const invoke = await getInvoke();
    return invoke('list_map_api_keys_meta');
  },

  async get(keyId: string): Promise<string | null> {
    const invoke = await getInvoke();
    return invoke('get_map_api_key', { keyId });
  },

  async remove(keyId: string): Promise<void> {
    const invoke = await getInvoke();
    await invoke('delete_map_api_key', { keyId });
  },

  async setActive(provider: MapKeyProvider, keyId: string): Promise<void> {
    const invoke = await getInvoke();
    await invoke('set_active_map_api_key', { provider, keyId });
  },

  isAvailable(): boolean {
    return isTauri();
  },
};

