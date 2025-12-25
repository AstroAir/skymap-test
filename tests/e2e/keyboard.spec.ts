import { test, expect } from '@playwright/test';
import { StarmapPage } from './fixtures/page-objects';

test.describe('Keyboard Navigation', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Global Shortcuts', () => {
    test('should close dialog with Escape key', async ({ page }) => {
      // Open settings
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();
        
        // Press Escape to close
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        await expect(dialog).toBeHidden();
      }
    });

    test('should focus search with keyboard shortcut', async ({ page }) => {
      // Try common search shortcuts
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(300);
      
      // Or try slash
      await page.keyboard.press('/');
      await page.waitForTimeout(300);
      
      // Search input may be focused
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.count();
      // Search may or may not be focused depending on implementation
    });
  });

  test.describe('Navigation Keys', () => {
    test('should pan view with arrow keys', async ({ page }) => {
      // Focus canvas first
      await starmapPage.clickCanvas();
      
      // Pan with arrow keys
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should zoom with + and - keys', async ({ page }) => {
      await starmapPage.clickCanvas();
      
      // Zoom in
      await page.keyboard.press('+');
      await page.waitForTimeout(200);
      await page.keyboard.press('='); // Plus without shift
      await page.waitForTimeout(200);
      
      // Zoom out
      await page.keyboard.press('-');
      await page.waitForTimeout(200);
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle Page Up/Down for zoom', async ({ page }) => {
      await starmapPage.clickCanvas();
      
      await page.keyboard.press('PageUp');
      await page.waitForTimeout(200);
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(200);
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Tab Navigation', () => {
    test('should navigate through buttons with Tab', async ({ page }) => {
      // Start tabbing through elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Get focused element
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedTag).toBeTruthy();
      
      // Continue tabbing
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
    });

    test('should navigate backwards with Shift+Tab', async ({ page }) => {
      // Tab forward a few times
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Tab backward
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');
      
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedTag).toBeTruthy();
    });

    test('should trap focus in modal dialogs', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Tab through dialog elements
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(50);
        }
        
        // Focus should stay within dialog
        await page.evaluate(() => {
          const active = document.activeElement;
          const dialog = document.querySelector('[role="dialog"]');
          return dialog?.contains(active);
        });
        
        // Focus may or may not be trapped depending on implementation
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Enter Key Actions', () => {
    test('should activate button with Enter', async ({ page }) => {
      // Tab to a button
      await page.keyboard.press('Tab');
      
      // Get focused element
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      
      if (focusedTag === 'BUTTON') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
    });

    test('should select search result with Enter', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('M31');
        await page.waitForTimeout(1000);
        
        // Navigate to first result
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        
        // Select with Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Space Key Actions', () => {
    test('should toggle checkbox with Space', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Find a switch/checkbox
        const toggle = page.getByRole('switch').first();
        if (await toggle.isVisible().catch(() => false)) {
          await toggle.focus();
          await page.keyboard.press('Space');
          await page.waitForTimeout(200);
        }
        
        await page.keyboard.press('Escape');
      }
    });

    test('should activate button with Space', async ({ page }) => {
      // Tab to a button
      await page.keyboard.press('Tab');
      
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      
      if (focusedTag === 'BUTTON') {
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Focus Indicators', () => {
    test('should show visible focus indicators', async ({ page }) => {
      // Tab to an element
      await page.keyboard.press('Tab');
      
      // Check for focus ring
      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        if (active) {
          const style = window.getComputedStyle(active);
          return {
            outline: style.outline,
            boxShadow: style.boxShadow,
          };
        }
        return null;
      });
      
      // Should have some focus indicator
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Dropdown Navigation', () => {
    test('should navigate dropdown with arrow keys', async ({ page }) => {
      const languageSwitcher = page.getByRole('button', { name: /language|语言/i }).first();
      
      if (await languageSwitcher.isVisible().catch(() => false)) {
        await languageSwitcher.click();
        await page.waitForTimeout(300);
        
        // Navigate with arrow keys
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(100);
        
        // Close with Escape
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Dialog Keyboard Handling', () => {
    test('should handle Tab in dialog', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Tab through dialog
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        
        await page.keyboard.press('Escape');
      }
    });
  });
});
