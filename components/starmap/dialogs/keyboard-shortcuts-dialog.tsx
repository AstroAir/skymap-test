'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Keyboard, Command, Navigation, Eye, Clock } from 'lucide-react';
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

interface ShortcutItem {
  key: string;
  descriptionKey: string;
  modifier?: string;
}

interface ShortcutGroup {
  titleKey: string;
  icon: React.ReactNode;
  shortcuts: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: 'navigation',
    icon: <Navigation className="h-4 w-4" />,
    shortcuts: [
      { key: '+', descriptionKey: 'zoomIn' },
      { key: '-', descriptionKey: 'zoomOut' },
      { key: 'R', descriptionKey: 'resetView' },
      { key: '/', descriptionKey: 'openSearch' },
    ],
  },
  {
    titleKey: 'searchAndPanels',
    icon: <Command className="h-4 w-4" />,
    shortcuts: [
      { key: 'F', modifier: 'Ctrl', descriptionKey: 'toggleSearch' },
      { key: 'P', descriptionKey: 'toggleSessionPanel' },
      { key: 'O', descriptionKey: 'toggleFovOverlay' },
      { key: 'Esc', descriptionKey: 'closePanel' },
    ],
  },
  {
    titleKey: 'display',
    icon: <Eye className="h-4 w-4" />,
    shortcuts: [
      { key: 'L', descriptionKey: 'toggleConstellations' },
      { key: 'G', descriptionKey: 'toggleGrid' },
      { key: 'D', descriptionKey: 'toggleDso' },
      { key: 'A', descriptionKey: 'toggleAtmosphere' },
    ],
  },
  {
    titleKey: 'timeControl',
    icon: <Clock className="h-4 w-4" />,
    shortcuts: [
      { key: 'Space', descriptionKey: 'pauseResumeTime' },
      { key: ']', descriptionKey: 'speedUpTime' },
      { key: '[', descriptionKey: 'slowDownTime' },
      { key: 'T', descriptionKey: 'resetTime' },
    ],
  },
];

function ShortcutKey({ shortcut, t }: { shortcut: ShortcutItem; t: ReturnType<typeof useTranslations> }) {
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

interface KeyboardShortcutsDialogProps {
  trigger?: React.ReactNode;
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
            {SHORTCUT_GROUPS.map((group, index) => (
              <div key={group.titleKey}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary">{group.icon}</span>
                  <h3 className="font-medium text-sm">{t(`shortcuts.${group.titleKey}`)}</h3>
                </div>
                <div className="space-y-0.5 pl-6">
                  {group.shortcuts.map((shortcut) => (
                    <ShortcutKey key={shortcut.key + shortcut.descriptionKey} shortcut={shortcut} t={t} />
                  ))}
                </div>
              </div>
            ))}
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
