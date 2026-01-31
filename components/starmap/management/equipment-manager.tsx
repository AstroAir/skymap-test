'use client';

import { useState, useSyncExternalStore } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface EquipmentManagerProps {
  trigger?: React.ReactNode;
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
  
  // Web equipment store
  const customCameras = useEquipmentStore((state) => state.customCameras);
  const customTelescopes = useEquipmentStore((state) => state.customTelescopes);
  const addCustomCamera = useEquipmentStore((state) => state.addCustomCamera);
  const addCustomTelescope = useEquipmentStore((state) => state.addCustomTelescope);
  const removeCustomCamera = useEquipmentStore((state) => state.removeCustomCamera);
  const removeCustomTelescope = useEquipmentStore((state) => state.removeCustomTelescope);
  const applyCamera = useEquipmentStore((state) => state.applyCamera);
  const applyTelescope = useEquipmentStore((state) => state.applyTelescope);
  const activeCameraId = useEquipmentStore((state) => state.activeCameraId);
  const activeTelescopeId = useEquipmentStore((state) => state.activeTelescopeId);
  
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
  // Web Environment Handlers
  // ============================================================================

  const handleWebAddTelescope = () => {
    if (!telescopeForm.name || !telescopeForm.aperture || !telescopeForm.focal_length) {
      toast.error(t('equipment.fillRequired') || 'Please fill required fields');
      return;
    }

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
    if (!cameraForm.name || !cameraForm.sensor_width || !cameraForm.sensor_height) {
      toast.error(t('equipment.fillRequired') || 'Please fill required fields');
      return;
    }

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
    if (!telescopeForm.name || !telescopeForm.aperture || !telescopeForm.focal_length) {
      toast.error(t('equipment.fillRequired') || 'Please fill required fields');
      return;
    }

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
    if (!cameraForm.name || !cameraForm.sensor_width || !cameraForm.sensor_height) {
      toast.error(t('equipment.fillRequired') || 'Please fill required fields');
      return;
    }

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
    if (!barlowForm.name || !barlowForm.factor) {
      toast.error(t('equipment.fillRequired') || 'Please fill required fields');
      return;
    }

    try {
      await tauriApi.equipment.addBarlowReducer({
        name: barlowForm.name,
        factor: parseFloat(barlowForm.factor),
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

  const handleDelete = async (id: string) => {
    try {
      await tauriApi.equipment.delete(id);
      toast.success(t('equipment.deleted') || 'Equipment deleted');
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

  // Determine data source based on environment
  const telescopeList = isTauriAvailable 
    ? equipment?.telescopes ?? [] 
    : customTelescopes;
  const cameraList = isTauriAvailable 
    ? equipment?.cameras ?? [] 
    : customCameras;

  // Select appropriate handlers based on environment
  const onAddTelescope = isTauriAvailable ? handleAddTelescope : handleWebAddTelescope;
  const onAddCamera = isTauriAvailable ? handleAddCamera : handleWebAddCamera;
  const onDeleteTelescope = isTauriAvailable 
    ? handleDelete 
    : (id: string) => {
        removeCustomTelescope(id);
        toast.success(t('equipment.deleted') || 'Equipment deleted');
      };
  const onDeleteCamera = isTauriAvailable 
    ? handleDelete 
    : (id: string) => {
        removeCustomCamera(id);
        toast.success(t('equipment.deleted') || 'Equipment deleted');
      };

  // Handle selecting equipment (web only)
  const handleSelectTelescope = (telescope: typeof customTelescopes[0]) => {
    if (!isTauriAvailable) {
      applyTelescope(telescope);
      toast.success(t('equipment.selected') || 'Telescope selected');
    }
  };

  const handleSelectCamera = (camera: typeof customCameras[0]) => {
    if (!isTauriAvailable) {
      applyCamera(camera);
      toast.success(t('equipment.selected') || 'Camera selected');
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
                    {telescopeList.map((scope) => {
                      const isSelected = !isTauriAvailable && activeTelescopeId === scope.id;
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const s = scope as any;
                      const focalRatio = isTauriAvailable ? s.focal_ratio : s.focalLength / s.aperture;
                      const aperture = s.aperture;
                      const isDefault = isTauriAvailable && s.is_default;
                      
                      return (
                        <div 
                          key={scope.id} 
                          className={`flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50 ${isSelected ? 'border-primary bg-primary/10' : ''}`}
                          onClick={() => !isTauriAvailable && handleSelectTelescope(scope as typeof customTelescopes[0])}
                        >
                          <div className="flex items-center gap-2">
                            <Telescope className="h-4 w-4" />
                            <div>
                              <p className="font-medium text-sm">{scope.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {aperture}mm f/{focalRatio.toFixed(1)}
                              </p>
                            </div>
                            {isSelected && <Check className="h-3 w-3 text-primary" />}
                            {isDefault && <Star className="h-3 w-3 text-yellow-500" />}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('equipment.delete')}
                            onClick={(e) => { e.stopPropagation(); onDeleteTelescope(scope.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {addingTelescope ? (
                <div className="space-y-3 border rounded p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.name') || 'Name'}</Label>
                      <Input
                        value={telescopeForm.name}
                        onChange={(e) => setTelescopeForm({ ...telescopeForm, name: e.target.value })}
                        placeholder="e.g. Newton 200/1000"
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
                          <SelectItem value="refractor">Refractor</SelectItem>
                          <SelectItem value="reflector">Reflector</SelectItem>
                          <SelectItem value="catadioptric">Catadioptric</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                </div>
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
                    {cameraList.map((cam) => {
                      const isSelected = !isTauriAvailable && activeCameraId === cam.id;
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const c = cam as any;
                      const sensorWidth = isTauriAvailable ? c.sensor_width : c.sensorWidth;
                      const sensorHeight = isTauriAvailable ? c.sensor_height : c.sensorHeight;
                      const isDefault = isTauriAvailable && c.is_default;
                      
                      return (
                        <div 
                          key={cam.id} 
                          className={`flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50 ${isSelected ? 'border-primary bg-primary/10' : ''}`}
                          onClick={() => !isTauriAvailable && handleSelectCamera(cam as typeof customCameras[0])}
                        >
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            <div>
                              <p className="font-medium text-sm">{cam.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {sensorWidth}×{sensorHeight}mm
                              </p>
                            </div>
                            {isSelected && <Check className="h-3 w-3 text-primary" />}
                            {isDefault && <Star className="h-3 w-3 text-yellow-500" />}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('equipment.delete')}
                            onClick={(e) => { e.stopPropagation(); onDeleteCamera(cam.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {addingCamera ? (
                <div className="space-y-3 border rounded p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.name') || 'Name'}</Label>
                      <Input
                        value={cameraForm.name}
                        onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
                        placeholder="e.g. ASI294MC Pro"
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
                          <SelectItem value="cmos">CMOS</SelectItem>
                          <SelectItem value="ccd">CCD</SelectItem>
                          <SelectItem value="dslr">DSLR</SelectItem>
                          <SelectItem value="mirrorless">Mirrorless</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                </div>
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
                      <div key={barlow.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <div>
                            <p className="font-medium text-sm">{barlow.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {barlow.factor}x {barlow.factor > 1 ? 'Barlow' : 'Reducer'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('equipment.delete')}
                          onClick={() => handleDelete(barlow.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {addingBarlow ? (
                <div className="space-y-3 border rounded p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.name') || 'Name'}</Label>
                      <Input
                        value={barlowForm.name}
                        onChange={(e) => setBarlowForm({ ...barlowForm, name: e.target.value })}
                        placeholder="e.g. 2x Barlow"
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
                </div>
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
                      <div key={filter.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          <div>
                            <p className="font-medium text-sm">{filter.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {filter.filter_type} {filter.bandwidth && `(${filter.bandwidth}nm)`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('equipment.delete')}
                          onClick={() => handleDelete(filter.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {addingFilter ? (
                <div className="space-y-3 border rounded p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t('equipment.name') || 'Name'}</Label>
                      <Input
                        value={filterForm.name}
                        onChange={(e) => setFilterForm({ ...filterForm, name: e.target.value })}
                        placeholder="e.g. Ha Filter"
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
                          <SelectItem value="luminance">Luminance</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="ha">H-Alpha</SelectItem>
                          <SelectItem value="oiii">OIII</SelectItem>
                          <SelectItem value="sii">SII</SelectItem>
                          <SelectItem value="uhc_lps">UHC/LPS</SelectItem>
                          <SelectItem value="cls">CLS</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                </div>
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
    </Dialog>
  );
}
