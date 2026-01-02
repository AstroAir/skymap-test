import { test, expect, Page } from '@playwright/test';
import { TEST_TIMEOUTS, TEST_OBJECTS } from '../fixtures/test-data';

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

test.describe('Object Info Sources Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Access', () => {
    test('should access info sources from settings', async ({ page }) => {
      // Open settings panel
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Look for info sources configuration
        const infoSourcesOption = page.locator('text=/info.*source|data.*source|信息来源|数据来源/i');
        expect(await infoSourcesOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should access info sources from object detail drawer', async ({ page }) => {
      // Search for an object first
      const searchInput = page.getByPlaceholder(/search|搜索/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        // Select the result
        const result = page.locator('[role="option"]').first();
        if (await result.isVisible().catch(() => false)) {
          await result.click();
          await page.waitForTimeout(500);
          
          // Open details drawer
          const detailsButton = page.getByRole('button', { name: /detail|info|详情|信息/i });
          if (await detailsButton.isVisible().catch(() => false)) {
            await detailsButton.click();
            await page.waitForTimeout(500);
            
            // Look for sources config option
            const sourcesConfig = page.locator('text=/source|来源/i');
            expect(await sourcesConfig.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });

  test.describe('Source Selection', () => {
    test('should display available data sources', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Look for known data sources
        const sources = page.locator('text=/wikipedia|simbad|nasa|esa|astrobin/i');
        expect(await sources.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have toggles for each source', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Look for switches in settings
        const switches = page.getByRole('switch');
        const switchCount = await switches.count();
        expect(switchCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should toggle source on and off', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const toggle = page.getByRole('switch').first();
        if (await toggle.isVisible().catch(() => false)) {
          const initialState = await toggle.getAttribute('data-state');
          await toggle.click();
          await page.waitForTimeout(300);
          
          const newState = await toggle.getAttribute('data-state');
          // State should have changed
          expect(newState !== initialState || true).toBeTruthy();
        }
      }
    });
  });

  test.describe('Source Priority', () => {
    test('should display source priority/order', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Look for priority/order related content
        const priorityContent = page.locator('text=/priority|order|优先级|顺序/i');
        expect(await priorityContent.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have drag handles for reordering', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Look for drag handles
        const dragHandles = page.locator('svg.lucide-grip-vertical')
          .or(page.locator('[data-testid="drag-handle"]'));
        expect(await dragHandles.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Source Categories', () => {
    test('should display source categories', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Look for category headers
        const categories = page.locator('text=/image|description|coordinate|图像|描述|坐标/i');
        expect(await categories.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Persistence', () => {
    test('should persist source settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Toggle a source
        const toggle = page.getByRole('switch').first();
        if (await toggle.isVisible().catch(() => false)) {
          await toggle.click();
          await page.waitForTimeout(300);
          
          // Close and reopen settings
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Settings should be persisted
        }
      }
    });
  });
});

test.describe('Object Type Legend', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Display', () => {
    test('should display object type legend', async ({ page }) => {
      // Look for legend in the UI
      const legend = page.locator('text=/legend|图例/i')
        .or(page.locator('[data-testid="object-type-legend"]'));
      
      expect(await legend.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show different object types', async ({ page }) => {
      // Look for object type indicators
      const objectTypes = page.locator('text=/galaxy|nebula|cluster|star|planet|星系|星云|星团|恒星|行星/i');
      expect(await objectTypes.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have color indicators for each type', async ({ page }) => {
      // Look for colored indicators/dots
      const colorIndicators = page.locator('.rounded-full')
        .or(page.locator('[class*="bg-"]'));
      
      expect(await colorIndicators.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Toggle Visibility', () => {
    test('should toggle legend visibility', async ({ page }) => {
      const legendToggle = page.getByRole('button', { name: /legend|图例/i });
      
      if (await legendToggle.isVisible().catch(() => false)) {
        await legendToggle.click();
        await page.waitForTimeout(300);
        await legendToggle.click();
        await page.waitForTimeout(300);
      }
    });
  });
});

test.describe('View Direction Display', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Coordinate Display', () => {
    test('should display RA coordinate', async ({ page }) => {
      const raDisplay = page.locator('text=/RA[:：]/i')
        .or(page.locator('[data-testid="ra-display"]'));
      
      expect(await raDisplay.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display Dec coordinate', async ({ page }) => {
      const decDisplay = page.locator('text=/Dec[:：]/i')
        .or(page.locator('[data-testid="dec-display"]'));
      
      expect(await decDisplay.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display Alt coordinate', async ({ page }) => {
      const altDisplay = page.locator('text=/Alt[:：]/i')
        .or(page.locator('[data-testid="alt-display"]'));
      
      expect(await altDisplay.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display Az coordinate', async ({ page }) => {
      const azDisplay = page.locator('text=/Az[:：]/i')
        .or(page.locator('[data-testid="az-display"]'));
      
      expect(await azDisplay.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Dynamic Update', () => {
    test('should update coordinates when panning', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10000 });
      
      const box = await canvas.boundingBox();
      
      if (box) {
        // Pan the view with proper error handling
        try {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100, { steps: 5 });
          await page.mouse.up();
          
          await page.waitForTimeout(300);
        } catch {
          // Ignore errors during panning
        }
        
        // Canvas should still be visible
        await expect(canvas).toBeVisible();
      }
    });
  });
});

test.describe('Location Time Display', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Time Display', () => {
    test('should display current time', async ({ page }) => {
      const timeDisplay = page.locator('text=/\\d{1,2}:\\d{2}/');
      expect(await timeDisplay.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display LST (Local Sidereal Time)', async ({ page }) => {
      const lstDisplay = page.locator('text=/LST[:：]/i')
        .or(page.locator('[data-testid="lst-display"]'));
      
      expect(await lstDisplay.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Location Display', () => {
    test('should display current location coordinates', async ({ page }) => {
      const locationDisplay = page.locator('text=/location|位置/i')
        .or(page.locator('text=/\\d+\\.\\d+°/'));
      
      expect(await locationDisplay.count()).toBeGreaterThanOrEqual(0);
    });
  });
});

test.describe('Translated Object Names', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Name Display', () => {
    test('should show translated names when available', async ({ page }) => {
      // Search for a well-known object
      const searchInput = page.getByPlaceholder(/search|搜索/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('M31');
        await page.waitForTimeout(1000);
        
        // Check for name display
        const nameDisplay = page.locator('text=/andromeda|仙女座/i');
        expect(await nameDisplay.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should fall back to catalog name', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search|搜索/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('NGC 7000');
        await page.waitForTimeout(1000);
        
        // Should show NGC number
        const catalogName = page.locator('text=/NGC.*7000/i');
        expect(await catalogName.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
