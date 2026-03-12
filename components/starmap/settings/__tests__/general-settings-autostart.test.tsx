/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockSetPreference = jest.fn();
const settingsDraftModel = {
  preferences: {
    locale: 'en' as const,
    timeFormat: '24h' as const,
    dateFormat: 'iso' as const,
    coordinateFormat: 'dms' as const,
    distanceUnit: 'metric' as const,
    temperatureUnit: 'celsius' as const,
    startupView: 'last' as const,
    launchOnStartup: false,
    showSplash: true,
    autoConnectBackend: true,
    dailyKnowledgeEnabled: true,
    dailyKnowledgeAutoShow: true,
    dailyKnowledgeOnlineEnhancement: true,
    skipCloseConfirmation: false,
    rightPanelCollapsed: false,
  },
  setPreference: mockSetPreference,
};

const autostartState = {
  supported: true,
  loading: false,
  actualEnabled: false,
  error: null,
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    if (key === 'settingsNew.general.launchOnStartupError' && values?.message) {
      return `${key}:${values.message}`;
    }
    return key;
  },
}));

jest.mock('@/lib/stores', () => ({
  useDailyKnowledgeStore: (selector: (state: { openDialog: jest.Mock }) => unknown) =>
    selector({ openDialog: jest.fn() }),
  useAutostartStore: (selector: (state: typeof autostartState) => unknown) => selector(autostartState),
}));

jest.mock('@/lib/hooks/use-settings-draft', () => ({
  usePreferencesDraftModel: () => settingsDraftModel,
}));

jest.mock('@/components/starmap/settings/settings-shared', () => ({
  SettingsSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ToggleItem: ({ id, label, description }: { id: string; label: string; description?: string }) => (
    <div data-testid={id}>
      <span>{label}</span>
      {description ? <span>{description}</span> : null}
    </div>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>value</span>,
}));

import { GeneralSettings } from '../general-settings';

describe('GeneralSettings autostart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    autostartState.supported = true;
    autostartState.loading = false;
    autostartState.actualEnabled = false;
    autostartState.error = null;
  });

  it('renders the autostart toggle in supported desktop runtime', () => {
    render(<GeneralSettings />);

    expect(screen.getByTestId('launch-on-startup')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.general.launchOnStartup')).toBeInTheDocument();
  });

  it('omits the autostart toggle outside supported runtime', () => {
    autostartState.supported = false;

    render(<GeneralSettings />);

    expect(screen.queryByTestId('launch-on-startup')).not.toBeInTheDocument();
  });
});
