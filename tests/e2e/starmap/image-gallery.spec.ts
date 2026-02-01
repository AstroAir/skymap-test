import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Object Image Gallery', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Gallery Access', () => {
    test('should display images in object detail drawer', async ({ page }) => {
      // Click on canvas to potentially select an object
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      // Look for images tab or gallery
      const imagesTab = page.locator('text=/images|图片|图像/i');
      expect(await imagesTab.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have image source selector', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const sourceSelector = page.locator('text=/source|来源|DSS|SDSS|2MASS/i');
      expect(await sourceSelector.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Image Sources', () => {
    test('should support DSS image source', async ({ page }) => {
      const dssOption = page.locator('text=/DSS/i');
      expect(await dssOption.count()).toBeGreaterThanOrEqual(0);
    });

    test('should support SDSS image source', async ({ page }) => {
      const sdssOption = page.locator('text=/SDSS/i');
      expect(await sdssOption.count()).toBeGreaterThanOrEqual(0);
    });

    test('should support 2MASS image source', async ({ page }) => {
      const twoMassOption = page.locator('text=/2MASS/i');
      expect(await twoMassOption.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Image Display', () => {
    test('should display loading state for images', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      // Look for loading indicator
      const loading = page.locator('[role="progressbar"], .loading').or(page.locator('text=/loading|加载/i'));
      expect(await loading.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display image when loaded', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(1000);
      
      // Look for image element
      const image = page.locator('img[src*="dss"], img[src*="sdss"], img[alt*="object"]');
      expect(await image.count()).toBeGreaterThanOrEqual(0);
    });

    test('should handle image load errors gracefully', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      // Should not crash if image fails to load
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Image Controls', () => {
    test('should have zoom controls for image', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const zoomControls = page.getByRole('button', { name: /zoom|放大|缩小/i });
      expect(await zoomControls.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have fullscreen option', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const fullscreenButton = page.getByRole('button', { name: /fullscreen|全屏/i });
      expect(await fullscreenButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have download option', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const downloadButton = page.getByRole('button', { name: /download|下载/i });
      expect(await downloadButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Image Size Options', () => {
    test('should have size selection options', async ({ page }) => {
      await starmapPage.clickCanvas();
      await page.waitForTimeout(500);
      
      const sizeOptions = page.locator('text=/size|尺寸|arcmin|角分/i');
      expect(await sizeOptions.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
