"use client";

import { useEffect, useState, useCallback } from "react";
import { Minus, Square, X, Maximize2, RotateCw, Power, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { createLogger } from "@/lib/logger";

const logger = createLogger('titlebar');

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  restartApp,
  quitApp,
  reloadWebview,
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
  isWindowMaximized,
  isTauri,
} from "@/lib/tauri/app-control-api";

interface TitleBarProps {
  className?: string;
}

export function TitleBar({ className }: TitleBarProps) {
  const t = useTranslations("titlebar");
  const [isTauriEnv, setIsTauriEnv] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if running in Tauri environment
    const checkTauri = async () => {
      if (isTauri()) {
        setIsTauriEnv(true);
        // Check initial maximized state
        try {
          const maximized = await isWindowMaximized();
          setIsMaximized(maximized);
        } catch (error) {
          logger.error('Failed to get window state', error);
        }
      }
    };
    checkTauri();
  }, []);

  useEffect(() => {
    if (!isTauriEnv) return;

    // Listen for window resize to update maximized state
    const handleResize = async () => {
      try {
        const maximized = await isWindowMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        logger.error('Failed to check maximized state', error);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isTauriEnv]);

  // Window control handlers - defined before useEffect that uses them
  const handleMinimize = useCallback(async () => {
    try {
      await minimizeWindow();
    } catch (error) {
      logger.error('Failed to minimize', error);
    }
  }, []);

  const handleMaximize = useCallback(async () => {
    try {
      await toggleMaximizeWindow();
      setIsMaximized((prev) => !prev);
    } catch (error) {
      logger.error('Failed to toggle maximize', error);
    }
  }, []);

  const handleClose = useCallback(async () => {
    try {
      await closeWindow();
    } catch (error) {
      logger.error('Failed to close', error);
    }
  }, []);

  const handleQuit = useCallback(async () => {
    try {
      await quitApp();
    } catch (error) {
      logger.error('Failed to quit', error);
    }
  }, []);

  const handleRestart = useCallback(async () => {
    try {
      await restartApp();
    } catch (error) {
      logger.error('Failed to restart', error);
    }
  }, []);

  const handleReload = useCallback(async () => {
    try {
      await reloadWebview();
    } catch (error) {
      logger.error('Failed to reload', error);
    }
  }, []);

  const handleDoubleClick = useCallback(async () => {
    await handleMaximize();
  }, [handleMaximize]);

  // Global keyboard shortcuts
  useEffect(() => {
    if (!isTauriEnv) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ctrl+Q or Cmd+Q: Quit
      if ((e.ctrlKey || e.metaKey) && e.key === "q") {
        e.preventDefault();
        await handleQuit();
      }
      // Ctrl+Shift+R or Cmd+Shift+R: Restart
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "R") {
        e.preventDefault();
        await handleRestart();
      }
      // F5 or Ctrl+R: Reload (without Shift)
      if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "r")) {
        e.preventDefault();
        await handleReload();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTauriEnv, handleQuit, handleRestart, handleReload]);

  // Only render in Tauri environment
  if (!isTauriEnv) {
    return null;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "titlebar fixed top-0 left-0 right-0 z-[9999] flex h-8 items-center justify-between",
            "bg-card/95 backdrop-blur-md border-b border-border/50",
            "select-none",
            className
          )}
        >
          {/* Drag region with app title */}
          <div
            data-tauri-drag-region
            className="flex h-full flex-1 items-center gap-2 px-3"
            onDoubleClick={handleDoubleClick}
          >
            {/* App icon */}
            <svg
              className="h-4 w-4 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            {/* App title */}
            <span className="hidden sm:inline text-sm font-medium text-foreground/80">SkyMap</span>
          </div>

          {/* Window controls */}
          <div className="flex h-full items-center">
            {/* Minimize button */}
            <button
              onClick={handleMinimize}
              className="titlebar-button flex h-full w-12 items-center justify-center transition-colors hover:bg-muted"
              title={t("minimize")}
              aria-label={t("minimize")}
            >
              <Minus className="h-4 w-4 text-foreground/70" />
            </button>

            {/* Maximize/Restore button */}
            <button
              onClick={handleMaximize}
              className="titlebar-button flex h-full w-12 items-center justify-center transition-colors hover:bg-muted"
              title={isMaximized ? t("restore") : t("maximize")}
              aria-label={isMaximized ? t("restore") : t("maximize")}
            >
              {isMaximized ? (
                <Square className="h-3.5 w-3.5 text-foreground/70" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5 text-foreground/70" />
              )}
            </button>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="titlebar-button flex h-full w-12 items-center justify-center transition-colors hover:bg-destructive hover:text-destructive-foreground"
              title={t("close")}
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleReload}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("reload")}
          <ContextMenuShortcut>F5</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleRestart}>
          <RotateCw className="mr-2 h-4 w-4" />
          {t("restart")}
          <ContextMenuShortcut>Ctrl+Shift+R</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleMinimize}>
          <Minus className="mr-2 h-4 w-4" />
          {t("minimize")}
        </ContextMenuItem>

        <ContextMenuItem onClick={handleMaximize}>
          {isMaximized ? (
            <Square className="mr-2 h-4 w-4" />
          ) : (
            <Maximize2 className="mr-2 h-4 w-4" />
          )}
          {isMaximized ? t("restore") : t("maximize")}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleClose}>
          <X className="mr-2 h-4 w-4" />
          {t("close")}
        </ContextMenuItem>

        <ContextMenuItem onClick={handleQuit} variant="destructive">
          <Power className="mr-2 h-4 w-4" />
          {t("quit")}
          <ContextMenuShortcut>Ctrl+Q</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
