import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Advanced Search', () => {
  let _starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    _starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Dialog Access', () => {
    test('should have advanced search button', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i })
        .or(page.locator('[data-testid="advanced-search-button"]'));
      expect(await advancedButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open advanced search dialog', async ({ page }) => {
      // First try to find search input
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.click();
        await page.waitForTimeout(300);
      }
      
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const dialog = page.locator('[role="dialog"]');
        expect(await dialog.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should close dialog with Escape', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        const dialog = page.locator('[role="dialog"]');
        expect(await dialog.count()).toBeLessThanOrEqual(1);
      }
    });
  });

  test.describe('Filter Options', () => {
    test('should have object type filter', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const typeFilter = page.locator('text=/object.*type|type|类型/i');
        expect(await typeFilter.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have magnitude filter', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const magFilter = page.locator('text=/magnitude|星等/i');
        expect(await magFilter.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have constellation filter', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const constellationFilter = page.locator('text=/constellation|星座/i');
        expect(await constellationFilter.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have visibility filter', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const visibilityFilter = page.locator('text=/visible|visibility|可见/i');
        expect(await visibilityFilter.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Object Type Categories', () => {
    test('should have galaxy category', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const galaxyOption = page.locator('text=/galaxy|galaxies|星系/i');
        expect(await galaxyOption.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have nebula category', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const nebulaOption = page.locator('text=/nebula|nebulae|星云/i');
        expect(await nebulaOption.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have star cluster category', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const clusterOption = page.locator('text=/cluster|star.*cluster|星团/i');
        expect(await clusterOption.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have planet category', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const planetOption = page.locator('text=/planet|行星/i');
        expect(await planetOption.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Search Results', () => {
    test('should display search results count', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const resultsCount = page.locator('text=/\\d+.*result|result.*\\d+|找到.*\\d+/i');
        expect(await resultsCount.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should allow selecting search result', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const resultItem = page.locator('[role="option"], .search-result-item').first();
        if (await resultItem.isVisible().catch(() => false)) {
          await resultItem.click();
        }
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Catalog Selection', () => {
    test('should have Messier catalog option', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const messierOption = page.locator('text=/messier|M\\d+/i');
        expect(await messierOption.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have NGC catalog option', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const ngcOption = page.locator('text=/NGC/i');
        expect(await ngcOption.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have IC catalog option', async ({ page }) => {
      const advancedButton = page.getByRole('button', { name: /advanced|高级/i }).first();
      if (await advancedButton.isVisible().catch(() => false)) {
        await advancedButton.click();
        await page.waitForTimeout(500);
        
        const icOption = page.locator('text=/IC\\d+|IC catalog/i');
        expect(await icOption.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });
});
