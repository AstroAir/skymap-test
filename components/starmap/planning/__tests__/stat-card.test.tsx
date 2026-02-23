/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../stat-card';

describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard value="42" label="Items" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<StatCard value={100} label="Score" />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatCard value="5" label="Count" className="my-card" />);
    expect(container.firstChild).toHaveClass('my-card');
  });

  it('applies valueClassName to value element', () => {
    render(<StatCard value="99" label="Percent" valueClassName="text-red-500" />);
    const valueEl = screen.getByText('99');
    expect(valueEl.className).toContain('text-red-500');
  });
});
