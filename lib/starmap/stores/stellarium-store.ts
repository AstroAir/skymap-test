import { create } from 'zustand';
import type { StellariumEngine, StellariumSettings } from '../types';
import { SKY_SURVEYS } from '../types';

interface StellariumState {
  // Engine instance
  stel: StellariumEngine | null;
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
  
  // Actions
  setStel: (stel: StellariumEngine | null) => void;
  setBaseUrl: (url: string) => void;
  setSearch: (search: Partial<StellariumState['search']>) => void;
  setHelpers: (helpers: {
    getCurrentViewDirection?: StellariumState['getCurrentViewDirection'];
    setViewDirection?: StellariumState['setViewDirection'];
  }) => void;
  updateStellariumCore: (settings: StellariumSettings) => void;
}

export const useStellariumStore = create<StellariumState>((set, get) => ({
  stel: null,
  baseUrl: '',
  search: {
    RAangle: 0,
    DECangle: 0,
    RAangleString: '',
    DECangleString: '',
  },
  getCurrentViewDirection: null,
  setViewDirection: null,
  
  setStel: (stel) => set({ stel }),
  setBaseUrl: (baseUrl) => set({ baseUrl }),
  setSearch: (search) => set((state) => ({ 
    search: { ...state.search, ...search } 
  })),
  setHelpers: (helpers) => set({
    getCurrentViewDirection: helpers.getCurrentViewDirection ?? get().getCurrentViewDirection,
    setViewDirection: helpers.setViewDirection ?? get().setViewDirection,
  }),
  
  updateStellariumCore: (settings) => {
    const { stel, baseUrl } = get();
    if (!stel) {
      console.warn('Stellarium engine not ready, settings update skipped');
      return;
    }
    
    const core = stel.core;
    
    try {
      // Grid and line settings - use direct property assignment for Stellarium engine compatibility
      if (core.constellations) {
        core.constellations.lines_visible = settings.constellationsLinesVisible;
        core.constellations.labels_visible = settings.constellationsLinesVisible;
      }
      
      if (core.lines) {
        if (core.lines.azimuthal) core.lines.azimuthal.visible = settings.azimuthalLinesVisible;
        if (core.lines.equatorial) core.lines.equatorial.visible = settings.equatorialLinesVisible;
        if (core.lines.meridian) core.lines.meridian.visible = settings.meridianLinesVisible;
        if (core.lines.ecliptic) core.lines.ecliptic.visible = settings.eclipticLinesVisible;
      }
      
      if (core.atmosphere) {
        core.atmosphere.visible = settings.atmosphereVisible;
      }
      
      if (core.dsos) {
        core.dsos.visible = settings.dsosVisible;
      }
      
      // Handle landscapes with error handling
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
        } catch (landscapeError) {
          console.warn('Failed to update landscape:', landscapeError);
        }
      }
      
      // Handle sky survey (HiPS) with proper error handling
      if (core.hips) {
        // First check for direct URL (online surveys), then fall back to local survey lookup
        let surveyUrl: string | undefined = settings.surveyUrl;
        
        if (!surveyUrl) {
          const selectedSurvey = SKY_SURVEYS.find(s => s.id === settings.surveyId);
          surveyUrl = selectedSurvey?.url;
        }
        
        if (settings.surveyEnabled && surveyUrl) {
          try {
            // Set visibility first, then URL using direct property assignment
            core.hips.visible = true;
            core.hips.url = surveyUrl;
            console.log('HiPS survey set to:', surveyUrl);
          } catch (hipsError) {
            console.warn('Failed to update HiPS survey:', hipsError);
          }
        } else {
          core.hips.visible = false;
        }
      }
      
      console.log('Stellarium settings updated successfully');
    } catch (error) {
      console.error('Error updating Stellarium settings:', error);
    }
  },
}));
