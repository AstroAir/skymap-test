/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { OcularOverlay } from '../ocular-overlay';

describe('OcularOverlay', () => {
  it('does not render when disabled', () => {
    render(<OcularOverlay enabled={false} tfov={1} currentFov={2} opacity={70} />);
    expect(screen.queryByTestId('ocular-overlay')).not.toBeInTheDocument();
  });

  it('renders with correct diameter ratio', () => {
    render(<OcularOverlay enabled={true} tfov={1} currentFov={2} opacity={70} />);
    const circle = screen.getByTestId('ocular-overlay-circle');
    expect(circle).toHaveStyle({ width: '50%', height: '50%' });
  });

  it('shows warning when ocular tfov exceeds current fov', () => {
    render(<OcularOverlay enabled={true} tfov={3} currentFov={2} opacity={70} />);
    expect(screen.getByTestId('ocular-overlay-warning')).toBeInTheDocument();
  });

  it('does not show warning when tfov < currentFov', () => {
    render(<OcularOverlay enabled={true} tfov={1} currentFov={2} opacity={70} />);
    expect(screen.queryByTestId('ocular-overlay-warning')).not.toBeInTheDocument();
  });

  it('renders crosshair lines by default', () => {
    const { container } = render(<OcularOverlay enabled={true} tfov={1} currentFov={2} opacity={70} />);
    const crosshairLines = container.querySelectorAll('.bg-white\\/40');
    expect(crosshairLines.length).toBe(2); // horizontal + vertical
  });

  it('does not render crosshair when showCrosshair=false', () => {
    const { container } = render(
      <OcularOverlay enabled={true} tfov={1} currentFov={2} opacity={70} showCrosshair={false} />
    );
    const crosshairLines = container.querySelectorAll('.bg-white\\/40');
    expect(crosshairLines.length).toBe(0);
  });

  it('does not render when tfov is 0', () => {
    render(<OcularOverlay enabled={true} tfov={0} currentFov={2} opacity={70} />);
    expect(screen.queryByTestId('ocular-overlay')).not.toBeInTheDocument();
  });

  it('does not render when currentFov is 0', () => {
    render(<OcularOverlay enabled={true} tfov={1} currentFov={0} opacity={70} />);
    expect(screen.queryByTestId('ocular-overlay')).not.toBeInTheDocument();
  });

  it('does not render when currentFov is NaN', () => {
    render(<OcularOverlay enabled={true} tfov={1} currentFov={NaN} opacity={70} />);
    expect(screen.queryByTestId('ocular-overlay')).not.toBeInTheDocument();
  });

  it('does not render when tfov is negative', () => {
    render(<OcularOverlay enabled={true} tfov={-1} currentFov={2} opacity={70} />);
    expect(screen.queryByTestId('ocular-overlay')).not.toBeInTheDocument();
  });

  it('clamps diameter to minimum 8%', () => {
    // ratio = 0.001/2 = 0.0005, percent = 0.05% → clamped to 8%
    render(<OcularOverlay enabled={true} tfov={0.001} currentFov={2} opacity={70} />);
    const circle = screen.getByTestId('ocular-overlay-circle');
    expect(circle).toHaveStyle({ width: '8%', height: '8%' });
  });

  it('clamps diameter to maximum 100%', () => {
    // ratio = 5/2 = 2.5, percent = 250% → clamped to 100%
    render(<OcularOverlay enabled={true} tfov={5} currentFov={2} opacity={70} />);
    const circle = screen.getByTestId('ocular-overlay-circle');
    expect(circle).toHaveStyle({ width: '100%', height: '100%' });
  });

  it('clamps opacity to valid range', () => {
    render(<OcularOverlay enabled={true} tfov={1} currentFov={2} opacity={150} />);
    const circle = screen.getByTestId('ocular-overlay-circle');
    // opacity clamped to 100 → 1.0
    expect(circle.style.boxShadow).toContain('rgba(0, 0, 0, 1)');
  });
});
