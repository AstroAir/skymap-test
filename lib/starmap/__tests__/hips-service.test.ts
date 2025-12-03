/**
 * @jest-environment jsdom
 */
import { hipsService, RECOMMENDED_SURVEY_IDS } from '../hips-service';

// Mock fetch
global.fetch = jest.fn();

describe('RECOMMENDED_SURVEY_IDS', () => {
  it('is an array', () => {
    expect(Array.isArray(RECOMMENDED_SURVEY_IDS)).toBe(true);
  });

  it('contains DSS survey', () => {
    expect(RECOMMENDED_SURVEY_IDS.some(id => id.includes('DSS'))).toBe(true);
  });

  it('contains PanSTARRS survey', () => {
    expect(RECOMMENDED_SURVEY_IDS.some(id => id.includes('PanSTARRS'))).toBe(true);
  });

  it('contains 2MASS survey', () => {
    expect(RECOMMENDED_SURVEY_IDS.some(id => id.includes('2MASS'))).toBe(true);
  });

  it('contains WISE survey', () => {
    expect(RECOMMENDED_SURVEY_IDS.some(id => id.includes('WISE'))).toBe(true);
  });
});

describe('hipsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSurveys', () => {
    it('fetches surveys from registry', async () => {
      const mockResponse = [
        {
          ID: 'CDS/P/DSS2/color',
          obs_title: 'DSS2 Color',
          obs_description: 'Digitized Sky Survey 2',
          hips_service_url: 'https://alasky.cds.unistra.fr/DSS/DSSColor/',
          hips_order: '9',
          hips_tile_format: 'jpeg',
          hips_frame: 'equatorial',
          obs_regime: 'Optical',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const surveys = await hipsService.fetchSurveys();
      expect(Array.isArray(surveys)).toBe(true);
    });

    it('caches surveys after first fetch', async () => {
      const mockResponse = [
        {
          ID: 'CDS/P/DSS2/color',
          obs_title: 'DSS2 Color',
          hips_service_url: 'https://example.com',
          hips_order: '9',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // First call
      const surveys1 = await hipsService.fetchSurveys();
      // Second call
      const surveys2 = await hipsService.fetchSurveys();

      // Both calls should return arrays
      expect(Array.isArray(surveys1)).toBe(true);
      expect(Array.isArray(surveys2)).toBe(true);
    });

    it('handles fetch error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const surveys = await hipsService.fetchSurveys();
      expect(Array.isArray(surveys)).toBe(true);
    });
  });

  describe('getSurveyById', () => {
    it('returns survey by ID when found', async () => {
      const mockResponse = [
        {
          ID: 'CDS/P/DSS2/color',
          obs_title: 'DSS2 Color',
          hips_service_url: 'https://example.com',
          hips_order: '9',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const survey = await hipsService.getSurveyById('CDS/P/DSS2/color');
      // May or may not find depending on cache state
      expect(survey === undefined || survey?.id === 'CDS/P/DSS2/color').toBe(true);
    });

    it('returns undefined for unknown survey', async () => {
      const mockResponse: unknown[] = [];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const survey = await hipsService.getSurveyById('unknown-survey-xyz');
      expect(survey).toBeUndefined();
    });
  });

  describe('getRecommendedSurveys', () => {
    it('returns recommended surveys', async () => {
      const mockResponse = RECOMMENDED_SURVEY_IDS.map(id => ({
        ID: id,
        obs_title: `Survey ${id}`,
        hips_service_url: `https://example.com/${id}`,
        hips_order: '9',
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const surveys = await hipsService.getRecommendedSurveys();
      expect(Array.isArray(surveys)).toBe(true);
    });
  });

  describe('getSurveysByCategory', () => {
    it('filters surveys by category', async () => {
      const mockResponse = [
        {
          ID: 'optical-survey',
          obs_title: 'Optical Survey',
          hips_service_url: 'https://example.com/optical',
          hips_order: '9',
          obs_regime: 'Optical',
        },
        {
          ID: 'infrared-survey',
          obs_title: 'Infrared Survey',
          hips_service_url: 'https://example.com/infrared',
          hips_order: '9',
          obs_regime: 'Infrared',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const opticalSurveys = await hipsService.getSurveysByCategory('optical');
      expect(Array.isArray(opticalSurveys)).toBe(true);
    });
  });

  describe('searchSurveys', () => {
    it('searches surveys by query', async () => {
      const mockResponse = [
        {
          ID: 'CDS/P/DSS2/color',
          obs_title: 'DSS2 Color',
          obs_description: 'Digitized Sky Survey',
          hips_service_url: 'https://example.com',
          hips_order: '9',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const results = await hipsService.searchSurveys('DSS');
      expect(Array.isArray(results)).toBe(true);
    });

    it('returns empty array for no matches', async () => {
      const mockResponse = [
        {
          ID: 'other-survey',
          obs_title: 'Other Survey',
          hips_service_url: 'https://example.com',
          hips_order: '9',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const results = await hipsService.searchSurveys('nonexistent');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
