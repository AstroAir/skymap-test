"use client";

import { useEffect, useState, useCallback } from "react";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
  isWindowMaximized,
  isTauri,
} from "@/lib/tauri/app-control-api";

interface WindowControlsProps {
  className?: string;
  variant?: "default" | "transparent";
}

export function WindowControls({ className, variant = "default" }: WindowControlsProps) {
  const t = useTranslations("titlebar");
  const [isTauriEnv, setIsTauriEnv] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkTauri = async () => {
      if (isTauri()) {
        setIsTauriEnv(true);
        try {
          const maximized = await isWindowMaximized();
          setIsMaximized(maximized);
        } catch (error) {
          console.error("Failed to get window state:", error);
        }
      }
    };
    checkTauri();
  }, []);

  useEffect(() => {
    if (!isTauriEnv) return;

    const handleResize = async () => {
      try {
        const maximized = await isWindowMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error("Failed to check maximized state:", error);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isTauriEnv]);

  const handleMinimize = useCallback(async () => {
    try {
      await minimizeWindow();
    } catch (error) {
      console.error("Failed to minimize:", error);
    }
  }, []);

  const handleMaximize = useCallback(async () => {
    try {
      await toggleMaximizeWindow();
      setIsMaximized((prev) => !prev);
    } catch (error) {
      console.error("Failed to toggle maximize:", error);
    }
  }, []);

  const handleClose = useCallback(async () => {
    try {
      await closeWindow();
    } catch (error) {
      console.error("Failed to close:", error);
    }
  }, []);

  if (!isTauriEnv) {
    return null;
  }

  const baseButtonClass = variant === "transparent"
    ? "flex h-8 w-10 items-center justify-center transition-colors"
    : "flex h-8 w-10 items-center justify-center transition-colors bg-black/60 backdrop-blur-sm";

  const hoverClass = variant === "transparent"
    ? "hover:bg-white/10"
    : "hover:bg-black/80";

  return (
    <div className={cn("flex items-center", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleMinimize}
            className={cn(baseButtonClass, hoverClass, "rounded-l-md")}
            aria-label="Minimize"
          >
            <Minus className="h-4 w-4 text-white/70" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t("minimize")}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleMaximize}
            className={cn(baseButtonClass, hoverClass)}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <Square className="h-3.5 w-3.5 text-white/70" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 text-white/70" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isMaximized ? t("restore") : t("maximize")}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClose}
            className={cn(
              baseButtonClass,
              "rounded-r-md hover:bg-destructive hover:text-destructive-foreground"
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-white/70 hover:text-white" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t("close")}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
