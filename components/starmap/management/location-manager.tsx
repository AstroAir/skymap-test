'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Plus,
  Trash2,
  Star,
  Loader2,
  Navigation,
  Check,
  Map,
  Pencil,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useLocations, tauriApi } from '@/lib/tauri';
import { MapLocationPicker } from '@/components/starmap/map';
import { createLogger } from '@/lib/logger';
import { validateLocationForm } from '@/lib/core/management-validators';
import type { WebLocation, LocationManagerProps } from '@/types/starmap/management';

const logger = createLogger('location-manager');

// Web location storage key
const WEB_LOCATIONS_KEY = 'starmap-web-locations';

function BortleClassSelect({ value, onChange, t }: { value: string; onChange: (v: string) => void; t: (key: string) => string }) {
  return (
    <div>
      <Label>{t('locations.bortleClass') || 'Bortle Class'}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('locations.bortlePlaceholder') || 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => (
            <SelectItem key={b} value={b.toString()}>
              {b} - {t(`locations.bortle${b}`) || `Class ${b}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function LocationManager({ trigger, onLocationChange }: LocationManagerProps) {
  const t = useTranslations();
  const { locations, currentLocation, loading, refresh, setCurrent, isAvailable: isTauriAvailable } = useLocations();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'manual' | 'map'>('manual');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  
  // Hydration-safe mounting detection using useSyncExternalStore
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  
  // Web locations state with lazy initialization
  const [webLocations, setWebLocations] = useState<WebLocation[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(WEB_LOCATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Computed current location for web
  const webCurrentLocation = webLocations.find(l => l.is_current) || null;

  // Save web locations to localStorage
  const saveWebLocations = useCallback((locs: WebLocation[]) => {
    try {
      localStorage.setItem(WEB_LOCATIONS_KEY, JSON.stringify(locs));
      setWebLocations(locs);
    } catch (e) {
      logger.error('Failed to save web locations', e);
    }
  }, []);

  // Form state
  const [form, setForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    altitude: '',
    bortle_class: '',
  });

  if (!mounted) {
    return null;
  }

  // Determine which data source to use
  const locationList = isTauriAvailable ? (locations?.locations ?? []) : webLocations;
  const activeLocation = isTauriAvailable ? currentLocation : webCurrentLocation;

  // Validate location form
  const validateLocation = (): string | null => {
    const errorKey = validateLocationForm(form);
    return errorKey ? (t(errorKey) || errorKey) : null;
  };

  // Start editing a location
  const handleStartEdit = (loc: WebLocation | { id: string; name: string; latitude: number; longitude: number; altitude: number; bortle_class?: number }) => {
    setForm({
      name: loc.name,
      latitude: loc.latitude.toString(),
      longitude: loc.longitude.toString(),
      altitude: loc.altitude.toString(),
      bortle_class: loc.bortle_class?.toString() || '',
    });
    setEditingId(loc.id);
    setAdding(true);
    setInputMethod('manual');
  };

  const handleAdd = async () => {
    const validationError = validateLocation();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const lat = parseFloat(form.latitude);
    const lon = parseFloat(form.longitude);
    const alt = parseFloat(form.altitude) || 0;
    const bortle = form.bortle_class ? parseInt(form.bortle_class) : undefined;

    if (isTauriAvailable) {
      try {
        if (editingId) {
          const existing = locations?.locations.find(l => l.id === editingId);
          if (existing) {
            await tauriApi.locations.update({
              ...existing,
              name: form.name,
              latitude: lat,
              longitude: lon,
              altitude: alt,
              bortle_class: bortle,
            });
          }
          toast.success(t('locations.updated') || 'Location updated');
        } else {
          await tauriApi.locations.add({
            name: form.name,
            latitude: lat,
            longitude: lon,
            altitude: alt,
            bortle_class: bortle,
            is_default: !locations?.locations.length,
            is_current: !locations?.locations.length,
          });
          toast.success(t('locations.added') || 'Location added');
        }
        setForm({ name: '', latitude: '', longitude: '', altitude: '', bortle_class: '' });
        setAdding(false);
        setEditingId(null);
        refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    } else {
      if (editingId) {
        // Web environment - update existing
        const updated = webLocations.map(l => l.id === editingId ? {
          ...l, name: form.name, latitude: lat, longitude: lon, altitude: alt, bortle_class: bortle,
        } : l);
        saveWebLocations(updated);
        toast.success(t('locations.updated') || 'Location updated');
        const loc = updated.find(l => l.id === editingId);
        if (loc?.is_current && onLocationChange) {
          onLocationChange(loc.latitude, loc.longitude, loc.altitude);
        }
      } else {
        // Web environment - add new
        const newLocation: WebLocation = {
          id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: form.name,
          latitude: lat,
          longitude: lon,
          altitude: alt,
          bortle_class: bortle,
          is_default: webLocations.length === 0,
          is_current: webLocations.length === 0,
        };
        saveWebLocations([...webLocations, newLocation]);
        toast.success(t('locations.added') || 'Location added');
        if (newLocation.is_current && onLocationChange) {
          onLocationChange(newLocation.latitude, newLocation.longitude, newLocation.altitude);
        }
      }
      setForm({ name: '', latitude: '', longitude: '', altitude: '', bortle_class: '' });
      setAdding(false);
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (isTauriAvailable) {
      try {
        await tauriApi.locations.delete(id);
        toast.success(t('locations.deleted') || 'Location deleted');
        refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    } else {
      const updated = webLocations.filter(l => l.id !== id);
      saveWebLocations(updated);
      toast.success(t('locations.deleted') || 'Location deleted');
    }
  };

  const handleSetCurrent = async (id: string) => {
    if (isTauriAvailable) {
      try {
        await setCurrent(id);
        const loc = locations?.locations.find(l => l.id === id);
        if (loc && onLocationChange) {
          onLocationChange(loc.latitude, loc.longitude, loc.altitude);
        }
        toast.success(t('locations.setCurrent') || 'Location set as current');
      } catch (e) {
        toast.error((e as Error).message);
      }
    } else {
      const updated = webLocations.map(l => ({ ...l, is_current: l.id === id }));
      saveWebLocations(updated);
      const loc = updated.find(l => l.id === id);
      if (loc && onLocationChange) {
        onLocationChange(loc.latitude, loc.longitude, loc.altitude);
      }
      toast.success(t('locations.setCurrent') || 'Location set as current');
    }
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      toast.error(t('locations.gpsNotSupported') || 'GPS not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm({
          ...form,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          altitude: position.coords.altitude?.toFixed(0) || '',
        });
        toast.success(t('locations.gpsAcquired') || 'GPS location acquired');
      },
      (error) => {
        toast.error(error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleMapLocationSelect = (location: { coordinates: { latitude: number; longitude: number }; address?: string }) => {
    setForm({
      ...form,
      latitude: location.coordinates.latitude.toFixed(6),
      longitude: location.coordinates.longitude.toFixed(6),
      name: form.name || location.address || `Location ${location.coordinates.latitude.toFixed(4)}, ${location.coordinates.longitude.toFixed(4)}`,
    });
  };

  const resetForm = () => {
    setForm({
      name: '',
      latitude: '',
      longitude: '',
      altitude: '',
      bortle_class: '',
    });
    setInputMethod('manual');
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-2" />
            {activeLocation?.name || t('locations.title') || 'Location'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('locations.title') || 'Observation Locations'}
          </DialogTitle>
          <DialogDescription>
            {t('locations.description') || 'Manage your observation sites'}
          </DialogDescription>
        </DialogHeader>

        {isTauriAvailable && loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-1">
            <ScrollArea className="max-h-[160px]">
              {locationList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <MapPin className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">{t('locations.noLocations') || 'No locations added'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {locationList.map((loc) => (
                    <div 
                      key={loc.id} 
                      className={`flex items-center justify-between p-2 border rounded ${
                        loc.is_current ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{loc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}°
                            {loc.bortle_class && ` • Bortle ${loc.bortle_class}`}
                          </p>
                        </div>
                        {loc.is_default && <Star className="h-3 w-3 text-yellow-500 shrink-0" />}
                        {loc.is_current && <Check className="h-3 w-3 text-green-500 shrink-0" />}
                      </div>
                      <div className="flex gap-1">
                        {!loc.is_current && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleSetCurrent(loc.id)}
                              >
                                <Navigation className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('locations.setAsCurrent') || 'Set as current'}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleStartEdit(loc)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('common.edit') || 'Edit'}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: loc.id, name: loc.name })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('common.delete') || 'Delete'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {adding ? (
              <div className="space-y-3 border rounded p-3">
                <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'manual' | 'map')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      {t('locations.manualInput') || 'Manual Input'}
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      {t('locations.mapSelection') || 'Map Selection'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-3 mt-3">
                    <div>
                      <Label>{t('locations.name') || 'Name'}</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder={t('locations.namePlaceholder') || 'e.g. Backyard, Dark Site'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>{t('locations.latitude') || 'Latitude'}</Label>
                        <Input
                          type="number"
                          step="any"
                          value={form.latitude}
                          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                          placeholder="39.9042"
                        />
                      </div>
                      <div>
                        <Label>{t('locations.longitude') || 'Longitude'}</Label>
                        <Input
                          type="number"
                          step="any"
                          value={form.longitude}
                          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                          placeholder="116.4074"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>{t('locations.altitude') || 'Altitude (m)'}</Label>
                        <Input
                          type="number"
                          value={form.altitude}
                          onChange={(e) => setForm({ ...form, altitude: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                      <BortleClassSelect value={form.bortle_class} onChange={(v) => setForm({ ...form, bortle_class: v })} t={t} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUseGPS}>
                        <Navigation className="h-4 w-4 mr-1" />
                        {t('locations.useGPS') || 'Use GPS'}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="map" className="mt-3">
                    <div className="space-y-3">
                      <div>
                        <Label>{t('locations.name') || 'Name'}</Label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder={t('locations.namePlaceholder') || 'e.g. Backyard, Dark Site'}
                        />
                      </div>
                      
                      <MapLocationPicker
                        initialLocation={{
                          latitude: parseFloat(form.latitude) || 39.9042,
                          longitude: parseFloat(form.longitude) || 116.4074,
                        }}
                        onLocationChange={(coords: { latitude: number; longitude: number }) => {
                          setForm({
                            ...form,
                            latitude: coords.latitude.toFixed(6),
                            longitude: coords.longitude.toFixed(6),
                          });
                        }}
                        onLocationSelect={handleMapLocationSelect}
                        height={220}
                        showSearch={true}
                        showControls={true}
                        compact
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>{t('locations.altitude') || 'Altitude (m)'}</Label>
                          <Input
                            type="number"
                            value={form.altitude}
                            onChange={(e) => setForm({ ...form, altitude: e.target.value })}
                            placeholder="100"
                          />
                        </div>
                        <BortleClassSelect value={form.bortle_class} onChange={(v) => setForm({ ...form, bortle_class: v })} t={t} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-3 border-t">
                  <Button size="sm" onClick={handleAdd}>
                    {editingId ? (t('common.update') || 'Update') : (t('common.save') || 'Save')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setAdding(false);
                    resetForm();
                  }}>
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('locations.addLocation') || 'Add Location'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('locations.deleteConfirmTitle') || 'Delete Location?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('locations.deleteConfirmDescription', { name: deleteTarget?.name ?? '' }) ||
                `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              {t('common.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
