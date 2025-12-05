/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';

// Mock locale store
const mockLocale = { current: 'en' as 'en' | 'zh' };
jest.mock('@/lib/i18n/locale-store', () => ({
  useLocaleStore: (selector: (state: { locale: 'en' | 'zh' }) => unknown) => {
    const state = { locale: mockLocale.current };
    return selector ? selector(state) : state;
  },
}));

// Mock next-intl with a custom implementation for this test
jest.mock('next-intl', () => ({
  NextIntlClientProvider: ({
    children,
    locale,
    messages,
  }: {
    children: React.ReactNode;
    locale: string;
    messages: Record<string, unknown>;
    timeZone?: string;
  }) => (
    <div data-testid="intl-provider" data-locale={locale} data-has-messages={!!messages}>
      {children}
    </div>
  ),
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
  useMessages: () => ({}),
}));

// Mock i18n messages
jest.mock('@/i18n/messages/en.json', () => ({ test: 'English Test' }), { virtual: true });
jest.mock('@/i18n/messages/zh.json', () => ({ test: '中文测试' }), { virtual: true });

import { I18nProvider } from '../i18n-provider';

describe('I18nProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocale.current = 'en';
  });

  it('renders children correctly', () => {
    render(
      <I18nProvider>
        <div data-testid="child">Test Child</div>
      </I18nProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('wraps children with NextIntlClientProvider', () => {
    render(
      <I18nProvider>
        <span>Content</span>
      </I18nProvider>
    );

    const provider = screen.getByTestId('intl-provider');
    expect(provider).toBeInTheDocument();
  });

  it('uses default locale "en" before mounting', () => {
    render(
      <I18nProvider>
        <span>Content</span>
      </I18nProvider>
    );

    const provider = screen.getByTestId('intl-provider');
    // Initially uses 'en' before useEffect sets mounted to true
    expect(provider).toHaveAttribute('data-locale', 'en');
  });

  it('uses locale from store after mounting', async () => {
    mockLocale.current = 'zh';

    render(
      <I18nProvider>
        <span>Content</span>
      </I18nProvider>
    );

    // After useEffect runs, it should use the store locale
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const provider = screen.getByTestId('intl-provider');
    expect(provider).toHaveAttribute('data-locale', 'zh');
  });

  it('provides messages to NextIntlClientProvider', () => {
    render(
      <I18nProvider>
        <span>Content</span>
      </I18nProvider>
    );

    const provider = screen.getByTestId('intl-provider');
    expect(provider).toHaveAttribute('data-has-messages', 'true');
  });

  it('renders multiple children correctly', () => {
    render(
      <I18nProvider>
        <div data-testid="first">First</div>
        <div data-testid="second">Second</div>
      </I18nProvider>
    );

    expect(screen.getByTestId('first')).toBeInTheDocument();
    expect(screen.getByTestId('second')).toBeInTheDocument();
  });

  it('handles locale switch from en to zh', async () => {
    const { rerender } = render(
      <I18nProvider>
        <span>Content</span>
      </I18nProvider>
    );

    // Wait for mount
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Change locale
    mockLocale.current = 'zh';

    rerender(
      <I18nProvider>
        <span>Content</span>
      </I18nProvider>
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const provider = screen.getByTestId('intl-provider');
    expect(provider).toHaveAttribute('data-locale', 'zh');
  });

  it('handles locale switch from zh to en', async () => {
    mockLocale.current = 'zh';

    const { rerender } = render(
      <I18nProvider>
        <span>Content</span>
      </I18nProvider>
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    mockLocale.current = 'en';

    rerender(
      <I18nProvider>
        <span>Content</span>
      </I18nProvider>
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const provider = screen.getByTestId('intl-provider');
    expect(provider).toHaveAttribute('data-locale', 'en');
  });

  it('preserves child state across re-renders', async () => {
    const StatefulChild = () => {
      const [count, setCount] = React.useState(0);
      return (
        <button data-testid="counter" onClick={() => setCount((c) => c + 1)}>
          Count: {count}
        </button>
      );
    };

    render(
      <I18nProvider>
        <StatefulChild />
      </I18nProvider>
    );

    const button = screen.getByTestId('counter');
    expect(button).toHaveTextContent('Count: 0');

    await act(async () => {
      button.click();
    });

    expect(button).toHaveTextContent('Count: 1');
  });
});
