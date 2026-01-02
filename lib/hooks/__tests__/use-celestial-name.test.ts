import { renderHook } from '@testing-library/react';
import { 
  useCelestialName, 
  useCelestialNames, 
  useCelestialNameWithOriginal,
  useSkyCultureLanguage,
  getCelestialNameTranslation 
} from '../use-celestial-name';

// Mock the stores
jest.mock('@/lib/stores', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = {
      stellarium: {
        skyCultureLanguage: 'en' as const,
      },
    };
    return selector(state);
  }),
}));

// Mock the translations
jest.mock('@/lib/translations', () => ({
  translateCelestialName: jest.fn((name: string, language: string) => {
    if (language === 'zh') {
      const translations: Record<string, string> = {
        'Polaris': '北极星',
        'Vega': '织女星',
        'Sirius': '天狼星',
      };
      return translations[name] || name;
    }
    return name;
  }),
}));

describe('useCelestialName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty string for undefined name', () => {
    const { result } = renderHook(() => useCelestialName(undefined));
    expect(result.current).toBe('');
  });

  it('should return empty string for null name', () => {
    const { result } = renderHook(() => useCelestialName(null));
    expect(result.current).toBe('');
  });

  it('should return translated name for valid input', () => {
    const { result } = renderHook(() => useCelestialName('Polaris'));
    expect(result.current).toBe('Polaris');
  });
});

describe('useCelestialNames', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array for undefined names', () => {
    const { result } = renderHook(() => useCelestialNames(undefined));
    expect(result.current).toEqual([]);
  });

  it('should return empty array for null names', () => {
    const { result } = renderHook(() => useCelestialNames(null));
    expect(result.current).toEqual([]);
  });

  it('should return empty array for empty array', () => {
    const { result } = renderHook(() => useCelestialNames([]));
    expect(result.current).toEqual([]);
  });

  it('should return translated names for valid input', () => {
    const { result } = renderHook(() => useCelestialNames(['Polaris', 'Vega']));
    expect(result.current).toEqual(['Polaris', 'Vega']);
  });
});

describe('useCelestialNameWithOriginal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty values for undefined name', () => {
    const { result } = renderHook(() => useCelestialNameWithOriginal(undefined));
    expect(result.current).toEqual({
      translated: '',
      original: '',
      isTranslated: false,
    });
  });

  it('should return empty values for null name', () => {
    const { result } = renderHook(() => useCelestialNameWithOriginal(null));
    expect(result.current).toEqual({
      translated: '',
      original: '',
      isTranslated: false,
    });
  });

  it('should return both translated and original name', () => {
    const { result } = renderHook(() => useCelestialNameWithOriginal('Polaris'));
    expect(result.current.original).toBe('Polaris');
    expect(result.current.translated).toBe('Polaris');
    expect(result.current.isTranslated).toBe(false);
  });
});

describe('useSkyCultureLanguage', () => {
  it('should return current sky culture language', () => {
    const { result } = renderHook(() => useSkyCultureLanguage());
    expect(result.current).toBe('en');
  });
});

describe('getCelestialNameTranslation', () => {
  it('should translate name using provided language', () => {
    const result = getCelestialNameTranslation('Polaris', 'zh');
    expect(result).toBe('北极星');
  });

  it('should return original name for english', () => {
    const result = getCelestialNameTranslation('Polaris', 'en');
    expect(result).toBe('Polaris');
  });

  it('should return original name if no translation found', () => {
    const result = getCelestialNameTranslation('Unknown Star', 'zh');
    expect(result).toBe('Unknown Star');
  });
});
