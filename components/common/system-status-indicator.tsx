"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Wifi, WifiOff, HardDrive, Activity, Circle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSystemStats } from "@/lib/hooks/use-system-stats";

interface SystemStatusIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function SystemStatusIndicator({ 
  className, 
  compact = false 
}: SystemStatusIndicatorProps) {
  const t = useTranslations("system");
  const { online, memoryUsage, fps, isTauriEnv } = useSystemStats();

  const getConnectionColor = useCallback(() => {
    if (!online) return "text-destructive";
    return "text-green-500";
  }, [online]);

  const getFpsColor = useCallback(() => {
    if (!fps) return "text-muted-foreground";
    if (fps >= 50) return "text-green-500";
    if (fps >= 30) return "text-yellow-500";
    return "text-destructive";
  }, [fps]);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {online ? (
                <Wifi className={cn("h-3 w-3", getConnectionColor())} />
              ) : (
                <WifiOff className={cn("h-3 w-3", getConnectionColor())} />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{online ? t("online") : t("offline")}</p>
          </TooltipContent>
        </Tooltip>

        {/* FPS */}
        {fps !== null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-[10px] font-mono", getFpsColor())}>
                {fps}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{t("fps")}: {fps}</p>
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
            {online ? (
              <Wifi className={cn("h-3 w-3", getConnectionColor())} />
            ) : (
              <WifiOff className={cn("h-3 w-3", getConnectionColor())} />
            )}
            <span className={cn("hidden sm:inline", online ? "text-muted-foreground" : "text-destructive")}>
              {online ? t("online") : t("offline")}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{online ? t("connectionOnline") : t("connectionOffline")}</p>
        </TooltipContent>
      </Tooltip>

      {/* Memory Usage */}
      {memoryUsage !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              <span className="font-mono">{memoryUsage}MB</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t("memoryUsage")}: {memoryUsage}MB</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* FPS Counter */}
      {fps !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Activity className={cn("h-3 w-3", getFpsColor())} />
              <span className={cn("font-mono", getFpsColor())}>{fps} FPS</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>
              {t("fps")}: {fps}
              {fps >= 50 && ` - ${t("excellent")}`}
              {fps >= 30 && fps < 50 && ` - ${t("good")}`}
              {fps < 30 && ` - ${t("low")}`}
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
