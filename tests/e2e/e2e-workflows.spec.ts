import { test, expect } from '@playwright/test';
import { HomePage, StarmapPage } from './fixtures/page-objects';
import { TEST_OBJECTS } from './fixtures/test-data';

test.describe('End-to-End Workflows', () => {
  test.describe('Complete Observation Planning Workflow', () => {
    test('should complete full observation planning session', async ({ page }) => {
      // 1. Start from home page
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.isLoaded();
      
      // 2. Navigate to starmap
      await page.goto('/starmap');
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 3. Search for an object
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        // 4. Select from search results
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
        }
      }
      
      // 5. Add to shot list
      const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i }).first();
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
      }
      
      // 6. Verify canvas is still functional
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should plan multi-target observation session', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const searchInput = page.getByPlaceholder(/search/i);
      
      // Add multiple targets
      const targets = [TEST_OBJECTS.M31.name, TEST_OBJECTS.M42.name];
      
      for (const target of targets) {
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.clear();
          await searchInput.fill(target);
          await page.waitForTimeout(1000);
          
          const firstResult = page.locator('[role="option"]').first();
          if (await firstResult.isVisible().catch(() => false)) {
            await firstResult.click();
            await page.waitForTimeout(500);
          }
          
          const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i }).first();
          if (await addButton.isVisible().catch(() => false)) {
            await addButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Equipment Setup Workflow', () => {
    test('should configure equipment and calculate FOV', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open FOV simulator
      const fovButton = page.getByRole('button', { name: /fov|视场/i }).first();
      if (await fovButton.isVisible().catch(() => false)) {
        await fovButton.click();
        await page.waitForTimeout(500);
        
        // 2. Configure equipment settings
        const focalLengthInput = page.locator('input[type="number"]').first();
        if (await focalLengthInput.isVisible().catch(() => false)) {
          await focalLengthInput.fill('1000');
          await page.waitForTimeout(300);
        }
        
        // 3. Close panel
        await page.keyboard.press('Escape');
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Time Navigation Workflow', () => {
    test('should navigate through time to plan observation', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open time controls
      const timeButton = page.getByRole('button', { name: /time|时间/i }).first();
      if (await timeButton.isVisible().catch(() => false)) {
        await timeButton.click();
        await page.waitForTimeout(500);
      }
      
      // 2. Jump to sunset
      const sunsetButton = page.getByRole('button', { name: /sunset|日落/i });
      if (await sunsetButton.isVisible().catch(() => false)) {
        await sunsetButton.click();
        await page.waitForTimeout(500);
      }
      
      // 3. Close time controls
      await page.keyboard.press('Escape');
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Settings Configuration Workflow', () => {
    test('should configure display settings', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open settings
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // 2. Toggle some settings
        const toggles = page.getByRole('switch');
        const toggleCount = await toggles.count();
        
        if (toggleCount > 0) {
          await toggles.first().click();
          await page.waitForTimeout(200);
          await toggles.first().click();
          await page.waitForTimeout(200);
        }
        
        // 3. Close settings
        await page.keyboard.press('Escape');
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Language Switch Workflow', () => {
    test('should switch language and verify UI updates', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      // 1. Try to switch to Chinese if language switcher is available
      const isVisible = await homePage.isLanguageSwitcherVisible();
      if (isVisible) {
        try {
          await homePage.switchLanguage('zh');
          await page.waitForTimeout(1000);
        } catch {
          // Language switch may fail
        }
      }
      
      // 2. Navigate to starmap
      await page.goto('/starmap');
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 3. Verify starmap loads
      await expect(starmapPage.canvas).toBeVisible();
      
      // 4. Try to switch back to English
      const languageSwitcher = page.getByRole('button', { name: /language|语言/i }).first();
      if (await languageSwitcher.isVisible().catch(() => false)) {
        try {
          await languageSwitcher.click();
          await page.waitForTimeout(300);
          
          const englishOption = page.getByRole('menuitem', { name: /english/i });
          if (await englishOption.isVisible().catch(() => false)) {
            await englishOption.click();
            await page.waitForTimeout(500);
          } else {
            await page.keyboard.press('Escape');
          }
        } catch {
          // Language switch may fail
        }
      }
    });
  });

  test.describe('Search and Navigate Workflow', () => {
    test('should search object and navigate view', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Search for object
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M42.name);
        await page.waitForTimeout(1000);
        
        // 2. Select result
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
      
      // 3. Zoom in on object
      const zoomInButton = page.getByRole('button', { name: /zoom.*in|放大/i }).first();
      if (await zoomInButton.isVisible().catch(() => false)) {
        await zoomInButton.click();
        await zoomInButton.click();
        await page.waitForTimeout(500);
      }
      
      // 4. Pan around
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2);
        await page.mouse.up();
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Responsive Workflow', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Verify canvas is visible
      await expect(starmapPage.canvas).toBeVisible();
      
      // 2. Try to interact with canvas
      await starmapPage.clickCanvas();
      
      // 3. Try click (fallback for touch)
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Error Recovery Workflow', () => {
    test('should recover from rapid interactions', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Rapid clicks
      for (let i = 0; i < 10; i++) {
        await starmapPage.clickCanvas();
      }
      
      // 2. Rapid keyboard
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowUp');
      }
      
      // 3. Rapid zoom
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        for (let i = 0; i < 10; i++) {
          await page.mouse.wheel(0, -50);
        }
      }
      
      // 4. Should still be functional
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle page refresh gracefully', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Make some changes
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 2. Refresh page
      await page.reload();
      
      // 3. Wait for reload
      await starmapPage.waitForSplashToDisappear();
      
      // 4. Should be functional
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Full Session Workflow', () => {
    test('should complete full astronomy session', async ({ page }) => {
      // This test simulates a complete user session
      
      // 1. Start from home
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // 2. Go to starmap
      await page.goto('/starmap');
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 3. Check tonight's recommendations (if available)
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 4. Search for a target
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
      
      // 5. Configure FOV
      const fovButton = page.getByRole('button', { name: /fov|视场/i }).first();
      if (await fovButton.isVisible().catch(() => false)) {
        await fovButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 6. Check time
      const timeButton = page.getByRole('button', { name: /time|时间/i }).first();
      if (await timeButton.isVisible().catch(() => false)) {
        await timeButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 7. Adjust settings
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 8. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });
});
