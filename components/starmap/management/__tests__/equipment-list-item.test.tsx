/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Telescope } from 'lucide-react';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

import { EquipmentListItem } from '../equipment-list-item';

describe('EquipmentListItem', () => {
  const defaultProps = {
    icon: Telescope,
    name: 'Newton 200/1000',
    detail: '200mm f/5.0',
    deleteLabel: 'Delete',
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders name and detail', () => {
    render(<EquipmentListItem {...defaultProps} />);
    expect(screen.getByText('Newton 200/1000')).toBeInTheDocument();
    expect(screen.getByText('200mm f/5.0')).toBeInTheDocument();
  });

  it('renders delete button with aria-label', () => {
    render(<EquipmentListItem {...defaultProps} />);
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = jest.fn();
    render(<EquipmentListItem {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('Delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('stops propagation on delete click', () => {
    const onSelect = jest.fn();
    const onDelete = jest.fn();
    render(
      <EquipmentListItem
        {...defaultProps}
        selectable
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByLabelText('Delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders edit button when onEdit is provided', () => {
    const onEdit = jest.fn();
    render(
      <EquipmentListItem {...defaultProps} editLabel="Edit" onEdit={onEdit} />
    );
    expect(screen.getByLabelText('Edit')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(
      <EquipmentListItem {...defaultProps} editLabel="Edit" onEdit={onEdit} />
    );
    fireEvent.click(screen.getByLabelText('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('does not render edit button when onEdit is not provided', () => {
    render(<EquipmentListItem {...defaultProps} />);
    expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
  });

  it('calls onSelect when selectable and clicked', () => {
    const onSelect = jest.fn();
    render(
      <EquipmentListItem {...defaultProps} selectable onSelect={onSelect} />
    );
    fireEvent.click(screen.getByText('Newton 200/1000').closest('div[class*="flex items-center justify-between"]')!);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not call onSelect when not selectable', () => {
    const onSelect = jest.fn();
    render(
      <EquipmentListItem {...defaultProps} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByText('Newton 200/1000').closest('div[class*="flex items-center justify-between"]')!);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('applies selected styling when isSelected', () => {
    render(<EquipmentListItem {...defaultProps} isSelected />);
    const container = screen.getByText('Newton 200/1000').closest('div[class*="flex items-center justify-between"]')!;
    expect(container.className).toContain('border-primary');
    expect(container.className).toContain('bg-primary/10');
  });
});
