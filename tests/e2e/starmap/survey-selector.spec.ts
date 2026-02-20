import { test, expect, type Page, type Locator } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

async function openSurveySettings(starmapPage: StarmapPage, page: Page): Promise<{
  settingsPanel: Locator;
  surveyToggle: Locator;
}> {
  await starmapPage.openSettings();
  const settingsPanel = starmapPage.settingsPanel;
  await expect(settingsPanel).toBeVisible();

  // Expand survey section if needed.
  const surveySectionTrigger = settingsPanel
    .getByText(/Sky Surveys \(HiPS\)|巡天图像 \(HiPS\)/i)
    .first();
  if (await surveySectionTrigger.isVisible().catch(() => false)) {
    await surveySectionTrigger.click();
  }

  const surveyToggle = page.locator('#survey-enabled');
  await expect(surveyToggle).toBeVisible();

  return { settingsPanel, surveyToggle };
}

async function readPersistedSurveySettings(page: Page): Promise<{
  surveyEnabled: boolean;
  surveyId: string;
  surveyUrl?: string;
} | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('starmap-settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { stellarium?: { surveyEnabled?: boolean; surveyId?: string; surveyUrl?: string } } };
    const stellarium = parsed.state?.stellarium;
    if (!stellarium) return null;
    return {
      surveyEnabled: Boolean(stellarium.surveyEnabled),
      surveyId: stellarium.surveyId ?? '',
      surveyUrl: stellarium.surveyUrl,
    };
  });
}

test.describe('Sky Survey Selector', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
    await expect(starmapPage.canvas).toBeVisible();
  });

  test('shows survey controls and built-in survey list', async ({ page }) => {
    const { settingsPanel, surveyToggle } = await openSurveySettings(starmapPage, page);
    await expect(surveyToggle).toBeVisible();
    await expect(settingsPanel.getByText(/DSS|Digitized Sky Survey/i).first()).toBeVisible();
    await expect(settingsPanel.getByText(/2MASS/i).first()).toBeVisible();
    await expect(settingsPanel.getByText(/PanSTARRS/i).first()).toBeVisible();
  });

  test('changing survey updates selected state and persisted settings', async ({ page }) => {
    const { settingsPanel } = await openSurveySettings(starmapPage, page);

    const panstarrsItem = settingsPanel.getByText(/PanSTARRS/i).first();
    await expect(panstarrsItem).toBeVisible();
    await panstarrsItem.click();

    // Selected survey info card should reflect new selection.
    await expect(settingsPanel.getByText(/PanSTARRS/i).first()).toBeVisible();

    // Persisted settings should contain selected survey.
    await expect.poll(() => readPersistedSurveySettings(page)).toMatchObject({
      surveyEnabled: true,
      surveyId: 'panstarrs',
    });
  });

  test('survey enabled state persists across reload', async ({ page }) => {
    const { surveyToggle } = await openSurveySettings(starmapPage, page);

    const initiallyChecked = await surveyToggle.getAttribute('aria-checked');
    if (initiallyChecked !== 'false') {
      await surveyToggle.click();
    }
    await expect(surveyToggle).toHaveAttribute('aria-checked', 'false');
    await expect.poll(() => readPersistedSurveySettings(page)).toMatchObject({
      surveyEnabled: false,
    });

    await page.reload();
    await waitForStarmapReady(page, { skipWasmWait: true });
    await expect(starmapPage.canvas).toBeVisible();

    const reopened = await openSurveySettings(starmapPage, page);
    await expect(reopened.surveyToggle).toHaveAttribute('aria-checked', 'false');
  });
});
