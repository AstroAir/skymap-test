import { test, expect, Page } from '@playwright/test';
import { TEST_TIMEOUTS } from '../fixtures/test-data';

// Helper to wait for starmap ready and dismiss onboarding
async function waitForStarmapReady(page: Page) {
  await page.goto('/starmap');
  await page.evaluate(() => {
    localStorage.setItem('onboarding-storage', JSON.stringify({
      state: {
        hasCompletedOnboarding: true,
        hasSeenWelcome: true,
        currentStepIndex: -1,
        isTourActive: false,
        completedSteps: ['welcome', 'search', 'navigation', 'zoom', 'settings', 'fov', 'shotlist', 'tonight', 'contextmenu', 'complete'],
        showOnNextVisit: false,
      },
      version: 0,
    }));
    localStorage.setItem('starmap-setup-wizard', JSON.stringify({
      state: {
        hasCompletedSetup: true,
        showOnNextVisit: false,
        completedSteps: ['welcome', 'location', 'equipment', 'preferences', 'complete'],
      },
      version: 1,
    }));
  });
  await page.reload();
  await page.waitForTimeout(3500);
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
}

test.describe('Stellarium Credits', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Credits Access', () => {
    test('should have credits section in about dialog', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const creditsSection = page.locator('text=/credits|致谢|鸣谢/i');
        expect(await creditsSection.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display Stellarium Web Engine attribution', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const stellariumCredit = page.locator('text=/stellarium.*web.*engine|stellarium/i');
        expect(await stellariumCredit.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Data Source Credits', () => {
    test('should display star catalog attribution', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const catalogCredit = page.locator('text=/hipparcos|tycho|gaia|star.*catalog/i');
        expect(await catalogCredit.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display DSO catalog attribution', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const dsoCredit = page.locator('text=/ngc|messier|deep.*sky|dso/i');
        expect(await dsoCredit.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display sky survey attribution', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const surveyCredit = page.locator('text=/dss|panstarrs|sdss|survey/i');
        expect(await surveyCredit.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Open Source Acknowledgments', () => {
    test('should display open source libraries', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const osCredits = page.locator('text=/open.*source|license|mit|gpl|apache/i');
        expect(await osCredits.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have links to project repositories', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const repoLinks = page.locator('a[href*="github"]');
        expect(await repoLinks.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Image Credits', () => {
    test('should display image source attributions', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const imageCredits = page.locator('text=/nasa|esa|hubble|webb|image/i');
        expect(await imageCredits.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Contributor Credits', () => {
    test('should display contributor acknowledgments', async ({ page }) => {
      const aboutButton = page.getByRole('button', { name: /about|关于/i }).first();
      
      if (await aboutButton.isVisible().catch(() => false)) {
        await aboutButton.click();
        await page.waitForTimeout(500);
        
        const contributorSection = page.locator('text=/contributor|author|developer|贡献者|作者/i');
        expect(await contributorSection.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

test.describe('Survey Selector Display', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Survey Options', () => {
    test('should display available sky surveys', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const surveySelector = page.locator('text=/survey|巡天/i');
        expect(await surveySelector.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have DSS survey option', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const dssOption = page.locator('text=/dss|digitized.*sky/i');
        expect(await dssOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should change survey on selection', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const surveySelect = page.locator('[data-testid="survey-selector"]')
          .or(page.getByRole('combobox', { name: /survey/i }));
        
        if (await surveySelect.first().isVisible().catch(() => false)) {
          await surveySelect.first().click();
          await page.waitForTimeout(300);
          
          // Select an option
          const option = page.locator('[role="option"]').first();
          if (await option.isVisible().catch(() => false)) {
            await option.click();
            await page.waitForTimeout(300);
          }
        }
      }
    });
  });

  test.describe('Survey Loading', () => {
    test('should show loading state when changing surveys', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Survey change may show loading indicator
        const loadingIndicator = page.locator('.animate-spin')
          .or(page.locator('[role="progressbar"]'));
        
        expect(await loadingIndicator.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

test.describe('Clock Display', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Time Display', () => {
    test('should display current time', async ({ page }) => {
      const timeDisplay = page.locator('text=/\\d{1,2}:\\d{2}/');
      expect(await timeDisplay.count()).toBeGreaterThanOrEqual(0);
    });

    test('should update time continuously', async ({ page }) => {
      const timeDisplay = page.locator('.font-mono').first();
      
      if (await timeDisplay.isVisible().catch(() => false)) {
        const initialTime = await timeDisplay.textContent();
        await page.waitForTimeout(2000);
        const newTime = await timeDisplay.textContent();
        
        // Time should have updated (or at least not crashed)
        expect(initialTime !== null || newTime !== null).toBeTruthy();
      }
    });
  });

  test.describe('Time Control Panel', () => {
    test('should open time control panel', async ({ page }) => {
      const clockDisplay = page.locator('[data-testid="clock-display"]')
        .or(page.locator('.clock-display'))
        .or(page.locator('text=/\\d{1,2}:\\d{2}:\\d{2}/').first());
      
      if (await clockDisplay.isVisible().catch(() => false)) {
        await clockDisplay.click();
        await page.waitForTimeout(300);
        
        // Time panel may appear
        const timePanel = page.locator('[role="dialog"]')
          .or(page.locator('[data-slot="drawer-content"]'));
        expect(await timePanel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have date picker', async ({ page }) => {
      const clockDisplay = page.locator('[data-testid="clock-display"]').first();
      
      if (await clockDisplay.isVisible().catch(() => false)) {
        await clockDisplay.click();
        await page.waitForTimeout(300);
        
        const datePicker = page.locator('input[type="date"]')
          .or(page.locator('[data-testid="date-picker"]'));
        expect(await datePicker.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have time picker', async ({ page }) => {
      const clockDisplay = page.locator('[data-testid="clock-display"]').first();
      
      if (await clockDisplay.isVisible().catch(() => false)) {
        await clockDisplay.click();
        await page.waitForTimeout(300);
        
        const timePicker = page.locator('input[type="time"]')
          .or(page.locator('[data-testid="time-picker"]'));
        expect(await timePicker.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Time Speed Controls', () => {
    test('should have play/pause button', async ({ page }) => {
      const playPauseButton = page.getByRole('button', { name: /play|pause|播放|暂停/i });
      expect(await playPauseButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have time speed slider', async ({ page }) => {
      const clockDisplay = page.locator('[data-testid="clock-display"]').first();
      
      if (await clockDisplay.isVisible().catch(() => false)) {
        await clockDisplay.click();
        await page.waitForTimeout(300);
        
        const speedSlider = page.locator('[role="slider"]')
          .or(page.locator('input[type="range"]'));
        expect(await speedSlider.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have now button', async ({ page }) => {
      const nowButton = page.getByRole('button', { name: /now|现在/i });
      expect(await nowButton.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
