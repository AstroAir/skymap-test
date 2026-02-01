'use client';

import { memo, forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StellariumSearch, type StellariumSearchRef } from '../search/stellarium-search';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
}

export const SearchPanel = memo(forwardRef<StellariumSearchRef, SearchPanelProps>(
  function SearchPanel({ isOpen, onClose, onSelect }, ref) {
    const t = useTranslations();

    if (!isOpen) return null;

    return (
      <Card className="absolute top-14 sm:top-16 left-2 sm:left-3 w-[calc(100vw-16px)] sm:w-96 md:w-[420px] sm:max-w-[calc(100vw-24px)] bg-card/95 backdrop-blur-sm border-border z-50 shadow-xl animate-scale-in">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-foreground">{t('starmap.searchObjects')}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto">
          <StellariumSearch
            ref={ref}
            onSelect={onSelect}
            enableMultiSelect={true}
          />
        </CardContent>
      </Card>
    );
  }
));
SearchPanel.displayName = 'SearchPanel';
