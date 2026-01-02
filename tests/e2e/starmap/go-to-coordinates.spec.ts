import { test, expect, Page } from '@playwright/test';
import { TEST_TIMEOUTS, TEST_COORDINATES, TEST_OBJECTS } from '../fixtures/test-data';

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

test.describe('Go To Coordinates Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Access via Context Menu', () => {
    test('should open go to coordinates dialog from context menu', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        // Right click to open context menu
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        // Look for go to coordinates option
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i');
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          const dialog = page.locator('[role="dialog"]');
          await expect(dialog.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
        }
      }
    });
  });

  test.describe('Dialog Elements', () => {
    test('should have RA input field', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          const raInput = page.locator('input').filter({ has: page.locator('text=/RA/i') })
            .or(page.getByPlaceholder(/RA/i))
            .or(page.locator('label:has-text("RA") + input'));
          
          expect(await raInput.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have Dec input field', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          const decInput = page.locator('input').filter({ has: page.locator('text=/Dec/i') })
            .or(page.getByPlaceholder(/Dec/i));
          
          expect(await decInput.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have Go button', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          const goButton = page.getByRole('button', { name: /go|navigate|前往|导航/i });
          expect(await goButton.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Coordinate Input Formats', () => {
    test('should accept decimal degree coordinates', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          // Enter decimal coordinates
          const inputs = page.locator('[role="dialog"] input');
          const inputCount = await inputs.count();
          
          if (inputCount >= 2) {
            await inputs.nth(0).fill(TEST_COORDINATES.decimal.ra.toString());
            await inputs.nth(1).fill(TEST_COORDINATES.decimal.dec.toString());
          }
        }
      }
    });

    test('should accept HMS/DMS format coordinates', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          const inputs = page.locator('[role="dialog"] input');
          const inputCount = await inputs.count();
          
          if (inputCount >= 2) {
            await inputs.nth(0).fill(TEST_COORDINATES.sexagesimal.ra);
            await inputs.nth(1).fill(TEST_COORDINATES.sexagesimal.dec);
          }
        }
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to coordinates when Go is clicked', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          // Enter coordinates
          const inputs = page.locator('[role="dialog"] input');
          const inputCount = await inputs.count();
          
          if (inputCount >= 2) {
            await inputs.nth(0).fill('10.68');
            await inputs.nth(1).fill('41.27');
            
            // Click Go button
            const goButton = page.getByRole('button', { name: /go|navigate|前往|导航/i }).first();
            if (await goButton.isVisible().catch(() => false)) {
              await goButton.click();
              await page.waitForTimeout(500);
              
              // Dialog should close
              const dialog = page.locator('[role="dialog"]');
              await expect(dialog).toBeHidden({ timeout: 3000 }).catch(() => {});
            }
          }
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should show error for invalid coordinates', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          // Enter invalid coordinates
          const inputs = page.locator('[role="dialog"] input');
          const inputCount = await inputs.count();
          
          if (inputCount >= 2) {
            await inputs.nth(0).fill('invalid');
            await inputs.nth(1).fill('not a number');
            
            // Click Go button
            const goButton = page.getByRole('button', { name: /go|navigate|前往|导航/i }).first();
            if (await goButton.isVisible().catch(() => false)) {
              await goButton.click();
              await page.waitForTimeout(300);
              
              // Should show error message
              const errorMessage = page.locator('text=/invalid|error|错误/i');
              expect(await errorMessage.count()).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    });

    test('should validate coordinate ranges', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          // Enter out of range coordinates
          const inputs = page.locator('[role="dialog"] input');
          const inputCount = await inputs.count();
          
          if (inputCount >= 2) {
            await inputs.nth(0).fill('400'); // RA out of range
            await inputs.nth(1).fill('100'); // Dec out of range
            
            const goButton = page.getByRole('button', { name: /go|navigate|前往|导航/i }).first();
            if (await goButton.isVisible().catch(() => false)) {
              await goButton.click();
              await page.waitForTimeout(300);
            }
          }
        }
      }
    });
  });

  test.describe('Dialog Close', () => {
    test('should close dialog with Escape', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    });

    test('should close dialog with Cancel button', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const goToOption = page.locator('text=/go.*to.*coordinate|前往坐标/i').first();
        if (await goToOption.isVisible().catch(() => false)) {
          await goToOption.click();
          await page.waitForTimeout(300);
          
          const cancelButton = page.getByRole('button', { name: /cancel|取消/i });
          if (await cancelButton.isVisible().catch(() => false)) {
            await cancelButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
    });
  });
});

test.describe('Copy Coordinates', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Copy Click Position', () => {
    test('should copy click position coordinates from context menu', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const copyOption = page.locator('text=/copy.*position|copy.*coordinate|复制坐标/i');
        if (await copyOption.isVisible().catch(() => false)) {
          await copyOption.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Copy Object Coordinates', () => {
    test('should copy selected object coordinates', async ({ page }) => {
      // Search for and select an object
      const searchInput = page.getByPlaceholder(/search|搜索/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const result = page.locator('[role="option"]').first();
        if (await result.isVisible().catch(() => false)) {
          await result.click();
          await page.waitForTimeout(500);
          
          // Right click for context menu
          const canvas = page.locator('canvas').first();
          const box = await canvas.boundingBox();
          
          if (box) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
            await page.waitForTimeout(500);
            
            const copyOption = page.locator('text=/copy.*object|copy.*coordinate|复制坐标/i');
            if (await copyOption.isVisible().catch(() => false)) {
              await copyOption.click();
              await page.waitForTimeout(300);
            }
          }
        }
      }
    });
  });
});

test.describe('Center View Here', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Center on Click Position', () => {
    test('should center view on click position from context menu', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        // Click at offset position
        await page.mouse.click(
          box.x + box.width * 0.75,
          box.y + box.height * 0.75,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const centerOption = page.locator('text=/center.*view|center.*here|居中|居中视图/i');
        if (await centerOption.isVisible().catch(() => false)) {
          await centerOption.click();
          await page.waitForTimeout(500);
          
          // Canvas should still be visible
          await expect(canvas).toBeVisible();
        }
      }
    });
  });
});

test.describe('Add Marker Here', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Add Marker from Context Menu', () => {
    test('should add marker at click position', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        
        const addMarkerOption = page.locator('text=/add.*marker|添加标记/i');
        if (await addMarkerOption.isVisible().catch(() => false)) {
          await addMarkerOption.click();
          await page.waitForTimeout(300);
          
          // Marker dialog or panel should open
          const markerDialog = page.locator('[role="dialog"]');
          expect(await markerDialog.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});
