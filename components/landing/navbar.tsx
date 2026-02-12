'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { Star, Github, Menu } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  labelKey: string;
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '#features', labelKey: 'nav.features' },
  { href: '#screenshots', labelKey: 'nav.screenshots' },
  { href: '#tech', labelKey: 'nav.technology' },
  { href: 'https://github.com/AstroAir/skymap', labelKey: 'nav.github', external: true },
];

export function Navbar() {
  const t = useTranslations('landing');
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Star className="h-6 w-6 text-primary group-hover:text-secondary transition-colors" />
            <span className="font-serif text-xl font-bold text-foreground">
              SkyMap
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Github className="h-4 w-4" />
                  {t(item.labelKey)}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t(item.labelKey)}
                </Link>
              )
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link href="/starmap" className="hidden sm:block">
              <Button size="sm" className="font-medium">
                {t('nav.launchApp')}
              </Button>
            </Link>

            {/* Mobile menu */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    SkyMap
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-4">
                  {NAV_ITEMS.map((item) =>
                    item.external ? (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center gap-1.5"
                        onClick={() => setSheetOpen(false)}
                      >
                        <Github className="h-4 w-4" />
                        {t(item.labelKey)}
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                        onClick={() => setSheetOpen(false)}
                      >
                        {t(item.labelKey)}
                      </Link>
                    )
                  )}
                  <div className="flex items-center gap-2 px-3 pt-4">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                  <div className="px-3 pt-2">
                    <Link href="/starmap" className="block" onClick={() => setSheetOpen(false)}>
                      <Button size="sm" className="w-full font-medium">
                        {t('nav.launchApp')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
