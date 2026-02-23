/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from '../star-rating';

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

describe('StarRating', () => {
  it('renders correct number of stars (default max=5)', () => {
    const { container } = render(<StarRating value={3} />);
    const stars = container.querySelectorAll('svg');
    expect(stars).toHaveLength(5);
  });

  it('renders custom max stars', () => {
    const { container } = render(<StarRating value={2} max={10} />);
    const stars = container.querySelectorAll('svg');
    expect(stars).toHaveLength(10);
  });

  it('renders as interactive buttons when onChange is provided', () => {
    const onChange = jest.fn();
    render(<StarRating value={2} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('calls onChange with correct value when a star is clicked', () => {
    const onChange = jest.fn();
    render(<StarRating value={2} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[3]);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('renders as read-only when no onChange provided', () => {
    render(<StarRating value={3} />);
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('applies custom className', () => {
    const { container } = render(<StarRating value={1} className="custom-rating" />);
    expect(container.firstChild).toHaveClass('custom-rating');
  });
});
