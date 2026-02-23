/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/stores', () => ({
  useSettingsStore: Object.assign(
    jest.fn((selector) => {
      const state = {
        preferences: {
          enabledOnlineSources: { sesame: true, simbad: true },
          onlineSearchTimeout: 5000,
        },
        updatePreferences: jest.fn(),
      };
      return selector(state);
    }),
    { getState: jest.fn() }
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked }: { checked: boolean }) => <input type="checkbox" checked={checked} readOnly />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
}));
jest.mock('@/components/ui/slider', () => ({
  Slider: () => <input type="range" data-testid="slider" />,
}));

import { OnlineSearchSettings } from '../online-search-settings';

describe('OnlineSearchSettings', () => {
  it('renders without crashing', () => {
    render(<OnlineSearchSettings />);
  });
});
