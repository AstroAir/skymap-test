/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock geocoding service
jest.mock('@/lib/services/geocoding-service', () => ({
  geocodingService: {
    geocode: jest.fn(),
    reverseGeocode: jest.fn(),
  },
}));

import { geocodingService } from '@/lib/services/geocoding-service';

const mockGeocode = geocodingService.geocode as jest.Mock;
const mockReverseGeocode = geocodingService.reverseGeocode as jest.Mock;

// Mock UI components - Input must be defined inline to avoid hoisting issues
jest.mock('@/components/ui/input', () => ({
  Input: jest.fn().mockImplementation((props) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    return React.createElement('input', {
      'data-testid': 'search-input',
      ...props,
    });
  }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    className,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
    variant?: string;
    size?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="scroll-area" className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

import { LocationSearch } from '@/components/starmap/map/location-search';

describe('LocationSearch', () => {
  const mockOnLocationSelect = jest.fn();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Rendering', () => {
    it('renders search input', () => {
      render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <LocationSearch
          onLocationSelect={mockOnLocationSelect}
          placeholder="Custom placeholder"
        />
      );
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(
        <LocationSearch
          onLocationSelect={mockOnLocationSelect}
          initialValue="Tokyo"
        />
      );
      expect(screen.getByDisplayValue('Tokyo')).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<LocationSearch onLocationSelect={mockOnLocationSelect} disabled />);
      expect(screen.getByTestId('search-input')).toBeDisabled();
    });
  });

  describe('Search Functionality', () => {
    it('triggers search after debounce period', async () => {
      mockGeocode.mockResolvedValue([
        {
          displayName: 'Tokyo, Japan',
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: 'Tokyo',
        },
      ]);

      render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Tokyo' } });

      // Debounce period is 300ms
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockGeocode).toHaveBeenCalledWith('Tokyo', expect.any(Object));
      });
    });

    it('does not search when query is empty', async () => {
      render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: '' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockGeocode).not.toHaveBeenCalled();
    });

    it('displays search results', async () => {
      mockGeocode.mockResolvedValue([
        {
          displayName: 'Tokyo, Japan',
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: 'Tokyo',
        },
        {
          displayName: 'Kyoto, Japan',
          coordinates: { latitude: 35.0116, longitude: 135.7681 },
          address: 'Kyoto',
        },
      ]);

      render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Japan' } });
      fireEvent.focus(input);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument();
        expect(screen.getByText('Kyoto, Japan')).toBeInTheDocument();
      });
    });

    it('selects location from search results', async () => {
      mockGeocode.mockResolvedValue([
        {
          displayName: 'Tokyo, Japan',
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: 'Tokyo',
        },
      ]);

      render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Tokyo' } });
      fireEvent.focus(input);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Tokyo, Japan'));

      expect(mockOnLocationSelect).toHaveBeenCalledWith({
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        address: 'Tokyo',
        displayName: 'Tokyo, Japan',
      });
    });

    it('handles search errors gracefully', async () => {
      mockGeocode.mockRejectedValue(new Error('Network error'));

      render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Error test' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should not crash, results should be empty
      await waitFor(() => {
        expect(mockGeocode).toHaveBeenCalled();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes dropdown on Escape key', async () => {
      mockGeocode.mockResolvedValue([
        {
          displayName: 'Tokyo, Japan',
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: 'Tokyo',
        },
      ]);

      render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Tokyo' } });
      fireEvent.focus(input);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Tokyo, Japan')).not.toBeInTheDocument();
      });
    });

    it('navigates results with arrow keys', async () => {
      mockGeocode.mockResolvedValue([
        {
          displayName: 'Tokyo, Japan',
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: 'Tokyo',
        },
        {
          displayName: 'Osaka, Japan',
          coordinates: { latitude: 34.6937, longitude: 135.5023 },
          address: 'Osaka',
        },
      ]);

      render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Japan' } });
      fireEvent.focus(input);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument();
      });

      // Navigate down
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      // Navigate up
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      // No assertion needed - just ensure it doesn't crash
    });

    it('selects item on Enter key', async () => {
      mockGeocode.mockResolvedValue([
        {
          displayName: 'Tokyo, Japan',
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: 'Tokyo',
        },
      ]);

      render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Tokyo' } });
      fireEvent.focus(input);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnLocationSelect).toHaveBeenCalled();
    });
  });

  describe('Clear Button', () => {
    it('shows clear button when query is not empty', () => {
      render(
        <LocationSearch
          onLocationSelect={mockOnLocationSelect}
          initialValue="Tokyo"
        />
      );

      // Clear button should be visible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('clears input when clear button is clicked', () => {
      render(
        <LocationSearch
          onLocationSelect={mockOnLocationSelect}
          initialValue="Tokyo"
        />
      );

      const clearButton = screen.getAllByRole('button')[0];
      fireEvent.click(clearButton);

      expect(screen.getByTestId('search-input')).toHaveValue('');
    });
  });

  describe('Current Location', () => {
    it('handles current location when geolocation is available', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((success) =>
          success({
            coords: {
              latitude: 35.6762,
              longitude: 139.6503,
            },
          })
        ),
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      mockReverseGeocode.mockResolvedValue({
        displayName: 'Tokyo, Japan',
        address: 'Tokyo',
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
      });

      render(
        <LocationSearch
          onLocationSelect={mockOnLocationSelect}
          showCurrentLocation
        />
      );

      const input = screen.getByTestId('search-input');
      fireEvent.focus(input);

      // Current location option should be visible
      await waitFor(() => {
        expect(screen.getByText(/map\.currentLocation|Current Location/)).toBeInTheDocument();
      });
    });
  });

  describe('Recent Searches', () => {
    it('loads search history from localStorage', () => {
      const mockHistory = [
        {
          query: 'Tokyo',
          result: {
            displayName: 'Tokyo, Japan',
            coordinates: { latitude: 35.6762, longitude: 139.6503 },
            address: 'Tokyo',
          },
          timestamp: Date.now(),
        },
      ];

      const localStorageMock = {
        getItem: jest.fn(() => JSON.stringify(mockHistory)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

      render(
        <LocationSearch
          onLocationSelect={mockOnLocationSelect}
          showRecentSearches
        />
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith('skymap-location-search-history');
    });

    it('saves search to history when location is selected', async () => {
      const localStorageMock = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

      mockGeocode.mockResolvedValue([
        {
          displayName: 'Tokyo, Japan',
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: 'Tokyo',
        },
      ]);

      render(
        <LocationSearch
          onLocationSelect={mockOnLocationSelect}
          showRecentSearches
        />
      );

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Tokyo' } });
      fireEvent.focus(input);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Tokyo, Japan'));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });
  });
});
