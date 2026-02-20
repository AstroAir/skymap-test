/**
 * About Dialog - Static Data Constants
 *
 * Application metadata, licenses, dependencies, and data credits
 * displayed in the About dialog.
 */

import type { AppInfo, LicenseInfo, DependencyInfo, DataCreditInfo } from '@/types/about';
import { EXTERNAL_LINKS } from './external-links';

// ============================================================================
// Application Info
// ============================================================================

export const APP_INFO: AppInfo = {
  name: 'SkyMap',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
  repository: EXTERNAL_LINKS.repository,
  author: 'AstroAir Team',
};

// ============================================================================
// Licenses
// ============================================================================

export const LICENSES: LicenseInfo[] = [
  {
    name: 'Stellarium Web Engine',
    license: 'GPL-3.0',
    url: 'https://github.com/Stellarium/stellarium-web-engine',
    descriptionKey: 'about.licenseDesc.stellarium',
  },
  {
    name: 'Next.js',
    license: 'MIT',
    url: 'https://nextjs.org',
    descriptionKey: 'about.licenseDesc.nextjs',
  },
  {
    name: 'React',
    license: 'MIT',
    url: 'https://react.dev',
    descriptionKey: 'about.licenseDesc.react',
  },
  {
    name: 'Tailwind CSS',
    license: 'MIT',
    url: 'https://tailwindcss.com',
    descriptionKey: 'about.licenseDesc.tailwind',
  },
  {
    name: 'shadcn/ui',
    license: 'MIT',
    url: 'https://ui.shadcn.com',
    descriptionKey: 'about.licenseDesc.shadcn',
  },
  {
    name: 'Zustand',
    license: 'MIT',
    url: 'https://zustand-demo.pmnd.rs',
    descriptionKey: 'about.licenseDesc.zustand',
  },
  {
    name: 'next-intl',
    license: 'MIT',
    url: 'https://next-intl-docs.vercel.app',
    descriptionKey: 'about.licenseDesc.nextIntl',
  },
  {
    name: 'Lucide React',
    license: 'ISC',
    url: 'https://lucide.dev',
    descriptionKey: 'about.licenseDesc.lucide',
  },
];

// ============================================================================
// Dependencies
// ============================================================================

export const DEPENDENCIES: DependencyInfo[] = [
  { name: 'next', version: '16.0.0', type: 'core' },
  { name: 'react', version: '19.2.0', type: 'core' },
  { name: 'react-dom', version: '19.2.0', type: 'core' },
  { name: 'typescript', version: '^5', type: 'dev' },
  { name: 'tailwindcss', version: '^4', type: 'style' },
  { name: 'zustand', version: '^5.0.8', type: 'state' },
  { name: 'next-intl', version: '^4.5.7', type: 'i18n' },
  { name: 'lucide-react', version: '^0.546.0', type: 'ui' },
  { name: 'clsx', version: '^2.1.1', type: 'util' },
  { name: 'tailwind-merge', version: '^3.3.1', type: 'util' },
  { name: '@radix-ui/react-dialog', version: '^1.1.15', type: 'ui' },
  { name: '@radix-ui/react-dropdown-menu', version: '^2.1.16', type: 'ui' },
  { name: '@radix-ui/react-tabs', version: '^1.1.13', type: 'ui' },
  { name: '@radix-ui/react-tooltip', version: '^1.2.8', type: 'ui' },
  { name: '@radix-ui/react-scroll-area', version: '^1.2.10', type: 'ui' },
];

// ============================================================================
// Data Credits
// ============================================================================

export const DATA_CREDITS: DataCreditInfo[] = [
  { nameKey: 'about.credit.hipsSurveys', source: 'CDS, Strasbourg', url: 'https://aladin.cds.unistra.fr/hips/' },
  { nameKey: 'about.credit.starCatalog', source: 'Hipparcos/Tycho', url: 'https://www.cosmos.esa.int/web/hipparcos' },
  { nameKey: 'about.credit.deepSkyObjects', source: 'OpenNGC', url: 'https://github.com/mattiaverga/OpenNGC' },
  { nameKey: 'about.credit.constellationData', source: 'IAU', url: 'https://www.iau.org/public/themes/constellations/' },
  { nameKey: 'about.credit.planetTextures', source: 'NASA/JPL', url: 'https://www.jpl.nasa.gov/' },
];
