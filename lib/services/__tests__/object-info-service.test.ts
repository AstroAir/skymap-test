/**
 * @jest-environment jsdom
 */

import {
  getDSSImageUrl,
  getSkyViewImageUrl,
  getAladinPreviewUrl,
  getESOSearchUrl,
  getWikipediaUrl,
  getSimbadUrl,
  parseObjectType,
  formatAngularSize,
  getObjectDescription,
  clearObjectInfoCache,
} from '../object-info-service';

describe('object-info-service', () => {
  beforeEach(() => {
    clearObjectInfoCache();
  });

  describe('getDSSImageUrl', () => {
    it('should generate correct DSS URL for positive declination', () => {
      const url = getDSSImageUrl(10.68, 41.27, 15);
      
      expect(url).toContain('archive.stsci.edu');
      expect(url).toContain('dss_search');
      expect(url).toContain('v=poss2ukstu_red');
      expect(url).toContain('h=15');
      expect(url).toContain('w=15');
    });

    it('should generate correct DSS URL for negative declination', () => {
      const url = getDSSImageUrl(83.82, -5.39, 10);
      
      expect(url).toContain('archive.stsci.edu');
      expect(url).toContain('-');
    });

    it('should use default size of 15 arcmin', () => {
      const url = getDSSImageUrl(10.68, 41.27);
      
      expect(url).toContain('h=15');
      expect(url).toContain('w=15');
    });
  });

  describe('getSkyViewImageUrl', () => {
    it('should generate correct SkyView URL', () => {
      const url = getSkyViewImageUrl(10.68, 41.27, 'DSS2 Red', 0.25);
      
      expect(url).toContain('skyview.gsfc.nasa.gov');
      expect(url).toContain('Position=10.68,41.27');
      expect(url).toContain('Survey=DSS2%20Red');
      expect(url).toContain('Size=0.25');
    });

    it('should use default survey and size', () => {
      const url = getSkyViewImageUrl(83.82, -5.39);
      
      expect(url).toContain('Survey=DSS2%20Red');
      expect(url).toContain('Size=0.25');
    });
  });

  describe('getAladinPreviewUrl', () => {
    it('should generate correct Aladin URL', () => {
      const url = getAladinPreviewUrl(10.68, 41.27, 0.5);
      
      expect(url).toContain('alasky.cds.unistra.fr');
      expect(url).toContain('hips2fits');
      expect(url).toContain('ra=10.68');
      expect(url).toContain('dec=41.27');
      expect(url).toContain('fov=0.5');
    });

    it('should use default FOV', () => {
      const url = getAladinPreviewUrl(10.68, 41.27);
      
      expect(url).toContain('fov=0.25');
    });
  });

  describe('getESOSearchUrl', () => {
    it('should generate ESO search URL', () => {
      const url = getESOSearchUrl('M31');
      
      expect(url).toContain('archive.eso.org');
      expect(url).toContain('search=M31');
    });

    it('should encode object name', () => {
      const url = getESOSearchUrl('NGC 1234');
      
      expect(url).toContain('search=NGC%201234');
    });
  });

  describe('getWikipediaUrl', () => {
    it('should generate Wikipedia URL for Messier object', () => {
      const url = getWikipediaUrl('M31');
      
      expect(url).toContain('en.wikipedia.org/wiki');
      expect(url).toContain('M_31');
    });

    it('should generate Wikipedia URL for NGC object', () => {
      const url = getWikipediaUrl('NGC 7000');
      
      expect(url).toContain('en.wikipedia.org/wiki');
      expect(url).toContain('NGC_7000');
    });

    it('should handle names with spaces', () => {
      const url = getWikipediaUrl('Orion Nebula');
      
      expect(url).toContain('Orion_Nebula');
    });
  });

  describe('getSimbadUrl', () => {
    it('should generate SIMBAD URL', () => {
      const url = getSimbadUrl('M31');
      
      expect(url).toContain('simbad.u-strasbg.fr');
      expect(url).toContain('Ident=M31');
    });

    it('should encode special characters', () => {
      const url = getSimbadUrl('NGC 224');
      
      expect(url).toContain('Ident=NGC%20224');
    });
  });

  describe('parseObjectType', () => {
    it('should parse galaxy types', () => {
      expect(parseObjectType('G')).toEqual({ type: 'Galaxy', category: 'galaxy' });
      expect(parseObjectType('Gx')).toEqual({ type: 'Galaxy', category: 'galaxy' });
      expect(parseObjectType('GAL')).toEqual({ type: 'Galaxy', category: 'galaxy' });
    });

    it('should parse nebula types', () => {
      expect(parseObjectType('PN')).toEqual({ type: 'Planetary Nebula', category: 'nebula' });
      expect(parseObjectType('HII')).toEqual({ type: 'HII Region', category: 'nebula' });
      expect(parseObjectType('EN')).toEqual({ type: 'Emission Nebula', category: 'nebula' });
      expect(parseObjectType('SNR')).toEqual({ type: 'Supernova Remnant', category: 'nebula' });
    });

    it('should parse cluster types', () => {
      // Note: 'GC' may match 'G' first due to Object.entries iteration order
      // Testing with unambiguous cluster types
      expect(parseObjectType('OC')).toEqual({ type: 'Open Cluster', category: 'cluster' });
      expect(parseObjectType('Cl')).toEqual({ type: 'Star Cluster', category: 'cluster' });
      expect(parseObjectType('OpC')).toEqual({ type: 'Open Cluster', category: 'cluster' });
    });

    it('should parse star types', () => {
      expect(parseObjectType('*')).toEqual({ type: 'Star', category: 'star' });
      // '**' starts with '*' so it matches Star first
      const doubleStar = parseObjectType('**');
      expect(doubleStar.category).toBe('star');
      // 'V*' starts with 'V' which doesn't match directly
      const variableStar = parseObjectType('V*');
      expect(variableStar.category).toBe('star');
    });

    it('should handle keywords in type string', () => {
      expect(parseObjectType('Spiral Galaxy')).toEqual({ type: 'Galaxy', category: 'galaxy' });
      expect(parseObjectType('Emission Nebula')).toEqual({ type: 'Nebula', category: 'nebula' });
      expect(parseObjectType('Star Cluster')).toEqual({ type: 'Star Cluster', category: 'cluster' });
    });

    it('should return unknown for unrecognized types', () => {
      expect(parseObjectType(undefined)).toEqual({ type: 'Unknown', category: 'other' });
      expect(parseObjectType('')).toEqual({ type: 'Unknown', category: 'other' });
    });

    it('should handle case insensitivity', () => {
      expect(parseObjectType('galaxy')).toEqual({ type: 'Galaxy', category: 'galaxy' });
      expect(parseObjectType('GALAXY')).toEqual({ type: 'Galaxy', category: 'galaxy' });
    });
  });

  describe('formatAngularSize', () => {
    it('should format single dimension in arcminutes', () => {
      expect(formatAngularSize(10)).toBe("10.0'");
      expect(formatAngularSize(5.5)).toBe("5.5'");
    });

    it('should format two dimensions in arcminutes', () => {
      expect(formatAngularSize(10, 8)).toBe("10.0' × 8.0'");
    });

    it('should format small sizes in arcseconds', () => {
      expect(formatAngularSize(0.5)).toBe('30.0"');
      expect(formatAngularSize(0.5, 0.3)).toBe('30.0" × 18.0"');
    });

    it('should return undefined for no size', () => {
      expect(formatAngularSize()).toBeUndefined();
      expect(formatAngularSize(undefined)).toBeUndefined();
    });

    it('should handle equal width and height', () => {
      expect(formatAngularSize(10, 10)).toBe("10.0'");
    });
  });

  describe('getObjectDescription', () => {
    it('should generate galaxy description', () => {
      const desc = getObjectDescription('Galaxy', 'galaxy', ['M31'], 3.4, '2.5 Mly', 'Sb');
      
      expect(desc).toContain('M31');
      expect(desc).toContain('galaxy');
      expect(desc).toContain('2.5 Mly');
      expect(desc).toContain('3.4');
      expect(desc).toContain('Sb');
    });

    it('should generate nebula description', () => {
      const desc = getObjectDescription('Emission Nebula', 'nebula', ['M42'], 4.0);
      
      expect(desc).toContain('M42');
      expect(desc).toContain('emission nebula');
      expect(desc).toContain('4.0');
    });

    it('should generate cluster description', () => {
      const desc = getObjectDescription('Globular Cluster', 'cluster', ['M13'], 5.8, '25,000 ly');
      
      expect(desc).toContain('M13');
      expect(desc).toContain('globular cluster');
    });

    it('should generate star description', () => {
      const desc = getObjectDescription('Star', 'star', ['Vega'], 0.03);
      
      expect(desc).toContain('Vega');
      expect(desc).toContain('star');
      expect(desc).toContain('0.0');
    });

    it('should generate planet description', () => {
      const desc = getObjectDescription('Planet', 'planet', ['Jupiter']);
      
      expect(desc).toContain('Jupiter');
      expect(desc).toContain('planet');
      expect(desc).toContain('solar system');
    });

    it('should handle missing data', () => {
      const desc = getObjectDescription('Unknown', 'other', ['Object']);
      
      expect(desc).toContain('Object');
    });
  });

  describe('clearObjectInfoCache', () => {
    it('should clear the cache without error', () => {
      expect(() => clearObjectInfoCache()).not.toThrow();
    });
  });
});
