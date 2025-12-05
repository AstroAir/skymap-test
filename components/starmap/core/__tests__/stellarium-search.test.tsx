/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock hooks
jest.mock('@/lib/hooks', () => ({
  useObjectSearch: jest.fn(() => ({
    query: '',
    searchQuery: '',
    setSearchQuery: jest.fn(),
    setQuery: jest.fn(),
    results: [],
    searchResults: [],
    groupedResults: new Map(),
    isSearching: false,
    searchStats: { total: 0, byType: {} },
    filters: { types: [], minMagnitude: null, maxMagnitude: null },
    setFilters: jest.fn(),
    clearSearch: jest.fn(),
    selectedIds: new Set(),
    toggleSelection: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
  })),
  useCelestialName: jest.fn((name: string) => name),
  useSkyCultureLanguage: jest.fn(() => 'native'),
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
    useObjectSearch.mockReturnValue({
      query: '',
      searchQuery: '',
      setSearchQuery: jest.fn(),
      setQuery: mockSetQuery,
      results: [],
      searchResults: [],
      groupedResults: new Map(),
      isSearching: false,
      searchStats: { total: 0, byType: {} },
      filters: { types: [], minMagnitude: null, maxMagnitude: null },
      setFilters: jest.fn(),
      clearSearch: jest.fn(),
      selectedIds: new Set(),
      toggleSelection: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
    });
    
    render(<StellariumSearch {...defaultProps} />);
    
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'M31' } });
    
    expect(mockSetQuery).toHaveBeenCalledWith('M31');
  });

});

