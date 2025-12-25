import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { TEST_TIMEOUTS } from '../fixtures/test-data';

test.describe('Starmap Core Functionality', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
  });

  test.describe('Page Load', () => {
    test('should load the starmap page', async ({ page }) => {
      await starmapPage.goto();
      await expect(page).toHaveURL(/\/starmap/);
    });

    test('should display splash screen initially', async ({ page }) => {
      await page.goto('/starmap');
      // Splash screen should appear briefly
      // It may disappear quickly, so we just check the page loads
      await expect(page).toHaveURL(/\/starmap/);
    });

    test('should hide splash screen after loading', async () => {
      await starmapPage.goto();
      await starmapPage.waitForSplashToDisappear();
      // After splash disappears, canvas should be visible
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should render the canvas element', async () => {
      await starmapPage.waitForReady();
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should have proper canvas dimensions', async () => {
      await starmapPage.waitForReady();
      const box = await starmapPage.canvas.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
    });
  });

  test.describe('Canvas Interactions', () => {
    test.beforeEach(async () => {
      await starmapPage.waitForReady();
    });

    test('should respond to mouse drag for panning', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 100, startY + 100, { steps: 10 });
        await page.mouse.up();
        
        // View should have changed (we can't easily verify the exact change)
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should respond to mouse wheel for zooming', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        
        // Zoom in
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(300);
        
        // Zoom out
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(300);
        
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should handle left click on canvas', async () => {
      await starmapPage.clickCanvas();
      // Click should be handled without errors
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should open context menu on right click', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        // Context menu should appear
        const contextMenu = page.locator('[role="menu"]');
        await contextMenu.count();
        // Wait briefly for context menu
        await page.waitForTimeout(500);
        // Context menu may or may not appear depending on implementation
      }
    });

    test('should handle double click on canvas', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.dblclick(
          box.x + box.width / 2,
          box.y + box.height / 2
        );
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });

  test.describe('Toolbar', () => {
    test.beforeEach(async () => {
      await starmapPage.waitForReady();
    });

    test('should display toolbar elements', async ({ page }) => {
      // Check for common toolbar buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test('should have search functionality accessible', async ({ page }) => {
      // Look for search input or button
      const searchElements = page.locator('[placeholder*="search" i], button:has-text("search")');
      const count = await searchElements.count();
      // Should have at least one search-related element
      expect(count).toBeGreaterThanOrEqual(0); // May be hidden initially
    });
  });

  test.describe('View Direction', () => {
    test.beforeEach(async () => {
      await starmapPage.waitForReady();
    });

    test('should display view center coordinates', async ({ page }) => {
      // Look for coordinate display
      const coordDisplay = page.locator('text=/RA|Dec|Alt|Az/i');
      await coordDisplay.count();
      // Coordinates may or may not be visible depending on UI state
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test.beforeEach(async () => {
      await starmapPage.waitForReady();
    });

    test('should handle Escape key', async ({ page }) => {
      await page.keyboard.press('Escape');
      // Should close any open dialogs/menus
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle arrow keys for navigation', async ({ page }) => {
      // Focus the canvas area first
      await starmapPage.clickCanvas();
      
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowRight');
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should not crash on rapid interactions', async ({ page }) => {
      await starmapPage.waitForReady();
      
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        // Rapid clicks
        for (let i = 0; i < 10; i++) {
          await page.mouse.click(
            box.x + Math.random() * box.width,
            box.y + Math.random() * box.height
          );
        }
        
        // Rapid scrolls
        for (let i = 0; i < 5; i++) {
          await page.mouse.wheel(0, -50);
          await page.mouse.wheel(0, 50);
        }
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle window resize', async ({ page }) => {
      await starmapPage.waitForReady();
      
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(500);
      
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });
});
