'use client';

import { memo, forwardRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Star, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StellariumSearch, type StellariumSearchRef } from '../search/stellarium-search';
import { FavoritesQuickAccess } from '../search/favorites-quick-access';
import { OnlineSearchSettings } from '../search/online-search-settings';
import type { SearchPanelProps } from '@/types/starmap/view';

export const SearchPanel = memo(forwardRef<StellariumSearchRef, SearchPanelProps>(
  function SearchPanel({ isOpen, onClose, onSelect }, ref) {
    const t = useTranslations();
    const [showFavorites, setShowFavorites] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    return (
      <Card className={cn(
        "absolute top-14 sm:top-16 left-2 sm:left-3 w-[calc(100vw-16px)] sm:w-96 md:w-[420px] sm:max-w-[calc(100vw-24px)] bg-card/95 backdrop-blur-sm border-border z-50 shadow-xl",
        isOpen ? "animate-scale-in" : "hidden"
      )}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-foreground">{t('starmap.searchObjects')}</CardTitle>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showFavorites ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => { setShowFavorites(!showFavorites); setShowSettings(false); }}
                >
                  <Star className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('search.favorites')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showSettings ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => { setShowSettings(!showSettings); setShowFavorites(false); }}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('search.onlineSearchSettings')}</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[70vh]">
          {showFavorites ? (
            <FavoritesQuickAccess
              onSelect={(_item) => {
                setShowFavorites(false);
                onSelect();
              }}
              onNavigate={(_item) => {
                setShowFavorites(false);
                onSelect();
              }}
            />
          ) : showSettings ? (
            <OnlineSearchSettings compact />
          ) : (
            <StellariumSearch
              ref={ref}
              onSelect={onSelect}
              enableMultiSelect={true}
            />
          )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }
));
SearchPanel.displayName = 'SearchPanel';
