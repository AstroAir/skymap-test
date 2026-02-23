/**
 * Tests for satellite-constants.ts
 * Satellite type color and label mappings
 */

import { getSatelliteTypeColor, getSatelliteTypeLabelKey } from '../satellite-constants';

describe('getSatelliteTypeColor', () => {
  it('should return a color class for known types', () => {
    expect(getSatelliteTypeColor('iss')).toContain('blue');
    expect(getSatelliteTypeColor('starlink')).toContain('purple');
    expect(getSatelliteTypeColor('weather')).toContain('cyan');
    expect(getSatelliteTypeColor('gps')).toContain('green');
    expect(getSatelliteTypeColor('communication')).toContain('orange');
    expect(getSatelliteTypeColor('scientific')).toContain('pink');
  });

  it('should return gray for unknown types', () => {
    expect(getSatelliteTypeColor('unknown' as never)).toContain('gray');
  });
});

describe('getSatelliteTypeLabelKey', () => {
  it('should return i18n keys for known types', () => {
    expect(getSatelliteTypeLabelKey('iss')).toBe('satellites.typeISS');
    expect(getSatelliteTypeLabelKey('starlink')).toBe('satellites.typeStarlink');
  });

  it('should return other key for unknown types', () => {
    expect(getSatelliteTypeLabelKey('unknown' as never)).toBe('satellites.typeOther');
  });
});
