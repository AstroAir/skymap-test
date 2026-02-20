'use client';

import { Toaster } from 'sonner';
import { useSettingsStore } from '@/lib/stores/settings-store';

export function SettingsToaster() {
  const enableToasts = useSettingsStore((state) => state.notifications.enableToasts);
  const toastDuration = useSettingsStore((state) => state.notifications.toastDuration);

  if (!enableToasts) {
    return null;
  }

  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      duration={toastDuration}
    />
  );
}

