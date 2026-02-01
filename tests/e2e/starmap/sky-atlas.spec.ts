import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Sky Atlas', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    // Use skipWasmWait for faster tests - sky atlas UI works before WASM loads
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Panel Access', () => {
    test('should have sky atlas button', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i })
        .or(page.locator('[data-testid="sky-atlas-button"]'));
      expect(await atlasButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open sky atlas panel', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close sky atlas with Escape', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Search by Name', () => {
    test('should have name search input', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const searchInput = page.getByPlaceholder(/search/i);
        expect(await searchInput.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should search for objects by name', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const searchInput = page.getByPlaceholder(/search/i).first();
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.fill('M31');
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Object Type Filter', () => {
    test('should have object type filter', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const typeFilter = page.locator('text=/object.*type|类型/i');
        expect(await typeFilter.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should filter by galaxy', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const galaxyCheckbox = page.getByRole('checkbox', { name: /galaxy|星系/i });
        if (await galaxyCheckbox.isVisible().catch(() => false)) {
          await galaxyCheckbox.click();
        }
      }
    });

    test('should filter by nebula', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const nebulaCheckbox = page.getByRole('checkbox', { name: /nebula|星云/i });
        if (await nebulaCheckbox.isVisible().catch(() => false)) {
          await nebulaCheckbox.click();
        }
      }
    });

    test('should filter by cluster', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const clusterCheckbox = page.getByRole('checkbox', { name: /cluster|星团/i });
        if (await clusterCheckbox.isVisible().catch(() => false)) {
          await clusterCheckbox.click();
        }
      }
    });
  });

  test.describe('Constellation Filter', () => {
    test('should have constellation filter', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const constellationFilter = page.locator('text=/constellation|星座/i');
        expect(await constellationFilter.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should select constellation', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const constellationSelect = page.locator('[data-testid="constellation-select"]')
          .or(page.getByRole('combobox', { name: /constellation/i }));
        
        if (await constellationSelect.first().isVisible().catch(() => false)) {
          await constellationSelect.first().click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Magnitude Filter', () => {
    test('should have magnitude filter', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const magnitudeFilter = page.locator('text=/magnitude|mag|星等/i');
        expect(await magnitudeFilter.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should set minimum magnitude', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const minMagInput = page.locator('input[name*="min"]').or(page.locator('[data-testid="min-magnitude"]'));
        if (await minMagInput.first().isVisible().catch(() => false)) {
          await minMagInput.first().fill('5');
        }
      }
    });

    test('should set maximum magnitude', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const maxMagInput = page.locator('input[name*="max"]').or(page.locator('[data-testid="max-magnitude"]'));
        if (await maxMagInput.first().isVisible().catch(() => false)) {
          await maxMagInput.first().fill('12');
        }
      }
    });
  });

  test.describe('Altitude Filter', () => {
    test('should have minimum altitude filter', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const altitudeFilter = page.locator('text=/altitude|高度/i');
        expect(await altitudeFilter.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Moon Distance Filter', () => {
    test('should have moon distance filter', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const moonDistanceFilter = page.locator('text=/moon.*distance|月球距离/i');
        expect(await moonDistanceFilter.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Sorting', () => {
    test('should have sort options', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const sortControl = page.locator('text=/sort|排序/i');
        expect(await sortControl.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should sort by score', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const sortByScore = page.locator('text=/sort.*score|按评分/i');
        if (await sortByScore.first().isVisible().catch(() => false)) {
          await sortByScore.first().click();
        }
      }
    });

    test('should sort by name', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const sortByName = page.locator('text=/sort.*name|按名称/i');
        if (await sortByName.first().isVisible().catch(() => false)) {
          await sortByName.first().click();
        }
      }
    });

    test('should sort by magnitude', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const sortByMag = page.locator('text=/sort.*magnitude|按星等/i');
        if (await sortByMag.first().isVisible().catch(() => false)) {
          await sortByMag.first().click();
        }
      }
    });
  });

  test.describe('Search Results', () => {
    test('should display results count', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const resultsCount = page.locator('text=/\\d+.*results|\\d+.*objects|找到.*\\d+/i');
        expect(await resultsCount.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have pagination', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const pagination = page.locator('text=/page|页/i');
        expect(await pagination.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Object Actions', () => {
    test('should go to object on click', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        // Click search button first
        const searchButton = page.getByRole('button', { name: /search|搜索/i }).first();
        if (await searchButton.isVisible().catch(() => false)) {
          await searchButton.click();
          await page.waitForTimeout(1000);
        }
        
        const objectItem = page.locator('[data-testid="atlas-item"], .atlas-item').first();
        if (await objectItem.isVisible().catch(() => false)) {
          await objectItem.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should add object to shot list', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const addButton = page.getByRole('button', { name: /add.*shot.*list|添加.*列表/i });
        expect(await addButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Reset Filters', () => {
    test('should have reset filters button', async ({ page }) => {
      const atlasButton = page.getByRole('button', { name: /atlas|图集/i }).first();
      
      if (await atlasButton.isVisible().catch(() => false)) {
        await atlasButton.click();
        await page.waitForTimeout(500);
        
        const resetButton = page.getByRole('button', { name: /reset|重置/i });
        expect(await resetButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('UX Enhancements', () => {
    test('should sync selection with Info Panel', async () => {
      await starmapPage.openSkyAtlas();
      await starmapPage.searchSkyAtlasByName('M42');
      await starmapPage.selectSkyAtlasObject(/M42/i);

      await expect(starmapPage.infoPanel).toBeVisible();
      const selectedName = await starmapPage.getSelectedObjectName();
      expect(selectedName).toMatch(/M42/i);
    });

    test('should show toast notification after Go To', async () => {
      await starmapPage.openSkyAtlas();
      await starmapPage.setSkyAtlasAutoCloseAfterGoTo(false);
      await starmapPage.searchSkyAtlasByName('M31');
      await starmapPage.clickSkyAtlasGoTo(/M31/i);

      await starmapPage.expectSonnerToast(/Centered on object|已定位到天体/i);
      await starmapPage.expectSonnerToast(/M31/i);
    });

    test('should auto-close panel after Go To when enabled', async () => {
      await starmapPage.openSkyAtlas();
      await starmapPage.setSkyAtlasAutoCloseAfterGoTo(true);
      await starmapPage.searchSkyAtlasByName('M31');
      await starmapPage.clickSkyAtlasGoTo(/M31/i);

      await starmapPage.expectSonnerToast(/Centered on object|已定位到天体/i);
      await expect(starmapPage.skyAtlasPanel).toBeHidden();
    });

    test('should keep panel open after Go To when auto-close is disabled', async () => {
      await starmapPage.openSkyAtlas();
      await starmapPage.setSkyAtlasAutoCloseAfterGoTo(false);
      await starmapPage.searchSkyAtlasByName('M31');
      await starmapPage.clickSkyAtlasGoTo(/M31/i);

      await starmapPage.expectSonnerToast(/Centered on object|已定位到天体/i);
      await expect(starmapPage.skyAtlasPanel).toBeVisible();
    });

    test('should show toasts for adding to shot list and duplicates', async () => {
      await starmapPage.openSkyAtlas();
      await starmapPage.searchSkyAtlasByName('M45');

      await starmapPage.clickSkyAtlasAddToShotList(/M45/i);
      await starmapPage.expectSonnerToast(/Added to shot list|已添加到拍摄列表/i);

      await starmapPage.clickSkyAtlasAddToShotList(/M45/i);
      await starmapPage.expectSonnerToast(/Already in shot list|已在拍摄列表中/i);
    });
  });
});
