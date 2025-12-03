/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import {
  useCelestialName,
  useCelestialNames,
  useCelestialNameWithOriginal,
  getCelestialNameTranslation,
} from '../use-celestial-name';

// Mock settings store
jest.mock('@/lib/starmap/stores', () => ({
  useSettingsStore: jest.fn((selector) =>
    selector({
      stellarium: {
        skyCultureLanguage: 'native',
      },
    })
  ),
}));

// Mock translations
jest.mock('@/lib/starmap/translations', () => ({
  translateCelestialName: jest.fn((name, lang) => {
    if (lang === 'zh' && name === 'Orion') return '猎户座';
    if (lang === 'en' && name === 'Orion') return 'Hunter';
    return name;
  }),
}));

describe('useCelestialName', () => {
  it('returns empty string for null name', () => {
    const { result } = renderHook(() => useCelestialName(null));
    expect(result.current).toBe('');
  });

  it('returns empty string for undefined name', () => {
    const { result } = renderHook(() => useCelestialName(undefined));
    expect(result.current).toBe('');
  });

  it('returns translated name', () => {
    const { result } = renderHook(() => useCelestialName('Orion'));
    expect(result.current).toBe('Orion'); // native language returns original
  });
});

describe('useCelestialNames', () => {
  it('returns empty array for null', () => {
    const { result } = renderHook(() => useCelestialNames(null));
    expect(result.current).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    const { result } = renderHook(() => useCelestialNames(undefined));
    expect(result.current).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    const { result } = renderHook(() => useCelestialNames([]));
    expect(result.current).toEqual([]);
  });

  it('returns translated names', () => {
    const { result } = renderHook(() => useCelestialNames(['Orion', 'Andromeda']));
    expect(result.current.length).toBe(2);
  });
});

describe('useCelestialNameWithOriginal', () => {
  it('returns empty values for null name', () => {
    const { result } = renderHook(() => useCelestialNameWithOriginal(null));
    expect(result.current.translated).toBe('');
    expect(result.current.original).toBe('');
    expect(result.current.isTranslated).toBe(false);
  });

  it('returns both translated and original', () => {
    const { result } = renderHook(() => useCelestialNameWithOriginal('Orion'));
    expect(result.current.original).toBe('Orion');
    expect(result.current.translated).toBeDefined();
  });

  it('indicates when translation is same as original', () => {
    const { result } = renderHook(() => useCelestialNameWithOriginal('Orion'));
    // With native language, translated === original
    expect(result.current.isTranslated).toBe(false);
  });
});

describe('getCelestialNameTranslation', () => {
  it('translates name to Chinese', () => {
    const result = getCelestialNameTranslation('Orion', 'zh');
    expect(result).toBe('猎户座');
  });

  it('translates name to English', () => {
    const result = getCelestialNameTranslation('Orion', 'en');
    expect(result).toBe('Hunter');
  });

  it('returns original for native language', () => {
    const result = getCelestialNameTranslation('Orion', 'native');
    expect(result).toBe('Orion');
  });
});
