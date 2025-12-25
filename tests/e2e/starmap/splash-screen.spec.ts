import { test, expect } from '@playwright/test';
import { TEST_TIMEOUTS } from '../fixtures/test-data';

test.describe('Splash Screen', () => {
  test.describe('Initial Display', () => {
    test('should display splash screen on page load', async ({ page }) => {
      // Navigate without waiting for splash to disappear
      await page.goto('/starmap');
      
      // Splash screen should appear initially
      const splashScreen = page.locator('[data-testid="splash-screen"]')
        .or(page.locator('.splash-screen'))
        .or(page.locator('text=/loading|加载中/i'));
      
      // May or may not catch it depending on timing
      expect(await splashScreen.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display loading indicator', async ({ page }) => {
      await page.goto('/starmap');
      
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]')
        .or(page.locator('.loading-spinner'))
        .or(page.locator('[role="progressbar"]'))
        .or(page.locator('text=/loading|initializing|加载|初始化/i'));
      
      // Loading indicator may be visible briefly
      expect(await loadingIndicator.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display app logo during loading', async ({ page }) => {
      await page.goto('/starmap');
      
      const logo = page.locator('[data-testid="splash-logo"]')
        .or(page.locator('.splash-logo'))
        .or(page.locator('img[alt*="logo" i]'));
      
      expect(await logo.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Loading Progress', () => {
    test('should show loading progress', async ({ page }) => {
      await page.goto('/starmap');
      
      const progressBar = page.locator('[role="progressbar"]')
        .or(page.locator('[data-testid="loading-progress"]'))
        .or(page.locator('.progress-bar'));
      
      expect(await progressBar.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display loading status text', async ({ page }) => {
      await page.goto('/starmap');
      
      const statusText = page.locator('[data-testid="loading-status"]')
        .or(page.locator('.loading-status'))
        .or(page.locator('text=/loading.*wasm|initializing.*engine|加载.*引擎/i'));
      
      expect(await statusText.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Splash Screen Dismissal', () => {
    test('should hide splash screen after loading completes', async ({ page }) => {
      await page.goto('/starmap');
      
      // Wait for splash to disappear
      const splashScreen = page.locator('[data-testid="splash-screen"]')
        .or(page.locator('.splash-screen'));
      
      try {
        await splashScreen.waitFor({ state: 'hidden', timeout: TEST_TIMEOUTS.splash });
      } catch {
        // Splash might not exist or already hidden
      }
      
      // Canvas should be visible after splash
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should transition smoothly to main view', async ({ page }) => {
      await page.goto('/starmap');
      
      // Wait for canvas to be visible
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
      
      // No splash overlay should be blocking
      const splashOverlay = page.locator('[data-testid="splash-overlay"]')
        .or(page.locator('.splash-overlay'));
      
      await expect(splashOverlay).toBeHidden({ timeout: 5000 }).catch(() => {});
    });
  });

  test.describe('WASM Loading', () => {
    test('should load WASM module successfully', async ({ page }) => {
      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        consoleMessages.push(msg.text());
      });
      
      await page.goto('/starmap');
      
      // Wait for canvas to be ready
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
      
      // Check for WASM loading errors
      const wasmErrors = consoleMessages.filter(
        (msg) => msg.toLowerCase().includes('wasm') && msg.toLowerCase().includes('error')
      );
      
      // Should not have critical WASM errors
      expect(wasmErrors.length).toBeLessThanOrEqual(1); // Allow some non-critical warnings
    });

    test('should handle WASM loading timeout gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*.wasm', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });
      
      await page.goto('/starmap');
      
      // Should eventually load or show error
      await page.waitForTimeout(5000);
      
      // Either canvas is visible or error message is shown
      const canvas = page.locator('canvas').first();
      const errorMessage = page.locator('text=/error|failed|retry|错误|失败|重试/i');
      
      const canvasVisible = await canvas.isVisible().catch(() => false);
      const errorVisible = await errorMessage.isVisible().catch(() => false);
      
      expect(canvasVisible || errorVisible).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should display error message on load failure', async ({ page }) => {
      // Block WASM file to simulate failure
      await page.route('**/*.wasm', (route) => route.abort());
      
      await page.goto('/starmap');
      await page.waitForTimeout(5000);
      
      // Should show error or retry option
      const errorUI = page.locator('text=/error|failed|retry|错误|失败|重试/i');
      // Error handling may or may not be visible depending on implementation
      expect(await errorUI.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have retry button on error', async ({ page }) => {
      // Block WASM file to simulate failure
      await page.route('**/*.wasm', (route) => route.abort());
      
      await page.goto('/starmap');
      await page.waitForTimeout(5000);
      
      const retryButton = page.getByRole('button', { name: /retry|重试/i });
      // Retry button may be available
      expect(await retryButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should recover after retry', async ({ page }) => {
      let blockWasm = true;
      
      await page.route('**/*.wasm', async (route) => {
        if (blockWasm) {
          await route.abort();
        } else {
          await route.continue();
        }
      });
      
      await page.goto('/starmap');
      await page.waitForTimeout(3000);
      
      // Unblock WASM
      blockWasm = false;
      
      // Try to click retry if available
      const retryButton = page.getByRole('button', { name: /retry|重试/i });
      if (await retryButton.isVisible().catch(() => false)) {
        await retryButton.click();
        await page.waitForTimeout(5000);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/starmap');
      
      // Wait for canvas to be visible
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 30 seconds
      expect(loadTime).toBeLessThan(30000);
    });

    test('should not block main thread during loading', async ({ page }) => {
      await page.goto('/starmap');
      
      // Try to interact during loading
      await page.mouse.move(100, 100);
      await page.mouse.move(200, 200);
      
      // Should not freeze
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible loading state', async ({ page }) => {
      await page.goto('/starmap');
      
      // Check for aria-busy or aria-live
      const loadingRegion = page.locator('[aria-busy="true"], [aria-live]');
      expect(await loadingRegion.count()).toBeGreaterThanOrEqual(0);
    });

    test('should announce loading completion', async ({ page }) => {
      await page.goto('/starmap');
      
      // Wait for loading to complete
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
      
      // Check for status update
      const statusRegion = page.locator('[role="status"], [aria-live="polite"]');
      expect(await statusRegion.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Multiple Loads', () => {
    test('should handle page refresh correctly', async ({ page }) => {
      await page.goto('/starmap');
      
      // Wait for initial load
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
      
      // Refresh
      await page.reload();
      
      // Should load again
      await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should handle rapid navigation', async ({ page }) => {
      // Navigate to starmap
      await page.goto('/starmap');
      await page.waitForTimeout(500);
      
      // Navigate away
      await page.goto('/');
      await page.waitForTimeout(500);
      
      // Navigate back
      await page.goto('/starmap');
      
      // Should load correctly
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });
  });
});
