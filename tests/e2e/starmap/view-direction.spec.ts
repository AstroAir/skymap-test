import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

async function panCanvas(starmapPage: StarmapPage) {
  const box = await starmapPage.canvas.boundingBox();
  if (!box) throw new Error('Canvas not available');
  await starmapPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await starmapPage.page.mouse.down();
  await starmapPage.page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 40, { steps: 10 });
  await starmapPage.page.mouse.up();
}

test.describe('View Direction Controls', () => {
  test.describe.configure({ mode: 'serial' });

  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
    await expect(starmapPage.canvas).toBeVisible();
  });

  test('shows coordinate mode toggle with equatorial values', async ({ page }) => {
    const modeToggle = page.getByRole('button', { name: /ICRF|OBS/i }).first();
    await expect(modeToggle).toBeVisible();
    await expect(page.locator('text=/RA\\s*:/i').first()).toBeVisible();
    await expect(page.locator('text=/Dec\\s*:/i').first()).toBeVisible();
  });

  test('switches from ICRF to observed Alt/Az display', async ({ page }) => {
    const modeToggle = page.getByRole('button', { name: /ICRF|OBS/i }).first();
    await expect(modeToggle).toBeVisible();
    await modeToggle.click();

    await expect(page.locator('text=/Alt\\s*:/i').first()).toBeVisible();
    await expect(page.locator('text=/Az\\s*:/i').first()).toBeVisible();
  });

  test('updates displayed coordinates after panning', async ({ page }) => {
    const modeToggle = page.getByRole('button', { name: /ICRF|OBS/i }).first();
    await expect(modeToggle).toBeVisible();

    const raValue = page.locator('text=/RA\\s*:/i').first();
    await expect(raValue).toBeVisible();
    const before = (await raValue.textContent()) ?? '';

    await panCanvas(starmapPage);
    await page.waitForTimeout(400);

    const after = (await raValue.textContent()) ?? '';
    expect(after).not.toEqual(before);
  });

  test('shows LST with UT1/UTC source indicator', async ({ page }) => {
    await expect(page.locator('text=/LST\\((UT1|UTC)\\)/i').first()).toBeVisible();
  });

  test('keeps FOV status visible during navigation', async ({ page }) => {
    await expect(page.locator('text=/FOV\\s*:/i').first()).toBeVisible();
    await panCanvas(starmapPage);
    await expect(page.locator('text=/FOV\\s*:/i').first()).toBeVisible();
  });
});
