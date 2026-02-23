/**
 * Tests for equipment-normalize.ts
 * Telescope and camera data normalization from Tauri and Web formats
 */

import { normalizeTelescopes, normalizeCameras } from '../equipment-normalize';

describe('normalizeTelescopes', () => {
  it('should normalize Tauri snake_case telescope data', () => {
    const tauriItems = [
      {
        id: 't1',
        name: 'Refractor',
        aperture: 80,
        focal_length: 600,
        focal_ratio: 7.5,
        is_default: true,
      },
    ];
    const result = normalizeTelescopes(tauriItems as unknown as Parameters<typeof normalizeTelescopes>[0], true);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
    expect(result[0].focalLength).toBe(600);
    expect(result[0].focalRatio).toBe(7.5);
    expect(result[0].isDefault).toBe(true);
  });

  it('should normalize Web camelCase telescope data', () => {
    const webItems = [
      {
        id: 't2',
        name: 'SCT',
        aperture: 200,
        focalLength: 2000,
      },
    ];
    const result = normalizeTelescopes(webItems as unknown as Parameters<typeof normalizeTelescopes>[0], false);
    expect(result).toHaveLength(1);
    expect(result[0].focalLength).toBe(2000);
    expect(result[0].focalRatio).toBe(10); // 2000/200
    expect(result[0].isDefault).toBe(false);
  });

  it('should handle zero aperture for Web telescope', () => {
    const webItems = [
      {
        id: 't3',
        name: 'Unknown',
        aperture: 0,
        focalLength: 500,
      },
    ];
    const result = normalizeTelescopes(webItems as unknown as Parameters<typeof normalizeTelescopes>[0], false);
    expect(result[0].focalRatio).toBe(0);
  });
});

describe('normalizeCameras', () => {
  it('should normalize Tauri snake_case camera data', () => {
    const tauriItems = [
      {
        id: 'c1',
        name: 'ASI294',
        sensor_width: 23.2,
        sensor_height: 15.5,
        is_default: true,
      },
    ];
    const result = normalizeCameras(tauriItems as unknown as Parameters<typeof normalizeCameras>[0], true);
    expect(result).toHaveLength(1);
    expect(result[0].sensorWidth).toBe(23.2);
    expect(result[0].sensorHeight).toBe(15.5);
    expect(result[0].isDefault).toBe(true);
  });

  it('should normalize Web camelCase camera data', () => {
    const webItems = [
      {
        id: 'c2',
        name: 'Canon EOS',
        sensorWidth: 22.3,
        sensorHeight: 14.9,
      },
    ];
    const result = normalizeCameras(webItems as unknown as Parameters<typeof normalizeCameras>[0], false);
    expect(result).toHaveLength(1);
    expect(result[0].sensorWidth).toBe(22.3);
    expect(result[0].isDefault).toBe(false);
  });
});
