'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Info,
  FileText,
  Package,
  Github,
  ExternalLink,
  Heart,
  Star,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { StellariumCredits } from './stellarium-credits';

// ============================================================================
// Data
// ============================================================================

const APP_INFO = {
  name: 'SkyMap',
  version: '0.1.0',
  repository: 'https://github.com/AstroAir/skymap-test',
  author: 'AstroAir Team',
};

const LICENSES = [
  {
    name: 'Stellarium Web Engine',
    license: 'GPL-3.0',
    url: 'https://github.com/Stellarium/stellarium-web-engine',
    description: 'Core rendering engine for the star map',
  },
  {
    name: 'Next.js',
    license: 'MIT',
    url: 'https://nextjs.org',
    description: 'React framework for production',
  },
  {
    name: 'React',
    license: 'MIT',
    url: 'https://react.dev',
    description: 'UI library',
  },
  {
    name: 'Tailwind CSS',
    license: 'MIT',
    url: 'https://tailwindcss.com',
    description: 'Utility-first CSS framework',
  },
  {
    name: 'shadcn/ui',
    license: 'MIT',
    url: 'https://ui.shadcn.com',
    description: 'UI component library',
  },
  {
    name: 'Zustand',
    license: 'MIT',
    url: 'https://zustand-demo.pmnd.rs',
    description: 'State management',
  },
  {
    name: 'next-intl',
    license: 'MIT',
    url: 'https://next-intl-docs.vercel.app',
    description: 'Internationalization',
  },
  {
    name: 'Lucide React',
    license: 'ISC',
    url: 'https://lucide.dev',
    description: 'Icon library',
  },
];

const DEPENDENCIES = [
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

const DATA_CREDITS = [
  { name: 'HiPS Surveys', source: 'CDS, Strasbourg', url: 'https://aladin.cds.unistra.fr/hips/' },
  { name: 'Star Catalog', source: 'Hipparcos/Tycho', url: 'https://www.cosmos.esa.int/web/hipparcos' },
  { name: 'Deep Sky Objects', source: 'OpenNGC', url: 'https://github.com/mattiaverga/OpenNGC' },
  { name: 'Constellation Data', source: 'IAU', url: 'https://www.iau.org/public/themes/constellations/' },
  { name: 'Planet Textures', source: 'NASA/JPL', url: 'https://www.jpl.nasa.gov/' },
];

// ============================================================================
// Sub Components
// ============================================================================

function LicenseCard({ item }: { item: typeof LICENSES[0] }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{item.name}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {item.license}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
      </div>
    </a>
  );
}

function DependencyRow({ item }: { item: typeof DEPENDENCIES[0] }) {
  const typeColors: Record<string, string> = {
    core: 'bg-blue-500/20 text-blue-400',
    dev: 'bg-gray-500/20 text-gray-400',
    style: 'bg-purple-500/20 text-purple-400',
    state: 'bg-green-500/20 text-green-400',
    i18n: 'bg-yellow-500/20 text-yellow-400',
    ui: 'bg-pink-500/20 text-pink-400',
    util: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50">
      <div className="flex items-center gap-2">
        <Package className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm font-mono">{item.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">{item.version}</span>
        <Badge className={cn('text-[10px]', typeColors[item.type] || 'bg-gray-500/20')}>
          {item.type}
        </Badge>
      </div>
    </div>
  );
}

function DataCreditRow({ item }: { item: typeof DATA_CREDITS[0] }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 group"
    >
      <div className="flex items-center gap-2">
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{item.name}</span>
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-primary">
        {item.source}
      </span>
    </a>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AboutDialog() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10"
              aria-label={t('about.title')}
            >
              <Info className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('about.title')}</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            {t('about.title')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="about" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 grid grid-cols-3 shrink-0">
            <TabsTrigger value="about" className="text-xs sm:text-sm">
              <Info className="h-4 w-4 mr-1 hidden sm:inline" />
              {t('about.aboutTab')}
            </TabsTrigger>
            <TabsTrigger value="licenses" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 mr-1 hidden sm:inline" />
              {t('about.licensesTab')}
            </TabsTrigger>
            <TabsTrigger value="deps" className="text-xs sm:text-sm">
              <Package className="h-4 w-4 mr-1 hidden sm:inline" />
              {t('about.depsTab')}
            </TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="flex-1 min-h-0 p-6 pt-4">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-2">
                {/* App Info */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold">{APP_INFO.name}</h2>
                    <p className="text-sm text-muted-foreground">v{APP_INFO.version}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('about.appDescription')}</p>
                  </div>
                </div>

                {/* Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={APP_INFO.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <Github className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">{t('about.sourceCode')}</p>
                      <p className="text-xs text-muted-foreground">GitHub</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">{t('about.madeWith')}</p>
                      <p className="text-xs text-muted-foreground">{APP_INFO.author}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Data Credits */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t('about.dataCredits')}</h3>
                  <div className="space-y-1 rounded-lg border border-border overflow-hidden">
                    {DATA_CREDITS.map((item) => (
                      <DataCreditRow key={item.name} item={item} />
                    ))}
                  </div>
                  <div className="mt-3">
                    <StellariumCredits />
                  </div>
                </div>

                {/* Copyright */}
                <div className="text-center text-xs text-muted-foreground pt-4">
                  <p>© {new Date().getFullYear()} {APP_INFO.author}. {t('about.allRightsReserved')}</p>
                  <p className="mt-1">{t('about.poweredBy')}</p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Licenses Tab */}
          <TabsContent value="licenses" className="flex-1 min-h-0 p-6 pt-4">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('about.licensesDescription')}
                </p>
                {LICENSES.map((item) => (
                  <LicenseCard key={item.name} item={item} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="deps" className="flex-1 min-h-0 p-6 pt-4">
            <ScrollArea className="h-full">
              <div className="pr-2">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('about.depsDescription')}
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  {DEPENDENCIES.map((item) => (
                    <DependencyRow key={item.name} item={item} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  {t('about.totalDeps', { count: DEPENDENCIES.length })}
                </p>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
