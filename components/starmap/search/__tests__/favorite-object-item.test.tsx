/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FavoriteObjectItem } from '../favorite-object-item';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: Record<string, unknown>) => opts?.defaultValue ?? key,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: (e: React.MouseEvent) => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => <button onClick={onClick}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('FavoriteObjectItem', () => {
  const mockObject = {
    id: 'fav-1',
    name: 'M31',
    ra: 10.68,
    dec: 41.26,
    type: 'Galaxy',
    constellation: 'Andromeda',
    tags: ['beginner', 'galaxy'],
    raString: '00h 42m 44s',
    decString: "+41° 16'",
    viewCount: 5,
    addedAt: Date.now(),
  };

  const defaultProps = {
    object: mockObject,
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders object name', () => {
    render(<FavoriteObjectItem {...defaultProps} />);
    expect(screen.getByText('M31')).toBeInTheDocument();
  });

  it('renders object type', () => {
    render(<FavoriteObjectItem {...defaultProps} />);
    expect(screen.getByText('Galaxy')).toBeInTheDocument();
  });

  it('renders constellation', () => {
    render(<FavoriteObjectItem {...defaultProps} />);
    expect(screen.getByText('Andromeda')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<FavoriteObjectItem {...defaultProps} />);
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText('galaxy')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    render(<FavoriteObjectItem {...defaultProps} />);
    fireEvent.click(screen.getByText('M31'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockObject);
  });

  it('calls onNavigate when navigate button is clicked', () => {
    const onNavigate = jest.fn();
    render(<FavoriteObjectItem {...defaultProps} onNavigate={onNavigate} />);
    // Navigate button is the first action button (Navigation icon)
    const buttons = screen.getAllByRole('button');
    // Find the navigate button (before the dropdown trigger)
    fireEvent.click(buttons[0]);
    expect(onNavigate).toHaveBeenCalledWith(mockObject);
  });

  it('calls onRemove when remove menu item is clicked', () => {
    const onRemove = jest.fn();
    render(<FavoriteObjectItem {...defaultProps} onRemove={onRemove} />);
    // The remove button is a dropdown menu item with Trash2 icon
    const menuItems = screen.getAllByRole('button');
    // Last menu item is the remove action
    const removeBtn = menuItems.find(btn => btn.textContent?.includes('favorites.remove'));
    if (removeBtn) fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith('fav-1');
  });

  it('calls onEditTags when manage tags menu item is clicked', () => {
    const onEditTags = jest.fn();
    render(<FavoriteObjectItem {...defaultProps} onEditTags={onEditTags} />);
    const menuItems = screen.getAllByRole('button');
    const tagsBtn = menuItems.find(btn => btn.textContent?.includes('favorites.manageTags'));
    if (tagsBtn) fireEvent.click(tagsBtn);
    expect(onEditTags).toHaveBeenCalledWith('fav-1');
  });

  it('hides action buttons when showActions is false', () => {
    const onNavigate = jest.fn();
    render(<FavoriteObjectItem {...defaultProps} showActions={false} onNavigate={onNavigate} />);
    // Should not render navigate or more buttons
    expect(screen.queryByText('favorites.goTo')).not.toBeInTheDocument();
  });

  it('renders unfilled star when isFavorite is false', () => {
    const { container } = render(<FavoriteObjectItem {...defaultProps} isFavorite={false} />);
    const svg = container.querySelector('svg');
    expect(svg?.className.baseVal || svg?.getAttribute('class') || '').toContain('text-muted-foreground');
  });

  it('shows overflow badge when more than 2 tags', () => {
    const objWithManyTags = { ...mockObject, tags: ['imaging', 'visual', 'easy', 'challenging'] };
    render(<FavoriteObjectItem {...defaultProps} object={objWithManyTags} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not render separator when no constellation', () => {
    const objNoConstellation = { ...mockObject, constellation: undefined };
    render(<FavoriteObjectItem {...defaultProps} object={objNoConstellation} />);
    expect(screen.queryByText('•')).not.toBeInTheDocument();
  });

  it('does not render tags section when tags array is empty', () => {
    const objNoTags = { ...mockObject, tags: [] };
    render(<FavoriteObjectItem {...defaultProps} object={objNoTags} />);
    // Should not render any tag badges (only buttons/name text present)
    const allText = screen.queryAllByText(/imaging|visual|galaxy|beginner/);
    expect(allText.length).toBe(0);
  });
});
