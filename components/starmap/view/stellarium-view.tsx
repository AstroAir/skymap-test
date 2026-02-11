'use client';

import { TooltipProvider } from '@/components/ui/tooltip';

import { StellariumCanvas } from '../canvas/stellarium-canvas';
import { InfoPanel } from '../objects/info-panel';
import { ObjectDetailDrawer } from '../objects/object-detail-drawer';
import { KeyboardShortcutsManager } from '../controls/keyboard-shortcuts-manager';
import { WelcomeDialog } from '../onboarding/welcome-dialog';
import { OnboardingTour } from '../onboarding/onboarding-tour';

import { TopToolbar } from './top-toolbar';
import { RightControlPanel } from './right-control-panel';
import { MobileLayout } from './mobile-layout';
import { CanvasContextMenu } from './canvas-context-menu';
import { GoToCoordinatesDialog } from './go-to-coordinates-dialog';
import { SearchPanel } from './search-panel';
import { CloseConfirmDialog } from './close-confirm-dialog';
import { OverlaysContainer } from './overlays-container';
import { CenterCrosshair } from './center-crosshair';
import { BottomStatusBar } from './bottom-status-bar';
import { useStellariumViewState } from './use-stellarium-view-state';

export function StellariumView() {
  const {
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
    setRotationAngle,
    setMosaic,

    // Store states
    stel,
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
  } = useStellariumViewState();

  return (
    <TooltipProvider>
      <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden" data-tour-id="canvas">
        {/* Onboarding Components */}
        <WelcomeDialog />
        <OnboardingTour />

        {/* Keyboard Shortcuts Manager */}
        <KeyboardShortcutsManager
          onToggleSearch={toggleSearch}
          onToggleSessionPanel={() => setShowSessionPanel(prev => !prev)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onClosePanel={() => {
            if (isSearchOpen) setIsSearchOpen(false);
            else if (selectedObject) setSelectedObject(null);
          }}
          enabled={!!stel}
        />

        {/* Canvas */}
        <div className="absolute inset-0">
          <StellariumCanvas
            ref={canvasRef}
            onSelectionChange={handleSelectionChange}
            onFovChange={handleFovChange}
            onContextMenu={handleContextMenuCapture}
          />
        </div>

        {/* Context Menu */}
        <CanvasContextMenu
          open={contextMenuOpen}
          position={contextMenuPosition}
          coords={contextMenuCoords}
          selectedObject={selectedObject}
          mountConnected={mountConnected}
          fovSimEnabled={fovSimEnabled}
          mosaic={mosaic}
          stellariumSettings={stellariumSettings}
          onOpenChange={setContextMenuOpen}
          onAddToTargetList={handleAddToTargetList}
          onNavigateToCoords={handleNavigateToCoords}
          onOpenGoToDialog={openGoToDialog}
          onSetPendingMarkerCoords={setPendingMarkerCoords}
          onSetFramingCoordinates={handleSetFramingCoordinates}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onSetFov={handleSetFov}
          onSetFovSimEnabled={setFovSimEnabled}
          onSetRotationAngle={setRotationAngle}
          onSetMosaic={setMosaic}
          onToggleStellariumSetting={toggleStellariumSetting}
          onToggleSearch={toggleSearch}
          onResetView={handleResetView}
        />

        {/* Go to Coordinates Dialog */}
        <GoToCoordinatesDialog
          open={goToDialogOpen}
          onOpenChange={setGoToDialogOpen}
          onNavigate={handleGoToCoordinates}
        />

        {/* Overlays */}
        <OverlaysContainer
          containerBounds={containerBounds}
          fovEnabled={fovSimEnabled}
          sensorWidth={sensorWidth}
          sensorHeight={sensorHeight}
          focalLength={focalLength}
          currentFov={currentFov}
          rotationAngle={rotationAngle}
          mosaic={mosaic}
          gridType={gridType}
          onRotationChange={setRotationAngle}
          onMarkerDoubleClick={handleMarkerNavigate}
          onMarkerEdit={handleMarkerEdit}
          onMarkerNavigate={handleMarkerNavigate}
        />

        {/* Top Toolbar */}
        <TopToolbar
          stel={!!stel}
          isSearchOpen={isSearchOpen}
          showSessionPanel={showSessionPanel}
          viewCenterRaDec={viewCenterRaDec}
          currentFov={currentFov}
          onToggleSearch={toggleSearch}
          onToggleSessionPanel={() => setShowSessionPanel(prev => !prev)}
          onResetView={handleResetView}
          onCloseStarmapClick={handleCloseStarmapClick}
          onSetFov={handleSetFov}
          onNavigate={handleNavigate}
          onGoToCoordinates={handleGoToCoordinates}
        />

        {/* Search Panel */}
        <SearchPanel
          ref={searchRef}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelect={() => setIsSearchOpen(false)}
        />

        {/* Right Side Controls - Desktop */}
        <RightControlPanel
          stel={!!stel}
          currentFov={currentFov}
          selectedObject={selectedObject}
          showSessionPanel={showSessionPanel}
          contextMenuCoords={contextMenuCoords}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFovSliderChange={handleSetFov}
          onLocationChange={handleLocationChange}
        />

        {/* Mobile Layout */}
        <MobileLayout
          stel={!!stel}
          currentFov={currentFov}
          selectedObject={selectedObject}
          contextMenuCoords={contextMenuCoords}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFovSliderChange={handleSetFov}
          onLocationChange={handleLocationChange}
          onGoToCoordinates={handleGoToCoordinates}
        />

        {/* Info Panel */}
        {selectedObject && !isSearchOpen && (
          <InfoPanel
            selectedObject={selectedObject}
            onClose={() => setSelectedObject(null)}
            onSetFramingCoordinates={handleSetFramingCoordinates}
            onViewDetails={() => setDetailDrawerOpen(true)}
            clickPosition={clickPosition}
            containerBounds={containerBounds}
            className="pointer-events-auto info-panel-enter"
          />
        )}

        {/* Object Detail Drawer */}
        <ObjectDetailDrawer
          open={detailDrawerOpen}
          onOpenChange={setDetailDrawerOpen}
          selectedObject={selectedObject}
          onSetFramingCoordinates={handleSetFramingCoordinates}
        />

        {/* Close Confirmation Dialog */}
        <CloseConfirmDialog
          open={closeConfirmDialogOpen}
          onOpenChange={setCloseConfirmDialogOpen}
          onConfirm={handleConfirmClose}
        />

        {/* Bottom Status Bar */}
        <BottomStatusBar currentFov={currentFov} />

        {/* Center Crosshair */}
        <CenterCrosshair />
      </div>
    </TooltipProvider>
  );
}
