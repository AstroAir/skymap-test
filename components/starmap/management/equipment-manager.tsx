'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Telescope,
  Camera,
  Plus,
  Trash2,
  Star,
  Loader2,
  Settings2,
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
import { toast } from 'sonner';
import { useEquipment, tauriApi } from '@/lib/tauri';
import type { TelescopeType as TScopeType, CameraType as TCamType } from '@/lib/tauri';

interface EquipmentManagerProps {
  trigger?: React.ReactNode;
}

export function EquipmentManager({ trigger }: EquipmentManagerProps) {
  const t = useTranslations();
  const { equipment, loading, refresh, isAvailable } = useEquipment();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('telescopes');
  const [addingTelescope, setAddingTelescope] = useState(false);
  const [addingCamera, setAddingCamera] = useState(false);

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

  if (!isAvailable) {
    return null; // Only show in Tauri environment
  }

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

  const handleDelete = async (id: string) => {
    try {
      await tauriApi.equipment.delete(id);
      toast.success(t('equipment.deleted') || 'Equipment deleted');
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-2" />
            {t('equipment.title') || 'Equipment'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {t('equipment.title') || 'Equipment Manager'}
          </DialogTitle>
          <DialogDescription>
            {t('equipment.description') || 'Manage your telescopes, cameras, and accessories'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="telescopes" className="flex items-center gap-2">
                <Telescope className="h-4 w-4" />
                {t('equipment.telescopes') || 'Telescopes'}
              </TabsTrigger>
              <TabsTrigger value="cameras" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                {t('equipment.cameras') || 'Cameras'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="telescopes" className="space-y-4">
              <ScrollArea className="h-[200px]">
                {equipment?.telescopes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {t('equipment.noTelescopes') || 'No telescopes added'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {equipment?.telescopes.map((scope) => (
                      <div key={scope.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Telescope className="h-4 w-4" />
                          <div>
                            <p className="font-medium text-sm">{scope.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {scope.aperture}mm f/{scope.focal_ratio.toFixed(1)}
                            </p>
                          </div>
                          {scope.is_default && <Star className="h-3 w-3 text-yellow-500" />}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(scope.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
                    <Button size="sm" onClick={handleAddTelescope}>
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
                {equipment?.cameras.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {t('equipment.noCameras') || 'No cameras added'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {equipment?.cameras.map((cam) => (
                      <div key={cam.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          <div>
                            <p className="font-medium text-sm">{cam.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {cam.sensor_width}×{cam.sensor_height}mm
                            </p>
                          </div>
                          {cam.is_default && <Star className="h-3 w-3 text-yellow-500" />}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cam.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
                    <Button size="sm" onClick={handleAddCamera}>
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
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
