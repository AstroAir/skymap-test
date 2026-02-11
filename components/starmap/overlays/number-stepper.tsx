'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumberStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  label,
}: NumberStepperProps) {
  return (
    <div className="space-y-1">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
        >
          -
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value) || min;
            onChange(Math.max(min, Math.min(max, v)));
          }}
          className="h-7 w-12 text-center"
          min={min}
          max={max}
          step={step}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
        >
          +
        </Button>
      </div>
    </div>
  );
}
