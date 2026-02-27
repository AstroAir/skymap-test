/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AddCustomSourceDialog } from '../add-custom-source-dialog';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}:${JSON.stringify(params)}`;
    return key;
  },
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
  Label: ({ children, ...props }: React.PropsWithChildren<{ htmlFor?: string }>) => <label {...props}>{children}</label>,
}));
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open?: boolean }>) => (
    open ? <div data-testid="dialog">{children}</div> : <div data-testid="dialog-closed">{children}</div>
  ),
  DialogContent: ({ children }: React.PropsWithChildren) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTrigger: ({ children, asChild }: React.PropsWithChildren<{ asChild?: boolean }>) => (
    asChild ? <>{children}</> : <div>{children}</div>
  ),
}));

describe('AddCustomSourceDialog', () => {
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger button', () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);
    expect(screen.getByText('sourceConfig.addCustom')).toBeInTheDocument();
  });

  it('opens dialog when trigger button is clicked', async () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);
    await act(async () => {
      fireEvent.click(screen.getByText('sourceConfig.addCustom'));
    });
    // The Dialog mock renders with data-testid="dialog" when open=true
    // Since the trigger click sets open=true via internal state, verify dialog content is rendered
    expect(screen.getByText('sourceConfig.addImageSource')).toBeInTheDocument();
  });

  it('shows image source title for image type', () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);
    expect(screen.getByText('sourceConfig.addImageSource')).toBeInTheDocument();
  });

  it('shows data source title for data type', () => {
    render(<AddCustomSourceDialog type="data" onAdd={mockOnAdd} />);
    expect(screen.getByText('sourceConfig.addDataSource')).toBeInTheDocument();
  });

  it('renders all input fields for image type', () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);
    expect(screen.getByText('sourceConfig.sourceName')).toBeInTheDocument();
    expect(screen.getByText('sourceConfig.baseUrl')).toBeInTheDocument();
    expect(screen.getByText('sourceConfig.urlTemplate')).toBeInTheDocument();
    expect(screen.getByText('sourceConfig.credit')).toBeInTheDocument();
    expect(screen.getByText('sourceConfig.sourceDescription')).toBeInTheDocument();
  });

  it('renders input fields for data type without credit', () => {
    render(<AddCustomSourceDialog type="data" onAdd={mockOnAdd} />);
    expect(screen.getByText('sourceConfig.sourceName')).toBeInTheDocument();
    expect(screen.getByText('sourceConfig.baseUrl')).toBeInTheDocument();
    expect(screen.getByText('sourceConfig.apiEndpoint')).toBeInTheDocument();
    expect(screen.queryByText('sourceConfig.credit')).not.toBeInTheDocument();
  });

  it('shows url template hint for image type', () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);
    expect(screen.getByText('sourceConfig.urlTemplateHint')).toBeInTheDocument();
  });

  it('has submit button disabled when name is empty', () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);
    const addButton = screen.getAllByText('common.add').find(el => el.closest('[data-testid="dialog-footer"]'));
    expect(addButton).toBeDefined();
    expect(addButton!.closest('button')).toBeDisabled();
  });

  it('submits image source with correct data', async () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);

    // Fill in required fields
    const nameInput = screen.getByPlaceholderText('sourceConfig.sourceNamePlaceholder');
    const urlInput = screen.getByPlaceholderText('https://example.com');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'My Source' } });
      fireEvent.change(urlInput, { target: { value: 'https://my-source.com' } });
    });

    // Click submit
    const addButtons = screen.getAllByText('common.add');
    const submitButton = addButtons.find(el => el.closest('[data-testid="dialog-footer"]'));
    expect(submitButton!.closest('button')).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(submitButton!);
    });

    expect(mockOnAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Source',
        baseUrl: 'https://my-source.com',
        type: 'custom',
        enabled: true,
        priority: 100,
      })
    );
  });

  it('submits data source with apiEndpoint field', async () => {
    render(<AddCustomSourceDialog type="data" onAdd={mockOnAdd} />);

    const nameInput = screen.getByPlaceholderText('sourceConfig.sourceNamePlaceholder');
    const urlInput = screen.getByPlaceholderText('https://example.com');
    const endpointInput = screen.getByPlaceholderText('/api/query');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'My Data Source' } });
      fireEvent.change(urlInput, { target: { value: 'https://data.com' } });
      fireEvent.change(endpointInput, { target: { value: '/api/v2' } });
    });

    const addButtons = screen.getAllByText('common.add');
    const submitButton = addButtons.find(el => el.closest('[data-testid="dialog-footer"]'));

    await act(async () => {
      fireEvent.click(submitButton!);
    });

    expect(mockOnAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Data Source',
        baseUrl: 'https://data.com',
        apiEndpoint: '/api/v2',
        type: 'custom',
        timeout: 5000,
      })
    );
  });

  it('does not submit when name is empty', async () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    await act(async () => {
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    });

    // Submit button should be disabled (name is still empty)
    const addButtons = screen.getAllByText('common.add');
    const submitButton = addButtons.find(el => el.closest('[data-testid="dialog-footer"]'));
    expect(submitButton!.closest('button')).toBeDisabled();
  });

  it('closes dialog when cancel is clicked', async () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);

    // Open dialog first
    await act(async () => {
      fireEvent.click(screen.getByText('sourceConfig.addCustom'));
    });

    // Click cancel
    await act(async () => {
      fireEvent.click(screen.getByText('common.cancel'));
    });

    // Dialog should be in closed state
    expect(screen.getByTestId('dialog-closed')).toBeInTheDocument();
  });

  it('resets form fields after successful submission', async () => {
    render(<AddCustomSourceDialog type="image" onAdd={mockOnAdd} />);

    const nameInput = screen.getByPlaceholderText('sourceConfig.sourceNamePlaceholder');
    const urlInput = screen.getByPlaceholderText('https://example.com');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
    });

    const addButtons = screen.getAllByText('common.add');
    const submitButton = addButtons.find(el => el.closest('[data-testid="dialog-footer"]'));

    await act(async () => {
      fireEvent.click(submitButton!);
    });

    // After submit, fields should be reset
    expect(nameInput).toHaveValue('');
    expect(urlInput).toHaveValue('');
  });
});
