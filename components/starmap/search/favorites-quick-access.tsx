'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Star, 
  Heart, 
  Clock, 
  Trash2, 
  Tag, 
  Plus,
  X,
  MoreHorizontal,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { cn } from '@/lib/utils';
import { 
  useFavoritesStore, 
  FAVORITE_TAGS,
  type FavoriteObject 
} from '@/lib/stores';

interface FavoritesQuickAccessProps {
  onSelect?: (object: FavoriteObject) => void;
  onNavigate?: (ra: number, dec: number) => void;
  className?: string;
}

export function FavoritesQuickAccess({ 
  onSelect, 
  onNavigate,
  className 
}: FavoritesQuickAccessProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'favorites' | 'recent'>('favorites');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  const {
    favorites,
    recentlyViewed,
    removeFavorite,
    addTag,
    removeTag,
    clearRecentlyViewed,
    getAllTags,
  } = useFavoritesStore();

  const allTags = getAllTags();

  const filteredFavorites = filterTag
    ? favorites.filter(f => f.tags.includes(filterTag))
    : favorites;

  const handleSelect = useCallback((object: FavoriteObject) => {
    onSelect?.(object);
  }, [onSelect]);

  const handleNavigate = useCallback((object: FavoriteObject) => {
    onNavigate?.(object.ra, object.dec);
  }, [onNavigate]);

  const handleAddTag = useCallback((id: string) => {
    if (newTag.trim()) {
      addTag(id, newTag.trim().toLowerCase());
      setNewTag('');
    }
  }, [addTag, newTag]);

  const renderObjectItem = (object: FavoriteObject, showActions: boolean = true) => (
    <div
      key={object.id}
      className="group flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-md transition-colors cursor-pointer"
      onClick={() => handleSelect(object)}
    >
      <Star className={cn(
        'h-4 w-4 shrink-0',
        favorites.some(f => f.name === object.name)
          ? 'text-yellow-500 fill-yellow-500'
          : 'text-muted-foreground'
      )} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{object.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {object.type && <span>{object.type}</span>}
          {object.constellation && (
            <>
              <span>•</span>
              <span>{object.constellation}</span>
            </>
          )}
        </div>
      </div>

      {object.tags.length > 0 && (
        <div className="flex gap-0.5">
          {object.tags.slice(0, 2).map(tag => (
            <Badge 
              key={tag} 
              variant="outline" 
              className="text-[10px] px-1 py-0"
            >
              {tag}
            </Badge>
          ))}
          {object.tags.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              +{object.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate(object);
                }}
              >
                <Navigation className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{t('favorites.goTo')}</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setEditingTags(object.id)}>
                <Tag className="h-4 w-4 mr-2" />
                {t('favorites.manageTags')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => removeFavorite(object.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('favorites.remove')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('space-y-2', className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'favorites' | 'recent')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="favorites" className="text-xs gap-1">
            <Heart className="h-3 w-3" />
            {t('favorites.favorites')} ({favorites.length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="text-xs gap-1">
            <Clock className="h-3 w-3" />
            {t('favorites.recent')} ({recentlyViewed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="mt-2 space-y-2">
          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 px-1">
              <Badge
                variant={filterTag === null ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setFilterTag(null)}
              >
                {t('favorites.all')}
              </Badge>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={filterTag === tag ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="h-48">
            {filteredFavorites.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>{t('favorites.noFavorites')}</p>
                <p className="text-xs mt-1">{t('favorites.addHint')}</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredFavorites.map(fav => renderObjectItem(fav))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recent" className="mt-2 space-y-2">
          {recentlyViewed.length > 0 && (
            <div className="flex justify-end px-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={clearRecentlyViewed}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t('favorites.clearRecent')}
              </Button>
            </div>
          )}

          <ScrollArea className="h-48">
            {recentlyViewed.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>{t('favorites.noRecent')}</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentlyViewed.map(item => renderObjectItem(item, false))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Tag Editor Modal */}
      {editingTags && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg shadow-lg w-full max-w-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{t('favorites.manageTags')}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditingTags(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {/* Current tags */}
              <div className="flex flex-wrap gap-1">
                {favorites.find(f => f.id === editingTags)?.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      className="hover:text-destructive"
                      onClick={() => removeTag(editingTags, tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Quick tags */}
              <Separator />
              <p className="text-xs text-muted-foreground">{t('favorites.quickTags')}</p>
              <div className="flex flex-wrap gap-1">
                {FAVORITE_TAGS.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => addTag(editingTags, tag)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Custom tag input */}
              <Separator />
              <div className="flex gap-2">
                <Input
                  placeholder={t('favorites.customTag')}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag(editingTags);
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => handleAddTag(editingTags)}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
