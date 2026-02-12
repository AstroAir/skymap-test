'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Eye,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useEquipmentStore } from '@/lib/stores';
import {
  EYEPIECE_PRESETS,
  BARLOW_PRESETS,
  OCULAR_TELESCOPE_PRESETS,
  type EyepiecePreset,
  type BarlowPreset,
  type OcularTelescopePreset,
} from '@/lib/constants/equipment-presets';
import { calculateOcularView, OCULAR_STARS } from '@/lib/astronomy/ocular-utils';
import type { OcularViewPreviewProps } from '@/types/starmap/overlays';

// ============================================================================
// Ocular View Preview Component
// ============================================================================

function OcularViewPreview({ 
  tfov, 
  magnification, 
  exitPupil,
  isOverMagnified 
}: OcularViewPreviewProps) {
  // Simulate the view circle
  const viewSize = Math.min(200, Math.max(80, tfov * 100));
  
  return (
    <div className="relative flex items-center justify-center h-[220px] bg-black rounded-lg overflow-hidden">
      {/* Simulated star field background */}
      <div className="absolute inset-0">
        {OCULAR_STARS.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.left}%`,
              top: `${star.top}%`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      
      {/* Ocular view circle */}
      <div 
        className={cn(
          'relative rounded-full border-2 flex items-center justify-center',
          isOverMagnified ? 'border-red-500/50' : 'border-primary/50'
        )}
        style={{
          width: `${viewSize}px`,
          height: `${viewSize}px`,
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
        }}
      >
        {/* Center crosshair */}
        <div className="absolute w-full h-px bg-primary/30" />
        <div className="absolute w-px h-full bg-primary/30" />
        
        {/* FOV indicator */}
        <div className="absolute bottom-2 text-[10px] text-primary/70 font-mono">
          {tfov.toFixed(2)}°
        </div>
      </div>
      
      {/* Info overlay */}
      <div className="absolute top-2 left-2 text-xs text-white/70 space-y-0.5">
        <div>{magnification.toFixed(0)}x</div>
        <div>EP: {exitPupil.toFixed(1)}mm</div>
      </div>
      
      {isOverMagnified && (
        <div className="absolute top-2 right-2">
          <Badge variant="destructive" className="text-[10px]">
            Over-magnified
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function OcularSimulator() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  
  // Equipment state - from Zustand store (persisted via Tauri storage)
  const customEyepieces = useEquipmentStore((s) => s.customEyepieces);
  const customBarlows = useEquipmentStore((s) => s.customBarlows);
  const customOcularTelescopes = useEquipmentStore((s) => s.customOcularTelescopes);
  const addCustomEyepiece = useEquipmentStore((s) => s.addCustomEyepiece);
  const addCustomBarlow = useEquipmentStore((s) => s.addCustomBarlow);
  const addCustomOcularTelescope = useEquipmentStore((s) => s.addCustomOcularTelescope);

  // Merge built-in presets with user custom items
  const telescopes = useMemo(() => [...OCULAR_TELESCOPE_PRESETS, ...customOcularTelescopes], [customOcularTelescopes]);
  const eyepieces = useMemo(() => [...EYEPIECE_PRESETS, ...customEyepieces], [customEyepieces]);
  const barlows = useMemo(() => [...BARLOW_PRESETS, ...customBarlows], [customBarlows]);
  
  // Selection state
  const [selectedTelescope, setSelectedTelescope] = useState<string>(telescopes[0].id);
  const [selectedEyepiece, setSelectedEyepiece] = useState<string>(eyepieces[0].id);
  const [selectedBarlow, setSelectedBarlow] = useState<string>(barlows[0].id);
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomTelescope, setShowCustomTelescope] = useState(false);
  const [showCustomEyepiece, setShowCustomEyepiece] = useState(false);
  const [showCustomBarlow, setShowCustomBarlow] = useState(false);
  
  // Custom equipment form
  const [customTelescope, setCustomTelescope] = useState<Partial<OcularTelescopePreset>>({
    name: '',
    focalLength: 1000,
    aperture: 200,
    type: 'reflector',
  });
  const [customEyepiece, setCustomEyepiece] = useState<Partial<EyepiecePreset>>({
    name: '',
    focalLength: 10,
    afov: 52,
  });
  const [customBarlow, setCustomBarlow] = useState<Partial<BarlowPreset>>({
    name: '',
    magnification: 2,
  });
  
  // Get selected equipment
  const telescope = useMemo(() => 
    telescopes.find(t => t.id === selectedTelescope) || telescopes[0],
    [telescopes, selectedTelescope]
  );
  
  const eyepiece = useMemo(() => 
    eyepieces.find(e => e.id === selectedEyepiece) || eyepieces[0],
    [eyepieces, selectedEyepiece]
  );
  
  const barlow = useMemo(() => 
    barlows.find(b => b.id === selectedBarlow) || barlows[0],
    [barlows, selectedBarlow]
  );
  
  // Calculate view
  const viewData = useMemo(() => 
    calculateOcularView(telescope, eyepiece, barlow),
    [telescope, eyepiece, barlow]
  );
  
  // Add custom telescope
  const handleAddTelescope = useCallback(() => {
    if (customTelescope.name && customTelescope.focalLength && customTelescope.aperture) {
      addCustomOcularTelescope({
        name: customTelescope.name,
        focalLength: customTelescope.focalLength,
        aperture: customTelescope.aperture,
        type: customTelescope.type || 'reflector',
      });
      setShowCustomTelescope(false);
      setCustomTelescope({ name: '', focalLength: 1000, aperture: 200, type: 'reflector' });
    }
  }, [customTelescope, addCustomOcularTelescope]);
  
  // Add custom eyepiece
  const handleAddEyepiece = useCallback(() => {
    if (customEyepiece.name && customEyepiece.focalLength && customEyepiece.afov) {
      addCustomEyepiece({
        name: customEyepiece.name,
        focalLength: customEyepiece.focalLength,
        afov: customEyepiece.afov,
      });
      setShowCustomEyepiece(false);
      setCustomEyepiece({ name: '', focalLength: 10, afov: 52 });
    }
  }, [customEyepiece, addCustomEyepiece]);
  
  // Add custom barlow
  const handleAddBarlow = useCallback(() => {
    if (customBarlow.name && customBarlow.magnification) {
      addCustomBarlow({
        name: customBarlow.name,
        magnification: customBarlow.magnification,
      });
      setShowCustomBarlow(false);
      setCustomBarlow({ name: '', magnification: 2 });
    }
  }, [customBarlow, addCustomBarlow]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('ocular.simulator')} className="h-9 w-9">
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('ocular.simulator')}</p>
        </TooltipContent>
      </Tooltip>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {t('ocular.eyepieceSimulator')}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 pr-2">
            {/* Ocular View Preview */}
            <OcularViewPreview 
              tfov={viewData.tfov}
              magnification={viewData.magnification}
              exitPupil={viewData.exitPupil}
              isOverMagnified={viewData.isOverMagnified}
            />
            
            {/* Equipment Selection */}
            <div className="grid grid-cols-1 gap-4">
              {/* Telescope Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('ocular.telescope')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowCustomTelescope(!showCustomTelescope)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t('ocular.addCustom')}
                  </Button>
                </div>
                <Select value={selectedTelescope} onValueChange={setSelectedTelescope}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {telescopes.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} (f/{(t.focalLength / t.aperture).toFixed(1)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom Telescope Form */}
                {showCustomTelescope && (
                  <Card className="border-dashed">
                    <CardContent className="p-3 space-y-2">
                      <Input
                        placeholder={t('ocular.telescopeName')}
                        value={customTelescope.name}
                        onChange={e => setCustomTelescope((prev: Partial<OcularTelescopePreset>) => ({ ...prev, name: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">{t('ocular.focalLength')} (mm)</Label>
                          <Input
                            type="number"
                            value={customTelescope.focalLength}
                            onChange={e => setCustomTelescope((prev: Partial<OcularTelescopePreset>) => ({ ...prev, focalLength: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('ocular.aperture')} (mm)</Label>
                          <Input
                            type="number"
                            value={customTelescope.aperture}
                            onChange={e => setCustomTelescope((prev: Partial<OcularTelescopePreset>) => ({ ...prev, aperture: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <Button size="sm" className="w-full" onClick={handleAddTelescope}>
                        <Save className="h-3 w-3 mr-1" />
                        {t('common.save')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Eyepiece Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('ocular.eyepiece')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowCustomEyepiece(!showCustomEyepiece)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t('ocular.addCustom')}
                  </Button>
                </div>
                <Select value={selectedEyepiece} onValueChange={setSelectedEyepiece}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eyepieces.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.afov}° AFOV)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom Eyepiece Form */}
                {showCustomEyepiece && (
                  <Card className="border-dashed">
                    <CardContent className="p-3 space-y-2">
                      <Input
                        placeholder={t('ocular.eyepieceName')}
                        value={customEyepiece.name}
                        onChange={e => setCustomEyepiece((prev: Partial<EyepiecePreset>) => ({ ...prev, name: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">{t('ocular.focalLength')} (mm)</Label>
                          <Input
                            type="number"
                            value={customEyepiece.focalLength}
                            onChange={e => setCustomEyepiece((prev: Partial<EyepiecePreset>) => ({ ...prev, focalLength: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('ocular.afov')} (°)</Label>
                          <Input
                            type="number"
                            value={customEyepiece.afov}
                            onChange={e => setCustomEyepiece((prev: Partial<EyepiecePreset>) => ({ ...prev, afov: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <Button size="sm" className="w-full" onClick={handleAddEyepiece}>
                        <Save className="h-3 w-3 mr-1" />
                        {t('common.save')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Barlow Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('ocular.barlow')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowCustomBarlow(!showCustomBarlow)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t('ocular.addCustom')}
                  </Button>
                </div>
                <Select value={selectedBarlow} onValueChange={setSelectedBarlow}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {barlows.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom Barlow Form */}
                {showCustomBarlow && (
                  <Card className="border-dashed">
                    <CardContent className="p-3 space-y-2">
                      <Input
                        placeholder={t('ocular.barlowName')}
                        value={customBarlow.name}
                        onChange={e => setCustomBarlow((prev: Partial<BarlowPreset>) => ({ ...prev, name: e.target.value }))}
                      />
                      <div>
                        <Label className="text-xs">{t('ocular.magnification')}</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={customBarlow.magnification}
                          onChange={e => setCustomBarlow((prev: Partial<BarlowPreset>) => ({ ...prev, magnification: Number(e.target.value) }))}
                        />
                      </div>
                      <Button size="sm" className="w-full" onClick={handleAddBarlow}>
                        <Save className="h-3 w-3 mr-1" />
                        {t('common.save')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Results */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {viewData.magnification.toFixed(0)}x
                  </div>
                  <div className="text-xs text-muted-foreground">{t('ocular.magnification')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {viewData.tfov.toFixed(2)}°
                  </div>
                  <div className="text-xs text-muted-foreground">{t('ocular.trueFov')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className={cn(
                    'text-2xl font-bold',
                    viewData.exitPupil > 7 ? 'text-yellow-400' : 
                    viewData.exitPupil < 0.5 ? 'text-red-400' : 'text-green-400'
                  )}>
                    {viewData.exitPupil.toFixed(1)}mm
                  </div>
                  <div className="text-xs text-muted-foreground">{t('ocular.exitPupil')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {viewData.dawesLimit.toFixed(1)}&quot;
                  </div>
                  <div className="text-xs text-muted-foreground">{t('ocular.resolution')}</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Advanced Info */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t('ocular.advancedInfo')}
                  </span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.focalRatio')}</span>
                    <span>f/{viewData.focalRatio.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.effectiveFL')}</span>
                    <span>{viewData.effectiveFocalLength.toFixed(0)}mm</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.lightGathering')}</span>
                    <span>{viewData.lightGathering.toFixed(0)}x</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.limitingMag')}</span>
                    <span>{viewData.limitingMag.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.minMag')}</span>
                    <span>{viewData.minUsefulMag.toFixed(0)}x</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.maxMag')}</span>
                    <span>{viewData.maxUsefulMag.toFixed(0)}x</span>
                  </div>
                </div>
                
                {/* Warnings */}
                {viewData.isOverMagnified && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm text-red-400">
                      {t('ocular.overMagnifiedWarning')}
                    </AlertDescription>
                  </Alert>
                )}
                {viewData.exitPupil > 7 && (
                  <Alert className="bg-yellow-500/10 border-yellow-500/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-sm text-yellow-400">
                      {t('ocular.largePupilWarning')}
                    </AlertDescription>
                  </Alert>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
