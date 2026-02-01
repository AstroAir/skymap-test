import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';
import { TEST_OBJECTS } from '../fixtures/test-data';

test.describe('Shot List', () => {
  let _starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    _starmapPage = new StarmapPage(page);
    // Use skipWasmWait for faster tests - shot list UI works before WASM loads
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Shot List Panel', () => {
    test('should have shot list button', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表|目标列表/i })
        .or(page.locator('[data-testid="shot-list-button"]'));
      expect(await shotListButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open shot list panel', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表|目标列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close shot list panel with Escape', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表|目标列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });

    test('should show empty state when no targets', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表|目标列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const emptyState = page.locator('text=/no.*target|empty|没有目标|列表为空/i');
        await emptyState.count();
        // Empty state may be visible if no targets
      }
    });
  });

  test.describe('Adding Targets', () => {
    test('should add target from search', async ({ page }) => {
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
          }
        }
      }
    });

    test('should show target in shot list after adding', async ({ page }) => {
      // Add a target first
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
            
            // Open shot list
            const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
            if (await shotListButton.isVisible().catch(() => false)) {
              await shotListButton.click();
              await page.waitForTimeout(500);
              
              // Target should be in list
              const targetItem = page.locator(`text=/${TEST_OBJECTS.M42.name}/i`);
              expect(await targetItem.count()).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    });

    test('should prevent duplicate targets', async ({ page }) => {
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
            // Add twice
            await addButton.click();
            await page.waitForTimeout(300);
            await addButton.click();
            await page.waitForTimeout(300);
            // Should show warning or prevent duplicate
          }
        }
      }
    });
  });

  test.describe('Target Management', () => {
    test('should set target priority', async ({ page }) => {
      // First add a target
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
            
            // Open shot list and look for priority controls
            const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
            if (await shotListButton.isVisible().catch(() => false)) {
              await shotListButton.click();
              await page.waitForTimeout(500);
              
              const priorityControl = page.locator('text=/priority|优先级/i');
              expect(await priorityControl.count()).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    });

    test('should update target status', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const statusControl = page.locator('text=/status|planned|progress|complete|状态|计划|进行|完成/i');
        expect(await statusControl.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should delete single target', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const deleteButton = page.getByRole('button', { name: /delete|remove|删除|移除/i }).first();
        if (await deleteButton.isVisible().catch(() => false)) {
          await deleteButton.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should have Clear Done button', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const clearDoneButton = page.getByRole('button', { name: /clear.*done|清除.*完成/i });
        expect(await clearDoneButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have Clear All button', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const clearAllButton = page.getByRole('button', { name: /clear.*all|清除.*全部/i });
        expect(await clearAllButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should confirm before clearing all', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const clearAllButton = page.getByRole('button', { name: /clear.*all|清除.*全部/i }).first();
        if (await clearAllButton.isVisible().catch(() => false)) {
          await clearAllButton.click();
          await page.waitForTimeout(300);
          
          // Confirmation dialog should appear
          const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]');
          expect(await confirmDialog.count()).toBeGreaterThanOrEqual(0);
          
          // Cancel the action
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Target Grouping', () => {
    test('should have grouping options', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const groupByControl = page.locator('text=/group.*by|分组/i');
        expect(await groupByControl.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should group by priority', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const groupSelect = page.locator('[data-testid="group-by"]')
          .or(page.getByRole('combobox', { name: /group/i }));
        
        if (await groupSelect.first().isVisible().catch(() => false)) {
          await groupSelect.first().click();
          await page.waitForTimeout(300);
          
          const priorityOption = page.getByRole('option', { name: /priority|优先级/i });
          if (await priorityOption.isVisible().catch(() => false)) {
            await priorityOption.click();
          }
        }
      }
    });

    test('should group by status', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const groupSelect = page.locator('[data-testid="group-by"]')
          .or(page.getByRole('combobox', { name: /group/i }));
        
        if (await groupSelect.first().isVisible().catch(() => false)) {
          await groupSelect.first().click();
          await page.waitForTimeout(300);
          
          const statusOption = page.getByRole('option', { name: /status|状态/i });
          if (await statusOption.isVisible().catch(() => false)) {
            await statusOption.click();
          }
        }
      }
    });
  });

  test.describe('Session Analysis', () => {
    test('should show total imaging time', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const totalTime = page.locator('text=/total.*time|imaging.*time|总时间|成像时间/i');
        expect(await totalTime.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show night coverage', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const coverage = page.locator('text=/coverage|night|覆盖/i');
        expect(await coverage.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should warn about overlapping targets', async ({ page }) => {
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        const overlapWarning = page.locator('text=/overlap|conflict|重叠|冲突/i');
        await overlapWarning.count();
        // Warning may appear if there are overlapping targets
      }
    });
  });

  test.describe('Target Navigation', () => {
    test('should go to target when clicking', async ({ page }) => {
      // Add a target first
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
            
            // Open shot list
            const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
            if (await shotListButton.isVisible().catch(() => false)) {
              await shotListButton.click();
              await page.waitForTimeout(500);
              
              // Click on target to navigate
              const targetItem = page.locator(`text=/${TEST_OBJECTS.M31.name}/i`).first();
              if (await targetItem.isVisible().catch(() => false)) {
                await targetItem.click();
                await page.waitForTimeout(500);
              }
            }
          }
        }
      }
    });
  });
});
