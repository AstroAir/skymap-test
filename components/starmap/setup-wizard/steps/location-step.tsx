'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Navigation, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSetupWizardStore } from '@/lib/stores/setup-wizard-store';

// Simple location storage for setup wizard
const LOCATION_STORAGE_KEY = 'skymap-observer-location';

interface ObserverLocation {
  latitude: number;
  longitude: number;
  altitude: number;
}

function loadStoredLocation(): ObserverLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveLocation(location: ObserverLocation): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Ignore storage errors
  }
}

export function LocationStep() {
  const t = useTranslations();
  const updateSetupData = useSetupWizardStore((state) => state.updateSetupData);
  
  const [location, setLocationState] = useState<ObserverLocation | null>(null);
  
  const setLocation = useCallback((loc: ObserverLocation) => {
    setLocationState(loc);
    saveLocation(loc);
  }, []);
  
  // Load stored location on mount
  useEffect(() => {
    const stored = loadStoredLocation();
    if (stored) {
      setLocationState(stored);
    }
  }, []);

  const [inputMode, setInputMode] = useState<'gps' | 'manual'>('gps');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState(location?.latitude?.toString() || '');
  const [manualLon, setManualLon] = useState(location?.longitude?.toString() || '');

  const hasLocation = location && location.latitude !== 0 && location.longitude !== 0;

  useEffect(() => {
    if (hasLocation) {
      updateSetupData({ locationConfigured: true });
    }
  }, [hasLocation, updateSetupData]);

  const handleGetGPSLocation = async () => {
    if (!navigator.geolocation) {
      setGpsError(t('setupWizard.steps.location.gpsNotSupported'));
      return;
    }

    setIsGettingLocation(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || 0,
        });
        setManualLat(position.coords.latitude.toString());
        setManualLon(position.coords.longitude.toString());
        setIsGettingLocation(false);
        updateSetupData({ locationConfigured: true });
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError(t('setupWizard.steps.location.permissionDenied'));
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError(t('setupWizard.steps.location.positionUnavailable'));
            break;
          case error.TIMEOUT:
            setGpsError(t('setupWizard.steps.location.timeout'));
            break;
          default:
            setGpsError(t('setupWizard.steps.location.unknownError'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const isManualValid = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  };

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    setLocation({
      latitude: lat,
      longitude: lon,
      altitude: 0,
    });
    updateSetupData({ locationConfigured: true });
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        {t('setupWizard.steps.location.description')}
      </p>

      {/* Mode selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setInputMode('gps')}
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
            inputMode === 'gps'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            inputMode === 'gps' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            <Navigation className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{t('setupWizard.steps.location.useGPS')}</p>
            <p className="text-xs text-muted-foreground">{t('setupWizard.steps.location.automatic')}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
            inputMode === 'manual'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            inputMode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{t('setupWizard.steps.location.enterManually')}</p>
            <p className="text-xs text-muted-foreground">{t('setupWizard.steps.location.coordinates')}</p>
          </div>
        </button>
      </div>

      {/* GPS mode */}
      {inputMode === 'gps' && (
        <div className="space-y-4">
          <Button
            onClick={handleGetGPSLocation}
            disabled={isGettingLocation}
            className="w-full gap-2"
            variant="outline"
          >
            {isGettingLocation ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t('setupWizard.steps.location.detecting')}
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                {t('setupWizard.steps.location.detectLocation')}
              </>
            )}
          </Button>

          {gpsError && (
            <p className="text-sm text-destructive text-center">{gpsError}</p>
          )}
        </div>
      )}

      {/* Manual mode */}
      {inputMode === 'manual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{t('setupWizard.steps.location.latitude')}</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="-90 to 90"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">{t('setupWizard.steps.location.longitude')}</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-180 to 180"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleManualSubmit}
            disabled={!isManualValid()}
            className="w-full"
            variant="outline"
          >
            {t('setupWizard.steps.location.setLocation')}
          </Button>
        </div>
      )}

      {/* Current location display */}
      {hasLocation && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('setupWizard.steps.location.locationSet')}
            </p>
            <p className="text-xs text-muted-foreground">
              {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
            </p>
          </div>
        </div>
      )}

      {/* Skip note */}
      <p className="text-xs text-muted-foreground text-center">
        {t('setupWizard.steps.location.skipNote')}
      </p>
    </div>
  );
}
