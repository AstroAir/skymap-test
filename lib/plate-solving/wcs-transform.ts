/**
 * WCS (World Coordinate System) Coordinate Transforms
 *
 * Implements pixel ↔ celestial coordinate conversion using
 * TAN (gnomonic) projection with optional SIP distortion correction.
 *
 * References:
 * - FITS WCS Paper I (Greisen & Calabretta 2002)
 * - FITS WCS Paper II (Calabretta & Greisen 2002)
 * - SIP convention (Shupe et al. 2005)
 */

import type { WCSInfo, SIPCoefficients } from './fits-parser';

// ============================================================================
// Types
// ============================================================================

export interface WorldCoord {
  ra: number;   // Right ascension in degrees [0, 360)
  dec: number;  // Declination in degrees [-90, 90]
}

export interface PixelCoord {
  x: number;    // 1-indexed pixel x coordinate
  y: number;    // 1-indexed pixel y coordinate
}

export interface WCSTransform {
  pixelToWorld(pixel: PixelCoord): WorldCoord;
  worldToPixel(world: WorldCoord): PixelCoord;
  getPixelScale(): number;
  getRotation(): number;
  getFieldOfView(width: number, height: number): { widthDeg: number; heightDeg: number };
  isFlipped(): boolean;
}

export interface WCSParams {
  crpix1: number;
  crpix2: number;
  crval1: number;
  crval2: number;
  cd1_1: number;
  cd1_2: number;
  cd2_1: number;
  cd2_2: number;
  sip?: SIPCoefficients;
}

// ============================================================================
// Constants
// ============================================================================

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a WCS transform from parsed WCSInfo (from fits-parser)
 */
export function createWCSTransform(wcs: WCSInfo, sip?: SIPCoefficients): WCSTransform | null {
  if (!wcs.cdMatrix) return null;

  const params: WCSParams = {
    crpix1: wcs.referencePixel.x,
    crpix2: wcs.referencePixel.y,
    crval1: wcs.referenceCoordinates.ra,
    crval2: wcs.referenceCoordinates.dec,
    cd1_1: wcs.cdMatrix.cd1_1,
    cd1_2: wcs.cdMatrix.cd1_2,
    cd2_1: wcs.cdMatrix.cd2_1,
    cd2_2: wcs.cdMatrix.cd2_2,
    sip,
  };

  return createWCSTransformFromParams(params);
}

/**
 * Create a WCS transform from raw WCS parameters
 */
