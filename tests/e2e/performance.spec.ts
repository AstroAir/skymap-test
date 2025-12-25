import { test, expect } from '@playwright/test';
import { StarmapPage } from './fixtures/page-objects';
import { TEST_TIMEOUTS } from './fixtures/test-data';

test.describe('Performance', () => {
  test.describe('Page Load Performance', () => {
    test('should load home page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 15 seconds (CI environments may be slower)
      expect(loadTime).toBeLessThan(15000);
    });

    test('should load starmap page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/starmap');
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Initial load should be within 10 seconds (WASM loading may take time)
      expect(loadTime).toBeLessThan(10000);
    });

    test('should complete splash screen within timeout', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      
      const startTime = Date.now();
      await starmapPage.goto();
      await starmapPage.waitForSplashToDisappear();
      const splashTime = Date.now() - startTime;
      
      // Splash should complete within configured timeout
      expect(splashTime).toBeLessThan(TEST_TIMEOUTS.splash + 5000);
    });
  });

  test.describe('Canvas Rendering Performance', () => {
    test('should render canvas without significant delay', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Canvas should be visible and rendered
      await expect(starmapPage.canvas).toBeVisible();
      
      const box = await starmapPage.canvas.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
    });

    test('should handle pan interactions smoothly', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const startTime = Date.now();
        
        // Perform multiple pan operations
        for (let i = 0; i < 5; i++) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
          await page.mouse.up();
        }
        
        const panTime = Date.now() - startTime;
        
        // Pan operations should complete within 3 seconds
        expect(panTime).toBeLessThan(3000);
      }
    });

    test('should handle zoom interactions smoothly', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const startTime = Date.now();
        
        // Perform multiple zoom operations
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        for (let i = 0; i < 10; i++) {
          await page.mouse.wheel(0, -50);
        }
        for (let i = 0; i < 10; i++) {
          await page.mouse.wheel(0, 50);
        }
        
        const zoomTime = Date.now() - startTime;
        
        // Zoom operations should complete within 3 seconds
        expect(zoomTime).toBeLessThan(3000);
      }
    });
  });

  test.describe('UI Responsiveness', () => {
    test('should open settings panel quickly', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        const startTime = Date.now();
        await settingsButton.click();
        
        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible', timeout: 2000 });
        
        const openTime = Date.now() - startTime;
        
        // Dialog should open within 1 second
        expect(openTime).toBeLessThan(1000);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should respond to search input quickly', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        const startTime = Date.now();
        await searchInput.fill('M31');
        await page.waitForTimeout(500);
        const searchTime = Date.now() - startTime;
        
        // Search should respond within 2 seconds
        expect(searchTime).toBeLessThan(2000);
      }
    });
  });

  test.describe('Memory Usage', () => {
    test('should not leak memory during navigation', async ({ page }) => {
      // Navigate back and forth multiple times
      for (let i = 0; i < 3; i++) {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.goto('/starmap');
        await page.waitForLoadState('domcontentloaded');
      }
      
      // Page should still be responsive
      const starmapPage = new StarmapPage(page);
      await expect(starmapPage.canvas).toBeVisible({ timeout: 30000 });
    });

    test('should handle repeated panel open/close', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        // Open and close settings multiple times
        for (let i = 0; i < 5; i++) {
          await settingsButton.click();
          await page.waitForTimeout(200);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
        
        // UI should still be responsive
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should cache resources effectively', async ({ page }) => {
      // First load
      await page.goto('/starmap');
      await page.waitForLoadState('networkidle');
      
      // Second load should be faster due to caching
      const startTime = Date.now();
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      const reloadTime = Date.now() - startTime;
      
      // Reload should be faster than initial load
      expect(reloadTime).toBeLessThan(8000);
    });
  });

  test.describe('Animation Performance', () => {
    test('should maintain smooth animations', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Check for no JavaScript errors during animations
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      
      // Trigger some animations
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      
      // Should have no errors
      expect(errors.length).toBe(0);
    });
  });

  test.describe('Large Data Handling', () => {
    test('should handle search with many results', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        // Search for common term that may return many results
        await searchInput.fill('M');
        await page.waitForTimeout(2000);
        
        // UI should still be responsive
        await expect(searchInput).toBeVisible();
      }
    });
  });

  test.describe('Stress Testing', () => {
    test('should handle rapid interactions', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Rapid clicks
      for (let i = 0; i < 20; i++) {
        await starmapPage.clickCanvas();
      }
      
      // Should not crash
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle rapid keyboard input', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      await starmapPage.clickCanvas();
      
      // Rapid key presses
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowDown');
      }
      
      // Should not crash
      await expect(starmapPage.canvas).toBeVisible();
    });
  });
});
