// Canvas - Core Stellarium engine
export { StellariumCanvas, type StellariumCanvasRef } from './canvas/stellarium-canvas';

// View - Main view component and layout sub-components
export { StellariumView } from './view/stellarium-view';
export { TopToolbar } from './view/top-toolbar';
export { RightControlPanel } from './view/right-control-panel';
export { MobileLayout } from './view/mobile-layout';
export { BottomStatusBar, ViewCenterDisplay, LocationTimeDisplay } from './view/bottom-status-bar';

// Search - Search functionality
export { StellariumSearch } from './search/stellarium-search';
export { AdvancedSearchDialog } from './search/advanced-search-dialog';
export { FavoritesQuickAccess } from './search/favorites-quick-access';

// Settings - Configuration components
export { StellariumSettings } from './settings/stellarium-settings';
export { StellariumSurveySelector } from './settings/stellarium-survey-selector';

// Controls - View controls
export { ZoomControls } from './controls/zoom-controls';
export { KeyboardShortcutsManager } from './controls/keyboard-shortcuts-manager';
export { NavigationHistory } from './controls/navigation-history';
export { ViewBookmarks } from './controls/view-bookmarks';
export { QuickActionsPanel } from './controls/quick-actions-panel';
export { MobileToolbar, MobileZoomControl } from './controls/mobile-toolbar';
export { SidePanel, ZoomSection, ToolSection, ToolButton } from './controls/side-panel';

// Time - Time control
export { StellariumClock } from './time/stellarium-clock';

// Mount - Telescope mount control
export { StellariumMount } from './mount/stellarium-mount';

// Dialogs - Information dialogs
export { AboutDialog } from './dialogs/about-dialog';
export { StellariumCredits } from './dialogs/stellarium-credits';
export { KeyboardShortcutsDialog } from './dialogs/keyboard-shortcuts-dialog';

// Onboarding - Tour and welcome components
export { OnboardingTour } from './onboarding/onboarding-tour';
export { WelcomeDialog, TourRestartButton } from './onboarding/welcome-dialog';
export { TourSpotlight } from './onboarding/tour-spotlight';
export { TourTooltip } from './onboarding/tour-tooltip';

// Plate Solving - Image capture and plate solving
export { ImageCapture } from './plate-solving/image-capture';
export { PlateSolverUnified } from './plate-solving/plate-solver-unified';
export { SolveResultCard } from './plate-solving/solve-result-card';

// Feedback - UI feedback components
export { SplashScreen } from './feedback/splash-screen';
export { 
  LoadingSkeleton, 
  FullScreenLoader, 
  InlineLoader, 
  StarmapLoadingSkeleton 
} from './feedback/loading-skeleton';

// Setup Wizard
export { SetupWizard, SetupWizardButton } from './setup-wizard';

// Objects components
export { InfoPanel } from './objects/info-panel';
export { ObjectDetailDrawer } from './objects/object-detail-drawer';
export { ObjectImageGallery } from './objects/object-image-gallery';
export { ObjectInfoSourcesConfig } from './objects/object-info-sources-config';
export { ObjectTypeLegend } from './objects/object-type-legend';
export { TranslatedName } from './objects/translated-name';

// Planning components
export { AstroSessionPanel } from './planning/astro-session-panel';
export { AltitudeChart } from './planning/altitude-chart';
export { ExposureCalculator } from './planning/exposure-calculator';
export { ShotList } from './planning/shot-list';
export { SkyAtlasPanel } from './planning/sky-atlas-panel';
export { AstroEventsCalendar } from './planning/astro-events-calendar';
export { TonightRecommendations } from './planning/tonight-recommendations';
export { ObservationLog } from './planning/observation-log';
export { AstroCalculatorDialog } from './planning/astro-calculator-dialog';
export { SessionPlanner } from './planning/session-planner';

// Overlays components
export { FOVSimulator, type MosaicSettings, type GridType } from './overlays/fov-simulator';
export { FOVOverlay } from './overlays/fov-overlay';
export { OcularSimulator } from './overlays/ocular-simulator';
export { SatelliteTracker } from './overlays/satellite-tracker';
export { SatelliteOverlay } from './overlays/satellite-overlay';
export { SkyMarkers } from './overlays/sky-markers';
export { StatusBar } from './overlays/status-bar';

// Management components
export { OfflineCacheManager } from './management/offline-cache-manager';
export { UnifiedSettings } from './management/unified-settings';
export { DataManager } from './management/data-manager';
export { MarkerManager } from './management/marker-manager';
export { LocationManager } from './management/location-manager';
export { EquipmentManager } from './management/equipment-manager';
