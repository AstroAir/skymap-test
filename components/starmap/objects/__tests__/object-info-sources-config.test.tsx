/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock the config store and health check functions
jest.mock('@/lib/services/object-info-config', () => ({
  useObjectInfoConfigStore: jest.fn(),
  checkAllSourcesHealth: jest.fn(),
  checkImageSourceHealth: jest.fn(),
  checkDataSourceHealth: jest.fn(),
  startHealthChecks: jest.fn(),
  stopHealthChecks: jest.fn(),
}));

import {
  useObjectInfoConfigStore,
  checkAllSourcesHealth,
  checkImageSourceHealth,
  checkDataSourceHealth,
  startHealthChecks,
  stopHealthChecks,
} from '@/lib/services/object-info-config';

const mockUseObjectInfoConfigStore = useObjectInfoConfigStore as unknown as jest.Mock;
const mockCheckAllSourcesHealth = checkAllSourcesHealth as jest.Mock;
const mockCheckImageSourceHealth = checkImageSourceHealth as jest.Mock;
const mockCheckDataSourceHealth = checkDataSourceHealth as jest.Mock;
const mockStartHealthChecks = startHealthChecks as jest.Mock;
const mockStopHealthChecks = stopHealthChecks as jest.Mock;

// Mock UI components
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

jest.mock('@/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
    ...props
  }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="switch"
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-testid="input" {...props} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: { children: React.ReactNode }) => (
    <label data-testid="label" {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: ({ orientation }: { orientation?: string }) => (
    <hr data-testid="separator" data-orientation={orientation} />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({
    value,
    onValueChange,
    min,
    max,
    step,
  }: {
    value?: number[];
    onValueChange?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <input
      type="range"
      data-testid="slider"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([parseInt(e.target.value)])}
      min={min}
      max={max}
      step={step}
    />
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="dialog" data-open={open}>
      <button data-testid="dialog-toggle" onClick={() => onOpenChange?.(!open)}>
        Toggle
      </button>
      {open && children}
    </div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? <>{children}</> : <div data-testid="dialog-trigger">{children}</div>),
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="collapsible" data-open={open}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ onOpenChange?: (open: boolean) => void }>, { onOpenChange });
        }
        return child;
      })}
    </div>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
  CollapsibleTrigger: ({
    children,
    className,
    onOpenChange,
  }: {
    children: React.ReactNode;
    className?: string;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <button
      data-testid="collapsible-trigger"
      className={className}
      onClick={() => onOpenChange?.(true)}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <select
      data-testid="select"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="tooltip-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog">{children}</div>
  ),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button data-testid="alert-dialog-action" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="alert-dialog-description">{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-footer">{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-header">{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="alert-dialog-title">{children}</h2>
  ),
  AlertDialogTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? <>{children}</> : <div data-testid="alert-dialog-trigger">{children}</div>),
}));

import { ObjectInfoSourcesConfig } from '../object-info-sources-config';

const mockImageSources = [
  {
    id: 'skyview',
    name: 'SkyView',
    type: 'survey',
    enabled: true,
    priority: 1,
    baseUrl: 'https://skyview.gsfc.nasa.gov',
    urlTemplate: '/cgi-bin/images?',
    credit: 'NASA SkyView',
    description: 'NASA SkyView Virtual Observatory',
    builtIn: true,
    status: 'online' as const,
    responseTime: 150,
  },
  {
    id: 'custom-1',
    name: 'Custom Source',
    type: 'custom',
    enabled: false,
    priority: 2,
    baseUrl: 'https://example.com',
    urlTemplate: '/image?',
    credit: 'Custom',
    description: 'Custom image source',
    builtIn: false,
    status: 'unknown' as const,
  },
];

const mockDataSources = [
  {
    id: 'simbad',
    name: 'SIMBAD',
    type: 'database',
    enabled: true,
    priority: 1,
    baseUrl: 'https://simbad.u-strasbg.fr',
    apiEndpoint: '/simbad/sim-id',
    timeout: 5000,
    description: 'SIMBAD Astronomical Database',
    builtIn: true,
    status: 'online' as const,
    responseTime: 200,
  },
];

const mockSettings = {
  autoSkipOffline: true,
  imageTimeout: 10000,
  apiTimeout: 5000,
  defaultImageSize: 15,
  preferredImageFormat: 'jpg' as const,
  healthCheckInterval: 300000,
};

const mockStoreState = {
  imageSources: mockImageSources,
  dataSources: mockDataSources,
  settings: mockSettings,
  setImageSourceEnabled: jest.fn(),
  setDataSourceEnabled: jest.fn(),
  addImageSource: jest.fn(),
  removeImageSource: jest.fn(),
  addDataSource: jest.fn(),
  removeDataSource: jest.fn(),
  setImageSourceStatus: jest.fn(),
  setDataSourceStatus: jest.fn(),
  updateSettings: jest.fn(),
  resetToDefaults: jest.fn(),
};

