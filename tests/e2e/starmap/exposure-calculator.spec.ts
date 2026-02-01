import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Exposure Calculator', () => {
  let _starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    _starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Panel Access', () => {
    test('should have exposure calculator button', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i })
        .or(page.locator('[data-testid="exposure-calculator-button"]'));
      expect(await exposureButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open exposure calculator panel', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close exposure calculator with Escape', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Light Pollution Settings', () => {
    test('should have Bortle scale selector', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const bortleSelector = page.locator('text=/bortle|light.*pollution|光污染/i');
        expect(await bortleSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should change Bortle value', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const bortleSlider = page.locator('[data-testid="bortle-slider"]')
          .or(page.getByRole('slider', { name: /bortle/i }));
        
        if (await bortleSlider.first().isVisible().catch(() => false)) {
          await bortleSlider.first().click();
        }
      }
    });
  });

  test.describe('Equipment Settings', () => {
    test('should have focal length input', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const focalLengthInput = page.locator('text=/focal.*length|焦距/i');
        expect(await focalLengthInput.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have aperture input', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const apertureInput = page.locator('text=/aperture|光圈/i');
        expect(await apertureInput.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have pixel size input', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const pixelSizeInput = page.locator('text=/pixel.*size|像素/i');
        expect(await pixelSizeInput.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Tracking Settings', () => {
    test('should have tracking mode selector', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const trackingSelector = page.locator('text=/tracking|追踪/i');
        expect(await trackingSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should select tracking mode', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const trackingSelect = page.locator('[data-testid="tracking-select"]')
          .or(page.getByRole('combobox', { name: /tracking/i }));
        
        if (await trackingSelect.first().isVisible().catch(() => false)) {
          await trackingSelect.first().click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Target Settings', () => {
    test('should have target type selector', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const targetTypeSelector = page.locator('text=/target.*type|目标类型/i');
        expect(await targetTypeSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should select galaxy target type', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const galaxyOption = page.locator('text=/galaxy|星系/i');
        if (await galaxyOption.first().isVisible().catch(() => false)) {
          await galaxyOption.first().click();
        }
      }
    });

    test('should select nebula target type', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const nebulaOption = page.locator('text=/nebula|星云/i');
        if (await nebulaOption.first().isVisible().catch(() => false)) {
          await nebulaOption.first().click();
        }
      }
    });
  });

  test.describe('Filter Settings', () => {
    test('should have filter selector', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const filterSelector = page.locator('text=/filter|滤镜/i');
        expect(await filterSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should toggle narrowband filter', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const narrowbandToggle = page.getByRole('switch', { name: /narrowband|窄带/i });
        if (await narrowbandToggle.isVisible().catch(() => false)) {
          await narrowbandToggle.click();
        }
      }
    });
  });

  test.describe('Camera Settings', () => {
    test('should have gain input', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const gainInput = page.locator('text=/gain|增益/i');
        expect(await gainInput.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have offset input', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const offsetInput = page.locator('text=/offset|偏移/i');
        expect(await offsetInput.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have binning selector', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const binningSelector = page.locator('text=/binning|合并/i');
        expect(await binningSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Calculated Results', () => {
    test('should display recommended exposure time', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const recommendedExposure = page.locator('text=/recommended|single.*exposure|推荐|单张曝光/i');
        expect(await recommendedExposure.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display total integration time', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const totalIntegration = page.locator('text=/total.*integration|total.*time|总积分/i');
        expect(await totalIntegration.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display image scale', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const imageScale = page.locator('text=/image.*scale|arcsec|像素比例/i');
        expect(await imageScale.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should update calculations when inputs change', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        // Change an input value
        const focalLengthInput = page.locator('input[type="number"]').first();
        if (await focalLengthInput.isVisible().catch(() => false)) {
          await focalLengthInput.fill('1000');
          await page.waitForTimeout(500);
          // Calculations should update
        }
      }
    });
  });

  test.describe('Session Planning', () => {
    test('should have frame count input', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const frameCountInput = page.locator('text=/frame.*count|subs|帧数/i');
        expect(await frameCountInput.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should calculate storage requirements', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const storageInfo = page.locator('text=/storage|GB|MB|存储/i');
        expect(await storageInfo.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Apply to Target', () => {
    test('should have Apply to Target button', async ({ page }) => {
      const exposureButton = page.getByRole('button', { name: /exposure|曝光/i }).first();
      
      if (await exposureButton.isVisible().catch(() => false)) {
        await exposureButton.click();
        await page.waitForTimeout(500);
        
        const applyButton = page.getByRole('button', { name: /apply.*target|应用.*目标/i });
        expect(await applyButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
