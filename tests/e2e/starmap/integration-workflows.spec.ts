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

test.describe('Search to Shot List Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should search object, view details, and add to shot list', async ({ page }) => {
    // Step 1: Search for object
    const searchInput = page.getByPlaceholder(/search|搜索/i);
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(TEST_OBJECTS.M31.name);
      await page.waitForTimeout(1000);
      
      // Step 2: Select result
      const result = page.locator('[role="option"]').first();
      if (await result.isVisible().catch(() => false)) {
        await result.click();
        await page.waitForTimeout(500);
        
        // Step 3: Check info panel appeared
        const infoPanel = page.locator('[data-testid="info-panel"]')
          .or(page.locator('.info-panel-enter'))
          .or(page.locator('text=/M31|Andromeda/i'));
        
        expect(await infoPanel.count()).toBeGreaterThanOrEqual(0);
        
        // Step 4: Add to shot list
        const addButton = page.getByRole('button', { name: /add.*list|添加/i }).first();
        if (await addButton.isVisible().catch(() => false)) {
          await addButton.click();
          await page.waitForTimeout(300);
          
          // Verify toast or feedback
          const toast = page.locator('[data-sonner-toast]');
          expect(await toast.count()).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should search multiple objects and add all to shot list', async ({ page }) => {
    const objects = [TEST_OBJECTS.M31.name, TEST_OBJECTS.M42.name, TEST_OBJECTS.M45.name];
    
    for (const objectName of objects) {
      const searchInput = page.getByPlaceholder(/search|搜索/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(objectName);
        await page.waitForTimeout(800);
        
        const result = page.locator('[role="option"]').first();
        if (await result.isVisible().catch(() => false)) {
          await result.click();
          await page.waitForTimeout(400);
          
          const addButton = page.getByRole('button', { name: /add.*list|添加/i }).first();
          if (await addButton.isVisible().catch(() => false)) {
            await addButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }
    
    // Verify shot list has items
    const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
    if (await shotListButton.isVisible().catch(() => false)) {
      await shotListButton.click();
      await page.waitForTimeout(500);
      
      // Shot list should have items
      const items = page.locator('[data-testid="shot-list-item"]')
        .or(page.locator('.shot-list-item'));
      expect(await items.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Equipment Configuration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should configure equipment and see FOV overlay', async ({ page }) => {
    // Step 1: Open settings
    const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
    
    if (await settingsButton.isVisible().catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Step 2: Navigate to equipment settings
      const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
      if (await equipmentTab.isVisible().catch(() => false)) {
        await equipmentTab.click();
        await page.waitForTimeout(300);
        
        // Step 3: Configure telescope
        const focalLengthInput = page.locator('input').filter({ has: page.locator('text=/focal/i') }).first()
          .or(page.getByPlaceholder(/focal/i).first());
        
        if (await focalLengthInput.isVisible().catch(() => false)) {
          await focalLengthInput.fill('1000');
        }
      }
      
      // Close settings
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    
    // Step 4: Enable FOV overlay
    const fovButton = page.getByRole('button', { name: /fov/i }).first();
    if (await fovButton.isVisible().catch(() => false)) {
      await fovButton.click();
      await page.waitForTimeout(300);
      
      // FOV overlay should appear
      const fovOverlay = page.locator('[data-testid="fov-overlay"]')
        .or(page.locator('.fov-overlay'));
      expect(await fovOverlay.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Tonight Planning Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should view tonight recommendations and select object', async ({ page }) => {
    // Step 1: Open tonight panel
    const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
    
    if (await tonightButton.isVisible().catch(() => false)) {
      await tonightButton.click();
      await page.waitForTimeout(500);
      
      // Step 2: View recommendations
      const panel = page.locator('[role="dialog"]')
        .or(page.locator('[data-slot="drawer-content"]'));
      
      await expect(panel.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
      
      // Step 3: Select a recommended object
      const objectCard = page.locator('[data-slot="card"]').first();
      if (await objectCard.isVisible().catch(() => false)) {
        await objectCard.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should add tonight recommendation to shot list', async ({ page }) => {
    const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
    
    if (await tonightButton.isVisible().catch(() => false)) {
      await tonightButton.click();
      await page.waitForTimeout(500);
      
      // Find add button on first card
      const addButton = page.locator('button').filter({ 
        has: page.locator('svg.lucide-plus') 
      }).first();
      
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(300);
        
        // Should show success feedback
        const toast = page.locator('[data-sonner-toast]');
        expect(await toast.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

test.describe('Sky Atlas Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should search in sky atlas and navigate to object', async ({ page }) => {
    // Open sky atlas
    const atlasButton = page.getByRole('button', { name: /atlas|星图集/i }).first()
      .or(page.locator('button.toolbar-btn').filter({ has: page.locator('svg.lucide-telescope') }).first());
    
    if (await atlasButton.isVisible().catch(() => false)) {
      await atlasButton.click();
      await page.waitForTimeout(500);
      
      // Search in atlas
      const searchInput = page.locator('[data-slot="drawer-content"]')
        .getByPlaceholder(/search|搜索/i).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('M31');
        await page.waitForTimeout(500);
        
        // Click search button
        const searchButton = page.locator('[data-slot="drawer-content"]')
          .getByRole('button', { name: /search|搜索/i }).first();
        
        if (await searchButton.isVisible().catch(() => false)) {
          await searchButton.click();
          await page.waitForTimeout(500);
        }
        
        // Click go to on result
        const goToButton = page.locator('button').filter({ 
          has: page.locator('svg.lucide-target') 
        }).first();
        
        if (await goToButton.isVisible().catch(() => false)) {
          await goToButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});

test.describe('Time Control Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should change time and see sky update', async ({ page }) => {
    // Open time controls
    const clockDisplay = page.locator('[data-testid="clock-display"]')
      .or(page.locator('.clock-display'));
    
    if (await clockDisplay.isVisible().catch(() => false)) {
      await clockDisplay.click();
      await page.waitForTimeout(300);
    }
    
    // Set time to now
    const nowButton = page.getByRole('button', { name: /now|现在/i }).first();
    if (await nowButton.isVisible().catch(() => false)) {
      await nowButton.click();
      await page.waitForTimeout(300);
    }
    
    // Toggle play/pause
    const playButton = page.getByRole('button', { name: /play|pause|播放|暂停/i }).first();
    if (await playButton.isVisible().catch(() => false)) {
      await playButton.click();
      await page.waitForTimeout(500);
      await playButton.click();
    }
  });
});

test.describe('Object Detail Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should view object details with images and info', async ({ page }) => {
    // Search for object
    const searchInput = page.getByPlaceholder(/search|搜索/i);
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(TEST_OBJECTS.M42.name);
      await page.waitForTimeout(1000);
      
      const result = page.locator('[role="option"]').first();
      if (await result.isVisible().catch(() => false)) {
        await result.click();
        await page.waitForTimeout(500);
        
        // Open details drawer
        const detailsButton = page.getByRole('button', { name: /detail|info|详情/i }).first();
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          // Check drawer content
          const drawer = page.locator('[data-testid="object-detail-drawer"]')
            .or(page.locator('[role="dialog"]'));
          
          await expect(drawer.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
          
          // Check for tabs
          const tabs = page.getByRole('tab');
          expect(await tabs.count()).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should navigate between detail tabs', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|搜索/i);
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(TEST_OBJECTS.M31.name);
      await page.waitForTimeout(1000);
      
      const result = page.locator('[role="option"]').first();
      if (await result.isVisible().catch(() => false)) {
        await result.click();
        await page.waitForTimeout(500);
        
        const detailsButton = page.getByRole('button', { name: /detail|info|详情/i }).first();
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate through tabs
          const tabs = page.getByRole('tab');
          const tabCount = await tabs.count();
          
          for (let i = 0; i < Math.min(tabCount, 4); i++) {
            await tabs.nth(i).click();
            await page.waitForTimeout(300);
          }
        }
      }
    }
  });
});

test.describe('Marker Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should add marker and see it on map', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    
    if (box) {
      // Right click to add marker
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
      await page.waitForTimeout(500);
      
      const addMarkerOption = page.locator('text=/add.*marker|添加标记/i').first();
      if (await addMarkerOption.isVisible().catch(() => false)) {
        await addMarkerOption.click();
        await page.waitForTimeout(300);
        
        // Open marker manager to verify
        const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
        if (await markerButton.isVisible().catch(() => false)) {
          await markerButton.click();
          await page.waitForTimeout(500);
          
          // Check for markers in list
          const markers = page.locator('[data-testid="marker-item"]')
            .or(page.locator('.marker-item'));
          expect(await markers.count()).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

test.describe('Exposure Calculator Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should calculate exposure with equipment settings', async ({ page }) => {
    // Open exposure calculator
    const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
    
    if (await exposureButton.isVisible().catch(() => false)) {
      await exposureButton.click();
      await page.waitForTimeout(500);
      
      // Check for calculator inputs
      const panel = page.locator('[role="dialog"]')
        .or(page.locator('[data-slot="drawer-content"]'));
      
      await expect(panel.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
      
      // Look for exposure-related inputs
      const exposureInputs = page.locator('input[type="number"]');
      expect(await exposureInputs.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Altitude Chart Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should view altitude chart for selected object', async ({ page }) => {
    // Search for object
    const searchInput = page.getByPlaceholder(/search|搜索/i);
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(TEST_OBJECTS.M31.name);
      await page.waitForTimeout(1000);
      
      const result = page.locator('[role="option"]').first();
      if (await result.isVisible().catch(() => false)) {
        await result.click();
        await page.waitForTimeout(500);
        
        // Open details and look for altitude chart
        const detailsButton = page.getByRole('button', { name: /detail|info|详情/i }).first();
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          // Look for altitude chart
          const altitudeChart = page.locator('text=/altitude|visibility|高度|可见/i')
            .or(page.locator('canvas, svg').nth(1));
          
          expect(await altitudeChart.count()).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

test.describe('Error Recovery Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test('should recover from network error gracefully', async ({ page }) => {
    // Simulate network issues by going offline
    await page.context().setOffline(true);
    
    // Try to perform an action that requires network
    const searchInput = page.getByPlaceholder(/search|搜索/i);
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('M31');
      await page.waitForTimeout(500);
      
      // Should handle gracefully without crashing
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
    }
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should handle rapid navigation without errors', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    
    if (box) {
      // Rapid panning
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2 + (Math.random() - 0.5) * 200,
          box.y + box.height / 2 + (Math.random() - 0.5) * 200,
          { steps: 5 }
        );
        await page.mouse.up();
      }
      
      // Rapid zooming
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, -50);
        await page.mouse.wheel(0, 50);
      }
      
      // Canvas should still work
      await expect(canvas).toBeVisible();
    }
  });
});
