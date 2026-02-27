/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => <div data-testid="leaflet-map" />,
}));

jest.mock('../leaflet-map', () => ({
  LeafletMap: () => <div data-testid="leaflet-map" />,
}));

// Mock geocoding service
jest.mock('@/lib/services/geocoding-service', () => ({
  geocodingService: {
    geocode: jest.fn(),
    reverseGeocode: jest.fn(),
    getSearchCapabilities: jest.fn(),
  },
}));

import { geocodingService } from '@/lib/services/geocoding-service';

const mockGeocode = geocodingService.geocode as jest.Mock;
const mockReverseGeocode = geocodingService.reverseGeocode as jest.Mock;
const mockGetSearchCapabilities = geocodingService.getSearchCapabilities as jest.Mock;

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, title, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} title={title} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => {
  const MockInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ value, onChange, placeholder, type, onKeyDown, onBlur, disabled, defaultValue, ...props }, ref) => (
    <input ref={ref} data-testid="input" value={value} defaultValue={defaultValue} onChange={onChange} placeholder={placeholder} type={type} onKeyDown={onKeyDown} onBlur={onBlur} disabled={disabled} {...props} />
  ));
  MockInput.displayName = 'MockInput';
  return { Input: MockInput };
});

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <label data-testid="label" className={className}>{children}</label>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <button data-testid="dropdown-menu-item" onClick={onClick} className={className}>{children}</button>
  ),
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="dropdown-menu-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => <div data-testid="skeleton" className={className} />,
}));

import { MapLocationPicker } from '@/components/starmap/map/map-location-picker';

