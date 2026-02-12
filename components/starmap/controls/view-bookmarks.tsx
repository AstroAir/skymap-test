'use client';

import { useState, useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bookmark,
  BookmarkPlus,
  Star,
  Heart,
  Flag,
  MapPin,
  Eye,
  Camera,
  Telescope,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Navigation,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  useBookmarksStore,
  BOOKMARK_COLORS,
  BOOKMARK_ICONS,
  type ViewBookmark,
  type BookmarkIcon,
} from '@/lib/stores/bookmarks-store';
import type { ViewBookmarksProps } from '@/types/starmap/controls';

// Icon component mapping
const BookmarkIconComponent: Record<BookmarkIcon, React.ComponentType<LucideProps>> = {
  star: Star,
  heart: Heart,
  flag: Flag,
  pin: MapPin,
  eye: Eye,
  camera: Camera,
  telescope: Telescope,
};

export const ViewBookmarks = memo(function ViewBookmarks({
  currentRa,
  currentDec,
  currentFov,
  onNavigate,
  className,
}: ViewBookmarksProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<ViewBookmark | null>(null);
  
  // Form state for new/edit bookmark
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState<string>(BOOKMARK_COLORS[4]);
  const [formIcon, setFormIcon] = useState<BookmarkIcon>('star');

  const {
    bookmarks,
    addBookmark,
    updateBookmark,
    removeBookmark,
    duplicateBookmark,
  } = useBookmarksStore();

  const handleAddBookmark = useCallback(() => {
    setEditingBookmark(null);
    setFormName('');
    setFormDescription('');
    setFormColor(BOOKMARK_COLORS[4]);
    setFormIcon('star');
    setEditDialogOpen(true);
  }, []);

  const handleEditBookmark = useCallback((bookmark: ViewBookmark) => {
    setEditingBookmark(bookmark);
    setFormName(bookmark.name);
    setFormDescription(bookmark.description || '');
    setFormColor(bookmark.color || BOOKMARK_COLORS[4] as string);
    setFormIcon(bookmark.icon || 'star');
    setEditDialogOpen(true);
  }, []);

  const handleSaveBookmark = useCallback(() => {
    if (!formName.trim()) return;

    if (editingBookmark) {
      updateBookmark(editingBookmark.id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        color: formColor,
        icon: formIcon,
      });
    } else {
      addBookmark({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        ra: currentRa,
        dec: currentDec,
        fov: currentFov,
        color: formColor,
        icon: formIcon,
      });
    }

    setEditDialogOpen(false);
  }, [
    editingBookmark,
    formName,
    formDescription,
    formColor,
    formIcon,
    currentRa,
    currentDec,
    currentFov,
    addBookmark,
    updateBookmark,
  ]);

  const handleNavigate = useCallback((bookmark: ViewBookmark) => {
    onNavigate?.(bookmark.ra, bookmark.dec, bookmark.fov);
    setIsOpen(false);
  }, [onNavigate]);

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent',
                  className
                )}
                data-tour-id="view-bookmarks"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t('bookmarks.viewBookmarks')}</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-72 p-0 animate-in fade-in zoom-in-95 slide-in-from-top-2" align="end">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              {t('bookmarks.savedViews')}
            </h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleAddBookmark}
                >
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('bookmarks.saveCurrentView')}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <ScrollArea className="max-h-64">
            {bookmarks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>{t('bookmarks.noBookmarks')}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2"
                  onClick={handleAddBookmark}
                >
                  <BookmarkPlus className="h-3 w-3 mr-1" />
                  {t('bookmarks.saveCurrentView')}
                </Button>
              </div>
            ) : (
              <div className="py-1">
                {bookmarks.map((bookmark) => {
                  const IconComp = BookmarkIconComponent[bookmark.icon || 'star'];
                  return (
                    <div
                      key={bookmark.id}
                      className="group flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => handleNavigate(bookmark)}
                    >
                      <span style={{ color: bookmark.color }}>
                        <IconComp className="h-4 w-4 shrink-0" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{bookmark.name}</p>
                        {bookmark.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {bookmark.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate(bookmark);
                              }}
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              {t('bookmarks.goTo')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditBookmark(bookmark);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateBookmark(bookmark.id, t('bookmarks.copySuffix'));
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              {t('bookmarks.duplicate')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBookmark(bookmark.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingBookmark ? (
                <>
                  <Edit className="h-5 w-5" />
                  {t('bookmarks.editBookmark')}
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-5 w-5" />
                  {t('bookmarks.saveCurrentView')}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('bookmarks.name')}</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('bookmarks.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('bookmarks.description')}</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('bookmarks.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('bookmarks.icon')}</Label>
              <div className="flex flex-wrap gap-1">
                {BOOKMARK_ICONS.map((icon) => {
                  const IconComp = BookmarkIconComponent[icon];
                  return (
                    <Button
                      key={icon}
                      variant={formIcon === icon ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setFormIcon(icon)}
                    >
                      <IconComp className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('bookmarks.color')}</Label>
              <div className="flex flex-wrap gap-1">
                {BOOKMARK_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'h-6 w-6 rounded-full border-2 transition-transform',
                      formColor === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
              </div>
            </div>

            {!editingBookmark && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                <p className="font-medium mb-1">{t('bookmarks.currentPosition')}</p>
                <p>{t('bookmarks.raLabel')}: {currentRa.toFixed(4)}° • {t('bookmarks.decLabel')}: {currentDec.toFixed(4)}°</p>
                <p>{t('bookmarks.fovLabel')}: {currentFov.toFixed(1)}°</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveBookmark} disabled={!formName.trim()}>
              {editingBookmark ? t('common.save') : t('bookmarks.saveBookmark')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
ViewBookmarks.displayName = 'ViewBookmarks';
