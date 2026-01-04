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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Eyepiece {
  id: string;
  name: string;
  focalLength: number; // mm
  afov: number; // apparent field of view in degrees
  fieldStop?: number; // mm, optional
}

interface TelescopeConfig {
  id: string;
  name: string;
  focalLength: number; // mm
  aperture: number; // mm
  type: 'refractor' | 'reflector' | 'catadioptric';
}

interface BarlowLens {
  id: string;
  name: string;
  magnification: number;
}

// ============================================================================
// Default Data
// ============================================================================

const DEFAULT_EYEPIECES: Eyepiece[] = [
  { id: 'e1', name: 'Plössl 32mm', focalLength: 32, afov: 52 },
  { id: 'e2', name: 'Plössl 25mm', focalLength: 25, afov: 52 },
  { id: 'e3', name: 'Plössl 17mm', focalLength: 17, afov: 52 },
  { id: 'e4', name: 'Plössl 10mm', focalLength: 10, afov: 52 },
  { id: 'e5', name: 'Plössl 6mm', focalLength: 6, afov: 52 },
  { id: 'e6', name: 'Wide Field 24mm', focalLength: 24, afov: 68 },
  { id: 'e7', name: 'Wide Field 15mm', focalLength: 15, afov: 68 },
  { id: 'e8', name: 'Ultra Wide 9mm', focalLength: 9, afov: 82 },
  { id: 'e9', name: 'Ultra Wide 5mm', focalLength: 5, afov: 82 },
];

const DEFAULT_TELESCOPES: TelescopeConfig[] = [
  { id: 't1', name: '80mm f/5 Refractor', focalLength: 400, aperture: 80, type: 'refractor' },
  { id: 't2', name: '102mm f/7 Refractor', focalLength: 714, aperture: 102, type: 'refractor' },
  { id: 't3', name: '130mm f/5 Newtonian', focalLength: 650, aperture: 130, type: 'reflector' },
  { id: 't4', name: '150mm f/5 Newtonian', focalLength: 750, aperture: 150, type: 'reflector' },
  { id: 't5', name: '200mm f/5 Newtonian', focalLength: 1000, aperture: 200, type: 'reflector' },
  { id: 't6', name: '8" SCT f/10', focalLength: 2032, aperture: 203, type: 'catadioptric' },
  { id: 't7', name: '6" Mak f/12', focalLength: 1800, aperture: 150, type: 'catadioptric' },
];

const DEFAULT_BARLOWS: BarlowLens[] = [
  { id: 'b0', name: 'None', magnification: 1 },
  { id: 'b1', name: '2x Barlow', magnification: 2 },
  { id: 'b2', name: '2.5x Barlow', magnification: 2.5 },
  { id: 'b3', name: '3x Barlow', magnification: 3 },
  { id: 'b4', name: '5x Barlow', magnification: 5 },
];

// ============================================================================
// Calculation Functions
// ============================================================================

function calculateOcularView(
  telescope: TelescopeConfig,
  eyepiece: Eyepiece,
  barlow: BarlowLens
) {
  const effectiveFocalLength = telescope.focalLength * barlow.magnification;
  const magnification = effectiveFocalLength / eyepiece.focalLength;
  
  // True field of view
  const tfov = eyepiece.afov / magnification;
  
  // Exit pupil
  const exitPupil = telescope.aperture / magnification;
  
  // Dawes limit (arcseconds) - theoretical resolution
  const dawesLimit = 116 / telescope.aperture;
  
  // Maximum useful magnification (2x aperture in mm)
  const maxUsefulMag = telescope.aperture * 2;
  
  // Minimum useful magnification (aperture/7 for 7mm exit pupil)
  const minUsefulMag = telescope.aperture / 7;
  
  // Focal ratio
  const focalRatio = telescope.focalLength / telescope.aperture;
  
  // Light gathering power compared to naked eye (7mm pupil)
  const lightGathering = Math.pow(telescope.aperture / 7, 2);
  
  // Limiting magnitude (approximate)
  const limitingMag = 2 + 5 * Math.log10(telescope.aperture);
  
  return {
    magnification,
    tfov,
    exitPupil,
    dawesLimit,
    maxUsefulMag,
    minUsefulMag,
    focalRatio,
    lightGathering,
    limitingMag,
    isOverMagnified: magnification > maxUsefulMag,
    isUnderMagnified: magnification < minUsefulMag,
    effectiveFocalLength,
  };
}

