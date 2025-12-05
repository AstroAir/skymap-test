/**
 * @jest-environment jsdom
 */

/**
 * StellariumView Component Tests
 * 
 * This is the main view component with complex dependencies on:
 * - Stellarium Web Engine integration
 * - Multiple child components
 * - Complex state management across stores
 * - Keyboard and mouse event handling
 * 
 * For comprehensive testing, consider integration tests or E2E tests.
 */

describe('StellariumView', () => {
  it('exports the component correctly', async () => {
    const viewModule = await import('../stellarium-view');
    expect(viewModule.StellariumView).toBeDefined();
  });

  it('component is a function', async () => {
    const viewModule = await import('../stellarium-view');
    expect(typeof viewModule.StellariumView).toBe('function');
  });
});
