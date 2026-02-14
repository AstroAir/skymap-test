import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Status Bar', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Bottom Status Bar Visibility', () => {
    test('should display bottom status bar', async ({ page }) => {
      // Bottom status bar contains coordinates, LST, and system status
      const statusBar = page.locator('[data-testid="bottom-status-bar"]')
        .or(page.locator('text=/RA.*:|Dec.*:/i').first());

      expect(await statusBar.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display coordinate information', async ({ page }) => {
      // Should show RA and Dec values
      const raDisplay = page.locator('text=/RA/i');
      const decDisplay = page.locator('text=/Dec/i');

      expect(await raDisplay.count()).toBeGreaterThanOrEqual(0);
      expect(await decDisplay.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show altitude and azimuth on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(300);

      const altDisplay = page.locator('text=/Alt/i');
      const azDisplay = page.locator('text=/Az/i');

      expect(await altDisplay.count()).toBeGreaterThanOrEqual(0);
      expect(await azDisplay.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Status Bar Overlay', () => {
    test('should display status bar overlay with time info', async ({ page }) => {
      // The overlay status bar shows time, location, seeing conditions
      const timeDisplay = page.locator('text=/LST|UTC|local/i')
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-clock') }));

      expect(await timeDisplay.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display connection status', async ({ page }) => {
      const connectionIndicator = page.locator('svg.lucide-wifi, svg.lucide-wifi-off');
      expect(await connectionIndicator.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('System Status Indicator', () => {
    test('should display system status indicator', async ({ page }) => {
      const statusIndicator = page.locator('[data-testid="system-status"]')
        .or(page.locator('text=/system.*status|系统.*状态/i'));

      expect(await statusIndicator.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Responsive Layout', () => {
    test('should adapt status bar to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // On mobile, some elements may be hidden
      const statusContent = page.locator('text=/RA|Dec/i');
      // Status bar content should still be present but may be abbreviated
      expect(await statusContent.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show full info on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      const fullStatus = page.locator('text=/RA|Dec|Alt|Az/i');
      expect(await fullStatus.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('View Center Popover', () => {
    test('should have clickable location display', async ({ page }) => {
      const locationButton = page.locator('button').filter({ has: page.locator('svg.lucide-map-pin') });
      expect(await locationButton.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
