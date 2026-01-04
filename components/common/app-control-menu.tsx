"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Minus,
  Square,
  X,
  Maximize2,
  RotateCw,
  Power,
  RefreshCw,
  MoreVertical,
  Fullscreen,
  Minimize2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
  isWindowMaximized,
  toggleFullscreen,
  restartApp,
  quitApp,
  reloadWebview,
  isTauri,
} from "@/lib/tauri/app-control-api";

interface AppControlMenuProps {
  className?: string;
  variant?: "dropdown" | "inline";
}

export function AppControlMenu({ className, variant = "dropdown" }: AppControlMenuProps) {
  const t = useTranslations("appControl");
  const [isTauriEnv, setIsTauriEnv] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    
    // Check fullscreen state for web environment
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener("fullscreenchange", checkFullscreen);
    checkFullscreen();
    
    return () => {
      document.removeEventListener("fullscreenchange", checkFullscreen);
    };
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

  const handleRestart = useCallback(async () => {
    try {
      await restartApp();
    } catch (error) {
      console.error("Failed to restart:", error);
    }
  }, []);

  const handleQuit = useCallback(async () => {
    try {
      await quitApp();
    } catch (error) {
      console.error("Failed to quit:", error);
    }
  }, []);

  const handleReload = useCallback(async () => {
    try {
      await reloadWebview();
    } catch (error) {
      console.error("Failed to reload:", error);
    }
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      await toggleFullscreen();
      setIsFullscreen((prev) => !prev);
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
  }, []);

  // Web environment: Reload page
  const handleWebReload = useCallback(() => {
    window.location.reload();
  }, []);

  // Inline variant for toolbar - shows different controls based on environment
  if (variant === "inline") {
    // Web environment: Show reload and fullscreen toggle
    if (!isTauriEnv) {
      return (
        <div className={cn("flex items-center gap-0.5", className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent"
                onClick={handleWebReload}
                aria-label={t("reload")}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t("reload")}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent"
                onClick={handleToggleFullscreen}
                aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Fullscreen className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isFullscreen ? t("exitFullscreen") : t("fullscreen")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }

    // Tauri environment: Show essential window controls
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent"
              onClick={handleMaximize}
              aria-label={isMaximized ? t("restore") : t("maximize")}
            >
              {isMaximized ? (
                <Copy className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{isMaximized ? t("restore") : t("maximize")}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Fullscreen className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{isFullscreen ? t("exitFullscreen") : t("fullscreen")}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent"
              onClick={handleClose}
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("close")}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground/80 hover:text-destructive hover:bg-destructive/10"
              onClick={handleQuit}
              aria-label={t("quit")}
            >
              <Power className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("quit")}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Dropdown variant - shows different menu based on environment
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-9 w-9", className)}
              aria-label={t("appControls")}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t("appControls")}</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        {/* Common controls for both environments */}
        <DropdownMenuItem onClick={isTauriEnv ? handleReload : handleWebReload}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("reload")}
        </DropdownMenuItem>
        
        {/* Tauri-specific controls */}
        {isTauriEnv && (
          <>
            <DropdownMenuItem onClick={handleRestart}>
              <RotateCw className="mr-2 h-4 w-4" />
              {t("restart")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMinimize}>
              <Minus className="mr-2 h-4 w-4" />
              {t("minimize")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMaximize}>
              {isMaximized ? (
                <Copy className="mr-2 h-4 w-4" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              {isMaximized ? t("restore") : t("maximize")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              {t("close")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleQuit}
              className="text-destructive focus:text-destructive"
            >
              <Power className="mr-2 h-4 w-4" />
              {t("quit")}
            </DropdownMenuItem>
          </>
        )}
        
        {/* Web-specific controls */}
        {!isTauriEnv && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="mr-2 h-4 w-4" />
              ) : (
                <Maximize2 className="mr-2 h-4 w-4" />
              )}
              {isFullscreen ? t("exitFullscreen") : t("fullscreen")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
