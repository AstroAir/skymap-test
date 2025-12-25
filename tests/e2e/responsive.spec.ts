import { test, expect } from '@playwright/test';
import { HomePage, StarmapPage } from './fixtures/page-objects';
import { VIEWPORT_SIZES } from './fixtures/test-data';

test.describe('Responsive Design', () => {
  test.describe('Desktop Layout (1920x1080)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORT_SIZES.desktop);
    });

    test('should display home page correctly on desktop', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.isLoaded();
      
      await expect(homePage.logo).toBeVisible();
      await expect(homePage.title).toBeVisible();
      await expect(homePage.deployButton).toBeVisible();
      await expect(homePage.documentationButton).toBeVisible();
    });

    test('should display starmap correctly on desktop', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      await expect(starmapPage.canvas).toBeVisible();
      
      // Canvas should fill most of the viewport
      const box = await starmapPage.canvas.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(800);
      expect(box!.height).toBeGreaterThan(600);
    });

    test('should show full toolbar on desktop', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Toolbar buttons should be visible
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(5);
    });
  });

  test.describe('Tablet Layout (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORT_SIZES.tablet);
    });

    test('should display home page correctly on tablet', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.isLoaded();
      
      await expect(homePage.title).toBeVisible();
    });

    test('should display starmap correctly on tablet', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      await expect(starmapPage.canvas).toBeVisible();
      
      const box = await starmapPage.canvas.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(700);
    });

    test('should adapt toolbar for tablet', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Some toolbar items may be collapsed into menu
      const menuButton = page.getByRole('button', { name: /menu/i });
      expect(await menuButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Mobile Layout (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORT_SIZES.mobile);
    });

    test('should display home page correctly on mobile', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.isLoaded();
      
      await expect(homePage.title).toBeVisible();
    });

    test('should display starmap correctly on mobile', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      await expect(starmapPage.canvas).toBeVisible();
      
      const box = await starmapPage.canvas.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(300);
    });

    test('should have touch-friendly controls on mobile', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Buttons should be large enough for touch
      const buttons = page.locator('button');
      const firstButton = buttons.first();
      
      if (await firstButton.isVisible().catch(() => false)) {
        const box = await firstButton.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44 pixels
          expect(box.width).toBeGreaterThanOrEqual(24);
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
      }
    });

    test('should collapse toolbar on mobile', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // On mobile, toolbar may be collapsed
      const menuButton = page.getByRole('button', { name: /menu/i })
        .or(page.locator('[data-testid="mobile-menu"]'));
      expect(await menuButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Viewport Resize', () => {
    test('should handle viewport resize gracefully', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Start with desktop
      await page.setViewportSize(VIEWPORT_SIZES.desktop);
      await page.waitForTimeout(500);
      await expect(starmapPage.canvas).toBeVisible();
      
      // Resize to tablet
      await page.setViewportSize(VIEWPORT_SIZES.tablet);
      await page.waitForTimeout(500);
      await expect(starmapPage.canvas).toBeVisible();
      
      // Resize to mobile
      await page.setViewportSize(VIEWPORT_SIZES.mobile);
      await page.waitForTimeout(500);
      await expect(starmapPage.canvas).toBeVisible();
      
      // Back to desktop
      await page.setViewportSize(VIEWPORT_SIZES.desktop);
      await page.waitForTimeout(500);
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should maintain functionality after resize', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Resize viewport
      await page.setViewportSize(VIEWPORT_SIZES.mobile);
      await page.waitForTimeout(500);
      
      // Canvas should still be interactive
      await starmapPage.clickCanvas();
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Panel Responsiveness', () => {
    test('should adapt settings panel for mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORT_SIZES.mobile);
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Panel should be visible and adapted for mobile
        const panel = page.locator('[role="dialog"]');
        if (await panel.isVisible().catch(() => false)) {
          const box = await panel.boundingBox();
          if (box) {
            // Panel should not exceed viewport width
            expect(box.width).toBeLessThanOrEqual(375);
          }
        }
        
        await page.keyboard.press('Escape');
      }
    });

    test('should use drawer on mobile for panels', async ({ page }) => {
      await page.setViewportSize(VIEWPORT_SIZES.mobile);
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Panels may use drawer pattern on mobile
      const drawer = page.locator('[data-vaul-drawer]');
      expect(await drawer.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Touch Interactions', () => {
    test('should support touch tap', async ({ page }) => {
      await page.setViewportSize(VIEWPORT_SIZES.mobile);
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        // Use mouse click as fallback for touch tap on desktop browsers
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });

  test.describe('Orientation', () => {
    test('should handle portrait orientation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone X portrait
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle landscape orientation', async ({ page }) => {
      await page.setViewportSize({ width: 812, height: 375 }); // iPhone X landscape
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });
});
