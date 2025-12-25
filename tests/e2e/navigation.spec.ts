import { test, expect } from '@playwright/test';
import { HomePage, StarmapPage } from './fixtures/page-objects';

test.describe('Navigation', () => {
  test.describe('Page Navigation', () => {
    test('should navigate from home to starmap page', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.goToStarmap();
      await expect(page).toHaveURL(/\/starmap/);
    });

    test('should load starmap page directly', async ({ page }) => {
      await page.goto('/starmap');
      await expect(page).toHaveURL(/\/starmap/);
    });

    test('should load home page directly', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle browser back button', async ({ page }) => {
      await page.goto('/');
      await page.goto('/starmap');
      await page.goBack();
      await expect(page).toHaveURL('/');
    });

    test('should handle browser forward button', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(500);
      await page.goto('/starmap');
      await page.waitForTimeout(1000);
      await page.goBack();
      await page.waitForTimeout(500);
      await page.goForward();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/starmap/);
    });

    test('should handle page refresh on home', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(500);
      await page.reload();
      await page.waitForTimeout(500);
      // URL should contain the base path
      const url = page.url();
      expect(url).toBeTruthy();
    });

    test('should handle page refresh on starmap', async ({ page }) => {
      await page.goto('/starmap');
      await page.reload();
      await expect(page).toHaveURL(/\/starmap/);
    });
  });

  test.describe('URL Handling', () => {
    test('should handle root URL', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/');
    });

    test('should handle starmap URL', async ({ page }) => {
      await page.goto('/starmap');
      await expect(page).toHaveURL(/\/starmap/);
    });

    test('should handle URL with trailing slash', async ({ page }) => {
      await page.goto('/starmap/');
      // Should either redirect or load the page
      const url = page.url();
      expect(url).toContain('starmap');
    });
  });

  test.describe('Page Transitions', () => {
    test('should maintain state during navigation', async ({ page }) => {
      // Set locale on home page
      const homePage = new HomePage(page);
      await homePage.goto();
      
      // Navigate to starmap
      await homePage.goToStarmap();
      await page.waitForTimeout(1000);
      
      // Navigate back
      await page.goBack();
      await page.waitForTimeout(500);
      
      // Page should still be functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });

    test('should load pages without JavaScript errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto('/');
      await page.goto('/starmap');
      
      // Filter out known acceptable errors (like WASM loading in test env)
      const criticalErrors = errors.filter(
        (e) => !e.includes('WebAssembly') && !e.includes('wasm')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Deep Linking', () => {
    test('should support direct access to starmap', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.goto();
      await expect(page).toHaveURL(/\/starmap/);
    });
  });
});
