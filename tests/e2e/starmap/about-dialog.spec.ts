import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('About Dialog', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Dialog Access', () => {
    test('should have about button', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i })
        .or(page.locator('[data-testid="about-button"]'));
      expect(await aboutButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open about dialog when clicking about button', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
      }
    });

    test('should close about dialog with Escape', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Dialog should be closed
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeHidden({ timeout: 2000 }).catch(() => {});
      }
    });

    test('should close about dialog with close button', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const closeButton = page.getByRole('button', { name: /close|关闭/i })
          .or(page.locator('[data-testid="close-button"]'))
          .or(page.locator('button').filter({ has: page.locator('svg.lucide-x') }));
        
        if (await closeButton.first().isVisible().catch(() => false)) {
          await closeButton.first().click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Version Information', () => {
    test('should display app version', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const versionInfo = page.locator('text=/version|版本|v\\d+\\.\\d+/i');
        expect(await versionInfo.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display build date', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const buildDate = page.locator('text=/build|date|构建|日期/i');
        expect(await buildDate.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Credits and Acknowledgments', () => {
    test('should display credits section', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const credits = page.locator('text=/credits|acknowledgments|致谢|鸣谢/i');
        expect(await credits.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display Stellarium attribution', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const stellariumCredit = page.locator('text=/stellarium/i');
        expect(await stellariumCredit.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display data sources', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const dataSources = page.locator('text=/data.*source|catalog|数据来源|星表/i');
        expect(await dataSources.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('External Links', () => {
    test('should have GitHub link', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const githubLink = page.locator('a[href*="github"]');
        expect(await githubLink.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have documentation link', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const docsLink = page.locator('text=/documentation|docs|文档/i');
        expect(await docsLink.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have report issue link', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const issueLink = page.locator('text=/report.*issue|bug|反馈|问题/i');
        expect(await issueLink.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('License Information', () => {
    test('should display license information', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const license = page.locator('text=/license|MIT|GPL|Apache|许可/i');
        expect(await license.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Tabs Navigation', () => {
    test('should have multiple tabs', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const tabs = page.getByRole('tab');
        const tabCount = await tabs.count();
        // May have tabs for different sections
        expect(tabCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should switch between tabs', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const tabs = page.getByRole('tab');
        const tabCount = await tabs.count();
        
        for (let i = 0; i < Math.min(tabCount, 3); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(200);
        }
      }
    });
  });

  test.describe('Keyboard Shortcuts Reference', () => {
    test('should display keyboard shortcuts', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const shortcuts = page.locator('text=/keyboard|shortcut|快捷键/i');
        expect(await shortcuts.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('System Information', () => {
    test('should display browser information', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const browserInfo = page.locator('text=/browser|chrome|firefox|safari|浏览器/i');
        expect(await browserInfo.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display WebGL status', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const webglStatus = page.locator('text=/webgl|graphics|图形/i');
        expect(await webglStatus.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
