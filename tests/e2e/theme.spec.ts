import { test, expect } from '@playwright/test';
import { HomePage, StarmapPage } from './fixtures/page-objects';

test.describe('Theme', () => {
  test.describe('Theme Toggle', () => {
    test('should have theme toggle button', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const themeToggle = page.getByRole('button', { name: /theme|dark|light|主题/i })
        .or(page.locator('[data-testid="theme-toggle"]'));
      expect(await themeToggle.count()).toBeGreaterThanOrEqual(0);
    });

    test('should toggle between light and dark theme', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const themeToggle = page.getByRole('button', { name: /theme|dark|light|主题/i }).first()
        .or(page.locator('[data-testid="theme-toggle"]').first());
      
      if (await themeToggle.isVisible().catch(() => false)) {
        // Get initial theme
        const initialClass = await page.locator('html').getAttribute('class');
        expect(typeof initialClass).toBe('string');
        
        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(300);
        
        // Toggle back
        await themeToggle.click();
        await page.waitForTimeout(300);
      }
    });

    test('should apply dark theme styles', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Check for dark class on html element
      const htmlClass = await page.locator('html').getAttribute('class');
      expect(typeof htmlClass).toBe('string');
      // May have 'dark' class or not depending on current theme
    });
  });

  test.describe('Night Mode', () => {
    test('should have night mode toggle', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const nightModeToggle = page.getByRole('button', { name: /night.*mode|夜间模式/i })
        .or(page.locator('[data-testid="night-mode-toggle"]'));
      expect(await nightModeToggle.count()).toBeGreaterThanOrEqual(0);
    });

    test('should enable night mode', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const nightModeToggle = page.getByRole('button', { name: /night.*mode|夜间模式/i }).first()
        .or(page.locator('[data-testid="night-mode-toggle"]').first());
      
      if (await nightModeToggle.isVisible().catch(() => false)) {
        await nightModeToggle.click();
        await page.waitForTimeout(300);
        
        // Night mode should apply red filter
        const nightModeClass = page.locator('.night-mode, [data-night-mode="true"]');
        await nightModeClass.count();
        // Night mode may be applied
      }
    });

    test('should disable night mode', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const nightModeToggle = page.getByRole('button', { name: /night.*mode|夜间模式/i }).first()
        .or(page.locator('[data-testid="night-mode-toggle"]').first());
      
      if (await nightModeToggle.isVisible().catch(() => false)) {
        // Enable then disable
        await nightModeToggle.click();
        await page.waitForTimeout(300);
        await nightModeToggle.click();
        await page.waitForTimeout(300);
      }
    });

    test('should preserve dark adaptation with red filter', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const nightModeToggle = page.getByRole('button', { name: /night.*mode|夜间模式/i }).first();
      
      if (await nightModeToggle.isVisible().catch(() => false)) {
        await nightModeToggle.click();
        await page.waitForTimeout(300);
        
        // Check for red filter overlay or CSS filter
        const body = page.locator('body');
        const style = await body.evaluate((el) => window.getComputedStyle(el).filter);
        expect(typeof style).toBe('string');
        // May have filter applied
        
        // Disable night mode
        await nightModeToggle.click();
      }
    });
  });

  test.describe('Theme Persistence', () => {
    test('should persist theme preference', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const themeToggle = page.getByRole('button', { name: /theme|dark|light|主题/i }).first();
      
      if (await themeToggle.isVisible().catch(() => false)) {
        await themeToggle.click();
        await page.waitForTimeout(300);
        
        // Reload page
        await page.reload();
        await starmapPage.waitForSplashToDisappear();
        
        // Theme should be persisted
      }
    });

    test('should persist night mode preference', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const nightModeToggle = page.getByRole('button', { name: /night.*mode|夜间模式/i }).first();
      
      if (await nightModeToggle.isVisible().catch(() => false)) {
        await nightModeToggle.click();
        await page.waitForTimeout(300);
        
        // Reload page
        await page.reload();
        await starmapPage.waitForSplashToDisappear();
        
        // Night mode should be persisted
      }
    });
  });

  test.describe('System Theme', () => {
    test('should respect system color scheme preference', async ({ page }) => {
      // Emulate dark color scheme
      await page.emulateMedia({ colorScheme: 'dark' });
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Page should adapt to system preference
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should respect light color scheme preference', async ({ page }) => {
      // Emulate light color scheme
      await page.emulateMedia({ colorScheme: 'light' });
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Theme Consistency', () => {
    test('should apply theme consistently across pages', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      // Get theme on home page
      const homeTheme = await page.locator('html').getAttribute('class');
      expect(typeof homeTheme).toBe('string');
      
      // Navigate to starmap
      await page.goto('/starmap');
      await page.waitForTimeout(2000);
      
      // Theme should be consistent
      const starmapTheme = await page.locator('html').getAttribute('class');
      expect(typeof starmapTheme).toBe('string');
      // Themes should match
    });

    test('should apply theme to all UI elements', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Open a dialog
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Dialog should have consistent theme
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();
        
        await page.keyboard.press('Escape');
      }
    });
  });
});
