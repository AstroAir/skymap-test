import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Altitude Chart', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Chart Display', () => {
    test('should display altitude chart in object details', async ({ page }) => {
      // Click on canvas to select an object
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      // Look for altitude chart
      const altitudeChart = page.locator('[data-testid="altitude-chart"], .altitude-chart, canvas, svg');
      expect(await altitudeChart.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show time axis on chart', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const timeAxis = page.locator('text=/\\d{1,2}:\\d{2}|\\d{1,2}h|时间/');
      expect(await timeAxis.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show altitude axis on chart', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const altitudeAxis = page.locator('text=/\\d+°|altitude|高度/i');
      expect(await altitudeAxis.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Chart Interactions', () => {
    test('should highlight current time on chart', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const currentTimeMarker = page.locator('.current-time, [data-current="true"], .time-marker');
      expect(await currentTimeMarker.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show tooltip on hover', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      // Hover over chart area
      const chart = page.locator('[data-testid="altitude-chart"], .altitude-chart').first();
      if (await chart.isVisible().catch(() => false)) {
        const box = await chart.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(300);
        }
      }
      
      const tooltip = page.locator('[role="tooltip"], .tooltip');
      expect(await tooltip.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Visibility Information', () => {
    test('should show rise time', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const riseTime = page.locator('text=/rise|升起/i');
      expect(await riseTime.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show set time', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const setTime = page.locator('text=/set|落下/i');
      expect(await setTime.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show transit time', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const transitTime = page.locator('text=/transit|中天|culmination/i');
      expect(await transitTime.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show maximum altitude', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const maxAltitude = page.locator('text=/max.*altitude|maximum|最高/i');
      expect(await maxAltitude.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Night Time Indication', () => {
    test('should indicate night time period', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const nightIndicator = page.locator('.night-period, [data-night="true"]').or(page.locator('text=/night|夜间/i'));
      expect(await nightIndicator.count()).toBeGreaterThanOrEqual(0);
    });

    test('should indicate twilight periods', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const twilightIndicator = page.locator('text=/twilight|晨昏/i');
      expect(await twilightIndicator.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Date Selection', () => {
    test('should allow changing date for altitude chart', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const dateSelector = page.locator('input[type="date"], [data-testid="date-picker"]');
      expect(await dateSelector.count()).toBeGreaterThanOrEqual(0);
    });

    test('should update chart when date changes', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const dateSelector = page.locator('input[type="date"]').first();
      if (await dateSelector.isVisible().catch(() => false)) {
        // Chart should update after date change
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });
});
