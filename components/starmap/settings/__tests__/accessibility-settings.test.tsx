/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));
jest.mock('@/lib/stores', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = {
      accessibility: { highContrast: false, reducedMotion: false, largeText: false, focusIndicators: true },
      setAccessibilitySetting: jest.fn(),
    };
    return selector(state);
  }),
}));
jest.mock('../settings-shared', () => ({
  SettingsSection: ({ children, title }: React.PropsWithChildren<{ title: string }>) => <div><h3>{title}</h3>{children}</div>,
  ToggleItem: ({ label, checked }: { label: string; checked: boolean }) => <div>{label}: {String(checked)}</div>,
}));

import { AccessibilitySettings } from '../accessibility-settings';

describe('AccessibilitySettings', () => {
  it('renders without crashing', () => {
    render(<AccessibilitySettings />);
  });

  it('renders visual section', () => {
    render(<AccessibilitySettings />);
    expect(screen.getByText('settingsNew.accessibility.visual')).toBeInTheDocument();
  });
});
