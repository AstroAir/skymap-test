import { create } from 'zustand';
import type { SettingsProfileData, SettingsProfileDomain } from '@/lib/settings/settings-profile';

export interface SettingsImportRestorePoint {
  createdAt: string;
  domains: SettingsProfileDomain[];
  profile: SettingsProfileData;
}

interface SettingsImportRestoreState {
  restorePoint: SettingsImportRestorePoint | null;
  setRestorePoint: (restorePoint: SettingsImportRestorePoint) => void;
  clearRestorePoint: () => void;
}

export const useSettingsImportRestoreStore = create<SettingsImportRestoreState>((set) => ({
  restorePoint: null,
  setRestorePoint: (restorePoint) => set({ restorePoint }),
  clearRestorePoint: () => set({ restorePoint: null }),
}));
