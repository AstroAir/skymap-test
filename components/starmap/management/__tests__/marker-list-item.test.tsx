/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarkerListItem } from '../marker-list-item';

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: (e: React.MouseEvent) => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/lib/constants/marker-icons', () => ({
  MarkerIconDisplay: new Proxy({}, {
    get: () => ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
      <svg className={className} style={style} data-testid="marker-icon" />
    ),
  }),
}));

describe('MarkerListItem', () => {
  const mockMarker = {
    id: 'marker-1',
    name: 'Test Marker',
    ra: 10.68,
    dec: 41.26,
    raString: '00h 42m 44s',
    decString: "+41° 16' 09\"",
    icon: 'star' as const,
    color: '#ff0000',
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const defaultProps = {
    marker: mockMarker,
    t: (key: string) => key,
    onNavigate: jest.fn(),
    onToggleVisibility: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders marker name', () => {
    render(<MarkerListItem {...defaultProps} />);
    expect(screen.getByText('Test Marker')).toBeInTheDocument();
  });

  it('renders marker coordinates', () => {
    render(<MarkerListItem {...defaultProps} />);
    expect(screen.getByText(/00h 42m 44s/)).toBeInTheDocument();
  });

  it('renders marker icon with correct color', () => {
    render(<MarkerListItem {...defaultProps} />);
    const icon = screen.getByTestId('marker-icon');
    expect(icon).toHaveStyle({ color: '#ff0000' });
  });

  it('renders 4 action buttons', () => {
    render(<MarkerListItem {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('applies opacity when marker is not visible', () => {
    const { container } = render(
      <MarkerListItem {...defaultProps} marker={{ ...mockMarker, visible: false }} />
    );
    expect(container.firstChild).toHaveClass('opacity-50');
  });
});
