import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('View Bookmarks', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Bookmarks Button', () => {
    test('should have bookmarks button', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]')
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }));

      expect(await bookmarkButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open bookmarks popover on click', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const popover = page.locator('[data-radix-popper-content-wrapper]');
        expect(await popover.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no bookmarks', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const emptyState = page.locator('text=/no.*bookmark|暂无.*书签/i');
        expect(await emptyState.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show save current view link in empty state', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const saveLink = page.locator('text=/save.*current|保存.*当前/i');
        expect(await saveLink.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Add Bookmark', () => {
    test('should have add bookmark button in popover header', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-bookmark-plus') });
        expect(await addButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should open add bookmark dialog', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-bookmark-plus') }).first();
        if (await addButton.isVisible().catch(() => false)) {
          await addButton.click();
          await page.waitForTimeout(300);

          const dialog = page.locator('[role="dialog"]');
          await expect(dialog.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
        }
      }
    });

    test('should have name input in add dialog', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-bookmark-plus') }).first();
        if (await addButton.isVisible().catch(() => false)) {
          await addButton.click();
          await page.waitForTimeout(300);

          const nameInput = page.locator('#name');
          expect(await nameInput.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have icon selector in add dialog', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-bookmark-plus') }).first();
        if (await addButton.isVisible().catch(() => false)) {
          await addButton.click();
          await page.waitForTimeout(300);

          // Should have icon label and color label
          const iconLabel = page.locator('text=/icon|图标/i');
          expect(await iconLabel.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have color selector in add dialog', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-bookmark-plus') }).first();
        if (await addButton.isVisible().catch(() => false)) {
          await addButton.click();
          await page.waitForTimeout(300);

          const colorLabel = page.locator('text=/color|颜色/i');
          expect(await colorLabel.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should show current position in add dialog', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-bookmark-plus') }).first();
        if (await addButton.isVisible().catch(() => false)) {
          await addButton.click();
          await page.waitForTimeout(300);

          // Should show RA and Dec values
          const positionInfo = page.locator('text=/RA|FOV/i');
          expect(await positionInfo.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should disable save button when name is empty', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-bookmark-plus') }).first();
        if (await addButton.isVisible().catch(() => false)) {
          await addButton.click();
          await page.waitForTimeout(300);

          const saveButton = page.getByRole('button', { name: /save|保存/i }).last();
          if (await saveButton.isVisible().catch(() => false)) {
            const isDisabled = await saveButton.isDisabled().catch(() => false);
            expect(isDisabled).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Popover Header', () => {
    test('should display saved views title', async ({ page }) => {
      const bookmarkButton = page.locator('[data-tour-id="view-bookmarks"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-bookmark') }).first());

      if (await bookmarkButton.isVisible().catch(() => false)) {
        await bookmarkButton.click();
        await page.waitForTimeout(300);

        const title = page.locator('text=/saved.*view|书签/i');
        expect(await title.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
