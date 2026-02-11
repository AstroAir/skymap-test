'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Telescope, Camera, Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEquipmentStore, BUILTIN_CAMERA_PRESETS, BUILTIN_TELESCOPE_PRESETS } from '@/lib/stores/equipment-store';
import { useSetupWizardStore } from '@/lib/stores/setup-wizard-store';

export function EquipmentStep() {
  const t = useTranslations();
  const updateSetupData = useSetupWizardStore((state) => state.updateSetupData);
  
  const activeCameraId = useEquipmentStore((state) => state.activeCameraId);
  const activeTelescopeId = useEquipmentStore((state) => state.activeTelescopeId);
  const sensorWidth = useEquipmentStore((state) => state.sensorWidth);
  const sensorHeight = useEquipmentStore((state) => state.sensorHeight);
  const focalLength = useEquipmentStore((state) => state.focalLength);
  const pixelSize = useEquipmentStore((state) => state.pixelSize);
  const aperture = useEquipmentStore((state) => state.aperture);
  const customCameras = useEquipmentStore((state) => state.customCameras);
  const customTelescopes = useEquipmentStore((state) => state.customTelescopes);
  const applyCamera = useEquipmentStore((state) => state.applyCamera);
  const applyTelescope = useEquipmentStore((state) => state.applyTelescope);
  const setCameraSettings = useEquipmentStore((state) => state.setCameraSettings);
  const setTelescopeSettings = useEquipmentStore((state) => state.setTelescopeSettings);

  const [telescopeOpen, setTelescopeOpen] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(true);
  const [showManualTelescope, setShowManualTelescope] = useState(false);
  const [showManualCamera, setShowManualCamera] = useState(false);
  const [telescopeSearch, setTelescopeSearch] = useState('');
  const [cameraSearch, setCameraSearch] = useState('');

  // Manual input states
  const [manualFocalLength, setManualFocalLength] = useState(focalLength.toString());
  const [manualAperture, setManualAperture] = useState(aperture.toString());
  const [manualSensorWidth, setManualSensorWidth] = useState(sensorWidth.toString());
  const [manualSensorHeight, setManualSensorHeight] = useState(sensorHeight.toString());
  const [manualPixelSize, setManualPixelSize] = useState(pixelSize.toString());

  const telescopeConfigured = activeTelescopeId !== null || focalLength !== 400 || aperture !== 80;
  const cameraConfigured = activeCameraId !== null || sensorWidth !== 23.5 || sensorHeight !== 15.6 || pixelSize !== 3.76;
  const hasEquipment = telescopeConfigured || cameraConfigured;

  useEffect(() => {
    updateSetupData({ equipmentConfigured: hasEquipment });
  }, [hasEquipment, updateSetupData]);

  const allCameras = [...BUILTIN_CAMERA_PRESETS, ...customCameras];
  const allTelescopes = [...BUILTIN_TELESCOPE_PRESETS, ...customTelescopes];

  const filteredTelescopes = telescopeSearch
    ? allTelescopes.filter((t) => t.name.toLowerCase().includes(telescopeSearch.toLowerCase()))
    : allTelescopes;
  const filteredCameras = cameraSearch
    ? allCameras.filter((c) => c.name.toLowerCase().includes(cameraSearch.toLowerCase()))
    : allCameras;

  const handleSelectTelescope = (telescope: typeof BUILTIN_TELESCOPE_PRESETS[0]) => {
    applyTelescope(telescope);
    setShowManualTelescope(false);
  };

  const handleSelectCamera = (camera: typeof BUILTIN_CAMERA_PRESETS[0]) => {
    applyCamera(camera);
    setShowManualCamera(false);
  };

  const handleManualTelescopeApply = () => {
    const fl = parseFloat(manualFocalLength);
    const ap = parseFloat(manualAperture);
    if (!isNaN(fl) && fl > 0) {
      setTelescopeSettings({
        focalLength: fl,
        aperture: !isNaN(ap) && ap > 0 ? ap : undefined,
      });
    }
  };

  const handleManualCameraApply = () => {
    const sw = parseFloat(manualSensorWidth);
    const sh = parseFloat(manualSensorHeight);
    const ps = parseFloat(manualPixelSize);
    if (!isNaN(sw) && sw > 0 && !isNaN(sh) && sh > 0) {
      setCameraSettings({
        sensorWidth: sw,
        sensorHeight: sh,
        pixelSize: !isNaN(ps) && ps > 0 ? ps : undefined,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        {t('setupWizard.steps.equipment.description')}
      </p>

      {/* Telescope section */}
      <Collapsible open={telescopeOpen} onOpenChange={setTelescopeOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Telescope className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">{t('setupWizard.steps.equipment.telescope')}</span>
              {telescopeConfigured && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform',
              telescopeOpen && 'rotate-180'
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('setupWizard.steps.equipment.searchPlaceholder')}
              value={telescopeSearch}
              onChange={(e) => setTelescopeSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>

          {/* Preset grid */}
          <ScrollArea className="max-h-40">
            <div className="grid grid-cols-2 gap-2 pr-3">
              {filteredTelescopes.map((telescope) => (
                <button
                  key={telescope.id}
                  type="button"
                  onClick={() => handleSelectTelescope(telescope)}
                  aria-pressed={activeTelescopeId === telescope.id}
                  className={cn(
                    'p-2 rounded-lg border text-left transition-all text-sm',
                    activeTelescopeId === telescope.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <p className="font-medium truncate">{telescope.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {telescope.focalLength}mm f/{(telescope.focalLength / telescope.aperture).toFixed(1)}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Manual input toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowManualTelescope(!showManualTelescope)}
          >
            {showManualTelescope ? t('common.cancel') : t('setupWizard.steps.equipment.manualInput')}
          </Button>

          {showManualTelescope && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="setup-wizard-manual-focal-length">{t('fov.focalLength')} (mm)</Label>
                  <Input
                    id="setup-wizard-manual-focal-length"
                    type="number"
                    value={manualFocalLength}
                    onChange={(e) => setManualFocalLength(e.target.value)}
                    placeholder={t('setupWizard.steps.equipment.focalLengthPlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="setup-wizard-manual-aperture">{t('equipment.aperture')} (mm)</Label>
                  <Input
                    id="setup-wizard-manual-aperture"
                    type="number"
                    value={manualAperture}
                    onChange={(e) => setManualAperture(e.target.value)}
                    placeholder={t('setupWizard.steps.equipment.aperturePlaceholder')}
                  />
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={handleManualTelescopeApply}>
                {t('common.apply')}
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Camera section */}
      <Collapsible open={cameraOpen} onOpenChange={setCameraOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">{t('setupWizard.steps.equipment.camera')}</span>
              {cameraConfigured && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform',
              cameraOpen && 'rotate-180'
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('setupWizard.steps.equipment.searchPlaceholder')}
              value={cameraSearch}
              onChange={(e) => setCameraSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>

          {/* Preset grid */}
          <ScrollArea className="max-h-40">
            <div className="grid grid-cols-2 gap-2 pr-3">
              {filteredCameras.map((camera) => (
                <button
                  key={camera.id}
                  type="button"
                  onClick={() => handleSelectCamera(camera)}
                  aria-pressed={activeCameraId === camera.id}
                  className={cn(
                    'p-2 rounded-lg border text-left transition-all text-sm',
                    activeCameraId === camera.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <p className="font-medium truncate">{camera.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {camera.sensorWidth}×{camera.sensorHeight}mm
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Manual input toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowManualCamera(!showManualCamera)}
          >
            {showManualCamera ? t('common.cancel') : t('setupWizard.steps.equipment.manualInput')}
          </Button>

          {showManualCamera && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/30">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="setup-wizard-manual-sensor-width">{t('fov.sensorWidth')} (mm)</Label>
                  <Input
                    id="setup-wizard-manual-sensor-width"
                    type="number"
                    value={manualSensorWidth}
                    onChange={(e) => setManualSensorWidth(e.target.value)}
                    placeholder={t('setupWizard.steps.equipment.sensorWidthPlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="setup-wizard-manual-sensor-height">{t('fov.sensorHeight')} (mm)</Label>
                  <Input
                    id="setup-wizard-manual-sensor-height"
                    type="number"
                    value={manualSensorHeight}
                    onChange={(e) => setManualSensorHeight(e.target.value)}
                    placeholder={t('setupWizard.steps.equipment.sensorHeightPlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="setup-wizard-manual-pixel-size">{t('fov.pixelSize')} (μm)</Label>
                  <Input
                    id="setup-wizard-manual-pixel-size"
                    type="number"
                    value={manualPixelSize}
                    onChange={(e) => setManualPixelSize(e.target.value)}
                    placeholder={t('setupWizard.steps.equipment.pixelSizePlaceholder')}
                  />
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={handleManualCameraApply}>
                {t('common.apply')}
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Current equipment summary */}
      {hasEquipment && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">{t('setupWizard.steps.equipment.configured')}</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {telescopeConfigured && (
              <p>{t('fov.focalLength')}: {focalLength}mm</p>
            )}
            {cameraConfigured && (
              <p>{t('setupWizard.steps.equipment.sensor')}: {sensorWidth}×{sensorHeight}mm</p>
            )}
          </div>
        </div>
      )}

      {/* Skip note */}
      <p className="text-xs text-muted-foreground text-center">
        {t('setupWizard.steps.equipment.skipNote')}
      </p>
    </div>
  );
}
