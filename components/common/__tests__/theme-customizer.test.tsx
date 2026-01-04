/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeCustomizer } from '../theme-customizer';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock next-themes
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
  }),
}));

// Mock theme store
const mockSetRadius = jest.fn();
const mockSetFontFamily = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetAnimationsEnabled = jest.fn();
const mockSetActivePreset = jest.fn();
const mockResetCustomization = jest.fn();

jest.mock('@/lib/stores/theme-store', () => ({
  useThemeStore: () => ({
    customization: {
      radius: 0.5,
      fontFamily: 'default',
      fontSize: 'default',
      animationsEnabled: true,
      activePreset: null,
    },
    setRadius: mockSetRadius,
    setFontFamily: mockSetFontFamily,
    setFontSize: mockSetFontSize,
    setAnimationsEnabled: mockSetAnimationsEnabled,
    setActivePreset: mockSetActivePreset,
    resetCustomization: mockResetCustomization,
  }),
  themePresets: [
    {
      id: 'preset1',
      name: 'Preset 1',
      colors: {
        light: { primary: '#000', secondary: '#111', accent: '#222' },
        dark: { primary: '#fff', secondary: '#eee', accent: '#ddd' },
      },
    },
  ],
}));

const messages = {
  theme: {
    customize: 'Customize',
    customizeTheme: 'Customize Theme',
    customizeDescription: 'Change the look and feel of the app.',
    presets: 'Presets',
    appearance: 'Appearance',
    typography: 'Typography',
    colorPresets: 'Color Presets',
    borderRadius: 'Border Radius',
    square: 'Square',
    rounded: 'Rounded',
    preview: 'Preview',
    animations: 'Animations',
    animationsDescription: 'Enable or disable UI animations.',
    fontFamily: 'Font Family',
    fontDefault: 'Default',
    fontSerif: 'Serif',
    fontMono: 'Monospace',
    fontSystem: 'System',
    fontPreviewText: 'The quick brown fox jumps over the lazy dog.',
    fontSize: 'Font Size',
    fontSizeSmall: 'Small',
    fontSizeDefault: 'Default',
    fontSizeLarge: 'Large',
  },
  common: {
    reset: 'Reset',
    close: 'Close',
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

describe('ThemeCustomizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger button', () => {
    renderWithProviders(<ThemeCustomizer />);
    expect(screen.getByText('theme.customize')).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', () => {
    renderWithProviders(<ThemeCustomizer />);
    fireEvent.click(screen.getByText('theme.customize'));
    expect(screen.getByText('theme.customizeTheme')).toBeInTheDocument();
  });

  it('shows presets by default', () => {
    renderWithProviders(<ThemeCustomizer open={true} />);
    expect(screen.getByText('theme.colorPresets')).toBeInTheDocument();
    expect(screen.getByText('Preset 1')).toBeInTheDocument();
  });

  it('calls setActivePreset when a preset is clicked', () => {
    renderWithProviders(<ThemeCustomizer open={true} />);
    fireEvent.click(screen.getByText('Preset 1'));
    expect(mockSetActivePreset).toHaveBeenCalledWith('preset1');
  });

  it('switches to appearance tab', () => {
    renderWithProviders(<ThemeCustomizer open={true} />);
    fireEvent.click(screen.getByText('theme.appearance'));
    expect(screen.getByText('theme.borderRadius')).toBeInTheDocument();
    expect(screen.getByText('theme.animations')).toBeInTheDocument();
  });

  it('switches to typography tab', () => {
    renderWithProviders(<ThemeCustomizer open={true} />);
    fireEvent.click(screen.getByText('theme.typography'));
    expect(screen.getByText('theme.fontFamily')).toBeInTheDocument();
    expect(screen.getByText('theme.fontSize')).toBeInTheDocument();
  });

  it('calls resetCustomization when reset button is clicked', () => {
    renderWithProviders(<ThemeCustomizer open={true} />);
    fireEvent.click(screen.getByText('common.reset'));
    expect(mockResetCustomization).toHaveBeenCalled();
  });

  it('calls onOpenChange when close button is clicked', () => {
    const mockOnOpenChange = jest.fn();
    renderWithProviders(<ThemeCustomizer open={true} onOpenChange={mockOnOpenChange} />);
    fireEvent.click(screen.getByText('common.close'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
