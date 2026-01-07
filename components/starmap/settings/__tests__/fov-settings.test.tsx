/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockUseEquipmentStore = jest.fn((selector) => {
  const state = {
    fovDisplay: {
      enabled: true,
      gridType: 'crosshair',
      showCoordinateGrid: true,
      showDSOLabels: true,
      overlayOpacity: 80,
      frameColor: '#ef4444',
    },
    mosaic: {
      enabled: false,
      rows: 2,
      cols: 2,
      overlap: 20,
      overlapUnit: 'percent',
    },
    setFOVDisplay: jest.fn(),
    setFOVEnabled: jest.fn(),
    setGridType: jest.fn(),
    setMosaic: jest.fn(),
    setMosaicEnabled: jest.fn(),
    setMosaicGrid: jest.fn(),
    setMosaicOverlap: jest.fn(),
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useEquipmentStore: (selector: (state: unknown) => unknown) => mockUseEquipmentStore(selector),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode; variant?: string }) => (
    <button onClick={onClick} data-testid="button" data-variant={variant}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} data-testid="input" />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label data-testid="label">{children}</label>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, id }: { checked?: boolean; id?: string }) => (
    <input type="checkbox" checked={checked} data-testid={`switch-${id || 'default'}`} readOnly />
  ),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value }: { value?: number[] }) => (
    <input type="range" value={value?.[0] || 0} data-testid="slider" readOnly />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <option>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <span>Select...</span>,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined)[]) => args.filter(Boolean).join(' '),
}));

import { FOVSettings } from '../fov-settings';

describe('FOVSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders FOV settings component', () => {
    render(<FOVSettings />);
    expect(screen.getAllByTestId('label').length).toBeGreaterThan(0);
  });

  it('renders FOV overlay toggle', () => {
    render(<FOVSettings />);
    expect(screen.getByTestId('switch-fov-enabled')).toBeInTheDocument();
  });

  it('renders grid type buttons', () => {
    render(<FOVSettings />);
    expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
  });

  it('renders mosaic settings section', () => {
    render(<FOVSettings />);
    expect(screen.getAllByTestId('separator').length).toBeGreaterThan(0);
  });

  it('renders overlay opacity slider', () => {
    render(<FOVSettings />);
    expect(screen.getAllByTestId('slider').length).toBeGreaterThan(0);
  });

  it('renders frame color buttons', () => {
    render(<FOVSettings />);
    // Multiple buttons for color selection
    expect(screen.getAllByTestId('button').length).toBeGreaterThan(5);
  });

  it('renders display options switches', () => {
    render(<FOVSettings />);
    // Should have switches for coordinate grid and DSO labels
    const switches = screen.getAllByRole('checkbox');
    expect(switches.length).toBeGreaterThanOrEqual(3);
  });
});

describe('FOVSettings boundary conditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles mosaic enabled state', () => {
    mockUseEquipmentStore.mockImplementation((selector) => {
      const state = {
        fovDisplay: {
          enabled: true,
          gridType: 'thirds',
          showCoordinateGrid: true,
          showDSOLabels: true,
          overlayOpacity: 100,
          frameColor: '#ffffff',
        },
        mosaic: {
          enabled: true,
          rows: 3,
          cols: 4,
          overlap: 30,
          overlapUnit: 'percent',
        },
        setFOVDisplay: jest.fn(),
        setFOVEnabled: jest.fn(),
        setGridType: jest.fn(),
        setMosaic: jest.fn(),
        setMosaicEnabled: jest.fn(),
        setMosaicGrid: jest.fn(),
        setMosaicOverlap: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<FOVSettings />);
    // Should render mosaic controls when enabled
    expect(screen.getAllByTestId('input').length).toBeGreaterThan(0);
  });

  it('handles maximum mosaic grid size', () => {
    mockUseEquipmentStore.mockImplementation((selector) => {
      const state = {
        fovDisplay: {
          enabled: true,
          gridType: 'crosshair',
          showCoordinateGrid: true,
          showDSOLabels: true,
          overlayOpacity: 80,
          frameColor: '#ef4444',
        },
        mosaic: {
          enabled: true,
          rows: 10,
          cols: 10,
          overlap: 50,
          overlapUnit: 'percent',
        },
        setFOVDisplay: jest.fn(),
        setFOVEnabled: jest.fn(),
        setGridType: jest.fn(),
        setMosaic: jest.fn(),
        setMosaicEnabled: jest.fn(),
        setMosaicGrid: jest.fn(),
        setMosaicOverlap: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<FOVSettings />);
    expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
  });

  it('handles pixel overlap unit', () => {
    mockUseEquipmentStore.mockImplementation((selector) => {
      const state = {
        fovDisplay: {
          enabled: true,
          gridType: 'none',
          showCoordinateGrid: false,
          showDSOLabels: false,
          overlayOpacity: 50,
          frameColor: '#3b82f6',
        },
        mosaic: {
          enabled: true,
          rows: 2,
          cols: 2,
          overlap: 200,
          overlapUnit: 'pixels',
        },
        setFOVDisplay: jest.fn(),
        setFOVEnabled: jest.fn(),
        setGridType: jest.fn(),
        setMosaic: jest.fn(),
        setMosaicEnabled: jest.fn(),
        setMosaicGrid: jest.fn(),
        setMosaicOverlap: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<FOVSettings />);
    expect(screen.getByTestId('select')).toBeInTheDocument();
  });

  it('handles minimum opacity', () => {
    mockUseEquipmentStore.mockImplementation((selector) => {
      const state = {
        fovDisplay: {
          enabled: true,
          gridType: 'golden',
          showCoordinateGrid: true,
          showDSOLabels: true,
          overlayOpacity: 10,
          frameColor: '#22c55e',
        },
        mosaic: {
          enabled: false,
          rows: 2,
          cols: 2,
          overlap: 20,
          overlapUnit: 'percent',
        },
        setFOVDisplay: jest.fn(),
        setFOVEnabled: jest.fn(),
        setGridType: jest.fn(),
        setMosaic: jest.fn(),
        setMosaicEnabled: jest.fn(),
        setMosaicGrid: jest.fn(),
        setMosaicOverlap: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<FOVSettings />);
    expect(screen.getAllByTestId('slider').length).toBeGreaterThan(0);
  });

  it('handles all grid types', () => {
    const gridTypes = ['none', 'crosshair', 'thirds', 'golden', 'diagonal'];
    
    gridTypes.forEach(gridType => {
      mockUseEquipmentStore.mockImplementation((selector) => {
        const state = {
          fovDisplay: {
            enabled: true,
            gridType,
            showCoordinateGrid: true,
            showDSOLabels: true,
            overlayOpacity: 80,
            frameColor: '#ef4444',
          },
          mosaic: {
            enabled: false,
            rows: 2,
            cols: 2,
            overlap: 20,
            overlapUnit: 'percent',
          },
          setFOVDisplay: jest.fn(),
          setFOVEnabled: jest.fn(),
          setGridType: jest.fn(),
          setMosaic: jest.fn(),
          setMosaicEnabled: jest.fn(),
          setMosaicGrid: jest.fn(),
          setMosaicOverlap: jest.fn(),
        };
        return selector ? selector(state) : state;
      });

      const { unmount } = render(<FOVSettings />);
      expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
      unmount();
    });
  });
});
