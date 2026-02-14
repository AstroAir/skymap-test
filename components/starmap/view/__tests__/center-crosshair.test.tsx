/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { CenterCrosshair } from '../center-crosshair';
import { useSettingsStore } from '@/lib/stores/settings-store';

// Mock zustand storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

describe('CenterCrosshair', () => {
  beforeEach(() => {
    // Reset to defaults
    useSettingsStore.getState().resetToDefaults();
  });

  it('renders when crosshairVisible is true (default)', () => {
    const { container } = render(<CenterCrosshair />);
    // Should have the crosshair container
    const crosshairEl = container.querySelector('.crosshair-pulse');
    expect(crosshairEl).toBeInTheDocument();
  });

  it('does not render when crosshairVisible is false', () => {
    useSettingsStore.setState({
      stellarium: {
        ...useSettingsStore.getState().stellarium,
        crosshairVisible: false,
      },
    });

    const { container } = render(<CenterCrosshair />);
    const crosshairEl = container.querySelector('.crosshair-pulse');
    expect(crosshairEl).not.toBeInTheDocument();
  });

  it('applies custom crosshairColor via inline style', () => {
    const customColor = 'rgba(255, 0, 0, 0.5)';
    useSettingsStore.setState({
      stellarium: {
        ...useSettingsStore.getState().stellarium,
        crosshairColor: customColor,
      },
    });

    const { container } = render(<CenterCrosshair />);
    const lines = container.querySelectorAll('[style]');
    // Should have 3 styled elements (horizontal line, vertical line, center circle)
    expect(lines.length).toBe(3);

    // Check that the color is applied
    const firstLine = lines[0] as HTMLElement;
    expect(firstLine.style.backgroundColor).toBe(customColor);
  });

  it('uses default color from settings', () => {
    const { container } = render(<CenterCrosshair />);
    const lines = container.querySelectorAll('[style]');
    expect(lines.length).toBe(3);

    const defaultColor = useSettingsStore.getState().stellarium.crosshairColor;
    const firstLine = lines[0] as HTMLElement;
    expect(firstLine.style.backgroundColor).toBe(defaultColor);
  });
});
