/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores', () => ({
  useSettingsStore: Object.assign(
    jest.fn((selector) => {
      const state = {
        preferences: { locale: 'en', theme: 'dark', autoSave: true, confirmBeforeClose: true, dailyKnowledgeEnabled: true },
        setPreference: jest.fn(),
        updatePreferences: jest.fn(),
      };
      return selector(state);
    }),
    { getState: jest.fn(() => ({ preferences: { locale: 'en' } })) }
  ),
  useDailyKnowledgeStore: jest.fn((selector) => {
    const state = { openDialog: jest.fn() };
    return selector(state);
  }),
}));
jest.mock('@/lib/i18n/locale-store', () => ({
  useLocaleStore: jest.fn((selector) => {
    const state = { setLocale: jest.fn() };
    return selector(state);
  }),
}));
jest.mock('@/components/ui/label', () => ({ Label: ({ children }: React.PropsWithChildren) => <label>{children}</label> }));
jest.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));
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

import { GeneralSettings } from '../general-settings';

describe('GeneralSettings', () => {
  it('renders without crashing', () => {
    render(<GeneralSettings />);
  });
});
