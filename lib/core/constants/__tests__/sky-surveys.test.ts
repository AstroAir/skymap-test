/**
 * @jest-environment node
 */
import {
  SKY_SURVEYS,
  getSurveyById,
  getSurveysByCategory,
  getDefaultSurvey,
} from '../sky-surveys';

describe('Sky Surveys', () => {
  // ============================================================================
  // SKY_SURVEYS constant
  // ============================================================================
  describe('SKY_SURVEYS', () => {
    it('has multiple surveys', () => {
      expect(SKY_SURVEYS.length).toBeGreaterThan(0);
    });

    it('each survey has required properties', () => {
      for (const survey of SKY_SURVEYS) {
        expect(survey).toHaveProperty('id');
        expect(survey).toHaveProperty('name');
        expect(survey).toHaveProperty('url');
        expect(survey).toHaveProperty('description');
        expect(survey).toHaveProperty('category');
      }
    });

    it('all IDs are unique', () => {
      const ids = SKY_SURVEYS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all URLs are valid format', () => {
      for (const survey of SKY_SURVEYS) {
        expect(survey.url).toMatch(/^https?:\/\//);
      }
    });

    it('has optical surveys', () => {
      const optical = SKY_SURVEYS.filter(s => s.category === 'optical');
      expect(optical.length).toBeGreaterThan(0);
    });

    it('has infrared surveys', () => {
      const infrared = SKY_SURVEYS.filter(s => s.category === 'infrared');
      expect(infrared.length).toBeGreaterThan(0);
    });

    it('category is valid', () => {
      const validCategories = ['optical', 'infrared', 'other'];
      for (const survey of SKY_SURVEYS) {
        expect(validCategories).toContain(survey.category);
      }
    });

    it('contains DSS survey', () => {
      const dss = SKY_SURVEYS.find(s => s.id === 'dss');
      expect(dss).toBeDefined();
      expect(dss?.name).toContain('DSS');
    });

    it('contains 2MASS survey', () => {
      const twomass = SKY_SURVEYS.find(s => s.id === '2mass');
      expect(twomass).toBeDefined();
      expect(twomass?.category).toBe('infrared');
    });
  });

  // ============================================================================
  // getSurveyById
  // ============================================================================
  describe('getSurveyById', () => {
    it('returns correct survey for valid ID', () => {
      const survey = getSurveyById('dss');
      expect(survey).toBeDefined();
      expect(survey?.id).toBe('dss');
    });

    it('returns undefined for invalid ID', () => {
      expect(getSurveyById('invalid-survey')).toBeUndefined();
      expect(getSurveyById('')).toBeUndefined();
    });

    it('returns correct survey for all valid IDs', () => {
      for (const survey of SKY_SURVEYS) {
        const found = getSurveyById(survey.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(survey.id);
        expect(found?.name).toBe(survey.name);
      }
    });

    it('is case-sensitive', () => {
      expect(getSurveyById('DSS')).toBeUndefined();
    });
  });

  // ============================================================================
  // getSurveysByCategory
  // ============================================================================
  describe('getSurveysByCategory', () => {
    it('returns optical surveys', () => {
      const optical = getSurveysByCategory('optical');
      expect(optical.length).toBeGreaterThan(0);
      for (const survey of optical) {
        expect(survey.category).toBe('optical');
      }
    });

    it('returns infrared surveys', () => {
      const infrared = getSurveysByCategory('infrared');
      expect(infrared.length).toBeGreaterThan(0);
      for (const survey of infrared) {
        expect(survey.category).toBe('infrared');
      }
    });

    it('returns other surveys', () => {
      const other = getSurveysByCategory('other');
      expect(other.length).toBeGreaterThan(0);
      for (const survey of other) {
        expect(survey.category).toBe('other');
      }
    });

    it('total surveys equals sum of categories', () => {
      const optical = getSurveysByCategory('optical').length;
      const infrared = getSurveysByCategory('infrared').length;
      const other = getSurveysByCategory('other').length;
      
      expect(optical + infrared + other).toBe(SKY_SURVEYS.length);
    });
  });

  // ============================================================================
  // getDefaultSurvey
  // ============================================================================
  describe('getDefaultSurvey', () => {
    it('returns a survey', () => {
      const survey = getDefaultSurvey();
      expect(survey).toBeDefined();
    });

    it('returns survey with required properties', () => {
      const survey = getDefaultSurvey();
      expect(survey).toHaveProperty('id');
      expect(survey).toHaveProperty('name');
      expect(survey).toHaveProperty('url');
      expect(survey).toHaveProperty('description');
      expect(survey).toHaveProperty('category');
    });

    it('returns first survey in list', () => {
      const survey = getDefaultSurvey();
      expect(survey.id).toBe(SKY_SURVEYS[0].id);
    });

    it('returns DSS as default', () => {
      const survey = getDefaultSurvey();
      expect(survey.id).toBe('dss');
    });
  });
});