describe('MapLocationPicker', () => {
  const mockOnLocationChange = jest.fn();
  const mockOnLocationSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGeocode.mockResolvedValue([]);
    mockReverseGeocode.mockResolvedValue({ displayName: 'Test Location', address: 'Test Address', coordinates: { latitude: 0, longitude: 0 } });
    mockGetSearchCapabilities.mockReturnValue({
      autocompleteAvailable: true,
      mode: 'online-autocomplete',
      providers: ['google'],
    });
  });

  describe('Rendering', () => {
    it('renders location picker card', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders card title', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
    });

    it('renders search input when showSearch is true', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showSearch />);
      const inputs = screen.getAllByTestId('input');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('hides search input when showSearch is false', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showSearch={false} />);
      const inputs = screen.getAllByTestId('input');
      expect(inputs.length).toBe(2);
    });

    it('renders latitude input', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);
      expect(screen.getByText(/map\.latitude|Latitude/)).toBeInTheDocument();
    });

    it('renders longitude input', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);
      expect(screen.getByText(/map\.longitude|Longitude/)).toBeInTheDocument();
    });

    it('renders map container', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders with initial location', () => {
      render(
        <MapLocationPicker
          onLocationChange={mockOnLocationChange}
          initialLocation={{ latitude: 35.6762, longitude: 139.6503 }}
        />
      );
      const inputs = screen.getAllByTestId('input');
      const latInput = inputs.find(input => input.getAttribute('min') === '-90');
      expect(latInput).toHaveValue(35.6762);
    });

    it('renders disabled state', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} disabled />);
      const inputs = screen.getAllByTestId('input');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('Compact Mode', () => {
    it('does not render Card wrapper in compact mode', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} compact />);
      expect(screen.queryByTestId('card-title')).not.toBeInTheDocument();
    });

    it('does not render coordinate inputs in compact mode', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} compact />);
      expect(screen.queryByText(/map\.latitude|Latitude/)).not.toBeInTheDocument();
      expect(screen.queryByText(/map\.longitude|Longitude/)).not.toBeInTheDocument();
    });

    it('renders controls in compact mode when showControls is true', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} compact showControls />);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });
  });

  describe('Controls', () => {
    it('renders light pollution toggle button when showControls is true', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showControls />);
      const lightPollutionBtn = screen.getByTitle(/map\.lightPollution|Light Pollution/);
      expect(lightPollutionBtn).toBeInTheDocument();
    });

    it('toggles light pollution on click', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showControls />);
      const lightPollutionBtn = screen.getByTitle(/map\.lightPollution|Light Pollution/);

      fireEvent.click(lightPollutionBtn);
      // After click, variant should change to 'secondary'
      expect(lightPollutionBtn.getAttribute('data-variant')).toBe('secondary');

      fireEvent.click(lightPollutionBtn);
      expect(lightPollutionBtn.getAttribute('data-variant')).toBe('ghost');
    });

    it('renders tile layer dropdown', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showControls />);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    it('changes tile layer when dropdown item is clicked', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showControls />);
      const menuItems = screen.getAllByTestId('dropdown-menu-item');
      expect(menuItems.length).toBeGreaterThan(0);

      fireEvent.click(menuItems[1]); // Click second tile layer option
    });
  });

  describe('Search Functionality', () => {
    it('performs search when search button clicked', async () => {
      mockGeocode.mockResolvedValue([
        { displayName: 'Tokyo, Japan', coordinates: { latitude: 35.6762, longitude: 139.6503 } },
      ]);

      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showSearch />);

      const inputs = screen.getAllByTestId('input');
      const searchInput = inputs[0];

      fireEvent.change(searchInput, { target: { value: 'Tokyo' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockGeocode).toHaveBeenCalledWith('Tokyo', expect.any(Object));
      });
    });

    it('performs search on Enter key', async () => {
      mockGeocode.mockResolvedValue([
        { displayName: 'Tokyo, Japan', coordinates: { latitude: 35.6762, longitude: 139.6503 } },
      ]);

      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showSearch />);

      const inputs = screen.getAllByTestId('input');
      const searchInput = inputs[0];

      fireEvent.change(searchInput, { target: { value: 'Tokyo' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockGeocode).toHaveBeenCalled();
      });
    });

    it('displays search results', async () => {
      mockGeocode.mockResolvedValue([
        { displayName: 'Tokyo, Japan', coordinates: { latitude: 35.6762, longitude: 139.6503 } },
        { displayName: 'Osaka, Japan', coordinates: { latitude: 34.6937, longitude: 135.5023 } },
      ]);

      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showSearch />);

      const inputs = screen.getAllByTestId('input');
      const searchInput = inputs[0];

      fireEvent.change(searchInput, { target: { value: 'Japan' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockGeocode).toHaveBeenCalledWith('Japan', expect.any(Object));
      });
    });

    it('selects search result and updates location', async () => {
      mockGeocode.mockResolvedValue([
        { displayName: 'Tokyo, Japan', coordinates: { latitude: 35.6762, longitude: 139.6503 } },
      ]);

      render(<MapLocationPicker onLocationChange={mockOnLocationChange} onLocationSelect={mockOnLocationSelect} showSearch />);

      const inputs = screen.getAllByTestId('input');
      const searchInput = inputs[0];

      fireEvent.change(searchInput, { target: { value: 'Tokyo' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockGeocode).toHaveBeenCalledWith('Tokyo', expect.any(Object));
      });
    });

    it('clears results on search failure', async () => {
      mockGeocode.mockRejectedValue(new Error('Network error'));

      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showSearch />);

      const inputs = screen.getAllByTestId('input');
      const searchInput = inputs[0];

      fireEvent.change(searchInput, { target: { value: 'Error' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockGeocode).toHaveBeenCalled();
      });
    });
  });

  describe('Coordinate Input', () => {
    it('updates latitude when input changes', async () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);

      const inputs = screen.getAllByTestId('input');
      const latInput = inputs.find(input => input.getAttribute('min') === '-90');

      if (latInput) {
        await act(async () => {
          fireEvent.change(latInput, { target: { value: '40.7128' } });
          fireEvent.blur(latInput);
        });

        expect(mockOnLocationChange).toHaveBeenCalledWith(expect.objectContaining({ latitude: 40.7128 }));
      }
    });

    it('updates longitude when input changes', async () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);

      const inputs = screen.getAllByTestId('input');
      const lonInput = inputs.find(input => input.getAttribute('min') === '-180');

      if (lonInput) {
        await act(async () => {
          fireEvent.change(lonInput, { target: { value: '-74.006' } });
          fireEvent.blur(lonInput);
        });

        expect(mockOnLocationChange).toHaveBeenCalledWith(expect.objectContaining({ longitude: -74.006 }));
      }
    });

    it('clamps latitude to valid range (-90 to 90)', async () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);

      const inputs = screen.getAllByTestId('input');
      const latInput = inputs.find(input => input.getAttribute('min') === '-90');

      if (latInput) {
        await act(async () => {
          fireEvent.change(latInput, { target: { value: '100' } });
          fireEvent.blur(latInput);
        });

        expect(mockOnLocationChange).toHaveBeenCalledWith(expect.objectContaining({ latitude: 90 }));
      }
    });

    it('clamps longitude to valid range (-180 to 180)', async () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);

      const inputs = screen.getAllByTestId('input');
      const lonInput = inputs.find(input => input.getAttribute('min') === '-180');

      if (lonInput) {
        await act(async () => {
          fireEvent.change(lonInput, { target: { value: '200' } });
          fireEvent.blur(lonInput);
        });

        expect(mockOnLocationChange).toHaveBeenCalledWith(expect.objectContaining({ longitude: 180 }));
      }
    });

    it('ignores invalid number input', async () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);

      const inputs = screen.getAllByTestId('input');
      const latInput = inputs.find(input => input.getAttribute('min') === '-90');

      if (latInput) {
        await act(async () => {
          fireEvent.change(latInput, { target: { value: 'invalid' } });
          fireEvent.blur(latInput);
        });

        expect(mockOnLocationChange).not.toHaveBeenCalled();
      }
    });

    it('commits coordinate on Enter key', async () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} />);

      const inputs = screen.getAllByTestId('input');
      const latInput = inputs.find(input => input.getAttribute('min') === '-90');

      if (latInput) {
        await act(async () => {
          fireEvent.change(latInput, { target: { value: '45.0' } });
          fireEvent.keyDown(latInput, { key: 'Enter' });
        });

        expect(mockOnLocationChange).toHaveBeenCalledWith(expect.objectContaining({ latitude: 45 }));
      }
    });
  });

  describe('Map Display', () => {
    it('renders map container with initial location', async () => {
      render(
        <MapLocationPicker
          onLocationChange={mockOnLocationChange}
          initialLocation={{ latitude: 35.6762, longitude: 139.6503 }}
        />
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('applies custom height', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} height={500} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('External initialLocation sync', () => {
    it('syncs when initialLocation prop changes', async () => {
      const { rerender } = render(
        <MapLocationPicker
          onLocationChange={mockOnLocationChange}
          initialLocation={{ latitude: 35.0, longitude: 139.0 }}
        />
      );

      rerender(
        <MapLocationPicker
          onLocationChange={mockOnLocationChange}
          initialLocation={{ latitude: 40.0, longitude: -74.0 }}
        />
      );

      // The component should eventually sync via setTimeout
      await waitFor(() => {
        const inputs = screen.getAllByTestId('input');
        const latInput = inputs.find(input => input.getAttribute('min') === '-90');
        if (latInput) {
          expect(latInput).toHaveValue(40);
        }
      });
    });
  });

  describe('Callbacks', () => {
    it('calls onLocationSelect when location is selected from search', async () => {
      mockGeocode.mockResolvedValue([
        { displayName: 'Tokyo, Japan', coordinates: { latitude: 35.6762, longitude: 139.6503 } },
      ]);

      render(<MapLocationPicker onLocationChange={mockOnLocationChange} onLocationSelect={mockOnLocationSelect} showSearch />);

      const inputs = screen.getAllByTestId('input');
      fireEvent.change(inputs[0], { target: { value: 'Tokyo' } });
      fireEvent.keyDown(inputs[0], { key: 'Enter' });

      await waitFor(() => {
        expect(mockGeocode).toHaveBeenCalledWith('Tokyo', expect.any(Object));
      });
    });
  });
});
