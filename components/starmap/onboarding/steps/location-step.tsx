'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Navigation, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useMountStore } from '@/lib/stores/mount-store';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import type { ObserverLocation } from '@/types/starmap/onboarding';
import { loadStoredLocation, saveLocation, isValidLocation } from '@/lib/utils/observer-location';

export function LocationStep() {
  const t = useTranslations();
  const updateSetupData = useOnboardingStore((state) => state.updateSetupData);
  const setProfileInfo = useMountStore((state) => state.setProfileInfo);

  const [location, setLocationState] = useState<ObserverLocation | null>(null);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState(location?.latitude?.toString() || '');
  const [manualLon, setManualLon] = useState(location?.longitude?.toString() || '');
  const [manualAlt, setManualAlt] = useState(location?.altitude?.toString() || '0');

  const setLocation = useCallback((loc: ObserverLocation) => {
    setLocationState(loc);
    saveLocation(loc);

    const currentProfile = useMountStore.getState().profileInfo;
    setProfileInfo({
      AstrometrySettings: {
        ...currentProfile.AstrometrySettings,
        Latitude: loc.latitude,
        Longitude: loc.longitude,
        Elevation: loc.altitude,
      },
    });
  }, [setProfileInfo]);

  // Load stored location on mount
  useEffect(() => {
    const stored = loadStoredLocation();
    if (stored) {
      setLocationState(stored);
      setManualLat(stored.latitude.toString());
      setManualLon(stored.longitude.toString());
      setManualAlt(stored.altitude.toString());

      const currentProfile = useMountStore.getState().profileInfo;
      setProfileInfo({
        AstrometrySettings: {
          ...currentProfile.AstrometrySettings,
          Latitude: stored.latitude,
          Longitude: stored.longitude,
          Elevation: stored.altitude,
        },
      });
    }
  }, [setProfileInfo]);

  const hasLocation = isValidLocation(location);

  useEffect(() => {
    updateSetupData({ locationConfigured: hasLocation });
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
        const alt = position.coords.altitude || 0;
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: alt,
        });
        setManualLat(position.coords.latitude.toString());
        setManualLon(position.coords.longitude.toString());
        setManualAlt(alt.toString());
        setIsGettingLocation(false);
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
    if (!isManualValid()) return;
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    const alt = parseFloat(manualAlt);

    setLocation({
      latitude: lat,
      longitude: lon,
      altitude: !isNaN(alt) && alt >= 0 ? alt : 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        {t('setupWizard.steps.location.description')}
      </p>

      {/* Mode selection with Tabs */}
      <Tabs defaultValue="gps" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gps" className="gap-2">
            <Navigation className="w-4 h-4" />
            {t('setupWizard.steps.location.useGPS')}
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Globe className="w-4 h-4" />
            {t('setupWizard.steps.location.enterManually')}
          </TabsTrigger>
        </TabsList>

        {/* GPS mode */}
        <TabsContent value="gps" className="space-y-4">
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
            <Alert variant="destructive">
              <AlertDescription>{gpsError}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Manual mode */}
        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{t('setupWizard.steps.location.latitude')}</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder={t('setupWizard.steps.location.latitudePlaceholder')}
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
                placeholder={t('setupWizard.steps.location.longitudePlaceholder')}
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="altitude">{t('setupWizard.steps.location.altitude')}</Label>
            <Input
              id="altitude"
              type="number"
              step="any"
              min="0"
              placeholder={t('setupWizard.steps.location.altitudePlaceholder')}
              value={manualAlt}
              onChange={(e) => setManualAlt(e.target.value)}
            />
          </div>

          <Button
            onClick={handleManualSubmit}
            disabled={!isManualValid()}
            className="w-full"
            variant="outline"
          >
            {t('setupWizard.steps.location.setLocation')}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Current location display */}
      {hasLocation && (
        <Alert className="bg-green-500/10 border-green-500/30">
          <Check className="h-4 w-4 text-green-500" />
          <AlertTitle>{t('setupWizard.steps.location.locationSet')}</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°{location.altitude > 0 ? `, ${location.altitude.toFixed(0)}m` : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Skip note */}
      <p className="text-xs text-muted-foreground text-center">
        {t('setupWizard.steps.location.skipNote')}
      </p>
    </div>
  );
}
