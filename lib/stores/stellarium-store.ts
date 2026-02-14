import { create } from 'zustand';
import type { StellariumEngine, StellariumSettings, SkyEngineType } from '@/lib/core/types';
import type A from 'aladin-lite';
import { PROJECTION_VALUES } from '@/lib/core/types';
import { SKY_SURVEYS } from '@/lib/core/constants';
import { updateStellariumTranslation } from '@/lib/translations';
import { createLogger } from '@/lib/logger';

type AladinInstance = ReturnType<typeof A.aladin>;

const logger = createLogger('stellarium-store');

interface StellariumState {
  // Engine instances
  stel: StellariumEngine | null;
  aladin: AladinInstance | null;
  activeEngine: SkyEngineType;
  baseUrl: string;
  
  // Search state
  search: {
    RAangle: number;
    DECangle: number;
    RAangleString: string;
    DECangleString: string;
  };
  
  // Helper functions stored on the engine
  getCurrentViewDirection: (() => { ra: number; dec: number; alt: number; az: number }) | null;
  setViewDirection: ((raDeg: number, decDeg: number) => void) | null;
  
  // Cached view direction (radians) — updated by a single polling source
  viewDirection: { ra: number; dec: number; alt: number; az: number } | null;
  
  // Actions
  setStel: (stel: StellariumEngine | null) => void;
  setAladin: (aladin: AladinInstance | null) => void;
  setActiveEngine: (engine: SkyEngineType) => void;
  setBaseUrl: (url: string) => void;
  setSearch: (search: Partial<StellariumState['search']>) => void;
  setHelpers: (helpers: {
    getCurrentViewDirection?: StellariumState['getCurrentViewDirection'];
    setViewDirection?: StellariumState['setViewDirection'];
  }) => void;
  updateViewDirection: () => void;
  updateStellariumCore: (settings: StellariumSettings) => void;
}

export const useStellariumStore = create<StellariumState>((set, get) => ({
  stel: null,
  aladin: null,
  activeEngine: 'stellarium' as SkyEngineType,
  baseUrl: '',
  search: {
    RAangle: 0,
    DECangle: 0,
    RAangleString: '',
    DECangleString: '',
  },
  getCurrentViewDirection: null,
  setViewDirection: null,
  viewDirection: null,
  
  setStel: (stel) => set({ stel }),
  setAladin: (aladin) => set({ aladin }),
  setActiveEngine: (activeEngine) => set({ activeEngine }),
  setBaseUrl: (baseUrl) => set({ baseUrl }),
  setSearch: (search) => set((state) => ({ 
    search: { ...state.search, ...search } 
  })),
  setHelpers: (helpers) => set({
    // Use 'in' check so explicit null clears the helper (vs ?? which would keep stale value).
    // The `as` cast is needed because the property type is `T | null` but TypeScript
    // sees the optional param as `T | null | undefined`; at runtime the value is always
    // either a function or null when the key is present.
    getCurrentViewDirection: 'getCurrentViewDirection' in helpers
      ? (helpers.getCurrentViewDirection ?? null) as StellariumState['getCurrentViewDirection']
      : get().getCurrentViewDirection,
    setViewDirection: 'setViewDirection' in helpers
      ? (helpers.setViewDirection ?? null) as StellariumState['setViewDirection']
      : get().setViewDirection,
  }),
  updateViewDirection: () => {
    const fn = get().getCurrentViewDirection;
    if (fn) {
      try {
        set({ viewDirection: fn() });
      } catch {
        // Engine not ready yet
      }
    }
  },
  
  updateStellariumCore: (settings) => {
    const { stel, baseUrl } = get();
    if (!stel) {
      logger.warn('Stellarium engine not ready, settings update skipped');
      return;
    }
    
    const core = stel.core;
    
    try {
      // ── Core rendering properties (from engine core_klass) ──
      core.bortle_index = settings.bortleIndex;
      core.star_linear_scale = settings.starLinearScale;
      core.star_relative_scale = settings.starRelativeScale;
      core.display_limit_mag = settings.displayLimitMag;
      core.flip_view_vertical = settings.flipViewVertical;
      core.flip_view_horizontal = settings.flipViewHorizontal;
      core.exposure_scale = settings.exposureScale;

      // Projection type
      const projValue = PROJECTION_VALUES[settings.projectionType];
      if (projValue !== undefined) {
        core.projection = projValue;
      }

      // ── Constellation settings (labels decoupled from lines) ──
      if (core.constellations) {
        core.constellations.lines_visible = settings.constellationsLinesVisible;
        core.constellations.labels_visible = settings.constellationLabelsVisible;
        if (core.constellations.images_visible !== undefined) {
          core.constellations.images_visible = settings.constellationArtVisible;
        }
      }
      
      // ── Grid and line settings ──
      if (core.lines) {
        if (core.lines.azimuthal) core.lines.azimuthal.visible = settings.azimuthalLinesVisible;
        if (core.lines.equatorial) core.lines.equatorial.visible = settings.equatorialLinesVisible;
        if (core.lines.meridian) core.lines.meridian.visible = settings.meridianLinesVisible;
        if (core.lines.ecliptic) core.lines.ecliptic.visible = settings.eclipticLinesVisible;
      }
      
      // ── Module visibility ──
      if (core.atmosphere) {
        core.atmosphere.visible = settings.atmosphereVisible;
      }
      
      if (core.dsos) {
        core.dsos.visible = settings.dsosVisible;
      }

      if (core.milkyway) {
        core.milkyway.visible = settings.milkyWayVisible;
      }

      // Star & planet hints (labels)
      if (core.stars && core.stars.hints_visible !== undefined) {
        core.stars.hints_visible = settings.starLabelsVisible;
      }
      if (core.planets && core.planets.hints_visible !== undefined) {
        core.planets.hints_visible = settings.planetLabelsVisible;
      }
      
      // ── Landscapes & fog ──
      if (core.landscapes && baseUrl) {
        try {
          const landscapeUrl = settings.landscapesVisible 
            ? baseUrl + 'landscapes/guereins'
            : baseUrl + 'landscapes/gray';
          const landscapeKey = settings.landscapesVisible ? 'guereins' : 'gray';
          
          core.landscapes.addDataSource({
            url: landscapeUrl,
            key: landscapeKey,
          });
          core.landscapes.visible = true;

          if (core.landscapes.fog_visible !== undefined) {
            core.landscapes.fog_visible = settings.fogVisible;
          }
        } catch (landscapeError) {
          logger.warn('Failed to update landscape', landscapeError);
        }
      }
      
      // ── HiPS sky survey ──
      if (core.hips) {
        let surveyUrl: string | undefined = settings.surveyUrl;
        
        if (!surveyUrl) {
          const selectedSurvey = SKY_SURVEYS.find(s => s.id === settings.surveyId);
          surveyUrl = selectedSurvey?.url;
        }
        
        if (settings.surveyEnabled && surveyUrl) {
          try {
            core.hips.visible = true;
            core.hips.url = surveyUrl;
            logger.info('HiPS survey set to', { url: surveyUrl });
          } catch (hipsError) {
            logger.warn('Failed to update HiPS survey', hipsError);
          }
        } else {
          core.hips.visible = false;
        }
      }
      
      // ── Sky culture language ──
      if (settings.skyCultureLanguage) {
        updateStellariumTranslation(settings.skyCultureLanguage);
      }
      
      logger.debug('Stellarium settings updated successfully');
    } catch (error) {
      logger.error('Error updating Stellarium settings', error);
    }
  },
}));
