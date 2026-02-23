/**
 * Tests for fov-calculations.ts
 * Camera FOV, mosaic coverage, overlay dimensions, and mosaic layout calculations
 */

import {
  calculateCameraFov,
  calculateImageScale,
  calculateSensorResolution,
  calculateMosaicCoverage,
  calculateOverlayDimensions,
  calculateMosaicLayout,
} from '../fov-calculations';

describe('calculateCameraFov', () => {
  it('should calculate FOV from sensor dimensions and focal length', () => {
    // Typical APS-C sensor (23.5mm x 15.6mm) with 200mm focal length
    const result = calculateCameraFov(23.5, 15.6, 200);
    expect(result.width).toBeCloseTo(6.73, 1);
    expect(result.height).toBeCloseTo(4.47, 1);
  });

  it('should produce wider FOV with shorter focal length', () => {
    const short = calculateCameraFov(23.5, 15.6, 100);
    const long = calculateCameraFov(23.5, 15.6, 400);
    expect(short.width).toBeGreaterThan(long.width);
    expect(short.height).toBeGreaterThan(long.height);
  });

  it('should produce wider FOV with larger sensor', () => {
    const small = calculateCameraFov(10, 10, 200);
    const large = calculateCameraFov(36, 24, 200);
    expect(large.width).toBeGreaterThan(small.width);
    expect(large.height).toBeGreaterThan(small.height);
  });
});

describe('calculateImageScale', () => {
  it('should calculate image scale in arcsec/pixel', () => {
    // 3.75μm pixel, 1000mm FL → 0.774 arcsec/pixel
    const scale = calculateImageScale(3.75, 1000);
    expect(scale).toBeCloseTo(0.774, 2);
  });

  it('should increase with larger pixels', () => {
    const small = calculateImageScale(3.75, 1000);
    const large = calculateImageScale(7.5, 1000);
    expect(large).toBeGreaterThan(small);
  });
});

describe('calculateSensorResolution', () => {
  it('should calculate resolution from sensor dimensions and pixel size', () => {
    // 23.5mm sensor width, 3.75μm pixel → ~6267 pixels
    const result = calculateSensorResolution(23.5, 15.6, 3.75);
    expect(result.width).toBe(6267);
    expect(result.height).toBe(4160);
  });
});

describe('calculateMosaicCoverage', () => {
  it('should return null when mosaic is disabled', () => {
    const result = calculateMosaicCoverage(
      2, 1.5,
      { enabled: false, rows: 2, cols: 2, overlap: 10, overlapUnit: 'percent' },
      { width: 4000, height: 3000 }
    );
    expect(result).toBeNull();
  });

  it('should calculate coverage for percent overlap', () => {
    const result = calculateMosaicCoverage(
      2, 1.5,
      { enabled: true, rows: 2, cols: 2, overlap: 10, overlapUnit: 'percent' },
      { width: 4000, height: 3000 }
    );
    expect(result).not.toBeNull();
    expect(result!.totalPanels).toBe(4);
    expect(result!.width).toBeGreaterThan(2);
    expect(result!.height).toBeGreaterThan(1.5);
  });

  it('should calculate coverage for pixel overlap', () => {
    const result = calculateMosaicCoverage(
      2, 1.5,
      { enabled: true, rows: 2, cols: 3, overlap: 100, overlapUnit: 'pixels' },
      { width: 4000, height: 3000 }
    );
    expect(result).not.toBeNull();
    expect(result!.totalPanels).toBe(6);
  });
});

describe('calculateOverlayDimensions', () => {
  const baseMosaic = { enabled: false, rows: 1, cols: 1, overlap: 0, overlapUnit: 'percent' as const };

  it('should calculate single panel overlay dimensions', () => {
    const result = calculateOverlayDimensions(
      23.5, 15.6, 200, 10, 800, 600, baseMosaic
    );
    expect(result.panelWidthPx).toBeGreaterThan(0);
    expect(result.panelHeightPx).toBeGreaterThan(0);
    expect(result.cameraFovWidth).toBeGreaterThan(0);
    expect(result.cameraFovHeight).toBeGreaterThan(0);
  });

  it('should clamp overlay when FOV is too large', () => {
    // Very short focal length → huge FOV relative to view
    const result = calculateOverlayDimensions(
      36, 24, 10, 5, 800, 600, baseMosaic
    );
    expect(result.scale).toBeLessThanOrEqual(1);
  });

  it('should handle mosaic enabled', () => {
    const mosaic = { enabled: true, rows: 2, cols: 2, overlap: 10, overlapUnit: 'percent' as const };
    const result = calculateOverlayDimensions(
      23.5, 15.6, 200, 10, 800, 600, mosaic
    );
    expect(result.totalMosaicWidthPx).toBeGreaterThan(result.panelWidthPx);
    expect(result.totalMosaicHeightPx).toBeGreaterThan(result.panelHeightPx);
  });
});

describe('calculateMosaicLayout', () => {
  it('should generate correct number of panels', () => {
    const panels = calculateMosaicLayout(100, 80, 90, 72, 3, 2);
    expect(panels).toHaveLength(6);
  });

  it('should mark center panel for multi-panel layout', () => {
    const panels = calculateMosaicLayout(100, 80, 90, 72, 3, 3);
    const centerPanels = panels.filter(p => p.isCenter);
    expect(centerPanels).toHaveLength(1);
    // Center of 3x3 grid is at row=1, col=1
    expect(centerPanels[0].x).toBeCloseTo(90);
    expect(centerPanels[0].y).toBeCloseTo(72);
  });

  it('should mark single panel as center', () => {
    const panels = calculateMosaicLayout(100, 80, 90, 72, 1, 1);
    expect(panels).toHaveLength(1);
    expect(panels[0].isCenter).toBe(true);
    expect(panels[0].x).toBe(0);
    expect(panels[0].y).toBe(0);
  });

  it('should calculate correct positions based on step sizes', () => {
    const panels = calculateMosaicLayout(100, 80, 50, 40, 2, 2);
    expect(panels[0]).toEqual({ x: 0, y: 0, isCenter: true });
    expect(panels[1]).toEqual({ x: 50, y: 0, isCenter: false });
    expect(panels[2]).toEqual({ x: 0, y: 40, isCenter: false });
    expect(panels[3]).toEqual({ x: 50, y: 40, isCenter: false });
  });
});
