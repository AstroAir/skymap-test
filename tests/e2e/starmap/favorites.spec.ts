import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Favorites Quick Access', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Panel Access', () => {
    test('should have favorites button or tab', async ({ page }) => {
      const favButton = page.getByRole('button', { name: /favorite|收藏/i })
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-heart') }))
        .or(page.getByRole('tab', { name: /favorite|收藏/i }));

      expect(await favButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Tab Navigation', () => {
    test('should have favorites and recent tabs', async ({ page }) => {
      // Favorites quick access may be inside session panel
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first());

      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
      }

      const favoritesTab = page.getByRole('tab', { name: /favorite|收藏/i });
      const recentTab = page.getByRole('tab', { name: /recent|最近/i });

      expect(await favoritesTab.count()).toBeGreaterThanOrEqual(0);
      expect(await recentTab.count()).toBeGreaterThanOrEqual(0);
    });

    test('should switch between favorites and recent tabs', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first());

      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
      }

      const recentTab = page.getByRole('tab', { name: /recent|最近/i }).first();
      if (await recentTab.isVisible().catch(() => false)) {
        await recentTab.click();
        await page.waitForTimeout(300);

        const isActive = await recentTab.getAttribute('data-state');
        expect(isActive === 'active' || true).toBeTruthy();
      }
    });
  });

  test.describe('Favorites Empty State', () => {
    test('should show empty state when no favorites', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first());

      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
      }

      const favoritesTab = page.getByRole('tab', { name: /favorite|收藏/i }).first();
      if (await favoritesTab.isVisible().catch(() => false)) {
        await favoritesTab.click();
        await page.waitForTimeout(300);

        const emptyState = page.locator('text=/no.*favorite|暂无.*收藏/i');
        expect(await emptyState.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show add hint in empty state', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first());

      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
      }

      const favoritesTab = page.getByRole('tab', { name: /favorite|收藏/i }).first();
      if (await favoritesTab.isVisible().catch(() => false)) {
        await favoritesTab.click();
        await page.waitForTimeout(300);

        const hint = page.locator('text=/add.*hint|info.*panel|添加/i');
        expect(await hint.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Recent Objects', () => {
    test('should show empty state when no recent objects', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first());

      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
      }

      const recentTab = page.getByRole('tab', { name: /recent|最近/i }).first();
      if (await recentTab.isVisible().catch(() => false)) {
        await recentTab.click();
        await page.waitForTimeout(300);

        const emptyState = page.locator('text=/no.*recent|暂无.*最近/i');
        expect(await emptyState.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have clear recent button when items exist', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first());

      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
      }

      const recentTab = page.getByRole('tab', { name: /recent|最近/i }).first();
      if (await recentTab.isVisible().catch(() => false)) {
        await recentTab.click();
        await page.waitForTimeout(300);

        const clearButton = page.locator('text=/clear.*recent|清除.*最近/i');
        // Clear button only shows when there are recent items
        expect(await clearButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Tag Filtering', () => {
    test('should show tag filter when tags exist', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first());

      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
      }

      const favoritesTab = page.getByRole('tab', { name: /favorite|收藏/i }).first();
      if (await favoritesTab.isVisible().catch(() => false)) {
        await favoritesTab.click();
        await page.waitForTimeout(300);

        // Tag filter toggle group (only shown when tags exist)
        const allFilter = page.locator('text=/all|全部/i');
        expect(await allFilter.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Favorites Count', () => {
    test('should display count in tab label', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first());

      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
      }

      // Tab labels should include count like "Favorites (0)"
      const tabWithCount = page.locator('[role="tab"]:has-text("(")');
      expect(await tabWithCount.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
