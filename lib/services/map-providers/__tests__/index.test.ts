import {
  createMapProvider,
  DEFAULT_PROVIDER_CONFIGS,
  OpenStreetMapProvider,
  GoogleMapsProvider,
  MapboxProvider,
} from '../index';

describe('map-providers/index', () => {
  describe('createMapProvider', () => {
    it('creates OpenStreetMapProvider for openstreetmap type', () => {
      const provider = createMapProvider('openstreetmap');
      expect(provider).toBeInstanceOf(OpenStreetMapProvider);
    });

    it('creates GoogleMapsProvider for google type', () => {
      const provider = createMapProvider('google', { apiKey: 'test-key' });
      expect(provider).toBeInstanceOf(GoogleMapsProvider);
    });

    it('creates MapboxProvider for mapbox type', () => {
      const provider = createMapProvider('mapbox', { apiKey: 'test-key' });
      expect(provider).toBeInstanceOf(MapboxProvider);
    });

    it('passes config to the created provider', () => {
      const config = { attribution: 'Custom', maxZoom: 15, minZoom: 2 };
      const provider = createMapProvider('openstreetmap', config);
      expect(provider).toBeInstanceOf(OpenStreetMapProvider);
    });

    it('throws for unsupported provider type', () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createMapProvider('unsupported' as any)
      ).toThrow('Unsupported map provider type: unsupported');
    });
  });

  describe('DEFAULT_PROVIDER_CONFIGS', () => {
    it('has config for openstreetmap', () => {
      expect(DEFAULT_PROVIDER_CONFIGS.openstreetmap).toBeDefined();
      expect(DEFAULT_PROVIDER_CONFIGS.openstreetmap.attribution).toContain('OpenStreetMap');
      expect(DEFAULT_PROVIDER_CONFIGS.openstreetmap.maxZoom).toBeDefined();
    });

    it('has config for google', () => {
      expect(DEFAULT_PROVIDER_CONFIGS.google).toBeDefined();
      expect(DEFAULT_PROVIDER_CONFIGS.google.attribution).toContain('Google');
      expect(DEFAULT_PROVIDER_CONFIGS.google.maxZoom).toBeDefined();
    });

    it('has config for mapbox', () => {
      expect(DEFAULT_PROVIDER_CONFIGS.mapbox).toBeDefined();
      expect(DEFAULT_PROVIDER_CONFIGS.mapbox.attribution).toContain('Mapbox');
      expect(DEFAULT_PROVIDER_CONFIGS.mapbox.maxZoom).toBeDefined();
    });

    it('all configs have rateLimit defined', () => {
      for (const key of ['openstreetmap', 'google', 'mapbox']) {
        expect(DEFAULT_PROVIDER_CONFIGS[key].rateLimit).toBeDefined();
        expect(typeof DEFAULT_PROVIDER_CONFIGS[key].rateLimit).toBe('number');
      }
    });
  });
});
