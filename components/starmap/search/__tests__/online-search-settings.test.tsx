/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ============================================================================
// Mocks
// ============================================================================

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: Record<string, unknown>) => opts?.defaultValue ?? key,
}));

const mockUpdateSettings = jest.fn();
const mockSetSearchMode = jest.fn();
const mockToggleOnlineSource = jest.fn();
const mockClearCache = jest.fn();

const mockSearchStoreState = {
  settings: {
    mode: 'hybrid',
    autoSwitchToOnline: true,
    onlineSources: [
      { id: 'sesame', enabled: true, priority: 0 },
      { id: 'simbad', enabled: true, priority: 1 },
    ],
    defaultLimit: 50,
    timeout: 10000,
    cacheResults: true,
    cacheDuration: 24,
    showSourceBadges: true,
    groupBySource: false,
  },
  currentSearchMode: 'hybrid' as const,
  onlineStatus: { sesame: true, simbad: false } as Record<string, boolean>,
  updateSettings: mockUpdateSettings,
  setSearchMode: mockSetSearchMode,
  toggleOnlineSource: mockToggleOnlineSource,
  clearCache: mockClearCache,
};

jest.mock('@/lib/stores/search-store', () => ({
  useSearchStore: jest.fn(() => mockSearchStoreState),
}));

jest.mock('@/lib/services/online-search-service', () => ({
  ONLINE_SEARCH_SOURCES: {
    sesame: { id: 'sesame', name: 'Sesame' },
    simbad: { id: 'simbad', name: 'SIMBAD' },
  },
}));

jest.mock('@/lib/core/constants/search', () => ({
  SOURCE_COLOR_MAP: {
    sesame: 'bg-blue-500/10 text-blue-500',
    simbad: 'bg-purple-500/10 text-purple-500',
  },
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (c: boolean) => void }) => (
    <input type="checkbox" data-testid="switch" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
}));
jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, disabled }: { value?: number[]; onValueChange?: (v: number[]) => void; disabled?: boolean }) => (
    <input type="range" data-testid="slider" value={value?.[0] || 0} disabled={disabled} onChange={(e) => onValueChange?.([Number(e.target.value)])} />
  ),
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));
jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div data-testid="popover">{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-trigger">{children}</div>,
}));
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/ui/toggle-group', () => ({
  ToggleGroup: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (v: string) => void }) => (
    <div data-testid="toggle-group" onClick={() => onValueChange?.('local')}>{children}</div>
  ),
  ToggleGroupItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
    <button data-testid={`toggle-${value}`}>{children}</button>
  ),
}));

import { OnlineSearchSettings, SourceBadge, OnlineStatusIndicator } from '../online-search-settings';

// ============================================================================
// OnlineSearchSettings tests
// ============================================================================

