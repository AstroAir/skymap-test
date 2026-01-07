'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Camera,
  Telescope,
  Plus,
  Trash2,
  RotateCw,
  Focus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useEquipmentStore,
  BUILTIN_CAMERA_PRESETS,
  BUILTIN_TELESCOPE_PRESETS,
} from '@/lib/stores';

export function EquipmentSettings() {
  const t = useTranslations();
  const [addCameraOpen, setAddCameraOpen] = useState(false);
  const [addTelescopeOpen, setAddTelescopeOpen] = useState(false);
  const [cameraSearch, setCameraSearch] = useState('');
  const [telescopeSearch, setTelescopeSearch] = useState('');
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraSensorWidth, setNewCameraSensorWidth] = useState('');
  const [newCameraSensorHeight, setNewCameraSensorHeight] = useState('');
  const [newCameraPixelSize, setNewCameraPixelSize] = useState('');
  const [newTelescopeName, setNewTelescopeName] = useState('');
  const [newTelescopeFocalLength, setNewTelescopeFocalLength] = useState('');
  const [newTelescopeAperture, setNewTelescopeAperture] = useState('');
  
  const {
    sensorWidth,
    sensorHeight,
    focalLength,
    pixelSize,
    aperture,
    rotationAngle,
    activeCameraId,
    activeTelescopeId,
    customCameras,
    customTelescopes,
    setSensorWidth,
    setSensorHeight,
    setFocalLength,
    setPixelSize,
    setAperture,
    setRotationAngle,
    applyCamera,
    applyTelescope,
    addCustomCamera,
    addCustomTelescope,
    removeCustomCamera,
    removeCustomTelescope,
    getFOVWidth,
    getFOVHeight,
    getImageScale,
    getFRatio,
  } = useEquipmentStore();

  const allCameras = useMemo(() => [...BUILTIN_CAMERA_PRESETS, ...customCameras], [customCameras]);
  const allTelescopes = useMemo(() => [...BUILTIN_TELESCOPE_PRESETS, ...customTelescopes], [customTelescopes]);

  const getCameraBrand = useCallback((name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('sony') || nameLower.includes('a7')) return 'Sony';
    if (nameLower.includes('canon') || nameLower.includes('eos')) return 'Canon';
    if (nameLower.includes('nikon') || nameLower.includes('nikkor')) return 'Nikon';
    if (nameLower.includes('zwo') || nameLower.includes('asi')) return 'ZWO';
    if (nameLower.includes('qhy')) return 'QHY';
    if (nameLower.includes('player one') || nameLower.includes('poseidon') || nameLower.includes('ares') || nameLower.includes('neptune') || nameLower.includes('uranus') || nameLower.includes('mars-c')) return 'Player One';
    if (nameLower.includes('atik')) return 'Atik';
    if (nameLower.includes('sbig')) return 'SBIG';
    if (nameLower.includes('fli') || nameLower.includes('kepler')) return 'FLI';
    if (nameLower.includes('moravian')) return 'Moravian';
    if (nameLower.includes('fuji')) return 'Fujifilm';
    if (nameLower.includes('olympus') || nameLower.includes('om system')) return 'OM System';
    if (nameLower.includes('panasonic')) return 'Panasonic';
    if (nameLower.includes('full frame') || nameLower.includes('aps-c') || nameLower.includes('micro')) return 'Generic';
    return 'Other';
  }, []);

  const groupedCameras = useMemo(() => {
    const searchLower = cameraSearch.toLowerCase().trim();
    const filtered = cameraSearch.trim() 
      ? BUILTIN_CAMERA_PRESETS.filter((camera) => camera.name.toLowerCase().includes(searchLower))
      : BUILTIN_CAMERA_PRESETS;
    
    const groups: Record<string, typeof BUILTIN_CAMERA_PRESETS> = {};
    const brandOrder = ['Canon', 'Sony', 'Nikon', 'Fujifilm', 'OM System', 'Panasonic', 'ZWO', 'QHY', 'Player One', 'Atik', 'SBIG', 'FLI', 'Moravian', 'Generic', 'Other'];
    
    filtered.forEach((camera) => {
      const brand = getCameraBrand(camera.name);
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(camera);
    });
    
    return brandOrder
      .filter((brand) => groups[brand]?.length > 0)
      .map((brand) => ({ brand, cameras: groups[brand] }));
  }, [cameraSearch, getCameraBrand]);

  const groupedTelescopes = useMemo(() => {
    const searchLower = telescopeSearch.toLowerCase().trim();
    const filtered = telescopeSearch.trim()
      ? BUILTIN_TELESCOPE_PRESETS.filter((t) => 
          t.name.toLowerCase().includes(searchLower) ||
          (t.type && t.type.toLowerCase().includes(searchLower))
        )
      : BUILTIN_TELESCOPE_PRESETS;
    
    const groups: Record<string, typeof BUILTIN_TELESCOPE_PRESETS> = {};
    const typeOrder = ['Lens', 'APO', 'Newtonian', 'SCT', 'RC', 'RASA', 'Mak'];
    
    filtered.forEach((telescope) => {
      const type = telescope.type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(telescope);
    });
    
    return typeOrder
      .filter((type) => groups[type]?.length > 0)
      .map((type) => ({ type, telescopes: groups[type] }));
  }, [telescopeSearch]);

  const totalFilteredCameras = useMemo(() => 
    groupedCameras.reduce((sum, g) => sum + g.cameras.length, 0), [groupedCameras]);
  const totalFilteredTelescopes = useMemo(() => 
    groupedTelescopes.reduce((sum, g) => sum + g.telescopes.length, 0), [groupedTelescopes]);

  const fovWidth = getFOVWidth();
  const fovHeight = getFOVHeight();
  const imageScale = getImageScale();
  const fRatio = getFRatio();

  const handleAddCamera = useCallback(() => {
    if (!newCameraName || !newCameraSensorWidth || !newCameraSensorHeight) return;
    addCustomCamera({
      name: newCameraName,
      sensorWidth: parseFloat(newCameraSensorWidth),
      sensorHeight: parseFloat(newCameraSensorHeight),
      pixelSize: parseFloat(newCameraPixelSize) || 3.76,
    });
    setNewCameraName('');
    setNewCameraSensorWidth('');
    setNewCameraSensorHeight('');
    setNewCameraPixelSize('');
    setAddCameraOpen(false);
  }, [newCameraName, newCameraSensorWidth, newCameraSensorHeight, newCameraPixelSize, addCustomCamera]);

  const handleAddTelescope = useCallback(() => {
    if (!newTelescopeName || !newTelescopeFocalLength) return;
    addCustomTelescope({
      name: newTelescopeName,
      focalLength: parseFloat(newTelescopeFocalLength),
      aperture: parseFloat(newTelescopeAperture) || 80,
      type: 'Custom',
    });
    setNewTelescopeName('');
    setNewTelescopeFocalLength('');
    setNewTelescopeAperture('');
    setAddTelescopeOpen(false);
  }, [newTelescopeName, newTelescopeFocalLength, newTelescopeAperture, addCustomTelescope]);

  return (
    <div className="space-y-4">
      {/* Camera Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4" />
          {t('equipment.camera')}
        </Label>
        <div className="flex gap-2">
          <Select
            value={activeCameraId || 'custom'}
            onValueChange={(value) => {
              if (value === 'custom') return;
              const camera = allCameras.find((c) => c.id === value);
              if (camera) applyCamera(camera);
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t('equipment.selectCamera')} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <div className="px-2 pb-2 sticky top-0 bg-popover z-10">
                <Input
                  placeholder={t('equipment.searchCamera')}
                  value={cameraSearch}
                  onChange={(e) => setCameraSearch(e.target.value)}
                  className="h-8 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <SelectItem value="custom">
                <span className="text-muted-foreground">{t('equipment.manualInput')}</span>
              </SelectItem>
              {groupedCameras.length > 0 && groupedCameras.map((group) => (
                <SelectGroup key={group.brand}>
                  <SelectLabel className="text-xs font-semibold text-primary/80">
                    {group.brand} ({group.cameras.length})
                  </SelectLabel>
                  {group.cameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{camera.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {camera.sensorWidth}×{camera.sensorHeight}mm
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              {totalFilteredCameras === 0 && cameraSearch && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t('equipment.noResults')}
                </div>
              )}
              {customCameras.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-primary/80">
                    {t('equipment.customPresets')} ({customCameras.length})
                  </SelectLabel>
                  {customCameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{camera.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {camera.sensorWidth}×{camera.sensorHeight}mm
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          <Dialog open={addCameraOpen} onOpenChange={setAddCameraOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('equipment.addCamera')}</DialogTitle>
                <DialogDescription>{t('equipment.addCameraDescription')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div className="space-y-2">
                  <Label>{t('equipment.name')}</Label>
                  <Input
                    value={newCameraName}
                    onChange={(e) => setNewCameraName(e.target.value)}
                    placeholder="e.g. ASI294MC Pro"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>{t('fov.sensorWidth')} (mm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newCameraSensorWidth}
                      onChange={(e) => setNewCameraSensorWidth(e.target.value)}
                      placeholder="23.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('fov.sensorHeight')} (mm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newCameraSensorHeight}
                      onChange={(e) => setNewCameraSensorHeight(e.target.value)}
                      placeholder="15.6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('fov.pixelSize')} (μm)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCameraPixelSize}
                    onChange={(e) => setNewCameraPixelSize(e.target.value)}
                    placeholder="3.76"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddCameraOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddCamera} disabled={!newCameraName || !newCameraSensorWidth || !newCameraSensorHeight}>
                  {t('common.add')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Camera Manual Input */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('fov.sensorWidth')}</Label>
            <Input
              type="number"
              step="0.1"
              value={sensorWidth}
              onChange={(e) => setSensorWidth(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('fov.sensorHeight')}</Label>
            <Input
              type="number"
              step="0.1"
              value={sensorHeight}
              onChange={(e) => setSensorHeight(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('fov.pixelSize')}</Label>
            <Input
              type="number"
              step="0.01"
              value={pixelSize}
              onChange={(e) => setPixelSize(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        
        {/* Custom cameras list */}
        {customCameras.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('equipment.customPresets')}</Label>
            <div className="flex flex-wrap gap-1">
              {customCameras.map((camera) => (
                <Badge
                  key={camera.id}
                  variant={activeCameraId === camera.id ? 'default' : 'secondary'}
                  className="cursor-pointer gap-1 pr-1"
                  onClick={() => applyCamera(camera)}
                >
                  {camera.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomCamera(camera.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Telescope Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Telescope className="h-4 w-4" />
          {t('equipment.telescope')}
        </Label>
        <div className="flex gap-2">
          <Select
            value={activeTelescopeId || 'custom'}
            onValueChange={(value) => {
              if (value === 'custom') return;
              const telescope = allTelescopes.find((t) => t.id === value);
              if (telescope) applyTelescope(telescope);
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t('equipment.selectTelescope')} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <div className="px-2 pb-2 sticky top-0 bg-popover z-10">
                <Input
                  placeholder={t('equipment.searchTelescope')}
                  value={telescopeSearch}
                  onChange={(e) => setTelescopeSearch(e.target.value)}
                  className="h-8 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <SelectItem value="custom">
                <span className="text-muted-foreground">{t('equipment.manualInput')}</span>
              </SelectItem>
              {groupedTelescopes.length > 0 && groupedTelescopes.map((group) => (
                <SelectGroup key={group.type}>
                  <SelectLabel className="text-xs font-semibold text-primary/80">
                    {group.type} ({group.telescopes.length})
                  </SelectLabel>
                  {group.telescopes.map((telescope) => (
                    <SelectItem key={telescope.id} value={telescope.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{telescope.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {telescope.focalLength}mm f/{(telescope.focalLength / telescope.aperture).toFixed(1)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              {totalFilteredTelescopes === 0 && telescopeSearch && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t('equipment.noResults')}
                </div>
              )}
              {customTelescopes.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-primary/80">
                    {t('equipment.customPresets')} ({customTelescopes.length})
                  </SelectLabel>
                  {customTelescopes.map((telescope) => (
                    <SelectItem key={telescope.id} value={telescope.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{telescope.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {telescope.focalLength}mm
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          <Dialog open={addTelescopeOpen} onOpenChange={setAddTelescopeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('equipment.addTelescope')}</DialogTitle>
                <DialogDescription>{t('equipment.addTelescopeDescription')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div className="space-y-2">
                  <Label>{t('equipment.name')}</Label>
                  <Input
                    value={newTelescopeName}
                    onChange={(e) => setNewTelescopeName(e.target.value)}
                    placeholder="e.g. Newton 200/1000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>{t('fov.focalLength')} (mm)</Label>
                    <Input
                      type="number"
                      value={newTelescopeFocalLength}
                      onChange={(e) => setNewTelescopeFocalLength(e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('equipment.aperture')} (mm)</Label>
                    <Input
                      type="number"
                      value={newTelescopeAperture}
                      onChange={(e) => setNewTelescopeAperture(e.target.value)}
                      placeholder="200"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddTelescopeOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddTelescope} disabled={!newTelescopeName || !newTelescopeFocalLength}>
                  {t('common.add')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Telescope Manual Input */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('fov.focalLength')} (mm)</Label>
            <Input
              type="number"
              value={focalLength}
              onChange={(e) => setFocalLength(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('equipment.aperture')} (mm)</Label>
            <Input
              type="number"
              value={aperture}
              onChange={(e) => setAperture(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        
        {/* Custom telescopes list */}
        {customTelescopes.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('equipment.customPresets')}</Label>
            <div className="flex flex-wrap gap-1">
              {customTelescopes.map((telescope) => (
                <Badge
                  key={telescope.id}
                  variant={activeTelescopeId === telescope.id ? 'default' : 'secondary'}
                  className="cursor-pointer gap-1 pr-1"
                  onClick={() => applyTelescope(telescope)}
                >
                  {telescope.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomTelescope(telescope.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Rotation Angle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm">
            <RotateCw className="h-4 w-4" />
            {t('fov.rotation')}
          </Label>
          <span className="text-xs text-muted-foreground font-mono">{rotationAngle.toFixed(1)}°</span>
        </div>
        <div className="flex gap-2">
          <Slider
            value={[rotationAngle]}
            onValueChange={([v]) => setRotationAngle(v)}
            min={-180}
            max={180}
            step={0.5}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => setRotationAngle(0)}
          >
            {t('common.reset')}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Calculated FOV Info */}
      <div className="p-3 rounded-lg bg-muted/30 space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Focus className="h-4 w-4" />
          {t('fov.calculatedFOV')}
        </Label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('fov.fieldWidth')}</span>
            <span className="font-mono">{fovWidth.toFixed(2)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('fov.fieldHeight')}</span>
            <span className="font-mono">{fovHeight.toFixed(2)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('fov.imageScale')}</span>
            <span className="font-mono">{imageScale.toFixed(2)}&quot;/px</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('exposure.fRatio')}</span>
            <span className="font-mono">f/{fRatio.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
