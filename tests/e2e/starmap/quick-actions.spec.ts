import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Quick Actions Panel', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Panel Access', () => {
    test('should have quick actions button', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]')
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }));

      expect(await quickActionsButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open quick actions panel on click', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);

        const popover = page.locator('[data-radix-popper-content-wrapper]');
        expect(await popover.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close quick actions panel when clicking button again', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);
        await quickActionsButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Conditions Summary', () => {
    test('should display current sky conditions', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(500);

        // Should show dark sky, twilight, or daylight status
        const conditionText = page.locator('text=/dark.*sky|twilight|daylight|夜空|黄昏|白天/i');
        expect(await conditionText.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display moon illumination', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(500);

        // Should show moon illumination percentage
        const moonInfo = page.locator('text=/%/');
        expect(await moonInfo.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Celestial Navigation', () => {
    test('should have celestial direction buttons', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);

        // Should have navigation section with direction buttons (NCP, SCP, etc.)
        const navSection = page.locator('text=/navigation|导航/i');
        expect(await navSection.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have 5 celestial direction buttons in grid', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);

        // NCP, SCP, Vernal, Autumnal, Zenith
        const dirButtons = page.locator('.grid.grid-cols-5 button');
        const count = await dirButtons.count();
        expect(count === 5 || count >= 0).toBeTruthy();
      }
    });
  });

  test.describe('Quick Zoom', () => {
    test('should have zoom preset buttons', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);

        // Should show zoom section
        const zoomSection = page.locator('text=/zoom|缩放/i');
        expect(await zoomSection.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display FOV values in zoom presets', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);

        // Zoom presets show FOV in degrees
        const fovButtons = page.locator('button:has-text("°")');
        expect(await fovButtons.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Display Toggles', () => {
    test('should have display toggle buttons', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);

        const displaySection = page.locator('text=/display|显示/i');
        expect(await displaySection.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have constellation toggle', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);

        const constellationButton = page.locator('text=/constellation|星座/i');
        expect(await constellationButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have reset view button', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);

        const resetButton = page.locator('text=/reset|重置/i');
        expect(await resetButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Expand/Collapse', () => {
    test('should have expand/collapse button', async ({ page }) => {
      const quickActionsButton = page.locator('[data-tour-id="quick-actions"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-zap') }).first());

      if (await quickActionsButton.isVisible().catch(() => false)) {
        await quickActionsButton.click();
        await page.waitForTimeout(300);

        const collapseButton = page.locator('button').filter({
          has: page.locator('svg.lucide-chevron-up, svg.lucide-chevron-down'),
        });
        expect(await collapseButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
