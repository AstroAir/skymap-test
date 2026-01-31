'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTargetListStore } from '@/lib/stores/target-list-store';

interface SidePanelProps {
  children?: React.ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
}

interface ToolButtonProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  disabled?: boolean;
}

function ToolButton({ icon: Icon, label, active, badge, onClick, disabled }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 relative transition-all",
            active ? "bg-primary/20 text-primary" : "text-foreground/70 hover:text-foreground hover:bg-accent",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-5 w-5" />
          {badge !== undefined && badge > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 min-w-4 p-0 text-[9px] flex items-center justify-center"
            >
              {badge > 99 ? '99+' : badge}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function SidePanel({ children, className, defaultCollapsed = false }: SidePanelProps) {
  const t = useTranslations();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  // Store state
  const targets = useTargetListStore((state) => state.targets);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return (
    <div className={cn(
      "hidden sm:flex flex-col items-center gap-2",
      "absolute right-3 top-1/2 -translate-y-1/2",
      "pointer-events-auto",
      className
    )}>
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 bg-card/60 backdrop-blur-md border border-border/50 rounded-full"
        onClick={toggleCollapsed}
      >
        {collapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </Button>

      {/* Main Panel */}
      <div className={cn(
        "bg-card/80 backdrop-blur-md rounded-lg border border-border/50 overflow-hidden",
        "transition-all duration-300 ease-out",
        collapsed ? "w-0 opacity-0 p-0 scale-95" : "w-[72px] opacity-100 scale-100"
      )}>
        {!collapsed && (
          <ScrollArea className="max-h-[60vh]">
            <div className="p-1.5 space-y-1">
              {children}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Quick Stats Badge (shown when collapsed) */}
      {collapsed && targets.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-card/80 backdrop-blur-md rounded-full border border-border/50 px-2 py-1">
              <Badge variant="secondary" className="text-[10px]">
                {targets.length}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            {t('sidePanel.targetsInList', { count: targets.length })}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// Pre-built tool sections for common use
export function ZoomSection({ 
  currentFov, 
  onZoomIn, 
  onZoomOut, 
  onFovChange: _onFovChange 
}: { 
  currentFov: number; 
  onZoomIn: () => void; 
  onZoomOut: () => void;
  onFovChange?: (fov: number) => void;
}) {
  const t = useTranslations();
  
  return (
    <div className="space-y-1">
      <div className="text-[10px] text-muted-foreground text-center px-1">
        {t('zoom.fov')}
      </div>
      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onZoomIn}
        >
          <span className="text-lg">+</span>
        </Button>
        <div className="text-xs font-mono bg-muted/50 rounded px-2 py-1 min-w-[48px] text-center">
          {currentFov < 1 ? currentFov.toFixed(2) : currentFov.toFixed(1)}°
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onZoomOut}
        >
          <span className="text-lg">−</span>
        </Button>
      </div>
    </div>
  );
}

export function ToolSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="space-y-1">
      {title && (
        <div className="text-[10px] text-muted-foreground text-center px-1">
          {title}
        </div>
      )}
      <div className="flex flex-col items-center gap-0.5">
        {children}
      </div>
    </div>
  );
}

export { ToolButton };
