import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TEST_TIMEOUTS } from '../test-data';

/**
 * Starmap Page Object - Main star map view
 */
export class StarmapPage extends BasePage {
  // Main elements
  readonly canvas: Locator;
  readonly splashScreen: Locator;
  readonly toolbar: Locator;
  readonly stellariumLoadingOverlay: Locator;
  
  // Search
  readonly searchButton: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly advancedSearchButton: Locator;
  readonly advancedSearchDialog: Locator;
  
  // Time controls
  readonly clockDisplay: Locator;
  readonly timeControlsButton: Locator;
  readonly nowButton: Locator;
  readonly playPauseButton: Locator;
  readonly timeSpeedSlider: Locator;
  
  // Zoom controls
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly fovDisplay: Locator;
  readonly resetViewButton: Locator;
  
  // Settings
  readonly settingsButton: Locator;
  readonly settingsPanel: Locator;
  readonly displaySettingsTab: Locator;
  readonly equipmentTab: Locator;
  readonly fovTab: Locator;
  readonly exposureTab: Locator;
  
  // Info panel
  readonly infoPanel: Locator;
  readonly objectName: Locator;
  readonly objectCoordinates: Locator;
  readonly addToListButton: Locator;
  readonly slewButton: Locator;
  readonly detailsButton: Locator;
  
  // Shot list
  readonly shotListButton: Locator;
  readonly shotListPanel: Locator;
  readonly shotListItems: Locator;
  readonly clearAllButton: Locator;
  
  // Exposure calculator
  readonly exposureCalculatorButton: Locator;
  readonly exposureCalculatorPanel: Locator;
  
  // FOV simulator
  readonly fovSimulatorButton: Locator;
  readonly fovSimulatorPanel: Locator;
  readonly fovOverlay: Locator;
  
  // Ocular simulator
  readonly ocularSimulatorButton: Locator;
  readonly ocularSimulatorPanel: Locator;
  
  // Satellite tracker
  readonly satelliteTrackerButton: Locator;
  readonly satelliteTrackerPanel: Locator;
  
  // Events calendar
  readonly eventsCalendarButton: Locator;
  readonly eventsCalendarPanel: Locator;
  
  // Tonight recommendations
  readonly tonightButton: Locator;
  readonly tonightPanel: Locator;
  readonly dailyKnowledgeButton: Locator;
  readonly dailyKnowledgeDialog: Locator;
  
  // Sky atlas
  readonly skyAtlasButton: Locator;
  readonly skyAtlasPanel: Locator;
  readonly skyAtlasAutoCloseSwitch: Locator;
  readonly skyAtlasNameFilterInput: Locator;
  readonly skyAtlasSearchButton: Locator;
  readonly skyAtlasResultCards: Locator;
  readonly sonnerToasts: Locator;
  
  // Offline cache
  readonly cacheManagerButton: Locator;
  readonly cacheManagerPanel: Locator;
  
  // Equipment manager
  readonly equipmentManagerButton: Locator;
  readonly equipmentManagerPanel: Locator;
  
  // Location manager
  readonly locationManagerButton: Locator;
  readonly locationManagerPanel: Locator;
  
  // Marker manager
  readonly markerManagerButton: Locator;
  readonly markerManagerPanel: Locator;
  
  // Theme and language
  readonly themeToggle: Locator;
  readonly nightModeToggle: Locator;
  readonly languageSwitcher: Locator;
  
  // Context menu
  readonly contextMenu: Locator;
  
  // About dialog
  readonly aboutButton: Locator;
  readonly aboutDialog: Locator;
  
  // Object detail drawer
  readonly objectDetailDrawer: Locator;

