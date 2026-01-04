/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '../language-switcher';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the locale store
const mockSetLocale = jest.fn();
jest.mock('@/lib/i18n/locale-store', () => ({
  useLocaleStore: () => ({
    locale: 'en',
    setLocale: mockSetLocale,
  }),
}));

// Mock the config
jest.mock('@/i18n/config', () => ({
  locales: ['en', 'zh'],
  localeNames: {
    en: 'English',
    zh: '中文',
  },
}));

const messages = {
  common: {
    language: 'Language',
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

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with icon', () => {
    renderWithProviders(<LanguageSwitcher />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows locale name when size is not icon', () => {
    renderWithProviders(<LanguageSwitcher size="default" />);
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('toggles dropdown and calls setLocale when an option is clicked', () => {
    renderWithProviders(<LanguageSwitcher />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    const zhOption = screen.getByText('中文');
    expect(zhOption).toBeInTheDocument();
    
    fireEvent.click(zhOption);
    expect(mockSetLocale).toHaveBeenCalledWith('zh');
  });

  it('highlights the current locale in the dropdown', () => {
    renderWithProviders(<LanguageSwitcher />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    const enOption = screen.getByText('English');
    expect(enOption.closest('div')).toHaveClass('bg-accent');
  });
});
