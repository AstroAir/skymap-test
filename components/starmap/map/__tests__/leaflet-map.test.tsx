/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

// Mock leaflet and react-leaflet before importing component
jest.mock('leaflet', () => ({
  Icon: { Default: { mergeOptions: jest.fn() } },
  control: { zoom: jest.fn(() => ({ addTo: jest.fn() })) },
}));

jest.mock('react-leaflet', () => {
  const useMap = jest.fn(() => ({
    getZoom: jest.fn(() => 9),
    setView: jest.fn(),
    dragging: { enable: jest.fn(), disable: jest.fn() },
    touchZoom: { enable: jest.fn(), disable: jest.fn() },
    scrollWheelZoom: { enable: jest.fn(), disable: jest.fn() },
    doubleClickZoom: { enable: jest.fn(), disable: jest.fn() },
    zoomControl: { remove: jest.fn() },
  }));
  const useMapEvents = jest.fn((handlers: Record<string, (...args: unknown[]) => void>) => {
    void handlers;
  });

  return {
    MapContainer: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <div data-testid="map-container" className={className}>{children}</div>
    ),
    TileLayer: ({
      url,
      eventHandlers,
    }: {
      url: string;
      eventHandlers?: { tileerror?: () => void };
    }) => (
      <div data-testid="tile-layer" data-url={url}>
        <button
          type="button"
          data-testid="tile-error-trigger"
          onClick={() => eventHandlers?.tileerror?.()}
        >
          trigger tileerror
        </button>
      </div>
    ),
    Marker: () => <div data-testid="marker" />,
    useMap,
    useMapEvents,
  };
});

jest.mock('@/lib/constants/map', () => ({
  TILE_LAYER_CONFIGS: {
    openstreetmap: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    },
    esri_topo: {
      url: 'https://esri.example.com/{z}/{x}/{y}.png',
      attribution: '© Esri',
      maxZoom: 18,
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
  const getReactLeafletMock = () => jest.requireMock('react-leaflet') as {
    useMap: jest.Mock;
    useMapEvents: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('applies custom height as string', () => {
    render(<LeafletMap center={defaultCenter} height="50vh" />);
    const app = screen.getByRole('application');
    expect(app.style.height).toBe('50vh');
  });

  it('renders light pollution overlay when showLightPollution is true', () => {
    render(<LeafletMap center={defaultCenter} showLightPollution />);
    const tileLayers = screen.getAllByTestId('tile-layer');
    expect(tileLayers.length).toBe(2);
  });

  it('does not render light pollution overlay by default', () => {
    render(<LeafletMap center={defaultCenter} />);
    const tileLayers = screen.getAllByTestId('tile-layer');
    expect(tileLayers.length).toBe(1);
  });

  it('sets aria-disabled when disabled', () => {
    render(<LeafletMap center={defaultCenter} disabled />);
    const app = screen.getByRole('application');
    expect(app.getAttribute('aria-disabled')).toBe('true');
  });

  it('does not set aria-disabled when not disabled', () => {
    render(<LeafletMap center={defaultCenter} />);
    const app = screen.getByRole('application');
    expect(app.getAttribute('aria-disabled')).toBeNull();
  });

  it('applies pointer-events-none when disabled', () => {
    render(<LeafletMap center={defaultCenter} disabled />);
    const app = screen.getByRole('application');
    expect(app.className).toContain('pointer-events-none');
  });

  it('renders with default props', () => {
    render(<LeafletMap center={defaultCenter} />);
    const container = screen.getByTestId('map-container');
    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('marker')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('calls useMapEvents hook', () => {
    render(<LeafletMap center={defaultCenter} onClick={jest.fn()} />);
    expect(getReactLeafletMock().useMapEvents).toHaveBeenCalled();
  });

  it('calls useMap hook for MapController', () => {
    render(<LeafletMap center={defaultCenter} />);
    expect(getReactLeafletMock().useMap).toHaveBeenCalled();
  });

  it('emits fallback event after tile-error threshold', () => {
    const onTileLayerFallback = jest.fn();
    render(
      <LeafletMap
        center={defaultCenter}
        tileLayer="esri_topo"
        tileErrorThreshold={2}
        onTileLayerFallback={onTileLayerFallback}
      />
    );

    const triggers = screen.getAllByTestId('tile-error-trigger');
    fireEvent.click(triggers[0]);
    fireEvent.click(triggers[0]);

    expect(onTileLayerFallback).toHaveBeenCalledWith({
      failedLayer: 'esri_topo',
      fallbackLayer: 'openstreetmap',
      errorCount: 2,
    });
  });

  it('keeps unavailable layer in fallback on reselection', () => {
    const onTileLayerFallback = jest.fn();
    const { rerender } = render(
      <LeafletMap
        center={defaultCenter}
        tileLayer="esri_topo"
        tileErrorThreshold={1}
        onTileLayerFallback={onTileLayerFallback}
      />
    );

    const triggers = screen.getAllByTestId('tile-error-trigger');
    fireEvent.click(triggers[0]);

    rerender(
      <LeafletMap
        center={defaultCenter}
        tileLayer="openstreetmap"
        tileErrorThreshold={1}
        onTileLayerFallback={onTileLayerFallback}
      />
    );

    rerender(
      <LeafletMap
        center={defaultCenter}
        tileLayer="esri_topo"
        tileErrorThreshold={1}
        onTileLayerFallback={onTileLayerFallback}
      />
    );

    expect(onTileLayerFallback).toHaveBeenLastCalledWith({
      failedLayer: 'esri_topo',
      fallbackLayer: 'openstreetmap',
      errorCount: 0,
    });
  });
});
