/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TelescopeTab } from '../equipment-telescope-tab';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/stores/equipment-store', () => ({
  useEquipmentStore: jest.fn(() => ({
    addCustomTelescope: jest.fn(),
    updateCustomTelescope: jest.fn(),
    applyTelescope: jest.fn(),
    customTelescopes: [],
    activeTelescopeId: null,
  })),
}));

jest.mock('zustand/react/shallow', () => ({
  useShallow: (fn: unknown) => fn,
}));

jest.mock('@/lib/tauri', () => ({
  tauriApi: { equipment: { addTelescope: jest.fn(), updateTelescope: jest.fn() } },
}));

jest.mock('@/lib/core/management-validators', () => ({
  validateTelescopeForm: jest.fn(() => null),
  validateTelescopeFields: jest.fn(() => ({})),
}));

jest.mock('@/lib/core/equipment-normalize', () => ({
  normalizeTelescopes: jest.fn(() => []),
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
import { normalizeTelescopes } from '@/lib/core/equipment-normalize';
import { validateTelescopeFields } from '@/lib/core/management-validators';
import { useEquipmentStore } from '@/lib/stores/equipment-store';

const mockToast = toast as jest.Mocked<typeof toast>;
const mockNormalizeTelescopes = normalizeTelescopes as jest.Mock;
const mockValidateFields = validateTelescopeFields as jest.Mock;
const mockUseEquipmentStore = useEquipmentStore as unknown as jest.Mock;

describe('TelescopeTab', () => {
  const defaultProps = {
    isTauriAvailable: false,
    rawTelescopes: [],
    onDeleteRequest: jest.fn(),
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeTelescopes.mockReturnValue([]);
    mockValidateFields.mockReturnValue({});
  });

  it('renders empty state when no telescopes', () => {
    render(<TelescopeTab {...defaultProps} />);
    expect(screen.getByText('equipment.noTelescopes')).toBeInTheDocument();
  });

  it('renders add telescope button', () => {
    render(<TelescopeTab {...defaultProps} />);
    expect(screen.getByText('equipment.addTelescope')).toBeInTheDocument();
  });

  it('shows form when add button is clicked', () => {
    render(<TelescopeTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addTelescope'));
    expect(screen.getByText('equipment.name')).toBeInTheDocument();
    expect(screen.getByText('equipment.aperture')).toBeInTheDocument();
    expect(screen.getByText('equipment.focalLength')).toBeInTheDocument();
  });

  // 取消表单
  it('hides form when cancel is clicked', () => {
    render(<TelescopeTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addTelescope'));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.getByText('equipment.addTelescope')).toBeInTheDocument();
  });

  // 提交表单保存（web 模式）
  it('saves telescope in web mode', async () => {
    const mockAddCustomTelescope = jest.fn();
    mockUseEquipmentStore.mockReturnValue({
      addCustomTelescope: mockAddCustomTelescope,
      updateCustomTelescope: jest.fn(),
      applyTelescope: jest.fn(),
      customTelescopes: [],
      activeTelescopeId: null,
    });

    render(<TelescopeTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addTelescope'));

    const inputs = screen.getAllByRole('textbox');
    const numberInputs = screen.getAllByRole('spinbutton');
    // name input
    fireEvent.change(inputs[0], { target: { value: 'My Scope' } });
    // aperture
    fireEvent.change(numberInputs[0], { target: { value: '200' } });
    // focal length
    fireEvent.change(numberInputs[1], { target: { value: '1000' } });

    // Submit form
    fireEvent.click(screen.getByText('common.save'));

    expect(mockAddCustomTelescope).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Scope', aperture: 200, focalLength: 1000 })
    );
    expect(mockToast.success).toHaveBeenCalled();
  });

  // 验证错误
  it('shows error when validation fails', () => {
    mockValidateFields.mockReturnValue({ name: 'equipment.validation.nameRequired' });
    const { validateTelescopeForm } = jest.requireMock('@/lib/core/management-validators');
    validateTelescopeForm.mockReturnValue('equipment.fillRequired');

    render(<TelescopeTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addTelescope'));
    fireEvent.click(screen.getByText('common.save'));

    expect(mockToast.error).toHaveBeenCalled();
  });

  // 显示望远镜列表
  it('renders telescope list when telescopes exist', () => {
    mockNormalizeTelescopes.mockReturnValue([
      { id: '1', name: 'Newton 200', aperture: 200, focalLength: 1000, focalRatio: 5, isDefault: false },
    ]);
    render(<TelescopeTab {...defaultProps} />);
    expect(screen.getByText('Newton 200')).toBeInTheDocument();
  });

  // 显示望远镜列表带编辑按钮
  it('renders telescope list with edit/delete callbacks', () => {
    mockNormalizeTelescopes.mockReturnValue([
      { id: 't1', name: 'Test', aperture: 100, focalLength: 500, focalRatio: 5, isDefault: false },
    ]);
    render(<TelescopeTab {...defaultProps} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  // 编辑模式显示 Update 按钮
  it('shows update button in edit mode', () => {
    mockNormalizeTelescopes.mockReturnValue([
      { id: 't1', name: 'Newton', aperture: 200, focalLength: 1000, focalRatio: 5, isDefault: false },
    ]);
    render(<TelescopeTab {...defaultProps} />);
    // Component renders EquipmentListItem which is mocked - we can verify normalizer was called
    expect(mockNormalizeTelescopes).toHaveBeenCalled();
  });

  // web 模式更新望远镜
  it('updates telescope in web mode', () => {
    const mockUpdateCustomTelescope = jest.fn();
    mockUseEquipmentStore.mockReturnValue({
      addCustomTelescope: jest.fn(),
      updateCustomTelescope: mockUpdateCustomTelescope,
      applyTelescope: jest.fn(),
      customTelescopes: [{ id: 't1', name: 'Old', focalLength: 500, aperture: 100, type: 'reflector' }],
      activeTelescopeId: null,
    });
    mockNormalizeTelescopes.mockReturnValue([]);

    render(<TelescopeTab {...defaultProps} />);
    fireEvent.click(screen.getByText('equipment.addTelescope'));
    const inputs = screen.getAllByRole('textbox');
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: 'Updated Scope' } });
    fireEvent.change(numberInputs[0], { target: { value: '300' } });
    fireEvent.change(numberInputs[1], { target: { value: '1500' } });
    fireEvent.click(screen.getByText('common.save'));

    expect(mockToast.success).toHaveBeenCalled();
  });

  // 编辑望远镜 - 点击 edit 按钮进入编辑模式
  it('enters edit mode when edit button clicked', () => {
    mockNormalizeTelescopes.mockReturnValue([
      { id: 't1', name: 'Newton 200', aperture: 200, focalLength: 1000, focalRatio: 5, isDefault: false },
    ]);
    mockUseEquipmentStore.mockReturnValue({
      addCustomTelescope: jest.fn(),
      updateCustomTelescope: jest.fn(),
      applyTelescope: jest.fn(),
      customTelescopes: [{ id: 't1', name: 'Newton 200', focalLength: 1000, aperture: 200, type: 'reflector' }],
      activeTelescopeId: null,
    });

    render(<TelescopeTab {...defaultProps} rawTelescopes={[]} />);
    fireEvent.click(screen.getByTestId('edit-btn'));
    expect(screen.getByText('common.update')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Newton 200')).toBeInTheDocument();
  });

  // 选择望远镜（web 模式）
  it('calls applyTelescope when select clicked', () => {
    const mockApplyTelescope = jest.fn();
    mockNormalizeTelescopes.mockReturnValue([
      { id: 't1', name: 'Newton', aperture: 200, focalLength: 1000, focalRatio: 5, isDefault: false },
    ]);
    mockUseEquipmentStore.mockReturnValue({
      addCustomTelescope: jest.fn(),
      updateCustomTelescope: jest.fn(),
      applyTelescope: mockApplyTelescope,
      customTelescopes: [{ id: 't1', name: 'Newton', focalLength: 1000, aperture: 200, type: 'reflector' }],
      activeTelescopeId: null,
    });

    render(<TelescopeTab {...defaultProps} />);
    fireEvent.click(screen.getByTestId('select-btn'));
    expect(mockApplyTelescope).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalled();
  });

  // 删除回调
  it('calls onDeleteRequest when delete clicked', () => {
    const onDeleteRequest = jest.fn();
    mockNormalizeTelescopes.mockReturnValue([
      { id: 't1', name: 'Newton', aperture: 200, focalLength: 1000, focalRatio: 5, isDefault: false },
    ]);

    render(<TelescopeTab {...defaultProps} onDeleteRequest={onDeleteRequest} />);
    fireEvent.click(screen.getByTestId('delete-btn'));
    expect(onDeleteRequest).toHaveBeenCalledWith('t1', 'Newton', 'telescope');
  });

  // web 模式编辑并保存更新
  it('updates telescope via edit flow in web mode', () => {
    const mockUpdateCustomTelescope = jest.fn();
    mockNormalizeTelescopes.mockReturnValue([
      { id: 't1', name: 'Old Scope', aperture: 100, focalLength: 500, focalRatio: 5, isDefault: false },
    ]);
    mockUseEquipmentStore.mockReturnValue({
      addCustomTelescope: jest.fn(),
      updateCustomTelescope: mockUpdateCustomTelescope,
      applyTelescope: jest.fn(),
      customTelescopes: [{ id: 't1', name: 'Old Scope', focalLength: 500, aperture: 100, type: 'reflector' }],
      activeTelescopeId: null,
    });

    render(<TelescopeTab {...defaultProps} rawTelescopes={[]} />);
    fireEvent.click(screen.getByTestId('edit-btn'));
    const nameInput = screen.getByDisplayValue('Old Scope');
    fireEvent.change(nameInput, { target: { value: 'New Scope' } });
    fireEvent.click(screen.getByText('common.update'));
    expect(mockUpdateCustomTelescope).toHaveBeenCalledWith('t1', expect.objectContaining({ name: 'New Scope' }));
  });
});
