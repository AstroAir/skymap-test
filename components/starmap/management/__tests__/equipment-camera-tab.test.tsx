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
  EquipmentListItem: ({ name }: { name: string }) => <div data-testid="equipment-item">{name}</div>,
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

describe('CameraTab', () => {
  const defaultProps = {
    isTauriAvailable: false,
    rawCameras: [],
    onDeleteRequest: jest.fn(),
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
});
