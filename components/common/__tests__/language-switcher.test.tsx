/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from '../language-switcher';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the locale store
const mockSetLocale = jest.fn();
const mockSetPreference = jest.fn();
jest.mock('@/lib/i18n/locale-store', () => ({
  useLocaleStore: () => ({
    locale: 'en',
    setLocale: mockSetLocale,
  }),
}));

jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: (selector: (state: { setPreference: typeof mockSetPreference }) => unknown) => {
    const state = { setPreference: mockSetPreference };
    return selector ? selector(state) : state;
  },
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

  it('toggles dropdown and calls setLocale when an option is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    const zhOption = screen.getByText('中文');
    expect(zhOption).toBeInTheDocument();
    
    await user.click(zhOption);
    expect(mockSetLocale).toHaveBeenCalledWith('zh');
    expect(mockSetPreference).toHaveBeenCalledWith('locale', 'zh');
  });

  it('highlights the current locale in the dropdown', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    const enOption = screen.getByText('English');
    expect(enOption.closest('div')).toHaveClass('bg-accent');
  });
});
