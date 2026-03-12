import {
  normalizeLegacyEquipmentProfiles,
  normalizePersistedDeviceProfiles,
} from '@/lib/core/device-profile-normalize';

describe('device-profile-normalize', () => {
  it('normalizes valid persisted profiles and skips corrupted entries', () => {
    const report = normalizePersistedDeviceProfiles([
      {
        id: 'camera-1',
        name: 'Camera 1',
        type: 'camera',
        source: 'manual',
        enabled: true,
        metadata: {
          sensorWidth: 23.5,
          sensorHeight: 15.6,
          pixelSize: 3.76,
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: '',
        type: 'camera',
      },
      {
        foo: 'bar',
      },
    ]);

    expect(report.profiles).toHaveLength(1);
    expect(report.profiles[0]?.id).toBe('camera-1');
    expect(report.skippedCount).toBe(2);
  });

  it('creates legacy profiles from custom camera/telescope payloads', () => {
    const profiles = normalizeLegacyEquipmentProfiles(
      [
        { id: 'cam-1', name: 'Legacy Cam', sensorWidth: 10, sensorHeight: 8, pixelSize: 2.4 },
      ],
      [
        { id: 'scope-1', name: 'Legacy Scope', focalLength: 800, aperture: 120, type: 'APO' },
      ],
    );

    expect(profiles).toHaveLength(2);
    expect(profiles.some((profile) => profile.type === 'camera')).toBe(true);
    expect(profiles.some((profile) => profile.type === 'telescope')).toBe(true);
    expect(profiles[0]?.source).toBe('equipment-store');
  });

  it('ignores malformed legacy records', () => {
    const profiles = normalizeLegacyEquipmentProfiles(
      [{ id: 'cam-1', sensorWidth: 10 }],
      [{ id: 'scope-1', focalLength: 800 }],
    );
    expect(profiles).toHaveLength(0);
  });
});
