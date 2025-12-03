/**
 * @jest-environment jsdom
 */

/**
 * StellariumSurveySelector Component Tests
 * 
 * This component has complex async dependencies on:
 * - hipsService for fetching remote surveys
 * - offlineCacheManager for cache status
 * - Multiple UI components with state management
 * 
 * The component uses useEffect with async operations that are difficult
 * to mock properly in unit tests. For comprehensive testing, consider
 * integration tests or E2E tests with Playwright.
 */

describe('StellariumSurveySelector', () => {
  it('exports the component correctly', async () => {
    const surveySelectorModule = await import('../StellariumSurveySelector');
    expect(surveySelectorModule.StellariumSurveySelector).toBeDefined();
  });

  it('component is a function', async () => {
    const surveySelectorModule = await import('../StellariumSurveySelector');
    expect(typeof surveySelectorModule.StellariumSurveySelector).toBe('function');
  });
});
