'use client';

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';

type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme';
const DEFAULT_THEME: Theme = 'dark';

// Subscribe to storage changes
function subscribeToTheme(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  return (localStorage.getItem(THEME_KEY) as Theme) || DEFAULT_THEME;
}

function getThemeServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

function applyThemeToDOM(newTheme: Theme) {
  const root = document.documentElement;
  
  if (newTheme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', systemDark);
  } else {
    root.classList.toggle('dark', newTheme === 'dark');
  }
}

export function ThemeToggle() {
  const t = useTranslations();
  
  // Use useSyncExternalStore to read theme from localStorage
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  // Apply theme when it changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    applyThemeToDOM(newTheme);
    // Dispatch storage event to trigger re-render
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY }));
  }, [theme]);

  // Always render the same structure to avoid hydration mismatch
  // Use suppressHydrationWarning for the icon that changes
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={toggleTheme}
          suppressHydrationWarning
        >
          {theme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p suppressHydrationWarning>{theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}</p>
      </TooltipContent>
    </Tooltip>
  );
}