export function createWCSTransformFromParams(params: WCSParams): WCSTransform {
  const { crpix1, crpix2, crval1, crval2, cd1_1, cd1_2, cd2_1, cd2_2, sip } = params;

  // Pre-compute CD matrix inverse for worldToPixel
  const det = cd1_1 * cd2_2 - cd1_2 * cd2_1;
  if (Math.abs(det) < 1e-20) {
    throw new Error('WCS CD matrix is singular (zero determinant)');
  }
  const invDet = 1.0 / det;
  const cdi_1_1 = cd2_2 * invDet;
  const cdi_1_2 = -cd1_2 * invDet;
  const cdi_2_1 = -cd2_1 * invDet;
  const cdi_2_2 = cd1_1 * invDet;

  // Reference point in radians
  const ra0 = crval1 * DEG2RAD;
  const dec0 = crval2 * DEG2RAD;
  const sinDec0 = Math.sin(dec0);
  const cosDec0 = Math.cos(dec0);

  /**
   * Apply forward SIP polynomial distortion: pixel → intermediate
   * u,v are pixel offsets from CRPIX; returns corrected u,v
   */
  function applySIPForward(u: number, v: number): [number, number] {
    if (!sip) return [u, v];

    let du = 0;
    let dv = 0;

    for (const [key, coeff] of Object.entries(sip.a)) {
      const m = key.match(/^A_(\d+)_(\d+)$/);
      if (m) {
        const p = parseInt(m[1]);
        const q = parseInt(m[2]);
        du += coeff * Math.pow(u, p) * Math.pow(v, q);
      }
    }

    for (const [key, coeff] of Object.entries(sip.b)) {
      const m = key.match(/^B_(\d+)_(\d+)$/);
      if (m) {
        const p = parseInt(m[1]);
        const q = parseInt(m[2]);
        dv += coeff * Math.pow(u, p) * Math.pow(v, q);
      }
    }

    return [u + du, v + dv];
  }

  /**
   * Apply inverse SIP polynomial: intermediate → pixel
   * If inverse coefficients (AP, BP) are available, use them.
   * Otherwise, iteratively invert the forward SIP.
   */
  function applySIPInverse(u: number, v: number): [number, number] {
    if (!sip) return [u, v];

    // Try using AP/BP inverse coefficients
    if (sip.apOrder !== undefined && Object.keys(sip.ap).length > 0) {
      let du = 0;
      let dv = 0;

      for (const [key, coeff] of Object.entries(sip.ap)) {
        const m = key.match(/^AP_(\d+)_(\d+)$/);
        if (m) {
          const p = parseInt(m[1]);
          const q = parseInt(m[2]);
          du += coeff * Math.pow(u, p) * Math.pow(v, q);
        }
      }

      for (const [key, coeff] of Object.entries(sip.bp)) {
        const m = key.match(/^BP_(\d+)_(\d+)$/);
        if (m) {
          const p = parseInt(m[1]);
          const q = parseInt(m[2]);
          dv += coeff * Math.pow(u, p) * Math.pow(v, q);
        }
      }

      return [u + du, v + dv];
    }

    // Iterative inversion (Newton's method)
    let gu = u;
    let gv = v;
    for (let iter = 0; iter < 20; iter++) {
      const [fu, fv] = applySIPForward(gu, gv);
      const newGu = u - (fu - gu);  // u = gu + du(gu,gv), so gu = u - du
      const newGv = v - (fv - gv);
      if (Math.abs(newGu - gu) < 1e-10 && Math.abs(newGv - gv) < 1e-10) break;
      gu = newGu;
      gv = newGv;
    }

    return [gu, gv];
  }

  function pixelToWorld(pixel: PixelCoord): WorldCoord {
    // Step 1: Pixel offset from reference pixel
    let u = pixel.x - crpix1;
    let v = pixel.y - crpix2;

    // Step 2: Apply SIP forward distortion
    [u, v] = applySIPForward(u, v);

    // Step 3: Apply CD matrix → intermediate world coordinates (degrees)
    const xi = cd1_1 * u + cd1_2 * v;   // projection plane x (degrees)
    const eta = cd2_1 * u + cd2_2 * v;  // projection plane y (degrees)

    // Step 4: TAN (gnomonic) deprojection → native spherical
    const xiRad = xi * DEG2RAD;
    const etaRad = eta * DEG2RAD;

    const rTheta = Math.sqrt(xiRad * xiRad + etaRad * etaRad);
    const c = Math.atan(rTheta);
    const sinC = Math.sin(c);
    const cosC = Math.cos(c);

    let dec: number;
    let ra: number;

    if (rTheta < 1e-15) {
      // At the reference point
      ra = crval1;
      dec = crval2;
    } else {
      dec = Math.asin(cosC * sinDec0 + (etaRad * sinC * cosDec0) / rTheta) * RAD2DEG;
      ra = crval1 + Math.atan2(
        xiRad * sinC,
        rTheta * cosDec0 * cosC - etaRad * sinDec0 * sinC
      ) * RAD2DEG;
    }

    // Normalize RA to [0, 360)
    ra = ((ra % 360) + 360) % 360;

    return { ra, dec };
  }

  function worldToPixel(world: WorldCoord): PixelCoord {
    const raRad = world.ra * DEG2RAD;
    const decRad = world.dec * DEG2RAD;

    const sinDec = Math.sin(decRad);
    const cosDec = Math.cos(decRad);
    const deltaRa = raRad - ra0;
    const cosDeltaRa = Math.cos(deltaRa);
    const sinDeltaRa = Math.sin(deltaRa);

    // TAN projection: celestial → projection plane
    const denom = sinDec * sinDec0 + cosDec * cosDec0 * cosDeltaRa;
    if (Math.abs(denom) < 1e-15) {
      // Point is near the back of the projection sphere
      return { x: NaN, y: NaN };
    }

    const xiRad = (cosDec * sinDeltaRa) / denom;
    const etaRad = (sinDec * cosDec0 - cosDec * sinDec0 * cosDeltaRa) / denom;

    // Convert from radians to degrees
    const xi = xiRad * RAD2DEG;
    const eta = etaRad * RAD2DEG;

    // Apply inverse CD matrix: intermediate → pixel offset
    let u = cdi_1_1 * xi + cdi_1_2 * eta;
    let v = cdi_2_1 * xi + cdi_2_2 * eta;

    // Apply inverse SIP
    [u, v] = applySIPInverse(u, v);

    return {
      x: u + crpix1,
      y: v + crpix2,
    };
  }

  function getPixelScale(): number {
    return Math.sqrt(cd1_1 * cd1_1 + cd2_1 * cd2_1) * 3600; // arcsec/pixel
  }

  function getRotation(): number {
    return Math.atan2(cd2_1, cd1_1) * RAD2DEG;
  }

  function getFieldOfView(width: number, height: number): { widthDeg: number; heightDeg: number } {
    const scaleX = Math.sqrt(cd1_1 * cd1_1 + cd2_1 * cd2_1);
    const scaleY = Math.sqrt(cd1_2 * cd1_2 + cd2_2 * cd2_2);
    return {
      widthDeg: scaleX * width,
      heightDeg: scaleY * height,
    };
  }

  function isFlipped(): boolean {
    return det > 0;
  }

  return {
    pixelToWorld,
    worldToPixel,
    getPixelScale,
    getRotation,
    getFieldOfView,
    isFlipped,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate angular separation between two celestial coordinates (degrees)
 */
export function angularSeparation(coord1: WorldCoord, coord2: WorldCoord): number {
  const ra1 = coord1.ra * DEG2RAD;
  const dec1 = coord1.dec * DEG2RAD;
  const ra2 = coord2.ra * DEG2RAD;
  const dec2 = coord2.dec * DEG2RAD;

  const cosSep = Math.sin(dec1) * Math.sin(dec2) +
    Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);

  return Math.acos(Math.min(1, Math.max(-1, cosSep))) * RAD2DEG;
}

/**
 * Get the four corner world coordinates for an image
 */
export function getImageCorners(
  transform: WCSTransform,
  width: number,
  height: number,
): WorldCoord[] {
  return [
    transform.pixelToWorld({ x: 1, y: 1 }),
    transform.pixelToWorld({ x: width, y: 1 }),
    transform.pixelToWorld({ x: width, y: height }),
    transform.pixelToWorld({ x: 1, y: height }),
  ];
}

/**
 * Get the center world coordinate for an image
 */
export function getImageCenter(
  transform: WCSTransform,
  width: number,
  height: number,
): WorldCoord {
  return transform.pixelToWorld({
    x: (width + 1) / 2,
    y: (height + 1) / 2,
  });
}
