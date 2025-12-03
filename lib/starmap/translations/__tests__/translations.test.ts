/**
 * @jest-environment jsdom
 */
import {
  CONSTELLATION_TRANSLATIONS,
  getConstellationTranslation,
  translateConstellationName,
} from '../constellations';
import {
  STAR_TRANSLATIONS,
  getStarTranslation,
  translateStarName,
} from '../stars';
import {
  DSO_TYPE_TRANSLATIONS,
  translateDSOType,
  translateCelestialName,
  createStellariumTranslator,
} from '../index';

describe('Constellation Translations', () => {
  describe('CONSTELLATION_TRANSLATIONS', () => {
    it('contains 88 constellations', () => {
      expect(CONSTELLATION_TRANSLATIONS.length).toBe(88);
    });

    it('each constellation has required fields', () => {
      CONSTELLATION_TRANSLATIONS.forEach((c) => {
        expect(c).toHaveProperty('iau');
        expect(c).toHaveProperty('native');
        expect(c).toHaveProperty('english');
        expect(c).toHaveProperty('chinese');
        expect(c.iau.length).toBe(3);
      });
    });

    it('contains Orion', () => {
      const orion = CONSTELLATION_TRANSLATIONS.find((c) => c.iau === 'Ori');
      expect(orion).toBeDefined();
      expect(orion?.native).toBe('Orion');
      expect(orion?.chinese).toBe('猎户座');
    });

    it('contains Ursa Major', () => {
      const uma = CONSTELLATION_TRANSLATIONS.find((c) => c.iau === 'UMa');
      expect(uma).toBeDefined();
      expect(uma?.native).toBe('Ursa Major');
      expect(uma?.chinese).toBe('大熊座');
    });
  });

  describe('getConstellationTranslation', () => {
    it('finds constellation by IAU code', () => {
      const result = getConstellationTranslation('Ori');
      expect(result).not.toBeNull();
      expect(result?.native).toBe('Orion');
    });

    it('finds constellation by native name', () => {
      const result = getConstellationTranslation('Orion');
      expect(result).not.toBeNull();
      expect(result?.iau).toBe('Ori');
    });

    it('is case insensitive', () => {
      const result1 = getConstellationTranslation('orion');
      const result2 = getConstellationTranslation('ORION');
      expect(result1).toEqual(result2);
    });

    it('returns undefined for unknown constellation', () => {
      const result = getConstellationTranslation('Unknown XYZ123');
      expect(result).toBeUndefined();
    });
  });

  describe('translateConstellationName', () => {
    it('translates to Chinese', () => {
      const result = translateConstellationName('Orion', 'zh');
      expect(result).toBe('猎户座');
    });

    it('translates to English', () => {
      const result = translateConstellationName('Orion', 'en');
      expect(result).toBe('Hunter');
    });

    it('returns native name for native language', () => {
      const result = translateConstellationName('Orion', 'native');
      expect(result).toBe('Orion');
    });

    it('returns original for unknown constellation', () => {
      const result = translateConstellationName('Unknown', 'zh');
      expect(result).toBe('Unknown');
    });
  });
});

describe('Star Translations', () => {
  describe('STAR_TRANSLATIONS', () => {
    it('is an array', () => {
      expect(Array.isArray(STAR_TRANSLATIONS)).toBe(true);
    });

    it('contains famous stars', () => {
      const sirius = STAR_TRANSLATIONS.find((s) => s.english === 'Sirius');
      expect(sirius).toBeDefined();
    });
  });

  describe('getStarTranslation', () => {
    it('finds star by name', () => {
      const result = getStarTranslation('Sirius');
      expect(result).toBeDefined();
    });

    it('is case insensitive', () => {
      const result1 = getStarTranslation('sirius');
      const result2 = getStarTranslation('SIRIUS');
      expect(result1).toEqual(result2);
    });

    it('returns undefined for unknown star', () => {
      const result = getStarTranslation('Unknown Star XYZ123');
      expect(result).toBeUndefined();
    });
  });

  describe('translateStarName', () => {
    it('translates to Chinese', () => {
      const result = translateStarName('Sirius', 'zh');
      expect(result).toBe('天狼星');
    });

    it('returns English name for en language', () => {
      const result = translateStarName('Sirius', 'en');
      expect(result).toBe('Sirius');
    });
  });
});

describe('DSO Type Translations', () => {
  describe('DSO_TYPE_TRANSLATIONS', () => {
    it('contains galaxy type', () => {
      expect(DSO_TYPE_TRANSLATIONS['G']).toBeDefined();
      expect(DSO_TYPE_TRANSLATIONS['G'].en).toBe('Galaxy');
      expect(DSO_TYPE_TRANSLATIONS['G'].zh).toBe('星系');
    });

    it('contains nebula types', () => {
      expect(DSO_TYPE_TRANSLATIONS['PN']).toBeDefined();
      expect(DSO_TYPE_TRANSLATIONS['EN']).toBeDefined();
      expect(DSO_TYPE_TRANSLATIONS['RN']).toBeDefined();
    });

    it('contains cluster types', () => {
      expect(DSO_TYPE_TRANSLATIONS['OC']).toBeDefined();
      expect(DSO_TYPE_TRANSLATIONS['GC']).toBeDefined();
    });
  });

  describe('translateDSOType', () => {
    it('translates galaxy to Chinese', () => {
      expect(translateDSOType('G', 'zh')).toBe('星系');
    });

    it('translates galaxy to English', () => {
      expect(translateDSOType('G', 'en')).toBe('Galaxy');
    });

    it('is case insensitive', () => {
      expect(translateDSOType('g', 'en')).toBe('Galaxy');
      expect(translateDSOType('GX', 'en')).toBe('Galaxy');
    });

    it('returns original for unknown type', () => {
      expect(translateDSOType('UNKNOWN', 'en')).toBe('UNKNOWN');
    });
  });
});

describe('translateCelestialName', () => {
  it('translates constellation names', () => {
    const result = translateCelestialName('Orion', 'zh');
    expect(result).toBe('猎户座');
  });

  it('translates star names', () => {
    const result = translateCelestialName('Sirius', 'zh');
    expect(result).not.toBe('Sirius');
  });

  it('returns original for native language', () => {
    const result = translateCelestialName('Orion', 'native');
    expect(result).toBe('Orion');
  });

  it('returns original for unknown names', () => {
    const result = translateCelestialName('Unknown Object', 'zh');
    expect(result).toBe('Unknown Object');
  });
});

describe('createStellariumTranslator', () => {
  it('returns a function', () => {
    const translator = createStellariumTranslator('zh');
    expect(typeof translator).toBe('function');
  });

  it('translates constellation names', () => {
    const translator = createStellariumTranslator('zh');
    const result = translator('sky_culture', 'Orion');
    expect(result).toBe('猎户座');
  });

  it('returns original for native language', () => {
    const translator = createStellariumTranslator('native');
    const result = translator('sky_culture', 'Orion');
    expect(result).toBe('Orion');
  });

  it('returns original for unknown names', () => {
    const translator = createStellariumTranslator('zh');
    const result = translator('sky_culture', 'Unknown');
    expect(result).toBe('Unknown');
  });
});