// ============================================================================
// Pre-generate star data for ocular view
// ============================================================================

function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: (i % 3) + 1,
    left: (i * 7.3 + 13) % 100,
    top: (i * 11.7 + 23) % 100,
    opacity: 0.2 + ((i * 3.7) % 8) / 10,
  }));
}

const OCULAR_STARS = generateStars(50);

// ============================================================================
// Ocular View Preview Component
// ============================================================================

function OcularViewPreview({ 
  tfov, 
  magnification, 
  exitPupil,
  isOverMagnified 
}: { 
  tfov: number; 
  magnification: number; 
  exitPupil: number;
  isOverMagnified: boolean;
}) {
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
  
  // Equipment state
  const [telescopes, setTelescopes] = useState<TelescopeConfig[]>(DEFAULT_TELESCOPES);
  const [eyepieces, setEyepieces] = useState<Eyepiece[]>(DEFAULT_EYEPIECES);
  const [barlows] = useState<BarlowLens[]>(DEFAULT_BARLOWS);
  
  // Selection state
  const [selectedTelescope, setSelectedTelescope] = useState<string>(telescopes[0].id);
  const [selectedEyepiece, setSelectedEyepiece] = useState<string>(eyepieces[0].id);
  const [selectedBarlow, setSelectedBarlow] = useState<string>(barlows[0].id);
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomTelescope, setShowCustomTelescope] = useState(false);
  const [showCustomEyepiece, setShowCustomEyepiece] = useState(false);
  
  // Custom equipment form
  const [customTelescope, setCustomTelescope] = useState<Partial<TelescopeConfig>>({
    name: '',
    focalLength: 1000,
    aperture: 200,
    type: 'reflector',
  });
  const [customEyepiece, setCustomEyepiece] = useState<Partial<Eyepiece>>({
    name: '',
    focalLength: 10,
    afov: 52,
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
      const newTelescope: TelescopeConfig = {
        id: `custom-t-${Date.now()}`,
        name: customTelescope.name,
        focalLength: customTelescope.focalLength,
        aperture: customTelescope.aperture,
        type: customTelescope.type || 'reflector',
      };
      setTelescopes(prev => [...prev, newTelescope]);
      setSelectedTelescope(newTelescope.id);
      setShowCustomTelescope(false);
      setCustomTelescope({ name: '', focalLength: 1000, aperture: 200, type: 'reflector' });
    }
  }, [customTelescope]);
  
  // Add custom eyepiece
  const handleAddEyepiece = useCallback(() => {
    if (customEyepiece.name && customEyepiece.focalLength && customEyepiece.afov) {
      const newEyepiece: Eyepiece = {
        id: `custom-e-${Date.now()}`,
        name: customEyepiece.name,
        focalLength: customEyepiece.focalLength,
        afov: customEyepiece.afov,
      };
      setEyepieces(prev => [...prev, newEyepiece]);
      setSelectedEyepiece(newEyepiece.id);
      setShowCustomEyepiece(false);
      setCustomEyepiece({ name: '', focalLength: 10, afov: 52 });
    }
  }, [customEyepiece]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
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
                        onChange={e => setCustomTelescope(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">{t('ocular.focalLength')} (mm)</Label>
                          <Input
                            type="number"
                            value={customTelescope.focalLength}
                            onChange={e => setCustomTelescope(prev => ({ ...prev, focalLength: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('ocular.aperture')} (mm)</Label>
                          <Input
                            type="number"
                            value={customTelescope.aperture}
                            onChange={e => setCustomTelescope(prev => ({ ...prev, aperture: Number(e.target.value) }))}
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
                        onChange={e => setCustomEyepiece(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">{t('ocular.focalLength')} (mm)</Label>
                          <Input
                            type="number"
                            value={customEyepiece.focalLength}
                            onChange={e => setCustomEyepiece(prev => ({ ...prev, focalLength: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('ocular.afov')} (°)</Label>
                          <Input
                            type="number"
                            value={customEyepiece.afov}
                            onChange={e => setCustomEyepiece(prev => ({ ...prev, afov: Number(e.target.value) }))}
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
                <Label className="text-sm font-medium">{t('ocular.barlow')}</Label>
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
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                    ⚠️ {t('ocular.overMagnifiedWarning')}
                  </div>
                )}
                {viewData.exitPupil > 7 && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-400">
                    ⚠️ {t('ocular.largePupilWarning')}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
