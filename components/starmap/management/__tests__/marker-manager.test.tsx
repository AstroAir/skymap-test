/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock stores
const markerState = {
  markers: [],
  groups: [],
  selectedGroup: 'all',
  showMarkers: true,
  showLabels: true,
  globalMarkerSize: 20,
  sortBy: 'date',
  pendingCoords: null,
  editingMarkerId: null,
  addMarker: jest.fn(),
  removeMarker: jest.fn(),
  updateMarker: jest.fn(),
  toggleMarkerVisibility: jest.fn(),
  clearAllMarkers: jest.fn(),
  setSelectedGroup: jest.fn(),
  setShowMarkers: jest.fn(),
  setShowLabels: jest.fn(),
  setGlobalMarkerSize: jest.fn(),
  setSortBy: jest.fn(),
  setPendingCoords: jest.fn(),
  setEditingMarkerId: jest.fn(),
  addGroup: jest.fn(),
  removeGroup: jest.fn(),
  renameGroup: jest.fn(),
  exportMarkers: jest.fn(() => '{}'),
  importMarkers: jest.fn(() => ({ count: 0 })),
};

const mockUseMarkerStore = Object.assign(
  jest.fn((selector) => (selector ? selector(markerState) : markerState)),
  { getState: () => markerState }
);

const stellariumState = {
  setViewDirection: jest.fn(),
};

const mockUseStellariumStore = Object.assign(
  jest.fn((selector) => (selector ? selector(stellariumState) : stellariumState)),
  { getState: () => stellariumState }
);

jest.mock('@/lib/stores', () => ({
  useMarkerStore: Object.assign(
    (selector: (state: unknown) => unknown) => mockUseMarkerStore(selector),
    { getState: () => markerState }
  ),
  useStellariumStore: Object.assign(
    (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
    { getState: () => stellariumState }
  ),
  MARKER_COLORS: ['red', 'blue', 'green', 'yellow'],
  MARKER_ICONS: ['star', 'circle', 'crosshair', 'diamond'],
  MAX_MARKERS: 500,
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

jest.mock('@/components/ui/slider', () => ({
  Slider: (props: Record<string, unknown>) => <input data-testid="slider" type="range" {...props} />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div data-testid="select-item">{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <span data-testid="select-value" />,
}));

jest.mock('@/components/ui/toggle-group', () => ({
  ToggleGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="toggle-group">{children}</div>,
  ToggleGroupItem: ({ children }: { children: React.ReactNode }) => <div data-testid="toggle-group-item">{children}</div>,
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div data-testid="popover">{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="popover-trigger">{children}</div>
  ),
}));

jest.mock('@/lib/constants/marker-icons', () => ({
  MarkerIconDisplay: {
    star: (props: Record<string, unknown>) => <svg data-testid="icon-star" {...props} />,
    circle: (props: Record<string, unknown>) => <svg data-testid="icon-circle" {...props} />,
    crosshair: (props: Record<string, unknown>) => <svg data-testid="icon-crosshair" {...props} />,
    diamond: (props: Record<string, unknown>) => <svg data-testid="icon-diamond" {...props} />,
    pin: (props: Record<string, unknown>) => <svg data-testid="icon-pin" {...props} />,
    triangle: (props: Record<string, unknown>) => <svg data-testid="icon-triangle" {...props} />,
    square: (props: Record<string, unknown>) => <svg data-testid="icon-square" {...props} />,
    flag: (props: Record<string, unknown>) => <svg data-testid="icon-flag" {...props} />,
  },
}));

jest.mock('@/lib/storage', () => ({
  readFileAsText: jest.fn().mockResolvedValue('{}'),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
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

