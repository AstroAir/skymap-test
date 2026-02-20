/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock stores
jest.mock('@/lib/stores', () => ({
  useFavoritesStore: jest.fn(() => ({
    favorites: [],
    recentlyViewed: [],
    removeFavorite: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
    clearRecentlyViewed: jest.fn(),
    getAllTags: jest.fn(() => []),
    exportFavorites: jest.fn(() => []),
    importFavorites: jest.fn(() => ({ imported: 0, skipped: 0 })),
  })),
  FAVORITE_TAGS: ['imaging', 'visual', 'easy', 'challenging', 'spring', 'summer', 'autumn', 'winter'],
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <span data-testid="badge" onClick={onClick}>{children}</span>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div data-testid="scroll-area">{children}</div>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => <div data-testid={`tabs-content-${value}`}>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => <button data-testid={`tabs-trigger-${value}`}>{children}</button>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button data-testid="dropdown-menu-item" onClick={onClick}>{children}</button>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-menu-separator" />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-trigger">{children}</div>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { FavoritesQuickAccess } from '../favorites-quick-access';

describe('FavoritesQuickAccess', () => {
  const defaultProps = {
    onSelect: jest.fn(),
    onNavigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<FavoritesQuickAccess {...defaultProps} />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('renders tabs for favorites and recent', () => {
    render(<FavoritesQuickAccess {...defaultProps} />);
    expect(screen.getByTestId('tabs-trigger-favorites')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-trigger-recent')).toBeInTheDocument();
  });

  it('renders empty state when no favorites', () => {
    render(<FavoritesQuickAccess {...defaultProps} />);
    expect(screen.getByTestId('tabs-content-favorites')).toBeInTheDocument();
  });

  it('renders favorites list when favorites exist', () => {
    const { useFavoritesStore } = jest.requireMock('@/lib/stores');
    useFavoritesStore.mockReturnValue({
      favorites: [
        { id: '1', name: 'M31', ra: 10.68, dec: 41.27, type: 'Galaxy', tags: ['imaging'] },
      ],
      recentlyViewed: [],
      removeFavorite: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      clearRecentlyViewed: jest.fn(),
      getAllTags: jest.fn(() => ['imaging']),
    });

    render(<FavoritesQuickAccess {...defaultProps} />);
    expect(screen.getByText('M31')).toBeInTheDocument();
  });

  it('shows filled star icon for favorites', () => {
    const { useFavoritesStore } = jest.requireMock('@/lib/stores');
    useFavoritesStore.mockReturnValue({
      favorites: [
        { id: '1', name: 'M31', ra: 10.68, dec: 41.27, type: 'Galaxy', tags: [] },
      ],
      recentlyViewed: [],
      removeFavorite: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      clearRecentlyViewed: jest.fn(),
      getAllTags: jest.fn(() => []),
    });

    render(<FavoritesQuickAccess {...defaultProps} />);
    // The star icon should have fill-yellow-500 class for favorites
    const favoriteItem = screen.getByText('M31');
    expect(favoriteItem).toBeInTheDocument();
  });

  it('shows unfilled star icon for recent items not in favorites', () => {
    const { useFavoritesStore } = jest.requireMock('@/lib/stores');
    useFavoritesStore.mockReturnValue({
      favorites: [],
      recentlyViewed: [
        { id: '2', name: 'M42', ra: 83.82, dec: -5.39, type: 'Nebula', tags: [] },
      ],
      removeFavorite: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      clearRecentlyViewed: jest.fn(),
      getAllTags: jest.fn(() => []),
    });

    render(<FavoritesQuickAccess {...defaultProps} />);
    // Recent items not in favorites should have unfilled star
    expect(screen.getByTestId('tabs-content-recent')).toBeInTheDocument();
  });

  it('calls onSelect when clicking on an item', () => {
    const mockOnSelect = jest.fn();
    const { useFavoritesStore } = jest.requireMock('@/lib/stores');
    useFavoritesStore.mockReturnValue({
      favorites: [
        { id: '1', name: 'M31', ra: 10.68, dec: 41.27, type: 'Galaxy', tags: [] },
      ],
      recentlyViewed: [],
      removeFavorite: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      clearRecentlyViewed: jest.fn(),
      getAllTags: jest.fn(() => []),
    });

    render(<FavoritesQuickAccess onSelect={mockOnSelect} />);
    
    const item = screen.getByText('M31');
    fireEvent.click(item.closest('div')!);
    
    expect(mockOnSelect).toHaveBeenCalled();
  });

  it('renders tag filter badges when tags exist', () => {
    const { useFavoritesStore } = jest.requireMock('@/lib/stores');
    useFavoritesStore.mockReturnValue({
      favorites: [
        { id: '1', name: 'M31', ra: 10.68, dec: 41.27, type: 'Galaxy', tags: ['imaging', 'spring'] },
      ],
      recentlyViewed: [],
      removeFavorite: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      clearRecentlyViewed: jest.fn(),
      getAllTags: jest.fn(() => ['imaging', 'spring']),
    });

    render(<FavoritesQuickAccess {...defaultProps} />);
    // Should show tag filter badges
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('calls exportFavorites when export button is clicked', () => {
    const { useFavoritesStore } = jest.requireMock('@/lib/stores');
    const exportFavorites = jest.fn(() => []);
    useFavoritesStore.mockReturnValue({
      favorites: [],
      recentlyViewed: [],
      removeFavorite: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      clearRecentlyViewed: jest.fn(),
      getAllTags: jest.fn(() => []),
      exportFavorites,
      importFavorites: jest.fn(() => ({ imported: 0, skipped: 0 })),
    });

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: jest.fn(() => 'blob:test'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });

    render(<FavoritesQuickAccess {...defaultProps} />);
    fireEvent.click(screen.getByText('targetList.exportAs'));

    expect(exportFavorites).toHaveBeenCalled();

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: originalRevokeObjectURL,
    });
  });
});
