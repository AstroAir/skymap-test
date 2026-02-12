'use client';

import { useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, History, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useNavigationHistoryStore,
  formatNavigationPoint,
  formatTimestamp,
  type NavigationPoint,
} from '@/lib/hooks/use-navigation-history';
import type { NavigationHistoryProps } from '@/types/starmap/controls';

export const NavigationHistory = memo(function NavigationHistory({ onNavigate, className }: NavigationHistoryProps) {
  const t = useTranslations();
  const {
    history,
    currentIndex,
    back,
    forward,
    goTo,
    canGoBack,
    canGoForward,
    clear,
  } = useNavigationHistoryStore();

  const handleBack = useCallback(() => {
    const point = back();
    if (point && onNavigate) {
      onNavigate(point.ra, point.dec, point.fov);
    }
  }, [back, onNavigate]);

  const handleForward = useCallback(() => {
    const point = forward();
    if (point && onNavigate) {
      onNavigate(point.ra, point.dec, point.fov);
    }
  }, [forward, onNavigate]);

  const handleSelectPoint = useCallback((_point: NavigationPoint, index: number) => {
    // Use goTo to sync currentIndex with the selected history point
    const navigatedPoint = goTo(index);
    if (navigatedPoint && onNavigate) {
      onNavigate(navigatedPoint.ra, navigatedPoint.dec, navigatedPoint.fov);
    }
  }, [goTo, onNavigate]);

  const isBackEnabled = canGoBack();
  const isForwardEnabled = canGoForward();

  return (
    <div className={cn('flex items-center gap-0.5', className)} role="navigation" aria-label={t('navigation.viewHistory')}>
      {/* Back Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent disabled:opacity-30"
            onClick={handleBack}
            disabled={!isBackEnabled}
            aria-label={t('navigation.back')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('navigation.back')}</p>
        </TooltipContent>
      </Tooltip>

      {/* Forward Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent disabled:opacity-30"
            onClick={handleForward}
            disabled={!isForwardEnabled}
            aria-label={t('navigation.forward')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('navigation.forward')}</p>
        </TooltipContent>
      </Tooltip>

      {/* History Dropdown */}
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent"
                aria-label={t('navigation.history')}
                data-tour-id="navigation-history"
              >
                <History className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t('navigation.history')}</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-72 p-0 animate-in fade-in zoom-in-95 slide-in-from-top-2" align="end">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              {t('navigation.viewHistory')}
            </h4>
            {history.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={clear}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('navigation.clearHistory')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <ScrollArea className="max-h-64">
            {history.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>{t('navigation.noHistory')}</p>
              </div>
            ) : (
              <div className="py-1">
                {[...history].reverse().map((point, reverseIndex) => {
                  const actualIndex = history.length - 1 - reverseIndex;
                  const isCurrent = actualIndex === currentIndex;
                  
                  return (
                    <button
                      key={point.id}
                      className={cn(
                        'w-full px-3 py-2 text-left hover:bg-accent transition-colors',
                        isCurrent && 'bg-primary/10 border-l-2 border-primary'
                      )}
                      onClick={() => handleSelectPoint(point, actualIndex)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className={cn(
                          'h-3 w-3 shrink-0',
                          isCurrent ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm truncate',
                            isCurrent && 'font-medium text-primary'
                          )}>
                            {formatNavigationPoint(point)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            FOV: {point.fov.toFixed(1)}° • {formatTimestamp(point.timestamp, {
                              justNow: t('navigation.justNow'),
                              minutesAgo: (mins) => t('navigation.minutesAgo', { count: mins }),
                              hoursAgo: (hours) => t('navigation.hoursAgo', { count: hours }),
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {history.length > 0 && (
            <>
              <Separator />
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                {t('navigation.historyCount', { count: history.length })}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
});
NavigationHistory.displayName = 'NavigationHistory';
