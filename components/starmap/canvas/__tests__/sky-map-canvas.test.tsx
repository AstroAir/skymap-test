/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock settings store
let mockSkyEngine = 'stellarium';
jest.mock('@/lib/stores', () => ({
  useSettingsStore: (selector: (state: { skyEngine: string }) => unknown) =>
    selector({ skyEngine: mockSkyEngine }),
  useStellariumStore: Object.assign(
    jest.fn((selector: (state: Record<string, unknown>) => unknown) => {
      const state = {
        setStel: jest.fn(),
        setAladin: jest.fn(),
        setActiveEngine: jest.fn(),
      };
      return selector ? selector(state) : state;
    }),
    { getState: () => ({ setHelpers: jest.fn() }) }
  ),
}));

// Mock child components
jest.mock('../stellarium-canvas', () => ({
  StellariumCanvas: React.forwardRef(function MockStellariumCanvas(
    _props: Record<string, unknown>,
    _ref: React.Ref<unknown>
  ) {
    return <div data-testid="stellarium-canvas">StellariumCanvas</div>;
  }),
}));

jest.mock('../aladin-canvas', () => ({
  AladinCanvas: React.forwardRef(function MockAladinCanvas(
    _props: Record<string, unknown>,
    _ref: React.Ref<unknown>
  ) {
    return <div data-testid="aladin-canvas">AladinCanvas</div>;
  }),
}));

import { SkyMapCanvas } from '../sky-map-canvas';

describe('SkyMapCanvas', () => {
  beforeEach(() => {
    mockSkyEngine = 'stellarium';
  });

  it('should render StellariumCanvas when skyEngine is stellarium', () => {
    mockSkyEngine = 'stellarium';
    render(<SkyMapCanvas />);
    expect(screen.getByTestId('stellarium-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('aladin-canvas')).not.toBeInTheDocument();
  });

  it('should render AladinCanvas when skyEngine is aladin', () => {
    mockSkyEngine = 'aladin';
    render(<SkyMapCanvas />);
    expect(screen.getByTestId('aladin-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('stellarium-canvas')).not.toBeInTheDocument();
  });

  it('should default to StellariumCanvas for unknown engine', () => {
    mockSkyEngine = 'unknown';
    render(<SkyMapCanvas />);
    expect(screen.getByTestId('stellarium-canvas')).toBeInTheDocument();
  });
});
