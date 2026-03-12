import { DEPENDENCIES, getDependencyGroups, getVisibleDependencies } from '../about-data';

describe('about dependency helpers', () => {
  it('filters desktop-only dependencies out of web runtime views', () => {
    const webDependencies = getVisibleDependencies(false);

    expect(webDependencies.length).toBeGreaterThan(0);
    expect(webDependencies.every((item) => item.runtime === 'shared')).toBe(true);
  });

  it('includes desktop-only dependencies in Tauri runtime views', () => {
    const desktopDependencies = getVisibleDependencies(true);

    expect(desktopDependencies.length).toBeGreaterThan(DEPENDENCIES.length - 1);
    expect(desktopDependencies.some((item) => item.runtime === 'desktop')).toBe(true);
  });

  it('groups visible dependencies by runtime in deterministic order', () => {
    const groups = getDependencyGroups(true);

    expect(groups.map((group) => group.runtime)).toEqual(['shared', 'desktop']);
    expect(groups[0]?.items.length).toBeGreaterThan(0);
    expect(groups[1]?.items.some((item) => item.runtime === 'desktop')).toBe(true);
  });
});