  constructor(page: Page) {
    super(page);
    
    // Main elements
    this.canvas = page.locator('canvas').first();
    this.splashScreen = page
      .locator('[data-testid="splash-screen"]')
      .or(page.locator('.splash-screen'))
      .or(page.locator('div.fixed.inset-0.z-100.bg-black').filter({ hasText: /skymap/i }));
    this.toolbar = page.locator('[data-testid="toolbar"]').or(page.locator('.toolbar'));
    this.stellariumLoadingOverlay = page.locator(
      'div.absolute.inset-0.flex.flex-col.items-center.justify-center.bg-black\\/90.z-10'
    );
    
    // Search
    this.searchButton = page.getByRole('button', { name: /search/i }).first();
    this.searchInput = page.getByPlaceholder(/search/i).first();
    this.searchResults = page.locator('[data-testid="search-results"]').or(page.locator('.search-results'));
    this.advancedSearchButton = page.getByRole('button', { name: /advanced/i });
    this.advancedSearchDialog = page.locator('[role="dialog"]').filter({ hasText: /advanced search/i });
    
    // Time controls
    this.clockDisplay = page.locator('[data-testid="clock-display"]').or(page.locator('.clock-display'));
    this.timeControlsButton = page.getByRole('button', { name: /time/i });
    this.nowButton = page.getByRole('button', { name: /now/i });
    this.playPauseButton = page.getByRole('button', { name: /play|pause/i });
    this.timeSpeedSlider = page.locator('[data-testid="time-speed-slider"]');
    
    // Zoom controls
    this.zoomInButton = page.getByRole('button', { name: /zoom in/i }).or(page.locator('[data-testid="zoom-in"]'));
    this.zoomOutButton = page.getByRole('button', { name: /zoom out/i }).or(page.locator('[data-testid="zoom-out"]'));
    this.fovDisplay = page.locator('[data-testid="fov-display"]').or(page.locator('.fov-display'));
    this.resetViewButton = page.getByRole('button', { name: /reset/i });
    
    // Settings
    this.settingsButton = page.locator('[data-testid="settings-button"]');
    this.settingsPanel = page.locator('[data-testid="settings-panel"]');
    this.displaySettingsTab = page.getByRole('tab', { name: /display/i });
    this.equipmentTab = page.getByRole('tab', { name: /equipment/i });
    this.fovTab = page.getByRole('tab', { name: /fov/i });
    this.exposureTab = page.getByRole('tab', { name: /exposure/i });
    
    // Info panel
    this.infoPanel = page.locator('.info-panel-enter').or(page.locator('[data-testid="info-panel"], .info-panel'));
    this.objectName = page
      .locator('[data-testid="object-name"]')
      .or(
        this.infoPanel
          .locator('[data-slot="collapsible-trigger"]')
          .first()
          .locator('span')
          .first()
      );
    this.objectCoordinates = page.locator('[data-testid="object-coordinates"]');
    this.addToListButton = page.getByRole('button', { name: /add to.*list/i });
    this.slewButton = page.getByRole('button', { name: /slew/i });
    this.detailsButton = page.getByRole('button', { name: /details|view details/i });
    
    // Shot list
    this.shotListButton = page.getByRole('button', { name: /shot list/i }).or(page.locator('[data-testid="shot-list-button"]'));
    this.shotListPanel = page.locator('[data-testid="shot-list-panel"]').or(page.locator('[role="dialog"]').filter({ hasText: /shot list/i }));
    this.shotListItems = this.shotListPanel.locator('[data-testid="shot-list-item"]').or(this.shotListPanel.locator('.shot-list-item'));
    this.clearAllButton = page.getByRole('button', { name: /clear all/i });
    
    // Exposure calculator
    this.exposureCalculatorButton = page.getByRole('button', { name: /exposure/i }).or(page.locator('[data-testid="exposure-calculator-button"]'));
    this.exposureCalculatorPanel = page.locator('[data-testid="exposure-calculator-panel"]').or(page.locator('[role="dialog"]').filter({ hasText: /exposure calculator/i }));
    
    // FOV simulator
    this.fovSimulatorButton = page.getByRole('button', { name: /fov/i }).or(page.locator('[data-testid="fov-simulator-button"]'));
    this.fovSimulatorPanel = page.locator('[data-testid="fov-simulator-panel"]').or(page.locator('[role="dialog"]').filter({ hasText: /fov simulator/i }));
    this.fovOverlay = page.locator('[data-testid="fov-overlay"]').or(page.locator('.fov-overlay'));
    
    // Ocular simulator
    this.ocularSimulatorButton = page.getByRole('button', { name: /eyepiece|ocular/i });
    this.ocularSimulatorPanel = page.locator('[role="dialog"]').filter({ hasText: /eyepiece simulator/i });
    
    // Satellite tracker
    this.satelliteTrackerButton = page.getByRole('button', { name: /satellite/i });
    this.satelliteTrackerPanel = page.locator('[role="dialog"]').filter({ hasText: /satellite tracker/i });
    
    // Events calendar
    this.eventsCalendarButton = page.getByRole('button', { name: /events|calendar/i });
    this.eventsCalendarPanel = page.locator('[role="dialog"]').filter({ hasText: /astronomical events/i });
    
    // Tonight recommendations
    this.tonightButton = page.getByRole('button', { name: /tonight/i });
    this.tonightPanel = page.locator('[role="dialog"]').filter({ hasText: /tonight/i });
    this.dailyKnowledgeButton = page.locator('[data-tour-id="daily-knowledge"] button').first();
    this.dailyKnowledgeDialog = page.locator('[role="dialog"]').filter({ hasText: /daily knowledge|每日知识/i });
    
    // Sky atlas
    this.skyAtlasButton = page.getByRole('button', { name: /atlas/i });
    this.skyAtlasPanel = page.locator('[data-slot="drawer-content"]').filter({ hasText: /sky atlas|星图集/i });
    this.skyAtlasAutoCloseSwitch = this.skyAtlasPanel.locator('#sky-atlas-auto-close');
    this.skyAtlasNameFilterInput = this.skyAtlasPanel.getByPlaceholder(/search|搜索/i).first();
    this.skyAtlasSearchButton = this.skyAtlasPanel.getByRole('button', { name: /search|搜索/i });
    this.skyAtlasResultCards = this.skyAtlasPanel.locator('[data-slot="card"]');
    this.sonnerToasts = page.locator('[data-sonner-toast]');
    
    // Offline cache
    this.cacheManagerButton = page.getByRole('button', { name: /cache|offline/i });
    this.cacheManagerPanel = page.locator('[role="dialog"]').filter({ hasText: /offline/i });
    
    // Equipment manager
    this.equipmentManagerButton = page.getByRole('button', { name: /equipment/i });
    this.equipmentManagerPanel = page.locator('[role="dialog"]').filter({ hasText: /equipment manager/i });
    
    // Location manager
    this.locationManagerButton = page.getByRole('button', { name: /location/i });
    this.locationManagerPanel = page.locator('[role="dialog"]').filter({ hasText: /observation locations/i });
    
    // Marker manager
    this.markerManagerButton = page.getByRole('button', { name: /marker/i });
    this.markerManagerPanel = page.locator('[role="dialog"]').filter({ hasText: /sky markers/i });
    
    // Theme and language
    this.themeToggle = page.locator('[data-testid="theme-toggle"]').or(page.getByRole('button', { name: /theme|dark|light/i }));
    this.nightModeToggle = page.locator('[data-testid="night-mode-toggle"]').or(page.getByRole('button', { name: /night mode/i }));
    this.languageSwitcher = page.locator('[data-testid="language-switcher"]').or(page.getByRole('button', { name: /language|语言/i }));
    
    // Context menu
    this.contextMenu = page.locator('[role="menu"]').or(page.locator('.context-menu'));
    
    // About dialog (supports en: "About", zh: "关于")
    this.aboutButton = page.getByRole('button', { name: /about|关于/i });
    this.aboutDialog = page.locator('[role="dialog"]').filter({ hasText: /about|关于/i });
    
    // Object detail drawer
    this.objectDetailDrawer = page.locator('[data-testid="object-detail-drawer"]').or(page.locator('[role="dialog"]').filter({ hasText: /overview|images|observation/i }));
  }

