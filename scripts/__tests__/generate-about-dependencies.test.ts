/**
 * @jest-environment node
 */

import * as aboutDependencyGenerator from '../about-dependency-generator.cjs';

const {
  buildAboutDependencies,
  renderAboutDependenciesModule,
} = aboutDependencyGenerator;

describe('about dependency generator', () => {
  it('builds normalized shared and desktop dependency records from manifests', () => {
    const packageManifest = {
      dependencies: {
        next: '16.0.0',
        react: '19.2.0',
        '@tauri-apps/api': '^2.10.1',
        'mystery-lib': '^1.2.3',
      },
      devDependencies: {
        typescript: '^5.9.3',
        '@playwright/test': '^1.58.2',
      },
    };

    const cargoManifest = `
[dependencies]
tauri = { version = "2.9.0", features = ["tray-icon"] }
serde = { version = "1.0", features = ["derive"] }

[build-dependencies]
tauri-build = { version = "2.5.0", features = [] }

[target.'cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))'.dependencies]
tauri-plugin-positioner = { version = "2", features = ["tray-icon"] }

[target.'cfg(any(target_os = "android", target_os = "ios"))'.dependencies]
tauri-plugin-geolocation = "2"
`;

    const dependencies = buildAboutDependencies({ packageManifest, cargoManifest });

    expect(dependencies.find((item: { name: string }) => item.name === 'next')).toMatchObject({
      source: 'npm',
      runtime: 'shared',
      type: 'framework',
      manifestSection: 'dependencies',
    });

    expect(dependencies.find((item: { name: string }) => item.name === '@tauri-apps/api')).toMatchObject({
      source: 'npm',
      runtime: 'desktop',
      type: 'desktop',
    });

    expect(dependencies.find((item: { name: string }) => item.name === 'tauri-plugin-positioner')).toMatchObject({
      source: 'cargo',
      runtime: 'desktop',
      type: 'desktop',
    });

    expect(dependencies.find((item: { name: string }) => item.name === 'mystery-lib')).toMatchObject({
      type: 'other',
      runtime: 'shared',
    });

    expect(dependencies.find((item: { name: string }) => item.name === 'tauri-plugin-geolocation')).toBeUndefined();
  });

  it('renders a frontend-safe generated module', () => {
    const output = renderAboutDependenciesModule([
      {
        name: 'next',
        version: '16.0.0',
        type: 'framework',
        source: 'npm',
        runtime: 'shared',
        manifestSection: 'dependencies',
      },
    ]);

    expect(output).toContain("import type { DependencyInfo } from '@/types/about';");
    expect(output).toContain('export const ABOUT_DEPENDENCIES: DependencyInfo[] = [');
    expect(output).toContain("name: 'next'");
  });
});
