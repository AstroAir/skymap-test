/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores', () => ({
  useSettingsStore: Object.assign(
    jest.fn((selector) => {
      const state = { preferences: { theme: 'dark', locale: 'en' }, updatePreferences: jest.fn() };
      return selector(state);
    }),
    { getState: jest.fn(() => ({ preferences: {} })) }
  ),
}));
jest.mock('@/components/ui/label', () => ({ Label: ({ children }: React.PropsWithChildren) => <label>{children}</label> }));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: () => <div />,
}));

import { PreferencesStep } from '../preferences-step';

describe('PreferencesStep', () => {
  it('renders without crashing', () => {
    render(<PreferencesStep />);
  });
});
