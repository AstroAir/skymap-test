/**
 * Tests for target-object-pool.ts
 * Shared target object creation and reuse via WeakMap pool
 */

import { getOrCreateTargetObject, pointAndLockTargetAt } from '../target-object-pool';
import type { StellariumEngine, StellariumObject } from '@/lib/core/types';

function makeStel(): StellariumEngine {
  const obj: StellariumObject = {
    pos: [0, 0, -1],
    update: jest.fn(),
  } as unknown as StellariumObject;

  return {
    createObj: jest.fn(() => obj),
    core: { selection: null },
    pointAndLock: jest.fn(),
  } as unknown as StellariumEngine;
}

describe('getOrCreateTargetObject', () => {
  it('should create a target object on first call', () => {
    const stel = makeStel();
    const target = getOrCreateTargetObject(stel);
    expect(target).toBeDefined();
    expect(stel.createObj).toHaveBeenCalledTimes(1);
  });

  it('should reuse same target object on subsequent calls', () => {
    const stel = makeStel();
    const t1 = getOrCreateTargetObject(stel);
    const t2 = getOrCreateTargetObject(stel);
    expect(t1).toBe(t2);
    expect(stel.createObj).toHaveBeenCalledTimes(1);
  });

  it('should create separate objects for different engines', () => {
    const stel1 = makeStel();
    const stel2 = makeStel();
    const t1 = getOrCreateTargetObject(stel1);
    const t2 = getOrCreateTargetObject(stel2);
    expect(t1).not.toBe(t2);
  });
});

describe('pointAndLockTargetAt', () => {
  it('should update position and lock', () => {
    const stel = makeStel();
    const pos = [1, 0, 0];
    const target = pointAndLockTargetAt(stel, pos);
    expect(target.pos).toEqual(pos);
    expect(target.update).toHaveBeenCalled();
    expect(stel.pointAndLock).toHaveBeenCalledWith(target);
    expect(stel.core.selection).toBe(target);
  });
});
