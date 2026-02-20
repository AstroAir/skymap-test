import { Page, expect } from '@playwright/test';
import { TEST_TIMEOUTS } from './test-data';

/**
 * Selector for the Stellarium loading overlay
 */
const LOADING_OVERLAY_SELECTOR = 'div.absolute.inset-0.flex.flex-col.items-center.justify-center.bg-black\\/90.z-10';
const SPLASH_SELECTOR = '[data-testid="splash-screen"]';

async function dismissSplashIfVisible(page: Page) {
  const splash = page.locator(SPLASH_SELECTOR).first();
  const skipHint = page.getByText(/press any key or click to skip|按任意键或点击跳过/i).first();
  const dialogOverlay = page.locator('[data-slot="dialog-overlay"][data-state="open"]').first();

  for (let attempt = 0; attempt < 3; attempt++) {
    const splashVisible = await splash.isVisible().catch(() => false);
    const hintVisible = await skipHint.isVisible().catch(() => false);

    if (splashVisible) {
      await splash.click({ timeout: TEST_TIMEOUTS.short }).catch(() => {});
    } else if (hintVisible) {
      await skipHint.click({ timeout: TEST_TIMEOUTS.short }).catch(() => {});
    }

    if (await dialogOverlay.isVisible().catch(() => false)) {
      await dialogOverlay.click({ force: true }).catch(() => {});
    }
    await page.keyboard.press('Escape').catch(() => {});

    const splashHidden = await splash.isHidden().catch(() => false);
    const overlayHidden = await dialogOverlay.isHidden().catch(() => false);
    if (splashHidden && overlayHidden) return;

    await page.waitForTimeout(300);
  }

  await splash.waitFor({ state: 'hidden', timeout: TEST_TIMEOUTS.splash }).catch(() => {});
}

/**
 * Helper to skip onboarding and setup wizard via localStorage
 */
export async function skipOnboardingAndSetup(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('starmap-onboarding', JSON.stringify({
      state: {
        hasCompletedOnboarding: true,
        hasCompletedSetup: true,
        completedSteps: ['welcome', 'search', 'navigation', 'zoom', 'settings', 'fov', 'shotlist', 'tonight', 'contextmenu', 'complete'],
        setupCompletedSteps: ['welcome', 'location', 'equipment', 'preferences', 'complete'],
        showOnNextVisit: false,
      },
      version: 3,
    }));

    // Backward-compat keys kept for older tests/components.
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

    // Disable splash during E2E runs for deterministic toolbar interactions.
    const rawSettings = localStorage.getItem('starmap-settings');
    try {
      const parsed = rawSettings
        ? (JSON.parse(rawSettings) as { state?: { preferences?: Record<string, unknown> }; version?: number })
        : {};
      parsed.state = parsed.state ?? {};
      const existingPreferences = parsed.state.preferences ?? {};
      parsed.state.preferences = {
        locale: existingPreferences.locale ?? 'en',
        ...existingPreferences,
        showSplash: false,
        dailyKnowledgeAutoShow: false,
      };
      localStorage.setItem('starmap-settings', JSON.stringify(parsed));
    } catch {
      localStorage.setItem('starmap-settings', JSON.stringify({
        state: { preferences: { locale: 'en', showSplash: false, dailyKnowledgeAutoShow: false } },
        version: 14,
      }));
    }
  });
}

/**
 * Helper to wait for starmap ready and dismiss onboarding.
 * This bypasses the WASM loading wait and skips onboarding dialogs
 * for faster and more reliable tests.
 */
export async function waitForStarmapReady(page: Page, options?: { skipWasmWait?: boolean }) {
  const openStarmap = async () => {
    await page.goto('/starmap', {
      waitUntil: 'domcontentloaded',
      timeout: TEST_TIMEOUTS.wasmInit,
    });
  };

  try {
    await openStarmap();
  } catch {
    // Retry once when dev server is still compiling the first page load.
    await page.waitForTimeout(1500);
    await openStarmap();
  }
  
  // Skip onboarding and setup wizard by setting localStorage
  await skipOnboardingAndSetup(page);
  
  await page.reload({
    waitUntil: 'domcontentloaded',
    timeout: TEST_TIMEOUTS.wasmInit,
  });
  await dismissSplashIfVisible(page);
  
  // Wait for canvas to be visible
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
  
  // Wait for WASM loading overlay to disappear (if not skipping)
  if (!options?.skipWasmWait) {
    const loadingOverlay = page.locator(LOADING_OVERLAY_SELECTOR);
    try {
      // Check if loading overlay exists and wait for it to disappear
      const overlayVisible = await loadingOverlay.isVisible().catch(() => false);
      if (overlayVisible) {
        await loadingOverlay.waitFor({ state: 'hidden', timeout: TEST_TIMEOUTS.wasmInit });
      }
    } catch {
      // If timeout, log but continue - some tests may work without full WASM init
      console.warn('WASM loading timeout - continuing with test');
    }
  }
  
  // Wait a bit for UI to stabilize
  await page.waitForTimeout(1000);
}

/**
 * Helper to click on the starmap canvas at a specific position
 */
export async function clickCanvas(page: Page, x = 100, y = 100) {
  const canvas = page.locator('canvas').first();
  await canvas.click({ position: { x, y } });
}

/**
 * Helper to get the canvas locator
 */
export function getCanvas(page: Page) {
  return page.locator('canvas').first();
}

/**
 * Helper to search for an object and select the first result
 */
export async function searchAndSelectObject(page: Page, objectName: string) {
  const searchButton = page.getByRole('button', { name: /search|搜索/i }).first();
  if (await searchButton.isVisible().catch(() => false)) {
    await searchButton.click();
  }
  
  const searchInput = page.getByPlaceholder(/search/i).first();
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
