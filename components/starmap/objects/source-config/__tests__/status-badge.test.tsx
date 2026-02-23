/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('StatusBadge', () => {
  it('renders online status', () => {
    render(<StatusBadge status="online" />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('renders offline status', () => {
    render(<StatusBadge status="offline" />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('renders checking status', () => {
    render(<StatusBadge status="checking" />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('renders unknown status', () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('shows response time when online', () => {
    render(<StatusBadge status="online" responseTime={150} />);
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('does not show response time when offline', () => {
    render(<StatusBadge status="offline" responseTime={150} />);
    expect(screen.queryByText('150ms')).not.toBeInTheDocument();
  });

  it('shows response time in tooltip', () => {
    render(<StatusBadge status="online" responseTime={200} />);
    const matches = screen.getAllByText(/200ms/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
