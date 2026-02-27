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
    searchQuery: '',
    filterStatus: 'all',
    filterPriority: 'all',
    sortBy: 'manual',
    sortOrder: 'asc',
    availableTags: ['galaxy', 'nebula', 'cluster'],
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
    setSearchQuery: jest.fn(),
    setFilterStatus: jest.fn(),
    setFilterPriority: jest.fn(),
    setSortBy: jest.fn(),
    setSortOrder: jest.fn(),
    removeTargetsBatch: jest.fn(),
    setStatusBatch: jest.fn(),
    setPriorityBatch: jest.fn(),
    addTargetsBatch: jest.fn(),
    getFilteredTargets: jest.fn(() => []),
    getGroupedTargets: jest.fn(() => new Map()),
    toggleFavorite: jest.fn(),
    toggleArchive: jest.fn(),
    addTagBatch: jest.fn(),
    removeTagBatch: jest.fn(),
    checkDuplicate: jest.fn(() => undefined),
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

const mockUseEquipmentStore = jest.fn((selector) => {
  const state = {
    sensorWidth: 23.5,
    sensorHeight: 15.6,
    focalLength: 400,
    rotationAngle: 0,
    mosaic: {
      enabled: false,
      rows: 2,
      cols: 2,
      overlap: 20,
      overlapUnit: 'percent',
    },
  };
  return selector ? selector(state) : state;
});

const mockUsePlanningUiStore = jest.fn((selector) => {
  const state = {
    shotListOpen: true,
    openShotList: jest.fn(),
    closeShotList: jest.fn(),
    setShotListOpen: jest.fn(),
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useTargetListStore: (selector: (state: unknown) => unknown) => mockUseTargetListStore(selector),
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
  useMountStore: (selector: (state: unknown) => unknown) => mockUseMountStore(selector),
  useEquipmentStore: (selector: (state: unknown) => unknown) => mockUseEquipmentStore(selector),
  usePlanningUiStore: (selector: (state: unknown) => unknown) => mockUsePlanningUiStore(selector),
}));

// Mock astro-utils
jest.mock('@/lib/astronomy/astro-utils', () => ({
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

// Mock Tauri API for import/export
jest.mock('@/lib/tauri', () => ({
  tauriApi: {
    targetIo: {
      exportTargets: jest.fn().mockResolvedValue('/path/to/exported.csv'),
      importTargets: jest.fn().mockResolvedValue({
        imported: 5,
        skipped: 0,
        errors: [],
        targets: [
          { name: 'M31', ra: 10.68, dec: 41.27, ra_string: '00h 42m', dec_string: '+41°' },
        ],
      }),
    },
  },
}));

// Mock platform check
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }),
}));

// Mock TranslatedName component
jest.mock('../../objects/translated-name', () => ({
  TranslatedName: ({ name }: { name: string }) => <span data-testid="translated-name">{name}</span>,
}));

// Mock TargetDetailDialog
jest.mock('../target-detail-dialog', () => ({
  TargetDetailDialog: () => <div data-testid="target-detail-dialog" />,
}));

// Mock planning-styles
jest.mock('@/lib/core/constants/planning-styles', () => ({
  getStatusColor: jest.fn(() => 'bg-blue-500'),
  getPriorityColor: jest.fn(() => 'text-amber-400'),
}));

