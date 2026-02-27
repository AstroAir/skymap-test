/**
 * @jest-environment jsdom
 */

import {
  createWCSTransform,
  createWCSTransformFromParams,
  angularSeparation,
  getImageCorners,
  getImageCenter,
} from '../wcs-transform';
import type { WCSParams } from '../wcs-transform';
import type { WCSInfo } from '../fits-parser';

// ============================================================================
// Test Data
// ============================================================================

// Orion Nebula center: RA=83.633°, Dec=-5.392°, 1 arcsec/pixel, no rotation
const orionParams: WCSParams = {
  crpix1: 2048.5,
  crpix2: 2048.5,
  crval1: 83.633,
  crval2: -5.392,
  cd1_1: -0.0002777777778, // -1"/pixel in RA
  cd1_2: 0,
  cd2_1: 0,
  cd2_2: 0.0002777777778,  // 1"/pixel in Dec
};

// Rotated WCS: 45 degree rotation, 2 arcsec/pixel (reserved for future tests)
const _rotatedParams: WCSParams = {
  crpix1: 1024.5,
  crpix2: 1024.5,
  crval1: 180.0,
  crval2: 45.0,
  cd1_1: -0.000392837, // -2"/pix * cos(45°) / cos(dec) ≈
  cd1_2: -0.000392837,
  cd2_1: -0.000392837,
  cd2_2: 0.000392837,
};

// ============================================================================
// Tests
// ============================================================================

