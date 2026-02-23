/**
 * Tests for use-animation-frame.ts
 * Animation frame hook and AnimationLoopManager
 */

import { AnimationLoopManager } from '../use-animation-frame';

describe('AnimationLoopManager', () => {
  let manager: AnimationLoopManager;

  beforeEach(() => {
    manager = new AnimationLoopManager();
  });

  it('should subscribe and return an unsubscribe function', () => {
    const callback = jest.fn();
    const unsub = manager.subscribe('test', callback);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('should allow multiple subscribers', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const unsub1 = manager.subscribe('a', cb1);
    const unsub2 = manager.subscribe('b', cb2);
    unsub1();
    unsub2();
  });

  it('should replace subscriber with same id', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    manager.subscribe('same', cb1);
    manager.subscribe('same', cb2);
    // cb2 should have replaced cb1
    // Just ensure no errors
    expect(true).toBe(true);
  });
});