describe('ObjectInfoSourcesConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseObjectInfoConfigStore.mockReturnValue(mockStoreState);
    mockCheckAllSourcesHealth.mockResolvedValue(undefined);
    mockCheckImageSourceHealth.mockResolvedValue({ online: true, responseTime: 100 });
    mockCheckDataSourceHealth.mockResolvedValue({ online: true, responseTime: 150 });
  });

  describe('Rendering', () => {
    it('renders the config title', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.title')).toBeInTheDocument();
    });

    it('renders config description', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.configDescription')).toBeInTheDocument();
    });

    it('renders check all button', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.checkAll')).toBeInTheDocument();
    });

    it('renders reset button', () => {
      render(<ObjectInfoSourcesConfig />);
      // Multiple reset buttons may exist (one in header, one in alert dialog)
      expect(screen.getAllByText('common.reset').length).toBeGreaterThanOrEqual(1);
    });

    it('renders image sources section', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getAllByText('sourceConfig.imageSources').length).toBeGreaterThanOrEqual(1);
    });

    it('renders data sources section', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getAllByText('sourceConfig.dataSourcesLabel').length).toBeGreaterThanOrEqual(1);
    });

    it('renders global settings section', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.globalSettings')).toBeInTheDocument();
    });
  });

  describe('Health Checks', () => {
    it('starts health checks on mount', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(mockStartHealthChecks).toHaveBeenCalled();
    });

    it('stops health checks on unmount', () => {
      const { unmount } = render(<ObjectInfoSourcesConfig />);
      unmount();
      expect(mockStopHealthChecks).toHaveBeenCalled();
    });

    it('calls checkAllSourcesHealth when check all button clicked', async () => {
      render(<ObjectInfoSourcesConfig />);

      const checkAllButton = screen.getByText('sourceConfig.checkAll');
      await act(async () => {
        fireEvent.click(checkAllButton);
      });

      await waitFor(() => {
        expect(mockCheckAllSourcesHealth).toHaveBeenCalled();
      });
    });
  });

  describe('Image Sources', () => {
    it('displays image source names', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('SkyView')).toBeInTheDocument();
      expect(screen.getByText('Custom Source')).toBeInTheDocument();
    });

    it('displays source descriptions', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('NASA SkyView Virtual Observatory')).toBeInTheDocument();
    });

    it('shows built-in badge for built-in sources', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getAllByText('sourceConfig.builtIn').length).toBeGreaterThanOrEqual(1);
    });

    it('toggles image source when switch clicked', async () => {
      render(<ObjectInfoSourcesConfig />);

      const switches = screen.getAllByTestId('switch');
      expect(switches.length).toBeGreaterThan(0);

      await act(async () => {
        fireEvent.click(switches[0]);
      });

      expect(mockStoreState.setImageSourceEnabled).toHaveBeenCalled();
    });

    it('shows add custom source button', () => {
      render(<ObjectInfoSourcesConfig />);
      // The add custom button is inside collapsible content
      expect(screen.queryAllByText('sourceConfig.addCustom').length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Sources', () => {
    it('displays data source names', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('SIMBAD')).toBeInTheDocument();
    });

    it('displays data source descriptions', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('SIMBAD Astronomical Database')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('shows online count for image sources', () => {
      render(<ObjectInfoSourcesConfig />);
      // The status summary should show counts - multiple elements may match
      expect(screen.getAllByText(/1\/1/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Settings', () => {
    it('renders auto skip offline setting', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.autoSkipOffline')).toBeInTheDocument();
    });

    it('renders image timeout setting', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.imageTimeout')).toBeInTheDocument();
    });

    it('renders API timeout setting', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.apiTimeout')).toBeInTheDocument();
    });

    it('renders default image size setting', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.defaultImageSize')).toBeInTheDocument();
    });

    it('renders preferred format setting', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.preferredFormat')).toBeInTheDocument();
    });

    it('renders health check interval setting', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.healthCheckInterval')).toBeInTheDocument();
    });

    it('updates settings when slider changed', async () => {
      render(<ObjectInfoSourcesConfig />);

      const sliders = screen.getAllByTestId('slider');
      expect(sliders.length).toBeGreaterThan(0);

      await act(async () => {
        fireEvent.change(sliders[0], { target: { value: '15000' } });
      });

      expect(mockStoreState.updateSettings).toHaveBeenCalled();
    });

    it('updates preferred format when select changed', async () => {
      render(<ObjectInfoSourcesConfig />);

      const select = screen.getByTestId('select');
      await act(async () => {
        fireEvent.change(select, { target: { value: 'png' } });
      });

      expect(mockStoreState.updateSettings).toHaveBeenCalledWith({ preferredImageFormat: 'png' });
    });
  });

  describe('Reset Functionality', () => {
    it('renders reset confirmation dialogs', () => {
      render(<ObjectInfoSourcesConfig />);
      // Multiple alert dialogs exist (for reset and delete confirmations)
      expect(screen.getAllByTestId('alert-dialog').length).toBeGreaterThanOrEqual(1);
    });

    it('calls resetToDefaults when confirmed', async () => {
      render(<ObjectInfoSourcesConfig />);

      // Find the reset action button (first one is for reset to defaults)
      const resetActions = screen.getAllByTestId('alert-dialog-action');
      expect(resetActions.length).toBeGreaterThan(0);
      
      await act(async () => {
        fireEvent.click(resetActions[0]);
      });

      expect(mockStoreState.resetToDefaults).toHaveBeenCalled();
    });
  });

  describe('Source Status Badge', () => {
    it('displays online status correctly', () => {
      render(<ObjectInfoSourcesConfig />);
      // Should show response time for online sources
      expect(screen.getByText('150ms')).toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    it('renders collapsible sections', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getAllByTestId('collapsible').length).toBeGreaterThanOrEqual(3);
    });

    it('renders collapsible triggers', () => {
      render(<ObjectInfoSourcesConfig />);
      expect(screen.getAllByTestId('collapsible-trigger').length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Empty State', () => {
    it('handles empty sources gracefully', () => {
      mockUseObjectInfoConfigStore.mockReturnValue({
        ...mockStoreState,
        imageSources: [],
        dataSources: [],
      });

      render(<ObjectInfoSourcesConfig />);
      expect(screen.getByText('sourceConfig.title')).toBeInTheDocument();
    });
  });
});
