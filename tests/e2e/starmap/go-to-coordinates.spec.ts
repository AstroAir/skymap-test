import { test, expect, type Page } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

async function openGoToCoordinatesDialog(page: Page, starmapPage: StarmapPage) {
  const box = await starmapPage.canvas.boundingBox();
  if (!box) throw new Error('Canvas not available');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
  await page.getByRole('menuitem').filter({ hasText: /go to coordinates|坐标|坐标跳转/i }).first().click();
}

test.describe('Go To Coordinates Dialog', () => {
  test.describe.configure({ mode: 'serial' });

  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
    await expect(starmapPage.canvas).toBeVisible();
  });

  test('opens from canvas context menu with RA/Dec inputs', async ({ page }) => {
    await openGoToCoordinatesDialog(page, starmapPage);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input#ra')).toBeVisible();
    await expect(dialog.locator('input#dec')).toBeVisible();
  });

  test('shows validation error for invalid range inputs', async ({ page }) => {
    await openGoToCoordinatesDialog(page, starmapPage);
    const dialog = page.getByRole('dialog');
    await dialog.locator('input#ra').fill('999');
    await dialog.locator('input#dec').fill('-120');
    await dialog.getByRole('button', { name: /go|跳转/i }).click();
    await expect(dialog.getByText(/invalid|无效/i)).toBeVisible();
  });

  test('navigates with decimal coordinates and closes dialog', async ({ page }) => {
    const raText = page.locator('text=/RA\\s*:/i').first();
    await expect(raText).toBeVisible();
    const before = (await raText.textContent()) ?? '';

    await openGoToCoordinatesDialog(page, starmapPage);
    const dialog = page.getByRole('dialog');
    await dialog.locator('input#ra').fill('250.1000');
    await dialog.locator('input#dec').fill('-20.5000');
    await dialog.getByRole('button', { name: /go|跳转/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.waitForTimeout(800);
    const after = (await raText.textContent()) ?? '';
    expect(after).not.toEqual(before);
  });

  test('accepts HMS/DMS inputs', async ({ page }) => {
    await openGoToCoordinatesDialog(page, starmapPage);
    const dialog = page.getByRole('dialog');
    await dialog.locator('input#ra').fill('00:42:44');
    await dialog.locator('input#dec').fill('+41:16:09');
    await dialog.getByRole('button', { name: /go|跳转/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(starmapPage.canvas).toBeVisible();
  });

  test('context menu provides center and marker actions', async ({ page }) => {
    const box = await starmapPage.canvas.boundingBox();
    if (!box) throw new Error('Canvas not available');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });

    await expect(page.getByRole('menuitem').filter({ hasText: /center view|居中|center/i }).first()).toBeVisible();
    await expect(page.getByRole('menuitem').filter({ hasText: /marker|标记/i }).first()).toBeVisible();
  });
});
