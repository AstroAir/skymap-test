import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MockPlanningUI() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-background to-muted/50 p-4 flex gap-3">
      {/* Mock sidebar */}
      <div className="w-1/3 space-y-2">
        <div className="text-xs font-medium text-foreground/80 mb-2 flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>Tonight&apos;s Plan</span>
        </div>
        {['M42 Orion Nebula', 'NGC 7000 N.America', 'M31 Andromeda'].map((name, i) => (
          <div key={i} className={cn(
            'rounded-md p-2 text-[10px] border transition-colors',
            i === 0 ? 'bg-primary/10 border-primary/30 text-foreground' : 'bg-muted/30 border-border/50 text-muted-foreground'
          )}>
            <div className="font-medium">{name}</div>
            <div className="text-muted-foreground/60 mt-0.5">{`${20 + i * 2}:00 - ${21 + i * 2}:30`}</div>
          </div>
        ))}
      </div>
      {/* Mock chart area */}
      <div className="flex-1 bg-muted/20 rounded-lg border border-border/30 p-3 flex flex-col">
        <div className="text-xs font-medium text-foreground/70 mb-2">Altitude Chart</div>
        <div className="flex-1 relative">
          <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,70 Q30,60 60,40 T120,20 T200,50" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
            <path d="M0,75 Q50,50 100,35 T200,60" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1.5" opacity="0.4" />
            <line x1="0" y1="75" x2="200" y2="75" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1">
          <span>18:00</span><span>21:00</span><span>00:00</span><span>03:00</span><span>06:00</span>
        </div>
      </div>
    </div>
  );
}
