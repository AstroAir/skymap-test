/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores', () => ({
  useSettingsStore: Object.assign(
    jest.fn((selector) => {
      const state = { preferences: { latitude: 40, longitude: -74, elevation: 0 }, updatePreferences: jest.fn() };
      return selector(state);
    }),
    { getState: jest.fn(() => ({ preferences: {} })) }
  ),
}));
jest.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: React.PropsWithChildren) => <button {...props}>{children}</button> }));
jest.mock('@/components/ui/input', () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }));
jest.mock('@/components/ui/label', () => ({ Label: ({ children }: React.PropsWithChildren) => <label>{children}</label> }));
jest.mock('@/components/starmap/map/leaflet-map', () => ({ LeafletMap: () => <div data-testid="leaflet-map" /> }));
jest.mock('@/lib/hooks', () => ({ useGeolocation: jest.fn(() => ({ latitude: null, longitude: null, loading: false, error: null, requestLocation: jest.fn() })) }));

import { LocationStep } from '../location-step';

describe('LocationStep', () => {
  it('renders without crashing', () => {
    render(<LocationStep />);
  });
});
