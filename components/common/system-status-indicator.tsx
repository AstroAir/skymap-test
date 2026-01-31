"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Wifi, WifiOff, HardDrive, Activity, Circle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { isTauri } from "@/lib/tauri/app-control-api";

interface SystemStatusIndicatorProps {
  className?: string;
  compact?: boolean;
}

interface SystemStats {
  online: boolean;
  memoryUsage: number | null;
  fps: number | null;
}

export function SystemStatusIndicator({ 
  className, 
  compact = false 
}: SystemStatusIndicatorProps) {
  const t = useTranslations("system");
  const [stats, setStats] = useState<SystemStats>({
    online: true, // Default to true for SSR, sync actual value in useEffect
    memoryUsage: null,
    fps: null,
  });
  const [isTauriEnv, setIsTauriEnv] = useState(false);

  // FPS tracking state is managed inside the effect

  // Update FPS
  useEffect(() => {
    let animationId: number;
    let frames = 0;
    let lastTime = Date.now();

    const updateFps = () => {
      frames++;
      const now = Date.now();
      
      if (now - lastTime >= 1000) {
        setStats(prev => ({ ...prev, fps: frames }));
        frames = 0;
        lastTime = now;
      }
      
      animationId = requestAnimationFrame(updateFps);
    };

    animationId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Check online status
  useEffect(() => {
    // Sync actual online status after hydration
    setStats(prev => ({ ...prev, online: navigator.onLine }));

    const handleOnline = () => setStats(prev => ({ ...prev, online: true }));
    const handleOffline = () => setStats(prev => ({ ...prev, online: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check memory usage (if available)
  useEffect(() => {
    setIsTauriEnv(isTauri());

    const updateMemory = () => {
      // @ts-expect-error - performance.memory is non-standard but available in Chrome/Electron
      if (performance.memory) {
        // @ts-expect-error - usedJSHeapSize is Chrome-specific
        const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        setStats(prev => ({ ...prev, memoryUsage: usedMB }));
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  const getConnectionColor = useCallback(() => {
    if (!stats.online) return "text-destructive";
    return "text-green-500";
  }, [stats.online]);

  const getFpsColor = useCallback(() => {
    if (!stats.fps) return "text-muted-foreground";
    if (stats.fps >= 50) return "text-green-500";
    if (stats.fps >= 30) return "text-yellow-500";
    return "text-destructive";
  }, [stats.fps]);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {stats.online ? (
                <Wifi className={cn("h-3 w-3", getConnectionColor())} />
              ) : (
                <WifiOff className={cn("h-3 w-3", getConnectionColor())} />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{stats.online ? t("online") : t("offline")}</p>
          </TooltipContent>
        </Tooltip>

        {/* FPS */}
        {stats.fps !== null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-[10px] font-mono", getFpsColor())}>
                {stats.fps}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{t("fps")}: {stats.fps}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 text-[10px] sm:text-xs", className)}>
      {/* Connection Status */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {stats.online ? (
              <Wifi className={cn("h-3 w-3", getConnectionColor())} />
            ) : (
              <WifiOff className={cn("h-3 w-3", getConnectionColor())} />
            )}
            <span className={cn("hidden sm:inline", stats.online ? "text-muted-foreground" : "text-destructive")}>
              {stats.online ? t("online") : t("offline")}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{stats.online ? t("connectionOnline") : t("connectionOffline")}</p>
        </TooltipContent>
      </Tooltip>

      {/* Memory Usage */}
      {stats.memoryUsage !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              <span className="font-mono">{stats.memoryUsage}MB</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t("memoryUsage")}: {stats.memoryUsage}MB</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* FPS Counter */}
      {stats.fps !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Activity className={cn("h-3 w-3", getFpsColor())} />
              <span className={cn("font-mono", getFpsColor())}>{stats.fps} FPS</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>
              {t("fps")}: {stats.fps}
              {stats.fps >= 50 && ` - ${t("excellent")}`}
              {stats.fps >= 30 && stats.fps < 50 && ` - ${t("good")}`}
              {stats.fps < 30 && ` - ${t("low")}`}
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Desktop indicator */}
      {isTauriEnv && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Circle className="h-2 w-2 fill-primary text-primary" />
              <span className="hidden sm:inline">{t("desktop")}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t("desktopApp")}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export default SystemStatusIndicator;
