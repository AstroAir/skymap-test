'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Heart,
  History,
  Shuffle,
  Share2,
  Star,
  Telescope,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DailyKnowledgeCategory, DailyKnowledgeSource } from '@/lib/services/daily-knowledge';
import { useDailyKnowledgeStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

const CATEGORY_OPTIONS: Array<{ value: DailyKnowledgeCategory | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'dailyKnowledge.categoryAll' },
  { value: 'object', labelKey: 'dailyKnowledge.categoryObject' },
  { value: 'event', labelKey: 'dailyKnowledge.categoryEvent' },
  { value: 'history', labelKey: 'dailyKnowledge.categoryHistory' },
  { value: 'mission', labelKey: 'dailyKnowledge.categoryMission' },
  { value: 'technique', labelKey: 'dailyKnowledge.categoryTechnique' },
  { value: 'culture', labelKey: 'dailyKnowledge.categoryCulture' },
];

const SOURCE_OPTIONS: Array<{ value: DailyKnowledgeSource | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'dailyKnowledge.sourceAll' },
  { value: 'curated', labelKey: 'dailyKnowledge.sourceCurated' },
  { value: 'nasa-apod', labelKey: 'dailyKnowledge.sourceApod' },
  { value: 'wikimedia', labelKey: 'dailyKnowledge.sourceWikimedia' },
];

