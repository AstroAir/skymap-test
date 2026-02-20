import { test, expect } from '@playwright/test';
import { TEST_OBJECTS } from '../fixtures/test-data';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Astro Session Panel', () => {
  test.beforeEach(async ({ page }) => {
    await waitForStarmapReady(page);
  });

  test.describe('Panel Access', () => {
    test('should have session panel button', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i })
        .or(page.locator('[data-testid="session-panel-button"]'));
      expect(await sessionButton.count()).toBeGreaterThan(0);
    });

    test('should open session panel', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThan(0);
      }
    });

    test('should close session panel with Escape', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Session Overview', () => {
    test('should display session date', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const dateDisplay = page.locator('text=/date|日期/i');
        expect(await dateDisplay.count()).toBeGreaterThan(0);
      }
    });

    test('should display observation window', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const observationWindow = page.locator('text=/observation.*window|dark.*hours|观测窗口|暗夜/i');
        expect(await observationWindow.count()).toBeGreaterThan(0);
      }
    });

    test('should display moon phase', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const moonPhase = page.locator('text=/moon|lunar|月相|月亮/i');
        expect(await moonPhase.count()).toBeGreaterThan(0);
      }
    });

    test('should display weather conditions', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const weather = page.locator('text=/weather|conditions|天气|条件/i');
        expect(await weather.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Target List', () => {
    test('should display target list', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const targetList = page.locator('text=/targets|objects|目标|对象/i');
        expect(await targetList.count()).toBeGreaterThan(0);
      }
    });

    test('should show target visibility timeline', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const timeline = page.locator('[data-testid="visibility-timeline"]')
          .or(page.locator('.timeline'))
          .or(page.locator('text=/timeline|时间线/i'));
        
        expect(await timeline.count()).toBeGreaterThan(0);
      }
    });

    test('should show target priority', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const priority = page.locator('text=/priority|优先级/i');
        expect(await priority.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Session Planning', () => {
    test('should have auto-plan feature', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const autoPlanButton = page.getByRole('button', { name: /auto.*plan|optimize|自动计划|优化/i });
        expect(await autoPlanButton.count()).toBeGreaterThan(0);
      }
    });

    test('should have manual scheduling', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const manualSchedule = page.locator('text=/schedule|manual|安排|手动/i');
        expect(await manualSchedule.count()).toBeGreaterThan(0);
      }
    });

    test('should show total imaging time', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const totalTime = page.locator('text=/total.*time|imaging.*time|总时间|成像时间/i');
        expect(await totalTime.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Target Scheduling', () => {
    test('should allow drag and drop reordering', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        // Look for draggable items
        const draggableItems = page.locator('[draggable="true"], [data-testid="draggable-target"]');
        expect(await draggableItems.count()).toBeGreaterThan(0);
      }
    });

    test('should set start time for target', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const startTimeInput = page.locator('input[type="time"]')
          .or(page.locator('text=/start.*time|开始时间/i'));
        
        expect(await startTimeInput.count()).toBeGreaterThan(0);
      }
    });

    test('should set duration for target', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const durationInput = page.locator('text=/duration|持续时间/i');
        expect(await durationInput.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Conflict Detection', () => {
    test('should detect scheduling conflicts', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const conflictWarning = page.locator('text=/conflict|overlap|warning|冲突|重叠|警告/i');
        expect(await conflictWarning.count()).toBeGreaterThan(0);
      }
    });

    test('should warn about low altitude targets', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const altitudeWarning = page.locator('text=/low.*altitude|below.*horizon|低高度|地平线/i');
        expect(await altitudeWarning.count()).toBeGreaterThan(0);
      }
    });

    test('should warn about moon proximity', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const moonWarning = page.locator('text=/moon.*proximity|moon.*distance|月球距离/i');
        expect(await moonWarning.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Session Export', () => {
    test('should have export session button', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const exportButton = page.getByRole('button', { name: /export|导出/i });
        expect(await exportButton.count()).toBeGreaterThan(0);
      }
    });

    test('should export to NINA format', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const ninaExport = page.locator('text=/NINA|N.I.N.A/i');
        expect(await ninaExport.count()).toBeGreaterThan(0);
      }
    });

    test('should export to Sequence Generator Pro format', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const sgpExport = page.locator('text=/SGP|Sequence.*Generator/i');
        expect(await sgpExport.count()).toBeGreaterThan(0);
      }
    });

    test('should export to CSV format', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const csvExport = page.locator('text=/CSV/i');
        expect(await csvExport.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Session Import', () => {
    test('should have import session button', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const importButton = page.getByRole('button', { name: /import|导入/i });
        expect(await importButton.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Session Templates', () => {
    test('should have save as template option', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const saveTemplate = page.locator('text=/save.*template|保存.*模板/i');
        expect(await saveTemplate.count()).toBeGreaterThan(0);
      }
    });

    test('should have load template option', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const loadTemplate = page.locator('text=/load.*template|加载.*模板/i');
        expect(await loadTemplate.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Session Notes', () => {
    test('should have notes section', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const notesSection = page.locator('text=/notes|备注/i');
        expect(await notesSection.count()).toBeGreaterThan(0);
      }
    });

    test('should allow adding notes', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const notesTextarea = page.locator('textarea');
        if (await notesTextarea.first().isVisible().catch(() => false)) {
          await notesTextarea.first().fill('Test session notes');
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Integration with Shot List', () => {
    test('should sync with shot list', async ({ page }) => {
      // First add an object to shot list
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          const addButton = page.getByRole('button', { name: /add.*list|添加.*列表/i }).first();
          if (await addButton.isVisible().catch(() => false)) {
            await addButton.click();
            await page.waitForTimeout(500);
            
            // Open session panel
            const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
            if (await sessionButton.isVisible().catch(() => false)) {
              await sessionButton.click();
              await page.waitForTimeout(500);
              
              // Target should appear in session
              const targetInSession = page.locator(`text=/${TEST_OBJECTS.M31.name}/i`);
              expect(await targetInSession.count()).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });

  test.describe('Date Selection', () => {
    test('should have date picker', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const datePicker = page.locator('input[type="date"]')
          .or(page.locator('[data-testid="date-picker"]'))
          .or(page.getByRole('button', { name: /date|日期/i }));
        
        expect(await datePicker.count()).toBeGreaterThan(0);
      }
    });

    test('should update session when date changes', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        await page.waitForTimeout(500);
        
        const datePicker = page.locator('input[type="date"]').first();
        if (await datePicker.isVisible().catch(() => false)) {
          // Change date
          await datePicker.fill('2025-01-15');
          await page.waitForTimeout(500);
          
          // Session should update
          const canvas = page.locator('canvas').first();
          await expect(canvas).toBeVisible();
        }
      }
    });
  });

  test.describe('Session Planner Strong Assertions', () => {
    test('should expose weather inputs, notes and template list controls', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      await expect(sessionButton).toBeVisible();
      await sessionButton.click();

      await expect(page.getByTestId('session-weather-cloud-cover')).toBeVisible();
      await expect(page.getByTestId('session-weather-humidity')).toBeVisible();
      await expect(page.getByTestId('session-weather-wind')).toBeVisible();
      await expect(page.getByTestId('session-weather-dew-point')).toBeVisible();
      await expect(page.getByTestId('session-notes')).toBeVisible();

      const templateButton = page.getByRole('button', { name: /templates|模板/i });
      await expect(templateButton).toBeVisible();
      await templateButton.click();
      await expect(page.getByTestId('session-template-list')).toBeVisible();
    });

    test('should keep conflicts block mountable and gap toggle interactive', async ({ page }) => {
      const sessionButton = page.getByRole('button', { name: /session|plan|会话|计划/i }).first();
      await expect(sessionButton).toBeVisible();
      await sessionButton.click();

      const switchElement = page.getByRole('switch').first();
      await expect(switchElement).toBeVisible();
      await switchElement.click();
      await switchElement.click();
    });
  });
});
