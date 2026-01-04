'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';
import { useThemeStore } from '@/lib/stores/theme-store';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  className?: string;
  showCustomize?: boolean;
  onCustomizeClick?: () => void;
}

export function ThemeToggle({ 
  variant = 'dropdown', 
  className,
  showCustomize = false,
  onCustomizeClick,
}: ThemeToggleProps) {
  const t = useTranslations();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const applyCustomization = useThemeStore((state) => state.applyCustomization);
  
  // Use useSyncExternalStore to safely detect client-side rendering
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  
  // Re-apply customization when theme changes
  useEffect(() => {
    applyCustomization();
  }, [resolvedTheme, applyCustomization]);

  // Use Sun as default during SSR to avoid hydration mismatch
  const ThemeIcon = mounted && resolvedTheme === 'dark' ? Moon : Sun;

  if (variant === 'icon') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-9 w-9', className)}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            suppressHydrationWarning
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p suppressHydrationWarning>
            {resolvedTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-9 w-9', className)}
          suppressHydrationWarning
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={cn(theme === 'light' && 'bg-accent')}
        >
          <Sun className="mr-2 h-4 w-4" />
          {t('common.lightMode')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={cn(theme === 'dark' && 'bg-accent')}
        >
          <Moon className="mr-2 h-4 w-4" />
          {t('common.darkMode')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={cn(theme === 'system' && 'bg-accent')}
        >
          <Monitor className="mr-2 h-4 w-4" />
          {t('theme.system')}
        </DropdownMenuItem>
        {showCustomize && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCustomizeClick}>
              <Palette className="mr-2 h-4 w-4" />
              {t('theme.customize')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeIconToggle({ className }: { className?: string }) {
  return <ThemeToggle variant="icon" className={className} />;
}
