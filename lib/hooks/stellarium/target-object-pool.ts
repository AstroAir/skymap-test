import type { StellariumEngine, StellariumObject } from '@/lib/core/types';

const targetPool = new WeakMap<StellariumEngine, StellariumObject>();

function createTargetObject(stel: StellariumEngine): StellariumObject {
  return stel.createObj('circle', {
    id: 'sharedTargetCircle',
    pos: [0, 0, -1],
    color: [0, 0, 0, 0.1],
    size: [0.05, 0.05],
  });
}

export function getOrCreateTargetObject(stel: StellariumEngine): StellariumObject {
  let target = targetPool.get(stel);
  if (!target) {
    target = createTargetObject(stel);
    targetPool.set(stel, target);
  }
  return target;
}

export function pointAndLockTargetAt(stel: StellariumEngine, cirsPosition: number[]): StellariumObject {
  const target = getOrCreateTargetObject(stel);
  target.pos = cirsPosition;
  target.update();
  stel.core.selection = target;
  stel.pointAndLock(target);
  return target;
}
