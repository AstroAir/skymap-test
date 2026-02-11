'use client';

import { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  ExternalLink,
  ImageOff,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ObjectImage } from '@/lib/services/object-info-service';

interface ObjectImageGalleryProps {
  images: ObjectImage[];
  objectName: string;
  className?: string;
}

interface ImageState {
  loaded: boolean;
  error: boolean;
}

export const ObjectImageGallery = memo(function ObjectImageGallery({
  images,
  objectName,
  className,
}: ObjectImageGalleryProps) {
  const t = useTranslations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageStates, setImageStates] = useState<Record<number, ImageState>>({});
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentImage = images[currentIndex];
  
  // Create a stable key from images array to detect changes
  const imagesKey = useMemo(() => images.map(img => img.url).join('|'), [images]);
  
  // Track previous images key to reset state when images change
  const prevImagesKeyRef = useRef(imagesKey);
  
  // Reset state when images array changes
  // Using flushSync pattern via scheduling to avoid lint warning while ensuring reset
  useEffect(() => {
    // Only reset if images actually changed (not on initial mount)
    if (prevImagesKeyRef.current !== imagesKey) {
      prevImagesKeyRef.current = imagesKey;
      // Schedule state reset for next tick to avoid synchronous setState in effect
      queueMicrotask(() => {
        setCurrentIndex(0);
        setImageStates({});
      });
    }
  }, [imagesKey]);

  const handleImageLoad = useCallback((index: number) => {
    setImageStates(prev => ({
      ...prev,
      [index]: { loaded: true, error: false }
    }));
  }, []);

  const handleImageError = useCallback((index: number) => {
    setImageStates(prev => ({
      ...prev,
      [index]: { loaded: true, error: true }
    }));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Touch/mouse drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setTranslateX(0);
  }, []);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setTranslateX(diff);
  }, [isDragging, startX]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 50;
    if (translateX > threshold) {
      goToPrev();
    } else if (translateX < -threshold) {
      goToNext();
    }
    setTranslateX(0);
  }, [isDragging, translateX, goToPrev, goToNext]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Preload adjacent images for smoother switching
  useEffect(() => {
    if (!images.length) return;
    const preloadIndices = [currentIndex - 1, currentIndex + 1]
      .filter(i => i >= 0 && i < images.length);
    preloadIndices.forEach(i => {
      const img = new Image();
      img.src = images[i].url;
    });
  }, [currentIndex, images]);

  // Keyboard navigation
  useEffect(() => {
    if (!fullscreenOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        setFullscreenOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenOpen, goToPrev, goToNext]);

  if (!images.length) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-muted/30 rounded-lg',
        'h-48',
        className
      )}>
        <div className="text-center text-muted-foreground">
          <ImageOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">{t('objectDetail.noImages')}</p>
        </div>
      </div>
    );
  }

  const imageState = imageStates[currentIndex];
  const isLoading = !imageState?.loaded;
  const hasError = imageState?.error;

  return (
    <>
      <div className={cn('relative group', className)}>
        {/* Main Image Container */}
        <div 
          ref={containerRef}
          className="relative h-48 sm:h-56 md:h-64 bg-black/50 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-x"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Image */}
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-100"
            style={{ 
              transform: isDragging ? `translateX(${translateX}px)` : 'translateX(0)',
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {hasError ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageOff className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-xs">{t('objectDetail.imageLoadError')}</p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage.url}
                alt={currentImage.title || objectName}
                className={cn(
                  'max-w-full max-h-full object-contain transition-opacity duration-300',
                  isLoading ? 'opacity-0' : 'opacity-100'
                )}
                onLoad={() => handleImageLoad(currentIndex)}
                onError={() => handleImageError(currentIndex)}
                draggable={false}
              />
            )}
          </div>

          {/* Navigation Arrows - Always visible on mobile, hover on desktop */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-8 sm:w-8 bg-black/50 hover:bg-black/70 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-target"
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              >
                <ChevronLeft className="h-6 w-6 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-8 sm:w-8 bg-black/50 hover:bg-black/70 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-target"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="h-6 w-6 sm:h-5 sm:w-5" />
              </Button>
            </>
          )}

          {/* Fullscreen Button - Always visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-9 w-9 sm:h-7 sm:w-7 bg-black/50 hover:bg-black/70 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-target"
            onClick={() => setFullscreenOpen(true)}
          >
            <Maximize2 className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>

          {/* Dots Indicator - Larger on mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  aria-label={t('objectDetail.goToImage', { index: index + 1 })}
                  className={cn(
                    'w-3 h-3 sm:w-2 sm:h-2 rounded-full transition-all touch-target',
                    index === currentIndex 
                      ? 'bg-white scale-110' 
                      : 'bg-white/50 hover:bg-white/70'
                  )}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Image Info */}
        <div className="mt-2 px-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground truncate flex-1 mr-2">
              {currentImage.source}
            </span>
            <span className="text-muted-foreground shrink-0">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
          {currentImage.credit && (
            <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
              {currentImage.credit}
            </p>
          )}
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-0">
          <DialogTitle className="sr-only">{currentImage?.title || objectName}</DialogTitle>
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 h-10 w-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setFullscreenOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-black/50 hover:bg-black/70 text-white"
                  onClick={goToPrev}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-black/50 hover:bg-black/70 text-white"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image */}
            {hasError ? (
              <div className="flex flex-col items-center text-white/70">
                <ImageOff className="h-16 w-16 mb-4" />
                <p>{t('objectDetail.imageLoadError')}</p>
              </div>
            ) : (
              <>
                {/* Show loading spinner until image loads in fullscreen */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-white/70 animate-spin" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage.url}
                  alt={currentImage.title || objectName}
                  className={cn(
                    "max-w-full max-h-full object-contain transition-opacity",
                    isLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => handleImageLoad(currentIndex)}
                  onError={() => handleImageError(currentIndex)}
                />
              </>
            )}

            {/* Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="font-medium">{currentImage.title || objectName}</p>
                  <p className="text-sm text-white/70">{currentImage.credit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/70">
                    {currentIndex + 1} / {images.length}
                  </span>
                  <a
                    href={currentImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Dots Indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    aria-label={t('objectDetail.goToImage', { index: index + 1 })}
                    className={cn(
                      'w-3 h-3 rounded-full transition-all',
                      index === currentIndex 
                        ? 'bg-white scale-110' 
                        : 'bg-white/40 hover:bg-white/60'
                    )}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});


