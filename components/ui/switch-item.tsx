'use client';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SwitchItemProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

export function SwitchItem({
  label,
  description,
  checked,
  onCheckedChange,
  id,
  className,
}: SwitchItemProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="space-y-0.5">
        <span className="text-sm">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
