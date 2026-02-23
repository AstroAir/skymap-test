/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { MoonPhaseSVG } from '../moon-phase-svg';

describe('MoonPhaseSVG', () => {
  it('renders an SVG element', () => {
    const { container } = render(<MoonPhaseSVG phase={0} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with default size of 40', () => {
    const { container } = render(<MoonPhaseSVG phase={0.5} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '40');
  });

  it('renders with custom size', () => {
    const { container } = render(<MoonPhaseSVG phase={0.25} size={80} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '80');
  });

  it('renders full moon (phase=0.5) with full circle', () => {
    const { container } = render(<MoonPhaseSVG phase={0.5} />);
    // Full moon has illumination ≈ 1, should render 2 circles (dark base + lit full)
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders new moon (phase=0) without lit path', () => {
    const { container } = render(<MoonPhaseSVG phase={0} />);
    // New moon has illumination ≈ 0, no lit path
    const path = container.querySelector('path');
    expect(path).toBeNull();
  });

  it('renders quarter moon (phase=0.25) with lit path', () => {
    const { container } = render(<MoonPhaseSVG phase={0.25} />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<MoonPhaseSVG phase={0} className="my-moon" />);
    const svg = container.querySelector('svg');
    expect(svg?.className.baseVal).toContain('my-moon');
  });
});
