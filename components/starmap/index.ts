// Core components
export { StellariumView } from './core/stellarium-view';
export { StellariumCanvas, type StellariumCanvasRef } from './core/stellarium-canvas';
export { StellariumSearch } from './core/stellarium-search';
export { AdvancedSearchDialog } from './core/advanced-search-dialog';
export { StellariumMount } from './core/stellarium-mount';
export { StellariumSettings } from './core/stellarium-settings';
export { StellariumSurveySelector } from './core/stellarium-survey-selector';
export { StellariumCredits } from './core/stellarium-credits';
export { StellariumClock } from './core/stellarium-clock';
export { ZoomControls } from './core/zoom-controls';
export { SplashScreen } from './core/splash-screen';
export { AboutDialog } from './core/about-dialog';
export { OnboardingTour } from './core/onboarding-tour';
export { WelcomeDialog, TourRestartButton } from './core/welcome-dialog';
export { SetupWizard, SetupWizardButton } from './setup-wizard';
export { TourSpotlight } from './core/tour-spotlight';
export { TourTooltip } from './core/tour-tooltip';
export { ImageCapture } from './core/image-capture';
export { PlateSolver } from './core/plate-solver';

// Objects components
export { InfoPanel } from './objects/info-panel';
export { ObjectDetailDrawer } from './objects/object-detail-drawer';
export { ObjectImageGallery } from './objects/object-image-gallery';
export { ObjectInfoSourcesConfig } from './objects/object-info-sources-config';

// Planning components
export { AstroSessionPanel } from './planning/astro-session-panel';
export { AltitudeChart } from './planning/altitude-chart';
export { ExposureCalculator } from './planning/exposure-calculator';
export { ShotList } from './planning/shot-list';
export { SkyAtlasPanel } from './planning/sky-atlas-panel';
export { AstroEventsCalendar } from './planning/astro-events-calendar';
export { TonightRecommendations } from './planning/tonight-recommendations';
export { ObservationLog } from './planning/observation-log';

// Overlays components
export { FOVSimulator, type MosaicSettings, type GridType } from './overlays/fov-simulator';
export { FOVOverlay } from './overlays/fov-overlay';
export { OcularSimulator } from './overlays/ocular-simulator';
export { SatelliteTracker } from './overlays/satellite-tracker';
export { SatelliteOverlay } from './overlays/satellite-overlay';
export { SkyMarkers } from './overlays/sky-markers';

// Management components
export { OfflineCacheManager } from './management/offline-cache-manager';
export { UnifiedSettings } from './management/unified-settings';
export { DataManager } from './management/data-manager';
export { MarkerManager } from './management/marker-manager';
export { LocationManager } from './management/location-manager';
export { EquipmentManager } from './management/equipment-manager';
