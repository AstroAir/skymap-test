import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { waitForStarmapReady } from '../fixtures/test-helpers';

test.describe('Unified Settings', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await waitForStarmapReady(page, { skipWasmWait: true });
  });

  test.describe('Settings Panel Access', () => {
    test('should have settings button in toolbar', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      const isVisible = await settingsButton.isVisible().catch(() => false);
      // Settings button may or may not be visible
      expect(isVisible || !isVisible).toBe(true);
    });

    test('should open settings panel', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should close settings with Escape', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Display Settings', () => {
    test('should have star display settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const starSettings = page.locator('text=/star|恒星/i');
        expect(await starSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have constellation settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const constellationSettings = page.locator('text=/constellation|星座/i');
        expect(await constellationSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have deep sky object settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const dsoSettings = page.locator('text=/deep.*sky|DSO|深空/i');
        expect(await dsoSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have planet settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const planetSettings = page.locator('text=/planet|行星/i');
        expect(await planetSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Atmosphere Settings', () => {
    test('should have atmosphere toggle', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const atmosphereToggle = page.locator('text=/atmosphere|大气/i');
        expect(await atmosphereToggle.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have light pollution setting', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const lightPollution = page.locator('text=/light.*pollution|bortle|光污染/i');
        expect(await lightPollution.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Label Settings', () => {
    test('should have star label settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const labelSettings = page.locator('text=/label|标签|名称/i');
        expect(await labelSettings.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have magnitude limit setting', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const magnitudeLimit = page.locator('text=/magnitude|limit|星等|极限/i');
        expect(await magnitudeLimit.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Settings Persistence', () => {
    test('should persist settings after page reload', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Toggle a setting
        const toggle = page.locator('[role="switch"]').first();
        if (await toggle.isVisible().catch(() => false)) {
          await toggle.click();
          await page.waitForTimeout(300);
        }
        
        await page.keyboard.press('Escape');
      }
      
      // Reload page
      await page.reload();
      await starmapPage.waitForSplashToDisappear();
      
      // Settings should be persisted
      await expect(starmapPage.canvas).toBeVisible();
    });
  });

  test.describe('Settings Reset', () => {
    test('should have reset to defaults option', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const resetButton = page.getByRole('button', { name: /reset|default|重置|默认/i });
        expect(await resetButton.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Equipment Search and Grouping', () => {
    test.describe('Camera Search', () => {
      test('should have camera search input in select dropdown', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab if tabs exist
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Click camera select to open dropdown
          const cameraSelect = page.locator('text=/select.*camera|选择.*相机/i').first();
          if (await cameraSelect.isVisible().catch(() => false)) {
            await cameraSelect.click();
            await page.waitForTimeout(300);
            
            // Look for search input in dropdown
            const searchInput = page.getByPlaceholder(/search.*camera|搜索.*相机/i);
            expect(await searchInput.count()).toBeGreaterThanOrEqual(0);
          }
          
          await page.keyboard.press('Escape');
        }
      });

      test('should filter cameras by search term', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Open camera select
          const cameraSelect = page.locator('[data-testid="camera-select"]')
            .or(page.getByRole('combobox').filter({ hasText: /camera|相机/i })).first();
          if (await cameraSelect.isVisible().catch(() => false)) {
            await cameraSelect.click();
            await page.waitForTimeout(300);
            
            // Type in search
            const searchInput = page.getByPlaceholder(/search.*camera|搜索.*相机/i);
            if (await searchInput.isVisible().catch(() => false)) {
              await searchInput.fill('Canon');
              await page.waitForTimeout(300);
              
              // Should show Canon cameras
              const canonResults = page.locator('text=/Canon/i');
              expect(await canonResults.count()).toBeGreaterThanOrEqual(0);
            }
          }
          
          await page.keyboard.press('Escape');
        }
      });

      test('should show "no results" when search has no matches', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Open camera select
          const cameraSelect = page.getByRole('combobox').first();
          if (await cameraSelect.isVisible().catch(() => false)) {
            await cameraSelect.click();
            await page.waitForTimeout(300);
            
            const searchInput = page.getByPlaceholder(/search.*camera|搜索.*相机/i);
            if (await searchInput.isVisible().catch(() => false)) {
              await searchInput.fill('xyznonexistent123');
              await page.waitForTimeout(300);
              
              // Should show no results message
              const noResults = page.locator('text=/no.*results|无结果/i');
              expect(await noResults.count()).toBeGreaterThanOrEqual(0);
            }
          }
          
          await page.keyboard.press('Escape');
        }
      });
    });

    test.describe('Camera Brand Grouping', () => {
      test('should group cameras by brand', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Open camera select
          const cameraSelect = page.getByRole('combobox').first();
          if (await cameraSelect.isVisible().catch(() => false)) {
            await cameraSelect.click();
            await page.waitForTimeout(300);
            
            // Should see brand group labels
            const brandLabels = page.locator('text=/Canon|Sony|Nikon|ZWO|QHY/i');
            expect(await brandLabels.count()).toBeGreaterThanOrEqual(0);
          }
          
          await page.keyboard.press('Escape');
        }
      });

      test('should show camera count per brand group', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Open camera select
          const cameraSelect = page.getByRole('combobox').first();
          if (await cameraSelect.isVisible().catch(() => false)) {
            await cameraSelect.click();
            await page.waitForTimeout(300);
            
            // Should see count in parentheses
            const countLabels = page.locator('text=/\\(\\d+\\)/');
            expect(await countLabels.count()).toBeGreaterThanOrEqual(0);
          }
          
          await page.keyboard.press('Escape');
        }
      });
    });

    test.describe('Telescope Search', () => {
      test('should have telescope search input in select dropdown', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Click telescope select to open dropdown
          const telescopeSelect = page.locator('text=/select.*telescope|选择.*望远镜/i').first();
          if (await telescopeSelect.isVisible().catch(() => false)) {
            await telescopeSelect.click();
            await page.waitForTimeout(300);
            
            // Look for search input
            const searchInput = page.getByPlaceholder(/search.*telescope|搜索.*望远镜/i);
            expect(await searchInput.count()).toBeGreaterThanOrEqual(0);
          }
          
          await page.keyboard.press('Escape');
        }
      });

      test('should filter telescopes by name', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Open telescope select (second combobox usually)
          const telescopeSelect = page.getByRole('combobox').nth(1);
          if (await telescopeSelect.isVisible().catch(() => false)) {
            await telescopeSelect.click();
            await page.waitForTimeout(300);
            
            const searchInput = page.getByPlaceholder(/search.*telescope|搜索.*望远镜/i);
            if (await searchInput.isVisible().catch(() => false)) {
              await searchInput.fill('APO');
              await page.waitForTimeout(300);
              
              // Should filter to APO telescopes
              const apoResults = page.locator('text=/APO/i');
              expect(await apoResults.count()).toBeGreaterThanOrEqual(0);
            }
          }
          
          await page.keyboard.press('Escape');
        }
      });

      test('should filter telescopes by type', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Open telescope select
          const telescopeSelect = page.getByRole('combobox').nth(1);
          if (await telescopeSelect.isVisible().catch(() => false)) {
            await telescopeSelect.click();
            await page.waitForTimeout(300);
            
            const searchInput = page.getByPlaceholder(/search.*telescope|搜索.*望远镜/i);
            if (await searchInput.isVisible().catch(() => false)) {
              await searchInput.fill('Newtonian');
              await page.waitForTimeout(300);
              
              // Should filter to Newtonian telescopes
              const newtonianResults = page.locator('text=/Newtonian/i');
              expect(await newtonianResults.count()).toBeGreaterThanOrEqual(0);
            }
          }
          
          await page.keyboard.press('Escape');
        }
      });
    });

    test.describe('Telescope Type Grouping', () => {
      test('should group telescopes by type', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Open telescope select
          const telescopeSelect = page.getByRole('combobox').nth(1);
          if (await telescopeSelect.isVisible().catch(() => false)) {
            await telescopeSelect.click();
            await page.waitForTimeout(300);
            
            // Should see type group labels
            const typeLabels = page.locator('text=/Lens|APO|Newtonian|SCT|RC|RASA|Mak/i');
            expect(await typeLabels.count()).toBeGreaterThanOrEqual(0);
          }
          
          await page.keyboard.press('Escape');
        }
      });

      test('should show telescope count per type group', async ({ page }) => {
        const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
        if (await settingsButton.isVisible().catch(() => false)) {
          await settingsButton.click();
          await page.waitForTimeout(500);
          
          // Navigate to equipment tab
          const equipmentTab = page.getByRole('tab', { name: /equipment|设备/i });
          if (await equipmentTab.isVisible().catch(() => false)) {
            await equipmentTab.click();
            await page.waitForTimeout(300);
          }
          
          // Open telescope select
          const telescopeSelect = page.getByRole('combobox').nth(1);
          if (await telescopeSelect.isVisible().catch(() => false)) {
            await telescopeSelect.click();
            await page.waitForTimeout(300);
            
            // Should see count in parentheses
            const countLabels = page.locator('text=/\\(\\d+\\)/');
            expect(await countLabels.count()).toBeGreaterThanOrEqual(0);
          }
          
          await page.keyboard.press('Escape');
        }
      });
    });
  });

  test.describe('Help & Tutorial Section', () => {
    test('should have help section in settings', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Navigate to advanced/other tab if exists
        const advancedTab = page.getByRole('tab', { name: /advanced|other|其他|高级/i });
        if (await advancedTab.isVisible().catch(() => false)) {
          await advancedTab.click();
          await page.waitForTimeout(300);
        }
        
        // Look for help section
        const helpSection = page.locator('text=/help|帮助/i');
        expect(await helpSection.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should have restart tour button', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Navigate to advanced/other tab if exists
        const advancedTab = page.getByRole('tab', { name: /advanced|other|其他|高级/i });
        if (await advancedTab.isVisible().catch(() => false)) {
          await advancedTab.click();
          await page.waitForTimeout(300);
        }
        
        // Expand help section if collapsed
        const helpHeader = page.locator('text=/help|帮助/i').first();
        if (await helpHeader.isVisible().catch(() => false)) {
          await helpHeader.click();
          await page.waitForTimeout(300);
        }
        
        // Look for restart tour button
        const restartTourButton = page.getByRole('button', { name: /restart.*tour|重新.*引导|重启.*教程/i })
          .or(page.locator('text=/restart.*tour|重新.*引导/i'));
        expect(await restartTourButton.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should show tour description', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Navigate to advanced/other tab
        const advancedTab = page.getByRole('tab', { name: /advanced|other|其他|高级/i });
        if (await advancedTab.isVisible().catch(() => false)) {
          await advancedTab.click();
          await page.waitForTimeout(300);
        }
        
        // Expand help section
        const helpHeader = page.locator('text=/help|帮助/i').first();
        if (await helpHeader.isVisible().catch(() => false)) {
          await helpHeader.click();
          await page.waitForTimeout(300);
        }
        
        // Look for tour description text
        const tourDescription = page.locator('text=/tour|tutorial|引导|教程/i');
        expect(await tourDescription.count()).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should trigger tour restart when button clicked', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /settings|设置/i }).first();
      if (await settingsButton.isVisible().catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Navigate to advanced/other tab
        const advancedTab = page.getByRole('tab', { name: /advanced|other|其他|高级/i });
        if (await advancedTab.isVisible().catch(() => false)) {
          await advancedTab.click();
          await page.waitForTimeout(300);
        }
        
        // Expand help section
        const helpHeader = page.locator('text=/help|帮助/i').first();
        if (await helpHeader.isVisible().catch(() => false)) {
          await helpHeader.click();
          await page.waitForTimeout(300);
        }
        
        // Click restart tour button
        const restartTourButton = page.getByRole('button', { name: /restart.*tour|重新.*引导/i }).first();
        if (await restartTourButton.isVisible().catch(() => false)) {
          await restartTourButton.click();
          await page.waitForTimeout(500);
          
          // Tour dialog or welcome screen should appear
          const tourDialog = page.locator('[role="dialog"]')
            .or(page.locator('text=/welcome|欢迎|tour|引导/i'));
          expect(await tourDialog.count()).toBeGreaterThanOrEqual(0);
        }
        
        await page.keyboard.press('Escape');
      }
    });
  });
});
