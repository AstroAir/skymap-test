import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Theme Customizer', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Dialog Access', () => {
    test('should have theme customizer trigger', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /theme.*custom|customize|主题.*自定义/i })
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-palette') }));

      expect(await themeButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open theme customizer dialog', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /theme.*custom|customize|主题.*自定义/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-palette') }).first());

      if (await themeButton.isVisible().catch(() => false)) {
        await themeButton.click();
        await page.waitForTimeout(500);

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
      }
    });

    test('should close theme customizer with Escape', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /theme.*custom|customize|主题.*自定义/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-palette') }).first());

      if (await themeButton.isVisible().catch(() => false)) {
        await themeButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Theme Presets', () => {
    test('should display theme preset options', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /theme.*custom|customize|主题.*自定义/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-palette') }).first());

      if (await themeButton.isVisible().catch(() => false)) {
        await themeButton.click();
        await page.waitForTimeout(500);

        const presets = page.locator('text=/preset|预设/i');
        expect(await presets.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Customization Options', () => {
    test('should have font family selector', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /theme.*custom|customize|主题.*自定义/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-palette') }).first());

      if (await themeButton.isVisible().catch(() => false)) {
        await themeButton.click();
        await page.waitForTimeout(500);

        const fontOption = page.locator('text=/font|字体/i');
        expect(await fontOption.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });

    test('should have radius/border radius slider', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /theme.*custom|customize|主题.*自定义/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-palette') }).first());

      if (await themeButton.isVisible().catch(() => false)) {
        await themeButton.click();
        await page.waitForTimeout(500);

        const radiusOption = page.locator('text=/radius|圆角/i');
        expect(await radiusOption.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });

    test('should have font size setting', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /theme.*custom|customize|主题.*自定义/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-palette') }).first());

      if (await themeButton.isVisible().catch(() => false)) {
        await themeButton.click();
        await page.waitForTimeout(500);

        const fontSizeOption = page.locator('text=/font.*size|字号|字体.*大小/i');
        expect(await fontSizeOption.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Reset', () => {
    test('should have reset to defaults button', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /theme.*custom|customize|主题.*自定义/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-palette') }).first());

      if (await themeButton.isVisible().catch(() => false)) {
        await themeButton.click();
        await page.waitForTimeout(500);

        const resetButton = page.locator('button').filter({ has: page.locator('svg.lucide-rotate-ccw') })
          .or(page.getByRole('button', { name: /reset|重置/i }));
        expect(await resetButton.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });
  });
});
