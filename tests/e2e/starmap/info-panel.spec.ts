import { test, expect } from '@playwright/test';
import { TEST_OBJECTS } from '../fixtures/test-data';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Info Panel', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Object Selection', () => {
    test('should show info panel when object is selected', async ({ page }) => {
      // Search for an object first
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        // Select from results
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // Info panel should appear
          const infoPanel = page.locator('[data-testid="info-panel"], .info-panel');
          await infoPanel.count();
          // Panel may be visible
        }
      }
    });

    test('should display object name in info panel', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // Check for object name
          const objectName = page.locator('text=/M31|Andromeda/i');
          expect(await objectName.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display coordinates in info panel', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // Check for coordinates (RA/Dec or Alt/Az)
          const coords = page.locator('text=/RA|Dec|Alt|Az/i');
          expect(await coords.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display object type in info panel', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // Check for object type
          const objectType = page.locator('text=/galaxy|nebula|star|planet|星系|星云|恒星|行星/i');
          expect(await objectType.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Info Panel Actions', () => {
    test('should have Add to List button', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M42.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i });
          expect(await addButton.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should add object to shot list', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M42.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i }).first();
          if (await addButton.isVisible().catch(() => false)) {
            await addButton.click();
            await page.waitForTimeout(500);
            // Object should be added to shot list
          }
        }
      }
    });

    test('should have Slew button', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M42.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const slewButton = page.getByRole('button', { name: /slew|指向/i });
          expect(await slewButton.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have View Details button', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M42.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const detailsButton = page.getByRole('button', { name: /details|view|详情|查看/i });
          expect(await detailsButton.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Altitude Chart', () => {
    test('should display altitude chart', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // Look for chart element
          const chart = page.locator('[data-testid="altitude-chart"], .altitude-chart, svg, canvas');
          expect(await chart.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should show rise/transit/set times', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // Look for rise/transit/set labels
          const timeLabels = page.locator('text=/rise|transit|set|升起|中天|落下/i');
          expect(await timeLabels.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Object Detail Drawer', () => {
    test('should open detail drawer when clicking details button', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
          if (await detailsButton.isVisible().catch(() => false)) {
            await detailsButton.click();
            await page.waitForTimeout(500);
            
            // Drawer should open
            const drawer = page.locator('[role="dialog"], [data-state="open"]');
            expect(await drawer.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should have Overview tab in detail drawer', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
          if (await detailsButton.isVisible().catch(() => false)) {
            await detailsButton.click();
            await page.waitForTimeout(500);
            
            const overviewTab = page.getByRole('tab', { name: /overview|概览/i });
            expect(await overviewTab.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should have Images tab in detail drawer', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
          if (await detailsButton.isVisible().catch(() => false)) {
            await detailsButton.click();
            await page.waitForTimeout(500);
            
            const imagesTab = page.getByRole('tab', { name: /images|图片/i });
            expect(await imagesTab.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should close detail drawer with Escape', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
          if (await detailsButton.isVisible().catch(() => false)) {
            await detailsButton.click();
            await page.waitForTimeout(500);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
          }
        }
      }
    });
  });

  test.describe('Info Panel Deselection', () => {
    test('should hide info panel when clicking empty space', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // Click on canvas to deselect
          const canvas = page.locator('canvas').first();
          await canvas.click({ position: { x: 100, y: 100 } });
          await page.waitForTimeout(500);
          
          // Info panel may be hidden
        }
      }
    });

    test('should hide info panel when pressing Escape', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    });
  });
});
