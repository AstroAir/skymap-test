'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useMarkerStore,
  useStellariumStore,
  type SkyMarker,
  type MarkerSortBy,
  MARKER_COLORS,
  MARKER_ICONS,
  MAX_MARKERS,
} from '@/lib/stores';
import { readFileAsText } from '@/lib/storage';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPinned,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Navigation,
  Trash,
  Search,
  Tag,
  Download,
  Upload,
  Pencil,
  ArrowUpDown,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    markers, groups, showMarkers, showLabels, globalMarkerSize, sortBy,
    pendingCoords, editingMarkerId,
    addMarker, removeMarker, updateMarker, toggleMarkerVisibility,
    setShowMarkers, setShowLabels, setGlobalMarkerSize, setSortBy,
    clearAllMarkers, setPendingCoords, setEditingMarkerId,
    renameGroup, removeGroup, exportMarkers, importMarkers,
  } = useMarkerStore(useShallow((state) => ({
    markers: state.markers,
    groups: state.groups,
    showMarkers: state.showMarkers,
    showLabels: state.showLabels,
    globalMarkerSize: state.globalMarkerSize,
    sortBy: state.sortBy,
    pendingCoords: state.pendingCoords,
    editingMarkerId: state.editingMarkerId,
    addMarker: state.addMarker,
    removeMarker: state.removeMarker,
    updateMarker: state.updateMarker,
    toggleMarkerVisibility: state.toggleMarkerVisibility,
    setShowMarkers: state.setShowMarkers,
    setShowLabels: state.setShowLabels,
    setGlobalMarkerSize: state.setGlobalMarkerSize,
    setSortBy: state.setSortBy,
    clearAllMarkers: state.clearAllMarkers,
    setPendingCoords: state.setPendingCoords,
    setEditingMarkerId: state.setEditingMarkerId,
    renameGroup: state.renameGroup,
    removeGroup: state.removeGroup,
    exportMarkers: state.exportMarkers,
    importMarkers: state.importMarkers,
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

  // Filter markers by selected group and search query, then sort
  const filteredMarkers = useMemo(() => {
    let result = selectedGroup
      ? markers.filter((m) => m.group === selectedGroup)
      : markers;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
      );
    }
    
    const sorted = [...result];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'ra':
        sorted.sort((a, b) => a.ra - b.ra);
        break;
      case 'date':
      default:
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }
    return sorted;
  }, [markers, selectedGroup, searchQuery, sortBy]);

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
      const id = addMarker({
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
      if (id === null) {
        toast.warning(t('markers.maxMarkersReached', { max: MAX_MARKERS }));
        return;
      }
    }

    setEditDialogOpen(false);
    setEditingMarker(null);
    setFormData(defaultFormData);
  }, [formData, editingMarker, addMarker, updateMarker, t]);

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

  // Export markers
  const handleExport = useCallback(() => {
    try {
      const json = exportMarkers();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skymap-markers-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('markers.exportSuccess'));
    } catch {
      toast.error('Export failed');
    }
  }, [exportMarkers, t]);

  // Import markers
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const json = await readFileAsText(file);
      const { count } = importMarkers(json);
      toast.success(t('markers.importSuccess', { count }));
    } catch {
      toast.error(t('markers.importError'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [importMarkers, t]);

  // Rename group
  const handleRenameGroup = useCallback((oldName: string) => {
    if (!renameValue.trim() || renameValue === oldName) {
      setRenamingGroup(null);
      return;
    }
    renameGroup(oldName, renameValue.trim());
    if (selectedGroup === oldName) setSelectedGroup(renameValue.trim());
    setRenamingGroup(null);
  }, [renameValue, renameGroup, selectedGroup]);

  // Delete group
  const handleDeleteGroup = useCallback(() => {
    if (!deleteGroupTarget) return;
    removeGroup(deleteGroupTarget);
    if (selectedGroup === deleteGroupTarget) setSelectedGroup(null);
    setDeleteGroupTarget(null);
  }, [deleteGroupTarget, removeGroup, selectedGroup]);

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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('h-8 w-8', showLabels && 'bg-accent')}
                      onClick={() => setShowLabels(!showLabels)}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showLabels ? t('markers.hideLabels') : t('markers.showLabels')}
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

          {/* Search & Sort */}
          <div className="px-4 pb-2 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('markers.search')}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as MarkerSortBy)}>
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{t('markers.sortByDate')}</SelectItem>
                  <SelectItem value="name">{t('markers.sortByName')}</SelectItem>
                  <SelectItem value="ra">{t('markers.sortByRA')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Marker size slider */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">{t('markers.size')}</Label>
              <Slider
                value={[globalMarkerSize]}
                onValueChange={([v]) => setGlobalMarkerSize(v)}
                min={8}
                max={48}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-6 text-right">{globalMarkerSize}</span>
            </div>
          </div>

          {/* Group filters */}
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
                if (renamingGroup === group) {
                  return (
                    <Input
                      key={group}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameGroup(group)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameGroup(group);
                        if (e.key === 'Escape') setRenamingGroup(null);
                      }}
                      className="h-6 w-24 text-xs px-1"
                      autoFocus
                    />
                  );
                }
                return (
                  <Popover key={group}>
                    <PopoverTrigger asChild>
                      <Badge
                        variant={selectedGroup === group ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedGroup(group)}
                      >
                        {group} ({count})
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 p-1" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-7"
                        onClick={() => {
                          setRenamingGroup(group);
                          setRenameValue(group);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1.5" />
                        {t('markers.renameGroup')}
                      </Button>
                      {group !== 'Default' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteGroupTarget(group)}
                        >
                          <Trash2 className="h-3 w-3 mr-1.5" />
                          {t('markers.deleteGroup')}
                        </Button>
                      )}
                    </PopoverContent>
                  </Popover>
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

          {/* Footer: import/export + clear */}
          <Separator />
          <div className="p-2 space-y-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={handleExport}
                disabled={markers.length === 0}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                {t('markers.exportMarkers')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                {t('markers.importMarkers')}
              </Button>
            </div>
            {markers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive h-7 text-xs"
                onClick={() => {
                  setEditingMarker(null);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash className="h-3.5 w-3.5 mr-1" />
                {t('markers.clearAll')}
              </Button>
            )}
          </div>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Input
                    id="group"
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    placeholder={t('markers.groupPlaceholder')}
                    autoComplete="off"
                  />
                </PopoverTrigger>
                {groups.length > 0 && (
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-1"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                      {groups
                        .filter((g) => !formData.group || g.toLowerCase().includes(formData.group.toLowerCase()))
                        .map((group) => (
                          <button
                            key={group}
                            type="button"
                            className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors"
                            onClick={() => setFormData({ ...formData, group })}
                          >
                            {group}
                          </button>
                        ))}
                    </div>
                  </PopoverContent>
                )}
              </Popover>
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

      {/* Delete Group Confirmation */}
      <AlertDialog open={!!deleteGroupTarget} onOpenChange={(open) => !open && setDeleteGroupTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('markers.deleteGroup')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('markers.deleteGroupDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteGroup}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

