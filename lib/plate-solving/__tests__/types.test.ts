/**
 * Tests for plate-solving/types.ts
 * Plate solve result types and utility functions
 */

import {
  createErrorResult,
  getRotationFromSolveResult,
  calculateDSOPositionAngle,
  parseWCSFromFITS,
} from '../types';
import type { PlateSolveResult } from '../types';

describe('createErrorResult', () => {
  it('should create a failed result with error message', () => {
    const result = createErrorResult('test-solver', 'Something failed');
    expect(result.success).toBe(false);
    expect(result.solverName).toBe('test-solver');
    expect(result.errorMessage).toBe('Something failed');
    expect(result.coordinates).toBeNull();
  });
});

describe('getRotationFromSolveResult', () => {
  it('should return null for failed solve', () => {
    const result = createErrorResult('test', 'failed');
    expect(getRotationFromSolveResult(result)).toBeNull();
  });

  it('should return 360 - positionAngle for success', () => {
    const result: PlateSolveResult = {
      success: true,
      coordinates: { ra: 10, dec: 20, raHMS: '0h 40m', decDMS: '+20° 00\'' },
      positionAngle: 45,
      pixelScale: 1.5,
      fov: { width: 2, height: 1.5 },
      flipped: false,
      solverName: 'test',
      solveTime: 1000,
    };
    expect(getRotationFromSolveResult(result)).toBe(315);
  });
});

describe('calculateDSOPositionAngle', () => {
  it('should sum and wrap at 360', () => {
    expect(calculateDSOPositionAngle(350, 20)).toBeCloseTo(10);
    expect(calculateDSOPositionAngle(180, 0)).toBe(180);
  });
});

describe('parseWCSFromFITS', () => {
  it('should return null for incomplete header', () => {
    expect(parseWCSFromFITS({})).toBeNull();
    expect(parseWCSFromFITS({ CRPIX1: 1 })).toBeNull();
  });

  it('should parse WCS from CD matrix', () => {
    const wcs = parseWCSFromFITS({
      CRPIX1: 512, CRPIX2: 512,
      CRVAL1: 180, CRVAL2: 45,
      CD1_1: -0.001, CD1_2: 0, CD2_1: 0, CD2_2: 0.001,
    });
    expect(wcs).not.toBeNull();
    expect(wcs!.referencePixel).toEqual({ x: 512, y: 512 });
    expect(wcs!.referenceCoordinates).toEqual({ ra: 180, dec: 45 });
    expect(wcs!.pixelScale).toBeGreaterThan(0);
  });

  it('should parse WCS from CDELT + CROTA', () => {
    const wcs = parseWCSFromFITS({
      CRPIX1: 256, CRPIX2: 256,
      CRVAL1: 90, CRVAL2: 30,
      CDELT1: -0.001, CDELT2: 0.001, CROTA2: 0,
    });
    expect(wcs).not.toBeNull();
    expect(Math.abs(wcs!.rotation)).toBeCloseTo(180, 0); // atan2(0, -0.001) = ±180
  });
});
