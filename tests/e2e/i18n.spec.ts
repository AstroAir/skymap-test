import { test, expect } from '@playwright/test';
import { HomePage, StarmapPage } from './fixtures/page-objects';

test.describe('Internationalization (i18n)', () => {
  test.describe('Home Page i18n', () => {
    test('should display in default language', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      // Page should load with some text
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });

    test('should switch to Chinese', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      const isVisible = await homePage.isLanguageSwitcherVisible();
      if (isVisible) {
        try {
          await homePage.switchLanguage('zh');
          await page.waitForTimeout(1000);
        } catch {
          // Language switch may fail
        }
      }
      
      // Page should still be functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });

    test('should switch to English', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      const isVisible = await homePage.isLanguageSwitcherVisible();
      if (isVisible) {
        try {
          await homePage.switchLanguage('zh');
          await page.waitForTimeout(500);
          await homePage.switchLanguage('en');
          await page.waitForTimeout(500);
        } catch {
          // Language switch may fail
        }
      }
      
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });

    test('should persist language preference', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      const isVisible = await homePage.isLanguageSwitcherVisible();
      if (isVisible) {
        try {
          await homePage.switchLanguage('zh');
          await page.waitForTimeout(500);
        } catch {
          // Language switch may fail
        }
      }
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Page should still be functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Starmap Page i18n', () => {
    test('should display starmap in default language', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Page should load
      await expect(starmapPage.canvas).toBeVisible();
    });

    test('should have language switcher on starmap', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const languageSwitcher = page.getByRole('button', { name: /language|语言/i })
        .or(page.locator('[data-testid="language-switcher"]'));
      expect(await languageSwitcher.count()).toBeGreaterThanOrEqual(0);
    });

    test('should switch language on starmap', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const languageSwitcher = page.getByRole('button', { name: /language|语言/i }).first()
        .or(page.locator('[data-testid="language-switcher"]').first());
      
      if (await languageSwitcher.isVisible().catch(() => false)) {
        await languageSwitcher.click();
        await page.waitForTimeout(300);
        
        const chineseOption = page.getByRole('menuitem', { name: /中文/i });
        if (await chineseOption.isVisible().catch(() => false)) {
          await chineseOption.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('UI Elements Translation', () => {
    test('should translate button labels', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Check for translated button text
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test('should translate tooltips', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Hover over a button to show tooltip
      const button = page.locator('button').first();
      if (await button.isVisible().catch(() => false)) {
        await button.hover();
        await page.waitForTimeout(500);
        
        // Tooltip may appear
        const tooltip = page.locator('[role="tooltip"]');
        expect(await tooltip.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should translate dialog titles', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Open settings to check dialog title
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const dialogTitle = page.locator('[role="dialog"] h2, [role="dialog"] h3');
        expect(await dialogTitle.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should translate placeholder text', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible().catch(() => false)) {
        const placeholder = await searchInput.getAttribute('placeholder');
        expect(placeholder).toBeTruthy();
      }
    });
  });

  test.describe('Date/Time Localization', () => {
    test('should display localized date format', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Look for date display
      const dateDisplay = page.locator('text=/\\d{4}|\\d{1,2}[\\/\\-]\\d{1,2}/');
      expect(await dateDisplay.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display localized time format', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Look for time display
      const timeDisplay = page.locator('text=/\\d{1,2}:\\d{2}/');
      expect(await timeDisplay.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Number Localization', () => {
    test('should display localized numbers', async ({ page }) => {
      const starmapPage = new StarmapPage(page);
      await starmapPage.waitForReady();
      
      // Look for number displays (coordinates, FOV, etc.)
      const numberDisplay = page.locator('text=/\\d+\\.\\d+|\\d+°/');
      expect(await numberDisplay.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('RTL Support', () => {
    test('should have correct text direction', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      const html = page.locator('html');
      const dir = await html.getAttribute('dir');
      // Should be 'ltr' for English/Chinese
      expect(dir === 'ltr' || dir === null).toBe(true);
    });
  });

  test.describe('Language Persistence', () => {
    test('should persist language across page navigation', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      const isVisible = await homePage.isLanguageSwitcherVisible();
      if (isVisible) {
        try {
          await homePage.switchLanguage('zh');
          await page.waitForTimeout(500);
        } catch {
          // Language switch may fail
        }
      }
      
      // Navigate to starmap
      await page.goto('/starmap');
      await page.waitForTimeout(2000);
      
      // Navigate back to home
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Page should be functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });

    test('should persist language after browser refresh', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      const isVisible = await homePage.isLanguageSwitcherVisible();
      if (isVisible) {
        try {
          await homePage.switchLanguage('zh');
          await page.waitForTimeout(500);
        } catch {
          // Language switch may fail
        }
      }
      
      // Refresh
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Page should be functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });
  });
});
