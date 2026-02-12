/**
 * Client-Side Detection Hook
 * 
 * SSR-safe hook to detect if the component is rendering on the client.
 * Uses useSyncExternalStore to avoid hydration mismatches.
 */

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Hook to safely check if we're on the client side.
 * Returns false during SSR and true after hydration.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
