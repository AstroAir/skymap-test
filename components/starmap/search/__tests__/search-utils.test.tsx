/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { getTypeIcon, getCategoryIcon, HighlightText } from '../search-utils';

describe('getTypeIcon', () => {
  it('returns icon for Planet type', () => {
    const icon = getTypeIcon('Planet');
    const { container } = render(<>{icon}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns icon for Star type', () => {
    const icon = getTypeIcon('Star');
    const { container } = render(<>{icon}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns default icon for unknown type', () => {
    const icon = getTypeIcon('Unknown');
    const { container } = render(<>{icon}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns default icon when no type provided', () => {
    const icon = getTypeIcon();
    const { container } = render(<>{icon}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('getCategoryIcon', () => {
  it('returns icon for galaxies', () => {
    const icon = getCategoryIcon('galaxies');
    const { container } = render(<>{icon}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns default icon for unknown category', () => {
    const icon = getCategoryIcon('unknown');
    const { container } = render(<>{icon}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('HighlightText', () => {
  it('renders text without highlighting when query is short', () => {
    render(<HighlightText text="Hello World" query="H" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
  });

  it('highlights matching text', () => {
    const { container } = render(<HighlightText text="Hello World" query="World" />);
    const mark = container.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe('World');
  });

  it('handles case-insensitive matching', () => {
    const { container } = render(<HighlightText text="Hello World" query="hello" />);
    const mark = container.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe('Hello');
  });

  it('renders without highlighting when query is empty', () => {
    render(<HighlightText text="Hello" query="" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<HighlightText text="Test" query="" className="custom" />);
    expect(container.querySelector('.custom')).toBeInTheDocument();
  });
});
