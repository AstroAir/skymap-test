'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslations } from 'next-intl';
import {
  Telescope,
  Camera,
  Plus,
  Trash2,
  Star,
  Loader2,
  Wrench,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useEquipment, tauriApi } from '@/lib/tauri';
import type { TelescopeType as TScopeType, CameraType as TCamType } from '@/lib/tauri';
import { useEquipmentStore } from '@/lib/stores/equipment-store';
import { normalizeTelescopes, normalizeCameras } from '@/lib/core/equipment-normalize';
import { validateTelescopeForm, validateCameraForm } from '@/lib/core/management-validators';
import type { NormalizedTelescope, NormalizedCamera, EquipmentManagerProps } from '@/types/starmap/management';
import type { LucideIcon } from 'lucide-react';

interface EquipmentListItemProps {
  icon: LucideIcon;
  name: string;
  detail: string;
  isSelected?: boolean;
  isDefault?: boolean;
  selectable?: boolean;
  deleteLabel: string;
  onSelect?: () => void;
  onDelete: () => void;
}

function EquipmentListItem({
  icon: Icon,
  name,
  detail,
  isSelected,
  isDefault,
  selectable,
  deleteLabel,
  onSelect,
  onDelete,
}: EquipmentListItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-2 border rounded ${selectable ? 'cursor-pointer hover:bg-muted/50' : ''} ${isSelected ? 'border-primary bg-primary/10' : ''}`}
      onClick={selectable ? onSelect : undefined}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        {isSelected && <Check className="h-3 w-3 text-primary" />}
        {isDefault && <Star className="h-3 w-3 text-yellow-500" />}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={deleteLabel}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function EquipmentManager({ trigger }: EquipmentManagerProps) {
  const t = useTranslations();
  const { equipment, loading, refresh, isAvailable: isTauriAvailable } = useEquipment();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('telescopes');
  const [addingTelescope, setAddingTelescope] = useState(false);
  const [addingCamera, setAddingCamera] = useState(false);
  const [addingBarlow, setAddingBarlow] = useState(false);
  const [addingFilter, setAddingFilter] = useState(false);
  
  // Web equipment store (batch selector to reduce re-renders)
  const {
    customCameras, customTelescopes,
    addCustomCamera, addCustomTelescope,
    removeCustomCamera, removeCustomTelescope,
    applyCamera, applyTelescope,
    activeCameraId, activeTelescopeId,
  } = useEquipmentStore(useShallow((state) => ({
    customCameras: state.customCameras,
    customTelescopes: state.customTelescopes,
    addCustomCamera: state.addCustomCamera,
    addCustomTelescope: state.addCustomTelescope,
    removeCustomCamera: state.removeCustomCamera,
    removeCustomTelescope: state.removeCustomTelescope,
    applyCamera: state.applyCamera,
    applyTelescope: state.applyTelescope,
    activeCameraId: state.activeCameraId,
    activeTelescopeId: state.activeTelescopeId,
  })));
  
  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'telescope' | 'camera' | 'barlow' | 'filter' } | null>(null);

  // Confirmed delete handler (must be before early return for hooks ordering)
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    try {
      if (isTauriAvailable) {
        await tauriApi.equipment.delete(id);
        refresh();
      } else if (type === 'telescope') {
        removeCustomTelescope(id);
      } else if (type === 'camera') {
        removeCustomCamera(id);
      }
      toast.success(t('equipment.deleted') || 'Equipment deleted');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, isTauriAvailable, refresh, removeCustomTelescope, removeCustomCamera, t]);

  // Fix hydration mismatch by only rendering Dialog after mount
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Telescope form state
  const [telescopeForm, setTelescopeForm] = useState({
    name: '',
    aperture: '',
    focal_length: '',
    telescope_type: 'reflector' as TScopeType,
  });

  // Camera form state
  const [cameraForm, setCameraForm] = useState({
    name: '',
    sensor_width: '',
    sensor_height: '',
    pixel_size: '',
    resolution_x: '',
    resolution_y: '',
    camera_type: 'cmos' as TCamType,
  });

  // Barlow form state
  const [barlowForm, setBarlowForm] = useState({
    name: '',
    factor: '',
  });

  // Filter form state  
  const [filterForm, setFilterForm] = useState({
    name: '',
    filter_type: 'luminance' as string,
    bandwidth: '',
  });

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  const validateTelescope = (): string | null => {
    const errorKey = validateTelescopeForm(telescopeForm);
    return errorKey ? (t(errorKey) || errorKey) : null;
  };

  const validateCamera = (): string | null => {
    const errorKey = validateCameraForm(cameraForm);
    return errorKey ? (t(errorKey) || errorKey) : null;
  };

  // ============================================================================
  // Web Environment Handlers
  // ============================================================================

  const handleWebAddTelescope = () => {
    const error = validateTelescope();
    if (error) { toast.error(error); return; }

    addCustomTelescope({
      name: telescopeForm.name,
      focalLength: parseFloat(telescopeForm.focal_length),
      aperture: parseFloat(telescopeForm.aperture),
      type: telescopeForm.telescope_type,
    });

    toast.success(t('equipment.telescopeAdded') || 'Telescope added');
    setTelescopeForm({ name: '', aperture: '', focal_length: '', telescope_type: 'reflector' });
    setAddingTelescope(false);
  };

  const handleWebAddCamera = () => {
    const error = validateCamera();
    if (error) { toast.error(error); return; }

    addCustomCamera({
      name: cameraForm.name,
      sensorWidth: parseFloat(cameraForm.sensor_width),
      sensorHeight: parseFloat(cameraForm.sensor_height),
      pixelSize: parseFloat(cameraForm.pixel_size) || 3.76,
      resolutionX: parseInt(cameraForm.resolution_x) || undefined,
      resolutionY: parseInt(cameraForm.resolution_y) || undefined,
    });

    toast.success(t('equipment.cameraAdded') || 'Camera added');
    setCameraForm({ name: '', sensor_width: '', sensor_height: '', pixel_size: '', resolution_x: '', resolution_y: '', camera_type: 'cmos' });
    setAddingCamera(false);
  };

  // ============================================================================
  // Tauri Environment Handlers
  // ============================================================================

  const handleAddTelescope = async () => {
    const error = validateTelescope();
    if (error) { toast.error(error); return; }

    try {
      const aperture = parseFloat(telescopeForm.aperture);
      const focal_length = parseFloat(telescopeForm.focal_length);
      
      await tauriApi.equipment.addTelescope({
        name: telescopeForm.name,
        aperture,
        focal_length,
        focal_ratio: focal_length / aperture,
        telescope_type: telescopeForm.telescope_type,
        is_default: !equipment?.telescopes.length,
      });
      
      toast.success(t('equipment.telescopeAdded') || 'Telescope added');
      setTelescopeForm({ name: '', aperture: '', focal_length: '', telescope_type: 'reflector' });
      setAddingTelescope(false);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleAddCamera = async () => {
    const error = validateCamera();
    if (error) { toast.error(error); return; }

    try {
      await tauriApi.equipment.addCamera({
        name: cameraForm.name,
        sensor_width: parseFloat(cameraForm.sensor_width),
        sensor_height: parseFloat(cameraForm.sensor_height),
        pixel_size: parseFloat(cameraForm.pixel_size) || 0,
        resolution_x: parseInt(cameraForm.resolution_x) || 0,
        resolution_y: parseInt(cameraForm.resolution_y) || 0,
        camera_type: cameraForm.camera_type,
        has_cooler: false,
        is_default: !equipment?.cameras.length,
      });
      
      toast.success(t('equipment.cameraAdded') || 'Camera added');
      setCameraForm({ name: '', sensor_width: '', sensor_height: '', pixel_size: '', resolution_x: '', resolution_y: '', camera_type: 'cmos' });
      setAddingCamera(false);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleAddBarlow = async () => {
    if (!barlowForm.name.trim()) {
      toast.error(t('equipment.fillRequired') || 'Please fill required fields');
      return;
    }
    const factor = parseFloat(barlowForm.factor);
    if (isNaN(factor) || factor < 0.1 || factor > 10) {
      toast.error(t('equipment.validation.factorRange') || 'Factor must be between 0.1 and 10');
      return;
    }

    try {
      await tauriApi.equipment.addBarlowReducer({
        name: barlowForm.name,
        factor,
      });
      
      toast.success(t('equipment.barlowAdded') || 'Barlow/Reducer added');
      setBarlowForm({ name: '', factor: '' });
      setAddingBarlow(false);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleAddFilter = async () => {
    if (!filterForm.name || !filterForm.filter_type) {
      toast.error(t('equipment.fillRequired') || 'Please fill required fields');
      return;
    }

    try {
      await tauriApi.equipment.addFilter({
        name: filterForm.name,
        filter_type: filterForm.filter_type,
        bandwidth: filterForm.bandwidth ? parseFloat(filterForm.bandwidth) : undefined,
      });
      
      toast.success(t('equipment.filterAdded') || 'Filter added');
      setFilterForm({ name: '', filter_type: 'luminance', bandwidth: '' });
      setAddingFilter(false);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // Return null during SSR to avoid hydration mismatch
  // (DialogTrigger asChild adds props that differ from plain Button)
  if (!mounted) {
    return null;
  }

  // Determine data source and normalize to unified types
  const rawTelescopes = isTauriAvailable ? equipment?.telescopes ?? [] : customTelescopes;
  const rawCameras = isTauriAvailable ? equipment?.cameras ?? [] : customCameras;
  const telescopeList = normalizeTelescopes(rawTelescopes, isTauriAvailable);
  const cameraList = normalizeCameras(rawCameras, isTauriAvailable);

  // Select appropriate handlers based on environment
  const onAddTelescope = isTauriAvailable ? handleAddTelescope : handleWebAddTelescope;
  const onAddCamera = isTauriAvailable ? handleAddCamera : handleWebAddCamera;

  // Handle selecting equipment (web only)
  const handleSelectTelescope = (scope: NormalizedTelescope) => {
    if (!isTauriAvailable) {
      const preset = customTelescopes.find(p => p.id === scope.id);
      if (preset) {
        applyTelescope(preset);
        toast.success(t('equipment.selected') || 'Telescope selected');
      }
    }
  };

  const handleSelectCamera = (cam: NormalizedCamera) => {
    if (!isTauriAvailable) {
      const preset = customCameras.find(p => p.id === cam.id);
      if (preset) {
        applyCamera(preset);
        toast.success(t('equipment.selected') || 'Camera selected');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Wrench className="h-4 w-4" />
              </Button>
            )}
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('equipment.title') || 'Equipment Manager'}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {t('equipment.title') || 'Equipment Manager'}
          </DialogTitle>
          <DialogDescription>
            {t('equipment.description') || 'Manage your telescopes, cameras, and accessories'}
          </DialogDescription>
        </DialogHeader>

        {isTauriAvailable && loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={isTauriAvailable ? "grid w-full grid-cols-4" : "grid w-full grid-cols-2"}>
              <TabsTrigger value="telescopes" className="flex items-center gap-1 text-xs">
                <Telescope className="h-3 w-3" />
                {t('equipment.telescopes') || 'Scopes'}
              </TabsTrigger>
              <TabsTrigger value="cameras" className="flex items-center gap-1 text-xs">
                <Camera className="h-3 w-3" />
                {t('equipment.cameras') || 'Cameras'}
              </TabsTrigger>
              {isTauriAvailable && (
                <>
                  <TabsTrigger value="barlows" className="flex items-center gap-1 text-xs">
                    <Plus className="h-3 w-3" />
                    {t('equipment.barlows') || 'Barlows'}
                  </TabsTrigger>
                  <TabsTrigger value="filters" className="flex items-center gap-1 text-xs">
                    <Wrench className="h-3 w-3" />
                    {t('equipment.filters') || 'Filters'}
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="telescopes" className="space-y-4">
              <ScrollArea className="h-[200px]">
                {telescopeList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {t('equipment.noTelescopes') || 'No telescopes added'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {telescopeList.map((scope) => (
                      <EquipmentListItem
                        key={scope.id}
                        icon={Telescope}
                        name={scope.name}
                        detail={`${scope.aperture}mm f/${scope.focalRatio.toFixed(1)}`}
                        isSelected={!isTauriAvailable && activeTelescopeId === scope.id}
                        isDefault={scope.isDefault}
                        selectable={!isTauriAvailable}
                        deleteLabel={t('equipment.delete')}
                        onSelect={() => handleSelectTelescope(scope)}
                        onDelete={() => setDeleteTarget({ id: scope.id, name: scope.name, type: 'telescope' })}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {addingTelescope ? (
                <Card className="py-3">
                  <CardContent className="space-y-3 px-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.name') || 'Name'}</Label>
                      <Input
                        value={telescopeForm.name}
                        onChange={(e) => setTelescopeForm({ ...telescopeForm, name: e.target.value })}
                        placeholder={t('equipment.telescopeNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <Label>{t('equipment.type') || 'Type'}</Label>
                      <Select
                        value={telescopeForm.telescope_type}
                        onValueChange={(v) => setTelescopeForm({ ...telescopeForm, telescope_type: v as TScopeType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="refractor">{t('equipment.telescopeTypes.refractor')}</SelectItem>
                          <SelectItem value="reflector">{t('equipment.telescopeTypes.reflector')}</SelectItem>
                          <SelectItem value="catadioptric">{t('equipment.telescopeTypes.catadioptric')}</SelectItem>
                          <SelectItem value="other">{t('equipment.telescopeTypes.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.aperture') || 'Aperture (mm)'}</Label>
                      <Input
                        type="number"
                        value={telescopeForm.aperture}
                        onChange={(e) => setTelescopeForm({ ...telescopeForm, aperture: e.target.value })}
                        placeholder="200"
                      />
                    </div>
                    <div>
                      <Label>{t('equipment.focalLength') || 'Focal Length (mm)'}</Label>
                      <Input
                        type="number"
                        value={telescopeForm.focal_length}
                        onChange={(e) => setTelescopeForm({ ...telescopeForm, focal_length: e.target.value })}
                        placeholder="1000"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={onAddTelescope}>
                      {t('common.save') || 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingTelescope(false)}>
                      {t('common.cancel') || 'Cancel'}
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setAddingTelescope(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('equipment.addTelescope') || 'Add Telescope'}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="cameras" className="space-y-4">
              <ScrollArea className="h-[200px]">
                {cameraList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {t('equipment.noCameras') || 'No cameras added'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cameraList.map((cam) => (
                      <EquipmentListItem
                        key={cam.id}
                        icon={Camera}
                        name={cam.name}
                        detail={`${cam.sensorWidth}×${cam.sensorHeight}mm`}
                        isSelected={!isTauriAvailable && activeCameraId === cam.id}
                        isDefault={cam.isDefault}
                        selectable={!isTauriAvailable}
                        deleteLabel={t('equipment.delete')}
                        onSelect={() => handleSelectCamera(cam)}
                        onDelete={() => setDeleteTarget({ id: cam.id, name: cam.name, type: 'camera' })}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {addingCamera ? (
                <Card className="py-3">
                  <CardContent className="space-y-3 px-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.name') || 'Name'}</Label>
                      <Input
                        value={cameraForm.name}
                        onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
                        placeholder={t('equipment.cameraNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <Label>{t('equipment.type') || 'Type'}</Label>
                      <Select
                        value={cameraForm.camera_type}
                        onValueChange={(v) => setCameraForm({ ...cameraForm, camera_type: v as TCamType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cmos">{t('equipment.cameraTypes.cmos')}</SelectItem>
                          <SelectItem value="ccd">{t('equipment.cameraTypes.ccd')}</SelectItem>
                          <SelectItem value="dslr">{t('equipment.cameraTypes.dslr')}</SelectItem>
                          <SelectItem value="mirrorless">{t('equipment.cameraTypes.mirrorless')}</SelectItem>
                          <SelectItem value="other">{t('equipment.cameraTypes.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.sensorWidth') || 'Sensor Width (mm)'}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cameraForm.sensor_width}
                        onChange={(e) => setCameraForm({ ...cameraForm, sensor_width: e.target.value })}
                        placeholder="23.2"
                      />
                    </div>
                    <div>
                      <Label>{t('equipment.sensorHeight') || 'Sensor Height (mm)'}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cameraForm.sensor_height}
                        onChange={(e) => setCameraForm({ ...cameraForm, sensor_height: e.target.value })}
                        placeholder="15.5"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={onAddCamera}>
                      {t('common.save') || 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingCamera(false)}>
                      {t('common.cancel') || 'Cancel'}
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setAddingCamera(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('equipment.addCamera') || 'Add Camera'}
                </Button>
              )}
            </TabsContent>

            {/* Barlows Tab */}
            <TabsContent value="barlows" className="space-y-4">
              <ScrollArea className="h-[200px]">
                {equipment?.barlow_reducers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {t('equipment.noBarlows') || 'No barlows/reducers added'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {equipment?.barlow_reducers.map((barlow) => (
                      <EquipmentListItem
                        key={barlow.id}
                        icon={Plus}
                        name={barlow.name}
                        detail={`${barlow.factor}x ${barlow.factor > 1 ? t('equipment.barlowLabel') : t('equipment.reducerLabel')}`}
                        deleteLabel={t('equipment.delete')}
                        onDelete={() => setDeleteTarget({ id: barlow.id, name: barlow.name, type: 'barlow' })}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {addingBarlow ? (
                <Card className="py-3">
                  <CardContent className="space-y-3 px-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.name') || 'Name'}</Label>
                      <Input
                        value={barlowForm.name}
                        onChange={(e) => setBarlowForm({ ...barlowForm, name: e.target.value })}
                        placeholder={t('equipment.barlowNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <Label>{t('equipment.factor') || 'Factor'}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={barlowForm.factor}
                        onChange={(e) => setBarlowForm({ ...barlowForm, factor: e.target.value })}
                        placeholder="2.0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddBarlow}>
                      {t('common.save') || 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingBarlow(false)}>
                      {t('common.cancel') || 'Cancel'}
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setAddingBarlow(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('equipment.addBarlow') || 'Add Barlow/Reducer'}
                </Button>
              )}
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="space-y-4">
              <ScrollArea className="h-[200px]">
                {equipment?.filters.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {t('equipment.noFilters') || 'No filters added'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {equipment?.filters.map((filter) => (
                      <EquipmentListItem
                        key={filter.id}
                        icon={Wrench}
                        name={filter.name}
                        detail={`${filter.filter_type}${filter.bandwidth ? ` (${filter.bandwidth}nm)` : ''}`}
                        deleteLabel={t('equipment.delete')}
                        onDelete={() => setDeleteTarget({ id: filter.id, name: filter.name, type: 'filter' })}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {addingFilter ? (
                <Card className="py-3">
                  <CardContent className="space-y-3 px-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.name') || 'Name'}</Label>
                      <Input
                        value={filterForm.name}
                        onChange={(e) => setFilterForm({ ...filterForm, name: e.target.value })}
                        placeholder={t('equipment.filterNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <Label>{t('equipment.type') || 'Type'}</Label>
                      <Select
                        value={filterForm.filter_type}
                        onValueChange={(v) => setFilterForm({ ...filterForm, filter_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="luminance">{t('equipment.filterTypes.luminance') || 'Luminance'}</SelectItem>
                          <SelectItem value="red">{t('equipment.filterTypes.red') || 'Red'}</SelectItem>
                          <SelectItem value="green">{t('equipment.filterTypes.green') || 'Green'}</SelectItem>
                          <SelectItem value="blue">{t('equipment.filterTypes.blue') || 'Blue'}</SelectItem>
                          <SelectItem value="ha">{t('equipment.filterTypes.ha') || 'H-Alpha'}</SelectItem>
                          <SelectItem value="oiii">{t('equipment.filterTypes.oiii') || 'OIII'}</SelectItem>
                          <SelectItem value="sii">{t('equipment.filterTypes.sii') || 'SII'}</SelectItem>
                          <SelectItem value="uhc_lps">{t('equipment.filterTypes.uhcLps') || 'UHC/LPS'}</SelectItem>
                          <SelectItem value="cls">{t('equipment.filterTypes.cls') || 'CLS'}</SelectItem>
                          <SelectItem value="other">{t('equipment.filterTypes.other') || 'Other'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>{t('equipment.bandwidth') || 'Bandwidth (nm)'}</Label>
                    <Input
                      type="number"
                      value={filterForm.bandwidth}
                      onChange={(e) => setFilterForm({ ...filterForm, bandwidth: e.target.value })}
                      placeholder="7"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddFilter}>
                      {t('common.save') || 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingFilter(false)}>
                      {t('common.cancel') || 'Cancel'}
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setAddingFilter(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('equipment.addFilter') || 'Add Filter'}
                </Button>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('equipment.deleteConfirmTitle') || 'Delete Equipment?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('equipment.deleteConfirmDescription', { name: deleteTarget?.name ?? '' }) || 
                `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              {t('common.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
