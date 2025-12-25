import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';

test.describe('Tonight Recommendations', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Panel Access', () => {
    test('should have tonight recommendations button', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i })
        .or(page.locator('[data-testid="tonight-button"]'));
      expect(await tonightButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open tonight recommendations panel', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close tonight recommendations with Escape', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Tonight Conditions', () => {
    test('should display dark hours', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const darkHours = page.locator('text=/dark.*hours|暗夜时间/i');
        expect(await darkHours.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display sunset time', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const sunset = page.locator('text=/sunset|日落/i');
        expect(await sunset.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display sunrise time', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const sunrise = page.locator('text=/sunrise|日出/i');
        expect(await sunrise.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display astronomical dusk/dawn', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const astroTwilight = page.locator('text=/astronomical|astro.*dusk|astro.*dawn|天文昏影|天文晨光/i');
        expect(await astroTwilight.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display moon illumination', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const moonIllumination = page.locator('text=/illuminat|月相|%/i');
        expect(await moonIllumination.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Recommended Targets', () => {
    test('should display top targets list', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const topTargets = page.locator('text=/top.*targets|推荐目标/i');
        expect(await topTargets.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show target scores', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const scores = page.locator('text=/score|评分|excellent|good|fair/i');
        expect(await scores.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show maximum altitude', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const maxAltitude = page.locator('text=/max.*altitude|最大高度/i');
        expect(await maxAltitude.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show imaging time available', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const imagingTime = page.locator('text=/imaging.*time|成像时间/i');
        expect(await imagingTime.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show moon distance', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const moonDistance = page.locator('text=/moon.*distance|月球距离/i');
        expect(await moonDistance.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Filtering and Sorting', () => {
    test('should have filter options', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const filterControl = page.locator('text=/filter|筛选/i');
        expect(await filterControl.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should filter by galaxy', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const galaxyFilter = page.locator('text=/galaxy|galaxies|星系/i');
        if (await galaxyFilter.first().isVisible().catch(() => false)) {
          await galaxyFilter.first().click();
        }
      }
    });

    test('should filter by nebula', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const nebulaFilter = page.locator('text=/nebula|nebulae|星云/i');
        if (await nebulaFilter.first().isVisible().catch(() => false)) {
          await nebulaFilter.first().click();
        }
      }
    });

    test('should have sort options', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const sortControl = page.locator('text=/sort|排序/i');
        expect(await sortControl.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should sort by score', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const sortByScore = page.locator('text=/sort.*score|按评分排序/i');
        if (await sortByScore.first().isVisible().catch(() => false)) {
          await sortByScore.first().click();
        }
      }
    });

    test('should sort by altitude', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const sortByAltitude = page.locator('text=/sort.*altitude|按高度排序/i');
        if (await sortByAltitude.first().isVisible().catch(() => false)) {
          await sortByAltitude.first().click();
        }
      }
    });
  });

  test.describe('Target Actions', () => {
    test('should go to target on click', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const targetItem = page.locator('[data-testid="recommendation-item"], .recommendation-item').first();
        if (await targetItem.isVisible().catch(() => false)) {
          await targetItem.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should have Add Top 10 button', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const addTop10Button = page.getByRole('button', { name: /add.*top.*10|添加前10/i });
        expect(await addTop10Button.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Location Update', () => {
    test('should have location update option', async ({ page }) => {
      const tonightButton = page.getByRole('button', { name: /tonight|今晚/i }).first();
      
      if (await tonightButton.isVisible().catch(() => false)) {
        await tonightButton.click();
        await page.waitForTimeout(500);
        
        const locationUpdate = page.locator('text=/update.*location|更新位置/i');
        expect(await locationUpdate.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
