/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditSourceDialog } from '../edit-source-dialog';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
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
jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange }: { value: number[]; onValueChange: (v: number[]) => void }) => (
    <input type="range" value={value[0]} onChange={(e) => onValueChange([Number(e.target.value)])} data-testid="slider" />
  ),
}));
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('EditSourceDialog', () => {
  const mockSource = {
    id: 'src-1',
    name: 'SIMBAD',
    type: 'simbad' as const,
    description: 'SIMBAD database',
    enabled: true,
    priority: 5,
    builtIn: true,
    baseUrl: 'https://simbad.example.com',
    apiEndpoint: '/api/query',
    timeout: 10000,
    status: 'online' as const,
  };

  const defaultProps = {
    source: mockSource,
    type: 'data' as const,
    open: true,
    onOpenChange: jest.fn(),
    onSave: jest.fn(),
  };

  it('renders dialog when open', () => {
    render(<EditSourceDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<EditSourceDialog {...defaultProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('shows source name in title', () => {
    render(<EditSourceDialog {...defaultProps} />);
    expect(screen.getByText(/SIMBAD/)).toBeInTheDocument();
  });

  it('shows priority slider', () => {
    render(<EditSourceDialog {...defaultProps} />);
    expect(screen.getByTestId('slider')).toBeInTheDocument();
  });

  it('shows source info section', () => {
    render(<EditSourceDialog {...defaultProps} />);
    expect(screen.getByText('https://simbad.example.com')).toBeInTheDocument();
  });

  it('calls onSave when save button clicked', () => {
    render(<EditSourceDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('common.save'));
    expect(defaultProps.onSave).toHaveBeenCalledWith({ priority: 5, description: 'SIMBAD database' });
  });

  it('calls onOpenChange when cancel clicked', () => {
    render(<EditSourceDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('common.cancel'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not show description field for built-in sources', () => {
    render(<EditSourceDialog {...defaultProps} />);
    expect(screen.queryByLabelText('sourceConfig.sourceDescription')).not.toBeInTheDocument();
  });
});
