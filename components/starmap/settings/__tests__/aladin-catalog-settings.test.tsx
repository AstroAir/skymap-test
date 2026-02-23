/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/label', () => ({ Label: ({ children }: React.PropsWithChildren) => <label>{children}</label> }));
jest.mock('@/components/ui/slider', () => ({ Slider: () => <input type="range" /> }));
jest.mock('@/components/ui/input', () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }));
jest.mock('@/lib/stores/aladin-store', () => ({
  useAladinStore: jest.fn((selector) => {
    const state = {
      catalogLayers: [{ id: 'cat1', name: 'SIMBAD', enabled: true, maxObjects: 1000, color: '#ff0000', type: 'simbad', radius: 0.5, limit: 1000 }],
      toggleCatalogLayer: jest.fn(),
      updateCatalogLayer: jest.fn(),
    };
    return selector(state);
  }),
}));
jest.mock('../settings-shared', () => ({
  SettingsSection: ({ children, title }: React.PropsWithChildren<{ title: string }>) => <div><h3>{title}</h3>{children}</div>,
  ToggleItem: ({ label, checked }: { label: string; checked: boolean }) => <div>{label}: {String(checked)}</div>,
}));

import { AladinCatalogSettings } from '../aladin-catalog-settings';

describe('AladinCatalogSettings', () => {
  it('renders without crashing', () => {
    render(<AladinCatalogSettings />);
  });

  it('renders section title', () => {
    render(<AladinCatalogSettings />);
    expect(screen.getByText('settings.aladinCatalogLayers')).toBeInTheDocument();
  });

  it('renders catalog layer', () => {
    render(<AladinCatalogSettings />);
    expect(screen.getByText(/SIMBAD/)).toBeInTheDocument();
  });
});
