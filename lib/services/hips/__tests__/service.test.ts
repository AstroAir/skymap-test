import {
  DEFAULT_SURVEYS,
  fetchRegistry,
  getSurveysByCategory,
  getRecommendedSurveys,
  getSurveyById,
  getDefaultSurvey,
  getTileUrl,
  estimateCacheSize,
  __resetRegistryCacheForTests,
} from '../service';
import type { HiPSSurvey } from '../types';

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({ warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() }),
}));

const mockFetchGlobal = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetchGlobal as unknown as typeof fetch;
  __resetRegistryCacheForTests();
});

function makeRegistryEntries() {
  return [
    {
      ID: 'CDS/P/DSS2/color',
      obs_title: 'DSS2 Color',
      hips_service_url: 'https://alasky.cds.unistra.fr/DSS/DSSColor/',
      hips_order: '9',
      hips_tile_format: 'jpeg',
      obs_regime: 'Optical',
    },
    {
      ID: 'CDS/P/2MASS/color',
      obs_title: '2MASS Color',
      hips_service_url: 'https://alasky.cds.unistra.fr/2MASS/Color/',
      hips_order: '9',
      hips_tile_format: 'png jpeg',
      obs_regime: 'Infrared',
    },
    {
      ID: 'CDS/P/Fermi/color',
      obs_title: 'Fermi Color',
      hips_service_url: 'https://alasky.cds.unistra.fr/Fermi/Color/',
      obs_regime: 'Gamma-ray',
    },
    {
      ID: 'CDS/P/Empty',
      obs_title: '',
      hips_service_url: '',
    },
  ];
}

