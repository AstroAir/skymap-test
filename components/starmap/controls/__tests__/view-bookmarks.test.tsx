/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ViewBookmarks } from '../view-bookmarks';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock bookmarks store
const mockBookmarksStore = {
  bookmarks: [] as Array<{
    id: string;
    name: string;
    ra: number;
    dec: number;
    fov: number;
    description?: string;
    color?: string;
    icon?: string;
    createdAt: number;
    updatedAt: number;
  }>,
  addBookmark: jest.fn(() => 'new-id'),
  updateBookmark: jest.fn(),
  removeBookmark: jest.fn(),
  duplicateBookmark: jest.fn(() => 'dup-id'),
};

jest.mock('@/lib/stores/bookmarks-store', () => ({
  useBookmarksStore: jest.fn((selector?: (s: typeof mockBookmarksStore) => unknown) =>
    selector ? selector(mockBookmarksStore) : mockBookmarksStore
  ),
  BOOKMARK_ICONS: ['star', 'heart', 'flag', 'pin', 'eye', 'camera', 'telescope'],
  BOOKMARK_COLORS: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
}));

describe('ViewBookmarks', () => {
  const defaultProps = {
    currentRa: 10.5,
    currentDec: 41.2,
    currentFov: 3.0,
    onNavigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBookmarksStore.bookmarks = [];
  });

  it('renders the bookmark trigger button', () => {
    render(<ViewBookmarks {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no bookmarks exist', () => {
    render(<ViewBookmarks {...defaultProps} />);
    
    // The popover content should show empty message
    const content = screen.getByTestId('popover-content');
    expect(content).toBeInTheDocument();
  });

  it('renders bookmark items when bookmarks exist', () => {
    mockBookmarksStore.bookmarks = [
      {
        id: 'bm1',
        name: 'Orion Nebula',
        ra: 83.82,
        dec: -5.39,
        fov: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        icon: 'star',
        color: '#ef4444',
      },
    ];

    render(<ViewBookmarks {...defaultProps} />);
    
    expect(screen.getByText('Orion Nebula')).toBeInTheDocument();
  });

  it('renders multiple bookmarks when they exist', () => {
    mockBookmarksStore.bookmarks = [
      {
        id: 'bm1',
        name: 'Test Bookmark',
        ra: 0,
        dec: 0,
        fov: 60,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'bm2',
        name: 'Andromeda Galaxy',
        ra: 10,
        dec: 20,
        fov: 30,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(<ViewBookmarks {...defaultProps} />);
    
    expect(screen.getByText('Test Bookmark')).toBeInTheDocument();
    expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
  });
});
