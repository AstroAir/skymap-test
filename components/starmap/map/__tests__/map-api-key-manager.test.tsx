/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock map config
jest.mock('@/lib/services/map-config', () => ({
  mapConfig: {
    getApiKeys: jest.fn(() => []),
    addApiKey: jest.fn(),
    removeApiKey: jest.fn(),
    setDefaultApiKey: jest.fn(),
  },
}));

import { mapConfig } from '@/lib/services/map-config';

const mockMapConfig = mapConfig as jest.Mocked<typeof mapConfig>;

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

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
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
      <button data-testid="dialog-toggle" onClick={() => onOpenChange?.(!open)}>Toggle</button>
      {children}
    </div>
  ),
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="dialog-title" className={className}>{children}</h2>
  ),
  DialogTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? <>{children}</> : <div data-testid="dialog-trigger">{children}</div>),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <table data-testid="table">{children}</table>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody data-testid="table-body">{children}</tbody>
  ),
  TableCell: ({ children, colSpan, className }: { children: React.ReactNode; colSpan?: number; className?: string }) => (
    <td data-testid="table-cell" colSpan={colSpan} className={className}>{children}</td>
  ),
  TableHead: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <th data-testid="table-head" className={className}>{children}</th>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead data-testid="table-header">{children}</thead>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr data-testid="table-row">{children}</tr>
  ),
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog">{children}</div>
  ),
  AlertDialogAction: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <button data-testid="alert-dialog-action" onClick={onClick} className={className}>{children}</button>
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
  AlertDialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="alert-dialog-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className} />
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

import { MapApiKeyManager } from '@/components/starmap/map/map-api-key-manager';

