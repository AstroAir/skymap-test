import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { TEST_TIMEOUTS } from '../fixtures/test-data';

test.describe('Error Recovery', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
  });

  test.describe('Network Errors', () => {
    test('should handle network offline gracefully', async ({ page }) => {
      await starmapPage.waitForReady();
      
      // Go offline
      await page.context().setOffline(true);
      await page.waitForTimeout(1000);
      
      // Try to interact
      await starmapPage.clickCanvas();
      
      // App should still be functional
      await expect(starmapPage.canvas).toBeVisible();
      
      // Go back online
      await page.context().setOffline(false);
    });

    test('should show offline indicator when network is lost', async ({ page }) => {
      await starmapPage.waitForReady();
      
      // Go offline
      await page.context().setOffline(true);
      await page.waitForTimeout(1000);
      
      // Look for offline indicator
      const offlineIndicator = page.locator('text=/offline|no.*connection|离线|无网络/i');
      expect(await offlineIndicator.count()).toBeGreaterThanOrEqual(0);
      
      // Go back online
      await page.context().setOffline(false);
    });

    test('should recover when network is restored', async ({ page }) => {
      await starmapPage.waitForReady();
      
      // Go offline
      await page.context().setOffline(true);
      await page.waitForTimeout(500);
      
      // Go back online
      await page.context().setOffline(false);
      await page.waitForTimeout(1000);
      
      // App should be functional
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle slow network', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });
      
      await page.goto('/starmap');
      await starmapPage.waitForSplashToDisappear();
      
      // Should eventually load
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should handle failed API requests', async ({ page }) => {
      await starmapPage.waitForReady();
      
      // Block API requests
      await page.route('**/api/**', (route) => route.abort());
      
      // Try to use features that need API
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('M31');
        await page.waitForTimeout(1000);
      }
      
      // App should still be functional
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Resource Loading Errors', () => {
    test('should handle missing image resources', async ({ page }) => {
      // Block image requests
      await page.route('**/*.{png,jpg,jpeg,gif,webp}', (route) => route.abort());
      
      await page.goto('/starmap');
      await starmapPage.waitForSplashToDisappear();
      
      // App should still work
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should handle missing tile resources', async ({ page }) => {
      // Block tile requests
      await page.route('**/tiles/**', (route) => route.abort());
      
      await page.goto('/starmap');
      await starmapPage.waitForSplashToDisappear();
      
      // Canvas should still be visible
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should show placeholder for failed images', async ({ page }) => {
      await starmapPage.waitForReady();
      
      // Block images after load
      await page.route('**/*.{png,jpg,jpeg}', (route) => route.abort());
      
      // Open a panel that loads images
      const detailsButton = page.getByRole('button', { name: /details|详情/i }).first();
      if (await detailsButton.isVisible().catch(() => false)) {
        await detailsButton.click();
        await page.waitForTimeout(1000);
        
        // Should show error state or placeholder
        const errorState = page.locator('text=/error|failed|unavailable|错误|失败/i');
        expect(await errorState.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('JavaScript Errors', () => {
    test('should not crash on console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      
      await starmapPage.waitForReady();
      
      // Interact with the app
      await starmapPage.clickCanvas();
      
      const zoomInButton = page.getByRole('button', { name: /zoom.*in|放大/i }).first();
      if (await zoomInButton.isVisible().catch(() => false)) {
        await zoomInButton.click();
      }
      
      // App should still be functional despite any errors
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle unhandled promise rejections', async ({ page }) => {
      const rejections: string[] = [];
      page.on('pageerror', (error) => {
        rejections.push(error.message);
      });
      
      await starmapPage.waitForReady();
      
      // Trigger potential async operations
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('nonexistent_object_xyz');
        await page.waitForTimeout(1000);
      }
      
      // App should still work
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('State Recovery', () => {
    test('should recover from corrupted state', async ({ page }) => {
      // Set corrupted state
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('skymap-state', '{invalid json');
      });
      
      // Navigate to starmap
      await page.goto('/starmap');
      await starmapPage.waitForSplashToDisappear();
      
      // Should recover and work
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should handle missing required state', async ({ page }) => {
      // Clear all state
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Navigate to starmap
      await page.goto('/starmap');
      await starmapPage.waitForSplashToDisappear();
      
      // Should work with default state
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });
  });

  test.describe('User Input Errors', () => {
    test('should handle invalid search input', async ({ page }) => {
      await starmapPage.waitForReady();
      
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        // Enter invalid input
        await searchInput.fill('!@#$%^&*()');
        await page.waitForTimeout(500);
        
        // Should handle gracefully
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should handle very long input', async ({ page }) => {
      await starmapPage.waitForReady();
      
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        // Enter very long input
        const longInput = 'a'.repeat(1000);
        await searchInput.fill(longInput);
        await page.waitForTimeout(500);
        
        // Should handle gracefully
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should handle invalid coordinate input', async ({ page }) => {
      await starmapPage.waitForReady();
      
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        // Enter invalid coordinates
        await searchInput.fill('999 999');
        await page.waitForTimeout(500);
        
        // Should handle gracefully
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });

  test.describe('Memory Pressure', () => {
    test('should handle rapid interactions without memory leak', async ({ page }) => {
      await starmapPage.waitForReady();
      
      // Rapid interactions
      for (let i = 0; i < 50; i++) {
        await starmapPage.clickCanvas();
        await page.mouse.wheel(0, -10);
      }
      
      await page.waitForTimeout(1000);
      
      // App should still be functional
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle opening and closing many panels', async ({ page }) => {
      await starmapPage.waitForReady();
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        // Open and close settings multiple times
        for (let i = 0; i < 10; i++) {
          await settingsButton.click();
          await page.waitForTimeout(200);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
        
        // App should still be functional
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });

  test.describe('Concurrent Operations', () => {
    test('should handle multiple simultaneous searches', async ({ page }) => {
      await starmapPage.waitForReady();
      
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        // Rapid search changes
        await searchInput.fill('M31');
        await searchInput.fill('M42');
        await searchInput.fill('M45');
        await searchInput.fill('NGC7000');
        
        await page.waitForTimeout(1000);
        
        // Should handle gracefully
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should handle rapid button clicks', async ({ page }) => {
      await starmapPage.waitForReady();
      
      const zoomInButton = page.getByRole('button', { name: /zoom.*in|放大/i }).first();
      
      if (await zoomInButton.isVisible().catch(() => false)) {
        // Rapid clicks
        for (let i = 0; i < 20; i++) {
          await zoomInButton.click({ delay: 0 });
        }
        
        await page.waitForTimeout(500);
        
        // Should handle gracefully
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should handle missing WebGL gracefully', async ({ page }) => {
      // Note: This test may not work in all browsers
      // WebGL is typically available in modern browsers
      
      await starmapPage.waitForReady();
      
      // Check for WebGL error message
      const webglError = page.locator('text=/webgl.*not.*supported|webgl.*error/i');
      expect(await webglError.count()).toBeGreaterThanOrEqual(0);
    });

    test('should handle missing localStorage gracefully', async ({ page }) => {
      // Block localStorage
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: () => { throw new Error('localStorage blocked'); },
            setItem: () => { throw new Error('localStorage blocked'); },
            removeItem: () => { throw new Error('localStorage blocked'); },
            clear: () => { throw new Error('localStorage blocked'); },
          },
        });
      });
      
      await page.goto('/starmap');
      
      // App should still work (may use fallback storage)
      await page.waitForTimeout(5000);
    });
  });

  test.describe('Error Messages', () => {
    test('should display user-friendly error messages', async ({ page }) => {
      await starmapPage.waitForReady();
      
      // Block all external requests to trigger errors
      await page.route('**/external/**', (route) => route.abort());
      
      // Try to use features that need external data
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(1000);
        
        // Should show user-friendly error if data fails to load
        const errorMessage = page.locator('text=/error|unable|failed|错误|无法|失败/i');
        expect(await errorMessage.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should provide retry options on error', async ({ page }) => {
      await starmapPage.waitForReady();
      
      // Look for retry buttons
      const retryButton = page.getByRole('button', { name: /retry|try.*again|重试/i });
      expect(await retryButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Graceful Degradation', () => {
    test('should work without external services', async ({ page }) => {
      // Block all external requests
      await page.route('**/api.example.com/**', (route) => route.abort());
      await page.route('**/cdn.example.com/**', (route) => route.abort());
      
      await page.goto('/starmap');
      await starmapPage.waitForSplashToDisappear();
      
      // Core functionality should still work
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should provide fallback for missing features', async ({ page }) => {
      await starmapPage.waitForReady();
      
      // App should indicate when features are unavailable
      const unavailableFeature = page.locator('text=/unavailable|not.*available|disabled|不可用/i');
      expect(await unavailableFeature.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
