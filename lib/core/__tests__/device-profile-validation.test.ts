import { validateDeviceProfile } from '@/lib/core/device-profile-validation';
import type { DeviceProfile } from '@/lib/core/types/device';

function createBaseProfile(overrides: Partial<DeviceProfile> = {}): DeviceProfile {
  return {
    id: 'camera-1',
    name: 'Test Camera',
    type: 'camera',
    source: 'manual',
    enabled: true,
    metadata: {
      sensorWidth: 23.5,
      sensorHeight: 15.6,
      pixelSize: 3.76,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as DeviceProfile;
}

describe('device-profile-validation', () => {
  it('accepts a valid camera profile', () => {
    const result = validateDeviceProfile(createBaseProfile());
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects camera profile with missing sensor dimensions', () => {
    const result = validateDeviceProfile(createBaseProfile({
      metadata: {
        sensorWidth: 0,
        sensorHeight: undefined,
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.field === 'metadata.sensorWidth')).toBe(true);
    expect(result.issues.some((issue) => issue.field === 'metadata.sensorHeight')).toBe(true);
  });

  it('rejects mount profile with invalid connection metadata', () => {
    const result = validateDeviceProfile(createBaseProfile({
      id: 'mount-1',
      name: 'Mount',
      type: 'mount',
      metadata: {
        protocol: 'alpaca',
        host: '',
        port: 0,
        deviceId: -1,
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.field === 'metadata.host')).toBe(true);
    expect(result.issues.some((issue) => issue.field === 'metadata.port')).toBe(true);
    expect(result.issues.some((issue) => issue.field === 'metadata.deviceId')).toBe(true);
  });

  it('rejects telescope profile with invalid optical metadata', () => {
    const result = validateDeviceProfile(createBaseProfile({
      id: 'scope-1',
      name: 'Scope',
      type: 'telescope',
      metadata: {
        focalLength: -500,
        aperture: 0,
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.field === 'metadata.focalLength')).toBe(true);
    expect(result.issues.some((issue) => issue.field === 'metadata.aperture')).toBe(true);
  });
});
