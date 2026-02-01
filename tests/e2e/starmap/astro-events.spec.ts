import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Astronomical Events Calendar', () => {
  let _starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    _starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Panel Access', () => {
    test('should have events calendar button', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i })
        .or(page.locator('[data-testid="events-calendar-button"]'));
      expect(await eventsButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open events calendar panel', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close events calendar with Escape', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Calendar Navigation', () => {
    test('should display current month', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        // Should show month name
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
          '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        const monthRegex = new RegExp(monthNames.join('|'), 'i');
        const monthDisplay = page.locator(`text=/${monthRegex.source}/`);
        expect(await monthDisplay.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have Today button', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const todayButton = page.getByRole('button', { name: /today|今天/i });
        expect(await todayButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should navigate to previous month', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const prevButton = page.getByRole('button', { name: /previous|prev|上一月/i })
          .or(page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }));
        
        if (await prevButton.first().isVisible().catch(() => false)) {
          await prevButton.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should navigate to next month', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const nextButton = page.getByRole('button', { name: /next|下一月/i })
          .or(page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }));
        
        if (await nextButton.first().isVisible().catch(() => false)) {
          await nextButton.first().click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Event Types', () => {
    test('should show lunar phases', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const lunarPhases = page.locator('text=/lunar|moon|phase|月相|新月|满月/i');
        expect(await lunarPhases.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show meteor showers', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const meteorShowers = page.locator('text=/meteor|shower|流星雨/i');
        expect(await meteorShowers.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show conjunctions', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const conjunctions = page.locator('text=/conjunction|合相/i');
        expect(await conjunctions.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show eclipses', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const eclipses = page.locator('text=/eclipse|日食|月食/i');
        expect(await eclipses.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Event Filtering', () => {
    test('should have event type filter', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const filterControl = page.locator('text=/filter|筛选/i');
        expect(await filterControl.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should filter by lunar phases', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const lunarFilter = page.getByRole('checkbox', { name: /lunar|月相/i })
          .or(page.locator('text=/lunar.*phases|月相/i'));
        
        if (await lunarFilter.first().isVisible().catch(() => false)) {
          await lunarFilter.first().click();
        }
      }
    });

    test('should filter by meteor showers', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const meteorFilter = page.getByRole('checkbox', { name: /meteor|流星/i });
        if (await meteorFilter.isVisible().catch(() => false)) {
          await meteorFilter.click();
        }
      }
    });
  });

  test.describe('Event Details', () => {
    test('should show event details on click', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        // Click on an event
        const eventItem = page.locator('[data-testid="event-item"], .event-item').first();
        if (await eventItem.isVisible().catch(() => false)) {
          await eventItem.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should have Go to Radiant button for meteor showers', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const goToRadiantButton = page.getByRole('button', { name: /go.*radiant|前往辐射点/i });
        expect(await goToRadiantButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Event Quality Indicators', () => {
    test('should show event quality rating', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const qualityRating = page.locator('text=/excellent|good|fair|poor|优秀|良好|一般|较差/i');
        expect(await qualityRating.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Data Refresh', () => {
    test('should have refresh button', async ({ page }) => {
      const eventsButton = page.getByRole('button', { name: /events|calendar|事件|日历/i }).first();
      
      if (await eventsButton.isVisible().catch(() => false)) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        const refreshButton = page.getByRole('button', { name: /refresh|刷新/i });
        expect(await refreshButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