export function DailyKnowledgeDialog() {
  const t = useTranslations();
  const open = useDailyKnowledgeStore((state) => state.open);
  const loading = useDailyKnowledgeStore((state) => state.loading);
  const error = useDailyKnowledgeStore((state) => state.error);
  const items = useDailyKnowledgeStore((state) => state.items);
  const currentItem = useDailyKnowledgeStore((state) => state.currentItem);
  const favorites = useDailyKnowledgeStore((state) => state.favorites);
  const history = useDailyKnowledgeStore((state) => state.history);
  const filters = useDailyKnowledgeStore((state) => state.filters);
  const closeDialog = useDailyKnowledgeStore((state) => state.closeDialog);
  const loadDaily = useDailyKnowledgeStore((state) => state.loadDaily);
  const next = useDailyKnowledgeStore((state) => state.next);
  const prev = useDailyKnowledgeStore((state) => state.prev);
  const random = useDailyKnowledgeStore((state) => state.random);
  const toggleFavorite = useDailyKnowledgeStore((state) => state.toggleFavorite);
  const setFilters = useDailyKnowledgeStore((state) => state.setFilters);
  const setCurrentItemById = useDailyKnowledgeStore((state) => state.setCurrentItemById);
  const markDontShowToday = useDailyKnowledgeStore((state) => state.markDontShowToday);
  const goToRelatedObject = useDailyKnowledgeStore((state) => state.goToRelatedObject);
  const recordHistory = useDailyKnowledgeStore((state) => state.recordHistory);

  useEffect(() => {
    if (open && items.length === 0) {
      void loadDaily('manual');
    }
  }, [items.length, loadDaily, open]);

  const favoriteIds = useMemo(() => new Set(favorites.map((entry) => entry.itemId)), [favorites]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const lastSearchHistoryKeyRef = useRef<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.category !== 'all' && !item.categories.includes(filters.category)) return false;
      if (filters.source !== 'all' && item.source !== filters.source) return false;
      if (filters.favoritesOnly && !favoriteIds.has(item.id)) return false;
      if (!filters.query.trim()) return true;
      const q = filters.query.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [favoriteIds, filters, items]);

  const effectiveItem = useMemo(() => {
    if (!currentItem) return filteredItems[0] ?? null;
    if (filteredItems.some((item) => item.id === currentItem.id)) return currentItem;
    return filteredItems[0] ?? null;
  }, [currentItem, filteredItems]);

  useEffect(() => {
    if (effectiveItem && currentItem?.id !== effectiveItem.id) {
      setCurrentItemById(effectiveItem.id);
    }
  }, [currentItem?.id, effectiveItem, setCurrentItemById]);

  useEffect(() => {
    if (!effectiveItem) return;
    const query = filters.query.trim();
    if (!query) {
      lastSearchHistoryKeyRef.current = null;
      return;
    }
    const historyKey = `${effectiveItem.id}:${query.toLowerCase()}`;
    if (lastSearchHistoryKeyRef.current === historyKey) return;
    lastSearchHistoryKeyRef.current = historyKey;
    recordHistory(effectiveItem.id, 'search', effectiveItem.dateKey);
  }, [effectiveItem, filters.query, recordHistory]);

  function buildShareText() {
    if (!effectiveItem) return '';
    const copyrightLine = effectiveItem.attribution.copyright
      ? `${effectiveItem.attribution.copyright}`
      : '';
    const licenseLine = effectiveItem.attribution.licenseName
      ? effectiveItem.attribution.licenseUrl
        ? `${effectiveItem.attribution.licenseName} (${effectiveItem.attribution.licenseUrl})`
        : effectiveItem.attribution.licenseName
      : '';
    return [
      effectiveItem.title,
      effectiveItem.summary,
      effectiveItem.externalUrl ?? effectiveItem.attribution.sourceUrl ?? '',
      [copyrightLine, licenseLine].filter(Boolean).join(' | '),
    ]
      .filter(Boolean)
      .join('\n');
  }

  async function handleShare(): Promise<void> {
    if (!effectiveItem) return;
    const text = buildShareText();

    try {
      if (navigator.share && typeof navigator.share === 'function') {
        await navigator.share({
          title: effectiveItem.title,
          text: effectiveItem.summary,
          url: effectiveItem.externalUrl,
        });
        return;
      }
    } catch {
      // fallback to clipboard
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('dailyKnowledge.copySuccess'));
    } catch {
      toast.error(t('dailyKnowledge.shareFailed'));
    }
  }

  async function handleCopy(): Promise<void> {
    if (!effectiveItem) return;
    const payload = buildShareText();
    try {
      await navigator.clipboard.writeText(payload);
      toast.success(t('dailyKnowledge.copySuccess'));
    } catch {
      toast.error(t('dailyKnowledge.copyFailed'));
    }
  }

  const isFavorite = effectiveItem ? favoriteIds.has(effectiveItem.id) : false;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeDialog()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('dailyKnowledge.title')}</DialogTitle>
          <DialogDescription>{t('dailyKnowledge.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <Input
            value={filters.query}
            onChange={(event) => setFilters({ query: event.target.value })}
            placeholder={t('dailyKnowledge.searchPlaceholder')}
          />
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters({ category: value as DailyKnowledgeCategory | 'all' })}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.source}
            onValueChange={(value) => setFilters({ source: value as DailyKnowledgeSource | 'all' })}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={filters.favoritesOnly ? 'default' : 'outline'}
            onClick={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}
          >
            <Heart className={cn('h-4 w-4', filters.favoritesOnly && 'fill-current')} />
            {t('dailyKnowledge.favorites')}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev} disabled={loading || !effectiveItem}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={next} disabled={loading || !effectiveItem}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={random} disabled={loading || filteredItems.length === 0}>
            <Shuffle className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <History className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <ScrollArea className="h-52">
                <div className="space-y-2">
                  {history.slice(0, 30).map((entry) => (
                    <Button
                      key={`${entry.itemId}-${entry.shownAt}`}
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => setCurrentItemById(entry.itemId)}
                    >
                      <span className="truncate text-left">
                        {itemById.get(entry.itemId)?.title ?? entry.itemId}
                      </span>
                      <span className="text-xs text-muted-foreground">{entry.entry}</span>
                    </Button>
                  ))}
                  {history.length === 0 && <p className="text-xs text-muted-foreground">{t('dailyKnowledge.noHistory')}</p>}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <div className="ml-auto text-xs text-muted-foreground">
            {t('dailyKnowledge.resultCount', { count: filteredItems.length })}
          </div>
        </div>

        <Separator />

        {loading && <p className="text-sm text-muted-foreground">{t('dailyKnowledge.loading')}</p>}
        {!loading && error && <p className="text-sm text-destructive">{t(error)}</p>}
        {!loading && !error && !effectiveItem && (
          <p className="text-sm text-muted-foreground">{t('dailyKnowledge.noResults')}</p>
        )}

        {!loading && !error && effectiveItem && (
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-start gap-2">
                <h3 className="text-xl font-semibold">{effectiveItem.title}</h3>
                <Badge variant="secondary">{t(`dailyKnowledge.sourceBadge.${effectiveItem.source}`)}</Badge>
                {effectiveItem.categories.map((category) => (
                  <Badge key={category} variant="outline">
                    {t(`dailyKnowledge.categoryBadge.${category}`)}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{effectiveItem.summary}</p>
              <ScrollArea className="h-64 rounded-md border p-3">
                <p className="text-sm leading-6 whitespace-pre-wrap">{effectiveItem.body}</p>
              </ScrollArea>
              <div className="flex flex-wrap gap-2">
                {effectiveItem.relatedObjects.map((object) => (
                  <Button
                    key={`${effectiveItem.id}-${object.name}`}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void goToRelatedObject(object);
                    }}
                  >
                    <Telescope className="mr-1 h-3.5 w-3.5" />
                    {object.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {effectiveItem.image && (
                <div className="overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={effectiveItem.image.thumbnailUrl ?? effectiveItem.image.url}
                    alt={effectiveItem.title}
                    className="h-56 w-full object-cover"
                    loading="lazy"
                    width={960}
                    height={540}
                    unoptimized
                  />
                  {effectiveItem.image.type === 'video' && (
                    <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                      {t('dailyKnowledge.videoEntry')}
                    </p>
                  )}
                </div>
              )}
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">{t('dailyKnowledge.attribution')}</p>
                <p className="text-muted-foreground">{effectiveItem.attribution.sourceName}</p>
                {effectiveItem.attribution.copyright && (
                  <p className="text-muted-foreground">{effectiveItem.attribution.copyright}</p>
                )}
                {effectiveItem.attribution.licenseName && (
                  <p className="text-muted-foreground">{effectiveItem.attribution.licenseName}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={isFavorite ? 'default' : 'outline'}
                  onClick={() => toggleFavorite(effectiveItem.id)}
                >
                  <Star className={cn('mr-2 h-4 w-4', isFavorite && 'fill-current')} />
                  {isFavorite ? t('dailyKnowledge.favorited') : t('dailyKnowledge.favorite')}
                </Button>
                <Button variant="outline" onClick={() => void handleCopy()}>
                  <Copy className="mr-2 h-4 w-4" />
                  {t('dailyKnowledge.copy')}
                </Button>
                <Button variant="outline" onClick={() => void handleShare()}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('dailyKnowledge.share')}
                </Button>
                {effectiveItem.externalUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(effectiveItem.externalUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t('dailyKnowledge.openSource')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              markDontShowToday();
              closeDialog();
            }}
          >
            {t('dailyKnowledge.dontShowToday')}
          </Button>
          <Button variant="outline" onClick={closeDialog}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
