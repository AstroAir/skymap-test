/**
 * @jest-environment jsdom
 */

/**
 * StellariumCanvas Component Tests
 * 
 * This component has complex dependencies on:
 * - Stellarium Web Engine WebGL rendering
 * - Canvas element with WebGL context
 * - Complex initialization and lifecycle management
 * 
 * For comprehensive testing, consider integration tests or E2E tests.
 */

describe('StellariumCanvas', () => {
  it('exports the component correctly', async () => {
    const canvasModule = await import('../StellariumCanvas');
    expect(canvasModule.StellariumCanvas).toBeDefined();
  });

  it('component is a valid React component', async () => {
    const canvasModule = await import('../StellariumCanvas');
    // memo components are objects with $$typeof Symbol
    expect(canvasModule.StellariumCanvas).toBeTruthy();
    expect(typeof canvasModule.StellariumCanvas === 'function' || typeof canvasModule.StellariumCanvas === 'object').toBe(true);
  });
});
