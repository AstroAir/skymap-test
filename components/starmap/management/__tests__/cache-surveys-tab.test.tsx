/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CacheSurveysTab } from '../cache-surveys-tab';

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
  useOfflineStore: jest.fn(() => ({ isOnline: true })),
  formatBytes: jest.fn((bytes: number) => `${bytes}B`),
  offlineCacheManager: {
    getHiPSCacheStatus: jest.fn().mockResolvedValue({ cached: false, cachedTiles: 0, totalTiles: 100, cachedBytes: 0 }),
    downloadHiPSSurvey: jest.fn().mockResolvedValue(true),
    clearHiPSCache: jest.fn().mockResolvedValue(true),
    clearAllHiPSCaches: jest.fn().mockResolvedValue(true),
  },
  convertToHiPSSurvey: jest.fn((s: { id: string }) => s),
}));

jest.mock('@/lib/core/constants', () => ({
  SKY_SURVEYS: [
    { id: 'survey1', name: 'DSS2', description: 'Digitized Sky Survey 2', url: 'https://example.com/dss2' },
  ],
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));
jest.mock('@/components/ui/progress', () => ({ Progress: () => <div data-testid="progress" /> }));
jest.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
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

describe('CacheSurveysTab', () => {
  it('renders survey list', () => {
    render(<CacheSurveysTab isActive={true} />);
    expect(screen.getByText('DSS2')).toBeInTheDocument();
    expect(screen.getByText('Digitized Sky Survey 2')).toBeInTheDocument();
  });

  it('renders cached count summary', () => {
    render(<CacheSurveysTab isActive={true} />);
    expect(screen.getByText(/survey\.surveysCached/)).toBeInTheDocument();
  });

  it('renders without crashing when inactive', () => {
    render(<CacheSurveysTab isActive={false} />);
    expect(screen.getByText('DSS2')).toBeInTheDocument();
  });
});
