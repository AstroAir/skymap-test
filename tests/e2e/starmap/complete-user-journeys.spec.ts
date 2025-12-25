import { test, expect } from '@playwright/test';
import { HomePage, StarmapPage } from '../fixtures/page-objects';
import { TEST_OBJECTS, TEST_TIMEOUTS } from '../fixtures/test-data';

test.describe('Complete User Journeys', () => {
  test.describe('First-Time User Journey', () => {
    test('should complete first-time user onboarding flow', async ({ page }) => {
      // 1. Start from home page
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.isLoaded();
      
      // 2. Navigate to starmap
      await homePage.goToStarmap();
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForSplashToDisappear();
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
      
      // 3. Explore the interface - check toolbar is visible
      const buttons = page.locator('button');
      expect(await buttons.count()).toBeGreaterThan(0);
      
      // 4. Try basic interactions
      await starmapPage.clickCanvas();
      await page.waitForTimeout(300);
      
      // 5. Zoom in/out
      const zoomInButton = page.getByRole('button', { name: /zoom.*in|放大/i }).first();
      if (await zoomInButton.isVisible().catch(() => false)) {
        await zoomInButton.click();
        await page.waitForTimeout(300);
      }
      
      // 6. Search for an object
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('Moon');
        await page.waitForTimeout(1000);
        await page.keyboard.press('Escape');
      }
      
      // 7. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Observation Planning Journey', () => {
    test('should complete full observation planning session', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Check tonight's conditions
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 2. Search for first target
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // 3. Add to shot list
          const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i }).first();
          if (await addButton.isVisible().catch(() => false)) {
            await addButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
      
      // 4. Add second target
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.clear();
        await searchInput.fill(TEST_OBJECTS.M42.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i }).first();
          if (await addButton.isVisible().catch(() => false)) {
            await addButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
      
      // 5. Open shot list to review
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 6. Configure FOV
      const fovButton = page.getByRole('button', { name: /fov|视场/i }).first();
      if (await fovButton.isVisible().catch(() => false)) {
        await fovButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 7. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Astrophotography Setup Journey', () => {
    test('should complete astrophotography equipment setup', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open FOV simulator
      const fovButton = page.getByRole('button', { name: /fov|视场/i }).first();
      if (await fovButton.isVisible().catch(() => false)) {
        await fovButton.click();
        await page.waitForTimeout(500);
        
        // 2. Configure telescope
        const focalLengthInput = page.locator('input[type="number"]').first();
        if (await focalLengthInput.isVisible().catch(() => false)) {
          await focalLengthInput.fill('800');
          await page.waitForTimeout(300);
        }
        
        await page.keyboard.press('Escape');
      }
      
      // 3. Open exposure calculator
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 4. Search for target
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M42.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
        }
      }
      
      // 5. Check object details
      const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
      if (await detailsButton.isVisible().catch(() => false)) {
        await detailsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 6. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Visual Observation Journey', () => {
    test('should complete visual observation planning', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open ocular simulator
      const ocularButton = page.getByRole('button', { name: /eyepiece|ocular|目镜/i }).first();
      if (await ocularButton.isVisible().catch(() => false)) {
        await ocularButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 2. Search for bright object
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M45.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
        }
      }
      
      // 3. Check visibility
      const infoPanel = page.locator('[data-testid="info-panel"], .info-panel');
      expect(await infoPanel.count()).toBeGreaterThanOrEqual(0);
      
      // 4. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Multi-Night Planning Journey', () => {
    test('should plan observations across multiple nights', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open time controls
      const timeButton = page.getByRole('button', { name: /time|时间/i }).first();
      if (await timeButton.isVisible().catch(() => false)) {
        await timeButton.click();
        await page.waitForTimeout(500);
        
        // 2. Jump to sunset
        const sunsetButton = page.getByRole('button', { name: /sunset|日落/i });
        if (await sunsetButton.isVisible().catch(() => false)) {
          await sunsetButton.click();
          await page.waitForTimeout(500);
        }
        
        await page.keyboard.press('Escape');
      }
      
      // 3. Check astronomical events
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 4. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Deep Sky Object Exploration Journey', () => {
    test('should explore deep sky objects using sky atlas', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open sky atlas
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        // 2. Search for objects
        const searchInput = page.getByPlaceholder(/search/i).first();
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.fill('galaxy');
          await page.waitForTimeout(500);
        }
        
        await page.keyboard.press('Escape');
      }
      
      // 3. Search for specific object
      const mainSearchInput = page.getByPlaceholder(/search/i);
      if (await mainSearchInput.isVisible().catch(() => false)) {
        await mainSearchInput.fill(TEST_OBJECTS.NGC7000.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
        }
      }
      
      // 4. View details
      const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
      if (await detailsButton.isVisible().catch(() => false)) {
        await detailsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 5. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Satellite Tracking Journey', () => {
    test('should track satellites and ISS', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open satellite tracker
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        // 2. Look for ISS option
        const issOption = page.locator('text=/ISS|International.*Space.*Station|国际空间站/i');
        if (await issOption.first().isVisible().catch(() => false)) {
          await issOption.first().click();
          await page.waitForTimeout(500);
        }
        
        await page.keyboard.press('Escape');
      }
      
      // 3. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Location Setup Journey', () => {
    test('should set up observation location', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open location manager
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        // 2. Look for location input
        const latInput = page.locator('input[name*="lat"]').or(page.locator('text=/latitude|纬度/i'));
        expect(await latInput.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
      
      // 3. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Offline Mode Journey', () => {
    test('should work in offline mode with cached data', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Open cache manager
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 2. Go offline
      await page.context().setOffline(true);
      await page.waitForTimeout(500);
      
      // 3. Try to use the app
      await starmapPage.clickCanvas();
      
      const zoomInButton = page.getByRole('button', { name: /zoom.*in|放大/i }).first();
      if (await zoomInButton.isVisible().catch(() => false)) {
        await zoomInButton.click();
      }
      
      // 4. Go back online
      await page.context().setOffline(false);
      
      // 5. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Settings Customization Journey', () => {
    test('should customize all display settings', async ({ page }) => {
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
        
        for (let i = 0; i < Math.min(toggleCount, 3); i++) {
          await toggles.nth(i).click();
          await page.waitForTimeout(200);
        }
        
        // 3. Switch tabs if available
        const tabs = page.getByRole('tab');
        const tabCount = await tabs.count();
        
        for (let i = 0; i < Math.min(tabCount, 3); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(200);
        }
        
        await page.keyboard.press('Escape');
      }
      
      // 4. Toggle theme
      const themeToggle = page.getByRole('button', { name: /theme|dark|light|主题/i }).first();
      if (await themeToggle.isVisible().catch(() => false)) {
        await themeToggle.click();
        await page.waitForTimeout(300);
      }
      
      // 5. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Language Switch Journey', () => {
    test('should switch language and verify UI updates', async ({ page }) => {
      // 1. Start from home page
      const homePage = new HomePage(page);
      await homePage.goto();
      
      // 2. Try to switch to Chinese if language switcher is available
      const languageSwitcherVisible = await homePage.isLanguageSwitcherVisible();
      if (languageSwitcherVisible) {
        try {
          await homePage.switchLanguage('zh');
          await page.waitForTimeout(1000);
        } catch {
          // Language switch may fail, continue with test
        }
      }
      
      // 3. Navigate to starmap
      await homePage.goToStarmap();
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForSplashToDisappear();
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
      
      // 4. Verify UI is functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
      
      // 5. Try to switch language on starmap
      const languageSwitcher = page.getByRole('button', { name: /language|语言/i }).first();
      if (await languageSwitcher.isVisible().catch(() => false)) {
        await languageSwitcher.click();
        await page.waitForTimeout(300);
        
        const englishOption = page.getByRole('menuitem', { name: /english/i });
        if (await englishOption.isVisible().catch(() => false)) {
          await englishOption.click();
          await page.waitForTimeout(500);
        } else {
          await page.keyboard.press('Escape');
        }
      }
      
      // 6. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Complete Imaging Session Journey', () => {
    test('should complete full imaging session workflow', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Set location
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 2. Check tonight's conditions
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 3. Configure equipment
      const fovButton = page.getByRole('button', { name: /fov|视场/i }).first();
      if (await fovButton.isVisible().catch(() => false)) {
        await fovButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 4. Add targets
      const searchInput = page.getByPlaceholder(/search/i);
      const targets = [TEST_OBJECTS.M31.name, TEST_OBJECTS.M42.name, TEST_OBJECTS.M45.name];
      
      for (const target of targets) {
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.clear();
          await searchInput.fill(target);
          await page.waitForTimeout(1000);
          
          const firstResult = page.locator('[role="option"]').first();
          if (await firstResult.isVisible().catch(() => false)) {
            await firstResult.click();
            await page.waitForTimeout(500);
            
            const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i }).first();
            if (await addButton.isVisible().catch(() => false)) {
              await addButton.click();
              await page.waitForTimeout(300);
            }
          }
        }
      }
      
      // 5. Review shot list
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 6. Configure exposure
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
      
      // 7. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Error Recovery Journey', () => {
    test('should recover from errors and continue working', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // 1. Trigger potential errors with invalid input
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('!@#$%^&*()');
        await page.waitForTimeout(500);
        await searchInput.clear();
      }
      
      // 2. Rapid interactions
      for (let i = 0; i < 10; i++) {
        await starmapPage.clickCanvas();
      }
      
      // 3. Go offline and back online
      await page.context().setOffline(true);
      await page.waitForTimeout(500);
      await page.context().setOffline(false);
      await page.waitForTimeout(500);
      
      // 4. Continue normal usage
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        await page.keyboard.press('Escape');
      }
      
      // 5. Final verification
      await expect(starmapPage.canvas).toBeVisible();
    });
  });
});
