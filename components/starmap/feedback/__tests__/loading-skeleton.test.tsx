/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  LoadingSkeleton,
  FullScreenLoader,
  InlineLoader,
  StarmapLoadingSkeleton,
} from '../loading-skeleton';

describe('LoadingSkeleton', () => {
  it('renders card variant by default', () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it.each(['card', 'panel', 'list', 'chart', 'toolbar'] as const)(
    'renders %s variant without errors',
    (variant) => {
      const { container } = render(<LoadingSkeleton variant={variant} />);
      expect(container.firstChild).toBeInTheDocument();
    }
  );

  it('passes className to variant', () => {
    const { container } = render(<LoadingSkeleton className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });
});

describe('FullScreenLoader', () => {
  it('renders with accessibility attributes', () => {
    render(<FullScreenLoader message="Loading data..." />);
    const loader = screen.getByTestId('full-screen-loader');
    expect(loader).toHaveAttribute('role', 'status');
    expect(loader).toHaveAttribute('aria-busy', 'true');
    expect(loader).toHaveAttribute('aria-label', 'Loading data...');
  });

  it('uses default aria-label when no message provided', () => {
    render(<FullScreenLoader />);
    const loader = screen.getByTestId('full-screen-loader');
    expect(loader).toHaveAttribute('aria-label', 'common.loading');
  });

  it('displays message text', () => {
    render(<FullScreenLoader message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });
});

describe('InlineLoader', () => {
  it('renders with role="status"', () => {
    const { container } = render(<InlineLoader />);
    const loader = container.firstChild as HTMLElement;
    expect(loader).toHaveAttribute('role', 'status');
  });

  it('has sr-only loading text', () => {
    render(<InlineLoader />);
    expect(screen.getByText('common.loading')).toHaveClass('sr-only');
  });

  it.each([
    ['sm', 'h-3 w-3 border'],
    ['lg', 'h-6 w-6 border-2'],
  ] as const)('applies correct classes for size="%s"', (size, expectedClasses) => {
    const { container } = render(<InlineLoader size={size} />);
    const loader = container.firstChild as HTMLElement;
    for (const cls of expectedClasses.split(' ')) {
      expect(loader).toHaveClass(cls);
    }
  });
});

describe('FullScreenLoader', () => {
  it('does not render message paragraph when no message provided', () => {
    render(<FullScreenLoader />);
    const loader = screen.getByTestId('full-screen-loader');
    // The only text inside should be from animated rings, not a <p> message
    expect(loader.querySelector('p')).toBeNull();
  });
});

describe('LoadingSkeleton - default fallback', () => {
  it('falls back to card skeleton for unknown variant', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<LoadingSkeleton variant={'unknown' as any} />);
    expect(container.firstChild).toBeInTheDocument();
    // Card skeleton has specific structure: space-y-3, p-4
    expect(container.firstChild).toHaveClass('space-y-3');
  });
});

describe('StarmapLoadingSkeleton', () => {
  it('renders with accessibility attributes', () => {
    render(<StarmapLoadingSkeleton />);
    const skeleton = screen.getByTestId('starmap-loading-skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'splash.loading');
  });
});
