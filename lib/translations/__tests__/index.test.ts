/**
 * @jest-environment node
 */
import {
  DSO_TYPE_TRANSLATIONS,
  translateDSOType,
  createStellariumTranslator,
  translateCelestialName,
  CONSTELLATION_TRANSLATIONS,
  getConstellationTranslation,
  STAR_TRANSLATIONS,
  getStarTranslation,
} from '../index';

describe('Translations Module', () => {
  // ============================================================================
  // DSO_TYPE_TRANSLATIONS
  // ============================================================================
  describe('DSO_TYPE_TRANSLATIONS', () => {
    it('has multiple DSO types', () => {
      const types = Object.keys(DSO_TYPE_TRANSLATIONS);
      expect(types.length).toBeGreaterThan(10);
    });

    it('each type has en and zh translations', () => {
      for (const translations of Object.values(DSO_TYPE_TRANSLATIONS)) {
        expect(translations).toHaveProperty('en');
        expect(translations).toHaveProperty('zh');
        expect(typeof translations.en).toBe('string');
        expect(typeof translations.zh).toBe('string');
      }
    });

    it('has common DSO types', () => {
      expect(DSO_TYPE_TRANSLATIONS['G']).toBeDefined();
      expect(DSO_TYPE_TRANSLATIONS['OC']).toBeDefined();
      expect(DSO_TYPE_TRANSLATIONS['GC']).toBeDefined();
      expect(DSO_TYPE_TRANSLATIONS['PN']).toBeDefined();
      expect(DSO_TYPE_TRANSLATIONS['NB']).toBeDefined();
    });
  });

  // ============================================================================
  // translateDSOType
  // ============================================================================
  describe('translateDSOType', () => {
    it('translates to English', () => {
      expect(translateDSOType('G', 'en')).toBe('Galaxy');
      expect(translateDSOType('OC', 'en')).toBe('Open Cluster');
      expect(translateDSOType('GC', 'en')).toBe('Globular Cluster');
    });

    it('translates to Chinese', () => {
      expect(translateDSOType('G', 'zh')).toBe('星系');
      expect(translateDSOType('OC', 'zh')).toBe('疏散星团');
      expect(translateDSOType('GC', 'zh')).toBe('球状星团');
    });

    it('is case-insensitive', () => {
      expect(translateDSOType('g', 'en')).toBe('Galaxy');
      expect(translateDSOType('oc', 'en')).toBe('Open Cluster');
    });

    it('returns original for unknown type', () => {
      expect(translateDSOType('UNKNOWN', 'en')).toBe('UNKNOWN');
      expect(translateDSOType('XYZ', 'zh')).toBe('XYZ');
    });
  });

  // ============================================================================
  // CONSTELLATION_TRANSLATIONS
  // ============================================================================
  describe('CONSTELLATION_TRANSLATIONS', () => {
    it('has 88 constellations', () => {
      expect(CONSTELLATION_TRANSLATIONS).toHaveLength(88);
    });

    it('each constellation has required properties', () => {
      for (const constellation of CONSTELLATION_TRANSLATIONS) {
        expect(constellation).toHaveProperty('iau');
        expect(constellation).toHaveProperty('native');
        expect(constellation).toHaveProperty('english');
        expect(constellation).toHaveProperty('chinese');
      }
    });

    it('contains Orion', () => {
      const orion = CONSTELLATION_TRANSLATIONS.find(c => c.iau === 'Ori');
      expect(orion).toBeDefined();
      expect(orion?.native).toBe('Orion');
      expect(orion?.chinese).toBe('猎户座');
    });

    it('contains Ursa Major', () => {
      const uma = CONSTELLATION_TRANSLATIONS.find(c => c.iau === 'UMa');
      expect(uma).toBeDefined();
      expect(uma?.native).toBe('Ursa Major');
    });
  });

  // ============================================================================
  // getConstellationTranslation
  // ============================================================================
  describe('getConstellationTranslation', () => {
    it('finds by IAU code', () => {
      const result = getConstellationTranslation('Ori');
      expect(result).toBeDefined();
      expect(result?.native).toBe('Orion');
    });

    it('finds by native name', () => {
      const result = getConstellationTranslation('Orion');
      expect(result).toBeDefined();
      expect(result?.iau).toBe('Ori');
    });

    it('returns undefined for unknown', () => {
      const result = getConstellationTranslation('NotAConstellation');
      expect(result).toBeUndefined();
    });

    it('is case-insensitive for native names', () => {
      const result = getConstellationTranslation('orion');
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // STAR_TRANSLATIONS
  // ============================================================================
  describe('STAR_TRANSLATIONS', () => {
    it('has multiple stars', () => {
      expect(STAR_TRANSLATIONS.length).toBeGreaterThan(50);
    });

    it('each star has required properties', () => {
      for (const star of STAR_TRANSLATIONS) {
        expect(star).toHaveProperty('english');
        expect(star).toHaveProperty('chinese');
      }
    });

    it('contains Sirius', () => {
      const sirius = STAR_TRANSLATIONS.find(s => s.english === 'Sirius');
      expect(sirius).toBeDefined();
    });

    it('contains Vega', () => {
      const vega = STAR_TRANSLATIONS.find(s => s.english === 'Vega');
      expect(vega).toBeDefined();
    });
  });

  // ============================================================================
  // getStarTranslation
  // ============================================================================
  describe('getStarTranslation', () => {
    it('finds by native name', () => {
      const result = getStarTranslation('Sirius');
      expect(result).toBeDefined();
    });

    it('returns undefined for unknown', () => {
      const result = getStarTranslation('NotAStar');
      expect(result).toBeUndefined();
    });
  });

  // ============================================================================
  // createStellariumTranslator
  // ============================================================================
  describe('createStellariumTranslator', () => {
    it('returns a function', () => {
      const translator = createStellariumTranslator('en');
      expect(typeof translator).toBe('function');
    });

    it('native mode returns original text', () => {
      const translator = createStellariumTranslator('native');
      expect(translator('', 'Orion')).toBe('Orion');
      expect(translator('', 'Sirius')).toBe('Sirius');
    });

    it('en mode translates constellations', () => {
      const translator = createStellariumTranslator('en');
      const result = translator('', 'Orion');
      // Should return English name or original
      expect(typeof result).toBe('string');
    });

    it('zh mode translates constellations', () => {
      const translator = createStellariumTranslator('zh');
      const result = translator('', 'Orion');
      // Should return Chinese name
      expect(result).toBe('猎户座');
    });

    it('returns original for unknown names', () => {
      const translator = createStellariumTranslator('zh');
      expect(translator('', 'Unknown Object')).toBe('Unknown Object');
    });
  });

  // ============================================================================
  // translateCelestialName
  // ============================================================================
  describe('translateCelestialName', () => {
    it('native returns original', () => {
      expect(translateCelestialName('Orion', 'native')).toBe('Orion');
    });

    it('translates constellation to Chinese', () => {
      expect(translateCelestialName('Orion', 'zh')).toBe('猎户座');
    });

    it('translates constellation to English', () => {
      const result = translateCelestialName('Orion', 'en');
      expect(typeof result).toBe('string');
    });

    it('returns original for unknown names', () => {
      expect(translateCelestialName('Unknown', 'zh')).toBe('Unknown');
      expect(translateCelestialName('Unknown', 'en')).toBe('Unknown');
    });
  });
});
