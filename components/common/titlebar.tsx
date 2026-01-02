"use client";

import { useEffect, useState, useCallback } from "react";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TitleBarProps {
  className?: string;
}

export function TitleBar({ className }: TitleBarProps) {
  const [isTauri, setIsTauri] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if running in Tauri environment
    const checkTauri = async () => {
      if (typeof window !== "undefined" && "__TAURI__" in window) {
        setIsTauri(true);
        // Check initial maximized state
        try {
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          const appWindow = getCurrentWindow();
          const maximized = await appWindow.isMaximized();
          setIsMaximized(maximized);
        } catch (error) {
          console.error("Failed to get window state:", error);
        }
      }
    };
    checkTauri();
  }, []);

  useEffect(() => {
    if (!isTauri) return;

    // Listen for window resize to update maximized state
    const handleResize = async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const appWindow = getCurrentWindow();
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error("Failed to check maximized state:", error);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isTauri]);

  const handleMinimize = useCallback(async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error("Failed to minimize:", error);
    }
  }, []);

  const handleMaximize = useCallback(async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      setIsMaximized((prev) => !prev);
    } catch (error) {
      console.error("Failed to toggle maximize:", error);
    }
  }, []);

  const handleClose = useCallback(async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error("Failed to close:", error);
    }
  }, []);

  const handleDoubleClick = useCallback(async () => {
    await handleMaximize();
  }, [handleMaximize]);

  // Only render in Tauri environment
  if (!isTauri) {
    return null;
  }

  return (
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
        <span className="text-sm font-medium text-foreground/80">SkyMap</span>
      </div>

      {/* Window controls */}
      <div className="flex h-full items-center">
        {/* Minimize button */}
        <button
          onClick={handleMinimize}
          className="titlebar-button flex h-full w-12 items-center justify-center transition-colors hover:bg-muted"
          title="最小化"
          aria-label="Minimize"
        >
          <Minus className="h-4 w-4 text-foreground/70" />
        </button>

        {/* Maximize/Restore button */}
        <button
          onClick={handleMaximize}
          className="titlebar-button flex h-full w-12 items-center justify-center transition-colors hover:bg-muted"
          title={isMaximized ? "还原" : "最大化"}
          aria-label={isMaximized ? "Restore" : "Maximize"}
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
          title="关闭"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
