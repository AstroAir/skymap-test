/**
 * Stellarium translations module
 * Provides localized names for celestial objects
 */

export {
  CONSTELLATION_TRANSLATIONS,
  getConstellationTranslation,
  translateConstellationName,
  type ConstellationTranslation,
} from './constellations';

export {
  STAR_TRANSLATIONS,
  getStarTranslation,
  translateStarName,
  type StarTranslation,
} from './stars';

import { getConstellationTranslation } from './constellations';
import { getStarTranslation } from './stars';

/**
 * DSO type translations
 */
export const DSO_TYPE_TRANSLATIONS: Record<string, { en: string; zh: string }> = {
  'G': { en: 'Galaxy', zh: '星系' },
  'GX': { en: 'Galaxy', zh: '星系' },
  'OC': { en: 'Open Cluster', zh: '疏散星团' },
  'GC': { en: 'Globular Cluster', zh: '球状星团' },
  'PN': { en: 'Planetary Nebula', zh: '行星状星云' },
  'NB': { en: 'Nebula', zh: '星云' },
  'EN': { en: 'Emission Nebula', zh: '发射星云' },
  'RN': { en: 'Reflection Nebula', zh: '反射星云' },
  'DN': { en: 'Dark Nebula', zh: '暗星云' },
  'SNR': { en: 'Supernova Remnant', zh: '超新星遗迹' },
  'BN': { en: 'Bright Nebula', zh: '亮星云' },
  'HII': { en: 'HII Region', zh: 'HII区' },
  'AGN': { en: 'Active Galactic Nucleus', zh: '活动星系核' },
  'QSO': { en: 'Quasar', zh: '类星体' },
  'AST': { en: 'Asterism', zh: '星群' },
  'STAR': { en: 'Star', zh: '恒星' },
  'MULT': { en: 'Multiple Star', zh: '聚星' },
  'VAR': { en: 'Variable Star', zh: '变星' },
  'NOVA': { en: 'Nova', zh: '新星' },
};

/**
 * Translate DSO type
 */
export function translateDSOType(type: string, targetLang: 'zh' | 'en'): string {
  const translation = DSO_TYPE_TRANSLATIONS[type.toUpperCase()];
  if (!translation) return type;
  return targetLang === 'zh' ? translation.zh : translation.en;
}

/**
 * Supported sky culture name languages
 */
export type SkyCultureLanguage = 'native' | 'en' | 'zh';

/**
 * Create a translation function for Stellarium engine
 * This function is called by the engine to translate object names
 */
export function createStellariumTranslator(language: SkyCultureLanguage) {
  return (domain: string, text: string): string => {
    if (language === 'native') {
      return text; // Return original text (Latin names)
    }

    // Try constellation translation
    const constellationMatch = getConstellationTranslation(text);
    if (constellationMatch) {
      if (language === 'zh') return constellationMatch.chinese;
      if (language === 'en') return constellationMatch.english;
    }

    // Try star translation
    const starMatch = getStarTranslation(text);
    if (starMatch) {
      if (language === 'zh') return starMatch.chinese;
      if (language === 'en') return starMatch.english;
    }

    // Return original if no translation found
    return text;
  };
}

/**
 * Translate any celestial object name
 * Tries constellation, then star, then returns original
 */
export function translateCelestialName(
  name: string,
  targetLang: SkyCultureLanguage
): string {
  if (targetLang === 'native') return name;

  // Try constellation
  const constellation = getConstellationTranslation(name);
  if (constellation) {
    return targetLang === 'zh' ? constellation.chinese : constellation.english;
  }

  // Try star
  const star = getStarTranslation(name);
  if (star) {
    return targetLang === 'zh' ? star.chinese : star.english;
  }

  return name;
}

/**
 * Update the Stellarium engine's translation function at runtime
 * This allows changing the display language without reloading the engine
 */
export function updateStellariumTranslation(language: SkyCultureLanguage): void {
  // Check if Module is available (Stellarium engine loaded)
  const Module = (window as unknown as { Module?: {
    translateFn?: (domain: string, text: string) => string;
    translationsCache?: Record<string, number>;
    addFunction?: (fn: (user: number, domain: number, str: number) => number, sig: string) => number;
    _sys_set_translate_function?: (callback: number) => void;
    UTF8ToString?: (ptr: number) => string;
    lengthBytesUTF8?: (str: string) => number;
    _malloc?: (size: number) => number;
    stringToUTF8?: (str: string, ptr: number, size: number) => void;
  }}).Module;

  if (!Module || !Module._sys_set_translate_function || !Module.addFunction) {
    console.warn('Stellarium Module not available for translation update');
    return;
  }

  try {
    // Create new translator function
    const translateFn = createStellariumTranslator(language);
    
    // Clear translation cache
    Module.translationsCache = {};
    
    // Create new callback
    const callback = Module.addFunction(function(user: number, domain: number, str: number) {
      const domainStr = Module.UTF8ToString!(domain);
      const strValue = Module.UTF8ToString!(str);
      const translated = translateFn(domainStr, strValue);
      
      // Check cache
      let value = Module.translationsCache![translated];
      if (value) return value;
      
      // Allocate and store translated string
      const size = Module.lengthBytesUTF8!(translated) + 1;
      value = Module._malloc!(size);
      Module.stringToUTF8!(translated, value, size);
      Module.translationsCache![translated] = value;
      return value;
    }, 'iiii');
    
    // Set the new translation function
    Module._sys_set_translate_function(callback);
    console.log('Stellarium translation updated to:', language);
  } catch (error) {
    console.error('Failed to update Stellarium translation:', error);
  }
}
