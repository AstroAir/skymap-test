'use client';

import { cn } from '@/lib/utils';

interface StatCardProps {
  value: string | number;
  label: string;
  valueClassName?: string;
  className?: string;
}

export function StatCard({
  value,
  label,
  valueClassName,
  className,
}: StatCardProps) {
  return (
    <div className={cn('p-2 rounded-lg bg-muted/50 text-center', className)}>
      <div className={cn('text-2xl font-bold text-primary', valueClassName)}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
