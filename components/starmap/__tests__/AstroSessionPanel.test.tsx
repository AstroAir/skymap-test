/**
 * @jest-environment jsdom
 */

/**
 * AstroSessionPanel Component Tests
 * 
 * This component has complex dependencies on:
 * - Multiple astronomical calculation functions from astro-utils
 * - Real-time updates with setInterval
 * - Complex state derived from astronomical calculations
 * 
 * The component uses useMemo with complex calculations that depend on
 * many astronomical functions. For comprehensive testing, consider
 * integration tests or E2E tests with Playwright.
 */

describe('AstroSessionPanel', () => {
  it('exports the component correctly', async () => {
    const astroModule = await import('../AstroSessionPanel');
    expect(astroModule.AstroSessionPanel).toBeDefined();
  });

  it('component is a function', async () => {
    const astroModule = await import('../AstroSessionPanel');
    expect(typeof astroModule.AstroSessionPanel).toBe('function');
  });
});
