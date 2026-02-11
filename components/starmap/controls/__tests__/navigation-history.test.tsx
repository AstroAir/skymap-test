/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationHistory } from '../navigation-history';

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
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the navigation history store
const mockStore = {
  history: [] as Array<{ id: string; ra: number; dec: number; fov: number; name?: string; timestamp: number }>,
  currentIndex: -1,
  back: jest.fn(),
  forward: jest.fn(),
  goTo: jest.fn(),
  canGoBack: jest.fn(() => false),
  canGoForward: jest.fn(() => false),
  clear: jest.fn(),
};

jest.mock('@/lib/hooks/use-navigation-history', () => ({
  useNavigationHistoryStore: jest.fn((selector?: (s: typeof mockStore) => unknown) =>
    selector ? selector(mockStore) : mockStore
  ),
  formatNavigationPoint: jest.fn((point: { name?: string; ra: number; dec: number }) => point.name || `${point.ra}° ${point.dec}°`),
  formatTimestamp: jest.fn(() => 'just now'),
}));

describe('NavigationHistory', () => {
  const defaultProps = {
    onNavigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.history = [];
    mockStore.currentIndex = -1;
    mockStore.canGoBack.mockReturnValue(false);
    mockStore.canGoForward.mockReturnValue(false);
  });

  it('renders back, forward, and history buttons', () => {
    render(<NavigationHistory {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('disables back button when canGoBack is false', () => {
    mockStore.canGoBack.mockReturnValue(false);
    render(<NavigationHistory {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('enables back button when canGoBack is true', () => {
    mockStore.canGoBack.mockReturnValue(true);
    render(<NavigationHistory {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).not.toBeDisabled();
  });

  it('disables forward button when canGoForward is false', () => {
    mockStore.canGoForward.mockReturnValue(false);
    render(<NavigationHistory {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toBeDisabled();
  });

  it('calls back and onNavigate when back button is clicked', () => {
    mockStore.canGoBack.mockReturnValue(true);
    const mockPoint = { id: '1', ra: 10, dec: 20, fov: 30, timestamp: Date.now() };
    mockStore.back.mockReturnValue(mockPoint);
    
    render(<NavigationHistory {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    expect(mockStore.back).toHaveBeenCalled();
    expect(defaultProps.onNavigate).toHaveBeenCalledWith(10, 20, 30);
  });

  it('calls forward and onNavigate when forward button is clicked', () => {
    mockStore.canGoForward.mockReturnValue(true);
    const mockPoint = { id: '2', ra: 50, dec: 60, fov: 15, timestamp: Date.now() };
    mockStore.forward.mockReturnValue(mockPoint);
    
    render(<NavigationHistory {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    
    expect(mockStore.forward).toHaveBeenCalled();
    expect(defaultProps.onNavigate).toHaveBeenCalledWith(50, 60, 15);
  });

  it('has navigation role with aria-label', () => {
    render(<NavigationHistory {...defaultProps} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
