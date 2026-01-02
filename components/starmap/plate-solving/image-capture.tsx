'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Camera, 
  Upload, 
  RotateCcw, 
  Check, 
  FileImage, 
  AlertCircle,
  Loader2,
  ImageIcon,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
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
  parseFITSHeader, 
  formatRA, 
  formatDec, 
  formatPixelScale,
  formatExposure,
  type FITSMetadata 
} from '@/lib/plate-solving';

// ============================================================================
// Types
// ============================================================================

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
  isFits?: boolean;
  fitsData?: FITSMetadata;
}

export interface ImageCaptureProps {
  onImageCapture: (file: File, metadata?: ImageMetadata) => void;
  trigger?: React.ReactNode;
  className?: string;
  maxFileSizeMB?: number;
  enableCompression?: boolean;
  acceptedFormats?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_FILE_SIZE_MB = 50;
const DEFAULT_ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
const FITS_EXTENSIONS = ['.fits', '.fit', '.fts'];
const COMPRESSION_QUALITY = 0.85;
const MAX_DIMENSION_FOR_PREVIEW = 4096;

// ============================================================================
// Utility Functions
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isFitsFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return FITS_EXTENSIONS.some(ext => name.endsWith(ext));
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function compressImage(
  file: File, 
  maxDimension: number, 
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { 
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
      
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

// ============================================================================
// Component
// ============================================================================

export function ImageCapture({ 
  onImageCapture, 
  trigger, 
  className,
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
  enableCompression = true,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS
}: ImageCaptureProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'camera' | 'upload'>('upload');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  const [compressionEnabled, setCompressionEnabled] = useState(enableCompression);
  const [compressionQuality, setCompressionQuality] = useState(85);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const maxFileSizeBytes = useMemo(() => maxFileSizeMB * 1024 * 1024, [maxFileSizeMB]);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSizeBytes) {
      return t('plateSolving.fileTooLarge') || `File too large. Maximum size is ${maxFileSizeMB}MB`;
    }
    
    const isFits = isFitsFile(file);
    if (!isFits && !acceptedFormats.includes(file.type) && !file.type.startsWith('image/')) {
      return t('plateSolving.unsupportedFormat') || 'Unsupported file format';
    }
    
    return null;
  }, [maxFileSizeBytes, maxFileSizeMB, acceptedFormats, t]);

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setFileError(null);
    
