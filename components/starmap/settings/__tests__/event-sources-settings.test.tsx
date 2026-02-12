/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock stores
const mockSources = [
  { id: 'usno', name: 'USNO', apiUrl: 'https://aa.usno.navy.mil/api', apiKey: '', enabled: true, priority: 1, cacheMinutes: 60 },
  { id: 'imo', name: 'IMO', apiUrl: 'https://www.imo.net/api', apiKey: '', enabled: true, priority: 2, cacheMinutes: 60 },
  { id: 'custom-1', name: 'Custom', apiUrl: 'https://custom.api', apiKey: 'key123', enabled: false, priority: 10, cacheMinutes: 30 },
];

const mockToggleSource = jest.fn();
const mockUpdateSource = jest.fn();
const mockAddSource = jest.fn();
const mockRemoveSource = jest.fn();
const mockResetToDefaults = jest.fn();

const mockUseEventSourcesStore = jest.fn((selector) => {
  const state = {
    sources: mockSources,
    toggleSource: mockToggleSource,
    updateSource: mockUpdateSource,
    addSource: mockAddSource,
    removeSource: mockRemoveSource,
    resetToDefaults: mockResetToDefaults,
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useEventSourcesStore: (selector: (state: unknown) => unknown) => mockUseEventSourcesStore(selector),
}));

jest.mock('@/lib/services/http-fetch', () => ({
  smartFetch: jest.fn(() => Promise.resolve({ ok: true })),
}));

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    open ? <div data-testid="edit-dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }: { checked?: boolean; onCheckedChange?: (v: boolean) => void; id?: string }) => (
    <input type="checkbox" data-testid={`switch-${id}`} checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="source-card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div>{children}</div>
  ),
}));

import { EventSourcesSettings } from '../event-sources-settings';

describe('EventSourcesSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<EventSourcesSettings />);
    expect(screen.getByText('eventSources.title')).toBeInTheDocument();
  });

  it('renders all source cards', () => {
    render(<EventSourcesSettings />);
    const cards = screen.getAllByTestId('source-card');
    expect(cards.length).toBe(mockSources.length);
  });

  it('renders source names', () => {
    render(<EventSourcesSettings />);
    expect(screen.getByText('USNO')).toBeInTheDocument();
    expect(screen.getByText('IMO')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('renders switches with correct checked state', () => {
    render(<EventSourcesSettings />);
    const usnoSwitch = screen.getByTestId('switch-src-usno') as HTMLInputElement;
    expect(usnoSwitch.checked).toBe(true);
    const customSwitch = screen.getByTestId('switch-src-custom-1') as HTMLInputElement;
    expect(customSwitch.checked).toBe(false);
  });

  it('toggles source when switch clicked', () => {
    render(<EventSourcesSettings />);
    const usnoSwitch = screen.getByTestId('switch-src-usno');
    fireEvent.click(usnoSwitch);
    expect(mockToggleSource).toHaveBeenCalledWith('usno');
  });

  it('shows API badge for sources with API key', () => {
    render(<EventSourcesSettings />);
    // custom-1 has apiKey 'key123'
    const badges = screen.getAllByTestId('badge');
    const apiBadge = badges.find(b => b.textContent?.includes('API'));
    expect(apiBadge).toBeDefined();
  });

  it('renders description text', () => {
    render(<EventSourcesSettings />);
    expect(screen.getByText('eventSources.description')).toBeInTheDocument();
  });
});
