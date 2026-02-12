import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  className?: string;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  message,
  className,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-8 text-muted-foreground', className)}>
      <Icon className={cn('h-8 w-8 mx-auto mb-2 opacity-50', iconClassName)} />
      <p className="text-sm">{message}</p>
    </div>
  );
}
