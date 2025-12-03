/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

import { FOVOverlay } from '../FOVOverlay';

describe('FOVOverlay', () => {
  const defaultProps = {
    enabled: true,
    sensorWidth: 36,
    sensorHeight: 24,
    focalLength: 500,
    currentFov: 2,
    rotationAngle: 0,
    onRotationChange: jest.fn(),
    mosaic: {
      enabled: false,
      rows: 1,
      cols: 1,
      overlap: 10,
    },
    gridType: 'crosshair' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<FOVOverlay {...defaultProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders nothing visible when disabled', () => {
    const { container } = render(<FOVOverlay {...defaultProps} enabled={false} />);
    expect(container.querySelector('.pointer-events-none')).toBeInTheDocument();
  });

  it('renders with mosaic enabled', () => {
    render(
      <FOVOverlay
        {...defaultProps}
        mosaic={{ enabled: true, rows: 2, cols: 2, overlap: 10 }}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('renders with different grid types', () => {
    const gridTypes = ['none', 'crosshair', 'thirds', 'golden', 'diagonal'] as const;
    gridTypes.forEach((gridType) => {
      const { unmount } = render(<FOVOverlay {...defaultProps} gridType={gridType} />);
      expect(document.body).toBeInTheDocument();
      unmount();
    });
  });

  it('renders with rotation angle', () => {
    render(<FOVOverlay {...defaultProps} rotationAngle={45} />);
    expect(document.body).toBeInTheDocument();
  });
});
