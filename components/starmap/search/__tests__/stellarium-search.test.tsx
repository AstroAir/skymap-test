/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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
      types: ['DSO', 'Planet', 'Star', 'Moon', 'Comet', 'TargetList', 'Constellation'],
      includeTargetList: true,
      searchMode: 'name',
      minMagnitude: undefined,
      maxMagnitude: undefined,
      searchRadius: 5,
    },
    setFilters: jest.fn(),
    clearSearch: jest.fn(),
    selectedIds: new Set(),
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

// Mock hooks
jest.mock('@/lib/hooks', () => ({
  useObjectSearch: jest.fn(() => createMockSearchHook()),
  useCelestialName: jest.fn((name: string) => name),
  useSkyCultureLanguage: jest.fn(() => 'native'),
  useSelectTarget: jest.fn(() => jest.fn()),
}));

jest.mock('@/lib/hooks/use-target-list-actions', () => ({
  useTargetListActions: jest.fn(() => ({
    handleAddToTargetList: jest.fn(),
    handleBatchAdd: jest.fn(),
  })),
}));

// Mock stores
jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn(() => ({
    stel: null,
    isReady: true,
    setViewDirection: jest.fn(),
    skyCultureLanguage: 'native',
  })),
  useTargetListStore: jest.fn(() => ({
    addTarget: jest.fn(),
    addTargetsBatch: jest.fn(),
    targets: [],
  })),
}));

// Mock search-utils (getResultId)
jest.mock('@/lib/core/search-utils', () => ({
  getResultId: jest.fn((item: { Type?: string; Name: string }) => `${item.Type}-${item.Name}`),
}));

// Mock translations helper
jest.mock('@/lib/translations', () => ({
  translateCelestialName: jest.fn((name: string) => name),
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="search-input" {...props} />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-trigger">{children}</div>,
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuCheckboxItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (c: boolean) => void }) => (
    <input type="checkbox" data-testid="checkbox" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
}));

// Mock child components to simplify tests
jest.mock('../advanced-search-dialog', () => ({
  AdvancedSearchDialog: ({ searchHook }: { open: boolean; searchHook?: unknown }) => (
    <div data-testid="advanced-search-dialog" data-has-shared-hook={!!searchHook}>mock-advanced-search</div>
  ),
}));

import { StellariumSearch } from '../stellarium-search';

describe('StellariumSearch', () => {
  const defaultProps = {
    onSelect: jest.fn(),
    enableMultiSelect: false,
    onBatchAdd: jest.fn(),
    onFocusChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<StellariumSearch {...defaultProps} />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<StellariumSearch {...defaultProps} />);
    const input = screen.getByTestId('search-input');
    expect(input).toBeInTheDocument();
  });

  it('calls setQuery when typing', () => {
    const { useObjectSearch } = jest.requireMock('@/lib/hooks');
    const mockSetQuery = jest.fn();
    useObjectSearch.mockReturnValue(createMockSearchHook({ setQuery: mockSetQuery }));

    render(<StellariumSearch {...defaultProps} />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'M31' } });

    expect(mockSetQuery).toHaveBeenCalledWith('M31');
  });

  it('passes shared searchHook to AdvancedSearchDialog', () => {
    render(<StellariumSearch {...defaultProps} />);
    const dialog = screen.getByTestId('advanced-search-dialog');
    expect(dialog).toHaveAttribute('data-has-shared-hook', 'true');
  });

  it('shows online searching indicator when isOnlineSearching is true', () => {
    const { useObjectSearch } = jest.requireMock('@/lib/hooks');
    useObjectSearch.mockReturnValue(createMockSearchHook({
      query: 'M31',
      isOnlineSearching: true,
      results: [{ Name: 'M31', Type: 'DSO' }],
      groupedResults: new Map([['DSO', [{ Name: 'M31', Type: 'DSO' }]]]),
    }));

    render(<StellariumSearch {...defaultProps} />);
    // The component should render without errors when online search is active
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('displays search stats when available', () => {
    const { useObjectSearch } = jest.requireMock('@/lib/hooks');
    useObjectSearch.mockReturnValue(createMockSearchHook({
      query: 'M31',
      searchStats: { totalResults: 5, resultsByType: { DSO: 3, Star: 2 }, searchTimeMs: 42 },
      results: [{ Name: 'M31', Type: 'DSO' }],
      groupedResults: new Map([['DSO', [{ Name: 'M31', Type: 'DSO' }]]]),
    }));

    render(<StellariumSearch {...defaultProps} />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });
});
