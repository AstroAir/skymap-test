/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MobileSettings } from '../mobile-settings';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('../settings-shared', () => ({
  SettingsSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ToggleItem: ({
    id,
    label,
    checked,
    onCheckedChange,
  }: {
    id: string;
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <button data-testid={id} onClick={() => onCheckedChange(!checked)}>
      {label}
    </button>
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
    'aria-label': ariaLabel,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    'aria-label'?: string;
  }) => (
    <button aria-label={ariaLabel} onClick={() => onCheckedChange(!checked)}>
      {checked ? 'on' : 'off'}
    </button>
  ),
}));

const setMobileFeaturePreferences = jest.fn();

const mockState = {
  mobileFeaturePreferences: {
    compactBottomBar: true,
    oneHandMode: false,
    prioritizedTools: ['markers', 'location', 'fov', 'shotlist', 'tonight', 'daily-knowledge'],
  },
};

jest.mock('@/lib/stores', () => ({
  useSettingsStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      ...mockState,
      setMobileFeaturePreferences,
    }),
}));

describe('MobileSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.mobileFeaturePreferences = {
      compactBottomBar: true,
      oneHandMode: false,
      prioritizedTools: ['markers', 'location', 'fov', 'shotlist', 'tonight', 'daily-knowledge'],
    };
  });

  it('moves selected tools up in prioritized order', () => {
    render(<MobileSettings />);
    const locationRow = screen.getByTestId('mobile-tool-row-location');
    const moveUpButton = within(locationRow).getByRole('button', { name: 'settingsNew.mobile.moveUp' });
    fireEvent.click(moveUpButton);

    expect(setMobileFeaturePreferences).toHaveBeenCalledWith({
      prioritizedTools: ['location', 'markers', 'fov', 'shotlist', 'tonight', 'daily-knowledge'],
    });
  });

  it('toggles tool visibility by removing it from compact priority', () => {
    render(<MobileSettings />);
    const locationSwitch = screen.getByRole('button', { name: 'settingsNew.mobile.tools.location' });
    fireEvent.click(locationSwitch);

    expect(setMobileFeaturePreferences).toHaveBeenCalledWith({
      prioritizedTools: ['markers', 'fov', 'shotlist', 'tonight', 'daily-knowledge'],
    });
  });

  it('keeps at least one compact tool visible', () => {
    mockState.mobileFeaturePreferences.prioritizedTools = ['markers'];
    render(<MobileSettings />);
    const markersSwitch = screen.getByRole('button', { name: 'settingsNew.mobile.tools.markers' });
    fireEvent.click(markersSwitch);

    expect(setMobileFeaturePreferences).not.toHaveBeenCalled();
  });
});
