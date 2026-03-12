/**
 * @jest-environment jsdom
 */
import {
  buildARCameraAcquisitionPlan,
  type ARCameraLastKnownGoodAcquisition,
  type ARCameraPreferredDevice,
} from '../ar-camera-acquisition';

const devices = [
  { deviceId: 'cam-back', label: 'Back Camera', groupId: 'grp-back' },
  { deviceId: 'cam-front', label: 'Front Camera', groupId: 'grp-front' },
];

describe('ar-camera-acquisition', () => {
  it('orders remembered device, preferred device, then facing-mode fallbacks', () => {
    const preferredDevice: ARCameraPreferredDevice = {
      deviceId: 'cam-front',
      label: 'Front Camera',
      groupId: 'grp-front',
    };
    const lastKnownGood: ARCameraLastKnownGoodAcquisition = {
      deviceId: 'cam-back',
      label: 'Back Camera',
      groupId: 'grp-back',
      facingMode: 'environment',
      stage: 'requested-facing-mode-safe',
      updatedAt: 1700000000000,
    };

    const plan = buildARCameraAcquisitionPlan({
      devices,
      preferredDevice,
      lastKnownGood,
      requestedFacingMode: 'environment',
    });

    expect(plan.stalePreferredDevice).toBe(false);
    expect(plan.staleRememberedDevice).toBe(false);
    expect(plan.attempts.map((attempt) => attempt.stage)).toEqual([
      'remembered-device',
      'preferred-device',
      'requested-facing-mode',
      'requested-facing-mode-safe',
      'fallback-facing-mode-safe',
      'safe-default',
    ]);
    expect(plan.attempts[0]).toMatchObject({
      stage: 'remembered-device',
      deviceId: 'cam-back',
      facingMode: 'environment',
    });
    expect(plan.attempts[1]).toMatchObject({
      stage: 'preferred-device',
      deviceId: 'cam-front',
    });
  });

  it('flags stale remembered and preferred devices while keeping safe fallback attempts', () => {
    const plan = buildARCameraAcquisitionPlan({
      devices,
      preferredDevice: {
        deviceId: 'missing-preferred',
        label: 'Missing Preferred',
        groupId: 'grp-missing',
      },
      lastKnownGood: {
        deviceId: 'missing-last-good',
        label: 'Missing Last Good',
        groupId: 'grp-missing',
        facingMode: 'environment',
        stage: 'remembered-device',
        updatedAt: 1700000000000,
      },
      requestedFacingMode: 'environment',
    });

    expect(plan.stalePreferredDevice).toBe(true);
    expect(plan.staleRememberedDevice).toBe(true);
    expect(plan.attempts.map((attempt) => attempt.stage)).toEqual([
      'requested-facing-mode',
      'requested-facing-mode-safe',
      'fallback-facing-mode-safe',
      'safe-default',
    ]);
  });
});
