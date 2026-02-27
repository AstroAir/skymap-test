/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// --- Mocks ---

const mockSetProfileInfo = jest.fn();
const mockUpdateSetupData = jest.fn();
const mockSaveLocation = jest.fn();
let mockLoadStoredLocation: jest.Mock = jest.fn(() => null);
const mockIsValidLocation = jest.fn(
  (loc: { latitude: number; longitude: number } | null) =>
    loc !== null &&
    Number.isFinite(loc.latitude) &&
    Number.isFinite(loc.longitude) &&
    loc.latitude >= -90 &&
    loc.latitude <= 90 &&
    loc.longitude >= -180 &&
    loc.longitude <= 180,
);

jest.mock('@/lib/stores/mount-store', () => ({
  useMountStore: Object.assign(
    jest.fn((selector: (s: Record<string, unknown>) => unknown) => {
      const state = { setProfileInfo: mockSetProfileInfo };
      return selector(state);
    }),
    {
      getState: jest.fn(() => ({
        profileInfo: {
          AstrometrySettings: { Latitude: 0, Longitude: 0, Elevation: 0 },
        },
      })),
    },
  ),
}));

jest.mock('@/lib/stores/onboarding-store', () => ({
  useOnboardingStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = { updateSetupData: mockUpdateSetupData };
    return selector(state);
  }),
}));

jest.mock('@/lib/utils/observer-location', () => ({
  loadStoredLocation: () => mockLoadStoredLocation(),
  saveLocation: (...args: unknown[]) => mockSaveLocation(...args),
  isValidLocation: (loc: { latitude: number; longitude: number } | null) => mockIsValidLocation(loc),
}));

import { LocationStep } from '../location-step';

// Helper to set up a mock geolocation API
function mockGeolocation(
  response?: { latitude: number; longitude: number; altitude: number | null },
  error?: { code: number; message: string },
) {
  const getCurrentPosition = jest.fn(
    (
      success: PositionCallback,
      errorCb?: PositionErrorCallback | null,
    ) => {
      if (error && errorCb) {
        errorCb({
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      } else if (response) {
        success({
          coords: {
            latitude: response.latitude,
            longitude: response.longitude,
            altitude: response.altitude,
            accuracy: 10,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      }
    },
  );

  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    writable: true,
    configurable: true,
  });

  return getCurrentPosition;
}

describe('LocationStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadStoredLocation = jest.fn(() => null);
  });

  it('renders description and two tabs (GPS / Manual)', () => {
    render(<LocationStep />);
    expect(screen.getByText('setupWizard.steps.location.description')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.location.useGPS')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.location.enterManually')).toBeInTheDocument();
  });

  it('renders GPS detect button', () => {
    render(<LocationStep />);
    expect(screen.getByText('setupWizard.steps.location.detectLocation')).toBeInTheDocument();
  });

  it('calls updateSetupData on mount', () => {
    render(<LocationStep />);
    expect(mockUpdateSetupData).toHaveBeenCalledWith({ locationConfigured: false });
  });

  it('loads stored location on mount and updates mount store', () => {
    const stored = { latitude: 40.7128, longitude: -74.006, altitude: 10 };
    mockLoadStoredLocation = jest.fn(() => stored);

    render(<LocationStep />);

    expect(mockSetProfileInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        AstrometrySettings: expect.objectContaining({
          Latitude: 40.7128,
          Longitude: -74.006,
          Elevation: 10,
        }),
      }),
    );
  });

  it('handles GPS success and displays location summary', async () => {
    mockGeolocation({ latitude: 51.5074, longitude: -0.1278, altitude: 15 });

    render(<LocationStep />);

    const detectBtn = screen.getByText('setupWizard.steps.location.detectLocation');
    fireEvent.click(detectBtn);

    await waitFor(() => {
      expect(mockSaveLocation).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 51.5074, longitude: -0.1278, altitude: 15 }),
      );
    });
  });

  it('handles GPS permission denied error', async () => {
    mockGeolocation(undefined, { code: 1, message: 'denied' });

    render(<LocationStep />);

    const detectBtn = screen.getByText('setupWizard.steps.location.detectLocation');
    fireEvent.click(detectBtn);

    await waitFor(() => {
      expect(screen.getByText('setupWizard.steps.location.permissionDenied')).toBeInTheDocument();
    });
  });

  it('handles GPS position unavailable error', async () => {
    mockGeolocation(undefined, { code: 2, message: 'unavailable' });

    render(<LocationStep />);
    fireEvent.click(screen.getByText('setupWizard.steps.location.detectLocation'));

    await waitFor(() => {
      expect(screen.getByText('setupWizard.steps.location.positionUnavailable')).toBeInTheDocument();
    });
  });

  it('handles GPS timeout error', async () => {
    mockGeolocation(undefined, { code: 3, message: 'timeout' });

    render(<LocationStep />);
    fireEvent.click(screen.getByText('setupWizard.steps.location.detectLocation'));

    await waitFor(() => {
      expect(screen.getByText('setupWizard.steps.location.timeout')).toBeInTheDocument();
    });
  });

  it('renders skip note', () => {
    render(<LocationStep />);
    expect(screen.getByText('setupWizard.steps.location.skipNote')).toBeInTheDocument();
  });
});
