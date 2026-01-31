/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock tauri module
jest.mock('@/lib/tauri', () => {
  const mockRefresh = jest.fn();
  return {
    useEquipment: jest.fn(() => ({
      equipment: {
        telescopes: [],
        cameras: [],
        barlow_reducers: [],
        eyepieces: [],
        filters: [],
      },
      loading: false,
      refresh: mockRefresh,
      isAvailable: true,
    })),
    tauriApi: {
      equipment: {
        addTelescope: jest.fn(),
        addCamera: jest.fn(),
        addBarlowReducer: jest.fn(),
        addEyepiece: jest.fn(),
        addFilter: jest.fn(),
        delete: jest.fn(),
        setDefault: jest.fn(),
      },
    },
  };
});

// Import mocked modules
import { useEquipment, tauriApi } from '@/lib/tauri';

const mockUseEquipment = useEquipment as jest.Mock;
const mockTauriApi = tauriApi as jest.Mocked<typeof tauriApi>;

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
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
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
      <button data-testid="dialog-open-btn" onClick={() => onOpenChange?.(true)}>
        Open
      </button>
      {children}
    </div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="dialog-description">{children}</p>
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

jest.mock('@/components/ui/input', () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    type,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      data-testid="input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => (
    <label data-testid="label">{children}</label>
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
    <div data-testid="select" data-value={value}>
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        data-testid="select-native"
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <div data-testid="tabs" data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ onValueChange?: (v: string) => void }>, { onValueChange });
        }
        return child;
      })}
    </div>
  ),
  TabsContent: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-testid={`tabs-content-${value}`}>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange?: (value: string) => void;
  }) => (
    <button data-testid={`tab-${value}`} onClick={() => onValueChange?.(value)}>
      {children}
    </button>
  ),
}));

import { EquipmentManager } from '../equipment-manager';

