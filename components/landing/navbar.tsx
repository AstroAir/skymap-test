'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { Star, Github, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const t = useTranslations('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.features')}
            </Link>
            <Link
              href="#screenshots"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.screenshots')}
            </Link>
            <Link
              href="#tech"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.technology')}
            </Link>
            <a
              href="https://github.com/AstroAir/skymap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
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

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            mobileMenuOpen ? 'max-h-64 pb-4' : 'max-h-0'
          )}
        >
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="#features"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.features')}
            </Link>
            <Link
              href="#screenshots"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.screenshots')}
            </Link>
            <Link
              href="#tech"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.technology')}
            </Link>
            <div className="flex items-center gap-2 px-3 pt-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <div className="px-3 pt-2">
              <Link href="/starmap" className="block">
                <Button size="sm" className="w-full font-medium">
                  {t('nav.launchApp')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
