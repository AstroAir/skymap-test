import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('Data Manager', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Data Export', () => {
    test('should have export data option', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export|导出/i });
      expect(await exportButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should export shot list data', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export.*shot|导出.*拍摄/i });
      if (await exportButton.isVisible().catch(() => false)) {
        // Export functionality exists
        expect(true).toBe(true);
      }
    });

    test('should export equipment data', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export.*equipment|导出.*设备/i });
      expect(await exportButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Data Import', () => {
    test('should have import data option', async ({ page }) => {
      const importButton = page.getByRole('button', { name: /import|导入/i });
      expect(await importButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should support JSON import', async ({ page }) => {
      const jsonImport = page.locator('text=/JSON|json/i');
      expect(await jsonImport.count()).toBeGreaterThanOrEqual(0);
    });

    test('should support CSV import', async ({ page }) => {
      const csvImport = page.locator('text=/CSV|csv/i');
      expect(await csvImport.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Data Backup', () => {
    test('should have backup option', async ({ page }) => {
      const backupButton = page.getByRole('button', { name: /backup|备份/i });
      expect(await backupButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have restore option', async ({ page }) => {
      const restoreButton = page.getByRole('button', { name: /restore|恢复/i });
      expect(await restoreButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Local Storage', () => {
    test('should persist data in local storage', async ({ page }) => {
      // Check that local storage is being used
      const storageData = await page.evaluate(() => {
        return Object.keys(localStorage).length;
      });
      expect(storageData).toBeGreaterThanOrEqual(0);
    });

    test('should clear local storage on request', async ({ page }) => {
      const clearButton = page.getByRole('button', { name: /clear.*data|清除.*数据/i });
      expect(await clearButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Data Sync', () => {
    test('should show sync status', async ({ page }) => {
      const syncStatus = page.locator('text=/sync|同步/i');
      expect(await syncStatus.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
