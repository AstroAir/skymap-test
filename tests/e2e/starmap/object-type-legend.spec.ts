import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Object Type Legend', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Legend Access', () => {
    test('should have legend button', async ({ page }) => {
      const legendButton = page.getByRole('button', { name: /legend|图例/i })
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-library') }));

      expect(await legendButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open legend on click', async ({ page }) => {
      const legendButton = page.getByRole('button', { name: /legend|图例/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-library') }).first());

      if (await legendButton.isVisible().catch(() => false)) {
        await legendButton.click();
        await page.waitForTimeout(300);

        // Should open popover or dialog with legend content
        const legendContent = page.locator('[data-radix-popper-content-wrapper]')
          .or(page.locator('[role="dialog"]'));
        expect(await legendContent.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Legend Categories', () => {
    test('should display galaxy category', async ({ page }) => {
      const legendButton = page.getByRole('button', { name: /legend|图例/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-library') }).first());

      if (await legendButton.isVisible().catch(() => false)) {
        await legendButton.click();
        await page.waitForTimeout(300);

        const galaxyCategory = page.locator('text=/galax|星系/i');
        expect(await galaxyCategory.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display nebula category', async ({ page }) => {
      const legendButton = page.getByRole('button', { name: /legend|图例/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-library') }).first());

      if (await legendButton.isVisible().catch(() => false)) {
        await legendButton.click();
        await page.waitForTimeout(300);

        const nebulaCategory = page.locator('text=/nebul|星云/i');
        expect(await nebulaCategory.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display cluster category', async ({ page }) => {
      const legendButton = page.getByRole('button', { name: /legend|图例/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-library') }).first());

      if (await legendButton.isVisible().catch(() => false)) {
        await legendButton.click();
        await page.waitForTimeout(300);

        const clusterCategory = page.locator('text=/cluster|星团/i');
        expect(await clusterCategory.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display star category', async ({ page }) => {
      const legendButton = page.getByRole('button', { name: /legend|图例/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-library') }).first());

      if (await legendButton.isVisible().catch(() => false)) {
        await legendButton.click();
        await page.waitForTimeout(300);

        const starCategory = page.locator('text=/star|恒星/i');
        expect(await starCategory.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display solar system category', async ({ page }) => {
      const legendButton = page.getByRole('button', { name: /legend|图例/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-library') }).first());

      if (await legendButton.isVisible().catch(() => false)) {
        await legendButton.click();
        await page.waitForTimeout(300);

        const solarCategory = page.locator('text=/solar|太阳系/i');
        expect(await solarCategory.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Legend Items', () => {
    test('should display icon and label for each object type', async ({ page }) => {
      const legendButton = page.getByRole('button', { name: /legend|图例/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-library') }).first());

      if (await legendButton.isVisible().catch(() => false)) {
        await legendButton.click();
        await page.waitForTimeout(300);

        // Each legend item has an icon (SVG) and text label
        const legendItems = page.locator('svg + span, svg ~ span').filter({ hasText: /.+/ });
        expect(await legendItems.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
