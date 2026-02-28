'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
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
            <div className="text-xs bg-muted/30 rounded-lg p-3">
              <Table>
                <TableBody>
                  {metadata.fitsData.wcs && (
                    <>
                      <TableRow className="border-0">
                        <TableCell colSpan={2} className="px-0 pt-0 pb-1">
                          <div className="font-medium text-primary">
                            {t('plateSolving.wcsInfo') || 'WCS Coordinates'}
                          </div>
                          <Separator className="mt-1 bg-primary/20" />
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell className="px-0 py-0.5 text-muted-foreground">{t('coordinates.ra') || 'RA'}:</TableCell>
                        <TableCell className="px-0 py-0.5 font-mono text-right">{formatRA(metadata.fitsData.wcs.referenceCoordinates.ra)}</TableCell>
                      </TableRow>
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell className="px-0 py-0.5 text-muted-foreground">{t('coordinates.dec') || 'Dec'}:</TableCell>
                        <TableCell className="px-0 py-0.5 font-mono text-right">{formatDec(metadata.fitsData.wcs.referenceCoordinates.dec)}</TableCell>
                      </TableRow>
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.pixelScale') || 'Scale'}:</TableCell>
                        <TableCell className="px-0 py-0.5 font-mono text-right">{formatPixelScale(metadata.fitsData.wcs.pixelScale)}</TableCell>
                      </TableRow>
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.rotation') || 'Rotation'}:</TableCell>
                        <TableCell className="px-0 py-0.5 font-mono text-right">{metadata.fitsData.wcs.rotation.toFixed(2)}°</TableCell>
                      </TableRow>
                      {metadata.fitsData.wcs.projectionType && (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.projection') || 'Projection'}:</TableCell>
                          <TableCell className="px-0 py-0.5 font-mono text-right">{metadata.fitsData.wcs.projectionType}</TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                  
                  {metadata.fitsData.observation && (
                    <>
                      <TableRow className="border-0">
                        <TableCell colSpan={2} className="px-0 pt-3 pb-1">
                          <div className="font-medium text-primary">
                            {t('plateSolving.observationInfo') || 'Observation Info'}
                          </div>
                          <Separator className="mt-1 bg-primary/20" />
                        </TableCell>
                      </TableRow>
                      {metadata.fitsData.observation.object && (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.object') || 'Object'}:</TableCell>
                          <TableCell className="px-0 py-0.5 text-right">{metadata.fitsData.observation.object}</TableCell>
                        </TableRow>
                      )}
                      {metadata.fitsData.observation.dateObs && (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.dateObs') || 'Date'}:</TableCell>
                          <TableCell className="px-0 py-0.5 font-mono text-[10px] text-right">{metadata.fitsData.observation.dateObs}</TableCell>
                        </TableRow>
                      )}
                      {metadata.fitsData.observation.exptime && (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.exposure') || 'Exposure'}:</TableCell>
                          <TableCell className="px-0 py-0.5 font-mono text-right">{formatExposure(metadata.fitsData.observation.exptime)}</TableCell>
                        </TableRow>
                      )}
                      {metadata.fitsData.observation.filter && (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.filter') || 'Filter'}:</TableCell>
                          <TableCell className="px-0 py-0.5 text-right">{metadata.fitsData.observation.filter}</TableCell>
                        </TableRow>
                      )}
                      {metadata.fitsData.observation.telescope && (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.telescope') || 'Telescope'}:</TableCell>
                          <TableCell className="px-0 py-0.5 truncate text-right">{metadata.fitsData.observation.telescope}</TableCell>
                        </TableRow>
                      )}
                      {metadata.fitsData.observation.instrument && (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.instrument') || 'Instrument'}:</TableCell>
                          <TableCell className="px-0 py-0.5 truncate text-right">{metadata.fitsData.observation.instrument}</TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                  
                  {metadata.fitsData.image && (
                    <>
                      <TableRow className="border-0">
                        <TableCell colSpan={2} className="px-0 pt-3 pb-1">
                          <div className="font-medium text-primary">
                            {t('plateSolving.imageInfo') || 'Image Info'}
                          </div>
                          <Separator className="mt-1 bg-primary/20" />
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.dimensions') || 'Size'}:</TableCell>
                        <TableCell className="px-0 py-0.5 font-mono text-right">{metadata.fitsData.image.width} × {metadata.fitsData.image.height}</TableCell>
                      </TableRow>
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell className="px-0 py-0.5 text-muted-foreground">{t('plateSolving.bitDepth') || 'Bit Depth'}:</TableCell>
                        <TableCell className="px-0 py-0.5 font-mono text-right">{Math.abs(metadata.fitsData.image.bitpix)}-bit</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
