'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Plus,
  Trash2,
  Star,
  Loader2,
  Navigation,
  Check,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useLocations, tauriApi } from '@/lib/tauri';

interface LocationManagerProps {
  trigger?: React.ReactNode;
  onLocationChange?: (lat: number, lon: number, alt: number) => void;
}

export function LocationManager({ trigger, onLocationChange }: LocationManagerProps) {
  const t = useTranslations();
  const { locations, currentLocation, loading, refresh, setCurrent, isAvailable } = useLocations();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    altitude: '',
    bortle_class: '',
  });

  if (!isAvailable) {
    return null;
  }

  const handleAdd = async () => {
    if (!form.name || !form.latitude || !form.longitude) {
      toast.error(t('locations.fillRequired') || 'Please fill required fields');
      return;
    }

    try {
      await tauriApi.locations.add({
        name: form.name,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        altitude: parseFloat(form.altitude) || 0,
        bortle_class: form.bortle_class ? parseInt(form.bortle_class) : undefined,
        is_default: !locations?.locations.length,
        is_current: !locations?.locations.length,
      });
      
      toast.success(t('locations.added') || 'Location added');
      setForm({ name: '', latitude: '', longitude: '', altitude: '', bortle_class: '' });
      setAdding(false);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tauriApi.locations.delete(id);
      toast.success(t('locations.deleted') || 'Location deleted');
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleSetCurrent = async (id: string) => {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-2" />
            {currentLocation?.name || t('locations.title') || 'Location'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('locations.title') || 'Observation Locations'}
          </DialogTitle>
          <DialogDescription>
            {t('locations.description') || 'Manage your observation sites'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-[200px]">
              {locations?.locations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {t('locations.noLocations') || 'No locations added'}
                </p>
              ) : (
                <div className="space-y-2">
                  {locations?.locations.map((loc) => (
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleSetCurrent(loc.id)}
                            title={t('locations.setAsCurrent') || 'Set as current'}
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {adding ? (
              <div className="space-y-3 border rounded p-3">
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
                  <div>
                    <Label>{t('locations.bortleClass') || 'Bortle Class'}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="9"
                      value={form.bortle_class}
                      onChange={(e) => setForm({ ...form, bortle_class: e.target.value })}
                      placeholder="4"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAdd}>
                    {t('common.save') || 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleUseGPS}>
                    <Navigation className="h-4 w-4 mr-1" />
                    {t('locations.useGPS') || 'Use GPS'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
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
    </Dialog>
  );
}
