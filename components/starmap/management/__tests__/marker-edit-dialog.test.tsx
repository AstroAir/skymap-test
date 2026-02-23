/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkerEditDialog } from '../marker-edit-dialog';

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));
jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
}));
jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  PopoverTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  PopoverContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/toggle-group', () => ({
  ToggleGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ToggleGroupItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => <button data-value={value}>{children}</button>,
}));

jest.mock('@/lib/constants/marker-icons', () => ({
  MarkerIconDisplay: new Proxy({}, {
    get: () => ({ className }: { className?: string }) => <svg className={className} data-testid="marker-icon" />,
  }),
}));

jest.mock('@/lib/stores', () => ({
  MARKER_COLORS: ['#ff0000', '#00ff00', '#0000ff'],
  MARKER_ICONS: ['star', 'pin'],
}));

describe('MarkerEditDialog', () => {
  const defaultFormData = {
    name: 'Test Marker',
    description: 'A test marker',
    icon: 'star' as const,
    color: '#ff0000',
    group: '',
    raString: '12h 30m',
    decString: '+45° 00\'',
    ra: 0,
    dec: 0,
  };

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    formData: defaultFormData,
    onFormDataChange: jest.fn(),
    editingMarker: null,
    groups: ['Group A', 'Group B'],
    onSave: jest.fn(),
    t: (key: string) => key,
  };

  it('renders dialog when open', () => {
    render(<MarkerEditDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<MarkerEditDialog {...defaultProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('shows add title when no editing marker', () => {
    render(<MarkerEditDialog {...defaultProps} />);
    expect(screen.getByText('markers.addMarker')).toBeInTheDocument();
  });

  it('shows edit title when editing marker is present', () => {
    const marker = { id: '1', name: 'M', ra: 0, dec: 0, raString: '', decString: '', icon: 'star' as const, color: '#fff', visible: true, createdAt: Date.now(), updatedAt: Date.now() };
    render(<MarkerEditDialog {...defaultProps} editingMarker={marker} />);
    expect(screen.getByText('markers.editMarker')).toBeInTheDocument();
  });

  it('calls onSave when save button clicked', () => {
    render(<MarkerEditDialog {...defaultProps} />);
    const saveBtn = screen.getByText('common.save');
    fireEvent.click(saveBtn);
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it('disables save button when name is empty', () => {
    render(<MarkerEditDialog {...defaultProps} formData={{ ...defaultFormData, name: '' }} />);
    const saveBtn = screen.getByText('common.save');
    expect(saveBtn).toBeDisabled();
  });

  it('shows coordinates for new markers', () => {
    render(<MarkerEditDialog {...defaultProps} />);
    expect(screen.getByText(/12h 30m/)).toBeInTheDocument();
  });
});
