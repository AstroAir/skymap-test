/**
 * @jest-environment jsdom
 */
import { SKY_SURVEYS, type SkySurvey, type StellariumSettings } from '../types';

describe('SKY_SURVEYS', () => {
  it('is an array', () => {
    expect(Array.isArray(SKY_SURVEYS)).toBe(true);
  });

  it('has at least one survey', () => {
    expect(SKY_SURVEYS.length).toBeGreaterThan(0);
  });

  it('contains DSS survey', () => {
    const dss = SKY_SURVEYS.find((s) => s.id === 'dss');
    expect(dss).toBeDefined();
    expect(dss?.name).toContain('DSS');
    expect(dss?.category).toBe('optical');
  });

  it('contains 2MASS survey', () => {
    const twoMass = SKY_SURVEYS.find((s) => s.id === '2mass');
    expect(twoMass).toBeDefined();
    expect(twoMass?.category).toBe('infrared');
  });

  it('all surveys have required properties', () => {
    SKY_SURVEYS.forEach((survey: SkySurvey) => {
      expect(survey).toHaveProperty('id');
      expect(survey).toHaveProperty('name');
      expect(survey).toHaveProperty('url');
      expect(survey).toHaveProperty('description');
      expect(survey).toHaveProperty('category');
      expect(['optical', 'infrared', 'other']).toContain(survey.category);
    });
  });

  it('all survey URLs are valid', () => {
    SKY_SURVEYS.forEach((survey: SkySurvey) => {
      expect(survey.url).toMatch(/^https?:\/\//);
    });
  });

  it('all survey IDs are unique', () => {
    const ids = SKY_SURVEYS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('contains optical surveys', () => {
    const opticalSurveys = SKY_SURVEYS.filter((s) => s.category === 'optical');
    expect(opticalSurveys.length).toBeGreaterThan(0);
  });

  it('contains infrared surveys', () => {
    const infraredSurveys = SKY_SURVEYS.filter((s) => s.category === 'infrared');
    expect(infraredSurveys.length).toBeGreaterThan(0);
  });
});

describe('Type Definitions', () => {
  it('StellariumSettings has correct shape', () => {
    const settings: StellariumSettings = {
      constellationsLinesVisible: true,
      azimuthalLinesVisible: false,
      equatorialLinesVisible: true,
      meridianLinesVisible: false,
      eclipticLinesVisible: true,
      atmosphereVisible: true,
      landscapesVisible: false,
      dsosVisible: true,
      surveyEnabled: true,
      surveyId: 'dss',
      skyCultureLanguage: 'native',
    };

    expect(settings.constellationsLinesVisible).toBe(true);
    expect(settings.surveyId).toBe('dss');
    expect(settings.skyCultureLanguage).toBe('native');
  });

  it('SkyCultureLanguage accepts valid values', () => {
    const languages: Array<'native' | 'en' | 'zh'> = ['native', 'en', 'zh'];
    languages.forEach((lang) => {
      const settings: StellariumSettings = {
        constellationsLinesVisible: true,
        azimuthalLinesVisible: false,
        equatorialLinesVisible: true,
        meridianLinesVisible: false,
        eclipticLinesVisible: true,
        atmosphereVisible: true,
        landscapesVisible: false,
        dsosVisible: true,
        surveyEnabled: true,
        surveyId: 'dss',
        skyCultureLanguage: lang,
      };
      expect(settings.skyCultureLanguage).toBe(lang);
    });
  });
});
