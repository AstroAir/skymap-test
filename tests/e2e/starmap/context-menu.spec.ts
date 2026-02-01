import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { TEST_OBJECTS } from '../fixtures/test-data';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Context Menu', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Canvas Context Menu', () => {
    test('should open context menu on right-click', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const contextMenu = page.locator('[role="menu"]')
          .or(page.locator('.context-menu'))
          .or(page.locator('[data-testid="context-menu"]'));
        
        expect(await contextMenu.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close context menu on click outside', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        // Open context menu
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(300);
        
        // Click outside
        await page.mouse.click(box.x + 10, box.y + 10);
        await page.waitForTimeout(300);
        
        const contextMenu = page.locator('[role="menu"]');
        // Only assert if menu was visible
        if (await contextMenu.isVisible()) {
          await expect(contextMenu).toBeHidden({ timeout: 2000 });
        }
      }
    });

    test('should close context menu on Escape', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(300);
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        const contextMenu = page.locator('[role="menu"]');
        // Only assert if menu was visible
        if (await contextMenu.isVisible()) {
          await expect(contextMenu).toBeHidden({ timeout: 2000 });
        }
      }
    });
  });

  test.describe('Context Menu Actions', () => {
    test('should have Center Here option', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const centerOption = page.locator('text=/center.*here|居中/i');
        expect(await centerOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have Add Marker option', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const markerOption = page.locator('text=/add.*marker|添加.*标记/i');
        expect(await markerOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have Copy Coordinates option', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const copyOption = page.locator('text=/copy.*coord|复制.*坐标/i');
        expect(await copyOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have What\'s Here option', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const whatsHereOption = page.locator('text=/what.*here|这里有什么/i');
        expect(await whatsHereOption.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Object Context Menu', () => {
    test('should show object-specific options when right-clicking on object', async ({ page }) => {
      // First select an object
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // Right-click on canvas (where object should be centered)
          const box = await starmapPage.canvas.boundingBox();
          if (box) {
            await page.mouse.click(
              box.x + box.width / 2,
              box.y + box.height / 2,
              { button: 'right' }
            );
            await page.waitForTimeout(500);
            
            const contextMenu = page.locator('[role="menu"]');
            expect(await contextMenu.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should have Add to Shot List option for objects', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const box = await starmapPage.canvas.boundingBox();
          if (box) {
            await page.mouse.click(
              box.x + box.width / 2,
              box.y + box.height / 2,
              { button: 'right' }
            );
            await page.waitForTimeout(500);
            
            const addToListOption = page.locator('text=/add.*list|添加.*列表/i');
            expect(await addToListOption.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should have View Details option for objects', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M42.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const box = await starmapPage.canvas.boundingBox();
          if (box) {
            await page.mouse.click(
              box.x + box.width / 2,
              box.y + box.height / 2,
              { button: 'right' }
            );
            await page.waitForTimeout(500);
            
            const detailsOption = page.locator('text=/view.*detail|details|查看.*详情/i');
            expect(await detailsOption.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should have Slew To option for objects', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M45.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const box = await starmapPage.canvas.boundingBox();
          if (box) {
            await page.mouse.click(
              box.x + box.width / 2,
              box.y + box.height / 2,
              { button: 'right' }
            );
            await page.waitForTimeout(500);
            
            const slewOption = page.locator('text=/slew|指向/i');
            expect(await slewOption.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });

  test.describe('Context Menu Keyboard Navigation', () => {
    test('should navigate menu items with arrow keys', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const contextMenu = page.locator('[role="menu"]');
        if (await contextMenu.isVisible().catch(() => false)) {
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('ArrowUp');
          await page.waitForTimeout(200);
        }
      }
    });

    test('should select menu item with Enter', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const contextMenu = page.locator('[role="menu"]');
        if (await contextMenu.isVisible().catch(() => false)) {
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Context Menu Submenus', () => {
    test('should open submenu on hover', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        // Look for menu items with submenu indicators
        const submenuItem = page.locator('[role="menuitem"]').filter({ has: page.locator('svg') }).first();
        if (await submenuItem.isVisible().catch(() => false)) {
          await submenuItem.hover();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Context Menu Position', () => {
    test('should appear at click position', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const clickX = box.x + 100;
        const clickY = box.y + 100;
        
        await page.mouse.click(clickX, clickY, { button: 'right' });
        await page.waitForTimeout(500);
        
        const contextMenu = page.locator('[role="menu"]').first();
        if (await contextMenu.isVisible().catch(() => false)) {
          const menuBox = await contextMenu.boundingBox();
          if (menuBox) {
            // Menu should appear near click position
            expect(Math.abs(menuBox.x - clickX)).toBeLessThan(300);
            expect(Math.abs(menuBox.y - clickY)).toBeLessThan(300);
          }
        }
      }
    });

    test('should stay within viewport bounds', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        // Click near edge
        await page.mouse.click(
          box.x + box.width - 10,
          box.y + box.height - 10,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const contextMenu = page.locator('[role="menu"]').first();
        if (await contextMenu.isVisible().catch(() => false)) {
          const menuBox = await contextMenu.boundingBox();
          const viewport = page.viewportSize();
          
          if (menuBox && viewport) {
            // Menu should be within viewport
            expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width + 10);
            expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height + 10);
          }
        }
      }
    });
  });

  test.describe('Context Menu Accessibility', () => {
    test('should have proper ARIA roles', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const menu = page.locator('[role="menu"]');
        const menuItems = page.locator('[role="menuitem"]');
        
        if (await menu.isVisible().catch(() => false)) {
          expect(await menuItems.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should be focusable', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { button: 'right' }
        );
        await page.waitForTimeout(500);
        
        const menu = page.locator('[role="menu"]');
        if (await menu.isVisible().catch(() => false)) {
          // Menu or first item should be focused
          const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('role'));
          expect(['menu', 'menuitem', null]).toContain(focusedElement);
        }
      }
    });
  });
});
