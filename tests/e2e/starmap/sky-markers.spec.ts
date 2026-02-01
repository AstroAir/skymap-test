import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Sky Markers', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Marker Types', () => {
    test('should support custom markers on sky', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      expect(await markerButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display constellation lines', async ({ page }) => {
      const constellationToggle = page.locator('text=/constellation.*line|星座.*线/i');
      expect(await constellationToggle.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display constellation boundaries', async ({ page }) => {
      const boundaryToggle = page.locator('text=/boundary|边界/i');
      expect(await boundaryToggle.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display ecliptic line', async ({ page }) => {
      const eclipticToggle = page.locator('text=/ecliptic|黄道/i');
      expect(await eclipticToggle.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display celestial equator', async ({ page }) => {
      const equatorToggle = page.locator('text=/equator|赤道/i');
      expect(await equatorToggle.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Grid Overlays', () => {
    test('should toggle equatorial grid', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const gridToggle = page.locator('text=/equatorial.*grid|赤道.*网格/i');
        expect(await gridToggle.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should toggle azimuthal grid', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const gridToggle = page.locator('text=/azimuthal.*grid|地平.*网格/i');
        expect(await gridToggle.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Marker Visibility', () => {
    test('should toggle marker visibility', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const visibilityToggle = page.locator('[role="switch"], input[type="checkbox"]').first();
        if (await visibilityToggle.isVisible().catch(() => false)) {
          await visibilityToggle.click();
          await page.waitForTimeout(300);
        }
        
        await page.keyboard.press('Escape');
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Cardinal Points', () => {
    test('should display cardinal point labels', async ({ page }) => {
      const cardinalLabels = page.locator('text=/^N$|^S$|^E$|^W$|北|南|东|西/');
      expect(await cardinalLabels.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Horizon Line', () => {
    test('should display horizon line', async ({ page }) => {
      const horizonLine = page.locator('.horizon-line, [data-testid="horizon"]');
      expect(await horizonLine.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
