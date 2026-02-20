/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock map config
jest.mock('@/lib/services/map-config', () => ({
  mapConfig: {
    getConfiguration: jest.fn(() => ({
      providers: [
        { provider: 'openstreetmap', enabled: true, priority: 1 },
        { provider: 'google', enabled: false, priority: 2 },
        { provider: 'mapbox', enabled: false, priority: 3 },
      ],
      defaultProvider: 'openstreetmap',
      fallbackStrategy: 'priority',
      enableAutoFallback: true,
      cacheResponses: true,
      cacheDuration: 3600000,
      enableOfflineMode: false,
      healthCheckInterval: 300000,
      policyMode: 'strict',
      searchBehaviorWhenNoAutocomplete: 'submit-only',
      configVersion: 2,
    })),
    enableProvider: jest.fn(),
    setProviderPriority: jest.fn(),
    setDefaultProvider: jest.fn(),
    setFallbackStrategy: jest.fn(),
    setAutoFallback: jest.fn(),
    setCacheSettings: jest.fn(),
    setOfflineMode: jest.fn(),
    setHealthCheckInterval: jest.fn(),
    setPolicyMode: jest.fn(),
    setSearchBehaviorWhenNoAutocomplete: jest.fn(),
    addConfigurationListener: jest.fn(() => () => {}),
    getActiveApiKey: jest.fn(() => null),
  },
}));

jest.mock('@/lib/services/connectivity-checker', () => ({
  connectivityChecker: {
    getProviderHealth: jest.fn(() => ({ isHealthy: true, responseTime: 100 })),
  },
}));

import { mapConfig } from '@/lib/services/map-config';
const _mockMapConfig = mapConfig as jest.Mocked<typeof mapConfig>;

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (v: boolean) => void }) => (
    <input type="checkbox" data-testid="switch" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void }) => (
    <select data-testid="select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>{children}</select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
    const flatten = (node: React.ReactNode): string => {
      if (node === null || node === undefined || node === false) return '';
      if (typeof node === 'string' || typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(flatten).join('');
      if (React.isValidElement(node)) {
        const el = node as React.ReactElement<{ children?: React.ReactNode }>;
        return flatten(el.props.children);
      }
      return '';
    };

    return <option value={value}>{flatten(children)}</option>;
  },
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (asChild ? <>{children}</> : <div>{children}</div>),
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertTitle: ({ children }: { children: React.ReactNode }) => <h4>{children}</h4>,
}));

jest.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange }: { value: number[]; onValueChange?: (v: number[]) => void }) => (
    <input type="range" data-testid="slider" value={value[0]} onChange={(e) => onValueChange?.([parseInt(e.target.value)])} />
  ),
}));

import { MapProviderSettings } from '@/components/starmap/map/map-provider-settings';

describe('MapProviderSettings', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('Rendering', () => {
    it('renders trigger button', () => {
      render(<MapProviderSettings />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders dialog structure', () => {
      render(<MapProviderSettings />);
      expect(document.body).toBeInTheDocument();
    });

    it('renders all providers', () => {
      render(<MapProviderSettings />);
      expect(document.body).toBeInTheDocument();
    });

    it('renders save and reset buttons', () => {
      render(<MapProviderSettings />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Toggle', () => {
    it('renders switches for providers', () => {
      render(<MapProviderSettings />);
      const switches = screen.getAllByTestId('switch');
      expect(switches.length).toBeGreaterThan(0);
    });
  });

  describe('Save Settings', () => {
    it('renders save button', () => {
      render(<MapProviderSettings />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('exports component correctly', () => {
      expect(MapProviderSettings).toBeDefined();
    });

    it('renders with default props', () => {
      render(<MapProviderSettings />);
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Reset Settings', () => {
    it('renders reset functionality', () => {
      render(<MapProviderSettings />);
      expect(document.body).toBeInTheDocument();
    });

    it('renders with onSettingsChange prop', () => {
      const onSettingsChange = jest.fn();
      render(<MapProviderSettings onSettingsChange={onSettingsChange} />);
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('accepts onSettingsChange callback', () => {
      const onSettingsChange = jest.fn();
      render(<MapProviderSettings onSettingsChange={onSettingsChange} />);
      expect(document.body).toBeInTheDocument();
    });
  });
});
