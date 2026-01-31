/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => (
    <div data-testid="dialog" data-open={open}>{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="dialog-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="tooltip-trigger">{children}</div>
  ),
}));

import { KeyboardShortcutsDialog } from '../keyboard-shortcuts-dialog';

describe('KeyboardShortcutsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<KeyboardShortcutsDialog />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('renders dialog trigger button with aria-label', () => {
    render(<KeyboardShortcutsDialog />);
    const buttons = screen.getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).toHaveAttribute('aria-label');
  });

  it('renders dialog content', () => {
    render(<KeyboardShortcutsDialog />);
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
  });

  it('renders shortcut groups with separators', () => {
    render(<KeyboardShortcutsDialog />);
    const separators = screen.getAllByTestId('separator');
    // Should have separators between groups (4 groups = 3 separators)
    expect(separators.length).toBe(3);
  });

  it('renders shortcut badges', () => {
    render(<KeyboardShortcutsDialog />);
    const badges = screen.getAllByTestId('badge');
    // Each shortcut has at least one badge for the key
    expect(badges.length).toBeGreaterThan(0);
  });

  it('supports custom trigger prop', () => {
    const customTrigger = <button data-testid="custom-trigger">Custom</button>;
    render(<KeyboardShortcutsDialog trigger={customTrigger} />);
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });

  it('responds to ? key press to open dialog', () => {
    render(<KeyboardShortcutsDialog />);
    
    // Simulate ? key press
    fireEvent.keyDown(window, { key: '?', shiftKey: true });
    
    // Dialog should indicate it's open
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveAttribute('data-open', 'true');
  });
});
