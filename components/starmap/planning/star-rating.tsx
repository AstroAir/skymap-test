'use client';

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'sm',
  className,
}: StarRatingProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-5 w-5';
  const btnSize = size === 'sm' ? '' : 'h-8 w-8';

  if (onChange) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
          <Button
            key={i}
            variant="ghost"
            size="icon"
            className={btnSize}
            onClick={() => onChange(i)}
          >
            <Star
              className={cn(
                iconSize,
                i <= value
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
        <Star
          key={i}
          className={cn(
            iconSize,
            i <= value
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-muted-foreground'
          )}
        />
      ))}
    </div>
  );
}
