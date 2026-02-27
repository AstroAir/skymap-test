/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResultItemRow } from '../search-result-item';
import type { SearchResultItem } from '@/lib/core/types';

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

  it('renders highlighted style when isHighlighted is true', () => {
    const { container } = render(
      <SearchResultItemRow
        {...baseProps}
        item={{ Name: 'M31', Type: 'DSO' }}
        isHighlighted={true}
      />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('ring-2');
  });

  it('hides checkbox when showCheckbox is false', () => {
    const { container } = render(
      <SearchResultItemRow
        {...baseProps}
        showCheckbox={false}
        item={{ Name: 'M31', Type: 'DSO' }}
      />
    );
    expect(container.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('renders magnitude badge when Magnitude is provided', () => {
    render(
      <SearchResultItemRow
        {...baseProps}
        item={{ Name: 'M31', Type: 'DSO', Magnitude: 3.4 }}
      />
    );
    expect(screen.getByText('3.4m')).toBeInTheDocument();
  });

  it('renders size badge when Size is provided', () => {
    render(
      <SearchResultItemRow
        {...baseProps}
        item={{ Name: 'M31', Type: 'DSO', Size: '178x63' }}
      />
    );
    expect(screen.getByText('178x63')).toBeInTheDocument();
  });

  it('renders RA/Dec when provided', () => {
    render(
      <SearchResultItemRow
        {...baseProps}
        item={{ Name: 'M31', Type: 'DSO', RA: 10.68, Dec: 41.27 }}
      />
    );
    expect(screen.getByText('10.7°/41.3°')).toBeInTheDocument();
  });

  it('renders common names when provided', () => {
    render(
      <SearchResultItemRow
        {...baseProps}
        item={{ Name: 'M31', Type: 'DSO', 'Common names': 'Andromeda Galaxy' }}
      />
    );
    expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
  });

  it('calls onMouseEnter with globalIndex', () => {
    const onMouseEnter = jest.fn();
    const { container } = render(
      <SearchResultItemRow
        {...baseProps}
        onMouseEnter={onMouseEnter}
        globalIndex={5}
        item={{ Name: 'M31', Type: 'DSO' }}
      />
    );
    fireEvent.mouseEnter(container.firstChild as HTMLElement);
    expect(onMouseEnter).toHaveBeenCalledWith(5);
  });

  it('calls onAddToTargetList when add button is clicked', () => {
    const onAdd = jest.fn();
    const item = { Name: 'M31', Type: 'DSO' } as SearchResultItem;
    render(
      <SearchResultItemRow
        {...baseProps}
        onAddToTargetList={onAdd}
        item={item}
      />
    );
    // The add button is the last button with Plus icon
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onAdd).toHaveBeenCalledWith(item);
  });

  it('calls onSelect when item content is clicked', () => {
    const onSelect = jest.fn();
    const item = { Name: 'M31', Type: 'DSO' } as SearchResultItem;
    render(
      <SearchResultItemRow
        {...baseProps}
        onSelect={onSelect}
        item={item}
      />
    );
    fireEvent.click(screen.getByText('M31'));
    expect(onSelect).toHaveBeenCalledWith(item);
  });

  it('calls onToggleSelection when checkbox is clicked', () => {
    const onToggle = jest.fn();
    const { container } = render(
      <SearchResultItemRow
        {...baseProps}
        onToggleSelection={onToggle}
        item={{ Name: 'M31', Type: 'DSO' }}
      />
    );
    const checkbox = container.querySelector('input[type="checkbox"]')!;
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith('dso-M31');
  });

  it('renders checked style when checked is true', () => {
    const { container } = render(
      <SearchResultItemRow
        {...baseProps}
        checked={true}
        item={{ Name: 'M31', Type: 'DSO' }}
      />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-accent/30');
  });
});

