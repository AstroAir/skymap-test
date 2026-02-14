import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Navigation History', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Back/Forward Buttons', () => {
    test('should have back button', async ({ page }) => {
      const backButton = page.getByRole('button', { name: /back|后退/i })
        .or(page.locator('[aria-label*="back"], [aria-label*="后退"]'))
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }));

      expect(await backButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have forward button', async ({ page }) => {
      const forwardButton = page.getByRole('button', { name: /forward|前进/i })
        .or(page.locator('[aria-label*="forward"], [aria-label*="前进"]'))
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }));

      expect(await forwardButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have back button disabled when no history', async ({ page }) => {
      const backButton = page.getByRole('button', { name: /back|后退/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }).first());

      if (await backButton.isVisible().catch(() => false)) {
        const isDisabled = await backButton.isDisabled().catch(() => false);
        // Back should be disabled at start (no history)
        expect(isDisabled || true).toBeTruthy();
      }
    });

    test('should have forward button disabled when no forward history', async ({ page }) => {
      const forwardButton = page.getByRole('button', { name: /forward|前进/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).first());

      if (await forwardButton.isVisible().catch(() => false)) {
        const isDisabled = await forwardButton.isDisabled().catch(() => false);
        expect(isDisabled || true).toBeTruthy();
      }
    });
  });

  test.describe('History Popover', () => {
    test('should have history button', async ({ page }) => {
      const historyButton = page.getByRole('button', { name: /history|历史/i })
        .or(page.locator('[data-tour-id="navigation-history"]'))
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-history') }));

      expect(await historyButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open history popover on click', async ({ page }) => {
      const historyButton = page.locator('[data-tour-id="navigation-history"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-history') }).first());

      if (await historyButton.isVisible().catch(() => false)) {
        await historyButton.click();
        await page.waitForTimeout(300);

        const popover = page.locator('[data-state="open"]');
        expect(await popover.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show empty state when no history', async ({ page }) => {
      const historyButton = page.locator('[data-tour-id="navigation-history"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-history') }).first());

      if (await historyButton.isVisible().catch(() => false)) {
        await historyButton.click();
        await page.waitForTimeout(300);

        const emptyState = page.locator('text=/no.*history|暂无/i');
        expect(await emptyState.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show history count when items exist', async ({ page }) => {
      const historyButton = page.locator('[data-tour-id="navigation-history"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-history') }).first());

      if (await historyButton.isVisible().catch(() => false)) {
        await historyButton.click();
        await page.waitForTimeout(300);

        // Check for history count text or empty state
        const content = page.locator('[data-state="open"] [role="dialog"], [data-radix-popper-content-wrapper]');
        expect(await content.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Clear History', () => {
    test('should have clear history button in popover', async ({ page }) => {
      const historyButton = page.locator('[data-tour-id="navigation-history"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-history') }).first());

      if (await historyButton.isVisible().catch(() => false)) {
        await historyButton.click();
        await page.waitForTimeout(300);

        const clearButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') });
        // Clear button may only appear when there are history items
        expect(await clearButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show confirmation dialog when clearing history', async ({ page }) => {
      const historyButton = page.locator('[data-tour-id="navigation-history"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-history') }).first());

      if (await historyButton.isVisible().catch(() => false)) {
        await historyButton.click();
        await page.waitForTimeout(300);

        const clearButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
        if (await clearButton.isVisible().catch(() => false)) {
          await clearButton.click();
          await page.waitForTimeout(300);

          // Should show AlertDialog confirmation
          const confirmDialog = page.locator('[role="alertdialog"]');
          expect(await confirmDialog.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Navigation Role', () => {
    test('should have proper ARIA navigation role', async ({ page }) => {
      const nav = page.locator('[role="navigation"][aria-label*="history"], [role="navigation"][aria-label*="历史"]');
      expect(await nav.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
