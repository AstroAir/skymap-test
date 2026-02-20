/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GroupedResultsList } from '../grouped-results-list';
import type { SearchResultItem } from '@/lib/core/types';

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../search-utils', () => ({
  getTypeIcon: () => <span data-testid="group-icon" />,
}));

jest.mock('../search-result-item', () => ({
  SearchResultItemRow: ({ item }: { item: { Name: string } }) => <div>{item.Name}</div>,
}));

describe('GroupedResultsList', () => {
  it('renders source group labels in uppercase', () => {
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['simbad', [{ Name: 'M31', Type: 'DSO' } as SearchResultItem]],
    ]);

    render(
      <GroupedResultsList
        groupedResults={groupedResults}
        isSelected={() => false}
        skyCultureLanguage="western"
        onSelect={() => {}}
        onAddToTargetList={() => {}}
      />
    );

    expect(screen.getByText('SIMBAD')).toBeInTheDocument();
  });
});
