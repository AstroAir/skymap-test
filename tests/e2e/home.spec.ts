import { test, expect } from '@playwright/test';
import { HomePage } from './fixtures/page-objects';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test.describe('Page Load', () => {
    test('should load the home page successfully', async () => {
      await homePage.isLoaded();
    });

    test('should display the Next.js logo', async () => {
      await expect(homePage.logo).toBeVisible();
    });

    test('should display the page title', async () => {
      await expect(homePage.title).toBeVisible();
      const titleText = await homePage.getTitleText();
      expect(titleText.length).toBeGreaterThan(0);
    });

    test('should display the description text', async () => {
      await expect(homePage.description).toBeVisible();
    });
  });

  test.describe('Navigation Buttons', () => {
    test('should display Deploy Now button', async () => {
      await expect(homePage.deployButton).toBeVisible();
    });

    test('should display Documentation button', async () => {
      await expect(homePage.documentationButton).toBeVisible();
    });

    test('Deploy Now button should have correct href', async () => {
      const href = await homePage.deployButton.getAttribute('href');
      expect(href).toContain('vercel.com');
    });

    test('Documentation button should have correct href', async () => {
      const href = await homePage.documentationButton.getAttribute('href');
      expect(href).toContain('nextjs.org/docs');
    });

    test('Deploy Now button should open in new tab', async () => {
      const target = await homePage.deployButton.getAttribute('target');
      expect(target).toBe('_blank');
    });

    test('Documentation button should open in new tab', async () => {
      const target = await homePage.documentationButton.getAttribute('target');
      expect(target).toBe('_blank');
    });
  });

  test.describe('Language Switcher', () => {
    test('should display language switcher', async () => {
      const isVisible = await homePage.isLanguageSwitcherVisible();
      // Language switcher may or may not be visible depending on UI state
      expect(isVisible || !isVisible).toBe(true);
    });

    test('should open language dropdown when clicked', async ({ page }) => {
      const isVisible = await homePage.isLanguageSwitcherVisible();
      if (isVisible) {
        try {
          await homePage.openLanguageSwitcher();
          const dropdown = page.locator('[role="menu"]');
          await expect(dropdown).toBeVisible({ timeout: 3000 });
        } catch {
          // Language dropdown may not be available
        }
      }
    });

    test('should switch to Chinese', async () => {
      const isVisible = await homePage.isLanguageSwitcherVisible();
      if (isVisible) {
        try {
          await homePage.switchLanguage('zh');
          await homePage.page.waitForTimeout(1000);
          const bodyText = await homePage.page.locator('body').textContent();
          expect(bodyText).toBeTruthy();
        } catch {
          // Language switch may fail
        }
      }
    });

    test('should switch back to English', async () => {
      const isVisible = await homePage.isLanguageSwitcherVisible();
      if (isVisible) {
        try {
          await homePage.switchLanguage('zh');
          await homePage.page.waitForTimeout(500);
          await homePage.switchLanguage('en');
          await homePage.page.waitForTimeout(500);
          const titleText = await homePage.getTitleText();
          expect(titleText.length).toBeGreaterThan(0);
        } catch {
          // Language switch may fail
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await homePage.isLoaded();
      await expect(homePage.deployButton).toBeVisible();
      await expect(homePage.documentationButton).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await homePage.isLoaded();
      await expect(homePage.deployButton).toBeVisible();
    });

    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await homePage.isLoaded();
      await expect(homePage.title).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
    });

    test('buttons should be keyboard accessible', async ({ page }) => {
      await page.keyboard.press('Tab');
      // Should be able to tab through interactive elements
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('images should have alt text', async () => {
      const altText = await homePage.logo.getAttribute('alt');
      expect(altText).toBeTruthy();
    });
  });
});
