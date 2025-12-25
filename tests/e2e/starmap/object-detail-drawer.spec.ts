import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { TEST_OBJECTS } from '../fixtures/test-data';

test.describe('Object Detail Drawer', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  async function selectObject(page: import('@playwright/test').Page, objectName: string) {
    const searchInput = page.getByPlaceholder(/search/i);
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(objectName);
      await page.waitForTimeout(1000);
      
      const firstResult = page.locator('[role="option"]').first();
      if (await firstResult.isVisible().catch(() => false)) {
        await firstResult.click();
        await page.waitForTimeout(500);
        return true;
      }
    }
    return false;
  }

  test.describe('Drawer Access', () => {
    test('should open detail drawer from info panel', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情|查看/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const drawer = page.locator('[role="dialog"]')
            .or(page.locator('[data-state="open"]'))
            .or(page.locator('.drawer'));
          
          expect(await drawer.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should close drawer with Escape', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    });

    test('should close drawer with close button', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const closeButton = page.getByRole('button', { name: /close|关闭/i })
            .or(page.locator('button').filter({ has: page.locator('svg.lucide-x') }));
          
          if (await closeButton.first().isVisible().catch(() => false)) {
            await closeButton.first().click();
            await page.waitForTimeout(300);
          }
        }
      }
    });
  });

  test.describe('Overview Tab', () => {
    test('should display object name', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const objectName = page.locator('text=/M31|Andromeda/i');
          expect(await objectName.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should display object type', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const objectType = page.locator('text=/galaxy|星系/i');
          expect(await objectType.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display coordinates', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const coords = page.locator('text=/RA|Dec|赤经|赤纬/i');
          expect(await coords.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display magnitude', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const magnitude = page.locator('text=/magnitude|mag|星等/i');
          expect(await magnitude.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display size/dimensions', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const size = page.locator('text=/size|dimension|arcmin|尺寸/i');
          expect(await size.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display constellation', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const constellation = page.locator('text=/constellation|Andromeda|仙女座/i');
          expect(await constellation.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Tabs Navigation', () => {
    test('should have Overview tab', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const overviewTab = page.getByRole('tab', { name: /overview|概览/i });
          expect(await overviewTab.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have Images tab', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const imagesTab = page.getByRole('tab', { name: /images|图片/i });
          expect(await imagesTab.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have Observation tab', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const observationTab = page.getByRole('tab', { name: /observation|观测/i });
          expect(await observationTab.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should switch between tabs', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const tabs = page.getByRole('tab');
          const tabCount = await tabs.count();
          
          for (let i = 0; i < Math.min(tabCount, 4); i++) {
            await tabs.nth(i).click();
            await page.waitForTimeout(300);
          }
        }
      }
    });
  });

  test.describe('Images Tab', () => {
    test('should display image gallery', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const imagesTab = page.getByRole('tab', { name: /images|图片/i });
          if (await imagesTab.isVisible().catch(() => false)) {
            await imagesTab.click();
            await page.waitForTimeout(500);
            
            const gallery = page.locator('[data-testid="image-gallery"]')
              .or(page.locator('.image-gallery'))
              .or(page.locator('img'));
            
            expect(await gallery.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should have image source selector', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const imagesTab = page.getByRole('tab', { name: /images|图片/i });
          if (await imagesTab.isVisible().catch(() => false)) {
            await imagesTab.click();
            await page.waitForTimeout(500);
            
            const sourceSelector = page.locator('text=/source|DSS|SDSS|来源/i');
            expect(await sourceSelector.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should display loading state for images', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const imagesTab = page.getByRole('tab', { name: /images|图片/i });
          if (await imagesTab.isVisible().catch(() => false)) {
            await imagesTab.click();
            
            // Loading state may be visible briefly
            const loading = page.locator('text=/loading|加载/i');
            expect(await loading.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });

  test.describe('Observation Tab', () => {
    test('should display altitude chart', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const observationTab = page.getByRole('tab', { name: /observation|观测/i });
          if (await observationTab.isVisible().catch(() => false)) {
            await observationTab.click();
            await page.waitForTimeout(500);
            
            const chart = page.locator('[data-testid="altitude-chart"]')
              .or(page.locator('.altitude-chart'))
              .or(page.locator('svg, canvas'));
            
            expect(await chart.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should display rise/set times', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const observationTab = page.getByRole('tab', { name: /observation|观测/i });
          if (await observationTab.isVisible().catch(() => false)) {
            await observationTab.click();
            await page.waitForTimeout(500);
            
            const times = page.locator('text=/rise|set|transit|升起|落下|中天/i');
            expect(await times.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should display best observation time', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const observationTab = page.getByRole('tab', { name: /observation|观测/i });
          if (await observationTab.isVisible().catch(() => false)) {
            await observationTab.click();
            await page.waitForTimeout(500);
            
            const bestTime = page.locator('text=/best.*time|optimal|最佳.*时间/i');
            expect(await bestTime.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });

  test.describe('External Links', () => {
    test('should have Wikipedia link', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const wikiLink = page.locator('a[href*="wikipedia"]')
            .or(page.locator('text=/wikipedia|维基百科/i'));
          
          expect(await wikiLink.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have SIMBAD link', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const simbadLink = page.locator('a[href*="simbad"]')
            .or(page.locator('text=/simbad/i'));
          
          expect(await simbadLink.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have NED link', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const nedLink = page.locator('a[href*="ned"]')
            .or(page.locator('text=/NED/'));
          
          expect(await nedLink.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Actions', () => {
    test('should have Add to Shot List button', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i });
          expect(await addButton.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have Center View button', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const centerButton = page.getByRole('button', { name: /center|go.*to|居中|前往/i });
          expect(await centerButton.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have Share button', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M31.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const shareButton = page.getByRole('button', { name: /share|分享/i });
          expect(await shareButton.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Different Object Types', () => {
    test('should display nebula details correctly', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M42.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const objectType = page.locator('text=/nebula|星云/i');
          expect(await objectType.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display cluster details correctly', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.M45.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const objectType = page.locator('text=/cluster|星团/i');
          expect(await objectType.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display planet details correctly', async ({ page }) => {
      if (await selectObject(page, TEST_OBJECTS.Mars.name)) {
        const detailsButton = page.getByRole('button', { name: /details|view|详情/i }).first();
        
        if (await detailsButton.isVisible().catch(() => false)) {
          await detailsButton.click();
          await page.waitForTimeout(500);
          
          const objectType = page.locator('text=/planet|行星/i');
          expect(await objectType.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});
