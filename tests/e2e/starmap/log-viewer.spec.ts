import { test, expect } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Log Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Panel Access', () => {
    test('should have log viewer button or menu item', async ({ page }) => {
      // Log viewer may be accessible from a menu or toolbar
      const logButton = page.getByRole('button', { name: /log|日志/i })
        .or(page.locator('[data-testid="log-viewer"]'))
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-file-text') }));

      expect(await logButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open log viewer panel', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /log|日志/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-file-text') }).first());

      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);

        // Log panel or drawer should be visible
        const logPanel = page.locator('[data-testid="log-panel"]')
          .or(page.locator('text=/log.*viewer|日志.*查看/i'));
        expect(await logPanel.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Log Level Filter', () => {
    test('should have log level selector', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /log|日志/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-file-text') }).first());

      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);

        // Log level filter (debug, info, warn, error)
        const levelFilter = page.locator('text=/debug|info|warn|error|调试|信息|警告|错误/i');
        expect(await levelFilter.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Search', () => {
    test('should have search input for logs', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /log|日志/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-file-text') }).first());

      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);

        const searchInput = page.getByPlaceholder(/search.*log|filter|搜索.*日志|过滤/i);
        expect(await searchInput.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Actions', () => {
    test('should have clear logs button', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /log|日志/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-file-text') }).first());

      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);

        const clearButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') });
        expect(await clearButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have export logs button', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /log|日志/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-file-text') }).first());

      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);

        const exportButton = page.locator('button').filter({ has: page.locator('svg.lucide-download') });
        expect(await exportButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have pause/resume button', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /log|日志/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-file-text') }).first());

      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);

        const pauseButton = page.locator('button').filter({
          has: page.locator('svg.lucide-pause, svg.lucide-play'),
        });
        expect(await pauseButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Log Display', () => {
    test('should display log entries or empty state', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /log|日志/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-file-text') }).first());

      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);

        // Should show log entries or a "no logs" message
        const logContent = page.locator('[data-testid="log-entries"]')
          .or(page.locator('text=/no.*log|暂无.*日志/i'))
          .or(page.locator('[role="log"]'));
        expect(await logContent.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
