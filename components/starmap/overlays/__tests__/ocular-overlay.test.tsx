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
});
