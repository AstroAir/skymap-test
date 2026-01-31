/**
 * High-performance animation frame hook with throttling support
 * Consolidates multiple animation updates into a single RAF loop
 */

import { useEffect, useRef } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('use-animation-frame');

export interface AnimationFrameOptions {
  /** Target FPS (default: 60) */
  fps?: number;
  /** Whether the animation is active (default: true) */
  enabled?: boolean;
  /** Callback to run on each frame */
  callback: (deltaTime: number, timestamp: number) => void;
}

/**
 * Hook for running animations at a target FPS using requestAnimationFrame
 * Automatically handles cleanup and provides delta time for smooth animations
 */
export function useAnimationFrame({
  fps = 60,
  enabled = true,
  callback,
}: AnimationFrameOptions): void {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  
  // Update callback ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const minInterval = 1000 / fps;
    let running = true;

    const animate = (timestamp: number) => {
      if (!running) return;

      const deltaTime = timestamp - lastTimeRef.current;

      if (deltaTime >= minInterval) {
        lastTimeRef.current = timestamp - (deltaTime % minInterval);
        callbackRef.current(deltaTime, timestamp);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [fps, enabled]);
}

/**
 * Hook for throttled updates that don't need smooth animation
 * Uses requestAnimationFrame for efficiency but with configurable interval
 */
export function useThrottledUpdate(
  callback: () => void,
  intervalMs: number,
  enabled: boolean = true
): void {
  const lastUpdateRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let frameId: number;
    let running = true;

    const update = (timestamp: number) => {
      if (!running) return;

      if (timestamp - lastUpdateRef.current >= intervalMs) {
        lastUpdateRef.current = timestamp;
        callbackRef.current();
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  }, [intervalMs, enabled]);
}

/**
 * Create a shared animation loop manager for multiple subscribers
 */
export class AnimationLoopManager {
  private subscribers = new Map<string, (deltaTime: number, timestamp: number) => void>();
  private frameId: number = 0;
  private lastTime: number = 0;
  private running: boolean = false;

  subscribe(id: string, callback: (deltaTime: number, timestamp: number) => void): () => void {
    this.subscribers.set(id, callback);
    
    if (!this.running && this.subscribers.size > 0) {
      this.start();
    }

    return () => {
      this.subscribers.delete(id);
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.loop);
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.subscribers.forEach((callback) => {
      try {
        callback(deltaTime, timestamp);
      } catch (error) {
        logger.error('Animation loop error', error);
      }
    });

    this.frameId = requestAnimationFrame(this.loop);
  };
}

// Global animation loop manager singleton
export const globalAnimationLoop = new AnimationLoopManager();

/**
 * Hook to subscribe to the global animation loop
 */
export function useGlobalAnimationLoop(
  id: string,
  callback: (deltaTime: number, timestamp: number) => void,
  enabled: boolean = true
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    return globalAnimationLoop.subscribe(id, (dt, ts) => {
      callbackRef.current(dt, ts);
    });
  }, [id, enabled]);
}
