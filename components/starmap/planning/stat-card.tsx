'use client';

import { Card, CardContent } from '@/components/ui/card';
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
    <Card className={cn('bg-muted/50 text-center', className)}>
      <CardContent className="p-2">
        <div className={cn('text-2xl font-bold text-primary', valueClassName)}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
