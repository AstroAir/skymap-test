/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortableHeader } from '../sortable-header';

jest.mock('@/components/ui/table', () => ({
  TableHead: ({ children, onClick, className }: React.PropsWithChildren<{ onClick?: () => void; className?: string }>) => (
    <th onClick={onClick} className={className}>{children}</th>
  ),
}));

describe('SortableHeader', () => {
  it('renders the label', () => {
    render(
      <table><thead><tr>
        <SortableHeader label="Name" sortKey="name" currentSort={{ key: 'name', direction: 'asc' }} onSort={jest.fn()} />
      </tr></thead></table>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('shows ascending icon when active and asc', () => {
    const { container } = render(
      <table><thead><tr>
        <SortableHeader label="Name" sortKey="name" currentSort={{ key: 'name', direction: 'asc' }} onSort={jest.fn()} />
      </tr></thead></table>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows descending icon when active and desc', () => {
    const { container } = render(
      <table><thead><tr>
        <SortableHeader label="Name" sortKey="name" currentSort={{ key: 'name', direction: 'desc' }} onSort={jest.fn()} />
      </tr></thead></table>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show icon when not active', () => {
    const { container } = render(
      <table><thead><tr>
        <SortableHeader label="Name" sortKey="name" currentSort={{ key: 'other', direction: 'asc' }} onSort={jest.fn()} />
      </tr></thead></table>
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('calls onSort with sortKey when clicked', () => {
    const onSort = jest.fn();
    render(
      <table><thead><tr>
        <SortableHeader label="Name" sortKey="name" currentSort={{ key: 'other', direction: 'asc' }} onSort={onSort} />
      </tr></thead></table>
    );
    fireEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name');
  });
});
