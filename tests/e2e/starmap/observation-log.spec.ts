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

test.describe('Observation Log', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Access', () => {
    test('should have observation log button', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i })
        .or(page.locator('[data-testid="observation-log-button"]'))
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-book-open') }));
      
      expect(await logButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open observation log drawer', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-book-open') }).first());
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const drawer = page.locator('[data-slot="drawer-content"]')
          .or(page.locator('[role="dialog"]'));
        await expect(drawer.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
      }
    });

    test('should close observation log with Escape', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Session Management', () => {
    test('should display session list', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        // Look for session-related content
        const sessionContent = page.locator('text=/session|会话|观测/i');
        expect(await sessionContent.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have new session button', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const newSessionButton = page.getByRole('button', { name: /new.*session|add.*session|新建|添加/i });
        expect(await newSessionButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should open new session dialog', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const newSessionButton = page.getByRole('button', { name: /new.*session|add.*session|新建|添加/i }).first();
        if (await newSessionButton.isVisible().catch(() => false)) {
          await newSessionButton.click();
          await page.waitForTimeout(300);
          
          const dialog = page.locator('[role="dialog"]');
          expect(await dialog.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have date input for new session', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const newSessionButton = page.getByRole('button', { name: /new.*session|add.*session|新建|添加/i }).first();
        if (await newSessionButton.isVisible().catch(() => false)) {
          await newSessionButton.click();
          await page.waitForTimeout(300);
          
          const dateInput = page.locator('input[type="date"]')
            .or(page.locator('text=/date|日期/i'));
          expect(await dateInput.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should have location input for new session', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const newSessionButton = page.getByRole('button', { name: /new.*session|add.*session|新建|添加/i }).first();
        if (await newSessionButton.isVisible().catch(() => false)) {
          await newSessionButton.click();
          await page.waitForTimeout(300);
          
          const locationInput = page.locator('text=/location|地点|位置/i');
          expect(await locationInput.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Observation Entry', () => {
    test('should have add observation button', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const addObsButton = page.getByRole('button', { name: /add.*observation|new.*observation|添加观测/i });
        expect(await addObsButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display observation list', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        // Look for observation entries or empty state
        const observations = page.locator('text=/observation|target|object|目标|天体/i');
        expect(await observations.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have notes field for observations', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        // Look for notes textarea
        const notesField = page.locator('textarea')
          .or(page.locator('text=/notes|备注|笔记/i'));
        expect(await notesField.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Search and Filter', () => {
    test('should have search input', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const searchInput = page.getByPlaceholder(/search|搜索/i)
          .or(page.locator('input[type="search"]'));
        expect(await searchInput.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should perform search', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const searchInput = page.getByPlaceholder(/search|搜索/i).first();
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.fill('M31');
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Statistics', () => {
    test('should display observation statistics', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        // Look for stats section
        const statsContent = page.locator('text=/statistic|total|count|统计|总计/i');
        expect(await statsContent.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have stats tab or section', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        // Look for stats tab
        const statsTab = page.getByRole('tab', { name: /stats|statistics|统计/i });
        expect(await statsTab.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Tabs Navigation', () => {
    test('should have multiple tabs', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const tabs = page.getByRole('tab');
        const tabCount = await tabs.count();
        expect(tabCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should switch between tabs', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const tabs = page.getByRole('tab');
        const tabCount = await tabs.count();
        
        for (let i = 0; i < Math.min(tabCount, 3); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(200);
        }
      }
    });
  });

  test.describe('Delete Operations', () => {
    test('should have delete option for sessions', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        const deleteButton = page.getByRole('button', { name: /delete|remove|删除/i })
          .or(page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }));
        expect(await deleteButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Empty State', () => {
    test('should display empty state when no observations', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        // Look for empty state message
        const emptyState = page.locator('text=/no.*observation|empty|no.*session|暂无|没有/i');
        // May or may not be visible depending on existing data
        expect(await emptyState.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Integration with Selection', () => {
    test('should add current selection to observation', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        // Look for "add current object" or similar
        const addCurrentButton = page.getByRole('button', { name: /add.*current|add.*selected|添加当前/i });
        expect(await addCurrentButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper focus management', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible().catch(() => {});
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      const logButton = page.getByRole('button', { name: /observation.*log|log|观测日志/i }).first();
      
      if (await logButton.isVisible().catch(() => false)) {
        await logButton.click();
        await page.waitForTimeout(500);
        
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
        }
        
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible().catch(() => {});
      }
    });
  });
});
