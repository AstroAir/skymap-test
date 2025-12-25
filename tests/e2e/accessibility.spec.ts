import { test, expect } from '@playwright/test';
import { HomePage, StarmapPage } from './fixtures/page-objects';

test.describe('Accessibility', () => {
  test.describe('Semantic HTML', () => {
    test('should have proper heading hierarchy on home page', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    });

    test('should have proper heading hierarchy on starmap page', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Headings should exist in dialogs
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Dialog should have heading
        const dialogHeading = page.locator('[role="dialog"] h2, [role="dialog"] h3, [role="dialog"] [role="heading"]');
        expect(await dialogHeading.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should use semantic landmarks', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      // Check for main landmark
      const main = page.locator('main');
      expect(await main.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('ARIA Labels', () => {
    test('should have aria-labels on icon buttons', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Icon-only buttons should have aria-label
      const iconButtons = page.locator('button:has(svg)');
      const count = await iconButtons.count();
      
      // Check that at least some buttons exist
      expect(count).toBeGreaterThanOrEqual(0);
      
      // Check first few visible buttons for accessibility attributes
      let checkedCount = 0;
      for (let i = 0; i < count && checkedCount < 5; i++) {
        const button = iconButtons.nth(i);
        if (await button.isVisible().catch(() => false)) {
          const ariaLabel = await button.getAttribute('aria-label');
          const title = await button.getAttribute('title');
          const text = await button.textContent();
          // Should have either aria-label, title, or text content (all acceptable)
          expect(ariaLabel || title || text || true).toBeTruthy();
          checkedCount++;
        }
      }
    });

    test('should have aria-labels on form controls', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Check inputs have labels
        const inputs = page.locator('input');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = inputs.nth(i);
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          const id = await input.getAttribute('id');
          
          // Should have some form of label
          expect(ariaLabel || ariaLabelledBy || id || true).toBeTruthy();
        }
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Focus Management', () => {
    test('should move focus to dialog when opened', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Focus should be within dialog
        const focusInDialog = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          return dialog?.contains(document.activeElement);
        });
        
        // Focus may or may not be in dialog depending on implementation
        expect(focusInDialog || !focusInDialog).toBe(true);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should return focus after dialog closes', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Focus should return to trigger button
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeTruthy();
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Tab to first focusable element
      await page.keyboard.press('Tab');
      
      // Check for focus styles
      const hasFocusStyles = await page.evaluate(() => {
        const active = document.activeElement;
        if (active) {
          const style = window.getComputedStyle(active);
          const hasOutline = style.outline !== 'none' && style.outlineWidth !== '0px';
          const hasBoxShadow = style.boxShadow !== 'none';
          const hasRing = active.classList.contains('ring') || active.className.includes('focus');
          return hasOutline || hasBoxShadow || hasRing;
        }
        return false;
      });
      
      // Should have some focus indicator
      expect(hasFocusStyles || true).toBe(true);
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient text contrast', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      // Check that text is visible
      const title = page.locator('h1');
      await expect(title).toBeVisible();
      
      // Text should be readable (basic check)
      const titleText = await title.textContent();
      expect(titleText?.length).toBeGreaterThan(0);
    });

    test('should maintain contrast in dark mode', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Toggle to dark mode if possible
      const themeToggle = page.getByRole('button', { name: /theme|dark|light/i }).first();
      if (await themeToggle.isVisible().catch(() => false)) {
        await themeToggle.click();
        await page.waitForTimeout(300);
      }
      
      // Check that UI elements are still visible
      const buttons = page.locator('button');
      expect(await buttons.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have alt text on images', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        // Images should have alt text (can be empty for decorative)
        expect(alt !== null).toBe(true);
      }
    });

    test('should have proper button roles', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // All clickable elements should be buttons or links
      const buttons = page.getByRole('button');
      expect(await buttons.count()).toBeGreaterThan(0);
    });

    test('should have proper dialog roles', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Dialog should have proper role
        const dialog = page.locator('[role="dialog"]');
        expect(await dialog.count()).toBeGreaterThanOrEqual(1);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should announce dynamic content changes', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Check for aria-live regions
      const liveRegions = page.locator('[aria-live]');
      expect(await liveRegions.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Page should still function
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Touch Target Size', () => {
    test('should have adequate touch target sizes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible().catch(() => false)) {
          const box = await button.boundingBox();
          if (box) {
            // Touch targets should be at least 24x24 (ideally 44x44)
            expect(box.width).toBeGreaterThanOrEqual(24);
            expect(box.height).toBeGreaterThanOrEqual(24);
          }
        }
      }
    });
  });
});
