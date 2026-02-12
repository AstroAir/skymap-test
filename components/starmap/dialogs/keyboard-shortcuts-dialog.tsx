'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Keyboard, Command, Navigation, Eye, Clock, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { ShortcutItem, KeyboardShortcutsDialogProps } from '@/types/keyboard-shortcuts';
import { SHORTCUT_GROUP_DEFINITIONS } from '@/lib/constants/keyboard-shortcuts-data';

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  Navigation,
  Command,
  Eye,
  Clock,
};

function ShortcutKeyRow({ shortcut, t }: { shortcut: ShortcutItem; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{t(`shortcuts.${shortcut.descriptionKey}`)}</span>
      <div className="flex items-center gap-1">
        {shortcut.modifier && (
          <>
            <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
              {shortcut.modifier}
            </Badge>
            <span className="text-muted-foreground text-xs">+</span>
          </>
        )}
        <Badge variant="secondary" className="font-mono text-xs px-1.5 py-0">
          {shortcut.key}
        </Badge>
      </div>
    </div>
  );
}

export function KeyboardShortcutsDialog({ trigger }: KeyboardShortcutsDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  // Global ? shortcut to open this dialog
  const handleGlobalShortcut = useCallback((event: KeyboardEvent) => {
    // Check if input is focused
    const activeElement = document.activeElement;
    const tagName = activeElement?.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return;
    }

    // Don't trigger if another dialog/modal is already open
    if (document.querySelector('[role="dialog"][data-state="open"]')) {
      return;
    }

    // ? key (Shift + /)
    if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      event.preventDefault();
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [handleGlobalShortcut]);

  const defaultTrigger = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent"
          aria-label={t('shortcuts.keyboardShortcuts')}
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{t('shortcuts.keyboardShortcuts')}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('shortcuts.keyboardShortcuts')}
          </DialogTitle>
          <DialogDescription>
            {t('shortcuts.description')}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {SHORTCUT_GROUP_DEFINITIONS.map((group, index) => {
              const IconComponent = ICON_MAP[group.iconName];
              return (
                <div key={group.titleKey}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-primary">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                    </span>
                    <h3 className="font-medium text-sm">{t(`shortcuts.${group.titleKey}`)}</h3>
                  </div>
                  <div className="space-y-0.5 pl-6">
                    {group.shortcuts.map((shortcut) => (
                      <ShortcutKeyRow key={shortcut.key + shortcut.descriptionKey} shortcut={shortcut} t={t} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            {t('shortcuts.pressQuestionMark')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
