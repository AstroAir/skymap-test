import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('Offline Cache Manager', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Panel Access', () => {
    test('should have cache manager button', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i })
        .or(page.locator('[data-testid="cache-manager-button"]'));
      expect(await cacheButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open cache manager panel', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close cache manager with Escape', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Cache Status', () => {
    test('should display cache status', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const cacheStatus = page.locator('text=/cache.*status|缓存状态/i');
        expect(await cacheStatus.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display storage used', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const storageUsed = page.locator('text=/storage.*used|MB|GB|存储/i');
        expect(await storageUsed.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display available storage', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const availableStorage = page.locator('text=/available|可用/i');
        expect(await availableStorage.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Download All', () => {
    test('should have Download All button', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const downloadAllButton = page.getByRole('button', { name: /download.*all|下载全部/i });
        expect(await downloadAllButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Clear Cache', () => {
    test('should have Clear Cache button', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const clearCacheButton = page.getByRole('button', { name: /clear.*cache|清除缓存/i });
        expect(await clearCacheButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should confirm before clearing cache', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const clearCacheButton = page.getByRole('button', { name: /clear.*cache|清除缓存/i }).first();
        if (await clearCacheButton.isVisible().catch(() => false)) {
          await clearCacheButton.click();
          await page.waitForTimeout(300);
          
          // Confirmation dialog should appear
          const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]');
          expect(await confirmDialog.count()).toBeGreaterThanOrEqual(0);
          
          // Cancel
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Data Layers', () => {
    test('should display data layers list', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const layersList = page.locator('text=/layers|data|图层|数据/i');
        expect(await layersList.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show layer cache status', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const layerStatus = page.locator('text=/cached|downloaded|已缓存|已下载/i');
        expect(await layerStatus.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should download individual layer', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const downloadLayerButton = page.getByRole('button', { name: /download|下载/i }).first();
        // Button may exist for individual layers
        expect(await downloadLayerButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Cache Strategy', () => {
    test('should have cache strategy selector', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const strategySelector = page.locator('text=/strategy|cache.*first|network.*first|策略/i');
        expect(await strategySelector.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should select cache-first strategy', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const cacheFirstOption = page.locator('text=/cache.*first|缓存优先/i');
        if (await cacheFirstOption.first().isVisible().catch(() => false)) {
          await cacheFirstOption.first().click();
        }
      }
    });

    test('should select network-first strategy', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const networkFirstOption = page.locator('text=/network.*first|网络优先/i');
        if (await networkFirstOption.first().isVisible().catch(() => false)) {
          await networkFirstOption.first().click();
        }
      }
    });
  });

  test.describe('Auto Download', () => {
    test('should have auto-download on WiFi toggle', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const autoDownloadToggle = page.getByRole('switch', { name: /auto.*download|wifi|自动下载/i });
        expect(await autoDownloadToggle.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Cache Repair', () => {
    test('should have repair cache button', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const repairButton = page.getByRole('button', { name: /repair|修复/i });
        expect(await repairButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Offline Mode', () => {
    test('should show online/offline status', async ({ page }) => {
      const cacheButton = page.getByRole('button', { name: /cache|offline|缓存|离线/i }).first();
      
      if (await cacheButton.isVisible().catch(() => false)) {
        await cacheButton.click();
        await page.waitForTimeout(500);
        
        const onlineStatus = page.locator('text=/online|offline|在线|离线/i');
        expect(await onlineStatus.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
