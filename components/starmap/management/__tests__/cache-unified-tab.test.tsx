/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CacheUnifiedTab } from '../cache-unified-tab';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`;
    return key;
  },
}));

jest.mock('sonner', () => ({
  toast: { loading: jest.fn(), success: jest.fn(), error: jest.fn(), dismiss: jest.fn() },
}));

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
}));

jest.mock('@/lib/offline', () => ({
  formatBytes: jest.fn((bytes: number) => `${bytes}B`),
}));

jest.mock('@/lib/tauri', () => ({
  unifiedCacheApi: {
    isAvailable: jest.fn(() => false),
    getStats: jest.fn(),
    listKeys: jest.fn(),
    clearCache: jest.fn(),
    cleanup: jest.fn(),
  },
}));

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));
jest.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
}));

describe('CacheUnifiedTab', () => {
  it('renders empty state when not in Tauri', () => {
    render(<CacheUnifiedTab isActive={true} />);
    expect(screen.getByText('cache.unifiedCacheEmpty')).toBeInTheDocument();
  });

  it('renders without crashing when inactive', () => {
    render(<CacheUnifiedTab isActive={false} />);
    expect(screen.getByText('cache.unifiedCacheEmpty')).toBeInTheDocument();
  });
});
