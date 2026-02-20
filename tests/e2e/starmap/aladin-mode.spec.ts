import { expect, test, type Locator, type Page } from '@playwright/test';
import { waitForStarmapReady } from '../fixtures/test-helpers';

function seedAladinLayers() {
  localStorage.setItem(
    'aladin-layers-store',
    JSON.stringify({
      state: {
        catalogLayers: [
          {
            id: 'simbad',
            type: 'simbad',
            name: 'SIMBAD',
            enabled: true,
            color: '#ff9800',
            radius: 0.5,
            limit: 1000,
          },
        ],
        imageOverlayLayers: [
          {
            id: 'overlay-e2e',
            name: 'DSS Overlay E2E',
            surveyId: 'dss',
            surveyUrl: 'https://alasky.cds.unistra.fr/DSS/DSSColor/',
            enabled: true,
            opacity: 0.5,
            additive: false,
          },
        ],
        mocLayers: [
          {
            id: 'moc-e2e',
            name: 'SDSS DR16',
            url: 'https://alasky.cds.unistra.fr/footprints/tables/vizier/V_154_sdss16/MOC',
            color: '#2196f3',
            opacity: 0.3,
            lineWidth: 1,
            visible: true,
          },
        ],
        fitsLayers: [
          {
            id: 'fits-e2e',
            name: 'FITS Overlay E2E',
            url: 'https://example.com/e2e-test.fits',
            mode: 'overlay',
            enabled: true,
            opacity: 0.8,
          },
        ],
      },
      version: 1,
    })
  );
}

async function switchToAladin(page: Page): Promise<Locator> {
  for (let i = 0; i < 3; i += 1) {
    const blockingOverlay = page.locator('[data-slot="dialog-overlay"][data-state="open"]').first();
    const isBlocking = await blockingOverlay.isVisible().catch(() => false);
    if (!isBlocking) break;
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(200);
  }

  const settingsButton = page
    .locator('[data-testid="settings-button"]')
    .or(page.getByRole('button', { name: /settings|设置/i }))
    .first();
  await settingsButton.click({ force: true });
  const settingsDialog = page.getByRole('dialog', { name: /settings|设置/i }).first();
  if (!(await settingsDialog.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /settings|设置/i }).first().click({ force: true });
  }
  await expect(settingsDialog).toBeVisible();

  const displayTab = settingsDialog.getByRole('tab', { name: /display|显示/i }).first();
  if (await displayTab.isVisible().catch(() => false)) {
    await displayTab.click();
  }

  const engineSection = settingsDialog.getByRole('button', { name: /switch sky engine|切换.*引擎/i }).first();
  if (await engineSection.isVisible().catch(() => false)) {
    const expanded = await engineSection.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await engineSection.click();
    }
  }

  await settingsDialog.getByRole('button', { name: /aladin lite/i }).first().click();
  await expect(page.locator('#aladin-lite-container')).toBeVisible();
  return settingsDialog;
}

test.describe('Aladin Mode Full Chain', () => {
  test('should support full Aladin layer controls and explicit Stellarium compensation', async ({ page }) => {
    await waitForStarmapReady(page, { skipWasmWait: true });

    await page.evaluate(seedAladinLayers);
    await page.reload();
    await waitForStarmapReady(page, { skipWasmWait: true });

    const settingsDialog = await switchToAladin(page);

    const aladinLogoLink = page.locator('a[href*="aladin.cds.unistra.fr"]').first();
    await expect(aladinLogoLink).toBeVisible();
    await expect(aladinLogoLink).toHaveAttribute('href', /aladin\.cds\.unistra\.fr/i);

    await expect(settingsDialog.getByRole('button', { name: /catalog layers|天文目录图层/i }).first()).toBeVisible();
    await expect(settingsDialog.getByRole('button', { name: /image overlay layers|图像叠加图层/i }).first()).toBeVisible();
    await expect(settingsDialog.getByRole('button', { name: /moc layers|MOC 覆盖图层/i }).first()).toBeVisible();
    await expect(settingsDialog.getByRole('button', { name: /fits layers|FITS 图层/i }).first()).toBeVisible();

    const catalogSection = settingsDialog.getByRole('button', { name: /catalog layers|天文目录图层/i }).first();
    await catalogSection.click();
    await expect(settingsDialog.getByText('SIMBAD').first()).toBeVisible();

    const overlaySection = settingsDialog.getByRole('button', { name: /image overlay layers|图像叠加图层/i }).first();
    await overlaySection.click();
    await expect(settingsDialog.getByText('DSS Overlay E2E').first()).toBeVisible();

    const mocSection = settingsDialog.getByRole('button', { name: /moc layers|MOC 覆盖图层/i }).first();
    await mocSection.click();
    await expect(settingsDialog.getByText('SDSS DR16').first()).toBeVisible();

    const fitsSection = settingsDialog.getByRole('button', { name: /fits layers|FITS 图层/i }).first();
    await fitsSection.click();
    await expect(settingsDialog.getByText('FITS Overlay E2E').first()).toBeVisible();

    await settingsDialog.getByRole('button', { name: /stellarium/i }).first().click();
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
