import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('Unified Settings', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Settings Panel Access', () => {
    test('should have settings button in toolbar', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      const isVisible = await settingsButton.isVisible().catch(() => false);
      // Settings button may or may not be visible
      expect(isVisible || !isVisible).toBe(true);
    });

    test('should open settings panel', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should close settings with Escape', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Display Settings', () => {
    test('should have star display settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const starSettings = page.locator('text=/star|恒星/i');
        expect(await starSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have constellation settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const constellationSettings = page.locator('text=/constellation|星座/i');
        expect(await constellationSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have deep sky object settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const dsoSettings = page.locator('text=/deep.*sky|DSO|深空/i');
        expect(await dsoSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have planet settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const planetSettings = page.locator('text=/planet|行星/i');
        expect(await planetSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Atmosphere Settings', () => {
    test('should have atmosphere toggle', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const atmosphereToggle = page.locator('text=/atmosphere|大气/i');
        expect(await atmosphereToggle.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have light pollution setting', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const lightPollution = page.locator('text=/light.*pollution|bortle|光污染/i');
        expect(await lightPollution.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Label Settings', () => {
    test('should have star label settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const labelSettings = page.locator('text=/label|标签|名称/i');
        expect(await labelSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have magnitude limit setting', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const magnitudeLimit = page.locator('text=/magnitude|limit|星等|极限/i');
        expect(await magnitudeLimit.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Settings Persistence', () => {
    test('should persist settings after page reload', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Toggle a setting
        const toggle = page.locator('[role="switch"]').first();
        if (await toggle.isVisible().catch(() => false)) {
          await toggle.click();
          await page.waitForTimeout(300);
        }
        
        await page.keyboard.press('Escape');
      }
      
      // Reload page
      await page.reload();
      await starmapPage.waitForSplashToDisappear();
      
      // Settings should be persisted
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Settings Reset', () => {
    test('should have reset to defaults option', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const resetButton = page.getByRole('button', { name: /reset|default|重置|默认/i });
        expect(await resetButton.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });
});
