/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AstroSessionPanel } from '../astro-session-panel';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUseMountStore = jest.fn((selector: (state: unknown) => unknown) => {
  const state = {
    profileInfo: {
      AstrometrySettings: {
        Latitude: 40,
        Longitude: -74,
      },
    },
  };
  return selector(state);
});

jest.mock('@/lib/stores', () => ({
  useMountStore: (selector: (state: unknown) => unknown) => mockUseMountStore(selector),
}));

jest.mock('@/lib/tauri/hooks', () => ({
  useAstronomy: jest.fn(() => ({
    moonPhase: null,
    moonPosition: null,
    sunPosition: null,
  })),
}));

describe('AstroSessionPanel', () => {
  it('renders current conditions and selected target details', () => {
    render(
      <AstroSessionPanel
        selectedRa={10.684}
        selectedDec={41.269}
        selectedName="M31"
      />,
    );

    expect(screen.getByText('session.sessionInfo')).toBeInTheDocument();
    expect(screen.getByText('M31')).toBeInTheDocument();
    expect(screen.getByText('40.00°, -74.00°')).toBeInTheDocument();
  });

  it('renders safely without target name', () => {
    render(
      <AstroSessionPanel
        selectedRa={120}
        selectedDec={22}
      />,
    );
    expect(screen.getByText('session.sessionInfo')).toBeInTheDocument();
  });
});
