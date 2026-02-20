import { test, expect } from '@playwright/test';

function strictOsmOnlyConfig() {
  return {
    defaultProvider: 'openstreetmap',
    providers: [
      {
        provider: 'openstreetmap',
        priority: 1,
        enabled: true,
        config: {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 0,
          rateLimit: 1000,
        },
      },
      { provider: 'google', priority: 2, enabled: false, config: {} },
      { provider: 'mapbox', priority: 3, enabled: false, config: {} },
    ],
    apiKeys: [],
    fallbackStrategy: 'priority',
    healthCheckInterval: 300000,
    enableAutoFallback: true,
    cacheResponses: false,
    cacheDuration: 3600000,
    enableOfflineMode: false,
    policyMode: 'strict',
    searchBehaviorWhenNoAutocomplete: 'submit-only',
    configVersion: 2,
  };
}

test.describe('Map Compliance And Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Keep provider health checks deterministic in CI by stubbing OSM tile probes.
    await page.route('**/tile.openstreetmap.org/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: '',
      });
    });

    await page.addInitScript((config) => {
      localStorage.setItem('skymap-map-config', JSON.stringify(config));
    }, strictOsmOnlyConfig());
  });

  test('strict mode suppresses OSM search-as-you-type and only searches on submit', async ({ page }) => {
    let nominatimSearchRequests = 0;
    await page.route('**/nominatim.openstreetmap.org/search**', async (route) => {
      nominatimSearchRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            place_id: 1,
            licence: 'test',
            osm_type: 'node',
            osm_id: 1,
            lat: '39.9042',
            lon: '116.4074',
            class: 'place',
            type: 'city',
            place_rank: 16,
            importance: 0.8,
            addresstype: 'city',
            name: 'Beijing',
            display_name: 'Beijing, China',
            address: { city: 'Beijing', country: 'China', country_code: 'cn' },
            boundingbox: ['39.8', '40.0', '116.3', '116.5'],
          },
        ]),
      });
    });

    await page.goto('/test-map', { waitUntil: 'domcontentloaded' });
    const input = page.getByPlaceholder('Search for a location...').first();
    await expect(input).toBeVisible();

    await input.fill('Beijing');
    await page.waitForTimeout(600);
    expect(nominatimSearchRequests).toBe(0);

    await input.press('Enter');
    await expect.poll(() => nominatimSearchRequests).toBeGreaterThan(0);
  });

  test('offline mode blocks online search and keeps UI usable', async ({ page, context }) => {
    await page.addInitScript((config) => {
      config.enableOfflineMode = true;
      localStorage.setItem('skymap-map-config', JSON.stringify(config));
    }, strictOsmOnlyConfig());
    await page.goto('/test-map', { waitUntil: 'domcontentloaded' });
    await context.setOffline(true);
    const input = page.getByPlaceholder('Search for a location...').first();
    await expect(input).toBeVisible();

    await input.fill('Shanghai');
    await expect(page.getByText(/offline mode: online search disabled/i)).toBeVisible();
  });

  test('location selection syncs into picker coordinates', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            place_id: 2,
            licence: 'test',
            osm_type: 'node',
            osm_id: 2,
            lat: '31.2304',
            lon: '121.4737',
            class: 'place',
            type: 'city',
            place_rank: 16,
            importance: 0.8,
            addresstype: 'city',
            name: 'Shanghai',
            display_name: 'Shanghai, China',
            address: { city: 'Shanghai', country: 'China', country_code: 'cn' },
            boundingbox: ['31.1', '31.3', '121.3', '121.6'],
          },
        ]),
      });
    });

    await page.goto('/test-map', { waitUntil: 'domcontentloaded' });
    const input = page.getByPlaceholder('Search for a location...').first();
    await input.fill('Shanghai');
    await input.press('Enter');
    const result = page.getByText('Shanghai, China').first();
    await expect(result).toBeVisible();
    await result.click();

    await expect(page.getByTestId('current-lat')).toHaveText('31.230400');
    await expect(page.getByTestId('current-lng')).toHaveText('121.473700');
  });
});
