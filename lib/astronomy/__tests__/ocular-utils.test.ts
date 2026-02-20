/**
 * @jest-environment node
 */
import { calculateOcularView, generateStars } from '../ocular-utils';
import type { EyepiecePreset, BarlowPreset, OcularTelescopePreset } from '@/lib/constants/equipment-presets';

// ============================================================================
// Test fixtures
// ============================================================================

const refractor80: OcularTelescopePreset = {
  id: 't1', name: '80mm f/5 Refractor', focalLength: 400, aperture: 80, type: 'refractor',
};

const newtonian200: OcularTelescopePreset = {
  id: 't2', name: '200mm f/5 Newtonian', focalLength: 1000, aperture: 200, type: 'reflector',
};

const plossl25: EyepiecePreset = {
  id: 'e1', name: 'Plössl 25mm', focalLength: 25, afov: 52, fieldStop: 21.3,
};

const plossl10: EyepiecePreset = {
  id: 'e2', name: 'Plössl 10mm', focalLength: 10, afov: 52,
};

const ultraWide5: EyepiecePreset = {
  id: 'e3', name: 'Ultra Wide 5mm', focalLength: 5, afov: 82, fieldStop: 6.9,
};

const noBarlow: BarlowPreset = { id: 'b0', name: 'None', magnification: 1 };
const barlow2x: BarlowPreset = { id: 'b1', name: '2x Barlow', magnification: 2 };
const reducer063: BarlowPreset = { id: 'r1', name: '0.63x Reducer', magnification: 0.63 };

// ============================================================================
// calculateOcularView tests
// ============================================================================

