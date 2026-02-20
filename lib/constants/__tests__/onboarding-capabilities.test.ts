import { resolveTourSteps } from '../onboarding-capabilities';

describe('resolveTourSteps', () => {
  const baseContext = {
    isMobile: false,
    isTauri: false,
    skyEngine: 'stellarium',
    stelAvailable: true,
    featureVisibility: {},
  } as const;

  it('resolves core tour steps for desktop', () => {
    const { steps, skipped } = resolveTourSteps(baseContext, 'first-run-core');

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].id).toBe('welcome');
    expect(steps.some((step) => step.capabilityId === 'search')).toBe(true);
    expect(skipped).toEqual([]);
  });

  it('skips unavailable tauri-only capabilities', () => {
    const { steps, skipped } = resolveTourSteps(baseContext, 'module-imaging');

    expect(steps.some((step) => step.capabilityId === 'plate-solver')).toBe(false);
    expect(skipped.some((item) => item.capabilityId === 'plate-solver')).toBe(true);
  });

  it('skips mount controls when stellarium is unavailable', () => {
    const { steps, skipped } = resolveTourSteps(
      {
        ...baseContext,
        skyEngine: 'aladin',
        stelAvailable: false,
      },
      'module-controls',
    );

    expect(steps.some((step) => step.capabilityId === 'mount')).toBe(false);
    expect(skipped.some((item) => item.capabilityId === 'mount')).toBe(true);
  });

  it('picks mobile selectors when mobile context is active', () => {
    const { steps } = resolveTourSteps(
      {
        ...baseContext,
        isMobile: true,
      },
      'module-settings-help',
    );

    const settingsStep = steps.find((step) => step.capabilityId === 'settings');
    expect(settingsStep?.targetSelector).toBe('[data-tour-id="settings"]');
  });
});
