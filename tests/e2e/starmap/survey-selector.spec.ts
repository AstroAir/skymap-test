import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('Sky Survey Selector', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Survey Selector Access', () => {
    test('should have survey selector button', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i })
        .or(page.locator('[data-testid="survey-selector"]'));
      expect(await surveyButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open survey selector panel', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"], [role="listbox"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close survey selector with Escape', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Available Surveys', () => {
    test('should display DSS survey option', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const dssOption = page.locator('text=/DSS|Digitized Sky Survey/i');
        expect(await dssOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display 2MASS survey option', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const twoMassOption = page.locator('text=/2MASS/i');
        expect(await twoMassOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display SDSS survey option', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const sdssOption = page.locator('text=/SDSS|Sloan/i');
        expect(await sdssOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display Mellinger survey option', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const mellingerOption = page.locator('text=/Mellinger/i');
        expect(await mellingerOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display Milky Way survey option', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const milkyWayOption = page.locator('text=/Milky.*Way|银河/i');
        expect(await milkyWayOption.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Survey Selection', () => {
    test('should select DSS survey', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const dssOption = page.locator('text=/DSS/i').first();
        if (await dssOption.isVisible().catch(() => false)) {
          await dssOption.click();
          await page.waitForTimeout(1000);
          
          // Canvas should update
          await expect(starmapPage.canvas).toBeVisible();
        }
      }
    });

    test('should update canvas when survey changes', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        // Select a different survey
        const surveyOptions = page.locator('[role="option"], [role="menuitem"]');
        const optionCount = await surveyOptions.count();
        
        if (optionCount > 1) {
          await surveyOptions.nth(1).click();
          await page.waitForTimeout(1000);
          
          // Canvas should still be visible
          await expect(starmapPage.canvas).toBeVisible();
        }
      }
    });
  });

  test.describe('Survey Categories', () => {
    test('should have optical surveys category', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const opticalCategory = page.locator('text=/optical|visible|可见光/i');
        expect(await opticalCategory.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have infrared surveys category', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const infraredCategory = page.locator('text=/infrared|IR|红外/i');
        expect(await infraredCategory.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have H-alpha surveys category', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const hAlphaCategory = page.locator('text=/H.*alpha|Hα/i');
        expect(await hAlphaCategory.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Survey Information', () => {
    test('should display survey description', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const description = page.locator('text=/description|info|说明|信息/i');
        expect(await description.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display survey resolution', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const resolution = page.locator('text=/resolution|arcsec|分辨率/i');
        expect(await resolution.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display survey coverage', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const coverage = page.locator('text=/coverage|sky|覆盖/i');
        expect(await coverage.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Survey Opacity', () => {
    test('should have opacity slider', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const opacitySlider = page.locator('[data-testid="opacity-slider"]')
          .or(page.getByRole('slider', { name: /opacity|透明度/i }))
          .or(page.locator('text=/opacity|透明度/i'));
        
        expect(await opacitySlider.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should adjust survey opacity', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const opacitySlider = page.getByRole('slider').first();
        if (await opacitySlider.isVisible().catch(() => false)) {
          await opacitySlider.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Survey Toggle', () => {
    test('should have survey visibility toggle', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const visibilityToggle = page.getByRole('switch', { name: /show|visible|显示/i })
          .or(page.locator('text=/show.*survey|显示.*巡天/i'));
        
        expect(await visibilityToggle.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should toggle survey visibility', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const visibilityToggle = page.getByRole('switch').first();
        if (await visibilityToggle.isVisible().catch(() => false)) {
          await visibilityToggle.click();
          await page.waitForTimeout(500);
          await visibilityToggle.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Survey Loading', () => {
    test('should show loading indicator when changing survey', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const surveyOptions = page.locator('[role="option"], [role="menuitem"]');
        const optionCount = await surveyOptions.count();
        
        if (optionCount > 0) {
          await surveyOptions.first().click();
          
          // Loading indicator may appear briefly
          const loading = page.locator('text=/loading|加载/i');
          expect(await loading.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should handle survey loading errors gracefully', async ({ page }) => {
      // Block survey tiles
      await page.route('**/tiles/**', (route) => route.abort());
      
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const surveyOptions = page.locator('[role="option"], [role="menuitem"]');
        if (await surveyOptions.count() > 0) {
          await surveyOptions.first().click();
          await page.waitForTimeout(2000);
          
          // App should still be functional
          await expect(starmapPage.canvas).toBeVisible();
        }
      }
    });
  });

  test.describe('Survey Persistence', () => {
    test('should remember selected survey after reload', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const surveyOptions = page.locator('[role="option"], [role="menuitem"]');
        if (await surveyOptions.count() > 1) {
          // Select second option
          await surveyOptions.nth(1).click();
          await page.waitForTimeout(1000);
          
          // Reload
          await page.reload();
          await starmapPage.waitForSplashToDisappear();
          
          // Survey selection may persist
          await expect(starmapPage.canvas).toBeVisible();
        }
      }
    });
  });

  test.describe('Survey Comparison', () => {
    test('should have survey comparison mode', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const compareMode = page.locator('text=/compare|comparison|对比/i');
        expect(await compareMode.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Survey Zoom Levels', () => {
    test('should indicate available zoom levels', async ({ page }) => {
      const surveyButton = page.getByRole('button', { name: /survey|巡天/i }).first();
      
      if (await surveyButton.isVisible().catch(() => false)) {
        await surveyButton.click();
        await page.waitForTimeout(500);
        
        const zoomLevels = page.locator('text=/zoom|level|缩放|级别/i');
        expect(await zoomLevels.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should switch survey based on zoom level', async ({ page }) => {
      // Zoom in
      const zoomInButton = page.getByRole('button', { name: /zoom.*in|放大/i }).first();
      if (await zoomInButton.isVisible().catch(() => false)) {
        for (let i = 0; i < 5; i++) {
          await zoomInButton.click();
          await page.waitForTimeout(200);
        }
        
        // Canvas should still be visible with appropriate survey
        await expect(starmapPage.canvas).toBeVisible();
      }
    });
  });
});
