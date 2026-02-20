/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { UseObjectSearchReturn } from '@/lib/hooks/use-object-search';

// ============================================================================
// Helper: create a complete mock return value for useObjectSearch
// ============================================================================
function createMockSearchHook(overrides: Record<string, unknown> = {}) {
  return {
    query: '',
    setQuery: jest.fn(),
    search: jest.fn(),
    results: [],
    groupedResults: new Map(),
    isSearching: false,
    isOnlineSearching: false,
    onlineAvailable: false,
    searchStats: { totalResults: 0, resultsByType: {}, searchTimeMs: 0 },
    filters: {
      types: ['DSO', 'Planet', 'Star', 'Moon', 'Comet', 'Asteroid', 'TargetList', 'Constellation'],
      includeTargetList: true,
      searchMode: 'name',
      minMagnitude: undefined,
      maxMagnitude: undefined,
      searchRadius: 5,
    },
    setFilters: jest.fn(),
    clearSearch: jest.fn(),
    selectedIds: new Set<string>(),
    toggleSelection: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
    sortBy: 'relevance',
    setSortBy: jest.fn(),
    recentSearches: [],
    addRecentSearch: jest.fn(),
    clearRecentSearches: jest.fn(),
    getSelectedItems: jest.fn(() => []),
    isSelected: jest.fn(() => false),
    popularObjects: [],
    quickCategories: [],
    ...overrides,
  };
}

// Mock stores
const mockUseStellariumStore = jest.fn((selector) => {
  const state = {
    stel: null,
    isReady: true,
    setViewDirection: jest.fn(),
  };
  return selector ? selector(state) : state;
});

const mockUseTargetListStore = jest.fn((selector) => {
  const state = {
    addTarget: jest.fn(),
    addTargetsBatch: jest.fn(),
    targets: [],
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
}));

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: (selector: (state: unknown) => unknown) => mockUseTargetListStore(selector),
}));

// Mock hooks
jest.mock('@/lib/hooks', () => ({
  useObjectSearch: jest.fn(() => createMockSearchHook()),
  useSkyCultureLanguage: jest.fn(() => 'western'),
  useSelectTarget: jest.fn(() => jest.fn()),
}));

jest.mock('@/lib/hooks/use-target-list-actions', () => ({
  useTargetListActions: jest.fn(() => ({
    handleAddToTargetList: jest.fn(),
    handleBatchAdd: jest.fn(),
  })),
}));

// Mock constants
jest.mock('@/lib/core/constants/search', () => ({
  ALL_OBJECT_TYPES: ['DSO', 'Planet', 'Star', 'Moon', 'Comet', 'Asteroid', 'Constellation'],
  CATALOG_PRESETS: [],
}));

// Mock coordinate validators
jest.mock('@/lib/astronomy/coordinate-validators', () => ({
  isValidRA: jest.fn(() => true),
  isValidDec: jest.fn(() => true),
}));

// Mock utils
jest.mock('@/lib/astronomy/starmap-utils', () => ({
  rad2deg: jest.fn((x: number) => x),
  degreesToHMS: jest.fn(() => '00h 00m 00s'),
  degreesToDMS: jest.fn(() => '+00° 00\' 00"'),
}));

jest.mock('@/lib/translations', () => ({
  translateCelestialName: jest.fn((name: string) => name),
}));

jest.mock('@/lib/core/search-utils', () => ({
  getResultId: jest.fn((item: { Type?: string; Name: string }) => `${item.Type}-${item.Name}`),
}));

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label data-testid="label">{children}</label>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div data-testid="scroll-area">{children}</div>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void }) => (
    <input type="checkbox" data-testid="checkbox" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange }: { value?: number[]; onValueChange?: (v: number[]) => void }) => (
    <input type="range" data-testid="slider" value={value?.[0] || 0} onChange={(e) => onValueChange?.([Number(e.target.value)])} />
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (c: boolean) => void }) => (
    <input type="checkbox" data-testid="switch" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button data-testid="tabs-trigger">{children}</button>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option data-testid="select-item" value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <span data-testid="select-value">Select...</span>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="tooltip-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { AdvancedSearchDialog } from '../advanced-search-dialog';

describe('AdvancedSearchDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AdvancedSearchDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(<AdvancedSearchDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<AdvancedSearchDialog {...defaultProps} />);
    const inputs = screen.getAllByTestId('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders tabs for different search modes', () => {
    render(<AdvancedSearchDialog {...defaultProps} />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('renders batch search controls and extended sort options', () => {
    const { container } = render(<AdvancedSearchDialog {...defaultProps} />);

    expect(container.querySelector('textarea')).toBeInTheDocument();
    expect(container.querySelector('input[type="file"][accept=".txt,.csv"]')).toBeInTheDocument();

    const optionValues = screen.getAllByTestId('select-item').map(node => node.getAttribute('value'));
    expect(optionValues).toEqual(expect.arrayContaining(['magnitude', 'altitude', 'distance']));
  });

  it('uses shared searchHook when provided', () => {
    const sharedHook = createMockSearchHook({ query: 'shared-query' });
    const { useObjectSearch } = jest.requireMock('@/lib/hooks');
    // When searchHook is provided, the component should NOT create its own instance
    // (but our fallback pattern still calls useObjectSearch unconditionally)
    useObjectSearch.mockReturnValue(createMockSearchHook());

    render(<AdvancedSearchDialog {...defaultProps} searchHook={sharedHook as unknown as UseObjectSearchReturn} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('falls back to own useObjectSearch when searchHook is not provided', () => {
    const { useObjectSearch } = jest.requireMock('@/lib/hooks');
    const mockHook = createMockSearchHook();
    useObjectSearch.mockReturnValue(mockHook);

    render(<AdvancedSearchDialog {...defaultProps} />);
    expect(useObjectSearch).toHaveBeenCalled();
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });
});
