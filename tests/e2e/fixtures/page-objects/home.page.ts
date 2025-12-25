import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Home Page Object
 */
export class HomePage extends BasePage {
  // Locators
  readonly logo: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly deployButton: Locator;
  readonly documentationButton: Locator;
  readonly languageSwitcher: Locator;
  readonly languageDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.locator('img[alt="Next.js logo"]');
    this.title = page.locator('h1');
    this.description = page.locator('main p');
    this.deployButton = page.getByRole('link', { name: /deploy now/i });
    this.documentationButton = page.getByRole('link', { name: /documentation/i });
    this.languageSwitcher = page.locator('[data-testid="language-switcher"]').or(page.getByRole('button', { name: /language|语言/i }));
    this.languageDropdown = page.locator('[role="menu"]');
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await super.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Check if page is loaded
   */
  async isLoaded() {
    await expect(this.logo).toBeVisible();
    await expect(this.title).toBeVisible();
  }

  /**
   * Get page title text
   */
  async getTitleText(): Promise<string> {
    return await this.getText(this.title);
  }

  /**
   * Get description text
   */
  async getDescriptionText(): Promise<string> {
    return await this.getText(this.description);
  }

  /**
   * Click deploy button
   */
  async clickDeployButton() {
    await this.deployButton.click();
  }

  /**
   * Click documentation button
   */
  async clickDocumentationButton() {
    await this.documentationButton.click();
  }

  /**
   * Open language switcher
   */
  async openLanguageSwitcher() {
    await this.languageSwitcher.click();
    await expect(this.languageDropdown).toBeVisible();
  }

  /**
   * Switch language
   */
  async switchLanguage(locale: 'en' | 'zh') {
    await this.openLanguageSwitcher();
    const langOption = this.page.getByRole('menuitem', { 
      name: locale === 'en' ? /english/i : /中文/i 
    });
    await langOption.click();
    await this.page.waitForTimeout(500); // Wait for locale change
  }

  /**
   * Check if language switcher is visible
   */
  async isLanguageSwitcherVisible(): Promise<boolean> {
    return await this.exists(this.languageSwitcher);
  }

  /**
   * Navigate to starmap page
   */
  async goToStarmap() {
    await this.page.goto('/starmap');
  }
}
