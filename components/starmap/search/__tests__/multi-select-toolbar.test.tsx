/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiSelectToolbar } from '../multi-select-toolbar';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`;
    return key;
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

describe('MultiSelectToolbar', () => {
  it('shows select all when nothing selected', () => {
    render(<MultiSelectToolbar selectedCount={0} onToggleSelectAll={jest.fn()} onBatchAdd={jest.fn()} />);
    expect(screen.getByText('search.selectAll')).toBeInTheDocument();
  });

  it('shows clear selection when items selected', () => {
    render(<MultiSelectToolbar selectedCount={3} onToggleSelectAll={jest.fn()} onBatchAdd={jest.fn()} />);
    expect(screen.getByText('search.clearSelection')).toBeInTheDocument();
  });

  it('shows selected count', () => {
    render(<MultiSelectToolbar selectedCount={5} onToggleSelectAll={jest.fn()} onBatchAdd={jest.fn()} />);
    expect(screen.getByText(/search\.selectedCount/)).toBeInTheDocument();
  });

  it('shows add to list button when items selected', () => {
    render(<MultiSelectToolbar selectedCount={2} onToggleSelectAll={jest.fn()} onBatchAdd={jest.fn()} />);
    expect(screen.getByText('search.addToList')).toBeInTheDocument();
  });

  it('hides add to list button when nothing selected', () => {
    render(<MultiSelectToolbar selectedCount={0} onToggleSelectAll={jest.fn()} onBatchAdd={jest.fn()} />);
    expect(screen.queryByText('search.addToList')).not.toBeInTheDocument();
  });

  it('calls onToggleSelectAll when toggle button clicked', () => {
    const onToggle = jest.fn();
    render(<MultiSelectToolbar selectedCount={0} onToggleSelectAll={onToggle} onBatchAdd={jest.fn()} />);
    fireEvent.click(screen.getByText('search.selectAll'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('calls onBatchAdd when add button clicked', () => {
    const onBatchAdd = jest.fn();
    render(<MultiSelectToolbar selectedCount={3} onToggleSelectAll={jest.fn()} onBatchAdd={onBatchAdd} />);
    fireEvent.click(screen.getByText('search.addToList'));
    expect(onBatchAdd).toHaveBeenCalled();
  });
});
