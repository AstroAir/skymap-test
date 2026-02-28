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
  switchProps?: Omit<React.ComponentProps<typeof Switch>, 'checked' | 'onCheckedChange' | 'id'> & Record<string, unknown>;
}

export function SwitchItem({
  label,
  description,
  checked,
  onCheckedChange,
  id,
  className,
  switchProps,
}: SwitchItemProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="space-y-0.5">
        <span className="text-sm">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} {...switchProps} />
    </div>
  );
}
