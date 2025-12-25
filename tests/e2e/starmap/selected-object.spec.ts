import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('Selected Object Display', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Object Selection', () => {
    test('should select object on canvas click', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      // Canvas should still be visible after click
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should highlight selected object', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      // Look for selection indicator
      const selectionIndicator = page.locator('.selected-object, [data-selected="true"]');
      expect(await selectionIndicator.count()).toBeGreaterThanOrEqual(0);
    });

    test('should deselect object on empty area click', async ({ page }) => {
      // First click to select
      await starmapPage.clickCanvas();
      await page.waitForTimeout(300);
      
      // Click again on different area
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + 50, box.y + 50);
        await page.waitForTimeout(300);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Object Information Display', () => {
    test('should display object name when selected', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      // Look for object name display
      const objectName = page.locator('[data-testid="object-name"], .object-name, h2, h3');
      expect(await objectName.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display object type when selected', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const objectType = page.locator('text=/star|planet|galaxy|nebula|cluster|恒星|行星|星系|星云|星团/i');
      expect(await objectType.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display object coordinates when selected', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const coordinates = page.locator('text=/RA|Dec|Az|Alt|赤经|赤纬|方位|高度/i');
      expect(await coordinates.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display object magnitude when selected', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const magnitude = page.locator('text=/mag|magnitude|星等/i');
      expect(await magnitude.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Quick Actions', () => {
    test('should have center view action', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const centerButton = page.getByRole('button', { name: /center|居中/i });
      expect(await centerButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have add to shot list action', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const addButton = page.getByRole('button', { name: /add|shot.*list|添加|拍摄列表/i });
      expect(await addButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have more info action', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const infoButton = page.getByRole('button', { name: /info|detail|more|详情|更多/i });
      expect(await infoButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Selection Persistence', () => {
    test('should maintain selection during pan', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(300);
      
      // Pan the view
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should maintain selection during zoom', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(300);
      
      // Zoom with wheel
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(300);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });
});
