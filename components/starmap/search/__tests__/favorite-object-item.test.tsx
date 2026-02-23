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
});