describe('hips/service', () => {
  describe('DEFAULT_SURVEYS', () => {
    it('contains at least 5 surveys', () => {
      expect(DEFAULT_SURVEYS.length).toBeGreaterThanOrEqual(5);
    });

    it('has a survey marked as default', () => {
      expect(DEFAULT_SURVEYS.some((s) => s.isDefault === true)).toBe(true);
    });

    it('has surveys with required fields', () => {
      for (const survey of DEFAULT_SURVEYS) {
        expect(survey.id).toBeTruthy();
        expect(survey.name).toBeTruthy();
        expect(survey.url).toBeTruthy();
        expect(survey.category).toBeTruthy();
      }
    });
  });

  describe('getRecommendedSurveys', () => {
    it('returns DEFAULT_SURVEYS', () => {
      expect(getRecommendedSurveys()).toBe(DEFAULT_SURVEYS);
    });
  });

  describe('getDefaultSurvey', () => {
    it('returns the survey marked as isDefault', () => {
      const survey = getDefaultSurvey();
      expect(survey.isDefault).toBe(true);
      expect(survey.id).toBe('dss-color');
    });
  });

  describe('getTileUrl', () => {
    const survey: HiPSSurvey = {
      id: 'test-survey',
      name: 'Test',
      url: 'https://example.com/hips',
      category: 'optical',
    };

    it('generates correct tile URL with default jpg format', () => {
      expect(getTileUrl(survey, 3, 42)).toBe('https://example.com/hips/Norder3/Dir0/Npix42.jpg');
    });

    it('generates correct tile URL with png format', () => {
      expect(getTileUrl(survey, 5, 12345, 'png')).toBe('https://example.com/hips/Norder5/Dir10000/Npix12345.png');
    });

    it('calculates Dir correctly for large pixel indices', () => {
      expect(getTileUrl(survey, 8, 25000)).toBe('https://example.com/hips/Norder8/Dir20000/Npix25000.jpg');
    });

    it('handles pixel index 0', () => {
      expect(getTileUrl(survey, 0, 0)).toBe('https://example.com/hips/Norder0/Dir0/Npix0.jpg');
    });
  });

  describe('estimateCacheSize', () => {
    it('returns positive number', () => {
      expect(estimateCacheSize(3)).toBeGreaterThan(0);
    });

    it('returns correct value for order 0', () => {
      expect(estimateCacheSize(0)).toBe(12 * 50 * 1024);
    });

    it('increases with higher order', () => {
      expect(estimateCacheSize(5)).toBeGreaterThan(estimateCacheSize(3));
    });

    it('calculates correctly for order 2', () => {
      const expected = (12 + 48 + 192) * 50 * 1024;
      expect(estimateCacheSize(2)).toBe(expected);
    });
  });

  describe('fetchRegistry', () => {
    it('fetches and parses registry entries', async () => {
      mockFetchGlobal.mockResolvedValue({
        ok: true,
        json: async () => makeRegistryEntries(),
      });

      const registry = await fetchRegistry();
      expect(registry.surveys.length).toBeGreaterThan(0);
      expect(registry.lastUpdated).toBeInstanceOf(Date);
      expect(registry.surveys.every((s) => s.name && s.url)).toBe(true);
    });

    it('parses category from obs_regime', async () => {
      mockFetchGlobal.mockResolvedValue({
        ok: true,
        json: async () => makeRegistryEntries(),
      });

      const registry = await fetchRegistry();
      const optical = registry.surveys.find((s) => s.name === 'DSS2 Color');
      const infrared = registry.surveys.find((s) => s.name === '2MASS Color');
      const gamma = registry.surveys.find((s) => s.name === 'Fermi Color');

      expect(optical?.category).toBe('optical');
      expect(infrared?.category).toBe('infrared');
      expect(gamma?.category).toBe('gamma');
    });

    it('parses tile format from hips_tile_format', async () => {
      mockFetchGlobal.mockResolvedValue({
        ok: true,
        json: async () => makeRegistryEntries(),
      });

      const registry = await fetchRegistry();
      const dss = registry.surveys.find((s) => s.name === 'DSS2 Color');
      const twoMass = registry.surveys.find((s) => s.name === '2MASS Color');

      expect(dss?.tileFormat).toBe('jpg');
      expect(twoMass?.tileFormat).toBe('png');
    });

    it('falls back to DEFAULT_SURVEYS on HTTP error', async () => {
      mockFetchGlobal.mockResolvedValue({ ok: false, status: 500 });

      const registry = await fetchRegistry();
      expect(registry.surveys).toEqual(DEFAULT_SURVEYS);
    });

    it('falls back to DEFAULT_SURVEYS on network error', async () => {
      mockFetchGlobal.mockRejectedValue(new Error('Network error'));

      const registry = await fetchRegistry();
      expect(registry.surveys).toEqual(DEFAULT_SURVEYS);
    });

    it('normalizes ID by replacing slashes with dashes', async () => {
      mockFetchGlobal.mockResolvedValue({
        ok: true,
        json: async () => makeRegistryEntries(),
      });

      const registry = await fetchRegistry();
      for (const survey of registry.surveys) {
        expect(survey.id).not.toContain('/');
      }
    });

    it('returns cached registry on subsequent calls', async () => {
      mockFetchGlobal.mockResolvedValue({
        ok: true,
        json: async () => makeRegistryEntries(),
      });

      const first = await fetchRegistry();
      const second = await fetchRegistry();
      expect(first).toBe(second);
      expect(mockFetchGlobal).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSurveysByCategory', () => {
    it('filters surveys by category', async () => {
      mockFetchGlobal.mockResolvedValue({
        ok: true,
        json: async () => makeRegistryEntries(),
      });

      const opticals = await getSurveysByCategory('optical');
      expect(opticals.every((s) => s.category === 'optical')).toBe(true);
      expect(opticals.length).toBeGreaterThan(0);
    });

    it('returns empty array for non-matching category', async () => {
      mockFetchGlobal.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            ID: 'CDS/P/DSS2',
            obs_title: 'DSS2',
            hips_service_url: 'https://example.com',
            obs_regime: 'Optical',
          },
        ],
      });

      const radio = await getSurveysByCategory('radio');
      expect(radio).toHaveLength(0);
    });
  });

  describe('getSurveyById', () => {
    it('returns survey when found', async () => {
      mockFetchGlobal.mockResolvedValue({
        ok: true,
        json: async () => makeRegistryEntries(),
      });

      const survey = await getSurveyById('CDS-P-DSS2-color');
      expect(survey).not.toBeNull();
      expect(survey!.name).toBe('DSS2 Color');
    });

    it('returns null when not found', async () => {
      mockFetchGlobal.mockResolvedValue({
        ok: true,
        json: async () => makeRegistryEntries(),
      });

      const survey = await getSurveyById('nonexistent-id');
      expect(survey).toBeNull();
    });
  });
});