describe('OnlineSearchSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders non-compact mode without crashing', () => {
    render(<OnlineSearchSettings />);
    expect(screen.getByText('search.onlineSearch')).toBeInTheDocument();
  });

  it('renders compact mode with popover', () => {
    render(<OnlineSearchSettings compact />);
    expect(screen.getByTestId('popover')).toBeInTheDocument();
  });

  it('renders source list with online/offline badges', () => {
    render(<OnlineSearchSettings />);
    expect(screen.getByText('Sesame')).toBeInTheDocument();
    expect(screen.getByText('SIMBAD')).toBeInTheDocument();
    expect(screen.getByText('common.online')).toBeInTheDocument();
    expect(screen.getByText('common.offline')).toBeInTheDocument();
  });

  it('renders search mode toggle', () => {
    render(<OnlineSearchSettings />);
    expect(screen.getByTestId('toggle-local')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-hybrid')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-online')).toBeInTheDocument();
  });

  it('renders timeout slider', () => {
    render(<OnlineSearchSettings />);
    expect(screen.getByTestId('slider')).toBeInTheDocument();
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('calls clearCache when clear button is clicked', () => {
    render(<OnlineSearchSettings />);
    fireEvent.click(screen.getByText('search.clearCache'));
    expect(mockClearCache).toHaveBeenCalled();
  });

  it('renders cache and badge toggle switches', () => {
    render(<OnlineSearchSettings />);
    const switches = screen.getAllByTestId('switch');
    // source toggles + cacheResults + showSourceBadges + groupBySource
    expect(switches.length).toBeGreaterThanOrEqual(3);
  });

  it('calls toggleOnlineSource when source switch toggled', () => {
    render(<OnlineSearchSettings />);
    const switches = screen.getAllByTestId('switch');
    // First switches are source toggles
    fireEvent.click(switches[0]);
    expect(mockToggleOnlineSource).toHaveBeenCalled();
  });

  it('calls updateSettings when cache switch toggled', () => {
    render(<OnlineSearchSettings />);
    const switches = screen.getAllByTestId('switch');
    // Cache switch is after the source switches (2 sources)
    fireEvent.click(switches[2]);
    expect(mockUpdateSettings).toHaveBeenCalled();
  });

  it('calls setSearchMode when toggle group clicked', () => {
    render(<OnlineSearchSettings />);
    fireEvent.click(screen.getByTestId('toggle-group'));
    expect(mockSetSearchMode).toHaveBeenCalledWith('local');
  });

  it('calls updateSettings for showSourceBadges switch', () => {
    render(<OnlineSearchSettings />);
    const switches = screen.getAllByTestId('switch');
    if (switches.length >= 4) {
      fireEvent.click(switches[3]);
      expect(mockUpdateSettings).toHaveBeenCalled();
    }
  });

  it('calls updateSettings for groupBySource switch', () => {
    render(<OnlineSearchSettings />);
    const switches = screen.getAllByTestId('switch');
    if (switches.length >= 5) {
      fireEvent.click(switches[4]);
      expect(mockUpdateSettings).toHaveBeenCalled();
    }
  });

});

// ============================================================================
// SourceBadge tests
// ============================================================================

describe('SourceBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders badge for non-local source', () => {
    render(<SourceBadge source="sesame" />);
    expect(screen.getByText('Sesame')).toBeInTheDocument();
  });

  it('returns null for local source', () => {
    const { container } = render(<SourceBadge source="local" />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when showSourceBadges is false', () => {
    const { useSearchStore } = jest.requireMock('@/lib/stores/search-store');
    useSearchStore.mockReturnValue({
      ...mockSearchStoreState,
      settings: { ...mockSearchStoreState.settings, showSourceBadges: false },
    });
    const { container } = render(<SourceBadge source="sesame" />);
    expect(container.innerHTML).toBe('');
    // Restore
    useSearchStore.mockReturnValue(mockSearchStoreState);
  });

  it('renders unknown source name as-is', () => {
    render(<SourceBadge source="unknown" />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});

// ============================================================================
// OnlineStatusIndicator tests
// ============================================================================

describe('OnlineStatusIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders online indicator when online mode and any source online', () => {
    render(<OnlineStatusIndicator />);
    expect(screen.getByText('search.onlineSearchActive')).toBeInTheDocument();
  });

  it('renders unavailable indicator when online mode but no source online', () => {
    const { useSearchStore } = jest.requireMock('@/lib/stores/search-store');
    useSearchStore.mockReturnValue({
      ...mockSearchStoreState,
      onlineStatus: { sesame: false, simbad: false },
    });
    render(<OnlineStatusIndicator />);
    expect(screen.getByText('search.onlineSearchUnavailable')).toBeInTheDocument();
    useSearchStore.mockReturnValue(mockSearchStoreState);
  });

  it('renders local-only indicator when in local mode', () => {
    const { useSearchStore } = jest.requireMock('@/lib/stores/search-store');
    useSearchStore.mockReturnValue({
      ...mockSearchStoreState,
      currentSearchMode: 'local',
    });
    render(<OnlineStatusIndicator />);
    expect(screen.getByText('search.localSearchOnly')).toBeInTheDocument();
    useSearchStore.mockReturnValue(mockSearchStoreState);
  });
});