describe('calculateOcularView', () => {
  describe('magnification', () => {
    it('calculates basic magnification correctly', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // 400mm / 25mm = 16x
      expect(result.magnification).toBeCloseTo(16, 1);
    });

    it('applies barlow multiplier', () => {
      const result = calculateOcularView(refractor80, plossl25, barlow2x);
      // (400 * 2) / 25 = 32x
      expect(result.magnification).toBeCloseTo(32, 1);
    });

    it('applies focal reducer correctly', () => {
      const result = calculateOcularView(newtonian200, plossl25, reducer063);
      // (1000 * 0.63) / 25 = 25.2x
      expect(result.magnification).toBeCloseTo(25.2, 1);
    });

    it('high magnification with large scope + short eyepiece', () => {
      const result = calculateOcularView(newtonian200, ultraWide5, barlow2x);
      // (1000 * 2) / 5 = 400x
      expect(result.magnification).toBeCloseTo(400, 1);
    });
  });

  describe('true field of view', () => {
    it('uses field stop formula when available', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // fieldStop=21.3, effectiveFL=400 → TFOV = (21.3/400) * (180/π) ≈ 3.05°
      const expectedTfov = (21.3 / 400) * (180 / Math.PI);
      expect(result.tfov).toBeCloseTo(expectedTfov, 2);
    });

    it('falls back to AFOV/mag when no field stop', () => {
      const result = calculateOcularView(refractor80, plossl10, noBarlow);
      // No fieldStop → TFOV = 52 / (400/10) = 52/40 = 1.3°
      expect(result.tfov).toBeCloseTo(1.3, 2);
    });

    it('field stop formula with barlow', () => {
      const result = calculateOcularView(refractor80, plossl25, barlow2x);
      // effectiveFL = 800, fieldStop = 21.3
      const expectedTfov = (21.3 / 800) * (180 / Math.PI);
      expect(result.tfov).toBeCloseTo(expectedTfov, 2);
    });
  });

  describe('exit pupil', () => {
    it('calculates exit pupil correctly', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // 80 / 16 = 5mm
      expect(result.exitPupil).toBeCloseTo(5, 1);
    });

    it('exit pupil decreases with barlow', () => {
      const withoutBarlow = calculateOcularView(refractor80, plossl25, noBarlow);
      const withBarlow = calculateOcularView(refractor80, plossl25, barlow2x);
      expect(withBarlow.exitPupil).toBeLessThan(withoutBarlow.exitPupil);
      expect(withBarlow.exitPupil).toBeCloseTo(2.5, 1);
    });
  });

  describe('resolution limits', () => {
    it('calculates Dawes limit', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // 116 / 80 = 1.45"
      expect(result.dawesLimit).toBeCloseTo(1.45, 2);
    });

    it('calculates Rayleigh limit', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // 138 / 80 = 1.725"
      expect(result.rayleighLimit).toBeCloseTo(1.725, 2);
    });

    it('Rayleigh limit is always greater than Dawes', () => {
      const result = calculateOcularView(newtonian200, plossl25, noBarlow);
      expect(result.rayleighLimit).toBeGreaterThan(result.dawesLimit);
    });
  });

  describe('magnification limits', () => {
    it('calculates max useful magnification', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // 80 * 2 = 160x
      expect(result.maxUsefulMag).toBe(160);
    });

    it('calculates min useful magnification', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // 80 / 7 ≈ 11.4x
      expect(result.minUsefulMag).toBeCloseTo(11.43, 1);
    });

    it('calculates best planetary magnification', () => {
      const result = calculateOcularView(newtonian200, plossl25, noBarlow);
      // 200 * 1.5 = 300x
      expect(result.bestPlanetaryMag).toBe(300);
    });
  });

  describe('over/under magnification flags', () => {
    it('flags over-magnified when exceeding 2x aperture', () => {
      const result = calculateOcularView(newtonian200, ultraWide5, barlow2x);
      // 400x vs max 400x — exactly at limit, not over
      expect(result.magnification).toBeCloseTo(400);
      expect(result.isOverMagnified).toBe(false);
    });

    it('detects under-magnified with low mag', () => {
      // 80mm scope, 25mm eyepiece = 16x, min is ~11.4x → not under
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      expect(result.isUnderMagnified).toBe(false);
    });

    it('detects under-magnified with reducer', () => {
      // 80mm scope, 25mm, 0.63x → mag = 400*0.63/25 = 10.08x, min = 11.4x → under
      const result = calculateOcularView(refractor80, plossl25, reducer063);
      expect(result.isUnderMagnified).toBe(true);
    });
  });

  describe('optical properties', () => {
    it('calculates focal ratio', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      expect(result.focalRatio).toBeCloseTo(5, 1);
    });

    it('calculates light gathering', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // (80/7)^2 ≈ 130.6x
      expect(result.lightGathering).toBeCloseTo(130.6, 0);
    });

    it('calculates limiting magnitude', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // 2 + 5*log10(80) ≈ 11.52
      expect(result.limitingMag).toBeCloseTo(11.52, 1);
    });

    it('calculates surface brightness', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      // exitPupil=5, (5/7)^2 ≈ 0.51
      expect(result.surfaceBrightness).toBeCloseTo(0.51, 1);
    });

    it('surface brightness maxes at 1 with large exit pupil', () => {
      // reducer gives larger exit pupil
      const result = calculateOcularView(refractor80, plossl25, reducer063);
      // exitPupil = 80/10.08 ≈ 7.94mm → (7.94/7)^2 ≈ 1.29
      expect(result.surfaceBrightness).toBeGreaterThan(1);
    });
  });

  describe('observing suggestion', () => {
    it('suggests deepsky for low magnification', () => {
      // 80mm, 25mm, no barlow = 16x, threshold = 80*0.7 = 56x
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      expect(result.observingSuggestion).toBe('deepsky');
    });

    it('suggests planetary for high magnification', () => {
      // 200mm, 5mm UW, no barlow = 200x, threshold = 200*1.2 = 240x
      // 200x < 240x → allround
      const result = calculateOcularView(newtonian200, ultraWide5, noBarlow);
      expect(result.observingSuggestion).toBe('allround');
    });

    it('suggests overlimit when over-magnified', () => {
      // Create a scenario where magnification > 2*aperture
      const tinyScope: OcularTelescopePreset = {
        id: 'tiny', name: 'Tiny', focalLength: 500, aperture: 50, type: 'refractor',
      };
      const barlow5x: BarlowPreset = { id: 'b5', name: '5x', magnification: 5 };
      // (500*5)/5 = 500x, max = 100x → overlimit
      const result = calculateOcularView(tinyScope, ultraWide5, barlow5x);
      expect(result.observingSuggestion).toBe('overlimit');
    });
  });

  describe('effective focal length', () => {
    it('equals telescope FL without barlow', () => {
      const result = calculateOcularView(refractor80, plossl25, noBarlow);
      expect(result.effectiveFocalLength).toBe(400);
    });

    it('multiplied by barlow factor', () => {
      const result = calculateOcularView(refractor80, plossl25, barlow2x);
      expect(result.effectiveFocalLength).toBe(800);
    });

    it('reduced by focal reducer', () => {
      const result = calculateOcularView(newtonian200, plossl25, reducer063);
      expect(result.effectiveFocalLength).toBeCloseTo(630, 0);
    });
  });

  describe('invalid input defense', () => {
    it('clamps invalid/zero values and keeps finite output', () => {
      const brokenScope = {
        id: 'bad-scope',
        name: 'Bad Scope',
        focalLength: 0,
        aperture: -1,
        type: 'reflector',
      } as OcularTelescopePreset;
      const brokenEyepiece = {
        id: 'bad-ep',
        name: 'Bad EP',
        focalLength: 0,
        afov: -20,
      } as EyepiecePreset;
      const brokenBarlow = {
        id: 'bad-barlow',
        name: 'Bad Barlow',
        magnification: 0,
      } as BarlowPreset;

      const result = calculateOcularView(brokenScope, brokenEyepiece, brokenBarlow);

      expect(Number.isFinite(result.magnification)).toBe(true);
      expect(Number.isFinite(result.tfov)).toBe(true);
      expect(Number.isFinite(result.exitPupil)).toBe(true);
      expect(result.magnification).toBeGreaterThanOrEqual(0);
      expect(result.tfov).toBeGreaterThanOrEqual(0);
      expect(result.effectiveFocalLength).toBeGreaterThanOrEqual(1);
    });

    it('falls back to AFOV formula when field stop is invalid', () => {
      const eyepiece = {
        id: 'ep-invalid-field-stop',
        name: 'Invalid Field Stop',
        focalLength: 10,
        afov: 60,
        fieldStop: -3,
      } as EyepiecePreset;

      const result = calculateOcularView(refractor80, eyepiece, noBarlow);

      expect(result.tfov).toBeCloseTo(60 / (400 / 10), 3);
    });
  });
});

// ============================================================================
// generateStars tests
// ============================================================================

describe('generateStars', () => {
  it('generates requested number of stars', () => {
    expect(generateStars(10)).toHaveLength(10);
    expect(generateStars(50)).toHaveLength(50);
    expect(generateStars(0)).toHaveLength(0);
  });

  it('generates deterministic results', () => {
    const a = generateStars(20);
    const b = generateStars(20);
    expect(a).toEqual(b);
  });

  it('star positions are within 0-100%', () => {
    const stars = generateStars(100);
    for (const star of stars) {
      expect(star.left).toBeGreaterThanOrEqual(0);
      expect(star.left).toBeLessThanOrEqual(100);
      expect(star.top).toBeGreaterThanOrEqual(0);
      expect(star.top).toBeLessThanOrEqual(100);
    }
  });

  it('star sizes are positive', () => {
    const stars = generateStars(50);
    for (const star of stars) {
      expect(star.size).toBeGreaterThan(0);
    }
  });

  it('star opacities are between 0 and 1', () => {
    const stars = generateStars(50);
    for (const star of stars) {
      expect(star.opacity).toBeGreaterThan(0);
      expect(star.opacity).toBeLessThanOrEqual(1);
    }
  });
});
