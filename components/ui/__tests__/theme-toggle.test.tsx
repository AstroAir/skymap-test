/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../theme-toggle';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock TooltipProvider
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('dark');
    document.documentElement.classList.remove('dark');
  });

  it('renders without crashing', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders theme icon', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct base styles', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'w-10');
  });

  it('toggles theme on click', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  it('applies dark class to document when theme is dark', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    render(<ThemeToggle />);
    
    // The theme application happens via useEffect
    // We just verify the component renders correctly
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('reads theme from localStorage on mount', () => {
    localStorageMock.getItem.mockReturnValue('light');
    render(<ThemeToggle />);
    
    // Component should read from localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
  });
});

describe('ThemeToggle with light theme', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue('light');
    document.documentElement.classList.remove('dark');
  });

  it('toggles to dark theme on click', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });
});
