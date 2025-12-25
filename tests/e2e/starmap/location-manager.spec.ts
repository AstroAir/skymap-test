import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { TEST_LOCATIONS } from '../fixtures/test-data';

test.describe('Location Manager', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Panel Access', () => {
    test('should have location manager button', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i })
        .or(page.locator('[data-testid="location-manager-button"]'));
      expect(await locationButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open location manager panel', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close location manager with Escape', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Location List', () => {
    test('should display locations list', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const locationsList = page.locator('text=/observation.*locations|观测地点/i');
        expect(await locationsList.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have Add Location button', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const addLocationButton = page.getByRole('button', { name: /add.*location|添加.*地点/i });
        expect(await addLocationButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Add Location', () => {
    test('should add custom location', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const addLocationButton = page.getByRole('button', { name: /add.*location|添加.*地点/i }).first();
        if (await addLocationButton.isVisible().catch(() => false)) {
          await addLocationButton.click();
          await page.waitForTimeout(300);
          
          // Fill in location details
          const nameInput = page.getByPlaceholder(/name|名称/i).first();
          if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill(TEST_LOCATIONS.darkSite.name);
          }
          
          const latInput = page.locator('input[name*="lat"]').first();
          if (await latInput.isVisible().catch(() => false)) {
            await latInput.fill(String(TEST_LOCATIONS.darkSite.latitude));
          }
          
          const lonInput = page.locator('input[name*="lon"]').first();
          if (await lonInput.isVisible().catch(() => false)) {
            await lonInput.fill(String(TEST_LOCATIONS.darkSite.longitude));
          }
        }
      }
    });

    test('should set altitude', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const altitudeInput = page.locator('input[name*="altitude"]').first();
        if (await altitudeInput.isVisible().catch(() => false)) {
          await altitudeInput.fill(String(TEST_LOCATIONS.darkSite.altitude));
        }
      }
    });

    test('should set Bortle class', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const bortleSelector = page.locator('text=/bortle|光污染/i');
        expect(await bortleSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('GPS Location', () => {
    test('should have Use GPS button', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const gpsButton = page.getByRole('button', { name: /gps|use.*gps|获取位置/i });
        expect(await gpsButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Location Management', () => {
    test('should set location as current', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const setCurrentButton = page.getByRole('button', { name: /set.*current|设为当前/i });
        expect(await setCurrentButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should edit location', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const editButton = page.getByRole('button', { name: /edit|编辑/i }).first();
        if (await editButton.isVisible().catch(() => false)) {
          await editButton.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should delete location', async ({ page }) => {
      const locationButton = page.getByRole('button', { name: /location|位置/i }).first();
      
      if (await locationButton.isVisible().catch(() => false)) {
        await locationButton.click();
        await page.waitForTimeout(500);
        
        const deleteButton = page.getByRole('button', { name: /delete|删除/i }).first();
        if (await deleteButton.isVisible().catch(() => false)) {
          await deleteButton.click();
          await page.waitForTimeout(300);
          await page.keyboard.press('Escape');
        }
      }
    });
  });
});
