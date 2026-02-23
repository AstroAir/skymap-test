/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import type { SkyMapCanvasRef } from '@/lib/core/types/sky-engine';

// Mock stores
const mockSetAladin = jest.fn();
const mockSetActiveEngine = jest.fn();
const mockSetHelpers = jest.fn();

jest.mock('@/lib/stores', () => ({
  useStellariumStore: Object.assign(
    jest.fn((selector) => {
      const state = {
        setAladin: mockSetAladin,
        setActiveEngine: mockSetActiveEngine,
        setHelpers: mockSetHelpers,
      };
      return selector(state);
    }),
    {
      getState: () => ({
        setHelpers: mockSetHelpers,
      }),
    }
  ),
}));

// Mock aladin hooks
const mockLoadingState = { isLoading: false, errorMessage: null, progress: 100, startTime: null };
jest.mock('@/lib/hooks/aladin', () => ({
  useAladinLoader: jest.fn(() => ({
    loadingState: mockLoadingState,
    engineReady: true,
    startLoading: jest.fn(),
    handleRetry: jest.fn(),
    reloadEngine: jest.fn(),
  })),
  useAladinEvents: jest.fn(),
  useAladinSettingsSync: jest.fn(),
  useAladinCatalogs: jest.fn(),
  useAladinLayers: jest.fn(),
  useAladinFits: jest.fn(),
  useAladinMOC: jest.fn(),
  useAladinOverlays: jest.fn(),
}));

// Mock aladin compat
jest.mock('@/lib/aladin/aladin-compat', () => ({
  destroyAladinCompat: jest.fn(),
  exportViewCompat: jest.fn(),
  getFoVCompat: jest.fn(() => 60),
  setFoVCompat: jest.fn(),
}));

// Mock constants
jest.mock('@/lib/core/constants/fov', () => ({
  DEFAULT_FOV: 60,
  MIN_FOV: 0.1,
  MAX_FOV: 180,
}));

jest.mock('@/lib/core/constants/aladin-canvas', () => ({
  ALADIN_ZOOM_IN_FACTOR: 0.5,
  ALADIN_ZOOM_OUT_FACTOR: 2,
}));

jest.mock('@/lib/astronomy/coordinates/format-coords', () => ({
  buildClickCoords: jest.fn(() => ({ ra: 10, dec: 20 })),
}));

// Mock LoadingOverlay
jest.mock('../components', () => ({
  LoadingOverlay: ({ loadingState }: { loadingState: { isLoading: boolean } }) => (
    <div data-testid="loading-overlay">{loadingState.isLoading ? 'Loading' : 'Ready'}</div>
  ),
}));

import { AladinCanvas } from '../aladin-canvas';

describe('AladinCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container div', () => {
    render(<AladinCanvas />);
    const container = document.getElementById('aladin-lite-container');
    expect(container).toBeInTheDocument();
  });

  it('renders the loading overlay', () => {
    render(<AladinCanvas />);
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('sets active engine on mount', () => {
    render(<AladinCanvas />);
    expect(mockSetActiveEngine).toHaveBeenCalledWith('aladin');
  });

  it('exposes ref methods via useImperativeHandle', () => {
    const ref = React.createRef<SkyMapCanvasRef>();
    render(<AladinCanvas ref={ref} />);
    expect(ref.current).toBeDefined();
    expect(typeof ref.current!.zoomIn).toBe('function');
    expect(typeof ref.current!.zoomOut).toBe('function');
    expect(typeof ref.current!.setFov).toBe('function');
    expect(typeof ref.current!.getFov).toBe('function');
    expect(typeof ref.current!.getClickCoordinates).toBe('function');
    expect(typeof ref.current!.reloadEngine).toBe('function');
    expect(typeof ref.current!.getEngineStatus).toBe('function');
    expect(typeof ref.current!.exportImage).toBe('function');
    expect(typeof ref.current!.gotoObject).toBe('function');
  });
});
