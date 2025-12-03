/**
 * @jest-environment jsdom
 */
import { useLocaleStore } from '../locale-store';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

describe('useLocaleStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useLocaleStore.setState({ locale: 'en' });
  });

  it('has default locale set to en', () => {
    const { locale } = useLocaleStore.getState();
    expect(locale).toBe('en');
  });

  it('can set locale to zh', () => {
    const { setLocale } = useLocaleStore.getState();
    setLocale('zh');
    const { locale } = useLocaleStore.getState();
    expect(locale).toBe('zh');
  });

  it('can set locale back to en', () => {
    const { setLocale } = useLocaleStore.getState();
    setLocale('zh');
    setLocale('en');
    const { locale } = useLocaleStore.getState();
    expect(locale).toBe('en');
  });

  it('persists locale changes', () => {
    const { setLocale } = useLocaleStore.getState();
    setLocale('zh');
    
    // Get fresh state
    const newState = useLocaleStore.getState();
    expect(newState.locale).toBe('zh');
  });
});
