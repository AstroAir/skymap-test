/**
 * Unit tests for object-type-utils.ts
 * Tests unified object type classification utilities
 */

import {
  parseObjectTypeCategory,
  getObjectTypeDisplay,
  getObjectTypeIcon,
  getObjectTypeColor,
  getObjectTypeBadgeColor,
  getLegendItems,
  LEGEND_CATEGORIES,
  type ObjectTypeCategory,
} from '../object-type-utils';
import {
  Star,
  Globe2,
  Cloud,
  Sparkles,
  Orbit,
  CircleDot,
  Binary,
  Zap,
  Circle,
  Target,
  Rocket,
  Moon,
  Asterisk,
  Atom,
} from 'lucide-react';

describe('object-type-utils', () => {
  describe('parseObjectTypeCategory', () => {
    it('returns unknown for null/undefined input', () => {
      expect(parseObjectTypeCategory(null)).toBe('unknown');
      expect(parseObjectTypeCategory(undefined)).toBe('unknown');
      expect(parseObjectTypeCategory('')).toBe('unknown');
    });

    describe('galaxy types', () => {
      it.each([
        ['galaxy', 'galaxy'],
        ['Galaxy', 'galaxy'],
        ['GALAXY', 'galaxy'],
        ['gx', 'galaxy'],
        ['GX', 'galaxy'],
        ['g', 'galaxy'],
        ['spiral galaxy', 'galaxy'],
      ])('parses "%s" as %s', (input, expected) => {
        expect(parseObjectTypeCategory(input)).toBe(expected);
      });
    });

    describe('nebula types', () => {
      it.each([
        ['nebula', 'nebula'],
        ['Nebula', 'nebula'],
        ['neb', 'nebula'],
        ['hii', 'nebula'],
        ['HII region', 'nebula'],
        ['en', 'nebula'],
        ['rn', 'nebula'],
        ['emission nebula', 'nebula'],
      ])('parses "%s" as nebula', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('nebula');
      });

      it.each([
        ['planetary_nebula', 'planetary_nebula'],
        ['pn', 'planetary_nebula'],
        ['PN', 'planetary_nebula'],
        ['planetary nebula', 'planetary_nebula'],
      ])('parses "%s" as planetary_nebula', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('planetary_nebula');
      });

      it.each([
        ['supernova_remnant', 'supernova_remnant'],
        ['snr', 'supernova_remnant'],
        ['SNR', 'supernova_remnant'],
        ['supernova remnant', 'supernova_remnant'],
      ])('parses "%s" as supernova_remnant', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('supernova_remnant');
      });
    });

    describe('cluster types', () => {
      it.each([
        ['globular_cluster', 'globular_cluster'],
        ['gc', 'globular_cluster'],
        ['GC', 'globular_cluster'],
        ['globular cluster', 'globular_cluster'],
      ])('parses "%s" as globular_cluster', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('globular_cluster');
      });

      it.each([
        ['open_cluster', 'open_cluster'],
        ['oc', 'open_cluster'],
        ['OC', 'open_cluster'],
        ['open cluster', 'open_cluster'],
      ])('parses "%s" as open_cluster', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('open_cluster');
      });

      it.each([
        ['cluster', 'cluster'],
        ['as', 'cluster'],
        ['asterism', 'cluster'],
      ])('parses "%s" as cluster', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('cluster');
      });
    });

    describe('star types', () => {
      it.each([
        ['star', 'star'],
        ['Star', 'star'],
        ['*', 'star'],
        ['carbon star', 'star'],
        ['c*', 'star'],
      ])('parses "%s" as star', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('star');
      });

      it.each([
        ['double_star', 'double_star'],
        ['binary', 'double_star'],
        ['**', 'double_star'],
        ['ds', 'double_star'],
        ['double star', 'double_star'],
        ['binary star', 'double_star'],
      ])('parses "%s" as double_star', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('double_star');
      });

      it.each([
        ['variable_star', 'variable_star'],
        ['v*', 'variable_star'],
        ['var', 'variable_star'],
        ['variable star', 'variable_star'],
      ])('parses "%s" as variable_star', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('variable_star');
      });
    });

    describe('solar system types', () => {
      it.each([
        ['planet', 'planet'],
        ['Planet', 'planet'],
      ])('parses "%s" as planet', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('planet');
      });

      it.each([
        ['moon', 'moon'],
        ['Moon', 'moon'],
        ['satellite', 'moon'],
      ])('parses "%s" as moon', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('moon');
      });

      it.each([
        ['asteroid', 'asteroid'],
        ['Asteroid', 'asteroid'],
        ['minor_planet', 'asteroid'],
      ])('parses "%s" as asteroid', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('asteroid');
      });

      it.each([
        ['comet', 'comet'],
        ['Comet', 'comet'],
      ])('parses "%s" as comet', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('comet');
      });
    });

    describe('exotic types', () => {
      it.each([
        ['quasar', 'quasar'],
        ['Quasar', 'quasar'],
        ['agn', 'quasar'],
        ['AGN', 'quasar'],
        ['qso', 'quasar'],
      ])('parses "%s" as quasar', (input) => {
        expect(parseObjectTypeCategory(input)).toBe('quasar');
      });
    });
  });

  describe('getObjectTypeDisplay', () => {
    it('returns complete display config for each category', () => {
      const categories: ObjectTypeCategory[] = [
        'galaxy', 'nebula', 'planetary_nebula', 'supernova_remnant',
        'globular_cluster', 'open_cluster', 'cluster',
        'double_star', 'variable_star', 'star',
        'planet', 'moon', 'asteroid', 'comet',
        'quasar', 'unknown',
      ];

      for (const category of categories) {
        const display = getObjectTypeDisplay(category);
        expect(display).toHaveProperty('icon');
        expect(display).toHaveProperty('color');
        expect(display).toHaveProperty('badgeColor');
        expect(display).toHaveProperty('category');
        expect(display).toHaveProperty('labelKey');
        expect(display.category).toBe(category);
      }
    });

    it('returns correct icons for known types', () => {
      expect(getObjectTypeDisplay('galaxy').icon).toBe(Globe2);
      expect(getObjectTypeDisplay('nebula').icon).toBe(Cloud);
      expect(getObjectTypeDisplay('planetary_nebula').icon).toBe(Circle);
      expect(getObjectTypeDisplay('supernova_remnant').icon).toBe(Zap);
      expect(getObjectTypeDisplay('globular_cluster').icon).toBe(Atom);
      expect(getObjectTypeDisplay('open_cluster').icon).toBe(Sparkles);
      expect(getObjectTypeDisplay('cluster').icon).toBe(Sparkles);
      expect(getObjectTypeDisplay('double_star').icon).toBe(Binary);
      expect(getObjectTypeDisplay('variable_star').icon).toBe(Asterisk);
      expect(getObjectTypeDisplay('star').icon).toBe(CircleDot);
      expect(getObjectTypeDisplay('planet').icon).toBe(Orbit);
      expect(getObjectTypeDisplay('moon').icon).toBe(Moon);
      expect(getObjectTypeDisplay('asteroid').icon).toBe(Target);
      expect(getObjectTypeDisplay('comet').icon).toBe(Rocket);
      expect(getObjectTypeDisplay('quasar').icon).toBe(Zap);
      expect(getObjectTypeDisplay('unknown').icon).toBe(Star);
    });
  });

  describe('getObjectTypeIcon', () => {
    it('returns Star for unknown type', () => {
      expect(getObjectTypeIcon(null)).toBe(Star);
      expect(getObjectTypeIcon(undefined)).toBe(Star);
      expect(getObjectTypeIcon('unknown_type')).toBe(Star);
    });

    it('returns correct icons for type strings', () => {
      expect(getObjectTypeIcon('galaxy')).toBe(Globe2);
      expect(getObjectTypeIcon('nebula')).toBe(Cloud);
      expect(getObjectTypeIcon('star')).toBe(CircleDot);
    });
  });

  describe('getObjectTypeColor', () => {
    it('returns text-primary for unknown type', () => {
      expect(getObjectTypeColor(null)).toBe('text-primary');
      expect(getObjectTypeColor(undefined)).toBe('text-primary');
    });

    it('returns correct colors for known types', () => {
      expect(getObjectTypeColor('galaxy')).toBe('text-purple-400');
      expect(getObjectTypeColor('nebula')).toBe('text-pink-400');
      expect(getObjectTypeColor('planetary_nebula')).toBe('text-cyan-400');
      expect(getObjectTypeColor('star')).toBe('text-yellow-400');
      expect(getObjectTypeColor('planet')).toBe('text-orange-400');
    });
  });

  describe('getObjectTypeBadgeColor', () => {
    it('returns muted colors for unknown type', () => {
      expect(getObjectTypeBadgeColor(null)).toBe('bg-muted text-muted-foreground');
    });

    it('returns correct badge colors for known types', () => {
      expect(getObjectTypeBadgeColor('galaxy')).toContain('bg-purple-500/20');
      expect(getObjectTypeBadgeColor('nebula')).toContain('bg-pink-500/20');
      expect(getObjectTypeBadgeColor('star')).toContain('bg-yellow-500/20');
    });
  });

  describe('getLegendItems', () => {
    it('returns items for all categories in LEGEND_CATEGORIES', () => {
      const items = getLegendItems();
      const allCategories = Object.values(LEGEND_CATEGORIES).flat();
      
      expect(items).toHaveLength(allCategories.length);
      
      for (const item of items) {
        expect(allCategories).toContain(item.category);
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('color');
        expect(item).toHaveProperty('labelKey');
        expect(item).toHaveProperty('group');
      }
    });

    it('groups items correctly', () => {
      const items = getLegendItems();
      
      const galaxyItems = items.filter(i => i.group === 'galaxy');
      expect(galaxyItems.map(i => i.category)).toEqual(['galaxy']);
      
      const nebulaItems = items.filter(i => i.group === 'nebula');
      expect(nebulaItems.map(i => i.category)).toEqual(['nebula', 'planetary_nebula', 'supernova_remnant']);
      
      const starItems = items.filter(i => i.group === 'star');
      expect(starItems.map(i => i.category)).toEqual(['star', 'double_star', 'variable_star']);
    });
  });

  describe('LEGEND_CATEGORIES', () => {
    it('has all expected category groups', () => {
      expect(Object.keys(LEGEND_CATEGORIES)).toEqual([
        'galaxy', 'nebula', 'cluster', 'star', 'solar', 'exotic'
      ]);
    });
  });
});