describe('EquipmentManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEquipment.mockReturnValue({
      equipment: {
        telescopes: [],
        cameras: [],
        barlow_reducers: [],
        eyepieces: [],
        filters: [],
      },
      loading: false,
      refresh: jest.fn(),
      isAvailable: true,
    });
  });

  describe('Rendering', () => {
    it('renders web fallback when not available (non-Tauri environment)', () => {
      mockUseEquipment.mockReturnValue({
        equipment: null,
        loading: false,
        refresh: jest.fn(),
        isAvailable: false,
      });

      const { container } = render(<EquipmentManager />);
      expect(container.firstChild).not.toBeNull();
      expect(screen.getAllByText(/equipment\.title/).length).toBeGreaterThanOrEqual(1);
    });

    it('renders default trigger button when available', () => {
      render(<EquipmentManager />);
      expect(screen.getAllByText(/equipment\.title/).length).toBeGreaterThanOrEqual(1);
    });

    it('renders custom trigger when provided', () => {
      render(<EquipmentManager trigger={<button data-testid="custom-trigger">Custom</button>} />);
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    });

    it('renders dialog content', () => {
      render(<EquipmentManager />);
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('renders dialog title', () => {
      render(<EquipmentManager />);
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    });

    it('renders dialog description', () => {
      render(<EquipmentManager />);
      expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      mockUseEquipment.mockReturnValue({
        equipment: null,
        loading: true,
        refresh: jest.fn(),
        isAvailable: true,
      });

      render(<EquipmentManager />);
      // Loading spinner should be present (Loader2 icon)
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('renders tabs for telescopes and cameras', () => {
      render(<EquipmentManager />);
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-telescopes')).toBeInTheDocument();
      expect(screen.getByTestId('tab-cameras')).toBeInTheDocument();
    });
  });

  describe('Telescopes Tab', () => {
    it('shows empty message when no telescopes', () => {
      render(<EquipmentManager />);
      expect(screen.getByText(/equipment\.noTelescopes/)).toBeInTheDocument();
    });

    it('shows add telescope button', () => {
      render(<EquipmentManager />);
      expect(screen.getByText(/equipment\.addTelescope/)).toBeInTheDocument();
    });

    it('shows telescope list when telescopes exist', () => {
      mockUseEquipment.mockReturnValue({
        equipment: {
          telescopes: [
            {
              id: '1',
              name: 'Newton 200/1000',
              aperture: 200,
              focal_length: 1000,
              focal_ratio: 5,
              telescope_type: 'reflector',
              is_default: true,
            },
          ],
          cameras: [],
          barlow_reducers: [],
          eyepieces: [],
          filters: [],
        },
        loading: false,
        refresh: jest.fn(),
        isAvailable: true,
      });

      render(<EquipmentManager />);
      expect(screen.getByText('Newton 200/1000')).toBeInTheDocument();
      expect(screen.getByText(/200mm f\/5\.0/)).toBeInTheDocument();
    });

    it('shows add telescope form when add button clicked', async () => {
      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addTelescope/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Form should appear with inputs
      expect(screen.getByPlaceholderText('e.g. Newton 200/1000')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('200')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('1000')).toBeInTheDocument();
    });

    it('shows cancel button in add form', async () => {
      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addTelescope/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      expect(screen.getByText(/common\.cancel/)).toBeInTheDocument();
    });

    it('hides form when cancel clicked', async () => {
      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addTelescope/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      const cancelButton = screen.getByText(/common\.cancel/);
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      // Form should be hidden, add button should be visible again
      expect(screen.getByText(/equipment\.addTelescope/)).toBeInTheDocument();
    });

    it('shows error when required fields are empty', async () => {
      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addTelescope/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      const saveButton = screen.getByText(/common\.save/);
      await act(async () => {
        fireEvent.click(saveButton);
      });

      expect(mockToast.error).toHaveBeenCalled();
    });

    it('calls addTelescope API with correct data', async () => {
      const mockRefresh = jest.fn();
      mockUseEquipment.mockReturnValue({
        equipment: { telescopes: [], cameras: [], barlow_reducers: [], eyepieces: [], filters: [] },
        loading: false,
        refresh: mockRefresh,
        isAvailable: true,
      });
      (mockTauriApi.equipment.addTelescope as jest.Mock).mockResolvedValue(undefined);

      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addTelescope/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Fill form
      const nameInput = screen.getByPlaceholderText('e.g. Newton 200/1000');
      const apertureInput = screen.getByPlaceholderText('200');
      const focalLengthInput = screen.getByPlaceholderText('1000');

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Scope' } });
        fireEvent.change(apertureInput, { target: { value: '150' } });
        fireEvent.change(focalLengthInput, { target: { value: '750' } });
      });

      const saveButton = screen.getByText(/common\.save/);
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockTauriApi.equipment.addTelescope).toHaveBeenCalledWith({
          name: 'Test Scope',
          aperture: 150,
          focal_length: 750,
          focal_ratio: 5,
          telescope_type: 'reflector',
          is_default: true,
        });
        expect(mockToast.success).toHaveBeenCalled();
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('shows error toast when addTelescope fails', async () => {
      (mockTauriApi.equipment.addTelescope as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addTelescope/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      const nameInput = screen.getByPlaceholderText('e.g. Newton 200/1000');
      const apertureInput = screen.getByPlaceholderText('200');
      const focalLengthInput = screen.getByPlaceholderText('1000');

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test' } });
        fireEvent.change(apertureInput, { target: { value: '100' } });
        fireEvent.change(focalLengthInput, { target: { value: '500' } });
      });

      const saveButton = screen.getByText(/common\.save/);
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('API Error');
      });
    });

    it('deletes telescope when delete button clicked', async () => {
      const mockRefresh = jest.fn();
      mockUseEquipment.mockReturnValue({
        equipment: {
          telescopes: [
            {
              id: 'scope-1',
              name: 'Test Scope',
              aperture: 200,
              focal_length: 1000,
              focal_ratio: 5,
              telescope_type: 'reflector',
              is_default: false,
            },
          ],
          cameras: [],
          barlow_reducers: [],
          eyepieces: [],
          filters: [],
        },
        loading: false,
        refresh: mockRefresh,
        isAvailable: true,
      });
      (mockTauriApi.equipment.delete as jest.Mock).mockResolvedValue(undefined);

      render(<EquipmentManager />);

      await act(async () => {
        fireEvent.click(screen.getByLabelText('equipment.delete'));
      });

      await waitFor(() => {
        expect(mockTauriApi.equipment.delete).toHaveBeenCalledWith('scope-1');
        expect(mockToast.success).toHaveBeenCalled();
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Cameras Tab', () => {
    it('shows empty message when no cameras', () => {
      render(<EquipmentManager />);
      expect(screen.getByText(/equipment\.noCameras/)).toBeInTheDocument();
    });

    it('shows add camera button', () => {
      render(<EquipmentManager />);
      expect(screen.getByText(/equipment\.addCamera/)).toBeInTheDocument();
    });

    it('shows camera list when cameras exist', () => {
      mockUseEquipment.mockReturnValue({
        equipment: {
          telescopes: [],
          cameras: [
            {
              id: '1',
              name: 'ASI294MC Pro',
              sensor_width: 23.2,
              sensor_height: 15.5,
              pixel_size: 4.63,
              resolution_x: 4144,
              resolution_y: 2822,
              camera_type: 'cmos',
              has_cooler: true,
              is_default: true,
            },
          ],
          barlow_reducers: [],
          eyepieces: [],
          filters: [],
        },
        loading: false,
        refresh: jest.fn(),
        isAvailable: true,
      });

      render(<EquipmentManager />);
      expect(screen.getByText('ASI294MC Pro')).toBeInTheDocument();
      expect(screen.getByText(/23\.2×15\.5mm/)).toBeInTheDocument();
    });

    it('shows add camera form when add button clicked', async () => {
      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addCamera/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      expect(screen.getByPlaceholderText('e.g. ASI294MC Pro')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('23.2')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('15.5')).toBeInTheDocument();
    });

    it('shows error when required camera fields are empty', async () => {
      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addCamera/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Find the save button in camera form (there might be multiple)
      const saveButtons = screen.getAllByText(/common\.save/);
      await act(async () => {
        fireEvent.click(saveButtons[saveButtons.length - 1]);
      });

      expect(mockToast.error).toHaveBeenCalled();
    });

    it('calls addCamera API with correct data', async () => {
      const mockRefresh = jest.fn();
      mockUseEquipment.mockReturnValue({
        equipment: { telescopes: [], cameras: [], barlow_reducers: [], eyepieces: [], filters: [] },
        loading: false,
        refresh: mockRefresh,
        isAvailable: true,
      });
      (mockTauriApi.equipment.addCamera as jest.Mock).mockResolvedValue(undefined);

      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addCamera/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      const nameInput = screen.getByPlaceholderText('e.g. ASI294MC Pro');
      const widthInput = screen.getByPlaceholderText('23.2');
      const heightInput = screen.getByPlaceholderText('15.5');

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test Camera' } });
        fireEvent.change(widthInput, { target: { value: '20' } });
        fireEvent.change(heightInput, { target: { value: '15' } });
      });

      const saveButtons = screen.getAllByText(/common\.save/);
      await act(async () => {
        fireEvent.click(saveButtons[saveButtons.length - 1]);
      });

      await waitFor(() => {
        expect(mockTauriApi.equipment.addCamera).toHaveBeenCalledWith({
          name: 'Test Camera',
          sensor_width: 20,
          sensor_height: 15,
          pixel_size: 0,
          resolution_x: 0,
          resolution_y: 0,
          camera_type: 'cmos',
          has_cooler: false,
          is_default: true,
        });
        expect(mockToast.success).toHaveBeenCalled();
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('shows error toast when addCamera fails', async () => {
      (mockTauriApi.equipment.addCamera as jest.Mock).mockRejectedValue(new Error('Camera API Error'));

      render(<EquipmentManager />);

      const addButton = screen.getByText(/equipment\.addCamera/);
      await act(async () => {
        fireEvent.click(addButton);
      });

      const nameInput = screen.getByPlaceholderText('e.g. ASI294MC Pro');
      const widthInput = screen.getByPlaceholderText('23.2');
      const heightInput = screen.getByPlaceholderText('15.5');

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test' } });
        fireEvent.change(widthInput, { target: { value: '10' } });
        fireEvent.change(heightInput, { target: { value: '10' } });
      });

      const saveButtons = screen.getAllByText(/common\.save/);
      await act(async () => {
        fireEvent.click(saveButtons[saveButtons.length - 1]);
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Camera API Error');
      });
    });

    it('deletes camera when delete button clicked', async () => {
      const mockRefresh = jest.fn();
      mockUseEquipment.mockReturnValue({
        equipment: {
          telescopes: [],
          cameras: [
            {
              id: 'cam-1',
              name: 'Test Camera',
              sensor_width: 23.5,
              sensor_height: 15.6,
              pixel_size: 3.76,
              resolution_x: 8288,
              resolution_y: 5644,
              camera_type: 'cmos',
              has_cooler: false,
              is_default: false,
            },
          ],
          barlow_reducers: [],
          eyepieces: [],
          filters: [],
        },
        loading: false,
        refresh: mockRefresh,
        isAvailable: true,
      });
      (mockTauriApi.equipment.delete as jest.Mock).mockResolvedValue(undefined);

      render(<EquipmentManager />);

      await act(async () => {
        fireEvent.click(screen.getByLabelText('equipment.delete'));
      });

      await waitFor(() => {
        expect(mockTauriApi.equipment.delete).toHaveBeenCalledWith('cam-1');
        expect(mockToast.success).toHaveBeenCalled();
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Error Handling', () => {
    it('shows error toast when delete fails', async () => {
      mockUseEquipment.mockReturnValue({
        equipment: {
          telescopes: [
            {
              id: 'scope-1',
              name: 'Test',
              aperture: 100,
              focal_length: 500,
              focal_ratio: 5,
              telescope_type: 'reflector',
              is_default: false,
            },
          ],
          cameras: [],
          barlow_reducers: [],
          eyepieces: [],
          filters: [],
        },
        loading: false,
        refresh: jest.fn(),
        isAvailable: true,
      });
      (mockTauriApi.equipment.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      render(<EquipmentManager />);

      await act(async () => {
        fireEvent.click(screen.getByLabelText('equipment.delete'));
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Delete failed');
      });
    });
  });

  describe('Default Equipment Indicator', () => {
    it('shows star icon for default telescope', () => {
      mockUseEquipment.mockReturnValue({
        equipment: {
          telescopes: [
            {
              id: '1',
              name: 'Default Scope',
              aperture: 200,
              focal_length: 1000,
              focal_ratio: 5,
              telescope_type: 'reflector',
              is_default: true,
            },
          ],
          cameras: [],
          barlow_reducers: [],
          eyepieces: [],
          filters: [],
        },
        loading: false,
        refresh: jest.fn(),
        isAvailable: true,
      });

      render(<EquipmentManager />);
      // Star icon should be present (rendered as SVG with lucide)
      expect(screen.getByText('Default Scope')).toBeInTheDocument();
    });

    it('shows star icon for default camera', () => {
      mockUseEquipment.mockReturnValue({
        equipment: {
          telescopes: [],
          cameras: [
            {
              id: '1',
              name: 'Default Camera',
              sensor_width: 20,
              sensor_height: 15,
              pixel_size: 4,
              resolution_x: 4000,
              resolution_y: 3000,
              camera_type: 'cmos',
              has_cooler: false,
              is_default: true,
            },
          ],
          barlow_reducers: [],
          eyepieces: [],
          filters: [],
        },
        loading: false,
        refresh: jest.fn(),
        isAvailable: true,
      });

      render(<EquipmentManager />);
      expect(screen.getByText('Default Camera')).toBeInTheDocument();
    });
  });
});
