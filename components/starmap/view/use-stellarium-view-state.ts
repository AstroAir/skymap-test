'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useFramingStore, useMountStore, useEquipmentStore, useMarkerStore } from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useNavigationHistoryStore } from '@/lib/hooks';
import { rad2deg } from '@/lib/astronomy/starmap-utils';
import type { SelectedObjectData, ClickCoords } from '@/lib/core/types';
import type { StellariumCanvasRef } from '../canvas/stellarium-canvas';
import type { StellariumSearchRef } from '../search/stellarium-search';

export function useStellariumViewState() {
  const router = useRouter();
  const t = useTranslations();

  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SelectedObjectData | null>(null);
  const [currentFov, setCurrentFov] = useState(60);
  const [showSessionPanel, setShowSessionPanel] = useState(true);
  const [contextMenuCoords, setContextMenuCoords] = useState<ClickCoords | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | undefined>();
  const [containerBounds, setContainerBounds] = useState<{ width: number; height: number } | undefined>();

  // Context menu state
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Go to coordinates dialog state
  const [goToDialogOpen, setGoToDialogOpen] = useState(false);

  // Object detail drawer state
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Close confirmation dialog state
  const [closeConfirmDialogOpen, setCloseConfirmDialogOpen] = useState(false);

  // Refs
  const canvasRef = useRef<StellariumCanvasRef>(null);
  const searchRef = useRef<StellariumSearchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fovChangeRafRef = useRef<number | null>(null);
  const lastFovRef = useRef(currentFov);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Equipment store - centralized FOV settings
  const fovSimEnabled = useEquipmentStore((state) => state.fovDisplay.enabled);
  const setFovSimEnabled = useEquipmentStore((state) => state.setFOVEnabled);
  const sensorWidth = useEquipmentStore((state) => state.sensorWidth);
  const sensorHeight = useEquipmentStore((state) => state.sensorHeight);
  const focalLength = useEquipmentStore((state) => state.focalLength);
  const rotationAngle = useEquipmentStore((state) => state.rotationAngle);
  const mosaic = useEquipmentStore((state) => state.mosaic);
  const gridType = useEquipmentStore((state) => state.fovDisplay.gridType);
  const setSensorWidth = useEquipmentStore((state) => state.setSensorWidth);
  const setSensorHeight = useEquipmentStore((state) => state.setSensorHeight);
  const setFocalLength = useEquipmentStore((state) => state.setFocalLength);
  const setRotationAngle = useEquipmentStore((state) => state.setRotationAngle);
  const setMosaic = useEquipmentStore((state) => state.setMosaic);
  const setGridType = useEquipmentStore((state) => state.setGridType);

  // Stellarium store
  const stel = useStellariumStore((state) => state.stel);
  const setViewDirectionRaw = useStellariumStore((state) => state.setViewDirection);
  const viewDirection = useStellariumStore((state) => state.viewDirection);
  const updateViewDirection = useStellariumStore((state) => state.updateViewDirection);

  // Safe wrapper that handles null check once
  const safeSetViewDirection = useCallback((ra: number, dec: number) => {
    if (setViewDirectionRaw) {
      setViewDirectionRaw(ra, dec);
    }
  }, [setViewDirectionRaw]);

  // Mount store
  const mountConnected = useMountStore((state) => state.mountInfo.Connected);
  const setProfileInfo = useMountStore((state) => state.setProfileInfo);

  // Framing store
  const setShowFramingModal = useFramingStore((state) => state.setShowFramingModal);
  const setCoordinates = useFramingStore((state) => state.setCoordinates);
  const setSelectedItem = useFramingStore((state) => state.setSelectedItem);

  // Target list store
  const addTarget = useTargetListStore((state) => state.addTarget);

  // Settings store
  const stellariumSettings = useSettingsStore((state) => state.stellarium);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);
  const skipCloseConfirmation = useSettingsStore((state) => state.preferences.skipCloseConfirmation);
  const setPreference = useSettingsStore((state) => state.setPreference);

  // Marker store
  const setPendingMarkerCoords = useMarkerStore((state) => state.setPendingCoords);
  const setEditingMarkerId = useMarkerStore((state) => state.setEditingMarkerId);

  // Navigation history store
  const pushNavigationHistory = useNavigationHistoryStore((state) => state.push);

  // Single centralized view direction polling — updates the store
  useEffect(() => {
    updateViewDirection();
    const interval = setInterval(updateViewDirection, 500);
    return () => clearInterval(interval);
  }, [updateViewDirection]);

  // Derive view center (degrees) from store's viewDirection for bookmarks
  const viewCenterRaDec = useMemo(() => {
    if (!viewDirection) return { ra: 0, dec: 0 };
    return { ra: rad2deg(viewDirection.ra), dec: rad2deg(viewDirection.dec) };
  }, [viewDirection]);

  // Track container bounds via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerBounds({ width, height });
      }
    });

    observer.observe(el);
    // Set initial bounds
    const rect = el.getBoundingClientRect();
    setContainerBounds({ width: rect.width, height: rect.height });

    return () => observer.disconnect();
  }, []);

  // Track last mouse position for info panel placement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        lastMousePosRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle selection change from canvas
  const handleSelectionChange = useCallback((selection: SelectedObjectData | null) => {
    if (selection) {
      setIsSearchOpen(false);
      if (lastMousePosRef.current) {
        setClickPosition(lastMousePosRef.current);
      }
      pushNavigationHistory({
        ra: selection.raDeg,
        dec: selection.decDeg,
        fov: lastFovRef.current,
        name: selection.names[0],
      });
    }
    setSelectedObject(selection);
  }, [pushNavigationHistory]);

  // Handle FOV change with rAF throttling
  const handleFovChange = useCallback((fov: number) => {
    lastFovRef.current = fov;

    if (fovChangeRafRef.current) return;

    fovChangeRafRef.current = requestAnimationFrame(() => {
      setCurrentFov(lastFovRef.current);
      fovChangeRafRef.current = null;
    });
  }, []);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (fovChangeRafRef.current) {
        cancelAnimationFrame(fovChangeRafRef.current);
      }
    };
  }, []);

  // Handle framing coordinates
  const handleSetFramingCoordinates = useCallback((data: {
    ra: number;
    dec: number;
    raString: string;
    decString: string;
    name: string;
  }) => {
    setCoordinates({
      ra: data.ra,
      dec: data.dec,
      raString: data.raString,
      decString: data.decString,
    });
    setSelectedItem({
      Name: data.name,
      RA: data.ra,
      Dec: data.dec,
    });
    setShowFramingModal(true);
  }, [setCoordinates, setSelectedItem, setShowFramingModal]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    canvasRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    canvasRef.current?.zoomOut();
  }, []);

  const handleSetFov = useCallback((fov: number) => {
    canvasRef.current?.setFov(fov);
  }, []);

  // Reset view
  const handleResetView = useCallback(() => {
    canvasRef.current?.setFov(60);
    setRotationAngle(0);
  }, [setRotationAngle]);

  // Location change handler
  const handleLocationChange = useCallback((lat: number, lon: number, alt: number) => {
    const currentProfile = useMountStore.getState().profileInfo;
    setProfileInfo({
      AstrometrySettings: {
        ...currentProfile.AstrometrySettings,
        Latitude: lat,
        Longitude: lon,
        Elevation: alt,
      },
    });
  }, [setProfileInfo]);

  // Context menu handlers
  const handleContextMenuCapture = useCallback((e: React.MouseEvent, coords: { ra: number; dec: number; raStr: string; decStr: string } | null) => {
    e.preventDefault();
    setContextMenuCoords(coords);
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY,
    });
    setContextMenuOpen(false);
    requestAnimationFrame(() => {
      setContextMenuOpen(true);
    });
  }, []);

  // Add to target list
  const handleAddToTargetList = useCallback(() => {
    if (contextMenuCoords) {
      addTarget({
        name: t('actions.defaultTargetName', { coords: contextMenuCoords.raStr }),
        ra: contextMenuCoords.ra,
        dec: contextMenuCoords.dec,
        raString: contextMenuCoords.raStr,
        decString: contextMenuCoords.decStr,
        sensorWidth,
        sensorHeight,
        focalLength,
        rotationAngle,
        mosaic: mosaic.enabled ? mosaic : undefined,
        priority: 'medium',
      });
    } else if (selectedObject) {
      addTarget({
        name: selectedObject.names[0] || t('common.unknown'),
        ra: selectedObject.raDeg,
        dec: selectedObject.decDeg,
        raString: selectedObject.ra,
        decString: selectedObject.dec,
        sensorWidth,
        sensorHeight,
        focalLength,
        rotationAngle,
        mosaic: mosaic.enabled ? mosaic : undefined,
        priority: 'medium',
      });
    }
  }, [contextMenuCoords, selectedObject, addTarget, sensorWidth, sensorHeight, focalLength, rotationAngle, mosaic, t]);

  // Navigate to coords
  const handleNavigateToCoords = useCallback(() => {
    if (contextMenuCoords) {
      safeSetViewDirection(contextMenuCoords.ra, contextMenuCoords.dec);
    }
    setContextMenuOpen(false);
  }, [contextMenuCoords, safeSetViewDirection]);

  // Go to coordinates
  const handleGoToCoordinates = useCallback((ra: number, dec: number) => {
    safeSetViewDirection(ra, dec);
  }, [safeSetViewDirection]);

  // Open go to dialog
  const openGoToDialog = useCallback(() => {
    setContextMenuOpen(false);
    setGoToDialogOpen(true);
  }, []);

  // Close starmap
  const handleCloseStarmapClick = useCallback(() => {
    if (skipCloseConfirmation) {
      router.push('/');
    } else {
      setCloseConfirmDialogOpen(true);
    }
  }, [skipCloseConfirmation, router]);

  // Confirm close
  const handleConfirmClose = useCallback((dontShowAgain: boolean) => {
    if (dontShowAgain) {
      setPreference('skipCloseConfirmation', true);
    }
    setCloseConfirmDialogOpen(false);
    router.push('/');
  }, [setPreference, router]);

  // Toggle search
  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => {
      if (!prev) {
        setSelectedObject(null);
        setTimeout(() => searchRef.current?.focusSearchInput(), 100);
      }
      return !prev;
    });
  }, []);

  // Navigation handler
  const handleNavigate = useCallback((ra: number, dec: number, fov: number) => {
    safeSetViewDirection(ra, dec);
    canvasRef.current?.setFov(fov);
  }, [safeSetViewDirection]);

  // Marker handlers
  const handleMarkerNavigate = useCallback((marker: { ra: number; dec: number }) => {
    safeSetViewDirection(marker.ra, marker.dec);
  }, [safeSetViewDirection]);

  const handleMarkerEdit = useCallback((marker: { id: string }) => {
    setEditingMarkerId(marker.id);
  }, [setEditingMarkerId]);

  return {
    // UI state
    isSearchOpen,
    setIsSearchOpen,
    selectedObject,
    setSelectedObject,
    currentFov,
    showSessionPanel,
    setShowSessionPanel,
    contextMenuCoords,
    clickPosition,
    containerBounds,

    // Context menu state
    contextMenuOpen,
    setContextMenuOpen,
    contextMenuPosition,

    // Dialog states
    goToDialogOpen,
    setGoToDialogOpen,
    detailDrawerOpen,
    setDetailDrawerOpen,
    closeConfirmDialogOpen,
    setCloseConfirmDialogOpen,

    // View center
    viewCenterRaDec,

    // Refs
    canvasRef,
    searchRef,
    containerRef,

    // Equipment settings
    fovSimEnabled,
    setFovSimEnabled,
    sensorWidth,
    sensorHeight,
    focalLength,
    rotationAngle,
    mosaic,
    gridType,
    setSensorWidth,
    setSensorHeight,
    setFocalLength,
    setRotationAngle,
    setMosaic,
    setGridType,

    // Store states
    stel,
    safeSetViewDirection,
    mountConnected,
    stellariumSettings,
    toggleStellariumSetting,

    // Marker store
    setPendingMarkerCoords,

    // Handlers
    handleSelectionChange,
    handleFovChange,
    handleSetFramingCoordinates,
    handleZoomIn,
    handleZoomOut,
    handleSetFov,
    handleResetView,
    handleLocationChange,
    handleContextMenuCapture,
    handleAddToTargetList,
    handleNavigateToCoords,
    handleGoToCoordinates,
    openGoToDialog,
    handleCloseStarmapClick,
    handleConfirmClose,
    toggleSearch,
    handleNavigate,
    handleMarkerEdit,
    handleMarkerNavigate,
  };
}
