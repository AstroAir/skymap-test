/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock stores
const mockUseMarkerStore = jest.fn((selector) => {
  const state = {
    markers: [],
    groups: [],
    selectedGroup: 'all',
    addMarker: jest.fn(),
    removeMarker: jest.fn(),
    updateMarker: jest.fn(),
    toggleMarkerVisibility: jest.fn(),
    clearAllMarkers: jest.fn(),
    setSelectedGroup: jest.fn(),
    addGroup: jest.fn(),
    removeGroup: jest.fn(),
  };
  return selector ? selector(state) : state;
});

const mockUseStellariumStore = jest.fn((selector) => {
  const state = {
    setViewDirection: jest.fn(),
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useMarkerStore: (selector: (state: unknown) => unknown) => mockUseMarkerStore(selector),
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
  MARKER_COLORS: ['red', 'blue', 'green', 'yellow'],
  MARKER_ICONS: ['star', 'circle', 'crosshair', 'diamond'],
}));

// Mock UI components
jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div data-testid="drawer">{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div data-testid="drawer-content">{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="drawer-header">{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="drawer-title">{children}</h2>,
  DrawerTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="drawer-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p data-testid="alert-dialog-description">{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="alert-dialog-title">{children}</h2>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="tooltip-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label data-testid="label">{children}</label>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea data-testid="textarea" {...props} />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div data-testid="scroll-area">{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

import { MarkerManager } from '../marker-manager';

describe('MarkerManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MarkerManager />);
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
  });

  it('renders drawer trigger button', () => {
    render(<MarkerManager />);
    const buttons = screen.getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders drawer content', () => {
    render(<MarkerManager />);
    expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
  });

  it('renders scroll area for markers list', () => {
    render(<MarkerManager />);
    expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
  });
});