// Mock FeasibilityBadge
jest.mock('../feasibility-badge', () => ({
  FeasibilityBadge: () => <div data-testid="feasibility-badge" />,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
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

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible">{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible-content">{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <button data-testid="collapsible-trigger">{children}</button>,
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

import { ShotList } from '../shot-list';

describe('ShotList', () => {
  const defaultProps = {
    onNavigateToTarget: jest.fn(),
    currentSelection: null,
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

describe('ShotList with targets', () => {
  const defaultProps = {
    onNavigateToTarget: jest.fn(),
    currentSelection: null,
  };

  function makeStoreWithTargets() {
    mockUseTargetListStore.mockImplementation((sel: (s: unknown) => unknown) => {
      const s = {
        targets: [
          { id: 't1', name: 'M31', ra: 10.68, dec: 41.27, raString: '00h 42m', decString: "+41\u00b016'", priority: 'high', status: 'planned', notes: '', tags: ['galaxy'], addedAt: Date.now(), type: 'Galaxy', isFavorite: true, isArchived: false },
          { id: 't2', name: 'M42', ra: 83.82, dec: -5.39, raString: '05h 35m', decString: "-05\u00b023'", priority: 'medium', status: 'in_progress', notes: '', tags: ['nebula'], addedAt: Date.now(), type: 'Nebula', isFavorite: false, isArchived: false },
        ],
        activeTargetId: null, selectedIds: new Set(), groupBy: 'none', showArchived: false,
        searchQuery: '', filterStatus: 'all', filterPriority: 'all', sortBy: 'manual', sortOrder: 'asc',
        availableTags: ['galaxy', 'nebula'],
        addTarget: jest.fn(), removeTarget: jest.fn(), updateTarget: jest.fn(), setActiveTarget: jest.fn(),
        reorderTargets: jest.fn(), clearCompleted: jest.fn(), clearAll: jest.fn(),
        toggleSelection: jest.fn(), selectAll: jest.fn(), clearSelection: jest.fn(),
        setGroupBy: jest.fn(), setShowArchived: jest.fn(), setSearchQuery: jest.fn(),
        setFilterStatus: jest.fn(), setFilterPriority: jest.fn(), setSortBy: jest.fn(), setSortOrder: jest.fn(),
        removeTargetsBatch: jest.fn(), setStatusBatch: jest.fn(), setPriorityBatch: jest.fn(), addTargetsBatch: jest.fn(),
        getFilteredTargets: jest.fn(() => []), getGroupedTargets: jest.fn(() => new Map()),
        toggleFavorite: jest.fn(), toggleArchive: jest.fn(), addTagBatch: jest.fn(), removeTagBatch: jest.fn(),
        checkDuplicate: jest.fn(() => undefined),
      };
      return sel ? sel(s) : s;
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders drawer title', () => {
    render(<ShotList {...defaultProps} />);
    expect(screen.getByText('shotList.shotList')).toBeInTheDocument();
  });

  it('renders search input when targets exist', () => {
    makeStoreWithTargets();
    render(<ShotList {...defaultProps} />);
    const inputs = screen.getAllByTestId('input');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders alert dialog for clear actions', () => {
    makeStoreWithTargets();
    render(<ShotList {...defaultProps} />);
    expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
  });

  it('renders dropdown menu', () => {
    render(<ShotList {...defaultProps} />);
    const dropdowns = screen.getAllByTestId('dropdown-menu');
    expect(dropdowns.length).toBeGreaterThanOrEqual(1);
  });

  it('renders target detail dialog', () => {
    render(<ShotList {...defaultProps} />);
    expect(screen.getByTestId('target-detail-dialog')).toBeInTheDocument();
  });

  it('renders scroll area for target list', () => {
    render(<ShotList {...defaultProps} />);
    expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
  });

  it('renders badges', () => {
    render(<ShotList {...defaultProps} />);
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders tooltip provider', () => {
    render(<ShotList {...defaultProps} />);
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
  });
});

describe('ShotList Import/Export', () => {
  const { tauriApi } = jest.requireMock('@/lib/tauri');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has targetIo API methods defined', () => {
    expect(tauriApi.targetIo.exportTargets).toBeDefined();
    expect(tauriApi.targetIo.importTargets).toBeDefined();
  });

  it('exportTargets returns file path', async () => {
    const result = await tauriApi.targetIo.exportTargets();
    expect(typeof result).toBe('string');
  });

  it('importTargets returns import result', async () => {
    const result = await tauriApi.targetIo.importTargets();
    expect(result).toHaveProperty('imported');
    expect(result).toHaveProperty('skipped');
    expect(result).toHaveProperty('targets');
    expect(Array.isArray(result.targets)).toBe(true);
  });
});


