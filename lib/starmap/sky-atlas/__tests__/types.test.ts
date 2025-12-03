/**
 * @jest-environment jsdom
 */
import { MOON_PHASE_NAMES, type MoonPhase, type DSOType, type DeepSkyObject } from '../types';

describe('MOON_PHASE_NAMES', () => {
  it('contains all moon phases', () => {
    const phases: MoonPhase[] = [
      'new',
      'waxingCrescent',
      'firstQuarter',
      'waxingGibbous',
      'full',
      'waningGibbous',
      'lastQuarter',
      'waningCrescent',
    ];

    phases.forEach((phase) => {
      expect(MOON_PHASE_NAMES[phase]).toBeDefined();
      expect(typeof MOON_PHASE_NAMES[phase]).toBe('string');
    });
  });

  it('has correct name for new moon', () => {
    expect(MOON_PHASE_NAMES.new).toBe('New Moon');
  });

  it('has correct name for full moon', () => {
    expect(MOON_PHASE_NAMES.full).toBe('Full Moon');
  });

  it('has correct name for first quarter', () => {
    expect(MOON_PHASE_NAMES.firstQuarter).toBe('First Quarter');
  });

  it('has correct name for last quarter', () => {
    expect(MOON_PHASE_NAMES.lastQuarter).toBe('Last Quarter');
  });
});

describe('DSOType', () => {
  it('includes Galaxy type', () => {
    const type: DSOType = 'Galaxy';
    expect(type).toBe('Galaxy');
  });

  it('includes Nebula type', () => {
    const type: DSOType = 'Nebula';
    expect(type).toBe('Nebula');
  });

  it('includes OpenCluster type', () => {
    const type: DSOType = 'OpenCluster';
    expect(type).toBe('OpenCluster');
  });

  it('includes GlobularCluster type', () => {
    const type: DSOType = 'GlobularCluster';
    expect(type).toBe('GlobularCluster');
  });

  it('includes PlanetaryNebula type', () => {
    const type: DSOType = 'PlanetaryNebula';
    expect(type).toBe('PlanetaryNebula');
  });
});

describe('DeepSkyObject interface', () => {
  it('can create a valid DSO object', () => {
    const dso: DeepSkyObject = {
      id: 'M31',
      name: 'Andromeda Galaxy',
      type: 'Galaxy',
      constellation: 'Andromeda',
      ra: 10.6847,
      dec: 41.2687,
      magnitude: 3.44,
      messier: 31,
      ngc: 224,
    };

    expect(dso.id).toBe('M31');
    expect(dso.name).toBe('Andromeda Galaxy');
    expect(dso.type).toBe('Galaxy');
    expect(dso.constellation).toBe('Andromeda');
    expect(dso.ra).toBeCloseTo(10.6847, 4);
    expect(dso.dec).toBeCloseTo(41.2687, 4);
    expect(dso.magnitude).toBe(3.44);
    expect(dso.messier).toBe(31);
    expect(dso.ngc).toBe(224);
  });

  it('supports optional properties', () => {
    const dso: DeepSkyObject = {
      id: 'NGC7000',
      name: 'North America Nebula',
      type: 'EmissionNebula',
      constellation: 'Cygnus',
      ra: 314.6,
      dec: 44.3,
    };

    expect(dso.magnitude).toBeUndefined();
    expect(dso.messier).toBeUndefined();
    expect(dso.alternateNames).toBeUndefined();
  });

  it('supports alternate names', () => {
    const dso: DeepSkyObject = {
      id: 'M42',
      name: 'Orion Nebula',
      alternateNames: ['Great Orion Nebula', 'NGC 1976'],
      type: 'EmissionNebula',
      constellation: 'Orion',
      ra: 83.82,
      dec: -5.39,
    };

    expect(dso.alternateNames).toContain('Great Orion Nebula');
    expect(dso.alternateNames).toContain('NGC 1976');
  });

  it('supports size properties', () => {
    const dso: DeepSkyObject = {
      id: 'M51',
      name: 'Whirlpool Galaxy',
      type: 'Galaxy',
      constellation: 'Canes Venatici',
      ra: 202.47,
      dec: 47.2,
      sizeMax: 11.2,
      sizeMin: 6.9,
      positionAngle: 163,
    };

    expect(dso.sizeMax).toBe(11.2);
    expect(dso.sizeMin).toBe(6.9);
    expect(dso.positionAngle).toBe(163);
  });
});
