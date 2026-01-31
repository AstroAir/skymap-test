# e2e-tests Module

[Root](../CLAUDE.md) > **tests/e2e**

> **Last Updated:** 2026-02-01
> **Module Type:** TypeScript (Playwright)

---

## Breadcrumb

`[Root](../CLAUDE.md) > **tests** > **e2e**`

---

## Module Responsibility

The `e2e` module contains Playwright end-to-end tests that verify the application works correctly from the user's perspective. Tests interact with the actual running application and simulate real user workflows.

**Design Principle:** Tests should be flake-free, maintainable, and focus on critical user paths.

---

## Test Structure

```
tests/e2e/
├── fixtures/
│   ├── page-objects/    # Page Object Model classes
│   ├── test-data.ts      # Test data constants
│   └── test-helpers.ts   # Test utility functions
├── starmap/              # Star map feature tests (60+ tests)
│   ├── info-panel.spec.ts
│   ├── session-panel.spec.ts
│   ├── zoom-controls.spec.ts
│   └── ...
├── home.spec.ts          # Home page tests
├── navigation.spec.ts    # Navigation tests
├── i18n.spec.ts          # Internationalization tests
├── theme.spec.ts         # Theme tests
├── accessibility.spec.ts # Accessibility tests
├── keyboard.spec.ts      # Keyboard shortcuts tests
├── performance.spec.ts   # Performance tests
├── global-setup.ts       # Global test setup
└── ...
```

---

## Page Objects

| Class | File | Purpose |
|-------|------|---------|
| `BasePage` | `page-objects/base.page.ts` | Base page object with common methods |
| `StarmapPage` | `page-objects/starmap.page.ts` | Star map page interactions |
| `HomePage` | `page-objects/home.page.ts` | Home page interactions |

### Usage

```typescript
import { test } from '@playwright/test';
import { StarmapPage } from './fixtures/page-objects/starmap.page';

test('search for object', async ({ page }) => {
  const starmap = new StarmapPage(page);
  await starmap.goto();
  await starmap.searchForObject('M31');
  await expect(starmap.infoPanel).toBeVisible();
});
```

---

## Test Configuration

**File:** `playwright.config.ts`

| Setting | Value |
|---------|-------|
| Test Dir | `./tests/e2e` |
| Base URL | `http://localhost:3001` |
| Browsers | Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari, Tablet |
| Timeout | 120s (extended for WASM) |
| Workers | 1 on CI, all local |

---

## Running Tests

```bash
# All tests
pnpm exec playwright test

# Specific browser
pnpm exec playwright test --project=chromium

# Specific file
pnpm exec playwright test tests/e2e/starmap/info-panel.spec.ts

# With UI
pnpm exec playwright test --ui

# Debug mode
pnpm exec playwright test --debug

# Show report
pnpm exec playwright show-report
```

---

## Test Fixtures

### test-data.ts

Common test data constants:

```typescript
export const TEST_OBJECTS = {
  M31: { name: 'M31', ra: 10.68, dec: 41.27 },
  ORION_NEBULA: { name: 'M42', ra: 83.63, dec: -5.39 },
  // ...
};
```

### test-helpers.ts

Utility functions:

```typescript
export async function waitForStellariumReady(page: Page): Promise<void>
export function mockTauriCommand(command: string, response: any): void
export async function takeScreenshot(page: Page, name: string): Promise<void>
```

---

## Writing Tests

### Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/starmap');
  });

  test('does something', async ({ page }) => {
    // Arrange
    const input = page.getByTestId('search-input');

    // Act
    await input.fill('M31');
    await page.keyboard.press('Enter');

    // Assert
    await expect(page.getByText('Andromeda Galaxy')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid** attributes for stable selectors
2. **Wait for elements** rather than using fixed delays
3. **Use Page Objects** for reusable interactions
4. **Test user outcomes**, not implementation details
5. **Keep tests independent** - each test should clean up after itself

---

## Common Assertions

```typescript
// Element visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toHaveText('expected text');

// Element state
await expect(button).toBeEnabled();
await expect(checkbox).toBeChecked();

// URL and navigation
await expect(page).toHaveURL('/starmap');
```

---

## Debugging

### Debug Test

```bash
pnpm exec playwright test --debug
```

### Inspect Selector

```bash
pnpm exec playwright codegen localhost:3001
```

### Trace Viewer

```bash
pnpm exec playwright show-trace trace.zip
```

---

## Related Files

- [`playwright.config.ts`](../../playwright.config.ts) - Playwright config
- [`global-setup.ts`](./global-setup.ts) - Global setup
- [`fixtures/`](./fixtures/) - Test fixtures
- [Root CLAUDE.md](../CLAUDE.md) - Project documentation