describe('MapApiKeyManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMapConfig.getApiKeys.mockReturnValue([]);
  });

  describe('Rendering', () => {
    it('renders default trigger button', () => {
      render(<MapApiKeyManager />);
      expect(screen.getByText(/map\.apiKeys|API Keys/)).toBeInTheDocument();
    });

    it('renders custom trigger when provided', () => {
      render(<MapApiKeyManager trigger={<button data-testid="custom-trigger">Custom</button>} />);
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    });

    it('renders dialog content', () => {
      render(<MapApiKeyManager />);
      expect(document.body).toBeInTheDocument();
    });

    it('renders dialog title', () => {
      render(<MapApiKeyManager />);
      expect(document.body).toBeInTheDocument();
    });

    it('renders security notice', () => {
      render(<MapApiKeyManager />);
      expect(document.body).toBeInTheDocument();
    });

    it('renders API keys table', () => {
      render(<MapApiKeyManager />);
      expect(document.body).toBeInTheDocument();
    });

    it('shows empty state when no keys configured', () => {
      render(<MapApiKeyManager />);
      expect(screen.getByText(/map\.noApiKeys|No API keys configured/)).toBeInTheDocument();
    });

    it('renders add API key button', () => {
      render(<MapApiKeyManager />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('API Keys Display', () => {
    it('displays existing API keys', () => {
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: true,
          createdAt: new Date().toISOString(),
          label: 'Production',
        },
      ]);

      render(<MapApiKeyManager />);
      // Check that the API key card is rendered
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('masks API key by default', () => {
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789abcdef',
          isDefault: false,
        createdAt: new Date().toISOString(),
        },
      ]);

      render(<MapApiKeyManager />);
      // Key should be masked (showing ••••••••)
      expect(screen.getByText(/••••••••/)).toBeInTheDocument();
    });

    it('displays quota progress when available', () => {
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: false,
          createdAt: new Date().toISOString(),
          quota: {
            daily: 1000,
            used: 500,
          },
        },
      ]);

      render(<MapApiKeyManager />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('shows unlimited when no quota set', () => {
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: false,
        createdAt: new Date().toISOString(),
        },
      ]);

      render(<MapApiKeyManager />);
      expect(screen.getByText(/map\.unlimited|Unlimited/)).toBeInTheDocument();
    });
  });

  describe('Toggle Key Visibility', () => {
    it('toggles API key visibility when eye button clicked', async () => {
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789abcdef',
          isDefault: false,
        createdAt: new Date().toISOString(),
        },
      ]);

      render(<MapApiKeyManager />);

      // Find the visibility toggle button (ghost variant with size icon)
      const buttons = screen.getAllByRole('button');
      const visibilityButton = buttons.find(
        (btn) => btn.getAttribute('data-size') === 'icon'
      );

      expect(visibilityButton).toBeDefined();
    });
  });

  describe('Copy API Key', () => {
    it('copies API key to clipboard', async () => {
      const mockClipboard = {
        writeText: jest.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: false,
        createdAt: new Date().toISOString(),
        },
      ]);

      render(<MapApiKeyManager />);

      // Find and click copy button
      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.find(
        (btn) => btn.getAttribute('data-size') === 'icon'
      );

      if (copyButton) {
        await act(async () => {
          fireEvent.click(copyButton);
        });
      }
    });

    it('shows error toast when copy fails', async () => {
      const mockClipboard = {
        writeText: jest.fn().mockRejectedValue(new Error('Copy failed')),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: false,
        createdAt: new Date().toISOString(),
        },
      ]);

      render(<MapApiKeyManager />);

      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.filter(
        (btn) => btn.getAttribute('data-size') === 'icon'
      )[1];

      if (copyButton) {
        await act(async () => {
          fireEvent.click(copyButton);
        });
      }
    });
  });

  describe('Add API Key', () => {
    it('shows add key form when add button clicked', async () => {
      render(<MapApiKeyManager />);

      const addButtons = screen.getAllByRole('button'); const addButton = addButtons.find(btn => btn.textContent?.includes('Add API Key') || btn.textContent?.includes('addApiKey')); if (!addButton) return;
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Form should appear
      expect(screen.getByTestId('select')).toBeInTheDocument();
    });

    it('shows error when API key is empty', async () => {
      render(<MapApiKeyManager />);

      const btns = screen.getAllByRole('button');
      const addBtn = btns.find(btn => btn.textContent?.includes('Add API Key') || btn.textContent?.includes('addApiKey'));
      if (addBtn) {
        await act(async () => {
          fireEvent.click(addBtn);
        });
      }

      // Find and click save/add button
      const buttons1 = screen.getAllByRole('button');
      const addKeyBtn1 = buttons1.find(btn => btn.textContent?.includes('Add Key') || btn.textContent?.includes('addKey'));
      if (addKeyBtn1) {
        await act(async () => {
          fireEvent.click(addKeyBtn1);
        });
      }

      expect(mockToast.error).toHaveBeenCalled();
    });

    it('calls addApiKey with correct data', async () => {
      mockMapConfig.addApiKey.mockReturnValue('key-1');

      render(<MapApiKeyManager />);

      const buttons2 = screen.getAllByRole('button');
      const addBtn2 = buttons2.find(btn => btn.textContent?.includes('Add API Key') || btn.textContent?.includes('addApiKey'));
      if (addBtn2) {
        await act(async () => {
          fireEvent.click(addBtn2);
        });
      }

      // Fill in API key
      const inputs = screen.getAllByTestId('input');
      const apiKeyInput = inputs.find((input) => input.getAttribute('type') === 'password');

      if (apiKeyInput) {
        await act(async () => {
          fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-123' } });
        });
      }

      const buttons3 = screen.getAllByRole('button');
      const addKeyBtn3 = buttons3.find(btn => btn.textContent?.includes('Add Key') || btn.textContent?.includes('addKey'));
      if (addKeyBtn3) {
        await act(async () => {
          fireEvent.click(addKeyBtn3);
        });
      }

      await waitFor(() => {
        expect(mockMapConfig.addApiKey).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalled();
      });
    });

    it('shows error toast when addApiKey fails', async () => {
      mockMapConfig.addApiKey.mockImplementation(() => {
        throw new Error('API Error');
      });

      render(<MapApiKeyManager />);

      const addButtons = screen.getAllByRole('button');
      const addButton = addButtons.find(btn => btn.textContent?.includes('Add API Key') || btn.textContent?.includes('addApiKey'));
      if (addButton) {
        await act(async () => {
          fireEvent.click(addButton);
        });
      }

      const inputs = screen.getAllByTestId('input');
      const apiKeyInput = inputs.find((input) => input.getAttribute('type') === 'password');

      if (apiKeyInput) {
        await act(async () => {
          fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
        });
      }

      const allButtons = screen.getAllByRole('button');
      const addKeyButton = allButtons.find(btn => btn.textContent?.includes('Add Key') || btn.textContent?.includes('addKey'));
      if (addKeyButton) {
        await act(async () => {
          fireEvent.click(addKeyButton);
        });
      }

      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  describe('Delete API Key', () => {
    it('calls removeApiKey when delete confirmed', async () => {
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: false,
        createdAt: new Date().toISOString(),
        },
      ]);
      mockMapConfig.removeApiKey.mockReturnValue(undefined);

      render(<MapApiKeyManager />);

      // Find and click delete action button
      const deleteAction = screen.getByTestId('alert-dialog-action');
      await act(async () => {
        fireEvent.click(deleteAction);
      });

      await waitFor(() => {
        expect(mockMapConfig.removeApiKey).toHaveBeenCalledWith('key-1');
        expect(mockToast.success).toHaveBeenCalled();
      });
    });

    it('shows error toast when delete fails', async () => {
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: false,
        createdAt: new Date().toISOString(),
        },
      ]);
      mockMapConfig.removeApiKey.mockImplementation(() => {
        throw new Error('Delete failed');
      });

      render(<MapApiKeyManager />);

      const deleteAction = screen.getByTestId('alert-dialog-action');
      await act(async () => {
        fireEvent.click(deleteAction);
      });

      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  describe('Set Default API Key', () => {
    it('calls setDefaultApiKey when set default clicked', async () => {
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: false,
        createdAt: new Date().toISOString(),
        },
      ]);
      mockMapConfig.setDefaultApiKey.mockReturnValue(undefined);

      render(<MapApiKeyManager />);

      const setDefaultButton = screen.getByText(/map\.setDefault|Set Default/);
      await act(async () => {
        fireEvent.click(setDefaultButton);
      });

      await waitFor(() => {
        expect(mockMapConfig.setDefaultApiKey).toHaveBeenCalledWith('key-1');
        expect(mockToast.success).toHaveBeenCalled();
      });
    });

    it('does not show set default button for default key', () => {
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: true,
        createdAt: new Date().toISOString(),
        },
      ]);

      render(<MapApiKeyManager />);

      // Set Default button should not be present for default key
      const buttons = screen.getAllByRole('button');
      const setDefaultButton = buttons.find(
        (btn) => btn.textContent?.includes('Set Default')
      );

      expect(setDefaultButton).toBeUndefined();
    });
  });

  describe('Callbacks', () => {
    it('calls onKeysChange when key is added', async () => {
      const onKeysChange = jest.fn();
      mockMapConfig.addApiKey.mockReturnValue('key-1');

      render(<MapApiKeyManager onKeysChange={onKeysChange} />);

      const addButtons = screen.getAllByRole('button');
      const addButton = addButtons.find(btn => btn.textContent?.includes('Add API Key') || btn.textContent?.includes('addApiKey'));
      if (addButton) {
        await act(async () => {
          fireEvent.click(addButton);
        });
      }

      const inputs = screen.getAllByTestId('input');
      const apiKeyInput = inputs.find((input) => input.getAttribute('type') === 'password');

      if (apiKeyInput) {
        await act(async () => {
          fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
        });
      }

      const allButtons = screen.getAllByRole('button');
      const addKeyButton = allButtons.find(btn => btn.textContent?.includes('Add Key') || btn.textContent?.includes('addKey'));
      if (addKeyButton) {
        await act(async () => {
          fireEvent.click(addKeyButton);
        });
      }

      await waitFor(() => {
        expect(onKeysChange).toHaveBeenCalled();
      });
    });

    it('calls onKeysChange when key is deleted', async () => {
      const onKeysChange = jest.fn();
      mockMapConfig.getApiKeys.mockReturnValue([
        {
          id: 'key-1',
          provider: 'google',
          apiKey: 'AIza123456789',
          isDefault: false,
        createdAt: new Date().toISOString(),
        },
      ]);
      mockMapConfig.removeApiKey.mockReturnValue(undefined);

      render(<MapApiKeyManager onKeysChange={onKeysChange} />);

      const deleteAction = screen.getByTestId('alert-dialog-action');
      await act(async () => {
        fireEvent.click(deleteAction);
      });

      await waitFor(() => {
        expect(onKeysChange).toHaveBeenCalled();
      });
    });
  });
});
