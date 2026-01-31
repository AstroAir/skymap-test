'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  MapPinOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMountStore } from '@/lib/stores';
import { cn } from '@/lib/utils';
import { SettingsSection } from './settings-shared';

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown' | 'checking';

function LocationPermissionStatus() {
  const t = useTranslations();
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  const setProfileInfo = useMountStore((state) => state.setProfileInfo);
  const profileInfo = useMountStore((state) => state.profileInfo);

  useEffect(() => {
    const checkPermission = async () => {
      setPermissionState('checking');
      try {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionState(result.state as PermissionState);
          
          result.addEventListener('change', () => {
            setPermissionState(result.state as PermissionState);
          });
        } else {
          setPermissionState('unknown');
        }
      } catch {
        setPermissionState('unknown');
      }
    };
    
    checkPermission();
  }, []);
  
  const handleRequestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      return;
    }
    
    setIsRequesting(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionState('granted');
        setIsRequesting(false);
        
        setProfileInfo({
          ...profileInfo,
          AstrometrySettings: {
            ...profileInfo.AstrometrySettings,
            Latitude: position.coords.latitude,
            Longitude: position.coords.longitude,
            Elevation: position.coords.altitude || profileInfo.AstrometrySettings.Elevation || 0,
          },
        });
      },
      (error) => {
        setIsRequesting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
        } else {
          setPermissionState('unknown');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [profileInfo, setProfileInfo]);
  
  const getStatusIcon = () => {
    switch (permissionState) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'prompt':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />;
      default:
        return <MapPinOff className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getStatusText = () => {
    switch (permissionState) {
      case 'granted':
        return t('settings.locationGranted');
      case 'denied':
        return t('settings.locationDenied');
      case 'prompt':
        return t('settings.locationPrompt');
      case 'checking':
        return t('settings.locationChecking');
      default:
        return t('settings.locationUnknown');
    }
  };
  
  const getStatusColor = () => {
    switch (permissionState) {
      case 'granted':
        return 'bg-green-500/10 border-green-500/30';
      case 'denied':
        return 'bg-red-500/10 border-red-500/30';
      case 'prompt':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-muted/50 border-border';
    }
  };
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      getStatusColor()
    )}>
      <div className="flex items-center gap-2 min-w-0">
        {getStatusIcon()}
        <div className="min-w-0">
          <span className="text-sm font-medium">{t('settings.locationPermission')}</span>
          <p className="text-xs text-muted-foreground truncate">{getStatusText()}</p>
        </div>
      </div>
      
      {(permissionState === 'prompt' || permissionState === 'unknown' || permissionState === 'granted') && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 ml-2"
          onClick={handleRequestLocation}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span className="ml-1.5 hidden sm:inline">
            {permissionState === 'granted' ? t('settings.refreshLocation') : t('settings.getLocation')}
          </span>
        </Button>
      )}
    </div>
  );
}

export function LocationSettings() {
  const t = useTranslations();
  const profileInfo = useMountStore((state) => state.profileInfo);
  const setProfileInfo = useMountStore((state) => state.setProfileInfo);

  return (
    <SettingsSection
      title={t('settings.location')}
      icon={<MapPin className="h-4 w-4" />}
      defaultOpen={false}
    >
      <div className="space-y-3">
        {/* Instant effect hint */}
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
          {t('settings.locationInstantHint')}
        </p>
        
        <LocationPermissionStatus />
        
        {/* Manual Location Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t('settings.manualLocation')}</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{t('settings.latitude')}</Label>
              <Input
                type="number"
                step="0.0001"
                min={-90}
                max={90}
                value={profileInfo.AstrometrySettings.Latitude || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setProfileInfo({
                    ...profileInfo,
                    AstrometrySettings: {
                      ...profileInfo.AstrometrySettings,
                      Latitude: Math.max(-90, Math.min(90, val)),
                    },
                  });
                }}
                placeholder={t('settings.latitudePlaceholder')}
                className="h-8 text-sm font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{t('settings.longitude')}</Label>
              <Input
                type="number"
                step="0.0001"
                min={-180}
                max={180}
                value={profileInfo.AstrometrySettings.Longitude || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setProfileInfo({
                    ...profileInfo,
                    AstrometrySettings: {
                      ...profileInfo.AstrometrySettings,
                      Longitude: Math.max(-180, Math.min(180, val)),
                    },
                  });
                }}
                placeholder={t('settings.longitudePlaceholder')}
                className="h-8 text-sm font-mono"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">{t('settings.elevation')} (m)</Label>
            <Input
              type="number"
              step="1"
              value={profileInfo.AstrometrySettings.Elevation || 0}
              onChange={(e) => setProfileInfo({
                ...profileInfo,
                AstrometrySettings: {
                  ...profileInfo.AstrometrySettings,
                  Elevation: parseFloat(e.target.value) || 0,
                },
              })}
              placeholder={t('settings.elevationPlaceholder')}
              className="h-8 text-sm font-mono"
            />
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
