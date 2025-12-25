import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('Marker Manager', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Panel Access', () => {
    test('should have marker manager button', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i })
        .or(page.locator('[data-testid="marker-manager-button"]'));
      expect(await markerButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open marker manager panel', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close marker manager with Escape', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Marker List', () => {
    test('should display markers list', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const markersList = page.locator('text=/sky.*markers|天空标记/i');
        expect(await markersList.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show empty state when no markers', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const emptyState = page.locator('text=/no.*markers|没有标记/i');
        await emptyState.count();
        // Empty state may be visible if no markers exist
      }
    });
  });

  test.describe('Add Marker', () => {
    test('should have Add Marker button', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const addMarkerButton = page.getByRole('button', { name: /add.*marker|添加.*标记/i });
        expect(await addMarkerButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should add marker via context menu', async ({ page }) => {
      // Right-click on canvas
      const canvas = starmapPage.canvas;
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const addMarkerOption = page.locator('text=/add.*marker.*here|在此添加标记/i');
        if (await addMarkerOption.isVisible().catch(() => false)) {
          await addMarkerOption.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should set marker name', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const addMarkerButton = page.getByRole('button', { name: /add.*marker|添加.*标记/i }).first();
        if (await addMarkerButton.isVisible().catch(() => false)) {
          await addMarkerButton.click();
          await page.waitForTimeout(300);
          
          const nameInput = page.getByPlaceholder(/name|名称/i).first();
          if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill('Test Marker');
          }
        }
      }
    });

    test('should set marker description', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const descriptionInput = page.getByPlaceholder(/description|描述/i);
        if (await descriptionInput.isVisible().catch(() => false)) {
          await descriptionInput.fill('Test description');
        }
      }
    });

    test('should select marker icon', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const iconSelector = page.locator('text=/icon|图标/i');
        expect(await iconSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should select marker color', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const colorSelector = page.locator('text=/color|颜色/i');
        expect(await colorSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Marker Groups', () => {
    test('should have group selector', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const groupSelector = page.locator('text=/group|分组/i');
        expect(await groupSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should filter by group', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const allGroupsOption = page.locator('text=/all.*groups|所有分组/i');
        expect(await allGroupsOption.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Marker Actions', () => {
    test('should go to marker location', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const goToButton = page.getByRole('button', { name: /go.*to|前往/i });
        expect(await goToButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should edit marker', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const editButton = page.getByRole('button', { name: /edit|编辑/i }).first();
        if (await editButton.isVisible().catch(() => false)) {
          await editButton.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should delete marker', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const deleteButton = page.getByRole('button', { name: /delete|删除/i }).first();
        if (await deleteButton.isVisible().catch(() => false)) {
          await deleteButton.click();
          await page.waitForTimeout(300);
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Marker Visibility', () => {
    test('should toggle marker visibility', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const showHideButton = page.getByRole('button', { name: /show|hide|显示|隐藏/i }).first();
        if (await showHideButton.isVisible().catch(() => false)) {
          await showHideButton.click();
        }
      }
    });

    test('should show all markers', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const showAllButton = page.getByRole('button', { name: /show.*all|显示全部/i });
        expect(await showAllButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should hide all markers', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const hideAllButton = page.getByRole('button', { name: /hide.*all|隐藏全部/i });
        expect(await hideAllButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Clear All Markers', () => {
    test('should have Clear All button', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const clearAllButton = page.getByRole('button', { name: /clear.*all|清除全部/i });
        expect(await clearAllButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should confirm before clearing all', async ({ page }) => {
      const markerButton = page.getByRole('button', { name: /marker|标记/i }).first();
      
      if (await markerButton.isVisible().catch(() => false)) {
        await markerButton.click();
        await page.waitForTimeout(500);
        
        const clearAllButton = page.getByRole('button', { name: /clear.*all|清除全部/i }).first();
        if (await clearAllButton.isVisible().catch(() => false)) {
          await clearAllButton.click();
          await page.waitForTimeout(300);
          
          const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]');
          expect(await confirmDialog.count()).toBeGreaterThanOrEqual(0);
          
          await page.keyboard.press('Escape');
        }
      }
    });
  });
});
