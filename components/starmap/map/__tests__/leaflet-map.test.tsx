/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock leaflet and react-leaflet before importing component
jest.mock('leaflet', () => ({
  Icon: { Default: { mergeOptions: jest.fn() } },
  control: { zoom: jest.fn(() => ({ addTo: jest.fn() })) },
}));

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="map-container" className={className}>{children}</div>
  ),
  TileLayer: ({ url }: { url: string }) => <div data-testid="tile-layer" data-url={url} />,
  Marker: () => <div data-testid="marker" />,
  useMap: jest.fn(() => ({
    setView: jest.fn(),
    dragging: { enable: jest.fn(), disable: jest.fn() },
    touchZoom: { enable: jest.fn(), disable: jest.fn() },
    scrollWheelZoom: { enable: jest.fn(), disable: jest.fn() },
    doubleClickZoom: { enable: jest.fn(), disable: jest.fn() },
    zoomControl: { remove: jest.fn() },
  })),
  useMapEvents: jest.fn(),
}));

jest.mock('@/lib/constants/map', () => ({
  TILE_LAYER_CONFIGS: {
    openstreetmap: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    },
  },
  LIGHT_POLLUTION_OVERLAY: {
    url: 'https://example.com/light/{z}/{x}/{y}.png',
    attribution: '© Light',
    maxZoom: 15,
  },
}));

import { LeafletMap } from '../leaflet-map';

describe('LeafletMap', () => {
  const defaultCenter = { latitude: 40.0, longitude: -74.0 };

  it('renders the map container', () => {
    render(<LeafletMap center={defaultCenter} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders with role="application"', () => {
    render(<LeafletMap center={defaultCenter} />);
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  it('renders a tile layer', () => {
    render(<LeafletMap center={defaultCenter} />);
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('renders marker by default', () => {
    render(<LeafletMap center={defaultCenter} />);
    expect(screen.getByTestId('marker')).toBeInTheDocument();
  });

  it('hides marker when showMarker is false', () => {
    render(<LeafletMap center={defaultCenter} showMarker={false} />);
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });

  it('applies disabled styling', () => {
    render(<LeafletMap center={defaultCenter} disabled />);
    const app = screen.getByRole('application');
    expect(app.className).toContain('opacity-50');
  });

  it('applies custom className', () => {
    render(<LeafletMap center={defaultCenter} className="my-map" />);
    const app = screen.getByRole('application');
    expect(app.className).toContain('my-map');
  });

  it('applies custom height as number', () => {
    render(<LeafletMap center={defaultCenter} height={300} />);
    const app = screen.getByRole('application');
    expect(app.style.height).toBe('300px');
  });
});
