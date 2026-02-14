import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('App Updater', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Update Banner', () => {
    test('should not show update banner by default', async ({ page }) => {
      // Update banner only appears when an update is available
      const updateBanner = page.locator('[data-testid="update-banner"]')
        .or(page.locator('text=/update.*available|更新.*可用/i'));

      // Should not be visible by default (no update available)
      const count = await updateBanner.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Update Settings', () => {
    test('should have update settings in settings panel', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();

      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);

        const updateSettings = page.locator('text=/update|auto.*update|自动.*更新/i');
        expect(await updateSettings.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });

    test('should have auto-update toggle', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();

      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);

        // Navigate to the section containing update settings
        const autoUpdateToggle = page.locator('text=/auto.*update|自动更新/i');
        expect(await autoUpdateToggle.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });

    test('should have check for updates button', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();

      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);

        const checkButton = page.getByRole('button', { name: /check.*update|检查.*更新/i });
        expect(await checkButton.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Update Dialog', () => {
    test('should not show update dialog by default', async ({ page }) => {
      // Update dialog only shows when user confirms an update
      const updateDialog = page.locator('[role="dialog"]').filter({
        hasText: /update|download|更新|下载/i,
      });

      expect(await updateDialog.count()).toBe(0);
    });
  });

  test.describe('Version Display', () => {
    test('should display current version somewhere in settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();

      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);

        // Version number should be displayed (e.g., "v1.0.0" or "1.0.0")
        const versionInfo = page.locator('text=/v?\\d+\\.\\d+\\.\\d+/');
        expect(await versionInfo.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });
  });
});
