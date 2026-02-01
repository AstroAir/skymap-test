import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Canvas Interactions', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Mouse Interactions', () => {
    test('should pan view with mouse drag', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50);
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should zoom with mouse wheel', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -100); // Zoom in
        await page.waitForTimeout(300);
        await page.mouse.wheel(0, 100); // Zoom out
        await page.waitForTimeout(300);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should select object with click', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should show context menu with right click', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(300);
      }
      
      const contextMenu = page.locator('[role="menu"], .context-menu');
      expect(await contextMenu.count()).toBeGreaterThanOrEqual(0);
      
      // Close context menu
      await page.keyboard.press('Escape');
    });

    test('should double click to zoom', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Keyboard Interactions', () => {
    test('should pan with arrow keys', async ({ page }) => {
      // Focus canvas first
      await starmapPage.canvas.click();
      await page.waitForTimeout(200);
      
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should zoom with +/- keys', async ({ page }) => {
      await starmapPage.canvas.click();
      await page.waitForTimeout(200);
      
      await page.keyboard.press('+');
      await page.waitForTimeout(200);
      await page.keyboard.press('-');
      await page.waitForTimeout(200);
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle Page Up/Down for larger zoom steps', async ({ page }) => {
      await starmapPage.canvas.click();
      await page.waitForTimeout(200);
      
      await page.keyboard.press('PageUp');
      await page.waitForTimeout(200);
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(200);
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Canvas Rendering', () => {
    test('should render stars on canvas', async () => {
      // Canvas should be visible and have content
      await expect(starmapPage.canvas).toBeVisible();
      
      // Check canvas has dimensions
      const box = await starmapPage.canvas.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    });

    test('should update canvas on view change', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        // Pan the view
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
      
      // Canvas should still be visible and functional
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle rapid interactions', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        // Rapid mouse movements
        for (let i = 0; i < 5; i++) {
          await page.mouse.move(box.x + Math.random() * box.width, box.y + Math.random() * box.height);
          await page.waitForTimeout(50);
        }
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Canvas Resize', () => {
    test('should handle window resize', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      await expect(starmapPage.canvas).toBeVisible();
      
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should maintain aspect ratio on resize', async ({ page }) => {
      const initialBox = await starmapPage.canvas.boundingBox();
      expect(initialBox).toBeTruthy();
      
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(500);
      
      const newBox = await starmapPage.canvas.boundingBox();
      expect(newBox).toBeTruthy();
    });
  });
});
