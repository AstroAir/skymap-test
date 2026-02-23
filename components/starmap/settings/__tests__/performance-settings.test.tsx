/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = {
      performance: { renderQuality: 'medium', maxFps: 60, enableAnimations: true, starLimit: 50000, maxStarsRendered: 50000, antiAliasing: true },
      setPerformanceSetting: jest.fn(),
    };
    return selector(state);
  }),
}));
jest.mock('@/components/ui/label', () => ({ Label: ({ children }: React.PropsWithChildren) => <label>{children}</label> }));
jest.mock('@/components/ui/slider', () => ({ Slider: () => <input type="range" /> }));
jest.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span> }));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: () => <div />,
}));
jest.mock('../settings-shared', () => ({
  SettingsSection: ({ children, title }: React.PropsWithChildren<{ title: string }>) => <div><h3>{title}</h3>{children}</div>,
  ToggleItem: ({ label }: { label: string }) => <div>{label}</div>,
}));

import { PerformanceSettings } from '../performance-settings';

describe('PerformanceSettings', () => {
  it('renders without crashing', () => {
    render(<PerformanceSettings />);
  });
});
