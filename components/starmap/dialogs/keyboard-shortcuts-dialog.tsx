'use client';

import { useState } from 'react';
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
  description: string;
  modifier?: string;
}

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  shortcuts: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    icon: <Navigation className="h-4 w-4" />,
    shortcuts: [
      { key: '+', description: 'Zoom in' },
      { key: '-', description: 'Zoom out' },
      { key: 'R', description: 'Reset view' },
      { key: 'Scroll', description: 'Zoom with mouse wheel' },
      { key: 'Drag', description: 'Pan view' },
    ],
  },
  {
    title: 'Search & Panels',
    icon: <Command className="h-4 w-4" />,
    shortcuts: [
      { key: '/', description: 'Open search' },
      { key: 'F', modifier: 'Ctrl', description: 'Toggle search' },
      { key: 'P', description: 'Toggle session panel' },
      { key: 'O', description: 'Toggle FOV overlay' },
      { key: 'Esc', description: 'Close panel' },
    ],
  },
  {
    title: 'Display',
    icon: <Eye className="h-4 w-4" />,
    shortcuts: [
      { key: 'L', description: 'Toggle constellation lines' },
      { key: 'G', description: 'Toggle equatorial grid' },
      { key: 'D', description: 'Toggle deep sky objects' },
      { key: 'A', description: 'Toggle atmosphere' },
    ],
  },
  {
    title: 'Time Control',
    icon: <Clock className="h-4 w-4" />,
    shortcuts: [
      { key: 'Space', description: 'Pause/resume time' },
      { key: ']', description: 'Speed up time (2x)' },
      { key: '[', description: 'Slow down time (0.5x)' },
      { key: 'T', description: 'Reset to current time' },
    ],
  },
];

function ShortcutKey({ shortcut }: { shortcut: ShortcutItem }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
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

  const defaultTrigger = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent"
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
              <div key={group.title}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary">{group.icon}</span>
                  <h3 className="font-medium text-sm">{group.title}</h3>
                </div>
                <div className="space-y-0.5 pl-6">
                  {group.shortcuts.map((shortcut) => (
                    <ShortcutKey key={shortcut.key + shortcut.description} shortcut={shortcut} />
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
