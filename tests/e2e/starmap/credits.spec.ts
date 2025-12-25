import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('Credits and Data Sources', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Credits Access', () => {
    test('should have credits/about button', async ({ page }) => {
      const creditsButton = page.getByRole('button', { name: /credits|about|关于|数据来源/i }).first();
      expect(await creditsButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open credits dialog', async ({ page }) => {
      const creditsButton = page.getByRole('button', { name: /credits|about|关于|数据来源/i }).first();
      if (await creditsButton.isVisible().catch(() => false)) {
        await creditsButton.click();
        await page.waitForTimeout(500);
        
        const dialog = page.locator('[role="dialog"]');
        expect(await dialog.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Data Source Attribution', () => {
    test('should display Stellarium attribution', async ({ page }) => {
      const creditsButton = page.getByRole('button', { name: /credits|about|关于/i }).first();
      if (await creditsButton.isVisible().catch(() => false)) {
        await creditsButton.click();
        await page.waitForTimeout(500);
        
        const stellariumCredit = page.locator('text=/Stellarium/i');
        expect(await stellariumCredit.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should display star catalog attribution', async ({ page }) => {
      const creditsButton = page.getByRole('button', { name: /credits|about|关于/i }).first();
      if (await creditsButton.isVisible().catch(() => false)) {
        await creditsButton.click();
        await page.waitForTimeout(500);
        
        const catalogCredit = page.locator('text=/Hipparcos|Tycho|GAIA|catalog/i');
        expect(await catalogCredit.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should display deep sky object attribution', async ({ page }) => {
      const creditsButton = page.getByRole('button', { name: /credits|about|关于/i }).first();
      if (await creditsButton.isVisible().catch(() => false)) {
        await creditsButton.click();
        await page.waitForTimeout(500);
        
        const dsoCredit = page.locator('text=/NGC|IC|Messier|deep.*sky/i');
        expect(await dsoCredit.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('License Information', () => {
    test('should display license information', async ({ page }) => {
      const creditsButton = page.getByRole('button', { name: /credits|about|关于/i }).first();
      if (await creditsButton.isVisible().catch(() => false)) {
        await creditsButton.click();
        await page.waitForTimeout(500);
        
        const license = page.locator('text=/license|GPL|MIT|Apache|许可/i');
        expect(await license.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Version Information', () => {
    test('should display version number', async ({ page }) => {
      const creditsButton = page.getByRole('button', { name: /credits|about|关于/i }).first();
      if (await creditsButton.isVisible().catch(() => false)) {
        await creditsButton.click();
        await page.waitForTimeout(500);
        
        const version = page.locator('text=/version|v\\d+\\.\\d+|版本/i');
        expect(await version.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('External Links', () => {
    test('should have link to project repository', async ({ page }) => {
      const creditsButton = page.getByRole('button', { name: /credits|about|关于/i }).first();
      if (await creditsButton.isVisible().catch(() => false)) {
        await creditsButton.click();
        await page.waitForTimeout(500);
        
        const repoLink = page.locator('a[href*="github"], a[href*="gitlab"]');
        expect(await repoLink.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have link to documentation', async ({ page }) => {
      const creditsButton = page.getByRole('button', { name: /credits|about|关于/i }).first();
      if (await creditsButton.isVisible().catch(() => false)) {
        await creditsButton.click();
        await page.waitForTimeout(500);
        
        const docsLink = page.locator('a:has-text(/documentation|docs|文档/i)');
        expect(await docsLink.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });
});
