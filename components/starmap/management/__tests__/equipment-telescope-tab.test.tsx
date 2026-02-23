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

describe('TelescopeTab', () => {
  const defaultProps = {
    isTauriAvailable: false,
    rawTelescopes: [],
    onDeleteRequest: jest.fn(),
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
});
