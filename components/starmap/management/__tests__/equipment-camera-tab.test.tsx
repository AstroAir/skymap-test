/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraTab } from '../equipment-camera-tab';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockAddCustomCamera = jest.fn();
const mockUpdateCustomCamera = jest.fn();
const mockApplyCamera = jest.fn();

jest.mock('@/lib/stores/equipment-store', () => ({
  useEquipmentStore: jest.fn(() => ({
    addCustomCamera: mockAddCustomCamera,
    updateCustomCamera: mockUpdateCustomCamera,
    applyCamera: mockApplyCamera,
    customCameras: [],
    activeCameraId: null,
  })),
}));

jest.mock('zustand/react/shallow', () => ({
  useShallow: (fn: unknown) => fn,
}));

jest.mock('@/lib/tauri', () => ({
  tauriApi: { equipment: { addCamera: jest.fn(), updateCamera: jest.fn() } },
}));

jest.mock('@/lib/core/management-validators', () => ({
  validateCameraForm: jest.fn(() => null),
  validateCameraFields: jest.fn(() => ({})),
}));

jest.mock('@/lib/core/equipment-normalize', () => ({
  normalizeCameras: jest.fn(() => []),
}));

jest.mock('../equipment-list-item', () => ({
  EquipmentListItem: ({ name, onEdit, onDelete, onSelect }: { name: string; onEdit?: () => void; onDelete?: () => void; onSelect?: () => void }) => (
    <div data-testid="equipment-item">
      <span>{name}</span>
      {onEdit && <button data-testid="edit-btn" onClick={onEdit}>Edit</button>}
      {onDelete && <button data-testid="delete-btn" onClick={onDelete}>Delete</button>}
      {onSelect && <button data-testid="select-btn" onClick={onSelect}>Select</button>}
    </div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));
jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: () => <div />,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

import { toast } from 'sonner';
import { normalizeCameras } from '@/lib/core/equipment-normalize';
import { validateCameraFields } from '@/lib/core/management-validators';
import { useEquipmentStore } from '@/lib/stores/equipment-store';

const mockToast = toast as jest.Mocked<typeof toast>;
const mockNormalizeCameras = normalizeCameras as jest.Mock;
const mockValidateFields = validateCameraFields as jest.Mock;
const mockUseEquipmentStore = useEquipmentStore as unknown as jest.Mock;

describe('CameraTab', () => {
  const defaultProps = {
    isTauriAvailable: false,
    rawCameras: [],
    onDeleteRequest: jest.fn(),
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeCameras.mockReturnValue([]);
    mockValidateFields.mockReturnValue({});
  });

  it('renders empty state when no cameras', () => {
    render(<CameraTab {...defaultProps} />);
    expect(screen.getByText('equipment.noCameras')).toBeInTheDocument();
  });

  it('renders add camera button', () => {
    render(<CameraTab {...defaultProps} />);
    expect(screen.getByText('equipment.addCamera')).toBeInTheDocument();
  });

  it('shows form when add button is clicked', () => {
    render(<CameraTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addCamera'));
    expect(screen.getByText('equipment.name')).toBeInTheDocument();
    expect(screen.getByText('equipment.sensorWidth')).toBeInTheDocument();
  });

  it('shows cancel button in form', () => {
    render(<CameraTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addCamera'));
    expect(screen.getByText('common.cancel')).toBeInTheDocument();
  });

  // 取消表单
  it('hides form when cancel is clicked', () => {
    render(<CameraTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addCamera'));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.getByText('equipment.addCamera')).toBeInTheDocument();
  });

  // 提交表单保存（web 模式）
  it('saves camera in web mode', () => {
    const mockAddCustomCamera = jest.fn();
    mockUseEquipmentStore.mockReturnValue({
      addCustomCamera: mockAddCustomCamera,
      updateCustomCamera: jest.fn(),
      applyCamera: jest.fn(),
      customCameras: [],
      activeCameraId: null,
    });

    render(<CameraTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addCamera'));

    const inputs = screen.getAllByRole('textbox');
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: 'My Camera' } });
    fireEvent.change(numberInputs[0], { target: { value: '23.2' } });
    fireEvent.change(numberInputs[1], { target: { value: '15.5' } });

    fireEvent.click(screen.getByText('common.save'));

    expect(mockAddCustomCamera).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Camera', sensorWidth: 23.2, sensorHeight: 15.5 })
    );
    expect(mockToast.success).toHaveBeenCalled();
  });

  // 验证错误
  it('shows error when validation fails', () => {
    mockValidateFields.mockReturnValue({ name: 'equipment.validation.nameRequired' });
    const { validateCameraForm } = jest.requireMock('@/lib/core/management-validators');
    validateCameraForm.mockReturnValue('equipment.fillRequired');

    render(<CameraTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addCamera'));
    fireEvent.click(screen.getByText('common.save'));

    expect(mockToast.error).toHaveBeenCalled();
  });

  // 显示相机列表
  it('renders camera list when cameras exist', () => {
    mockNormalizeCameras.mockReturnValue([
      { id: '1', name: 'ASI294MC', sensorWidth: 23.2, sensorHeight: 15.5, isDefault: false },
    ]);
    render(<CameraTab {...defaultProps} />);
    expect(screen.getByText('ASI294MC')).toBeInTheDocument();
  });

  // 编辑相机 - 点击 edit 按钮进入编辑模式
  it('enters edit mode when edit button clicked', () => {
    mockNormalizeCameras.mockReturnValue([
      { id: 'c1', name: 'ASI294MC', sensorWidth: 23.2, sensorHeight: 15.5, isDefault: false },
    ]);
    mockUseEquipmentStore.mockReturnValue({
      addCustomCamera: jest.fn(),
      updateCustomCamera: jest.fn(),
      applyCamera: jest.fn(),
      customCameras: [{ id: 'c1', name: 'ASI294MC', sensorWidth: 23.2, sensorHeight: 15.5, pixelSize: 4.63 }],
      activeCameraId: null,
    });

    render(<CameraTab {...defaultProps} rawCameras={[]} />);
    fireEvent.click(screen.getByTestId('edit-btn'));
    // 编辑模式下显示 Update 按钮
    expect(screen.getByText('common.update')).toBeInTheDocument();
  });

  // 选择相机（web 模式）
  it('calls applyCamera when select clicked in web mode', () => {
    const mockApplyCamera = jest.fn();
    mockNormalizeCameras.mockReturnValue([
      { id: 'c1', name: 'ASI294MC', sensorWidth: 23.2, sensorHeight: 15.5, isDefault: false },
    ]);
    mockUseEquipmentStore.mockReturnValue({
      addCustomCamera: jest.fn(),
      updateCustomCamera: jest.fn(),
      applyCamera: mockApplyCamera,
      customCameras: [{ id: 'c1', name: 'ASI294MC', sensorWidth: 23.2, sensorHeight: 15.5, pixelSize: 4.63 }],
      activeCameraId: null,
    });

    render(<CameraTab {...defaultProps} />);
    fireEvent.click(screen.getByTestId('select-btn'));
    expect(mockApplyCamera).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalled();
  });

  // 删除回调
  it('calls onDeleteRequest when delete clicked', () => {
    const onDeleteRequest = jest.fn();
    mockNormalizeCameras.mockReturnValue([
      { id: 'c1', name: 'ASI294MC', sensorWidth: 23.2, sensorHeight: 15.5, isDefault: false },
    ]);

    render(<CameraTab {...defaultProps} onDeleteRequest={onDeleteRequest} />);
    fireEvent.click(screen.getByTestId('delete-btn'));
    expect(onDeleteRequest).toHaveBeenCalledWith('c1', 'ASI294MC', 'camera');
  });

  // web 模式更新相机
  it('updates camera in web mode', () => {
    const mockUpdateCustomCamera = jest.fn();
    mockNormalizeCameras.mockReturnValue([
      { id: 'c1', name: 'Old Camera', sensorWidth: 20, sensorHeight: 15, isDefault: false },
    ]);
    mockUseEquipmentStore.mockReturnValue({
      addCustomCamera: jest.fn(),
      updateCustomCamera: mockUpdateCustomCamera,
      applyCamera: jest.fn(),
      customCameras: [{ id: 'c1', name: 'Old Camera', sensorWidth: 20, sensorHeight: 15, pixelSize: 3.76 }],
      activeCameraId: null,
    });

    render(<CameraTab {...defaultProps} rawCameras={[]} />);
    // Click edit to enter edit mode
    fireEvent.click(screen.getByTestId('edit-btn'));
    // Change name
    const nameInput = screen.getByDisplayValue('Old Camera');
    fireEvent.change(nameInput, { target: { value: 'Updated Camera' } });
    // Submit
    fireEvent.click(screen.getByText('common.update'));
    expect(mockUpdateCustomCamera).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Updated Camera' }));
    expect(mockToast.success).toHaveBeenCalled();
  });
});
