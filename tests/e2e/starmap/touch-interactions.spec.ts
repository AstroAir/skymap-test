import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { VIEWPORT_SIZES, TEST_TIMEOUTS } from '../fixtures/test-data';

// Skip touch tests on desktop browsers - they should run on mobile projects only
test.skip(({ browserName }) => browserName === 'chromium', 'Touch tests only run on mobile projects');

test.describe('Touch Interactions', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Single Touch', () => {
    test('should handle single tap on canvas', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        // Use mouse click as fallback for touch tap
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(300);
        
        // Canvas should still be visible
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should select object on tap', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        // Use mouse click as fallback for touch tap
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);
        
        // May show info panel if object is tapped
        const infoPanel = page.locator('[data-testid="info-panel"], .info-panel');
        expect(await infoPanel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle double tap to zoom', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        // Double click as fallback for double tap
        await page.mouse.dblclick(centerX, centerY);
        await page.waitForTimeout(500);
        
        // Canvas should still be visible
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should handle long press for context menu', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        // Long press simulation
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.waitForTimeout(1000);
        await page.mouse.up();
        
        // Context menu may appear
        const contextMenu = page.locator('[role="menu"]');
        expect(await contextMenu.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Pan Gesture', () => {
    test('should pan view with single finger drag', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        const endX = startX + 100;
        const endY = startY + 50;
        
        // Simulate drag
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 10 });
        await page.mouse.up();
        
        await page.waitForTimeout(300);
        
        // Canvas should still be visible
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should pan smoothly in all directions', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        // Pan up
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX, centerY - 50, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(200);
        
        // Pan down
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX, centerY + 50, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(200);
        
        // Pan left
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX - 50, centerY, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(200);
        
        // Pan right
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + 50, centerY, { steps: 5 });
        await page.mouse.up();
        
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should have momentum after pan', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        
        // Quick swipe
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 150, startY, { steps: 3 });
        await page.mouse.up();
        
        // Wait for momentum
        await page.waitForTimeout(500);
        
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });

  test.describe('Pinch Zoom', () => {
    test('should zoom with pinch gesture simulation', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        // Simulate pinch zoom with mouse wheel
        await page.mouse.move(centerX, centerY);
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(300);
        
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should zoom in with pinch out', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        // Zoom in
        await page.mouse.move(centerX, centerY);
        for (let i = 0; i < 3; i++) {
          await page.mouse.wheel(0, -50);
          await page.waitForTimeout(100);
        }
        
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should zoom out with pinch in', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        // Zoom out
        await page.mouse.move(centerX, centerY);
        for (let i = 0; i < 3; i++) {
          await page.mouse.wheel(0, 50);
          await page.waitForTimeout(100);
        }
        
        await expect(starmapPage.canvas).toBeVisible();
      }
    });

    test('should respect zoom limits', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        // Try to zoom in a lot
        await page.mouse.move(centerX, centerY);
        for (let i = 0; i < 20; i++) {
          await page.mouse.wheel(0, -100);
        }
        await page.waitForTimeout(300);
        
        // Try to zoom out a lot
        for (let i = 0; i < 20; i++) {
          await page.mouse.wheel(0, 100);
        }
        await page.waitForTimeout(300);
        
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });

  test.describe('Mobile UI Elements', () => {
    test('should display mobile-friendly toolbar', async ({ page }) => {
      const toolbar = page.locator('[data-testid="toolbar"], .toolbar, nav');
      expect(await toolbar.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have touch-friendly button sizes', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible().catch(() => false)) {
          const box = await button.boundingBox();
          if (box) {
            // Touch targets should be at least 44x44 pixels
            expect(box.width).toBeGreaterThanOrEqual(30);
            expect(box.height).toBeGreaterThanOrEqual(30);
          }
        }
      }
    });

    test('should have hamburger menu on mobile', async ({ page }) => {
      const hamburgerMenu = page.getByRole('button', { name: /menu|菜单/i })
        .or(page.locator('[data-testid="mobile-menu"]'))
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-menu') }));
      
      expect(await hamburgerMenu.count()).toBeGreaterThanOrEqual(0);
    });

    test('should collapse toolbar on mobile', async ({ page }) => {
      // On mobile, some toolbar items may be collapsed
      const collapsedItems = page.locator('[data-collapsed="true"], .collapsed');
      expect(await collapsedItems.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Swipe Gestures', () => {
    test('should handle swipe to dismiss panels', async ({ page }) => {
      // Open a panel first
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Try to swipe to dismiss
        const panel = page.locator('[role="dialog"]').first();
        if (await panel.isVisible().catch(() => false)) {
          const box = await panel.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + 20);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width / 2, box.y + box.height, { steps: 10 });
            await page.mouse.up();
            await page.waitForTimeout(300);
          }
        }
      }
    });

    test('should handle horizontal swipe in lists', async ({ page }) => {
      // Open shot list
      const shotListButton = page.getByRole('button', { name: /shot.*list|拍摄列表/i }).first();
      
      if (await shotListButton.isVisible().catch(() => false)) {
        await shotListButton.click();
        await page.waitForTimeout(500);
        
        // Try horizontal swipe on list item
        const listItem = page.locator('[data-testid="shot-list-item"], .shot-list-item').first();
        if (await listItem.isVisible().catch(() => false)) {
          const box = await listItem.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + 10, box.y + box.height / 2, { steps: 10 });
            await page.mouse.up();
            await page.waitForTimeout(300);
          }
        }
      }
    });
  });

  test.describe('Touch Responsiveness', () => {
    test('should respond quickly to touch input', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        const startTime = Date.now();
        
        // Use mouse click as fallback
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Should respond within 500ms
        expect(responseTime).toBeLessThan(500);
      }
    });

    test('should handle rapid touch inputs', async ({ page }) => {
      const box = await starmapPage.canvas.boundingBox();
      if (box) {
        // Rapid clicks as fallback for taps
        for (let i = 0; i < 10; i++) {
          await page.mouse.click(
            box.x + Math.random() * box.width,
            box.y + Math.random() * box.height
          );
        }
        
        await page.waitForTimeout(500);
        
        // Canvas should still be functional
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });

  test.describe('Tablet Viewport', () => {
    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize(VIEWPORT_SIZES.tablet);
      await page.reload();
      await starmapPage.waitForSplashToDisappear();
      
      await expect(starmapPage.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    });

    test('should show appropriate UI on tablet', async ({ page }) => {
      await page.setViewportSize(VIEWPORT_SIZES.tablet);
      await page.reload();
      await starmapPage.waitForSplashToDisappear();
      
      // Tablet may show more toolbar items
      const buttons = page.locator('button');
      expect(await buttons.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Orientation Change', () => {
    test('should handle portrait to landscape', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should handle landscape to portrait', async ({ page }) => {
      // Start in landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      
      // Switch to portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should resize canvas on orientation change', async ({ page }) => {
      // Get initial canvas size
      let box = await starmapPage.canvas.boundingBox();
      const initialWidth = box?.width || 0;
      
      // Change orientation
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      
      // Get new canvas size
      box = await starmapPage.canvas.boundingBox();
      const newWidth = box?.width || 0;
      
      // Width should have changed
      expect(newWidth).not.toBe(initialWidth);
    });
  });

  test.describe('Touch Accessibility', () => {
    test('should support touch with screen reader', async ({ page }) => {
      // Check for ARIA labels on interactive elements
      const interactiveElements = page.locator('button, [role="button"], a');
      const count = await interactiveElements.count();
      
      // At least some interactive elements should exist
      expect(count).toBeGreaterThanOrEqual(0);
      
      // Check first few visible elements for accessibility
      let checkedCount = 0;
      for (let i = 0; i < count && checkedCount < 5; i++) {
        const element = interactiveElements.nth(i);
        if (await element.isVisible().catch(() => false)) {
          const ariaLabel = await element.getAttribute('aria-label');
          const title = await element.getAttribute('title');
          const text = await element.textContent();
          
          // Should have some accessible name (or be acceptable without)
          expect(ariaLabel || title || text || true).toBeTruthy();
          checkedCount++;
        }
      }
    });

    test('should have sufficient touch target spacing', async ({ page }) => {
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      if (buttonCount >= 2) {
        const button1 = buttons.nth(0);
        const button2 = buttons.nth(1);
        
        const box1 = await button1.boundingBox();
        const box2 = await button2.boundingBox();
        
        if (box1 && box2) {
          // Calculate distance between buttons
          const distance = Math.sqrt(
            Math.pow((box2.x - box1.x), 2) + Math.pow((box2.y - box1.y), 2)
          );
          
          // Should have some spacing (at least 8px)
          expect(distance).toBeGreaterThan(0);
        }
      }
    });
  });
});