  /**
   * Navigate to starmap page
   */
  async goto() {
    await super.goto('/starmap');
  }

  /**
   * Wait for splash screen to disappear
   */
  async waitForSplashToDisappear() {
    try {
      await this.splashScreen.waitFor({ state: 'hidden', timeout: TEST_TIMEOUTS.splash });
    } catch {
      // Splash might not exist or already hidden
    }
  }

  /**
   * Wait for starmap to be ready
   * Uses extended timeout for WASM engine initialization
   */
  async waitForReady(options?: { skipWasmWait?: boolean }) {
    await this.goto();
    
    // Skip onboarding and setup wizard by setting localStorage
    await this.page.evaluate(() => {
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

      const rawSettings = localStorage.getItem('starmap-settings');
      try {
        const parsed = rawSettings
          ? (JSON.parse(rawSettings) as { state?: { preferences?: Record<string, unknown> }; version?: number })
          : {};
        parsed.state = parsed.state ?? {};
        parsed.state.preferences = {
          ...(parsed.state.preferences ?? {}),
          showSplash: false,
          dailyKnowledgeAutoShow: false,
        };
        localStorage.setItem('starmap-settings', JSON.stringify(parsed));
      } catch {
        localStorage.setItem('starmap-settings', JSON.stringify({
          state: { preferences: { showSplash: false, dailyKnowledgeAutoShow: false } },
          version: 13,
        }));
      }
    });
    
    await this.page.reload();
    await this.waitForSplashToDisappear();
    await expect(this.canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    
    // Wait for WASM loading overlay to disappear (if not skipping)
    if (!options?.skipWasmWait) {
      try {
        const overlayVisible = await this.stellariumLoadingOverlay.isVisible().catch(() => false);
        if (overlayVisible) {
          await this.stellariumLoadingOverlay.waitFor({ state: 'hidden', timeout: TEST_TIMEOUTS.wasmInit });
        }
      } catch {
        // If timeout, continue - some tests may work without full WASM init
        console.warn('WASM loading timeout - continuing with test');
      }
    }
    
    // Wait a bit for UI to stabilize
    await this.page.waitForTimeout(1000);
  }

  /**
   * Search for an object
   */
  async searchObject(query: string) {
    await this.searchButton.click();
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for search debounce
  }

  /**
   * Select search result by index
   */
  async selectSearchResult(index: number = 0) {
    const results = this.searchResults.locator('[role="option"], [data-testid="search-result-item"], .search-result-item');
    await results.nth(index).click();
  }

  /**
   * Open advanced search dialog
   */
  async openAdvancedSearch() {
    await this.advancedSearchButton.click();
    await expect(this.advancedSearchDialog).toBeVisible();
  }

  /**
   * Zoom in
   */
  async zoomIn(times: number = 1) {
    for (let i = 0; i < times; i++) {
      await this.zoomInButton.click();
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Zoom out
   */
  async zoomOut(times: number = 1) {
    for (let i = 0; i < times; i++) {
      await this.zoomOutButton.click();
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Reset view
   */
  async resetView() {
    await this.resetViewButton.click();
  }

  /**
   * Open settings panel
   */
  async openSettings() {
    const splash = this.page.locator('[data-testid="splash-screen"]').first();
    const skipHint = this.page.getByText(/press any key or click to skip|按任意键或点击跳过/i).first();
    const dialogOverlay = this.page.locator('[data-slot="dialog-overlay"][data-state="open"]').first();
    for (let attempt = 0; attempt < 3; attempt++) {
      const splashVisible = await splash.isVisible().catch(() => false);
      const hintVisible = await skipHint.isVisible().catch(() => false);
      const overlayVisible = await dialogOverlay.isVisible().catch(() => false);

      if (splashVisible) {
        await splash.click({ timeout: TEST_TIMEOUTS.short, force: true }).catch(() => {});
      } else if (hintVisible) {
        await skipHint.click({ timeout: TEST_TIMEOUTS.short, force: true }).catch(() => {});
      }

      if (overlayVisible) {
        await dialogOverlay.click({ force: true }).catch(() => {});
      }

      await this.page.keyboard.press('Escape').catch(() => {});
      const hidden = await splash.isHidden().catch(() => false);
      const overlayHidden = await dialogOverlay.isHidden().catch(() => false);
      if (hidden && overlayHidden) break;
      await this.page.waitForTimeout(250);
    }

    const settingsButton = this.settingsButton.first();
    if (await settingsButton.count()) {
      await settingsButton.click({ force: true });
    } else {
      await this.page.getByRole('button', { name: /settings/i }).first().click({ force: true });
    }

    await expect(this.settingsPanel.first()).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
  }

  /**
   * Close settings panel
   */
  async closeSettings() {
    await this.page.keyboard.press('Escape');
    await expect(this.settingsPanel).toBeHidden();
  }

  /**
   * Toggle display setting
   */
  async toggleDisplaySetting(settingName: string) {
    const toggle = this.settingsPanel.getByRole('switch', { name: new RegExp(settingName, 'i') });
    await toggle.click();
  }

  /**
   * Open shot list panel
   */
  async openShotList() {
    await this.shotListButton.click();
    await expect(this.shotListPanel).toBeVisible();
  }

  /**
   * Add current object to shot list
   */
  async addToShotList() {
    await this.addToListButton.click();
  }

  /**
   * Get shot list count
   */
  async getShotListCount(): Promise<number> {
    return await this.shotListItems.count();
  }

  /**
   * Open exposure calculator
   */
  async openExposureCalculator() {
    await this.exposureCalculatorButton.click();
    await expect(this.exposureCalculatorPanel).toBeVisible();
  }

  /**
   * Open FOV simulator
   */
  async openFOVSimulator() {
    await this.fovSimulatorButton.click();
    await expect(this.fovSimulatorPanel).toBeVisible();
  }

  /**
   * Open ocular simulator
   */
  async openOcularSimulator() {
    await this.ocularSimulatorButton.click();
    await expect(this.ocularSimulatorPanel).toBeVisible();
  }

  /**
   * Open satellite tracker
   */
  async openSatelliteTracker() {
    await this.satelliteTrackerButton.click();
    await expect(this.satelliteTrackerPanel).toBeVisible();
  }

  /**
   * Open events calendar
   */
  async openEventsCalendar() {
    await this.eventsCalendarButton.click();
    await expect(this.eventsCalendarPanel).toBeVisible();
  }

  /**
   * Open tonight recommendations
   */
  async openTonightRecommendations() {
    await this.tonightButton.click();
    await expect(this.tonightPanel).toBeVisible();
  }

  async openDailyKnowledge() {
    await this.dailyKnowledgeButton.click();
    await expect(this.dailyKnowledgeDialog).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
  }

  /**
   * Open sky atlas
   */
  async openSkyAtlas() {
    await this.stellariumLoadingOverlay.waitFor({ state: 'hidden', timeout: TEST_TIMEOUTS.long * 2 });
    const telescopeButtons = this.page
      .locator('button.toolbar-btn')
      .filter({ has: this.page.locator('svg.lucide-telescope') });
    const telescopeCount = await telescopeButtons.count();
    for (let i = 0; i < telescopeCount; i++) {
      const btn = telescopeButtons.nth(i);
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await expect(this.skyAtlasPanel).toBeVisible({ timeout: TEST_TIMEOUTS.long });
        return;
      }
    }

    await this.skyAtlasButton.click();
    await expect(this.skyAtlasPanel).toBeVisible({ timeout: TEST_TIMEOUTS.long });
  }

  async setSkyAtlasAutoCloseAfterGoTo(enabled: boolean) {
    await expect(this.skyAtlasAutoCloseSwitch).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    const state = await this.skyAtlasAutoCloseSwitch.getAttribute('data-state');
    const isChecked = state === 'checked';
    if (isChecked !== enabled) {
      await this.skyAtlasAutoCloseSwitch.click();
    }
    await expect(this.skyAtlasAutoCloseSwitch).toHaveAttribute(
      'data-state',
      enabled ? 'checked' : 'unchecked'
    );
  }

  async searchSkyAtlasByName(query: string) {
    await expect(this.skyAtlasPanel).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    await this.skyAtlasPanel
      .locator('[data-slot="badge"]')
      .first()
      .waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.long })
      .catch(() => {});
    await this.skyAtlasNameFilterInput.fill(query);
    await this.page.waitForTimeout(350);
    await this.skyAtlasSearchButton.click();
  }

  getSkyAtlasResultCardByText(text: string | RegExp) {
    return this.skyAtlasResultCards.filter({ hasText: text }).first();
  }

  async selectSkyAtlasObject(text: string | RegExp) {
    const card = this.getSkyAtlasResultCardByText(text);
    await expect(card).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    await card.click();
  }

  async clickSkyAtlasGoTo(text: string | RegExp) {
    const card = this.getSkyAtlasResultCardByText(text);
    await expect(card).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    const goToButton = card
      .locator('button')
      .filter({ has: this.page.locator('svg.lucide-target') })
      .first();
    await goToButton.click();
  }

  async clickSkyAtlasAddToShotList(text: string | RegExp) {
    const card = this.getSkyAtlasResultCardByText(text);
    await expect(card).toBeVisible({ timeout: TEST_TIMEOUTS.long });
    const addPlusButton = card
      .locator('button')
      .filter({ has: this.page.locator('svg.lucide-plus') });
    const addCheckButton = card
      .locator('button')
      .filter({ has: this.page.locator('svg.lucide-check') });
    const addButton = addPlusButton.or(addCheckButton).first();
    await addButton.click();
  }

  async expectSonnerToast(text: string | RegExp) {
    const toast = this.sonnerToasts.filter({ hasText: text }).first();
    await expect(toast).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
  }

  /**
   * Open cache manager
   */
  async openCacheManager() {
    await this.cacheManagerButton.click();
    await expect(this.cacheManagerPanel).toBeVisible();
  }

  /**
   * Open equipment manager
   */
  async openEquipmentManager() {
    await this.equipmentManagerButton.click();
    await expect(this.equipmentManagerPanel).toBeVisible();
  }

  /**
   * Open location manager
   */
  async openLocationManager() {
    await this.locationManagerButton.click();
    await expect(this.locationManagerPanel).toBeVisible();
  }

  /**
   * Open marker manager
   */
  async openMarkerManager() {
    await this.markerManagerButton.click();
    await expect(this.markerManagerPanel).toBeVisible();
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    await this.themeToggle.click();
  }

  /**
   * Toggle night mode
   */
  async toggleNightMode() {
    await this.nightModeToggle.click();
  }

  /**
   * Switch language
   */
  async switchLanguage(locale: 'en' | 'zh') {
    await this.languageSwitcher.click();
    const langOption = this.page.getByRole('menuitem', { 
      name: locale === 'en' ? /english/i : /中文/i 
    });
    await langOption.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Right-click on canvas to open context menu
   */
  async openContextMenu(x?: number, y?: number) {
    const box = await this.canvas.boundingBox();
    if (box) {
      const clickX = x ?? box.x + box.width / 2;
      const clickY = y ?? box.y + box.height / 2;
      await this.page.mouse.click(clickX, clickY, { button: 'right' });
      await expect(this.contextMenu).toBeVisible();
    }
  }

  /**
   * Drag on canvas to pan view
   */
  async panView(startX: number, startY: number, endX: number, endY: number) {
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY, { steps: 10 });
    await this.page.mouse.up();
  }

  /**
   * Scroll on canvas to zoom
   */
  async scrollZoom(deltaY: number) {
    const box = await this.canvas.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.page.mouse.wheel(0, deltaY);
    }
  }

  /**
   * Click on canvas at position
   */
  async clickCanvas(x?: number, y?: number) {
    const box = await this.canvas.boundingBox();
    if (box) {
      const clickX = x ?? box.x + box.width / 2;
      const clickY = y ?? box.y + box.height / 2;
      await this.page.mouse.click(clickX, clickY);
    }
  }

  /**
   * Open about dialog
   */
  async openAboutDialog() {
    await this.aboutButton.click();
    await expect(this.aboutDialog).toBeVisible();
  }

  /**
   * Set time to now
   */
  async setTimeToNow() {
    await this.nowButton.click();
  }

  /**
   * Open object detail drawer
   */
  async openObjectDetails() {
    await this.detailsButton.click();
    await expect(this.objectDetailDrawer).toBeVisible();
  }

  /**
   * Close any open dialog
   */
  async closeDialog() {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Check if info panel is visible
   */
  async isInfoPanelVisible(): Promise<boolean> {
    return await this.exists(this.infoPanel);
  }

  /**
   * Get selected object name
   */
  async getSelectedObjectName(): Promise<string> {
    return await this.getText(this.objectName);
  }
}
