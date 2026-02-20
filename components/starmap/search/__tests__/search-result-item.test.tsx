/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SearchResultItemRow } from '../search-result-item';

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: () => void }) => (
    <input type="checkbox" checked={checked} onChange={() => onCheckedChange?.()} />
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../search-utils', () => ({
  HighlightText: ({ text }: { text: string }) => <span>{text}</span>,
}));

jest.mock('../online-search-settings', () => ({
  SourceBadge: ({ source }: { source: string }) => <span data-testid="source-badge">{source}</span>,
}));

jest.mock('@/lib/translations', () => ({
  translateCelestialName: (value: string) => value,
}));

describe('SearchResultItemRow', () => {
  const baseProps = {
    itemId: 'dso-M31',
    checked: false,
    skyCultureLanguage: 'western',
    onSelect: jest.fn(),
    onToggleSelection: jest.fn(),
    onAddToTargetList: jest.fn(),
  };

  it('renders source badge for online results', () => {
    render(
      <SearchResultItemRow
        {...baseProps}
        item={{ Name: 'M31', Type: 'DSO', _onlineSource: 'simbad' }}
      />
    );

    expect(screen.getByTestId('source-badge')).toHaveTextContent('simbad');
  });

  it('does not render source badge for local-only results', () => {
    render(
      <SearchResultItemRow
        {...baseProps}
        item={{ Name: 'M31', Type: 'DSO' }}
      />
    );

    expect(screen.queryByTestId('source-badge')).toBeNull();
  });
});

