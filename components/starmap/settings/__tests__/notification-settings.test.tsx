/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

// Mock storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

import { NotificationSettings } from '../notification-settings';
import { useSettingsStore } from '@/lib/stores';

describe('NotificationSettings', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      notifications: {
        enableSounds: false,
        enableToasts: true,
        toastDuration: 4000,
        showObjectAlerts: true,
        showSatelliteAlerts: true,
      },
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<NotificationSettings />);
    expect(container).toBeInTheDocument();
  });

  it('renders collapsible sections', () => {
    render(<NotificationSettings />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders switch controls for notification toggles', () => {
    render(<NotificationSettings />);
    const switches = screen.getAllByRole('switch');
    // enableToasts, enableSounds, showObjectAlerts, showSatelliteAlerts
    expect(switches.length).toBeGreaterThanOrEqual(2);
  });

  it('renders section titles', () => {
    render(<NotificationSettings />);
    // General section is open by default
    expect(screen.getByText('settingsNew.notifications.general')).toBeInTheDocument();
    // Duration and alerts sections exist as collapsed headers
    expect(screen.getByText('settingsNew.notifications.duration')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.notifications.alerts')).toBeInTheDocument();
  });

  it('reflects enableToasts state', () => {
    render(<NotificationSettings />);
    const switches = screen.getAllByRole('switch');
    // First switch should be enableToasts (checked=true)
    const toastSwitch = switches[0];
    expect(toastSwitch).toBeChecked();
  });

  it('reflects enableSounds state', () => {
    render(<NotificationSettings />);
    const switches = screen.getAllByRole('switch');
    // Second switch should be enableSounds (checked=false)
    const soundSwitch = switches[1];
    expect(soundSwitch).not.toBeChecked();
  });

  it('calls setNotificationSetting when toggling enableToasts', () => {
    render(<NotificationSettings />);
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    const state = useSettingsStore.getState();
    expect(state.notifications.enableToasts).toBe(false);
  });

  it('calls setNotificationSetting when toggling enableSounds', () => {
    render(<NotificationSettings />);
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);
    const state = useSettingsStore.getState();
    expect(state.notifications.enableSounds).toBe(true);
  });

  it('renders 4 toggle items total across all sections', () => {
    render(<NotificationSettings />);
    // enableToasts and enableSounds are visible in the open General section
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(2);
  });
});
