/**
 * @jest-environment jsdom
 */
import { useStellariumStore } from '../stellarium-store';

// Mock translations
jest.mock('../../translations', () => ({
  updateStellariumTranslation: jest.fn(),
}));

describe('useStellariumStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStellariumStore.setState({
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
    });
  });

  describe('initial state', () => {
    it('has null stel initially', () => {
      const { stel } = useStellariumStore.getState();
      expect(stel).toBeNull();
    });

    it('has empty baseUrl initially', () => {
      const { baseUrl } = useStellariumStore.getState();
      expect(baseUrl).toBe('');
    });

    it('has default search state', () => {
      const { search } = useStellariumStore.getState();
      expect(search.RAangle).toBe(0);
      expect(search.DECangle).toBe(0);
      expect(search.RAangleString).toBe('');
      expect(search.DECangleString).toBe('');
    });

    it('has null helper functions initially', () => {
      const { getCurrentViewDirection, setViewDirection } = useStellariumStore.getState();
      expect(getCurrentViewDirection).toBeNull();
      expect(setViewDirection).toBeNull();
    });
  });

  describe('setStel', () => {
    it('sets the stellarium engine', () => {
      const mockStel = { core: {} } as unknown as Parameters<typeof useStellariumStore.getState>['0']['stel'];
      
      useStellariumStore.getState().setStel(mockStel);
      
      expect(useStellariumStore.getState().stel).toBe(mockStel);
    });

    it('can set stel to null', () => {
      const mockStel = { core: {} } as unknown as Parameters<typeof useStellariumStore.getState>['0']['stel'];
      useStellariumStore.getState().setStel(mockStel);
      useStellariumStore.getState().setStel(null);
      
      expect(useStellariumStore.getState().stel).toBeNull();
    });
  });

  describe('setBaseUrl', () => {
    it('sets the base URL', () => {
      useStellariumStore.getState().setBaseUrl('http://localhost:8080');
      
      expect(useStellariumStore.getState().baseUrl).toBe('http://localhost:8080');
    });
  });

  describe('setSearch', () => {
    it('updates search state partially', () => {
      useStellariumStore.getState().setSearch({ RAangle: 180 });
      
      const { search } = useStellariumStore.getState();
      expect(search.RAangle).toBe(180);
      expect(search.DECangle).toBe(0); // unchanged
    });

    it('updates multiple search fields', () => {
      useStellariumStore.getState().setSearch({
        RAangle: 90,
        DECangle: 45,
        RAangleString: '6:00:00',
        DECangleString: '+45:00:00',
      });
      
      const { search } = useStellariumStore.getState();
      expect(search.RAangle).toBe(90);
      expect(search.DECangle).toBe(45);
      expect(search.RAangleString).toBe('6:00:00');
      expect(search.DECangleString).toBe('+45:00:00');
    });
  });

  describe('setHelpers', () => {
    it('sets helper functions', () => {
      const mockGetViewDirection = jest.fn(() => ({ ra: 0, dec: 0, alt: 0, az: 0 }));
      const mockSetViewDirection = jest.fn();
      
      useStellariumStore.getState().setHelpers({
        getCurrentViewDirection: mockGetViewDirection,
        setViewDirection: mockSetViewDirection,
      });
      
      expect(useStellariumStore.getState().getCurrentViewDirection).toBe(mockGetViewDirection);
      expect(useStellariumStore.getState().setViewDirection).toBe(mockSetViewDirection);
    });

    it('preserves existing helpers when setting partial', () => {
      const mockGetViewDirection = jest.fn(() => ({ ra: 0, dec: 0, alt: 0, az: 0 }));
      const mockSetViewDirection = jest.fn();
      
      useStellariumStore.getState().setHelpers({
        getCurrentViewDirection: mockGetViewDirection,
      });
      useStellariumStore.getState().setHelpers({
        setViewDirection: mockSetViewDirection,
      });
      
      expect(useStellariumStore.getState().getCurrentViewDirection).toBe(mockGetViewDirection);
      expect(useStellariumStore.getState().setViewDirection).toBe(mockSetViewDirection);
    });
  });

  describe('updateStellariumCore', () => {
    it('logs warning when stel is null', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      useStellariumStore.getState().updateStellariumCore({
        constellationsLinesVisible: true,
        azimuthalLinesVisible: false,
        equatorialLinesVisible: true,
        meridianLinesVisible: false,
        eclipticLinesVisible: true,
        atmosphereVisible: true,
        landscapesVisible: false,
        dsosVisible: true,
        surveyEnabled: true,
        surveyId: 'dss',
        skyCultureLanguage: 'native',
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Stellarium engine not ready, settings update skipped');
      consoleSpy.mockRestore();
    });
  });
});
