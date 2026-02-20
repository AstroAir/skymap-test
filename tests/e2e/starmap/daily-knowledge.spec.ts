import { test, expect, type Page } from '@playwright/test';
import { TEST_TIMEOUTS } from '../fixtures/test-data';

type DailyKnowledgeSeedOptions = {
  enabled: boolean;
  autoShow: boolean;
  onlineEnhancement?: boolean;
  lastShownDate?: string | null;
  snoozedDate?: string | null;
};

async function seedStarmapState(page: Page, options: DailyKnowledgeSeedOptions) {
  await page.addInitScript((seed: DailyKnowledgeSeedOptions) => {
    localStorage.setItem('starmap-onboarding', JSON.stringify({
      state: {
        hasCompletedOnboarding: true,
        hasCompletedSetup: true,
        completedSteps: ['welcome', 'search', 'navigation', 'zoom', 'settings', 'fov', 'shotlist', 'tonight', 'contextmenu', 'complete'],
        setupCompletedSteps: ['welcome', 'location', 'equipment', 'preferences', 'complete'],
        showOnNextVisit: false,
        isSetupOpen: false,
        isTourActive: false,
        phase: 'idle',
      },
      version: 3,
    }));

    localStorage.setItem('starmap-settings', JSON.stringify({
      state: {
        preferences: {
          showSplash: false,
          dailyKnowledgeEnabled: seed.enabled,
          dailyKnowledgeAutoShow: seed.autoShow,
          dailyKnowledgeOnlineEnhancement: seed.onlineEnhancement ?? false,
        },
      },
      version: 13,
    }));

    localStorage.setItem('starmap-daily-knowledge', JSON.stringify({
      state: {
        favorites: [],
        history: [],
        lastShownDate: seed.lastShownDate ?? null,
        snoozedDate: seed.snoozedDate ?? null,
        lastSeenItemId: null,
      },
      version: 1,
    }));
  }, options);
}

async function openReadyStarmap(page: Page) {
  await page.goto('/starmap', {
    waitUntil: 'domcontentloaded',
    timeout: TEST_TIMEOUTS.wasmInit,
  });
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: TEST_TIMEOUTS.long });
  await page.waitForTimeout(1200);
}

test.describe('Daily Knowledge', () => {
  test('auto shows only once per day', async ({ page }) => {
    await seedStarmapState(page, { enabled: true, autoShow: true, onlineEnhancement: false });
    await openReadyStarmap(page);

    const dialog = page.locator('[role="dialog"]').filter({ hasText: /daily knowledge|每日知识/i });
    await expect(dialog).toBeVisible({ timeout: TEST_TIMEOUTS.medium });

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: TEST_TIMEOUTS.medium });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    await page.waitForTimeout(800);

    await expect(dialog).toBeHidden();
  });

  test('does not auto show when feature is disabled', async ({ page }) => {
    await seedStarmapState(page, { enabled: false, autoShow: true, onlineEnhancement: false });
    await openReadyStarmap(page);

    const dialog = page.locator('[role="dialog"]').filter({ hasText: /daily knowledge|每日知识/i });
    await expect(dialog).toBeHidden();
  });

  test('respects do-not-show-today', async ({ page }) => {
    await seedStarmapState(page, { enabled: true, autoShow: true, onlineEnhancement: false });
    await openReadyStarmap(page);

    const dialog = page.locator('[role="dialog"]').filter({ hasText: /daily knowledge|每日知识/i });
    await expect(dialog).toBeVisible({ timeout: TEST_TIMEOUTS.medium });

    const dontShowButton = dialog
      .getByRole('button', { name: /do not show again today|今天不再显示/i })
      .first();
    await dontShowButton.click();
    await expect(dialog).toBeHidden({ timeout: TEST_TIMEOUTS.medium });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    await page.waitForTimeout(800);

    await expect(dialog).toBeHidden();
  });

  test('manual entry always works when enabled', async ({ page }) => {
    await seedStarmapState(page, { enabled: true, autoShow: false, onlineEnhancement: false });
    await openReadyStarmap(page);

    const trigger = page.locator('[data-tour-id="daily-knowledge"] button').first();
    await expect(trigger).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
    await trigger.click();

    const dialog = page.locator('[role="dialog"]').filter({ hasText: /daily knowledge|每日知识/i });
    await expect(dialog).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
  });

  test('related object jump executes without error toast', async ({ page }) => {
    await seedStarmapState(page, { enabled: true, autoShow: false, onlineEnhancement: false });
    await openReadyStarmap(page);

    const trigger = page.locator('[data-tour-id="daily-knowledge"] button').first();
    await trigger.click();

    const dialog = page.locator('[role="dialog"]').filter({ hasText: /daily knowledge|每日知识/i });
    await expect(dialog).toBeVisible({ timeout: TEST_TIMEOUTS.medium });

    const relatedObjectButton = dialog.locator('button:has(svg.lucide-telescope)').first();
    await expect(relatedObjectButton).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
    await relatedObjectButton.click();

    await page.waitForTimeout(600);
    const errorToast = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: /unable to locate|sky engine is not ready|无法定位|未就绪/i });
    await expect(errorToast).toHaveCount(0);
    await expect(dialog).toBeVisible();
  });
});
