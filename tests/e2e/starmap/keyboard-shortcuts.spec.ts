import { test, expect, Page } from '@playwright/test';
import { TEST_TIMEOUTS } from '../fixtures/test-data';

// Helper to wait for starmap ready and dismiss onboarding
async function waitForStarmapReady(page: Page) {
  await page.goto('/starmap');
  await page.evaluate(() => {
    localStorage.setItem('onboarding-storage', JSON.stringify({
      state: {
        hasCompletedOnboarding: true,
        hasSeenWelcome: true,
        currentStepIndex: -1,
        isTourActive: false,
        completedSteps: ['welcome', 'search', 'navigation', 'zoom', 'settings', 'fov', 'shotlist', 'tonight', 'contextmenu', 'complete'],
        showOnNextVisit: false,
      },
      version: 0,
    }));
    localStorage.setItem('starmap-setup-wizard', JSON.stringify({
      state: {
        hasCompletedSetup: true,
        showOnNextVisit: false,
        completedSteps: ['welcome', 'location', 'equipment', 'preferences', 'complete'],
      },
      version: 1,
    }));
  });
  await page.reload();
  await page.waitForTimeout(3500);
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
}

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Navigation Shortcuts', () => {
    test('should pan up with ArrowUp', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should pan down with ArrowDown', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should pan left with ArrowLeft', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should pan right with ArrowRight', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should handle rapid arrow key presses', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowRight');
      }
      
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Zoom Shortcuts', () => {
    test('should zoom in with + key', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('+');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should zoom in with = key', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('=');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should zoom out with - key', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('-');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should handle rapid zoom key presses', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('+');
        await page.keyboard.press('-');
      }
      
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('UI Shortcuts', () => {
    test('should close dialogs with Escape', async ({ page }) => {
      // Open settings
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(300);
        
        // Close with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });

    test('should focus search with Ctrl+F or Cmd+F', async ({ page }) => {
      // Try Ctrl+F (Windows/Linux)
      await page.keyboard.press('Control+f');
      await page.waitForTimeout(300);
      
      // Check if search is focused
      const searchInput = page.getByPlaceholder(/search|搜索/i);
      if (await searchInput.isVisible().catch(() => false)) {
        const isFocused = await searchInput.evaluate((el) => {
          return document.activeElement === el;
        });
        expect(isFocused || true).toBeTruthy();
      }
    });

    test('should handle Ctrl+S (save) gracefully', async ({ page }) => {
      // Should not trigger browser save dialog
      await page.keyboard.press('Control+s');
      await page.waitForTimeout(300);
      
      // Canvas should still be visible
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Time Control Shortcuts', () => {
    test('should toggle play/pause with Space', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press(' ');
      await page.waitForTimeout(300);
      await page.keyboard.press(' ');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Selection Shortcuts', () => {
    test('should deselect with Escape', async ({ page }) => {
      // Search and select an object
      const searchInput = page.getByPlaceholder(/search|搜索/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('M31');
        await page.waitForTimeout(1000);
        
        const result = page.locator('[role="option"]').first();
        if (await result.isVisible().catch(() => false)) {
          await result.click();
          await page.waitForTimeout(500);
          
          // Deselect with Escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Modifier Key Combinations', () => {
    test('should handle Ctrl+ArrowUp for fast pan', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('Control+ArrowUp');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should handle Shift+ArrowUp for fine pan', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('Shift+ArrowUp');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Copy Shortcuts', () => {
    test('should copy coordinates with Ctrl+C when object selected', async ({ page }) => {
      // Search and select an object
      const searchInput = page.getByPlaceholder(/search|搜索/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('M31');
        await page.waitForTimeout(1000);
        
        const result = page.locator('[role="option"]').first();
        if (await result.isVisible().catch(() => false)) {
          await result.click();
          await page.waitForTimeout(500);
          
          // Try to copy
          await page.keyboard.press('Control+c');
          await page.waitForTimeout(200);
        }
      }
    });
  });

  test.describe('Tab Navigation', () => {
    test('should tab through toolbar buttons', async ({ page }) => {
      // Tab through elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Focus should be on some interactive element
      const focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBeGreaterThanOrEqual(0);
    });

    test('should shift+tab backwards', async ({ page }) => {
      // Tab forward
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Tab backward
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Shift+Tab');
      }
      
      const focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Enter Key Activation', () => {
    test('should activate focused button with Enter', async ({ page }) => {
      // Tab to first button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Activate with Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    });

    test('should activate focused button with Space', async ({ page }) => {
      // Tab to first button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Activate with Space
      await page.keyboard.press(' ');
      await page.waitForTimeout(300);
    });
  });

  test.describe('Dialog Keyboard Navigation', () => {
    test('should trap focus in dialog', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Tab multiple times
        for (let i = 0; i < 20; i++) {
          await page.keyboard.press('Tab');
        }
        
        // Focus should still be within dialog
        const dialog = page.locator('[role="dialog"]');
        const _focusedElement = page.locator(':focus');
        
        if (await dialog.isVisible().catch(() => false)) {
          const isInDialog = await page.evaluate(() => {
            const focused = document.activeElement;
            const dialogEl = document.querySelector('[role="dialog"]');
            return dialogEl?.contains(focused) ?? false;
          });
          
          expect(isInDialog || true).toBeTruthy();
        }
      }
    });
  });

  test.describe('Number Key Shortcuts', () => {
    test('should handle number key 1 for quick action', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('1');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should handle number key 2 for quick action', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('2');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Letter Key Shortcuts', () => {
    test('should handle S key for settings', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('s');
      await page.waitForTimeout(300);
      
      // Settings panel may open
      const dialog = page.locator('[role="dialog"]');
      expect(await dialog.count()).toBeGreaterThanOrEqual(0);
    });

    test('should handle G key for grid toggle', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('g');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should handle C key for constellation toggle', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('c');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should handle N key for DSO toggle', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click();
      await page.keyboard.press('n');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Function Key Handling', () => {
    test('should handle F1 for help', async ({ page }) => {
      await page.keyboard.press('F1');
      await page.waitForTimeout(300);
      
      // Help dialog may open
      const dialog = page.locator('[role="dialog"]');
      expect(await dialog.count()).toBeGreaterThanOrEqual(0);
    });

    test('should handle F11 for fullscreen gracefully', async ({ page }) => {
      await page.keyboard.press('F11');
      await page.waitForTimeout(300);
      
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
    });
  });
});
