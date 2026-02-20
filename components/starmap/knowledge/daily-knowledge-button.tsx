'use client';

import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useDailyKnowledgeStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface DailyKnowledgeButtonProps {
  className?: string;
}

export function DailyKnowledgeButton({ className }: DailyKnowledgeButtonProps) {
  const t = useTranslations();
  const openDialog = useDailyKnowledgeStore((state) => state.openDialog);

  return (
    <Button
      data-tour-id="daily-knowledge"
      variant="ghost"
      size="icon"
      className={cn('h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent', className)}
      aria-label={t('dailyKnowledge.open')}
      title={t('dailyKnowledge.open')}
      onClick={() => {
        void openDialog('manual');
      }}
    >
      <BookOpen className="h-4 w-4" />
    </Button>
  );
}
