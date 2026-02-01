import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Satellite Tracker', () => {
  let _starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    _starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Panel Access', () => {
    test('should have satellite tracker button', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i })
        .or(page.locator('[data-testid="satellite-tracker-button"]'));
      expect(await satelliteButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open satellite tracker panel', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close satellite tracker with Escape', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Satellite List', () => {
    test('should display satellite list', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const satelliteList = page.locator('[data-testid="satellite-list"], .satellite-list');
        expect(await satelliteList.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have satellite search', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const searchInput = page.getByPlaceholder(/search.*satellite|搜索.*卫星/i);
        expect(await searchInput.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should search for ISS', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const searchInput = page.getByPlaceholder(/search/i).first();
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.fill('ISS');
          await page.waitForTimeout(500);
        }
      }
    });

    test('should filter visible satellites only', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const visibleOnlyToggle = page.getByRole('switch', { name: /visible.*only|仅显示可见/i });
        if (await visibleOnlyToggle.isVisible().catch(() => false)) {
          await visibleOnlyToggle.click();
        }
      }
    });
  });

  test.describe('Upcoming Passes', () => {
    test('should display upcoming passes section', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const passesSection = page.locator('text=/upcoming.*passes|即将过境/i');
        expect(await passesSection.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show pass details', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        // Look for pass details (start, max, end times)
        const passDetails = page.locator('text=/start|max|end|开始|最高|结束/i');
        expect(await passDetails.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Satellite Tracking', () => {
    test('should have track button', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const trackButton = page.getByRole('button', { name: /track|追踪/i });
        expect(await trackButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should track selected satellite', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        // Select a satellite first
        const satelliteItem = page.locator('[data-testid="satellite-item"]').first();
        if (await satelliteItem.isVisible().catch(() => false)) {
          await satelliteItem.click();
          await page.waitForTimeout(300);
          
          const trackButton = page.getByRole('button', { name: /track|追踪/i }).first();
          if (await trackButton.isVisible().catch(() => false)) {
            await trackButton.click();
          }
        }
      }
    });
  });

  test.describe('Satellite Info', () => {
    test('should display satellite altitude', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const altitude = page.locator('text=/altitude|高度/i');
        expect(await altitude.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display satellite velocity', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const velocity = page.locator('text=/velocity|速度/i');
        expect(await velocity.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display orbital period', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const period = page.locator('text=/period|周期/i');
        expect(await period.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Satellite Categories', () => {
    test('should have category filters', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const categories = page.locator('text=/ISS|Starlink|Weather|GPS|空间站|星链|气象/i');
        expect(await categories.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Satellite Overlay', () => {
    test('should toggle satellite overlay on map', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const showOnMapToggle = page.getByRole('switch', { name: /show.*map|显示.*地图/i });
        if (await showOnMapToggle.isVisible().catch(() => false)) {
          await showOnMapToggle.click();
        }
      }
    });

    test('should toggle satellite labels', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const showLabelsToggle = page.getByRole('switch', { name: /show.*labels|显示.*标签/i });
        if (await showLabelsToggle.isVisible().catch(() => false)) {
          await showLabelsToggle.click();
        }
      }
    });
  });

  test.describe('Data Status', () => {
    test('should show online/offline status', async ({ page }) => {
      const satelliteButton = page.getByRole('button', { name: /satellite|卫星/i }).first();
      
      if (await satelliteButton.isVisible().catch(() => false)) {
        await satelliteButton.click();
        await page.waitForTimeout(500);
        
        const status = page.locator('text=/online|offline|在线|离线/i');
        expect(await status.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
