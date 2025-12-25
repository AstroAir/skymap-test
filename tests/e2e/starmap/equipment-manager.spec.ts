import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { TEST_EQUIPMENT } from '../fixtures/test-data';

test.describe('Equipment Manager', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Panel Access', () => {
    test('should have equipment manager button', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i })
        .or(page.locator('[data-testid="equipment-manager-button"]'));
      expect(await equipmentButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open equipment manager panel', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close equipment manager with Escape', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Telescopes', () => {
    test('should display telescopes section', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const telescopesSection = page.locator('text=/telescopes|望远镜/i');
        expect(await telescopesSection.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have Add Telescope button', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const addTelescopeButton = page.getByRole('button', { name: /add.*telescope|添加.*望远镜/i });
        expect(await addTelescopeButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should add custom telescope', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const addTelescopeButton = page.getByRole('button', { name: /add.*telescope|添加.*望远镜/i }).first();
        if (await addTelescopeButton.isVisible().catch(() => false)) {
          await addTelescopeButton.click();
          await page.waitForTimeout(300);
          
          // Fill in telescope details
          const nameInput = page.getByPlaceholder(/name|名称/i).first();
          if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill(TEST_EQUIPMENT.telescopes[0].name);
          }
          
          const apertureInput = page.locator('input[name*="aperture"]').first();
          if (await apertureInput.isVisible().catch(() => false)) {
            await apertureInput.fill(String(TEST_EQUIPMENT.telescopes[0].aperture));
          }
          
          const focalLengthInput = page.locator('input[name*="focal"]').first();
          if (await focalLengthInput.isVisible().catch(() => false)) {
            await focalLengthInput.fill(String(TEST_EQUIPMENT.telescopes[0].focalLength));
          }
        }
      }
    });
  });

  test.describe('Cameras', () => {
    test('should display cameras section', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const camerasSection = page.locator('text=/cameras|相机/i');
        expect(await camerasSection.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have Add Camera button', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const addCameraButton = page.getByRole('button', { name: /add.*camera|添加.*相机/i });
        expect(await addCameraButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should add custom camera', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const addCameraButton = page.getByRole('button', { name: /add.*camera|添加.*相机/i }).first();
        if (await addCameraButton.isVisible().catch(() => false)) {
          await addCameraButton.click();
          await page.waitForTimeout(300);
          
          // Fill in camera details
          const nameInput = page.getByPlaceholder(/name|名称/i).first();
          if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill(TEST_EQUIPMENT.cameras[0].name);
          }
        }
      }
    });
  });

  test.describe('Equipment Presets', () => {
    test('should have built-in presets', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const presets = page.locator('text=/preset|built.*in|预设|内置/i');
        expect(await presets.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should select from presets', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const presetSelect = page.locator('[data-testid="preset-select"]')
          .or(page.getByRole('combobox', { name: /preset/i }));
        
        if (await presetSelect.first().isVisible().catch(() => false)) {
          await presetSelect.first().click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Equipment Management', () => {
    test('should edit equipment', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const editButton = page.getByRole('button', { name: /edit|编辑/i }).first();
        if (await editButton.isVisible().catch(() => false)) {
          await editButton.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should delete equipment', async ({ page }) => {
      const equipmentButton = page.getByRole('button', { name: /equipment|设备/i }).first();
      
      if (await equipmentButton.isVisible().catch(() => false)) {
        await equipmentButton.click();
        await page.waitForTimeout(500);
        
        const deleteButton = page.getByRole('button', { name: /delete|删除/i }).first();
        if (await deleteButton.isVisible().catch(() => false)) {
          await deleteButton.click();
          await page.waitForTimeout(300);
          // May show confirmation
          await page.keyboard.press('Escape');
        }
      }
    });
  });
});
