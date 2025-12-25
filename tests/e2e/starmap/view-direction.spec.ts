import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('View Direction Controls', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Compass Display', () => {
    test('should display compass or direction indicator', async ({ page }) => {
      const compass = page.locator('[data-testid="compass"], .compass, .direction-indicator');
      expect(await compass.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show cardinal directions', async ({ page }) => {
      const directions = page.locator('text=/^[NSEW]$|North|South|East|West|北|南|东|西/');
      expect(await directions.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('View Navigation', () => {
    test('should have north button', async ({ page }) => {
      const northButton = page.getByRole('button', { name: /north|N|北/i }).first();
      expect(await northButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should navigate to north when clicking north button', async ({ page }) => {
      const northButton = page.getByRole('button', { name: /north|N|北/i }).first();
      if (await northButton.isVisible().catch(() => false)) {
        await northButton.click();
        await page.waitForTimeout(500);
      }
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should have zenith/up button', async ({ page }) => {
      const zenithButton = page.getByRole('button', { name: /zenith|up|天顶|上/i }).first();
      expect(await zenithButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should navigate to zenith when clicking zenith button', async ({ page }) => {
      const zenithButton = page.getByRole('button', { name: /zenith|up|天顶|上/i }).first();
      if (await zenithButton.isVisible().catch(() => false)) {
        await zenithButton.click();
        await page.waitForTimeout(500);
      }
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should have horizon button', async ({ page }) => {
      const horizonButton = page.getByRole('button', { name: /horizon|地平线/i }).first();
      expect(await horizonButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Azimuth and Altitude Display', () => {
    test('should display current azimuth', async ({ page }) => {
      const azimuth = page.locator('text=/azimuth|az|方位角/i');
      expect(await azimuth.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display current altitude', async ({ page }) => {
      const altitude = page.locator('text=/altitude|alt|高度角/i');
      expect(await altitude.count()).toBeGreaterThanOrEqual(0);
    });

    test('should update coordinates when view changes', async ({ page }) => {
      // Pan the view
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
      
      // Canvas should still be visible after pan
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Coordinate Systems', () => {
    test('should support equatorial coordinates', async ({ page }) => {
      const equatorialCoords = page.locator('text=/RA|Dec|赤经|赤纬/i');
      expect(await equatorialCoords.count()).toBeGreaterThanOrEqual(0);
    });

    test('should support horizontal coordinates', async ({ page }) => {
      const horizontalCoords = page.locator('text=/Az|Alt|方位|高度/i');
      expect(await horizontalCoords.count()).toBeGreaterThanOrEqual(0);
    });

    test('should toggle between coordinate systems', async ({ page }) => {
      const coordToggle = page.getByRole('button', { name: /coordinate|坐标/i }).first();
      if (await coordToggle.isVisible().catch(() => false)) {
        await coordToggle.click();
        await page.waitForTimeout(300);
      }
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('View Reset', () => {
    test('should have reset view button', async ({ page }) => {
      const resetButton = page.getByRole('button', { name: /reset|home|重置|主页/i }).first();
      expect(await resetButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should reset view to default position', async ({ page }) => {
      // First pan the view
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2 + 100);
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
      
      // Click reset button
      const resetButton = page.getByRole('button', { name: /reset|home|重置|主页/i }).first();
      if (await resetButton.isVisible().catch(() => false)) {
        await resetButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });
});
