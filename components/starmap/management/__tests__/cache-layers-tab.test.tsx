/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CacheLayersTab } from '../cache-layers-tab';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`;
    return key;
  },
}));

jest.mock('sonner', () => ({
  toast: {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
}));

const mockDownloadLayer = jest.fn();
const mockDownloadSelectedLayers = jest.fn();
const mockClearLayer = jest.fn();
const mockRefreshStatuses = jest.fn();

jest.mock('@/lib/offline', () => ({
  useOfflineStore: jest.fn(() => ({
    isOnline: true,
    layerStatuses: [],
    isDownloading: false,
    currentDownloads: {},
    refreshStatuses: mockRefreshStatuses,
    downloadLayer: mockDownloadLayer,
    downloadSelectedLayers: mockDownloadSelectedLayers,
    clearLayer: mockClearLayer,
  })),
  formatBytes: jest.fn((bytes: number) => `${bytes}B`),
  STELLARIUM_LAYERS: [
    { id: 'layer1', name: 'Stars', description: 'Star catalog', size: 1024 },
    { id: 'layer2', name: 'DSO', description: 'Deep sky objects', size: 2048 },
  ],
  offlineCacheManager: {
    verifyAndRepairLayer: jest.fn(),
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: (e: React.MouseEvent) => void; disabled?: boolean }>) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress" data-value={value} />,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('CacheLayersTab', () => {
  const onStorageChanged = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders layer list', () => {
    render(<CacheLayersTab onStorageChanged={onStorageChanged} />);
    expect(screen.getByText('Stars')).toBeInTheDocument();
    expect(screen.getByText('DSO')).toBeInTheDocument();
  });

  it('renders layer descriptions', () => {
    render(<CacheLayersTab onStorageChanged={onStorageChanged} />);
    expect(screen.getByText('Star catalog')).toBeInTheDocument();
    expect(screen.getByText('Deep sky objects')).toBeInTheDocument();
  });

  it('renders layer sizes', () => {
    render(<CacheLayersTab onStorageChanged={onStorageChanged} />);
    expect(screen.getByText('1024B')).toBeInTheDocument();
    expect(screen.getByText('2048B')).toBeInTheDocument();
  });
});
