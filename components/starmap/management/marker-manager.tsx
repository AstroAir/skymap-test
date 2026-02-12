'use client';

import { useState, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslations } from 'next-intl';
import {
  useMarkerStore,
  useStellariumStore,
  type SkyMarker,
  MARKER_COLORS,
  MARKER_ICONS,
} from '@/lib/stores';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  MapPinned,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Navigation,
  Trash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkerIconDisplay } from '@/lib/constants/marker-icons';
import type { MarkerIcon } from '@/lib/stores';
import type { MarkerFormData, MarkerManagerProps } from '@/types/starmap/management';

const defaultFormData: MarkerFormData = {
  name: '',
  description: '',
  color: MARKER_COLORS[4], // teal
  icon: 'pin',
  group: 'Default',
  ra: 0,
  dec: 0,
  raString: '',
  decString: '',
};

export function MarkerManager({ initialCoords, onNavigateToMarker }: MarkerManagerProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<SkyMarker | null>(null);
  const [formData, setFormData] = useState<MarkerFormData>(defaultFormData);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const {
    markers, groups, showMarkers, pendingCoords, editingMarkerId,
    addMarker, removeMarker, updateMarker, toggleMarkerVisibility,
    setShowMarkers, clearAllMarkers, setPendingCoords, setEditingMarkerId,
  } = useMarkerStore(useShallow((state) => ({
    markers: state.markers,
    groups: state.groups,
    showMarkers: state.showMarkers,
    pendingCoords: state.pendingCoords,
    editingMarkerId: state.editingMarkerId,
    addMarker: state.addMarker,
    removeMarker: state.removeMarker,
    updateMarker: state.updateMarker,
    toggleMarkerVisibility: state.toggleMarkerVisibility,
    setShowMarkers: state.setShowMarkers,
    clearAllMarkers: state.clearAllMarkers,
    setPendingCoords: state.setPendingCoords,
    setEditingMarkerId: state.setEditingMarkerId,
  })));
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);

  // Listen for pending coords from context menu and open add dialog
  useEffect(() => {
    if (pendingCoords) {
      // Use RAF to avoid lint warning about setState in effect
      requestAnimationFrame(() => {
        setFormData({
          ...defaultFormData,
          name: `Marker @ ${pendingCoords.raString.slice(0, 8)}`,
          ra: pendingCoords.ra,
          dec: pendingCoords.dec,
          raString: pendingCoords.raString,
          decString: pendingCoords.decString,
        });
        setEditingMarker(null);
        setEditDialogOpen(true);
      });
      // Clear pending coords immediately
      setPendingCoords(null);
    }
  }, [pendingCoords, setPendingCoords]);

  // Listen for editing marker ID from context menu and open edit dialog
  useEffect(() => {
    if (editingMarkerId) {
      const markerToEdit = markers.find(m => m.id === editingMarkerId);
      if (markerToEdit) {
        requestAnimationFrame(() => {
          setFormData({
            name: markerToEdit.name,
            description: markerToEdit.description || '',
            color: markerToEdit.color,
            icon: markerToEdit.icon,
            group: markerToEdit.group || 'Default',
            ra: markerToEdit.ra,
            dec: markerToEdit.dec,
            raString: markerToEdit.raString,
            decString: markerToEdit.decString,
          });
          setEditingMarker(markerToEdit);
          setEditDialogOpen(true);
        });
      }
      // Clear editing marker ID
      setEditingMarkerId(null);
    }
  }, [editingMarkerId, markers, setEditingMarkerId]);

  // Filter markers by selected group
  const filteredMarkers = selectedGroup
    ? markers.filter((m) => m.group === selectedGroup)
    : markers;

  // Open add marker dialog with initial coordinates
  const handleAddMarker = useCallback(
    (coords?: { ra: number; dec: number; raStr: string; decStr: string } | null) => {
      const coordsToUse = coords || initialCoords;
      setFormData({
        ...defaultFormData,
        name: coordsToUse ? `Marker @ ${coordsToUse.raStr.slice(0, 8)}` : '',
        ra: coordsToUse?.ra || 0,
        dec: coordsToUse?.dec || 0,
        raString: coordsToUse?.raStr || '',
        decString: coordsToUse?.decStr || '',
      });
      setEditingMarker(null);
      setEditDialogOpen(true);
    },
    [initialCoords]
  );

  // Open edit marker dialog
  const handleEditMarker = useCallback((marker: SkyMarker) => {
    setFormData({
      name: marker.name,
      description: marker.description || '',
      color: marker.color,
      icon: marker.icon,
      group: marker.group || 'Default',
      ra: marker.ra,
      dec: marker.dec,
      raString: marker.raString,
      decString: marker.decString,
    });
    setEditingMarker(marker);
    setEditDialogOpen(true);
  }, []);

  // Save marker (add or update)
  const handleSaveMarker = useCallback(() => {
    if (!formData.name.trim()) return;

    if (editingMarker) {
      updateMarker(editingMarker.id, {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        icon: formData.icon,
        group: formData.group,
      });
    } else {
      addMarker({
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        icon: formData.icon,
        group: formData.group,
        ra: formData.ra,
        dec: formData.dec,
        raString: formData.raString,
        decString: formData.decString,
      });
    }

    setEditDialogOpen(false);
    setEditingMarker(null);
    setFormData(defaultFormData);
  }, [formData, editingMarker, addMarker, updateMarker]);

  // Confirm delete marker
  const handleConfirmDelete = useCallback(() => {
    if (editingMarker) {
      removeMarker(editingMarker.id);
      setDeleteDialogOpen(false);
      setEditingMarker(null);
    }
  }, [editingMarker, removeMarker]);

  // Navigate to marker
  const handleNavigate = useCallback(
    (marker: SkyMarker) => {
      if (setViewDirection) {
        setViewDirection(marker.ra, marker.dec);
      }
      onNavigateToMarker?.(marker);
    },
    [setViewDirection, onNavigateToMarker]
  );

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
        <Tooltip>
          <TooltipTrigger asChild>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 touch-target toolbar-btn">
                <MapPinned className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('markers.skyMarkers')}</p>
          </TooltipContent>
        </Tooltip>

        <DrawerContent className="w-[85vw] max-w-[320px] sm:max-w-[400px] md:max-w-[450px] h-full drawer-content">
          <DrawerHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                <MapPinned className="h-5 w-5" />
                {t('markers.skyMarkers')}
              </DrawerTitle>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowMarkers(!showMarkers)}
                    >
                      {showMarkers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showMarkers ? t('markers.hideAll') : t('markers.showAll')}
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleAddMarker()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-2">
            <div className="flex gap-1 flex-wrap">
              <Badge
                variant={selectedGroup === null ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedGroup(null)}
              >
                {t('markers.allGroups')} ({markers.length})
              </Badge>
              {groups.map((group) => {
                const count = markers.filter((m) => m.group === group).length;
                return (
                  <Badge
                    key={group}
                    variant={selectedGroup === group ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedGroup(group)}
                  >
                    {group} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>

          <Separator />

          <ScrollArea className="h-[calc(100vh-180px)]">
            {filteredMarkers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <MapPinned className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">{t('markers.noMarkers')}</p>
                <p className="text-center text-sm mt-1">{t('markers.noMarkersHint')}</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredMarkers.map((marker) => {
                  const IconComponent = MarkerIconDisplay[marker.icon];
                  return (
                    <div
                      key={marker.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 group',
                        !marker.visible && 'opacity-50'
                      )}
                    >
                      <IconComponent
                        className="h-5 w-5 shrink-0"
                        style={{ color: marker.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{marker.name}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {marker.raString} / {marker.decString}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate(marker);
                              }}
                            >
                              <Navigation className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{t('markers.goTo')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMarkerVisibility(marker.id);
                              }}
                            >
                              {marker.visible ? (
                                <Eye className="h-3.5 w-3.5" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {marker.visible ? t('markers.hide') : t('markers.show')}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMarker(marker);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{t('common.edit')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMarker(marker);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{t('common.delete')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {markers.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => {
                    setEditingMarker(null);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {t('markers.clearAll')}
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Add/Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMarker ? t('markers.editMarker') : t('markers.addMarker')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('markers.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('markers.namePlaceholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t('markers.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('markers.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            {!editingMarker && formData.raString && (
              <div className="grid gap-2">
                <Label>{t('coordinates.coordinates')}</Label>
                <div className="text-sm font-mono bg-muted p-2 rounded">
                  RA: {formData.raString} / Dec: {formData.decString}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>{t('markers.icon')}</Label>
              <ToggleGroup
                type="single"
                value={formData.icon}
                onValueChange={(value) => value && setFormData({ ...formData, icon: value as MarkerIcon })}
                className="flex-wrap justify-start"
              >
                {MARKER_ICONS.map((icon) => {
                  const IconComponent = MarkerIconDisplay[icon];
                  return (
                    <ToggleGroupItem
                      key={icon}
                      value={icon}
                      aria-label={icon}
                      className="h-9 w-9"
                    >
                      <IconComponent className="h-4 w-4" />
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            </div>

            <div className="grid gap-2">
              <Label>{t('markers.color')}</Label>
              <div className="flex gap-1 flex-wrap">
                {MARKER_COLORS.map((color) => (
                  <Button
                    key={color}
                    variant="ghost"
                    size="icon"
                    aria-label={color}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 p-0',
                      formData.color === color ? 'border-primary scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="group">{t('markers.group')}</Label>
              <div className="flex gap-2">
                <Input
                  id="group"
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  list="groups"
                  placeholder={t('markers.groupPlaceholder')}
                />
                <datalist id="groups">
                  {groups.map((group) => (
                    <option key={group} value={group} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveMarker} disabled={!formData.name.trim()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingMarker ? t('markers.deleteMarker') : t('markers.clearAllMarkers')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingMarker
                ? t('markers.deleteMarkerDescription', { name: editingMarker.name })
                : t('markers.clearAllDescription', { count: markers.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (editingMarker) {
                  handleConfirmDelete();
                } else {
                  clearAllMarkers();
                  setDeleteDialogOpen(false);
                }
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

