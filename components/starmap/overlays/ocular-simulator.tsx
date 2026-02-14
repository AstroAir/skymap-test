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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  Save,
  AlertTriangle,
  Info,
  Star,
  Moon,
  Crosshair,
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
import { calculateOcularView, generateStars } from '@/lib/astronomy/ocular-utils';
import type { OcularViewPreviewProps } from '@/types/starmap/overlays';

// ============================================================================
// Ocular View Preview Component (Enhanced)
// ============================================================================

function OcularViewPreview({ 
  tfov, 
  magnification, 
  exitPupil,
  isOverMagnified,
  isUnderMagnified,
}: OcularViewPreviewProps) {
  // Scale view circle based on TFOV — wider FOV = larger circle
  const viewSize = Math.min(190, Math.max(60, tfov * 80));
  
  // Generate stars scaled to magnification
  const stars = useMemo(() => {
    const baseStars = generateStars(60);
    // Higher mag → fewer visible stars in FOV, but each appears larger/brighter
    const magFactor = Math.min(magnification / 20, 3);
    // Lower exit pupil → dimmer overall
    const brightnessFactor = Math.min(exitPupil / 3, 1);
    return baseStars.map((star) => ({
      ...star,
      size: Math.max(1, star.size * (1 + magFactor * 0.5)),
      opacity: star.opacity * brightnessFactor * (isOverMagnified ? 0.4 : 1),
    }));
  }, [magnification, exitPupil, isOverMagnified]);
  
  // Vignetting gradient for realistic edge darkening
  const vignetteGradient = `radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.9) 100%)`;
  
  return (
    <div className="relative flex items-center justify-center h-[200px] bg-black rounded-lg overflow-hidden">
      {/* Star field — only visible inside the circle via CSS mask */}
      <div 
        className="absolute flex items-center justify-center"
        style={{
          width: `${viewSize}px`,
          height: `${viewSize}px`,
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        {/* Stars */}
        <div className="absolute inset-0">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                opacity: star.opacity,
                backgroundColor: star.size > 2.5 ? '#fffbe6' : '#ffffff',
                boxShadow: star.size > 2.5 ? `0 0 ${star.size}px rgba(255,255,255,0.6)` : 'none',
              }}
            />
          ))}
        </div>
        
        {/* Vignetting overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: vignetteGradient }}
        />
        
        {/* Center crosshair */}
        <div className="absolute w-full h-px bg-primary/20" />
        <div className="absolute w-px h-full bg-primary/20" />
      </div>
      
      {/* Circle border */}
      <div 
        className={cn(
          'absolute rounded-full border-2 pointer-events-none',
          isOverMagnified ? 'border-red-500/60' : 
          isUnderMagnified ? 'border-yellow-500/60' : 'border-sky-400/50'
        )}
        style={{ width: `${viewSize}px`, height: `${viewSize}px` }}
      />
      
      {/* FOV label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/60 font-mono bg-black/60 px-1.5 rounded">
        TFOV {tfov.toFixed(2)}°
      </div>
      
      {/* Info overlay */}
      <div className="absolute top-2 left-2 text-[10px] text-white/70 space-y-0.5 font-mono bg-black/40 px-1.5 py-0.5 rounded">
        <div>{magnification.toFixed(0)}x</div>
        <div>EP {exitPupil.toFixed(1)}mm</div>
      </div>
      
      {/* Status badge */}
      {isOverMagnified && (
        <div className="absolute top-2 right-2">
          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
            {magnification.toFixed(0)}x &gt; {exitPupil < 0.5 ? 'max' : 'limit'}
          </Badge>
        </div>
      )}
      {isUnderMagnified && !isOverMagnified && (
        <div className="absolute top-2 right-2">
          <Badge className="text-[9px] px-1.5 py-0 bg-yellow-600/80">
            Under-mag
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Observation Suggestion Badge
// ============================================================================

function ObservingSuggestionBadge({ suggestion }: { suggestion: string }) {
  const t = useTranslations('ocular');
  const config = {
    deepsky: { icon: Star, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: t('suggestDeepsky') },
    allround: { icon: Eye, color: 'bg-green-500/20 text-green-400 border-green-500/30', label: t('suggestAllround') },
    planetary: { icon: Moon, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: t('suggestPlanetary') },
    overlimit: { icon: AlertTriangle, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: t('suggestOverlimit') },
  }[suggestion] || { icon: Crosshair, color: 'bg-muted', label: suggestion };
  
  const Icon = config.icon;
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium', config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
}

// ============================================================================
// Equipment Selector with delete support
// ============================================================================

interface EquipmentSelectorProps<T extends { id: string; name: string; isCustom?: boolean }> {
  label: string;
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete?: (id: string) => void;
  showAdd: boolean;
  onToggleAdd: () => void;
  renderLabel: (item: T) => string;
  addForm: React.ReactNode;
  groupBuiltin?: boolean;
}

function EquipmentSelector<T extends { id: string; name: string; isCustom?: boolean }>({
  label,
  items,
  selectedId,
  onSelect,
  onDelete,
  showAdd,
  onToggleAdd,
  renderLabel,
  addForm,
}: EquipmentSelectorProps<T>) {
  const t = useTranslations('ocular');
  const builtinItems = items.filter((i) => !i.isCustom);
  const customItems = items.filter((i) => i.isCustom);
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={onToggleAdd}>
          <Plus className="h-3 w-3 mr-0.5" />
          {t('addCustom')}
        </Button>
      </div>
      <div className="flex gap-1.5">
        <Select value={selectedId} onValueChange={onSelect}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-[10px]">{t('builtinPresets')}</SelectLabel>
              {builtinItems.map((item) => (
                <SelectItem key={item.id} value={item.id} className="text-xs">
                  {renderLabel(item)}
                </SelectItem>
              ))}
            </SelectGroup>
            {customItems.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px]">{t('customPresets')}</SelectLabel>
                {customItems.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="text-xs">
                    ★ {renderLabel(item)}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        {onDelete && items.find((i) => i.id === selectedId)?.isCustom && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(selectedId)}
            aria-label={t('deleteCustom')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {showAdd && addForm}
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
  const removeCustomEyepiece = useEquipmentStore((s) => s.removeCustomEyepiece);
  const removeCustomBarlow = useEquipmentStore((s) => s.removeCustomBarlow);
  const removeCustomOcularTelescope = useEquipmentStore((s) => s.removeCustomOcularTelescope);

  // Persisted selection state
  const selectedTelescope = useEquipmentStore((s) => s.selectedOcularTelescopeId);
  const selectedEyepiece = useEquipmentStore((s) => s.selectedEyepieceId);
  const selectedBarlow = useEquipmentStore((s) => s.selectedBarlowId);
  const setSelectedTelescope = useEquipmentStore((s) => s.setSelectedOcularTelescopeId);
  const setSelectedEyepiece = useEquipmentStore((s) => s.setSelectedEyepieceId);
  const setSelectedBarlow = useEquipmentStore((s) => s.setSelectedBarlowId);

  // Merge built-in presets with user custom items
  const telescopes = useMemo(() => [...OCULAR_TELESCOPE_PRESETS, ...customOcularTelescopes], [customOcularTelescopes]);
  const eyepieces = useMemo(() => [...EYEPIECE_PRESETS, ...customEyepieces], [customEyepieces]);
  const barlows = useMemo(() => [...BARLOW_PRESETS, ...customBarlows], [customBarlows]);
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomTelescope, setShowCustomTelescope] = useState(false);
  const [showCustomEyepiece, setShowCustomEyepiece] = useState(false);
  const [showCustomBarlow, setShowCustomBarlow] = useState(false);
  
  // Custom equipment form
  const [customTelescopeForm, setCustomTelescopeForm] = useState<Partial<OcularTelescopePreset>>({
    name: '',
    focalLength: 1000,
    aperture: 200,
    type: 'reflector',
  });
  const [customEyepieceForm, setCustomEyepieceForm] = useState<Partial<EyepiecePreset>>({
    name: '',
    focalLength: 10,
    afov: 52,
  });
  const [customBarlowForm, setCustomBarlowForm] = useState<Partial<BarlowPreset>>({
    name: '',
    magnification: 2,
  });
  
  // Get selected equipment
  const telescope = useMemo(() => 
    telescopes.find((tp) => tp.id === selectedTelescope) || telescopes[0],
    [telescopes, selectedTelescope]
  );
  
  const eyepiece = useMemo(() => 
    eyepieces.find((ep) => ep.id === selectedEyepiece) || eyepieces[0],
    [eyepieces, selectedEyepiece]
  );
  
  const barlow = useMemo(() => 
    barlows.find((bl) => bl.id === selectedBarlow) || barlows[0],
    [barlows, selectedBarlow]
  );
  
  // Calculate view
  const viewData = useMemo(() => 
    calculateOcularView(telescope, eyepiece, barlow),
    [telescope, eyepiece, barlow]
  );
  
  // Add custom telescope
  const handleAddTelescope = useCallback(() => {
    if (customTelescopeForm.name && customTelescopeForm.focalLength && customTelescopeForm.aperture) {
      addCustomOcularTelescope({
        name: customTelescopeForm.name,
        focalLength: customTelescopeForm.focalLength,
        aperture: customTelescopeForm.aperture,
        type: customTelescopeForm.type || 'reflector',
      });
      setShowCustomTelescope(false);
      setCustomTelescopeForm({ name: '', focalLength: 1000, aperture: 200, type: 'reflector' });
    }
  }, [customTelescopeForm, addCustomOcularTelescope]);
  
  // Add custom eyepiece
  const handleAddEyepiece = useCallback(() => {
    if (customEyepieceForm.name && customEyepieceForm.focalLength && customEyepieceForm.afov) {
      addCustomEyepiece({
        name: customEyepieceForm.name,
        focalLength: customEyepieceForm.focalLength,
        afov: customEyepieceForm.afov,
        fieldStop: customEyepieceForm.fieldStop,
      });
      setShowCustomEyepiece(false);
      setCustomEyepieceForm({ name: '', focalLength: 10, afov: 52 });
    }
  }, [customEyepieceForm, addCustomEyepiece]);
  
  // Add custom barlow
  const handleAddBarlow = useCallback(() => {
    if (customBarlowForm.name && customBarlowForm.magnification) {
      addCustomBarlow({
        name: customBarlowForm.name,
        magnification: customBarlowForm.magnification,
      });
      setShowCustomBarlow(false);
      setCustomBarlowForm({ name: '', magnification: 2 });
    }
  }, [customBarlowForm, addCustomBarlow]);
  
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
      
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {t('ocular.eyepieceSimulator')}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-3 pr-2">
            {/* Ocular View Preview */}
            <OcularViewPreview 
              tfov={viewData.tfov}
              magnification={viewData.magnification}
              exitPupil={viewData.exitPupil}
              isOverMagnified={viewData.isOverMagnified}
              isUnderMagnified={viewData.isUnderMagnified}
            />
            
            {/* Observation Suggestion */}
            <div className="flex items-center justify-between gap-2">
              <ObservingSuggestionBadge suggestion={viewData.observingSuggestion} />
              <div className="text-[10px] text-muted-foreground font-mono">
                {viewData.surfaceBrightness >= 1 
                  ? `${t('ocular.surfaceBrightness')}: ${(viewData.surfaceBrightness * 100).toFixed(0)}%`
                  : `${t('ocular.surfaceBrightness')}: ${(viewData.surfaceBrightness * 100).toFixed(0)}%`
                }
              </div>
            </div>
            
            {/* Equipment Selection — 3 compact rows */}
            <div className="space-y-2">
              {/* Telescope */}
              <EquipmentSelector
                label={t('ocular.telescope')}
                items={telescopes}
                selectedId={selectedTelescope}
                onSelect={setSelectedTelescope}
                onAdd={handleAddTelescope}
                onDelete={removeCustomOcularTelescope}
                showAdd={showCustomTelescope}
                onToggleAdd={() => setShowCustomTelescope(!showCustomTelescope)}
                renderLabel={(tp) => `${tp.name} (f/${(tp.focalLength / tp.aperture).toFixed(1)})`}
                addForm={
                  <Card className="border-dashed mt-1.5">
                    <CardContent className="p-2.5 space-y-2">
                      <Input
                        placeholder={t('ocular.telescopeName')}
                        className="h-7 text-xs"
                        value={customTelescopeForm.name}
                        onChange={(e) => setCustomTelescopeForm((prev: Partial<OcularTelescopePreset>) => ({ ...prev, name: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px]">{t('ocular.focalLength')} (mm)</Label>
                          <Input type="number" className="h-7 text-xs" value={customTelescopeForm.focalLength}
                            onChange={(e) => setCustomTelescopeForm((prev: Partial<OcularTelescopePreset>) => ({ ...prev, focalLength: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label className="text-[10px]">{t('ocular.aperture')} (mm)</Label>
                          <Input type="number" className="h-7 text-xs" value={customTelescopeForm.aperture}
                            onChange={(e) => setCustomTelescopeForm((prev: Partial<OcularTelescopePreset>) => ({ ...prev, aperture: Number(e.target.value) }))} />
                        </div>
                      </div>
                      <Button size="sm" className="w-full h-7 text-xs" onClick={handleAddTelescope}>
                        <Save className="h-3 w-3 mr-1" />{t('common.save')}
                      </Button>
                    </CardContent>
                  </Card>
                }
              />
              
              {/* Eyepiece */}
              <EquipmentSelector
                label={t('ocular.eyepiece')}
                items={eyepieces}
                selectedId={selectedEyepiece}
                onSelect={setSelectedEyepiece}
                onAdd={handleAddEyepiece}
                onDelete={removeCustomEyepiece}
                showAdd={showCustomEyepiece}
                onToggleAdd={() => setShowCustomEyepiece(!showCustomEyepiece)}
                renderLabel={(ep) => `${ep.name} (${ep.afov}° AFOV)`}
                addForm={
                  <Card className="border-dashed mt-1.5">
                    <CardContent className="p-2.5 space-y-2">
                      <Input
                        placeholder={t('ocular.eyepieceName')}
                        className="h-7 text-xs"
                        value={customEyepieceForm.name}
                        onChange={(e) => setCustomEyepieceForm((prev: Partial<EyepiecePreset>) => ({ ...prev, name: e.target.value }))}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[10px]">{t('ocular.focalLength')} (mm)</Label>
                          <Input type="number" className="h-7 text-xs" value={customEyepieceForm.focalLength}
                            onChange={(e) => setCustomEyepieceForm((prev: Partial<EyepiecePreset>) => ({ ...prev, focalLength: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label className="text-[10px]">{t('ocular.afov')} (°)</Label>
                          <Input type="number" className="h-7 text-xs" value={customEyepieceForm.afov}
                            onChange={(e) => setCustomEyepieceForm((prev: Partial<EyepiecePreset>) => ({ ...prev, afov: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label className="text-[10px]">{t('ocular.fieldStop')} (mm)</Label>
                          <Input type="number" className="h-7 text-xs" placeholder="—"
                            value={customEyepieceForm.fieldStop || ''}
                            onChange={(e) => setCustomEyepieceForm((prev: Partial<EyepiecePreset>) => ({ ...prev, fieldStop: e.target.value ? Number(e.target.value) : undefined }))} />
                        </div>
                      </div>
                      <Button size="sm" className="w-full h-7 text-xs" onClick={handleAddEyepiece}>
                        <Save className="h-3 w-3 mr-1" />{t('common.save')}
                      </Button>
                    </CardContent>
                  </Card>
                }
              />
              
              {/* Barlow / Reducer */}
              <EquipmentSelector
                label={t('ocular.barlowReducer')}
                items={barlows}
                selectedId={selectedBarlow}
                onSelect={setSelectedBarlow}
                onAdd={handleAddBarlow}
                onDelete={removeCustomBarlow}
                showAdd={showCustomBarlow}
                onToggleAdd={() => setShowCustomBarlow(!showCustomBarlow)}
                renderLabel={(bl) => `${bl.name} (${bl.magnification}x)`}
                addForm={
                  <Card className="border-dashed mt-1.5">
                    <CardContent className="p-2.5 space-y-2">
                      <Input
                        placeholder={t('ocular.barlowName')}
                        className="h-7 text-xs"
                        value={customBarlowForm.name}
                        onChange={(e) => setCustomBarlowForm((prev: Partial<BarlowPreset>) => ({ ...prev, name: e.target.value }))}
                      />
                      <div>
                        <Label className="text-[10px]">{t('ocular.magnification')} (e.g. 2 or 0.63)</Label>
                        <Input type="number" step="0.1" className="h-7 text-xs" value={customBarlowForm.magnification}
                          onChange={(e) => setCustomBarlowForm((prev: Partial<BarlowPreset>) => ({ ...prev, magnification: Number(e.target.value) }))} />
                      </div>
                      <Button size="sm" className="w-full h-7 text-xs" onClick={handleAddBarlow}>
                        <Save className="h-3 w-3 mr-1" />{t('common.save')}
                      </Button>
                    </CardContent>
                  </Card>
                }
              />
            </div>
            
            <Separator />
            
            {/* Results — compact 2x2 grid */}
            <div className="grid grid-cols-4 gap-2">
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-lg font-bold text-primary">
                    {viewData.magnification.toFixed(0)}x
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t('ocular.magnification')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-lg font-bold text-primary">
                    {viewData.tfov >= 1 ? viewData.tfov.toFixed(1) : viewData.tfov.toFixed(2)}°
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t('ocular.trueFov')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className={cn(
                    'text-lg font-bold',
                    viewData.exitPupil > 7 ? 'text-yellow-400' : 
                    viewData.exitPupil < 0.5 ? 'text-red-400' : 'text-green-400'
                  )}>
                    {viewData.exitPupil.toFixed(1)}mm
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t('ocular.exitPupil')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-lg font-bold text-primary">
                    {viewData.dawesLimit.toFixed(1)}&quot;
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t('ocular.resolution')}</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Warnings — shown directly, not hidden in collapsible */}
            {viewData.isOverMagnified && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 py-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs text-red-400">
                  {t('ocular.overMagnifiedWarning')}
                </AlertDescription>
              </Alert>
            )}
            {viewData.isUnderMagnified && !viewData.isOverMagnified && (
              <Alert className="bg-yellow-500/10 border-yellow-500/30 py-2">
                <Info className="h-3.5 w-3.5 text-yellow-400" />
                <AlertDescription className="text-xs text-yellow-400">
                  {t('ocular.underMagnifiedWarning')}
                </AlertDescription>
              </Alert>
            )}
            {viewData.exitPupil > 7 && !viewData.isUnderMagnified && (
              <Alert className="bg-yellow-500/10 border-yellow-500/30 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                <AlertDescription className="text-xs text-yellow-400">
                  {t('ocular.largePupilWarning')}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Advanced Info */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between h-7">
                  <span className="flex items-center gap-1.5 text-xs">
                    <Settings className="h-3.5 w-3.5" />
                    {t('ocular.advancedInfo')}
                  </span>
                  {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="flex justify-between p-1.5 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.focalRatio')}</span>
                    <span className="font-mono">f/{viewData.focalRatio.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.effectiveFL')}</span>
                    <span className="font-mono">{viewData.effectiveFocalLength.toFixed(0)}mm</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.lightGathering')}</span>
                    <span className="font-mono">{viewData.lightGathering.toFixed(0)}x</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.limitingMag')}</span>
                    <span className="font-mono">{viewData.limitingMag.toFixed(1)} mag</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.rayleighLimit')}</span>
                    <span className="font-mono">{viewData.rayleighLimit.toFixed(2)}&quot;</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.bestPlanetaryMag')}</span>
                    <span className="font-mono">{viewData.bestPlanetaryMag.toFixed(0)}x</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.minMag')}</span>
                    <span className="font-mono">{viewData.minUsefulMag.toFixed(0)}x</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t('ocular.maxMag')}</span>
                    <span className="font-mono">{viewData.maxUsefulMag.toFixed(0)}x</span>
                  </div>
                </div>
                
                {/* Magnification range bar */}
                <div className="px-1.5">
                  <Label className="text-[10px] text-muted-foreground">{t('ocular.magRange')}</Label>
                  <div className="relative h-3 bg-muted/50 rounded-full mt-1 overflow-hidden">
                    {/* Useful range */}
                    <div 
                      className="absolute h-full bg-green-500/30 rounded-full"
                      style={{
                        left: `${Math.max(0, (viewData.minUsefulMag / (viewData.maxUsefulMag * 1.3)) * 100)}%`,
                        width: `${Math.min(100, ((viewData.maxUsefulMag - viewData.minUsefulMag) / (viewData.maxUsefulMag * 1.3)) * 100)}%`,
                      }}
                    />
                    {/* Current magnification marker */}
                    <div 
                      className={cn(
                        'absolute top-0 w-1 h-full rounded-full',
                        viewData.isOverMagnified ? 'bg-red-400' : 
                        viewData.isUnderMagnified ? 'bg-yellow-400' : 'bg-primary'
                      )}
                      style={{
                        left: `${Math.min(100, (viewData.magnification / (viewData.maxUsefulMag * 1.3)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>{viewData.minUsefulMag.toFixed(0)}x</span>
                    <span>{viewData.magnification.toFixed(0)}x</span>
                    <span>{viewData.maxUsefulMag.toFixed(0)}x</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
