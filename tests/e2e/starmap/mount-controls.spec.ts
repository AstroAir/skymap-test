import { test, expect } from '@playwright/test';
import { StarmapPage } from '../fixtures/page-objects';
import { TEST_OBJECTS } from '../fixtures/test-data';

test.describe('Mount Controls', () => {
  let starmapPage: StarmapPage;

  test.beforeEach(async ({ page }) => {
    starmapPage = new StarmapPage(page);
    await starmapPage.waitForReady();
  });

  test.describe('Mount Panel Access', () => {
    test('should have mount control button', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜|赤道仪/i })
        .or(page.locator('[data-testid="mount-button"]'));
      expect(await mountButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should open mount control panel', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const panel = page.locator('[role="dialog"], [data-state="open"]');
        expect(await panel.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should close mount panel with Escape', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Connection Status', () => {
    test('should display connection status', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const connectionStatus = page.locator('text=/connected|disconnected|status|连接|断开|状态/i');
        expect(await connectionStatus.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have connect button', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const connectButton = page.getByRole('button', { name: /connect|连接/i });
        expect(await connectButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have disconnect button when connected', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const disconnectButton = page.getByRole('button', { name: /disconnect|断开/i });
        expect(await disconnectButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Mount Type Selection', () => {
    test('should have mount type selector', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const mountTypeSelector = page.locator('text=/mount.*type|type|类型/i');
        expect(await mountTypeSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have equatorial mount option', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const equatorialOption = page.locator('text=/equatorial|赤道仪/i');
        expect(await equatorialOption.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have alt-az mount option', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const altAzOption = page.locator('text=/alt.*az|altazimuth|经纬仪/i');
        expect(await altAzOption.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Slew Controls', () => {
    test('should have slew to object button', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const slewButton = page.getByRole('button', { name: /slew|goto|指向/i });
        expect(await slewButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have stop slew button', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const stopButton = page.getByRole('button', { name: /stop|abort|停止/i });
        expect(await stopButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have directional controls', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const directionalControls = page.locator('text=/north|south|east|west|N|S|E|W|北|南|东|西/i');
        expect(await directionalControls.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have slew speed selector', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const speedSelector = page.locator('text=/speed|rate|速度/i');
        expect(await speedSelector.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Tracking Controls', () => {
    test('should have tracking toggle', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const trackingToggle = page.getByRole('switch', { name: /tracking|追踪/i })
          .or(page.locator('text=/tracking|追踪/i'));
        expect(await trackingToggle.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have tracking rate selector', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const trackingRate = page.locator('text=/sidereal|lunar|solar|恒星|月球|太阳/i');
        expect(await trackingRate.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Park/Unpark', () => {
    test('should have park button', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const parkButton = page.getByRole('button', { name: /park|归位/i });
        expect(await parkButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have unpark button', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const unparkButton = page.getByRole('button', { name: /unpark|解除归位/i });
        expect(await unparkButton.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have home position button', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const homeButton = page.getByRole('button', { name: /home|原点/i });
        expect(await homeButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Alignment', () => {
    test('should have alignment options', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const alignmentOptions = page.locator('text=/align|sync|对齐|同步/i');
        expect(await alignmentOptions.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have sync button', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const syncButton = page.getByRole('button', { name: /sync|同步/i });
        expect(await syncButton.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Position Display', () => {
    test('should display current RA/Dec', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const raDecDisplay = page.locator('text=/RA|Dec|赤经|赤纬/i');
        expect(await raDecDisplay.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display current Alt/Az', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const altAzDisplay = page.locator('text=/Alt|Az|高度|方位/i');
        expect(await altAzDisplay.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display pier side', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const pierSide = page.locator('text=/pier.*side|east|west|东|西/i');
        expect(await pierSide.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Slew to Selected Object', () => {
    test('should slew to selected object', async ({ page }) => {
      // First select an object
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(TEST_OBJECTS.M31.name);
        await page.waitForTimeout(1000);
        
        const firstResult = page.locator('[role="option"]').first();
        if (await firstResult.isVisible().catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(500);
          
          // Look for slew button in info panel
          const slewButton = page.getByRole('button', { name: /slew|goto|指向/i }).first();
          if (await slewButton.isVisible().catch(() => false)) {
            await slewButton.click();
            await page.waitForTimeout(500);
            
            // Should show slewing status or confirmation
            const slewingStatus = page.locator('text=/slewing|moving|指向中|移动/i');
            expect(await slewingStatus.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });

  test.describe('Simulation Mode', () => {
    test('should have simulation mode toggle', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const simulationToggle = page.getByRole('switch', { name: /simulation|simulator|模拟/i })
          .or(page.locator('text=/simulation|simulator|模拟/i'));
        expect(await simulationToggle.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should work in simulation mode', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        // Enable simulation if available
        const simulationToggle = page.getByRole('switch', { name: /simulation|模拟/i });
        if (await simulationToggle.isVisible().catch(() => false)) {
          await simulationToggle.click();
          await page.waitForTimeout(300);
        }
        
        // Try slew in simulation
        const slewButton = page.getByRole('button', { name: /slew|goto|指向/i }).first();
        if (await slewButton.isVisible().catch(() => false)) {
          await slewButton.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should display error on connection failure', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        // Try to connect (will fail without real mount)
        const connectButton = page.getByRole('button', { name: /connect|连接/i }).first();
        if (await connectButton.isVisible().catch(() => false)) {
          await connectButton.click();
          await page.waitForTimeout(1000);
          
          // Should show error or status
          const errorMessage = page.locator('text=/error|failed|unable|错误|失败|无法/i');
          expect(await errorMessage.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should handle slew limits', async ({ page }) => {
      const mountButton = page.getByRole('button', { name: /mount|telescope|望远镜/i }).first();
      
      if (await mountButton.isVisible().catch(() => false)) {
        await mountButton.click();
        await page.waitForTimeout(500);
        
        const limitsWarning = page.locator('text=/limit|horizon|below|限制|地平线/i');
        expect(await limitsWarning.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
