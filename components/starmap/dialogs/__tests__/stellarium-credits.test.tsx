/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => <p data-testid="dialog-description" className={className}>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="dialog-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

import { StellariumCredits } from '../stellarium-credits';

describe('StellariumCredits', () => {
  it('renders without crashing', () => {
    render(<StellariumCredits />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('renders dialog trigger button', () => {
    render(<StellariumCredits />);
    const button = screen.getByRole('button', { name: /credits.dataCredits/i });
    expect(button).toBeInTheDocument();
  });

  it('renders dialog content', () => {
    render(<StellariumCredits />);
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
  });

  it('displays credits title', () => {
    render(<StellariumCredits />);
    // Multiple headings are rendered, check that at least one exists
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders DialogDescription for accessibility', () => {
    render(<StellariumCredits />);
    const description = screen.getByTestId('dialog-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('sr-only');
  });

  it('supports custom trigger prop', () => {
    const customTrigger = <button data-testid="custom-trigger">Custom</button>;
    render(<StellariumCredits trigger={customTrigger} />);
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });
});
