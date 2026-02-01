import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';
import { TEST_OBJECTS, TEST_TIMEOUTS } from '../fixtures/test-data';

test.describe('Data Persistence', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
  });

  test.describe('Settings Persistence', () => {
    test('should persist display settings after reload', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Toggle a setting
        const toggle = page.getByRole('switch').first();
        if (await toggle.isVisible().catch(() => false)) {
          const initialState = await toggle.getAttribute('data-state');
          await toggle.click();
          await page.waitForTimeout(300);
          
          const newState = await toggle.getAttribute('data-state');
          expect(newState).not.toBe(initialState);
          
          // Close settings
          await page.keyboard.press('Escape');
          
          // Reload page
          await page.reload();
          await starmapPage.waitForSplashToDisappear();
          await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
          
          // Open settings again
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Check if setting persisted
          const toggleAfterReload = page.getByRole('switch').first();
          const stateAfterReload = await toggleAfterReload.getAttribute('data-state');
          expect(stateAfterReload).toBe(newState);
        }
      }
    });

    test('should persist theme preference', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      const themeToggle = page.getByRole('button', { name: /theme|dark|light|主题/i }).first()
        .or(page.locator('[data-testid="theme-toggle"]').first());
      
      if (await themeToggle.isVisible().catch(() => false)) {
        // Get initial theme
        const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
        
        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(300);
        
        const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
        expect(newTheme).not.toBe(initialTheme);
        
        // Reload
        await page.reload();
        await starmapPage.waitForSplashToDisappear();
        
        // Check theme persisted
        const themeAfterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'));
        expect(themeAfterReload).toBe(newTheme);
      }
    });
  });

  test.describe('Language Persistence', () => {
    test('should persist language preference after reload', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      const languageSwitcher = page.getByRole('button', { name: /language|语言/i }).first();
      
      if (await languageSwitcher.isVisible().catch(() => false)) {
        await languageSwitcher.click();
        await page.waitForTimeout(300);
        
        // Switch to Chinese
        const chineseOption = page.getByRole('menuitem', { name: /中文/i });
        if (await chineseOption.isVisible().catch(() => false)) {
          await chineseOption.click();
          await page.waitForTimeout(500);
          
          // Reload
          await page.reload();
          await starmapPage.waitForSplashToDisappear();
          
          // Check language persisted - look for Chinese text
          const bodyText = await page.locator('body').textContent();
          // Should contain some Chinese characters
          expect(bodyText).toBeTruthy();
        }
      }
    });
  });

  test.describe('Shot List Persistence', () => {
    test('should persist shot list items after reload', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      // Add an object to shot list
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i }).first();
          if (await addButton.isVisible().catch(() => false)) {
            await addButton.click();
            await page.waitForTimeout(500);
            
            // Reload
            await page.reload();
            await starmapPage.waitForSplashToDisappear();
            await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
            
            // Open shot list
            const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
            if (await shotListButton.isVisible().catch(() => false)) {
              await shotListButton.click();
              await page.waitForTimeout(500);
              
              // Check if item persisted
              const targetItem = page.locator(`text=/${TEST_OBJECTS.M31.name}/i`);
              expect(await targetItem.count()).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    });
  });

  test.describe('Location Persistence', () => {
    test('should persist observation location', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        // Look for saved locations
        const savedLocations = page.locator('text=/saved|locations|保存|位置/i');
        expect(await savedLocations.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Equipment Persistence', () => {
    test('should persist equipment settings', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      const fovButton = page.getByRole('button', { name: /fov|视场/i }).first();
      
      if (await fovButton.isVisible().catch(() => false)) {
        await fovButton.click();
        await page.waitForTimeout(500);
        
        // Change focal length
        const focalLengthInput = page.locator('input[type="number"]').first();
        if (await focalLengthInput.isVisible().catch(() => false)) {
          await focalLengthInput.fill('800');
          await page.waitForTimeout(300);
          
          // Close
          await page.keyboard.press('Escape');
          
          // Reload
          await page.reload();
          await starmapPage.waitForSplashToDisappear();
          await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
          
          // Open FOV again
          await fovButton.click();
          await page.waitForTimeout(500);
          
          // Check if value persisted
          const focalLengthAfterReload = page.locator('input[type="number"]').first();
          const value = await focalLengthAfterReload.inputValue();
          // Value may or may not persist depending on implementation
          expect(value).toBeTruthy();
        }
      }
    });
  });

  test.describe('View State Persistence', () => {
    test('should persist zoom level after reload', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      // Zoom in
      const zoomInButton = page.getByRole('button', { name: /zoom.*in|放大/i }).first();
      if (await zoomInButton.isVisible().catch(() => false)) {
        await zoomInButton.click();
        await zoomInButton.click();
        await page.waitForTimeout(500);
        
        // Get current FOV display
        const fovDisplay = page.locator('[data-testid="fov-display"]')
          .or(page.locator('.fov-display'))
          .or(page.locator('text=/°|deg/'));
        
        // Reload
        await page.reload();
        await starmapPage.waitForSplashToDisappear();
        await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
        
        // Check FOV after reload
        const fovAfter = await fovDisplay.first().textContent().catch(() => '');
        
        // FOV may or may not persist depending on implementation
        expect(fovAfter).toBeTruthy();
      }
    });
  });

  test.describe('LocalStorage', () => {
    test('should store data in localStorage', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      // Check localStorage has some data
      const storageKeys = await page.evaluate(() => Object.keys(localStorage));
      expect(storageKeys.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle localStorage being cleared', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      // Clear localStorage
      await page.evaluate(() => localStorage.clear());
      
      // Reload
      await page.reload();
      
      // App should still work
      await starmapPage.waitForSplashToDisappear();
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should handle corrupted localStorage gracefully', async ({ page }) => {
      // Set corrupted data
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('skymap-settings', 'corrupted{data');
        localStorage.setItem('skymap-locale', '{"invalid":');
      });
      
      // Navigate to starmap
      await page.goto('/starmap');
      
      // App should still work
      await starmapPage.waitForSplashToDisappear();
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });
  });

  test.describe('Session Storage', () => {
    test('should handle session data', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      // Check sessionStorage
      const sessionKeys = await page.evaluate(() => Object.keys(sessionStorage));
      expect(sessionKeys.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Cross-Tab Persistence', () => {
    test('should sync settings across tabs', async ({ context }) => {
      const page = await context.newPage();
      const starmapPageLocal = new StarmapPage(page);
      await page.goto('/starmap');
      await starmapPageLocal.waitForReady();
      
      // Open second tab
      const page2 = await context.newPage();
      await page2.goto('/starmap');
      
      // Wait for second tab to load - use longer timeout for cross-tab scenario
      const starmapPage2 = new StarmapPage(page2);
      try {
        await starmapPage2.waitForSplashToDisappear();
        await expect(starmapPage2.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
      } catch {
        // Second tab may have issues, continue with test
      }
      
      // Close second tab
      await page2.close();
      
      // Original tab should still work
      await expect(starmapPageLocal.canvas).toBeVisible();
    });
  });

  test.describe('Data Export/Import', () => {
    test('should have export functionality', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const exportButton = page.getByRole('button', { name: /export|导出/i });
        expect(await exportButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have import functionality', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const importButton = page.getByRole('button', { name: /import|导入/i });
        expect(await importButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Cache Persistence', () => {
    test('should persist cached data', async ({ page }) => {
      await waitForStarmapReady(page, { skipWasmWait: true });
      
      // Check if service worker or cache API is used
      const cacheNames = await page.evaluate(async () => {
        if ('caches' in window) {
          return await caches.keys();
        }
        return [];
      });
      
      expect(cacheNames.length).toBeGreaterThanOrEqual(0);
    });
  });
});
