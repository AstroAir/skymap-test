/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseUpdater = jest.fn();
const mockUseAppSettings = jest.fn();

jest.mock('@/lib/tauri/updater-hooks', () => ({
  useUpdater: () => mockUseUpdater(),
}));

jest.mock('@/lib/tauri', () => ({
  useAppSettings: () => mockUseAppSettings(),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { UpdateSettings } from '../update-settings';

const renderComponent = () => render(<UpdateSettings />);

describe('UpdateSettings', () => {
  const defaultMockReturn = {
    currentVersion: '1.0.0',
    lastChecked: null,
    isChecking: false,
    hasUpdate: false,
    updateInfo: null,
    checkForUpdate: jest.fn(),
  };

  const defaultAppSettingsReturn = {
    settings: { check_updates: true },
    updateSettings: jest.fn(),
    isAvailable: true,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdater.mockReturnValue(defaultMockReturn);
    mockUseAppSettings.mockReturnValue(defaultAppSettingsReturn);
  });

  it('should render settings', () => {
    renderComponent();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should call checkForUpdate when button is clicked', () => {
    const checkForUpdate = jest.fn();
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      checkForUpdate,
    });

    renderComponent();

    const buttons = screen.getAllByRole('button');
    if (buttons[0]) fireEvent.click(buttons[0]);

    expect(checkForUpdate).toHaveBeenCalled();
  });

  it('should disable button when checking', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      isChecking: true,
    });

    renderComponent();

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('should render auto update switch', () => {
    renderComponent();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should toggle auto update switch', () => {
    const updateSettings = jest.fn();
    mockUseAppSettings.mockReturnValue({
      ...defaultAppSettingsReturn,
      updateSettings,
      settings: { check_updates: true },
    });

    renderComponent();

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();

    fireEvent.click(switchElement);

    expect(updateSettings).toHaveBeenCalledWith({ check_updates: false });
  });

  it('should disable auto update switch when app settings are unavailable', () => {
    mockUseAppSettings.mockReturnValue({
      ...defaultAppSettingsReturn,
      isAvailable: false,
    });

    renderComponent();
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('should show neverChecked text when lastChecked is null', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      lastChecked: null,
    });

    renderComponent();
    expect(screen.getByText('neverChecked')).toBeInTheDocument();
  });

  it('should show lastChecked text when lastChecked has a value', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      lastChecked: 1700000000000,
    });

    renderComponent();
    expect(screen.getByText('lastChecked')).toBeInTheDocument();
  });

  it('should show update button when update is available', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      hasUpdate: true,
      updateInfo: {
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      },
    });

    renderComponent();

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
