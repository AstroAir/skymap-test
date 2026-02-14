'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  formatRA, 
  formatDec, 
  formatPixelScale,
  formatExposure,
} from '@/lib/plate-solving';
import { formatFileSize } from '@/lib/tauri/plate-solver-api';
import type { ImageMetadata } from '@/types/starmap/plate-solving';

// ============================================================================
// Props
// ============================================================================

interface FitsMetadataPanelProps {
  metadata: ImageMetadata;
}

// ============================================================================
// Component
// ============================================================================

export function FitsMetadataPanel({ metadata }: FitsMetadataPanelProps) {
  const t = useTranslations();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
        <div className="flex items-center gap-3">
          <span>{metadata.name}</span>
          {metadata.width > 0 && (
            <span>{metadata.width} × {metadata.height}</span>
          )}
          <span>{formatFileSize(metadata.size)}</span>
        </div>
        {metadata.isFits && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary">
                  FITS
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {t('plateSolving.fitsInfo') || 'FITS format detected - will be sent directly to solver'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {metadata.fitsData && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              <span>{t('plateSolving.fitsMetadata') || 'FITS Metadata'}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 rounded-lg p-3">
              {metadata.fitsData.wcs && (
                <>
                  <div className="col-span-2 font-medium text-primary border-b border-primary/20 pb-1 mb-1">
                    {t('plateSolving.wcsInfo') || 'WCS Coordinates'}
                  </div>
                  <div className="text-muted-foreground">{t('coordinates.ra') || 'RA'}:</div>
                  <div className="font-mono">{formatRA(metadata.fitsData.wcs.referenceCoordinates.ra)}</div>
                  <div className="text-muted-foreground">{t('coordinates.dec') || 'Dec'}:</div>
                  <div className="font-mono">{formatDec(metadata.fitsData.wcs.referenceCoordinates.dec)}</div>
                  <div className="text-muted-foreground">{t('plateSolving.pixelScale') || 'Scale'}:</div>
                  <div className="font-mono">{formatPixelScale(metadata.fitsData.wcs.pixelScale)}</div>
                  <div className="text-muted-foreground">{t('plateSolving.rotation') || 'Rotation'}:</div>
                  <div className="font-mono">{metadata.fitsData.wcs.rotation.toFixed(2)}°</div>
                  {metadata.fitsData.wcs.projectionType && (
                    <>
                      <div className="text-muted-foreground">{t('plateSolving.projection') || 'Projection'}:</div>
                      <div className="font-mono">{metadata.fitsData.wcs.projectionType}</div>
                    </>
                  )}
                </>
              )}
              
              {metadata.fitsData.observation && (
                <>
                  <div className="col-span-2 font-medium text-primary border-b border-primary/20 pb-1 mb-1 mt-2">
                    {t('plateSolving.observationInfo') || 'Observation Info'}
                  </div>
                  {metadata.fitsData.observation.object && (
                    <>
                      <div className="text-muted-foreground">{t('plateSolving.object') || 'Object'}:</div>
                      <div>{metadata.fitsData.observation.object}</div>
                    </>
                  )}
                  {metadata.fitsData.observation.dateObs && (
                    <>
                      <div className="text-muted-foreground">{t('plateSolving.dateObs') || 'Date'}:</div>
                      <div className="font-mono text-[10px]">{metadata.fitsData.observation.dateObs}</div>
                    </>
                  )}
                  {metadata.fitsData.observation.exptime && (
                    <>
                      <div className="text-muted-foreground">{t('plateSolving.exposure') || 'Exposure'}:</div>
                      <div className="font-mono">{formatExposure(metadata.fitsData.observation.exptime)}</div>
                    </>
                  )}
                  {metadata.fitsData.observation.filter && (
                    <>
                      <div className="text-muted-foreground">{t('plateSolving.filter') || 'Filter'}:</div>
                      <div>{metadata.fitsData.observation.filter}</div>
                    </>
                  )}
                  {metadata.fitsData.observation.telescope && (
                    <>
                      <div className="text-muted-foreground">{t('plateSolving.telescope') || 'Telescope'}:</div>
                      <div className="truncate">{metadata.fitsData.observation.telescope}</div>
                    </>
                  )}
                  {metadata.fitsData.observation.instrument && (
                    <>
                      <div className="text-muted-foreground">{t('plateSolving.instrument') || 'Instrument'}:</div>
                      <div className="truncate">{metadata.fitsData.observation.instrument}</div>
                    </>
                  )}
                </>
              )}
              
              {metadata.fitsData.image && (
                <>
                  <div className="col-span-2 font-medium text-primary border-b border-primary/20 pb-1 mb-1 mt-2">
                    {t('plateSolving.imageInfo') || 'Image Info'}
                  </div>
                  <div className="text-muted-foreground">{t('plateSolving.dimensions') || 'Size'}:</div>
                  <div className="font-mono">{metadata.fitsData.image.width} × {metadata.fitsData.image.height}</div>
                  <div className="text-muted-foreground">{t('plateSolving.bitDepth') || 'Bit Depth'}:</div>
                  <div className="font-mono">{Math.abs(metadata.fitsData.image.bitpix)}-bit</div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
