// Canvas - Core Stellarium engine
export { StellariumCanvas, type StellariumCanvasRef } from './canvas/stellarium-canvas';

// View - Main view component
export { StellariumView } from './view/stellarium-view';

// Search - Search functionality
export { StellariumSearch } from './search/stellarium-search';
export { AdvancedSearchDialog } from './search/advanced-search-dialog';

// Settings - Configuration components
export { StellariumSettings } from './settings/stellarium-settings';
export { StellariumSurveySelector } from './settings/stellarium-survey-selector';

// Controls - View controls
export { ZoomControls } from './controls/zoom-controls';

// Time - Time control
export { StellariumClock } from './time/stellarium-clock';

// Mount - Telescope mount control
export { StellariumMount } from './mount/stellarium-mount';

// Dialogs - Information dialogs
export { AboutDialog } from './dialogs/about-dialog';
export { StellariumCredits } from './dialogs/stellarium-credits';

// Onboarding - Tour and welcome components
export { OnboardingTour } from './onboarding/onboarding-tour';
export { WelcomeDialog, TourRestartButton } from './onboarding/welcome-dialog';
export { TourSpotlight } from './onboarding/tour-spotlight';
export { TourTooltip } from './onboarding/tour-tooltip';

// Plate Solving - Image capture and plate solving
export { ImageCapture } from './plate-solving/image-capture';
export { PlateSolver } from './plate-solving/plate-solver';

// Feedback - UI feedback components
export { SplashScreen } from './feedback/splash-screen';

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
