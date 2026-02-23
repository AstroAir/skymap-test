/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: React.PropsWithChildren) => <button {...props}>{children}</button> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => <div className={className}>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/starmap/search/stellarium-search', () => ({
  StellariumSearch: () => <div data-testid="stellarium-search" />,
}));
jest.mock('@/components/starmap/search/favorites-quick-access', () => ({ FavoritesQuickAccess: () => null }));
jest.mock('@/components/starmap/search/online-search-settings', () => ({ OnlineSearchSettings: () => null }));

import { SearchPanel } from '../search-panel';

describe('SearchPanel', () => {
  it('renders without crashing', () => {
    render(<SearchPanel isOpen={true} onClose={jest.fn()} onSelect={jest.fn()} />);
  });
});
