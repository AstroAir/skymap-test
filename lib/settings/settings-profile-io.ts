import { isTauri } from '@/lib/storage/platform';
import type { SettingsProfileData } from './settings-profile';

export function getSettingsProfileFilename(date = new Date()): string {
  return `skymap-settings-${date.toISOString().slice(0, 10)}.json`;
}

export async function saveSettingsProfileFile(profile: SettingsProfileData): Promise<string | null> {
  const content = JSON.stringify(profile, null, 2);
  const filename = getSettingsProfileFilename(new Date(profile.exportedAt));

  if (typeof window !== 'undefined' && isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const filePath = await save({
      defaultPath: filename,
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });
    if (!filePath) {
      return null;
    }
    await writeTextFile(filePath, content);
    return filePath;
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}

export async function openSettingsProfileFile(): Promise<string | null> {
  if (!(typeof window !== 'undefined' && isTauri())) {
    return null;
  }

  const { open } = await import('@tauri-apps/plugin-dialog');
  const { readTextFile } = await import('@tauri-apps/plugin-fs');
  const selected = await open({
    multiple: false,
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });
  if (typeof selected !== 'string') {
    return null;
  }
  return readTextFile(selected);
}

export async function readSettingsProfileBrowserFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
