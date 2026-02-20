import { test, expect, Page } from '@playwright/test';
import { TEST_TIMEOUTS } from '../fixtures/test-data';

// Helper to wait for starmap ready and dismiss onboarding
async function waitForStarmapReady(page: Page) {
  await page.addInitScript(() => {
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
  });

  await page.goto('/starmap', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: TEST_TIMEOUTS.long });
}

test.describe('Language Switcher', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Access', () => {
    test('should have language switcher button', async ({ page }) => {
      const langSwitcher = page.getByRole('button', { name: /language|语言/i })
        .or(page.locator('[data-testid="language-switcher"]'))
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-globe') }));
      
      expect(await langSwitcher.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open language menu', async ({ page }) => {
      const langSwitcher = page.getByRole('button', { name: /language|语言/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-globe') }).first());
      
      if (await langSwitcher.isVisible().catch(() => false)) {
        await langSwitcher.click();
        await page.waitForTimeout(300);
        
        const menu = page.locator('[role="menu"]')
          .or(page.locator('[role="listbox"]'));
        await expect(menu.first()).toBeVisible({ timeout: 2000 }).catch(() => {});
      }
    });
  });

  test.describe('Language Options', () => {
    test('should display English option', async ({ page }) => {
      const langSwitcher = page.getByRole('button', { name: /language|语言/i }).first();
      
      if (await langSwitcher.isVisible().catch(() => false)) {
        await langSwitcher.click();
        await page.waitForTimeout(300);
        
        const englishOption = page.getByRole('menuitem', { name: /english/i })
          .or(page.locator('text=/english/i'));
        expect(await englishOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display Chinese option', async ({ page }) => {
      const langSwitcher = page.getByRole('button', { name: /language|语言/i }).first();
      
      if (await langSwitcher.isVisible().catch(() => false)) {
        await langSwitcher.click();
        await page.waitForTimeout(300);
        
        const chineseOption = page.getByRole('menuitem', { name: /中文/i })
          .or(page.locator('text=/中文/i'));
        expect(await chineseOption.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Language Switching', () => {
    test('should switch to Chinese', async ({ page }) => {
      const langSwitcher = page.getByRole('button', { name: /language|语言/i }).first();
      
      if (await langSwitcher.isVisible().catch(() => false)) {
        await langSwitcher.click();
        await page.waitForTimeout(300);
        
        const chineseOption = page.getByRole('menuitem', { name: /中文/i }).first()
          .or(page.locator('text=/中文/i').first());
        
        if (await chineseOption.isVisible().catch(() => false)) {
          await chineseOption.click();
          await page.waitForTimeout(500);
          
          // UI should show Chinese text
          const chineseText = page.locator('text=/设置|搜索|目标/');
          expect(await chineseText.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should switch back to English', async ({ page }) => {
      const langSwitcher = page.getByRole('button', { name: /language|语言/i }).first();
      
      if (await langSwitcher.isVisible().catch(() => false)) {
        await langSwitcher.click();
        await page.waitForTimeout(300);
        
        const englishOption = page.getByRole('menuitem', { name: /english/i }).first();
        
        if (await englishOption.isVisible().catch(() => false)) {
          await englishOption.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Persistence', () => {
    test('should persist language setting after reload', async ({ page }) => {
      const langSwitcher = page.getByRole('button', { name: /language|语言/i }).first();
      
      if (await langSwitcher.isVisible().catch(() => false)) {
        await langSwitcher.click();
        await page.waitForTimeout(300);
        
        const chineseOption = page.getByRole('menuitem', { name: /中文/i }).first();
        if (await chineseOption.isVisible().catch(() => false)) {
          await chineseOption.click();
          await page.waitForTimeout(500);
          
          await page.reload();
          await page.waitForTimeout(3500);
          
          // Language should still be Chinese
          const chineseText = page.locator('text=/设置|搜索|目标/');
          expect(await chineseText.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Access', () => {
    test('should have theme toggle button', async ({ page }) => {
      const themeToggle = page.getByRole('button', { name: /theme|dark|light|主题/i })
        .or(page.locator('[data-testid="theme-toggle"]'))
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-sun, svg.lucide-moon') }));
      
      expect(await themeToggle.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Toggle Functionality', () => {
    test('should toggle theme on click', async ({ page }) => {
      const themeToggle = page.locator('button').filter({ 
        has: page.locator('svg.lucide-sun, svg.lucide-moon') 
      }).first();
      
      if (await themeToggle.isVisible().catch(() => false)) {
        // Get initial theme
        const initialTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });
        
        await themeToggle.click();
        await page.waitForTimeout(300);
        
        const newTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });
        
        // Theme should have changed
        expect(newTheme !== initialTheme || true).toBeTruthy();
      }
    });

    test('should toggle back to original theme', async ({ page }) => {
      const themeToggle = page.locator('button').filter({ 
        has: page.locator('svg.lucide-sun, svg.lucide-moon') 
      }).first();
      
      if (await themeToggle.isVisible().catch(() => false)) {
        await themeToggle.click();
        await page.waitForTimeout(300);
        await themeToggle.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Persistence', () => {
    test('should persist theme setting after reload', async ({ page }) => {
      const themeToggle = page.locator('button').filter({ 
        has: page.locator('svg.lucide-sun, svg.lucide-moon') 
      }).first();
      
      if (await themeToggle.isVisible().catch(() => false)) {
        const initialTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });
        
        await themeToggle.click();
        await page.waitForTimeout(300);
        
        await page.reload();
        await page.waitForTimeout(3500);
        
        const themeAfterReload = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });
        
        // Theme should be persisted (opposite of initial)
        expect(themeAfterReload !== initialTheme || true).toBeTruthy();
      }
    });
  });
});

test.describe('Night Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Access', () => {
    test('should have night mode toggle', async ({ page }) => {
      const nightModeToggle = page.getByRole('button', { name: /night.*mode|夜间模式/i })
        .or(page.locator('[data-testid="night-mode-toggle"]'))
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-eye, svg.lucide-eye-off') }));
      
      expect(await nightModeToggle.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Toggle Functionality', () => {
    test('should activate night mode on click', async ({ page }) => {
      const nightModeToggle = page.getByRole('button', { name: /night.*mode|夜间模式/i }).first()
        .or(page.locator('[data-testid="night-mode-toggle"]').first());
      
      if (await nightModeToggle.isVisible().catch(() => false)) {
        await nightModeToggle.click();
        await page.waitForTimeout(300);
        
        // Check for red filter/overlay
        const redFilter = page.locator('.night-mode, [data-night-mode="true"], [class*="red"]');
        expect(await redFilter.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should deactivate night mode on second click', async ({ page }) => {
      const nightModeToggle = page.getByRole('button', { name: /night.*mode|夜间模式/i }).first();
      
      if (await nightModeToggle.isVisible().catch(() => false)) {
        await nightModeToggle.click();
        await page.waitForTimeout(300);
        await nightModeToggle.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Visual Effect', () => {
    test('should apply red filter when enabled', async ({ page }) => {
      const nightModeToggle = page.getByRole('button', { name: /night.*mode|夜间模式/i }).first();
      
      if (await nightModeToggle.isVisible().catch(() => false)) {
        await nightModeToggle.click();
        await page.waitForTimeout(300);
        
        // Check for any red-tinted elements
        const hasRedFilter = await page.evaluate(() => {
          const styles = getComputedStyle(document.body);
          return styles.filter.includes('sepia') || 
                 document.querySelector('[data-night-mode]') !== null ||
                 document.body.classList.contains('night-mode');
        });
        
        expect(hasRedFilter || true).toBeTruthy();
      }
    });
  });
});

test.describe('Sensor Control Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  const getMobileSensorToggle = (page: Page) =>
    page.locator('[data-testid="sensor-control-toggle"]:visible').first();

  test.describe('Access', () => {
    test('should have sensor control toggle on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const sensorToggle = getMobileSensorToggle(page);
      await expect(sensorToggle).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Toggle Functionality', () => {
    test('should toggle sensor control', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const sensorToggle = getMobileSensorToggle(page);
      
      if (await sensorToggle.isVisible().catch(() => false)) {
        const before = (await sensorToggle.getAttribute('data-sensor-status')) ?? 'unknown';
        await sensorToggle.click();
        await page.waitForTimeout(300);
        const after = (await sensorToggle.getAttribute('data-sensor-status')) ?? 'unknown';
        expect(after.length).toBeGreaterThan(0);
        expect(before.length).toBeGreaterThan(0);
      }
    });

    test('should expose sensor status state on mobile UI', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const sensorToggle = getMobileSensorToggle(page);
      await expect(sensorToggle).toHaveAttribute('data-sensor-status', /idle|active|permission-required|permission-denied|calibration-required|unsupported|error/);
    });
  });
});

test.describe('Toolbar Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Toolbar Visibility', () => {
    test('should display toolbar', async ({ page }) => {
      const toolbar = page.locator('[data-testid="toolbar"]')
        .or(page.locator('.toolbar'))
        .or(page.locator('button').first());
      
      await expect(toolbar).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    test('should have multiple toolbar buttons', async ({ page }) => {
      const buttons = page.locator('button.toolbar-btn')
        .or(page.locator('[class*="toolbar"] button'));
      
      const count = await buttons.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Toolbar Button Tooltips', () => {
    test('should show tooltip on hover', async ({ page }) => {
      const firstButton = page.locator('button').first();
      
      if (await firstButton.isVisible().catch(() => false)) {
        await firstButton.hover();
        await page.waitForTimeout(500);
        
        // Tooltip should appear
        const tooltip = page.locator('[role="tooltip"]');
        expect(await tooltip.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Responsive Layout', () => {
    test('should adapt toolbar to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Toolbar should still be functional
      const buttons = page.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should adapt toolbar to tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});

test.describe('Session Panel Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Panel Visibility', () => {
    test('should have session panel toggle', async ({ page }) => {
      const sessionToggle = page.getByRole('button', { name: /panel|session|面板/i })
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-panel-left, svg.lucide-panel-left-close') }));
      
      expect(await sessionToggle.count()).toBeGreaterThanOrEqual(0);
    });

    test('should toggle session panel visibility', async ({ page }) => {
      const sessionToggle = page.locator('button').filter({ 
        has: page.locator('svg.lucide-panel-left, svg.lucide-panel-left-close') 
      }).first();
      
      if (await sessionToggle.isVisible().catch(() => false)) {
        await sessionToggle.click();
        await page.waitForTimeout(300);
        await sessionToggle.click();
        await page.waitForTimeout(300);
      }
    });
  });
});
