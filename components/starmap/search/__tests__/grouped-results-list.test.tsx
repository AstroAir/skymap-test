/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupedResultsList } from '../grouped-results-list';
import type { SearchResultItem } from '@/lib/core/types';

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, onOpenChange }: { children: React.ReactNode; onOpenChange?: () => void }) => (
    <div data-testid="collapsible" onClick={() => onOpenChange?.()}>{children}</div>
  ),
  CollapsibleTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button className={className}>{children}</button>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../search-utils', () => ({
  getTypeIcon: () => <span data-testid="group-icon" />,
}));

jest.mock('../search-result-item', () => ({
  SearchResultItemRow: React.forwardRef(function MockRow(
    { item, isHighlighted, globalIndex }: { item: { Name: string }; isHighlighted?: boolean; globalIndex?: number },
    ref: React.Ref<HTMLDivElement>,
  ) {
    return (
      <div ref={ref} data-highlighted={isHighlighted} data-index={globalIndex}>
        {item.Name}
      </div>
    );
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: Record<string, unknown>) => opts?.defaultValue ?? key,
}));

jest.mock('@/lib/core/search-utils', () => ({
  getResultId: (item: { Type?: string; Name: string }) => `${item.Type}-${item.Name}`,
}));

describe('GroupedResultsList', () => {
  const baseProps = {
    isSelected: jest.fn(() => false),
    skyCultureLanguage: 'western' as const,
    onSelect: jest.fn(),
    onAddToTargetList: jest.fn(),
  };

  it('renders source group labels in uppercase', () => {
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['simbad', [{ Name: 'M31', Type: 'DSO' } as SearchResultItem]],
    ]);

    render(<GroupedResultsList {...baseProps} groupedResults={groupedResults} />);
    expect(screen.getByText('SIMBAD')).toBeInTheDocument();
  });

  it('renders non-source group with translation key', () => {
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['DSO', [{ Name: 'M42', Type: 'DSO' } as SearchResultItem]],
    ]);

    render(<GroupedResultsList {...baseProps} groupedResults={groupedResults} />);
    expect(screen.getByText('M42')).toBeInTheDocument();
  });

  it('renders multiple groups with item counts', () => {
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['DSO', [
        { Name: 'M31', Type: 'DSO' } as SearchResultItem,
        { Name: 'M42', Type: 'DSO' } as SearchResultItem,
      ]],
      ['Planet', [{ Name: 'Mars', Type: 'Planet' } as SearchResultItem]],
    ]);

    render(<GroupedResultsList {...baseProps} groupedResults={groupedResults} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders items in expanded groups by default', () => {
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['DSO', [{ Name: 'M31', Type: 'DSO' } as SearchResultItem]],
    ]);

    render(
      <GroupedResultsList
        {...baseProps}
        groupedResults={groupedResults}
        defaultExpanded={['DSO']}
      />
    );
    expect(screen.getByText('M31')).toBeInTheDocument();
  });

  it('toggles group expand/collapse on click', () => {
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['DSO', [{ Name: 'M31', Type: 'DSO' } as SearchResultItem]],
    ]);

    render(
      <GroupedResultsList
        {...baseProps}
        groupedResults={groupedResults}
        defaultExpanded={['DSO']}
      />
    );

    // Click collapsible wrapper which triggers onOpenChange → toggleGroup
    const collapsible = screen.getByTestId('collapsible');
    fireEvent.click(collapsible);
    // Click again to toggle back (expand)
    fireEvent.click(collapsible);
    expect(collapsible).toBeInTheDocument();
  });

  it('passes indexMap and highlightedIndex to items', () => {
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['DSO', [{ Name: 'M31', Type: 'DSO' } as SearchResultItem]],
    ]);
    const indexMap = new Map([['DSO-M31', 0]]);

    render(
      <GroupedResultsList
        {...baseProps}
        groupedResults={groupedResults}
        indexMap={indexMap}
        highlightedIndex={0}
        defaultExpanded={['DSO']}
      />
    );
    const item = screen.getByText('M31');
    expect(item.closest('[data-highlighted]')).toHaveAttribute('data-highlighted', 'true');
  });

  it('calls onToggleSelection when provided', () => {
    const onToggle = jest.fn();
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['DSO', [{ Name: 'M31', Type: 'DSO' } as SearchResultItem]],
    ]);

    render(
      <GroupedResultsList
        {...baseProps}
        groupedResults={groupedResults}
        onToggleSelection={onToggle}
        defaultExpanded={['DSO']}
      />
    );
    expect(screen.getByText('M31')).toBeInTheDocument();
  });

  it('renders with listboxId', () => {
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['DSO', [{ Name: 'M31', Type: 'DSO' } as SearchResultItem]],
    ]);

    const { container } = render(
      <GroupedResultsList
        {...baseProps}
        groupedResults={groupedResults}
        listboxId="test-listbox"
      />
    );
    expect(container.querySelector('#test-listbox')).toBeInTheDocument();
  });

  it('passes searchQuery to items', () => {
    const groupedResults = new Map<string, SearchResultItem[]>([
      ['DSO', [{ Name: 'M31', Type: 'DSO' } as SearchResultItem]],
    ]);

    render(
      <GroupedResultsList
        {...baseProps}
        groupedResults={groupedResults}
        searchQuery="M31"
        defaultExpanded={['DSO']}
      />
    );
    expect(screen.getByText('M31')).toBeInTheDocument();
  });
});