    try {
      const validationError = validateFile(file);
      if (validationError) {
        setFileError(validationError);
        setIsLoading(false);
        return;
      }
      
      setLoadingProgress(20);
      
      const isFits = isFitsFile(file);
      const metadata: ImageMetadata = {
        width: 0,
        height: 0,
        size: file.size,
        type: file.type || (isFits ? 'image/fits' : 'unknown'),
        name: file.name,
        isFits,
      };
      
      if (isFits) {
        try {
          const fitsData = await parseFITSHeader(file);
          metadata.fitsData = fitsData;
          if (fitsData.image) {
            metadata.width = fitsData.image.width;
            metadata.height = fitsData.image.height;
          }
        } catch {
          // Continue without FITS metadata if parsing fails
        }
      } else {
        try {
          const dims = await getImageDimensions(file);
          metadata.width = dims.width;
          metadata.height = dims.height;
        } catch {
          // Continue without dimensions for non-standard formats
        }
      }
      
      setLoadingProgress(50);
      
      let processedFile = file;
      
      if (compressionEnabled && !isFits && file.size > 2 * 1024 * 1024) {
        try {
          processedFile = await compressImage(
            file,
            MAX_DIMENSION_FOR_PREVIEW,
            compressionQuality / 100
          );
          metadata.size = processedFile.size;
        } catch {
          // Use original if compression fails
        }
      }
      
      setLoadingProgress(80);
      
      setCapturedFile(processedFile);
      setImageMetadata(metadata);
      
      if (!isFits) {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setLoadingProgress(80 + (e.loaded / e.total) * 20);
          }
        };
        reader.onload = (event) => {
          setCapturedImage(event.target?.result as string);
          setLoadingProgress(100);
          setIsLoading(false);
        };
        reader.onerror = () => {
          setFileError(t('plateSolving.readError') || 'Failed to read file');
          setIsLoading(false);
        };
        reader.readAsDataURL(processedFile);
      } else {
        setCapturedImage(null);
        setLoadingProgress(100);
        setIsLoading(false);
      }
    } catch (error) {
      setFileError(
        error instanceof Error 
          ? error.message 
          : t('plateSolving.processingError') || 'Failed to process image'
      );
      setIsLoading(false);
    }
  }, [validateFile, compressionEnabled, compressionQuality, t]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      setCameraError(
        error instanceof Error 
          ? error.message 
          : t('plateSolving.cameraError') || 'Failed to access camera'
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const resetState = useCallback(() => {
    setCapturedImage(null);
    setCapturedFile(null);
    setCameraError(null);
    setFileError(null);
    setImageMetadata(null);
    setLoadingProgress(0);
    stopCamera();
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setCapturedFile(file);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        setImageMetadata({
          width: video.videoWidth,
          height: video.videoHeight,
          size: blob.size,
          type: 'image/jpeg',
          name: file.name,
        });
        stopCamera();
      }
    }, 'image/jpeg', COMPRESSION_QUALITY);
  }, [stopCamera]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleConfirm = useCallback(() => {
    if (capturedFile) {
      onImageCapture(capturedFile, imageMetadata || undefined);
      setOpen(false);
      resetState();
    }
  }, [capturedFile, imageMetadata, onImageCapture, resetState]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  }, [resetState]);

  const switchToCamera = useCallback(() => {
    setMode('camera');
    resetState();
    startCamera();
  }, [startCamera, resetState]);

  const switchToUpload = useCallback(() => {
    setMode('upload');
    resetState();
  }, [resetState]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            <Camera className="h-4 w-4 mr-2" />
            {t('plateSolving.captureImage') || 'Capture Image'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {t('plateSolving.imageCapture') || 'Image Capture'}
          </DialogTitle>
          <DialogDescription>
            {t('plateSolving.imageCaptureDesc') || 'Upload an image or take a photo for plate solving'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => v === 'camera' ? switchToCamera() : switchToUpload()} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" disabled={isLoading}>
                <Upload className="h-4 w-4 mr-2" />
                {t('plateSolving.uploadFile') || 'Upload File'}
              </TabsTrigger>
              <TabsTrigger value="camera" disabled={isLoading}>
                <Camera className="h-4 w-4 mr-2" />
                {t('plateSolving.useCamera') || 'Use Camera'}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div 
            ref={dropZoneRef}
            className={`relative aspect-video bg-muted rounded-lg overflow-hidden border-2 transition-colors ${
              isDragging 
                ? 'border-primary border-dashed bg-primary/5' 
                : 'border-transparent'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="region"
            aria-label={t('plateSolving.dropZone') || 'Image drop zone'}
          >
            {mode === 'camera' && !capturedImage && (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  aria-label={t('plateSolving.cameraPreview') || 'Camera preview'}
                />
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 gap-2">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-destructive text-center px-4 text-sm">{cameraError}</p>
                    <Button variant="outline" size="sm" onClick={startCamera}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('common.retry') || 'Retry'}
                    </Button>
                  </div>
                )}
                {isLoading && !cameraStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </>
            )}

            {mode === 'upload' && !capturedImage && !isLoading && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragging ? 'bg-primary/10' : 'hover:bg-muted/80'
                }`}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label={t('plateSolving.clickToUpload') || 'Click to upload'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {isDragging ? (
                  <>
                    <ImageIcon className="h-12 w-12 text-primary mb-2" />
                    <p className="text-sm font-medium text-primary">
                      {t('plateSolving.dropHere') || 'Drop image here'}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t('plateSolving.clickOrDrag') || 'Click or drag image here'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('plateSolving.supportedFormats') || 'JPEG, PNG, FITS'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('plateSolving.maxSize') || `Max ${maxFileSizeMB}MB`}
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.fits,.fit,.fts"
                  className="hidden"
                  onChange={handleFileSelect}
                  aria-hidden="true"
                />
              </div>
            )}

            {isLoading && mode === 'upload' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="w-48">
                  <Progress value={loadingProgress} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('plateSolving.processing') || 'Processing'}... {Math.round(loadingProgress)}%
                </p>
              </div>
            )}

            {fileError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 gap-2 p-4">
                <Alert variant="destructive" className="max-w-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fileError}</AlertDescription>
                </Alert>
                <Button variant="outline" size="sm" onClick={resetState}>
                  {t('common.retry') || 'Try Again'}
                </Button>
              </div>
            )}

            {capturedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedImage}
                alt={t('plateSolving.capturedImage') || 'Captured image'}
                className="w-full h-full object-contain"
              />
            )}

            {capturedFile && !capturedImage && imageMetadata?.isFits && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <FileImage className="h-16 w-16 text-muted-foreground" />
                <p className="text-sm font-medium">{imageMetadata.name}</p>
                <p className="text-xs text-muted-foreground">
                  FITS - {formatFileSize(imageMetadata.size)}
                </p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          </div>

          {imageMetadata && !fileError && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                <div className="flex items-center gap-3">
                  <span>{imageMetadata.name}</span>
                  {imageMetadata.width > 0 && (
                    <span>{imageMetadata.width} × {imageMetadata.height}</span>
                  )}
                  <span>{formatFileSize(imageMetadata.size)}</span>
                </div>
                {imageMetadata.isFits && (
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
              
              {imageMetadata.fitsData && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                      <span>{t('plateSolving.fitsMetadata') || 'FITS Metadata'}</span>
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 rounded-lg p-3">
                      {imageMetadata.fitsData.wcs && (
                        <>
                          <div className="col-span-2 font-medium text-primary border-b border-primary/20 pb-1 mb-1">
                            {t('plateSolving.wcsInfo') || 'WCS Coordinates'}
                          </div>
                          <div className="text-muted-foreground">{t('coordinates.ra') || 'RA'}:</div>
                          <div className="font-mono">{formatRA(imageMetadata.fitsData.wcs.referenceCoordinates.ra)}</div>
                          <div className="text-muted-foreground">{t('coordinates.dec') || 'Dec'}:</div>
                          <div className="font-mono">{formatDec(imageMetadata.fitsData.wcs.referenceCoordinates.dec)}</div>
                          <div className="text-muted-foreground">{t('plateSolving.pixelScale') || 'Scale'}:</div>
                          <div className="font-mono">{formatPixelScale(imageMetadata.fitsData.wcs.pixelScale)}</div>
                          <div className="text-muted-foreground">{t('plateSolving.rotation') || 'Rotation'}:</div>
                          <div className="font-mono">{imageMetadata.fitsData.wcs.rotation.toFixed(2)}°</div>
                          {imageMetadata.fitsData.wcs.projectionType && (
                            <>
                              <div className="text-muted-foreground">{t('plateSolving.projection') || 'Projection'}:</div>
                              <div className="font-mono">{imageMetadata.fitsData.wcs.projectionType}</div>
                            </>
                          )}
                        </>
                      )}
                      
                      {imageMetadata.fitsData.observation && (
                        <>
                          <div className="col-span-2 font-medium text-primary border-b border-primary/20 pb-1 mb-1 mt-2">
                            {t('plateSolving.observationInfo') || 'Observation Info'}
                          </div>
                          {imageMetadata.fitsData.observation.object && (
                            <>
                              <div className="text-muted-foreground">{t('plateSolving.object') || 'Object'}:</div>
                              <div>{imageMetadata.fitsData.observation.object}</div>
                            </>
                          )}
                          {imageMetadata.fitsData.observation.dateObs && (
                            <>
                              <div className="text-muted-foreground">{t('plateSolving.dateObs') || 'Date'}:</div>
                              <div className="font-mono text-[10px]">{imageMetadata.fitsData.observation.dateObs}</div>
                            </>
                          )}
                          {imageMetadata.fitsData.observation.exptime && (
                            <>
                              <div className="text-muted-foreground">{t('plateSolving.exposure') || 'Exposure'}:</div>
                              <div className="font-mono">{formatExposure(imageMetadata.fitsData.observation.exptime)}</div>
                            </>
                          )}
                          {imageMetadata.fitsData.observation.filter && (
                            <>
                              <div className="text-muted-foreground">{t('plateSolving.filter') || 'Filter'}:</div>
                              <div>{imageMetadata.fitsData.observation.filter}</div>
                            </>
                          )}
                          {imageMetadata.fitsData.observation.telescope && (
                            <>
                              <div className="text-muted-foreground">{t('plateSolving.telescope') || 'Telescope'}:</div>
                              <div className="truncate">{imageMetadata.fitsData.observation.telescope}</div>
                            </>
                          )}
                          {imageMetadata.fitsData.observation.instrument && (
                            <>
                              <div className="text-muted-foreground">{t('plateSolving.instrument') || 'Instrument'}:</div>
                              <div className="truncate">{imageMetadata.fitsData.observation.instrument}</div>
                            </>
                          )}
                        </>
                      )}
                      
                      {imageMetadata.fitsData.image && (
                        <>
                          <div className="col-span-2 font-medium text-primary border-b border-primary/20 pb-1 mb-1 mt-2">
                            {t('plateSolving.imageInfo') || 'Image Info'}
                          </div>
                          <div className="text-muted-foreground">{t('plateSolving.dimensions') || 'Size'}:</div>
                          <div className="font-mono">{imageMetadata.fitsData.image.width} × {imageMetadata.fitsData.image.height}</div>
                          <div className="text-muted-foreground">{t('plateSolving.bitDepth') || 'Bit Depth'}:</div>
                          <div className="font-mono">{Math.abs(imageMetadata.fitsData.image.bitpix)}-bit</div>
                        </>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Maximize2 className={`h-4 w-4 mr-2 transition-transform ${showAdvanced ? 'rotate-45' : ''}`} />
              {t('plateSolving.advancedOptions') || 'Advanced Options'}
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="compression" className="text-sm">
                  {t('plateSolving.enableCompression') || 'Enable Compression'}
                </Label>
                <Switch
                  id="compression"
                  checked={compressionEnabled}
                  onCheckedChange={setCompressionEnabled}
                />
              </div>
              {compressionEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      {t('plateSolving.quality') || 'Quality'}: {compressionQuality}%
                    </Label>
                  </div>
                  <Slider
                    value={[compressionQuality]}
                    onValueChange={([v]) => setCompressionQuality(v)}
                    min={50}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {mode === 'camera' && !capturedImage && cameraStream && (
              <Button onClick={capturePhoto} className="flex-1" disabled={isLoading}>
                <Camera className="h-4 w-4 mr-2" />
                {t('plateSolving.takePhoto') || 'Take Photo'}
              </Button>
            )}

            {(capturedImage || (capturedFile && imageMetadata?.isFits)) && (
              <>
                <Button variant="outline" onClick={resetState} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('plateSolving.retake') || 'Retake'}
                </Button>
                <Button onClick={handleConfirm} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  {t('plateSolving.useImage') || 'Use This Image'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
