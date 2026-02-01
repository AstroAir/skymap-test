'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useStellariumStore, useFramingStore, useMountStore, useEquipmentStore, useMarkerStore } from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useNavigationHistoryStore } from '@/lib/hooks';
import { rad2deg } from '@/lib/astronomy/starmap-utils';
import type { SelectedObjectData, ClickCoords } from '@/lib/core/types';
import type { StellariumCanvasRef } from '../canvas/stellarium-canvas';
import type { StellariumSearchRef } from '../search/stellarium-search';

export function useStellariumViewState() {
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

  // View center for bookmarks
  const [viewCenterRaDec, setViewCenterRaDec] = useState<{ ra: number; dec: number }>({ ra: 0, dec: 0 });

  // Refs
  const canvasRef = useRef<StellariumCanvasRef>(null);
  const searchRef = useRef<StellariumSearchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevViewCenterRef = useRef({ ra: 0, dec: 0 });
  const fovChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFovRef = useRef(currentFov);

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
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const getCurrentViewDirection = useStellariumStore((state) => state.getCurrentViewDirection);

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

  // Update view center for bookmarks periodically
  useEffect(() => {
    const updateViewCenter = () => {
      if (getCurrentViewDirection) {
        try {
          const dir = getCurrentViewDirection();
          const newRa = rad2deg(dir.ra);
          const newDec = rad2deg(dir.dec);
          if (Math.abs(newRa - prevViewCenterRef.current.ra) > 0.01 ||
              Math.abs(newDec - prevViewCenterRef.current.dec) > 0.01) {
            prevViewCenterRef.current = { ra: newRa, dec: newDec };
            setViewCenterRaDec({ ra: newRa, dec: newDec });
          }
        } catch {
          // Engine not ready yet
        }
      }
    };

    updateViewCenter();
    const interval = setInterval(updateViewCenter, 500);
    return () => clearInterval(interval);
  }, [getCurrentViewDirection]);

  // Track container bounds on resize
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerBounds({ width: rect.width, height: rect.height });
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Track last mouse position for info panel placement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        (containerRef.current as HTMLDivElement & { lastMousePos?: { x: number; y: number } }).lastMousePos = {
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
      if (containerRef.current) {
        const lastPos = (containerRef.current as HTMLDivElement & { lastMousePos?: { x: number; y: number } }).lastMousePos;
        if (lastPos) {
          setClickPosition(lastPos);
        }
      }
      pushNavigationHistory({
        ra: selection.raDeg,
        dec: selection.decDeg,
        fov: currentFov,
        name: selection.names[0],
      });
    }
    setSelectedObject(selection);
  }, [currentFov, pushNavigationHistory]);

  // Handle FOV change with throttling
  const handleFovChange = useCallback((fov: number) => {
    lastFovRef.current = fov;

    if (fovChangeTimeoutRef.current) return;

    fovChangeTimeoutRef.current = setTimeout(() => {
      setCurrentFov(lastFovRef.current);
      fovChangeTimeoutRef.current = null;
    }, 16);
  }, []);

  // Cleanup FOV change timeout on unmount
  useEffect(() => {
    return () => {
      if (fovChangeTimeoutRef.current) {
        clearTimeout(fovChangeTimeoutRef.current);
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

  const handleFovSliderChange = useCallback((fov: number) => {
    canvasRef.current?.setFov(fov);
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
        name: `Target @ ${contextMenuCoords.raStr}`,
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
        name: selectedObject.names[0] || 'Unknown',
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
  }, [contextMenuCoords, selectedObject, addTarget, sensorWidth, sensorHeight, focalLength, rotationAngle, mosaic]);

  // Navigate to coords
  const handleNavigateToCoords = useCallback(() => {
    if (contextMenuCoords && setViewDirection) {
      setViewDirection(contextMenuCoords.ra, contextMenuCoords.dec);
    }
    setContextMenuOpen(false);
  }, [contextMenuCoords, setViewDirection]);

  // Go to coordinates
  const handleGoToCoordinates = useCallback((ra: number, dec: number) => {
    if (setViewDirection) {
      setViewDirection(ra, dec);
    }
  }, [setViewDirection]);

  // Open go to dialog
  const openGoToDialog = useCallback(() => {
    setContextMenuOpen(false);
    setGoToDialogOpen(true);
  }, []);

  // Close starmap
  const handleCloseStarmapClick = useCallback(() => {
    if (skipCloseConfirmation) {
      window.location.href = '/';
    } else {
      setCloseConfirmDialogOpen(true);
    }
  }, [skipCloseConfirmation]);

  // Confirm close
  const handleConfirmClose = useCallback((dontShowAgain: boolean) => {
    if (dontShowAgain) {
      setPreference('skipCloseConfirmation', true);
    }
    setCloseConfirmDialogOpen(false);
    window.location.href = '/';
  }, [setPreference]);

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
    if (setViewDirection) {
      setViewDirection(ra, dec);
    }
    canvasRef.current?.setFov(fov);
  }, [setViewDirection]);

  // Marker handlers
  const handleMarkerDoubleClick = useCallback((marker: { ra: number; dec: number }) => {
    if (setViewDirection) {
      setViewDirection(marker.ra, marker.dec);
    }
  }, [setViewDirection]);

  const handleMarkerEdit = useCallback((marker: { id: string }) => {
    setEditingMarkerId(marker.id);
  }, [setEditingMarkerId]);

  const handleMarkerNavigate = useCallback((marker: { ra: number; dec: number }) => {
    if (setViewDirection) {
      setViewDirection(marker.ra, marker.dec);
    }
  }, [setViewDirection]);

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
    setViewDirection,
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
    handleFovSliderChange,
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
    handleMarkerDoubleClick,
    handleMarkerEdit,
    handleMarkerNavigate,
  };
}
