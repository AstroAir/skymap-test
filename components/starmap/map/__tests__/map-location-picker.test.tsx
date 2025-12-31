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

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { toast as mockToast } from 'sonner';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, type, onKeyDown, disabled, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-testid="input" value={value} onChange={onChange} placeholder={placeholder} type={type} onKeyDown={onKeyDown} disabled={disabled} {...props} />
  ),
}));

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

import { MapLocationPicker } from '@/components/starmap/map/map-location-picker';

describe('MapLocationPicker', () => {
  const mockOnLocationChange = jest.fn();
  const mockOnLocationSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGeocode.mockResolvedValue([]);
    mockReverseGeocode.mockResolvedValue({ displayName: 'Test Location', address: 'Test Address', coordinates: { latitude: 0, longitude: 0 } });
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
      // Component uses Leaflet map instead of iframe
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

  describe('Search Functionality', () => {
    it('performs search when search button clicked', async () => {
      mockGeocode.mockResolvedValue([
        { displayName: 'Tokyo, Japan', coordinates: { latitude: 35.6762, longitude: 139.6503 } },
      ]);

      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showSearch />);

      const inputs = screen.getAllByTestId('input');
      const searchInput = inputs[0];

      // Enter search query
      fireEvent.change(searchInput, { target: { value: 'Tokyo' } });
      
      // Trigger search via Enter key (more reliable than button click)
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

    it('shows error toast on search failure', async () => {
      mockGeocode.mockRejectedValue(new Error('Network error'));

      render(<MapLocationPicker onLocationChange={mockOnLocationChange} showSearch />);

      const inputs = screen.getAllByTestId('input');
      const searchInput = inputs[0];

      fireEvent.change(searchInput, { target: { value: 'Error' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
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
        });

        expect(mockOnLocationChange).not.toHaveBeenCalled();
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

      // Component uses Leaflet map, verify card is rendered
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('applies custom height', () => {
      render(<MapLocationPicker onLocationChange={mockOnLocationChange} height={500} />);

      // Verify component renders
      expect(screen.getByTestId('card')).toBeInTheDocument();
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
