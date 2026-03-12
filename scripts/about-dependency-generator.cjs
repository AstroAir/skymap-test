const fs = require('fs');
const path = require('path');

const TYPE_ORDER = [
  'framework',
  'desktop',
  'ui',
  'style',
  'state',
  'i18n',
  'astronomy',
  'mapping',
  'testing',
  'tooling',
  'util',
  'other',
];

const RUNTIME_ORDER = {
  shared: 0,
  desktop: 1,
};

const SOURCE_ORDER = {
  npm: 0,
  cargo: 1,
};

function cleanLine(line) {
  return line.replace(/\s+#.*$/, '').trim();
}

function normalizeVersion(version) {
  return String(version ?? '').trim();
}

function getDependencyType(name, source, manifestSection) {
  if (name === 'next' || name === 'react' || name === 'react-dom' || name === 'tauri') {
    return 'framework';
  }

  if (
    name.startsWith('@tauri-apps/') ||
    name.startsWith('tauri-plugin-') ||
    name === 'tauri-build'
  ) {
    return 'desktop';
  }

  if (
    name.startsWith('@radix-ui/') ||
    name.startsWith('@dnd-kit/') ||
    ['lucide-react', 'cmdk', 'embla-carousel-react', 'vaul', 'sonner', 'recharts'].includes(name)
  ) {
    return 'ui';
  }

  if (
    name === 'tailwindcss' ||
    name.startsWith('@tailwindcss/') ||
    ['tailwind-merge', 'tw-animate-css', 'class-variance-authority'].includes(name)
  ) {
    return 'style';
  }

  if (name === 'zustand') {
    return 'state';
  }

  if (name === 'next-intl') {
    return 'i18n';
  }

  if (
    ['aladin-lite', 'astronomy-engine', 'fitsjs', 'satellite.js'].includes(name) ||
    (source === 'cargo' && ['chrono', 'reqwest', 'serde', 'serde_json'].includes(name) === false && /astro|stellarium/i.test(name))
  ) {
    return 'astronomy';
  }

  if (['leaflet', 'react-leaflet', '@types/leaflet', 'tz-lookup'].includes(name)) {
    return 'mapping';
  }

  if (
    name.startsWith('jest') ||
    name.startsWith('@testing-library/') ||
    name === '@playwright/test' ||
    name === 'ts-jest' ||
    name === 'jest-environment-jsdom' ||
    name === 'jest-junit' ||
    name === '@types/jest' ||
    name === '@types/testing-library__jest-dom'
  ) {
    return 'testing';
  }

  if (
    manifestSection === 'devDependencies' ||
    name === 'typescript' ||
    name === 'cross-env' ||
    name === 'shadcn' ||
    name === 'eslint' ||
    name === 'eslint-config-next' ||
    name === 'ts-node' ||
    name === 'baseline-browser-mapping' ||
    name.startsWith('@types/')
  ) {
    return 'tooling';
  }

  if (
    ['clsx', 'date-fns', 'framer-motion', 'lazy_static', 'log', 'once_cell', 'open', 'regex-lite', 'thiserror', 'tokio', 'url'].includes(name)
  ) {
    return 'util';
  }

  return 'other';
}

function getNpmRuntime(name) {
  return name.startsWith('@tauri-apps/') ? 'desktop' : 'shared';
}

function shouldIncludeCargoSection(sectionName) {
  if (sectionName === 'dependencies' || sectionName === 'build-dependencies') {
    return true;
  }

  if (!sectionName.endsWith('.dependencies')) {
    return false;
  }

  const lower = sectionName.toLowerCase();
  if (lower.includes('android') || lower.includes('ios')) {
    return false;
  }

  return (
    lower.includes('windows') ||
    lower.includes('linux') ||
    lower.includes('macos') ||
    lower.includes('unix')
  );
}

function extractCargoVersion(spec) {
  const trimmed = spec.trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  const versionMatch = trimmed.match(/version\s*=\s*"([^"]+)"/);
  if (versionMatch) {
    return versionMatch[1];
  }

  return null;
}

function parsePackageManifest(packageManifest) {
  const records = [];

  for (const sectionName of ['dependencies', 'devDependencies']) {
    const section = packageManifest[sectionName] ?? {};
    for (const [name, version] of Object.entries(section)) {
      records.push({
        name,
        version: normalizeVersion(version),
        type: getDependencyType(name, 'npm', sectionName),
        source: 'npm',
        runtime: getNpmRuntime(name),
        manifestSection: sectionName,
      });
    }
  }

  return records;
}

function parseCargoManifest(cargoManifest) {
  const records = [];
  let currentSection = '';

  for (const rawLine of cargoManifest.split(/\r?\n/)) {
    const line = cleanLine(rawLine);
    if (!line) {
      continue;
    }

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    if (!shouldIncludeCargoSection(currentSection)) {
      continue;
    }

    const dependencyMatch = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (!dependencyMatch) {
      continue;
    }

    const [, name, spec] = dependencyMatch;
    const version = extractCargoVersion(spec);
    if (!version) {
      continue;
    }

    records.push({
      name,
      version,
      type: getDependencyType(name, 'cargo', currentSection),
      source: 'cargo',
      runtime: 'desktop',
      manifestSection: currentSection,
    });
  }

  return records;
}

function sortAboutDependencies(left, right) {
  const runtimeComparison = RUNTIME_ORDER[left.runtime] - RUNTIME_ORDER[right.runtime];
  if (runtimeComparison !== 0) {
    return runtimeComparison;
  }

  const typeComparison = TYPE_ORDER.indexOf(left.type) - TYPE_ORDER.indexOf(right.type);
  if (typeComparison !== 0) {
    return typeComparison;
  }

  const sourceComparison = SOURCE_ORDER[left.source] - SOURCE_ORDER[right.source];
  if (sourceComparison !== 0) {
    return sourceComparison;
  }

  return left.name.localeCompare(right.name, 'en');
}

function buildAboutDependencies({ packageManifest, cargoManifest }) {
  return [...parsePackageManifest(packageManifest), ...parseCargoManifest(cargoManifest)].sort(sortAboutDependencies);
}

function renderAboutDependenciesModule(dependencies) {
  const rows = dependencies
    .map(
      (dependency) => `  {
    name: '${dependency.name}',
    version: '${dependency.version}',
    type: '${dependency.type}',
    source: '${dependency.source}',
    runtime: '${dependency.runtime}',
    manifestSection: '${dependency.manifestSection.replace(/'/g, "\\'")}',
  },`
    )
    .join('\n');

  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT.
 * Generated by scripts/generate-about-dependencies.cjs
 */

import type { DependencyInfo } from '@/types/about';

export const ABOUT_DEPENDENCIES: DependencyInfo[] = [
${rows}
];
`;
}

function generateAboutDependencies({
  rootDir = process.cwd(),
  packageJsonPath = path.join(rootDir, 'package.json'),
  cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml'),
  outputPath = path.join(rootDir, 'lib', 'constants', 'generated', 'about-dependencies.ts'),
} = {}) {
  const packageManifest = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const cargoManifest = fs.readFileSync(cargoTomlPath, 'utf8');
  const dependencies = buildAboutDependencies({ packageManifest, cargoManifest });
  const output = renderAboutDependenciesModule(dependencies);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf8');

  return { dependencies, outputPath };
}

module.exports = {
  buildAboutDependencies,
  generateAboutDependencies,
  parseCargoManifest,
  parsePackageManifest,
  renderAboutDependenciesModule,
  sortAboutDependencies,
};
