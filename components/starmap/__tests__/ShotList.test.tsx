/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock stores with selector pattern
const mockUseTargetListStore = jest.fn((selector) => {
  const state = {
    targets: [],
    activeTargetId: null,
    selectedIds: new Set(),
    groupBy: 'none',
    showArchived: false,
    addTarget: jest.fn(),
    removeTarget: jest.fn(),
    updateTarget: jest.fn(),
    setActiveTarget: jest.fn(),
    reorderTargets: jest.fn(),
    clearCompleted: jest.fn(),
    clearAll: jest.fn(),
    toggleSelection: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
    setGroupBy: jest.fn(),
    setShowArchived: jest.fn(),
    removeTargetsBatch: jest.fn(),
    setStatusBatch: jest.fn(),
    setPriorityBatch: jest.fn(),
    getFilteredTargets: jest.fn(() => []),
  };
  return selector ? selector(state) : state;
});

const mockUseStellariumStore = jest.fn((selector) => {
  const state = {
    stel: null,
    isReady: true,
    setViewDirection: jest.fn(),
  };
  return selector ? selector(state) : state;
});

const mockUseMountStore = jest.fn((selector) => {
  const state = {
    profileInfo: {
      AstrometrySettings: {
        Latitude: 40.7128,
        Longitude: -74.006,
      },
    },
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/starmap/stores', () => ({
  useTargetListStore: (selector: (state: unknown) => unknown) => mockUseTargetListStore(selector),
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
  useMountStore: (selector: (state: unknown) => unknown) => mockUseMountStore(selector),
}));

// Mock astro-utils
jest.mock('@/lib/starmap/astro-utils', () => ({
  planMultipleTargets: jest.fn(() => null),
  calculateImagingFeasibility: jest.fn(() => ({
    score: 80,
    recommendation: 'good',
    factors: [],
    moonScore: 80,
    altitudeScore: 80,
    darkSkyScore: 80,
    warnings: [],
    tips: [],
  })),
  formatTimeShort: jest.fn(() => '--:--'),
  formatDuration: jest.fn(() => '0h'),
}));

// Mock TranslatedName component
jest.mock('../TranslatedName', () => ({
  TranslatedName: ({ name }: { name: string }) => <span data-testid="translated-name">{name}</span>,
}));

// Mock all UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div data-testid="scroll-area">{children}</div>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value?: number }) => <div data-testid="progress" data-value={value} />,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void }) => (
    <input type="checkbox" data-testid="checkbox" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
}));

jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div data-testid="drawer">{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div data-testid="drawer-content">{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="drawer-header">{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="drawer-title">{children}</h2>,
  DrawerTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="drawer-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-provider">{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="tooltip-trigger">{children}</div>
  ),
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
  AlertDialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="alert-dialog-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button data-testid="dropdown-menu-item" onClick={onClick}>{children}</button>
  ),
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="dropdown-menu-trigger">{children}</div>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-menu-separator" />,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-label">{children}</div>,
  DropdownMenuCheckboxItem: ({ children, checked, onCheckedChange }: { children: React.ReactNode; checked?: boolean; onCheckedChange?: (checked: boolean) => void }) => (
    <div data-testid="dropdown-menu-checkbox-item">
      <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
      {children}
    </div>
  ),
}));

import { ShotList } from '../ShotList';

describe('ShotList', () => {
  const defaultProps = {
    onNavigateToTarget: jest.fn(),
    currentSelection: null,
    fovSettings: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ShotList {...defaultProps} />);
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
  });

  it('renders drawer component', () => {
    render(<ShotList {...defaultProps} />);
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
  });

  it('renders trigger button', () => {
    render(<ShotList {...defaultProps} />);
    const buttons = screen.getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no targets', () => {
    render(<ShotList {...defaultProps} />);
    // With empty targets, the component should still render
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
  });
});
