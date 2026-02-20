/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CoordinateTab } from '../coordinate-tab';
import { TimeTab } from '../time-tab';
import { SolarSystemTab } from '../solar-system-tab';

const mockComputeCoordinates = jest.fn();
const mockComputeEphemeris = jest.fn();
const mockComputeRiseTransitSet = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/astronomy/engine', () => ({
  computeCoordinates: (...args: unknown[]) => mockComputeCoordinates(...args),
  computeEphemeris: (...args: unknown[]) => mockComputeEphemeris(...args),
  computeRiseTransitSet: (...args: unknown[]) => mockComputeRiseTransitSet(...args),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, ...props }: { value?: string; onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input value={value ?? ''} onChange={onChange} {...props} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void }) => (
    <input type="checkbox" checked={!!checked} onChange={(event) => onCheckedChange?.(event.target.checked)} />
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: React.PropsWithChildren) => <table>{children}</table>,
  TableHeader: ({ children }: React.PropsWithChildren) => <thead>{children}</thead>,
  TableBody: ({ children }: React.PropsWithChildren) => <tbody>{children}</tbody>,
  TableRow: ({ children }: React.PropsWithChildren) => <tr>{children}</tr>,
  TableHead: ({ children }: React.PropsWithChildren) => <th>{children}</th>,
  TableCell: ({ children }: React.PropsWithChildren) => <td>{children}</td>,
}));

jest.mock('@/lib/astronomy/starmap-utils', () => ({
  degreesToHMS: (value: number) => `${value.toFixed(2)}h`,
  degreesToDMS: (value: number) => `${value.toFixed(2)}d`,
}));

describe('New astro calculator tabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockComputeCoordinates.mockResolvedValue({
      equatorial: { ra: 10, dec: 20 },
      horizontal: { altitude: 30, azimuth: 100 },
      galactic: { l: 120, b: -20 },
      ecliptic: { longitude: 140, latitude: 5 },
      sidereal: { gmst: 200, lst: 220, hourAngle: 10 },
      meta: { backend: 'fallback', model: 'test-model' },
    });
    mockComputeEphemeris.mockResolvedValue({
      body: 'Sun',
      points: [{
        date: new Date('2025-01-01T00:00:00Z'),
        ra: 100,
        dec: 20,
        altitude: 10,
        azimuth: 180,
        galacticL: 0,
        galacticB: 0,
        eclipticLon: 0,
        eclipticLat: 0,
        magnitude: -26,
      }],
      meta: { backend: 'fallback', model: 'test-model' },
    });
    mockComputeRiseTransitSet.mockResolvedValue({
      riseTime: new Date('2025-01-01T07:00:00Z'),
      transitTime: new Date('2025-01-01T12:00:00Z'),
      setTime: new Date('2025-01-01T17:00:00Z'),
      transitAltitude: 45,
      currentAltitude: 10,
      currentAzimuth: 100,
      isCircumpolar: false,
      neverRises: false,
      darkImagingStart: null,
      darkImagingEnd: null,
      darkImagingHours: 0,
      meta: { backend: 'fallback', model: 'test-model' },
    });
  });

  it('renders CoordinateTab and queries unified coordinate engine', async () => {
    render(<CoordinateTab latitude={39.9} longitude={116.4} />);

    await waitFor(() => {
      expect(mockComputeCoordinates).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('astroCalc.roundTripError'))).toBeInTheDocument();
    });
  });

  it('renders TimeTab conversion panels', () => {
    render(<TimeTab longitude={116.4} />);
    expect(screen.getByText('astroCalc.timeScales')).toBeInTheDocument();
    expect(screen.getByText('astroCalc.hourAngle')).toBeInTheDocument();
  });

  it('renders SolarSystemTab rows from engine results', async () => {
    render(<SolarSystemTab latitude={39.9} longitude={116.4} />);

    await waitFor(() => {
      expect(mockComputeEphemeris).toHaveBeenCalled();
      expect(mockComputeRiseTransitSet).toHaveBeenCalled();
    });

    expect(screen.getByText('Sun')).toBeInTheDocument();
  });
});
