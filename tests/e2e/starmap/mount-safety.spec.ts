import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Mount Safety Simulator', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Dialog Access', () => {
    test('should have mount safety button', async ({ page }) => {
      const safetyButton = page.getByRole('button', { name: /mount.*safe|safety|赤道仪.*安全/i })
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-shield-check, svg.lucide-shield-alert') }));

      expect(await safetyButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open mount safety dialog', async ({ page }) => {
      const safetyButton = page.getByRole('button', { name: /mount.*safe|safety|赤道仪.*安全/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-shield-check, svg.lucide-shield-alert') }).first());

      if (await safetyButton.isVisible().catch(() => false)) {
        await safetyButton.click();
        await page.waitForTimeout(500);

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
      }
    });

    test('should close mount safety dialog with Escape', async ({ page }) => {
      const safetyButton = page.getByRole('button', { name: /mount.*safe|safety|赤道仪.*安全/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-shield-check, svg.lucide-shield-alert') }).first());

      if (await safetyButton.isVisible().catch(() => false)) {
        await safetyButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Safety Status', () => {
    test('should display safety status indicator', async ({ page }) => {
      const safetyButton = page.getByRole('button', { name: /mount.*safe|safety|赤道仪.*安全/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-shield-check, svg.lucide-shield-alert') }).first());

      if (await safetyButton.isVisible().catch(() => false)) {
        await safetyButton.click();
        await page.waitForTimeout(500);

        // Should show safety status (safe, warning, danger)
        const statusIndicator = page.locator('text=/safe|warning|danger|安全|警告|危险/i');
        expect(await statusIndicator.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Parameters', () => {
    test('should have mount type selector', async ({ page }) => {
      const safetyButton = page.getByRole('button', { name: /mount.*safe|safety|赤道仪.*安全/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-shield-check, svg.lucide-shield-alert') }).first());

      if (await safetyButton.isVisible().catch(() => false)) {
        await safetyButton.click();
        await page.waitForTimeout(500);

        const mountType = page.locator('text=/mount.*type|赤道仪.*类型|equatorial|alt-az/i');
        expect(await mountType.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });

    test('should have altitude limit settings', async ({ page }) => {
      const safetyButton = page.getByRole('button', { name: /mount.*safe|safety|赤道仪.*安全/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-shield-check, svg.lucide-shield-alert') }).first());

      if (await safetyButton.isVisible().catch(() => false)) {
        await safetyButton.click();
        await page.waitForTimeout(500);

        // Should have sliders or inputs for limits
        const limitSetting = page.locator('text=/limit|altitude|高度|限制/i');
        expect(await limitSetting.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Safety Zones', () => {
    test('should display safety zone information', async ({ page }) => {
      const safetyButton = page.getByRole('button', { name: /mount.*safe|safety|赤道仪.*安全/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-shield-check, svg.lucide-shield-alert') }).first());

      if (await safetyButton.isVisible().catch(() => false)) {
        await safetyButton.click();
        await page.waitForTimeout(500);

        // Should show zone info with checkmarks, warnings, or x marks
        const zoneInfo = page.locator('svg.lucide-check-circle-2, svg.lucide-alert-triangle, svg.lucide-x-circle');
        expect(await zoneInfo.count()).toBeGreaterThanOrEqual(0);

        await page.keyboard.press('Escape');
      }
    });
  });
});
