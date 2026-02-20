import { test, expect, type Page } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

async function setMobilePreferences(
  page: Page,
  mobileFeaturePreferences: {
    compactBottomBar?: boolean;
    oneHandMode?: boolean;
    prioritizedTools?: string[];
  },
) {
  await page.evaluate((prefs) => {
    const rawSettings = localStorage.getItem('starmap-settings');
    const parsed = rawSettings
      ? JSON.parse(rawSettings) as { state?: Record<string, unknown>; version?: number }
      : {};
    parsed.state = parsed.state ?? {};
    const currentMobilePrefs = (parsed.state.mobileFeaturePreferences as Record<string, unknown> | undefined) ?? {};
    parsed.state.mobileFeaturePreferences = {
      ...currentMobilePrefs,
      ...prefs,
    };
    parsed.version = Math.max(parsed.version ?? 0, 14);
    localStorage.setItem('starmap-settings', JSON.stringify(parsed));
  }, mobileFeaturePreferences);
}

test.describe('Mobile Interactions', () => {
  test.describe.configure({ mode: 'serial' });

  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
  });

  test('renders mobile bottom tool bar on phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForStarmapReady(page, { skipWasmWait: true });

    await expect(page.locator('#__next_error__')).toHaveCount(0);
    await expect(starmapPage.canvas).toBeVisible();
    await expect(page.locator('.mobile-bottom-bar')).toBeVisible();
    await expect(page.locator('button:has(svg.lucide-menu)').first()).toBeVisible();
  });

  test('opens mobile drawer and exposes core feature entries', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForStarmapReady(page, { skipWasmWait: true });

    const menuButton = page.locator('button:has(svg.lucide-menu)').first();
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const drawer = page.locator('[data-slot="drawer-content"].drawer-content');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('text=/tonight|今晚|session|会话|equipment|设备|offline|离线/i').first()).toBeVisible();
  });

  test('mobile menu button satisfies minimum touch target', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForStarmapReady(page, { skipWasmWait: true });

    const menuButton = page.locator('button:has(svg.lucide-menu)').first();
    await expect(menuButton).toBeVisible();
    const box = await menuButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('compact mode shows prioritized tools plus more drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForStarmapReady(page, { skipWasmWait: true });
    await setMobilePreferences(page, {
      compactBottomBar: true,
      prioritizedTools: ['markers', 'location', 'fov', 'shotlist', 'tonight', 'daily-knowledge'],
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(starmapPage.canvas).toBeVisible();

    const bottomBar = page.locator('.mobile-bottom-bar');
    await expect(bottomBar).toBeVisible();
    await expect(bottomBar.locator('[data-tour-id="markers"]')).toBeVisible();
    await expect(bottomBar.locator('[data-tour-id="equipment-manager"]')).toHaveCount(0);

    const moreButton = bottomBar.locator('[data-tour-id="mobile-more-tools"]').first();
    await expect(moreButton).toBeVisible();
    await moreButton.click();

    const drawerTools = page.locator('[data-mobile-more-tools="true"]');
    await expect(drawerTools).toBeVisible();
    await expect(drawerTools.locator('[data-tour-id="equipment-manager"]')).toBeVisible();
  });

  test('one-hand mode keeps zoom and bottom bar unobstructed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForStarmapReady(page, { skipWasmWait: true });
    await setMobilePreferences(page, {
      compactBottomBar: true,
      oneHandMode: true,
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(starmapPage.canvas).toBeVisible();

    const oneHandBar = page.locator('.one-hand-bottom-bar');
    await expect(oneHandBar).toBeVisible();

    const zoomPanel = page.locator('[data-tour-id="zoom"]').last();
    await expect(zoomPanel).toBeVisible();
    const zoomBox = await zoomPanel.boundingBox();
    const barBox = await oneHandBar.boundingBox();
    expect(zoomBox).not.toBeNull();
    expect(barBox).not.toBeNull();
    expect(zoomBox!.y + zoomBox!.height).toBeLessThanOrEqual(barBox!.y + 2);
  });

  test('mobile bottom bar keeps multiple tools reachable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForStarmapReady(page, { skipWasmWait: true });

    const toolButtons = page.locator('.mobile-bottom-bar button');
    await expect(toolButtons.first()).toBeVisible();
    expect(await toolButtons.count()).toBeGreaterThanOrEqual(8);
  });

  test('mobile controls satisfy touch target minimums', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForStarmapReady(page, { skipWasmWait: true });
    await setMobilePreferences(page, {
      compactBottomBar: true,
      prioritizedTools: ['markers', 'location', 'fov', 'shotlist', 'tonight', 'daily-knowledge'],
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const candidates = page.locator('.mobile-bottom-bar button:visible');
    const count = await candidates.count();
    const sampleCount = Math.min(count, 4);
    for (let index = 0; index < sampleCount; index++) {
      const box = await candidates.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
    }
  });

  test('desktop viewport hides mobile bottom bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForStarmapReady(page, { skipWasmWait: true });

    await expect(starmapPage.canvas).toBeVisible();
    await expect(page.locator('.mobile-bottom-bar')).toBeHidden();
  });
});
