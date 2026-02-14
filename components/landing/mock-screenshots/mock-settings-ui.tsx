import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MockSettingsUI() {
  return (
    <div className="w-full h-full bg-background p-4 flex gap-3">
      {/* Mock sidebar nav */}
      <div className="w-1/4 space-y-1">
        {['General', 'Location', 'Equipment', 'Display', 'Cache'].map((item, i) => (
          <div key={i} className={cn(
            'text-[10px] px-2 py-1.5 rounded-md transition-colors',
            i === 2 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'
          )}>
            {item}
          </div>
        ))}
      </div>
      {/* Mock settings content */}
      <div className="flex-1 space-y-3">
        <div className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
          <Settings className="h-3 w-3" />
          <span>Equipment Profiles</span>
        </div>
        {['Telescope: RedCat 51 (250mm f/4.9)', 'Camera: ZWO ASI2600MC Pro', 'Filter: Optolong L-eXtreme'].map((item, i) => (
          <div key={i} className="bg-muted/30 rounded-md p-2 border border-border/30">
            <div className="text-[10px] text-foreground/70">{item}</div>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <div className="text-[9px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">Save</div>
          <div className="text-[9px] px-2 py-1 rounded bg-muted/50 text-muted-foreground border border-border/30">Reset</div>
        </div>
      </div>
    </div>
  );
}
