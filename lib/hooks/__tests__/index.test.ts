/**
 * @jest-environment jsdom
 */
import * as hooks from '../index';

describe('Hooks Module Exports', () => {
  it('exports useGeolocation', () => {
    expect(hooks.useGeolocation).toBeDefined();
    expect(typeof hooks.useGeolocation).toBe('function');
  });

  it('exports getLocationWithFallback', () => {
    expect(hooks.getLocationWithFallback).toBeDefined();
    expect(typeof hooks.getLocationWithFallback).toBe('function');
  });

  it('exports useOrientation', () => {
    expect(hooks.useOrientation).toBeDefined();
    expect(typeof hooks.useOrientation).toBe('function');
  });

  it('exports useObjectSearch', () => {
    expect(hooks.useObjectSearch).toBeDefined();
    expect(typeof hooks.useObjectSearch).toBe('function');
  });

  it('exports useCelestialName', () => {
    expect(hooks.useCelestialName).toBeDefined();
    expect(typeof hooks.useCelestialName).toBe('function');
  });

  it('exports useCelestialNames', () => {
    expect(hooks.useCelestialNames).toBeDefined();
    expect(typeof hooks.useCelestialNames).toBe('function');
  });

  it('exports useCelestialNameWithOriginal', () => {
    expect(hooks.useCelestialNameWithOriginal).toBeDefined();
    expect(typeof hooks.useCelestialNameWithOriginal).toBe('function');
  });

  it('exports useSkyCultureLanguage', () => {
    expect(hooks.useSkyCultureLanguage).toBeDefined();
    expect(typeof hooks.useSkyCultureLanguage).toBe('function');
  });

  it('exports getCelestialNameTranslation', () => {
    expect(hooks.getCelestialNameTranslation).toBeDefined();
    expect(typeof hooks.getCelestialNameTranslation).toBe('function');
  });

  it('exports useTonightRecommendations', () => {
    expect(hooks.useTonightRecommendations).toBeDefined();
    expect(typeof hooks.useTonightRecommendations).toBe('function');
  });

  it('exports useTargetPlanner', () => {
    expect(hooks.useTargetPlanner).toBeDefined();
    expect(typeof hooks.useTargetPlanner).toBe('function');
  });
});
