/**
 * @jest-environment jsdom
 */
import {
  ICON_SOURCES,
  SATELLITE_ICONS,
  SATELLITE_SVG_ICONS,
  getCelestialIcon,
  fetchWikipediaImage,
  getDSSImageUrl,
  getAladinPreviewUrl,
  getSatelliteColor,
  calculateSatellitePosition,
} from '../celestial-icons';

// Mock fetch
global.fetch = jest.fn();

describe('ICON_SOURCES', () => {
  it('contains nasa source', () => {
    expect(ICON_SOURCES.nasa).toBeDefined();
    expect(ICON_SOURCES.nasa).toContain('nasa.gov');
  });

  it('contains stellarium source', () => {
    expect(ICON_SOURCES.stellarium).toBeDefined();
    expect(ICON_SOURCES.stellarium).toContain('stellarium');
  });

  it('contains wikipedia source', () => {
    expect(ICON_SOURCES.wikipedia).toBeDefined();
    expect(ICON_SOURCES.wikipedia).toContain('wikipedia');
  });

  it('contains simbad source', () => {
    expect(ICON_SOURCES.simbad).toBeDefined();
    expect(ICON_SOURCES.simbad).toContain('simbad');
  });
});

describe('SATELLITE_ICONS', () => {
  it('contains iss icon', () => {
    expect(SATELLITE_ICONS.iss).toBeDefined();
  });

  it('contains starlink icon', () => {
    expect(SATELLITE_ICONS.starlink).toBeDefined();
  });

  it('contains weather icon', () => {
    expect(SATELLITE_ICONS.weather).toBeDefined();
  });

  it('contains gps icon', () => {
    expect(SATELLITE_ICONS.gps).toBeDefined();
  });
});

describe('SATELLITE_SVG_ICONS', () => {
  it('contains iss svg', () => {
    expect(SATELLITE_SVG_ICONS.iss).toBeDefined();
    expect(SATELLITE_SVG_ICONS.iss).toContain('<svg');
  });

  it('contains starlink svg', () => {
    expect(SATELLITE_SVG_ICONS.starlink).toBeDefined();
    expect(SATELLITE_SVG_ICONS.starlink).toContain('<svg');
  });

  it('contains default svg', () => {
    expect(SATELLITE_SVG_ICONS.default).toBeDefined();
    expect(SATELLITE_SVG_ICONS.default).toContain('<svg');
  });
});

describe('getCelestialIcon', () => {
  it('returns icon for M31', () => {
    const icon = getCelestialIcon('M31');
    expect(icon).not.toBeNull();
    expect(icon?.name).toBe('Andromeda Galaxy');
    expect(icon?.type).toBe('galaxy');
  });

  it('returns icon for M42', () => {
    const icon = getCelestialIcon('M42');
    expect(icon).not.toBeNull();
    expect(icon?.name).toBe('Orion Nebula');
    expect(icon?.type).toBe('nebula');
  });

  it('returns icon for planets', () => {
    const jupiter = getCelestialIcon('Jupiter');
    expect(jupiter).not.toBeNull();
    expect(jupiter?.type).toBe('planet');

    const saturn = getCelestialIcon('Saturn');
    expect(saturn).not.toBeNull();
    expect(saturn?.type).toBe('planet');
  });

  it('returns icon for Moon', () => {
    const moon = getCelestialIcon('Moon');
    expect(moon).not.toBeNull();
    expect(moon?.type).toBe('moon');
  });

  it('returns icon for famous stars', () => {
    const sirius = getCelestialIcon('Sirius');
    expect(sirius).not.toBeNull();
    expect(sirius?.type).toBe('star');
  });

  it('returns null for unknown objects', () => {
    const unknown = getCelestialIcon('Unknown Object XYZ');
    expect(unknown).toBeNull();
  });

  it('is case insensitive', () => {
    const m31Lower = getCelestialIcon('m31');
    const m31Upper = getCelestialIcon('M31');
    expect(m31Lower).toEqual(m31Upper);
  });
});

describe('fetchWikipediaImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns image URL on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        thumbnail: { source: 'https://example.com/image.jpg' },
      }),
    });

    const result = await fetchWikipediaImage('Andromeda Galaxy');
    expect(result).toBe('https://example.com/image.jpg');
  });

  it('returns null on fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchWikipediaImage('Test Object');
    expect(result).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const result = await fetchWikipediaImage('Test Object');
    expect(result).toBeNull();
  });
});

describe('getDSSImageUrl', () => {
  it('generates valid DSS URL', () => {
    const url = getDSSImageUrl(180, 45);
    expect(url).toContain('archive.stsci.edu');
    expect(url).toContain('dss_search');
  });

  it('handles negative declination', () => {
    const url = getDSSImageUrl(180, -45);
    expect(url).toContain('-');
  });

  it('accepts custom size parameter', () => {
    const url = getDSSImageUrl(180, 45, 30);
    expect(url).toContain('h=30');
    expect(url).toContain('w=30');
  });
});

describe('getAladinPreviewUrl', () => {
  it('generates valid Aladin URL', () => {
    const url = getAladinPreviewUrl(180, 45);
    expect(url).toContain('alasky.u-strasbg.fr');
    expect(url).toContain('ra=180');
    expect(url).toContain('dec=45');
  });

  it('accepts custom FOV parameter', () => {
    const url = getAladinPreviewUrl(180, 45, 1.0);
    expect(url).toContain('fov=1');
  });
});

describe('getSatelliteColor', () => {
  it('returns blue for ISS', () => {
    expect(getSatelliteColor('iss')).toBe('#3b82f6');
  });

  it('returns purple for Starlink', () => {
    expect(getSatelliteColor('starlink')).toBe('#a855f7');
  });

  it('returns cyan for weather satellites', () => {
    expect(getSatelliteColor('weather')).toBe('#06b6d4');
  });

  it('returns green for GPS', () => {
    expect(getSatelliteColor('gps')).toBe('#22c55e');
  });

  it('returns gray for unknown types', () => {
    expect(getSatelliteColor('unknown')).toBe('#6b7280');
  });
});

describe('calculateSatellitePosition', () => {
  it('returns null (placeholder implementation)', () => {
    const result = calculateSatellitePosition(
      { line1: '1 25544U', line2: '2 25544' },
      40.7128,
      -74.006,
      0,
      new Date()
    );
    expect(result).toBeNull();
  });
});
