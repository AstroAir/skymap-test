'use client';

import { useCallback, RefObject } from 'react';
import type { StellariumEngine } from '@/lib/core/types';

type ValueWatchCallback = (path: string, value: unknown) => void;

const valueWatchers = new WeakMap<StellariumEngine, Set<ValueWatchCallback>>();
const bridgeInstalled = new WeakSet<StellariumEngine>();

function getWatchers(stel: StellariumEngine): Set<ValueWatchCallback> {
  let watchers = valueWatchers.get(stel);
  if (!watchers) {
    watchers = new Set<ValueWatchCallback>();
    valueWatchers.set(stel, watchers);
  }
  return watchers;
}

function ensureBridge(stel: StellariumEngine): void {
  if (bridgeInstalled.has(stel)) return;
  if (!stel.onValueChanged) return;

  stel.onValueChanged((path, value) => {
    const watchers = valueWatchers.get(stel);
    if (!watchers) return;
    for (const callback of watchers) {
      callback(path, value);
    }
  });
  bridgeInstalled.add(stel);
}

export function useStellariumValueWatch(stelRef: RefObject<StellariumEngine | null>) {
  const watchValue = useCallback((callback: ValueWatchCallback): (() => void) => {
    const stel = stelRef.current;
    if (!stel) {
      return () => undefined;
    }

    ensureBridge(stel);
    const watchers = getWatchers(stel);
    watchers.add(callback);

    return () => {
      watchers.delete(callback);
    };
  }, [stelRef]);

  return { watchValue };
}
