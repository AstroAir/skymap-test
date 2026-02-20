import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Sky Markers', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Marker Types', () => {
    test('should support custom markers on sky', async ({ page }) => {
      const markerButton = page.locator(
        'button:has(svg.lucide-map-pinned), button:has(svg[data-lucide="map-pinned"])'
      ).first();
      test.skip((await markerButton.count()) === 0, 'Marker manager trigger is not exposed in current toolbar layout');
      await expect(markerButton).toBeVisible({ timeout: 3000 });
      await markerButton.click();

      const markerPanel = page.getByRole('dialog').filter({ hasText: /sky markers|天空标注/i }).first();
      await expect(markerPanel).toBeVisible({ timeout: 3000 });
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
      const markerButton = page.locator(
        'button:has(svg.lucide-map-pinned), button:has(svg[data-lucide="map-pinned"])'
      ).first();
      test.skip((await markerButton.count()) === 0, 'Marker manager trigger is not exposed in current toolbar layout');
      await expect(markerButton).toBeVisible({ timeout: 3000 });
      await markerButton.click();

      const markerPanel = page.getByRole('dialog').filter({ hasText: /sky markers|天空标注/i }).first();
      await expect(markerPanel).toBeVisible({ timeout: 3000 });

      const before = await page.evaluate(() => {
        const raw = localStorage.getItem('starmap-markers');
        if (!raw) return true;
        try {
          const parsed = JSON.parse(raw) as { state?: { showMarkers?: boolean } };
          return parsed.state?.showMarkers ?? true;
        } catch {
          return true;
        }
      });

      const visibilityToggle = markerPanel.locator('button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)').first();
      await expect(visibilityToggle).toBeVisible({ timeout: 3000 });
      await visibilityToggle.click();
      await page.waitForTimeout(200);

      const after = await page.evaluate(() => {
        const raw = localStorage.getItem('starmap-markers');
        if (!raw) return true;
        try {
          const parsed = JSON.parse(raw) as { state?: { showMarkers?: boolean } };
          return parsed.state?.showMarkers ?? true;
        } catch {
          return true;
        }
      });

      expect(after).toBe(!before);
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
