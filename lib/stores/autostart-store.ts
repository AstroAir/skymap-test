import { create } from 'zustand';
import { autostartApi } from '@/lib/tauri/autostart-api';

export interface AutostartStatusState {
  supported: boolean;
  loading: boolean;
  actualEnabled: boolean | null;
  error: string | null;
  setSupported: (supported: boolean) => void;
  setLoading: (loading: boolean) => void;
  setActualEnabled: (actualEnabled: boolean | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  supported: autostartApi.isAvailable(),
  loading: autostartApi.isAvailable(),
  actualEnabled: null,
  error: null,
};

export const useAutostartStore = create<AutostartStatusState>()((set) => ({
  ...initialState,
  setSupported: (supported) => set({ supported }),
  setLoading: (loading) => set({ loading }),
  setActualEnabled: (actualEnabled) => set({ actualEnabled }),
  setError: (error) => set({ error }),
  reset: () => set({
    supported: autostartApi.isAvailable(),
    loading: autostartApi.isAvailable(),
    actualEnabled: null,
    error: null,
  }),
}));
