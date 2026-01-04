/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock next-themes
const mockSetTheme = jest.fn();
let mockResolvedTheme = 'light';
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
  }),
}));

// Mock theme store
const mockApplyCustomization = jest.fn();
interface ThemeStoreState {
  applyCustomization: () => void;
}

jest.mock('@/lib/stores/theme-store', () => ({
  useThemeStore: <T,>(selector: (state: ThemeStoreState) => T): T => {
    return selector({ applyCustomization: mockApplyCustomization });
  },
}));

const messages = {
  theme: {
    switchToLight: 'Switch to Light',
    switchToDark: 'Switch to Dark',
    system: 'System',
    customize: 'Customize',
  },
  common: {
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
  },
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TooltipProvider>
        {ui}
      </TooltipProvider>
    </NextIntlClientProvider>
  );
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolvedTheme = 'light';
  });

  it('renders dropdown variant by default', () => {
    renderWithProviders(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders icon variant', () => {
    renderWithProviders(<ThemeToggle variant="icon" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('toggles theme when icon variant is clicked', () => {
    mockResolvedTheme = 'light';
    renderWithProviders(<ThemeToggle variant="icon" />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    mockSetTheme.mockClear();
    mockResolvedTheme = 'dark';
    renderWithProviders(<ThemeToggle variant="icon" />);
    fireEvent.click(screen.getAllByRole('button')[1]); // Second render
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('shows dropdown menu items when clicked', () => {
    renderWithProviders(<ThemeToggle variant="dropdown" />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('Light Mode')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('calls setTheme when dropdown items are clicked', () => {
    renderWithProviders(<ThemeToggle variant="dropdown" />);
    fireEvent.click(screen.getByRole('button'));

    fireEvent.click(screen.getByText('Light Mode'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');

    fireEvent.click(screen.getByText('Dark Mode'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    fireEvent.click(screen.getByText('System'));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('shows customize option when showCustomize is true', () => {
    const mockOnCustomizeClick = jest.fn();
    renderWithProviders(
      <ThemeToggle 
        variant="dropdown" 
        showCustomize={true} 
        onCustomizeClick={mockOnCustomizeClick} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    const customizeBtn = screen.getByText('Customize');
    expect(customizeBtn).toBeInTheDocument();
    
    fireEvent.click(customizeBtn);
    expect(mockOnCustomizeClick).toHaveBeenCalled();
  });
});