describe('WCS Transform', () => {
  describe('createWCSTransformFromParams', () => {
    it('creates transform from valid params', () => {
      const transform = createWCSTransformFromParams(orionParams);
      expect(transform).toBeDefined();
      expect(transform.pixelToWorld).toBeDefined();
      expect(transform.worldToPixel).toBeDefined();
    });

    it('throws on singular CD matrix', () => {
      const singular: WCSParams = {
        ...orionParams,
        cd1_1: 0, cd1_2: 0, cd2_1: 0, cd2_2: 0,
      };
      expect(() => createWCSTransformFromParams(singular)).toThrow('singular');
    });
  });

  describe('pixelToWorld', () => {
    it('returns reference coordinates at reference pixel', () => {
      const transform = createWCSTransformFromParams(orionParams);
      const world = transform.pixelToWorld({ x: 2048.5, y: 2048.5 });

      expect(world.ra).toBeCloseTo(83.633, 3);
      expect(world.dec).toBeCloseTo(-5.392, 3);
    });

    it('shifts RA when moving in x', () => {
      const transform = createWCSTransformFromParams(orionParams);
      // Move 100 pixels in x (negative cd1_1 means RA increases to the left)
      const world = transform.pixelToWorld({ x: 2048.5 - 100, y: 2048.5 });

      // 100 pixels * 1 arcsec/pixel = 100 arcsec = 0.0278 degrees
      expect(world.ra).toBeCloseTo(83.633 + 0.0278, 2);
      expect(world.dec).toBeCloseTo(-5.392, 3);
    });

    it('shifts Dec when moving in y', () => {
      const transform = createWCSTransformFromParams(orionParams);
      const world = transform.pixelToWorld({ x: 2048.5, y: 2048.5 + 100 });

      expect(world.ra).toBeCloseTo(83.633, 3);
      expect(world.dec).toBeCloseTo(-5.392 + 0.0278, 2);
    });
  });

  describe('worldToPixel', () => {
    it('returns reference pixel at reference coordinates', () => {
      const transform = createWCSTransformFromParams(orionParams);
      const pixel = transform.worldToPixel({ ra: 83.633, dec: -5.392 });

      expect(pixel.x).toBeCloseTo(2048.5, 1);
      expect(pixel.y).toBeCloseTo(2048.5, 1);
    });

    it('round-trips through pixel→world→pixel', () => {
      const transform = createWCSTransformFromParams(orionParams);
      const testPixel = { x: 1500, y: 2200 };

      const world = transform.pixelToWorld(testPixel);
      const back = transform.worldToPixel(world);

      expect(back.x).toBeCloseTo(testPixel.x, 3);
      expect(back.y).toBeCloseTo(testPixel.y, 3);
    });

    it('round-trips through world→pixel→world', () => {
      const transform = createWCSTransformFromParams(orionParams);
      const testWorld = { ra: 83.7, dec: -5.3 };

      const pixel = transform.worldToPixel(testWorld);
      const back = transform.pixelToWorld(pixel);

      expect(back.ra).toBeCloseTo(testWorld.ra, 5);
      expect(back.dec).toBeCloseTo(testWorld.dec, 5);
    });
  });

  describe('getPixelScale', () => {
    it('returns correct pixel scale in arcsec/pixel', () => {
      const transform = createWCSTransformFromParams(orionParams);
      // CD1_1 = 0.0002778° = 1 arcsec/pixel
      expect(transform.getPixelScale()).toBeCloseTo(1.0, 1);
    });
  });

  describe('getRotation', () => {
    it('returns ~180 degrees for standard orientation (negative CD1_1)', () => {
      const transform = createWCSTransformFromParams(orionParams);
      // With negative CD1_1 and zero CD2_1, rotation is 180° (standard N-up E-left)
      expect(Math.abs(transform.getRotation())).toBeCloseTo(180, 0);
    });
  });

  describe('getFieldOfView', () => {
    it('returns correct FOV for 4096x4096 image at 1 arcsec/pixel', () => {
      const transform = createWCSTransformFromParams(orionParams);
      const fov = transform.getFieldOfView(4096, 4096);

      // 4096 * 1"/px = 4096" ≈ 1.138°
      expect(fov.widthDeg).toBeCloseTo(1.138, 2);
      expect(fov.heightDeg).toBeCloseTo(1.138, 2);
    });
  });

  describe('isFlipped', () => {
    it('detects normal parity', () => {
      const transform = createWCSTransformFromParams(orionParams);
      // det = cd1_1*cd2_2 - cd1_2*cd2_1 = negative*positive - 0 = negative → not flipped
      expect(transform.isFlipped()).toBe(false);
    });
  });

  describe('angularSeparation', () => {
    it('returns 0 for same coordinates', () => {
      const sep = angularSeparation(
        { ra: 83.633, dec: -5.392 },
        { ra: 83.633, dec: -5.392 }
      );
      expect(sep).toBeCloseTo(0, 10);
    });

    it('calculates correct separation for 1 degree apart in dec', () => {
      const sep = angularSeparation(
        { ra: 0, dec: 0 },
        { ra: 0, dec: 1 }
      );
      expect(sep).toBeCloseTo(1.0, 5);
    });

    it('calculates correct separation for known pair', () => {
      // Betelgeuse (88.79°, 7.41°) to Rigel (78.63°, -8.20°)
      const sep = angularSeparation(
        { ra: 88.79, dec: 7.41 },
        { ra: 78.63, dec: -8.20 }
      );
      // Expected ~18.2 degrees
      expect(sep).toBeCloseTo(18.2, 0);
    });

    it('handles 180 degree separation (antipodal)', () => {
      const sep = angularSeparation(
        { ra: 0, dec: 0 },
        { ra: 180, dec: 0 }
      );
      expect(sep).toBeCloseTo(180, 5);
    });
  });

  describe('getImageCorners', () => {
    it('returns 4 corner coordinates', () => {
      const transform = createWCSTransformFromParams(orionParams);
      const corners = getImageCorners(transform, 4096, 4096);

      expect(corners).toHaveLength(4);
      corners.forEach(corner => {
        expect(corner.ra).toBeDefined();
        expect(corner.dec).toBeDefined();
        expect(corner.ra).toBeGreaterThanOrEqual(0);
        expect(corner.ra).toBeLessThan(360);
        expect(corner.dec).toBeGreaterThanOrEqual(-90);
        expect(corner.dec).toBeLessThanOrEqual(90);
      });
    });
  });

  describe('getImageCenter', () => {
    it('returns reference coordinates for center of image', () => {
      const transform = createWCSTransformFromParams(orionParams);
      const center = getImageCenter(transform, 4096, 4096);

      expect(center.ra).toBeCloseTo(83.633, 2);
      expect(center.dec).toBeCloseTo(-5.392, 2);
    });
  });

  describe('createWCSTransform (from WCSInfo)', () => {
    it('returns null when cdMatrix is missing', () => {
      const wcsInfo: WCSInfo = {
        referencePixel: { x: 1024, y: 1024 },
        referenceCoordinates: { ra: 180, dec: 45 },
        pixelScale: 1.0,
        rotation: 0,
      };
      const transform = createWCSTransform(wcsInfo);
      expect(transform).toBeNull();
    });

    it('creates transform from valid WCSInfo with cdMatrix', () => {
      const wcsInfo: WCSInfo = {
        referencePixel: { x: 2048.5, y: 2048.5 },
        referenceCoordinates: { ra: 83.633, dec: -5.392 },
        pixelScale: 1.0,
        rotation: 180,
        cdMatrix: {
          cd1_1: -0.0002777777778,
          cd1_2: 0,
          cd2_1: 0,
          cd2_2: 0.0002777777778,
        },
      };
      const transform = createWCSTransform(wcsInfo);
      expect(transform).not.toBeNull();
      const world = transform!.pixelToWorld({ x: 2048.5, y: 2048.5 });
      expect(world.ra).toBeCloseTo(83.633, 3);
      expect(world.dec).toBeCloseTo(-5.392, 3);
    });

    it('passes SIP coefficients through to transform', () => {
      const wcsInfo: WCSInfo = {
        referencePixel: { x: 2048.5, y: 2048.5 },
        referenceCoordinates: { ra: 83.633, dec: -5.392 },
        pixelScale: 1.0,
        rotation: 180,
        cdMatrix: {
          cd1_1: -0.0002777777778,
          cd1_2: 0,
          cd2_1: 0,
          cd2_2: 0.0002777777778,
        },
      };
      const sip = {
        aOrder: 2,
        bOrder: 2,
        a: { 'A_2_0': 1e-7 },
        b: { 'B_2_0': -1e-7 },
        ap: {},
        bp: {},
      };
      const transform = createWCSTransform(wcsInfo, sip);
      expect(transform).not.toBeNull();
    });
  });

  describe('worldToPixel edge cases', () => {
    it('returns NaN for point on the back of projection sphere', () => {
      // At dec0=0, denom = cos(0)*cos(0)*cos(deltaRa) = cos(deltaRa)
      // When deltaRa = 90°, denom = 0 exactly → NaN
      const equatorParams: WCSParams = {
        crpix1: 512, crpix2: 512,
        crval1: 0, crval2: 0,  // RA=0, Dec=0
        cd1_1: -0.0002777777778, cd1_2: 0,
        cd2_1: 0, cd2_2: 0.0002777777778,
      };
      const transform = createWCSTransformFromParams(equatorParams);
      const pixel = transform.worldToPixel({ ra: 90, dec: 0 }); // 90° away
      expect(pixel.x).toBeNaN();
      expect(pixel.y).toBeNaN();
    });
  });

  describe('isFlipped with positive determinant', () => {
    it('detects flipped parity when det > 0', () => {
      const flippedParams: WCSParams = {
        crpix1: 1024,
        crpix2: 1024,
        crval1: 180,
        crval2: 45,
        cd1_1: 0.0002777777778,  // positive CD1_1 → det > 0
        cd1_2: 0,
        cd2_1: 0,
        cd2_2: 0.0002777777778,
      };
      const transform = createWCSTransformFromParams(flippedParams);
      expect(transform.isFlipped()).toBe(true);
    });
  });

  describe('SIP distortion', () => {
    it('round-trips with SIP coefficients', () => {
      const sipParams: WCSParams = {
        ...orionParams,
        sip: {
          aOrder: 2,
          bOrder: 2,
          a: { 'A_2_0': 1e-7, 'A_0_2': 2e-7, 'A_1_1': -1e-7 },
          b: { 'B_2_0': -1e-7, 'B_0_2': 1e-7, 'B_1_1': 2e-7 },
          ap: {},
          bp: {},
        },
      };

      const transform = createWCSTransformFromParams(sipParams);
      const testPixel = { x: 1500, y: 2200 };

      const world = transform.pixelToWorld(testPixel);
      const back = transform.worldToPixel(world);

      // Without AP/BP inverse, iterative inversion should still converge
      expect(back.x).toBeCloseTo(testPixel.x, 1);
      expect(back.y).toBeCloseTo(testPixel.y, 1);
    });

    it('round-trips with AP/BP inverse coefficients', () => {
      const sipParams: WCSParams = {
        ...orionParams,
        sip: {
          aOrder: 2,
          bOrder: 2,
          apOrder: 2,
          bpOrder: 2,
          a: { 'A_2_0': 1e-7, 'A_0_2': 2e-7 },
          b: { 'B_2_0': -1e-7, 'B_0_2': 1e-7 },
          ap: { 'AP_2_0': -1e-7, 'AP_0_2': -2e-7 },
          bp: { 'BP_2_0': 1e-7, 'BP_0_2': -1e-7 },
        },
      };

      const transform = createWCSTransformFromParams(sipParams);
      const testPixel = { x: 1500, y: 2200 };

      const world = transform.pixelToWorld(testPixel);
      const back = transform.worldToPixel(world);

      expect(back.x).toBeCloseTo(testPixel.x, 1);
      expect(back.y).toBeCloseTo(testPixel.y, 1);
    });
  });
});
