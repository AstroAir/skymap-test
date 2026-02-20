import { astronomyApi } from '@/lib/tauri/astronomy-api';
import { eventsApi, type AstroEvent } from '@/lib/tauri/events-api';
import { isTauri } from '@/lib/storage/platform';
import { calculateTwilightTimes } from '@/lib/astronomy/twilight/calculator';
import { getLSTForDate } from '@/lib/astronomy/time/sidereal';
import type { TwilightTimes } from '@/lib/core/types/astronomy';
import type {
  AlmanacRequest,
  AlmanacResponse,
  AstronomyEngineBackend,
  CoordinateComputationInput,
  CoordinateComputationResult,
  EngineBody,
  EphemerisRequest,
  EphemerisResponse,
  PhenomenaEvent,
  PhenomenaRequest,
  PhenomenaResponse,
  RiseTransitSetRequest,
  RiseTransitSetResponse,
} from './types';

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function normalizeSignedDegrees(value: number): number {
  const normalized = normalizeDegrees(value);
  return normalized > 180 ? normalized - 360 : normalized;
}

function toTimestampSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function fromTimestampSeconds(value: number | null | undefined): Date | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return new Date(value * 1000);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampVisibilityWindow(start: Date | null, end: Date | null, floor: Date, ceiling: Date): [Date | null, Date | null] {
  if (!start || !end) {
    return [null, null];
  }

  const boundedStart = start < floor ? floor : start;
  const boundedEnd = end > ceiling ? ceiling : end;
  if (boundedEnd <= boundedStart) {
    return [null, null];
  }
  return [boundedStart, boundedEnd];
}

function unsupportedBodyError(body: EngineBody): Error {
  return new Error(`Tauri backend does not support ${body} for this operation`);
}

function isBodySupportedByTauri(body: EngineBody): boolean {
  return body === 'Sun' || body === 'Moon' || body === 'Custom';
}

async function resolveSupportedBodyEquatorial(
  body: EngineBody,
  date: Date,
  observer: { latitude: number; longitude: number },
  customCoordinate?: { ra: number; dec: number }
): Promise<{ ra: number; dec: number }> {
  if (body === 'Custom') {
    if (!customCoordinate) {
      throw new Error('Custom coordinate is required for custom target');
    }
    return {
      ra: normalizeDegrees(customCoordinate.ra),
      dec: customCoordinate.dec,
    };
  }

  const timestamp = toTimestampSeconds(date);
  if (body === 'Sun') {
    const sun = await astronomyApi.celestial.getSunPosition(observer.latitude, observer.longitude, timestamp);
    return {
      ra: normalizeDegrees(sun.ra),
      dec: sun.dec,
    };
  }

  if (body === 'Moon') {
    const moon = await astronomyApi.celestial.getMoonPosition(observer.latitude, observer.longitude, timestamp);
    return {
      ra: normalizeDegrees(moon.ra),
      dec: moon.dec,
    };
  }

  throw unsupportedBodyError(body);
}

function convertTwilightFromLocalFallback(date: Date, latitude: number, longitude: number): TwilightTimes {
  return calculateTwilightTimes(latitude, longitude, date);
}

function mapEventType(eventType: AstroEvent['event_type']): PhenomenaEvent['type'] {
  switch (eventType) {
    case 'planetary_conjunction':
      return 'conjunction';
    case 'planetary_opposition':
      return 'opposition';
    case 'planetary_elongation':
      return 'elongation';
    case 'new_moon':
    case 'first_quarter':
    case 'full_moon':
    case 'last_quarter':
      return 'moon_phase';
    default:
      return 'close_approach';
  }
}

function eventImportance(event: AstroEvent): PhenomenaEvent['importance'] {
  if (event.event_type === 'solar_eclipse' || event.event_type === 'lunar_eclipse') {
    return 'high';
  }
  if (event.event_type === 'new_moon' || event.event_type === 'full_moon') {
    return 'high';
  }
  return event.magnitude !== null ? 'high' : 'medium';
}

async function computeCoordinates(input: CoordinateComputationInput): Promise<CoordinateComputationResult> {
  const timestamp = toTimestampSeconds(input.date);
  const [horizontal, galactic, ecliptic] = await Promise.all([
    astronomyApi.coordinates.equatorialToHorizontal(
      input.coordinate.ra,
      input.coordinate.dec,
      input.observer.latitude,
      input.observer.longitude,
      timestamp
    ),
    astronomyApi.coordinates.equatorialToGalactic(input.coordinate.ra, input.coordinate.dec),
    astronomyApi.coordinates.equatorialToEcliptic(input.coordinate.ra, input.coordinate.dec, timestamp),
  ]);

  const lst = normalizeDegrees(getLSTForDate(input.observer.longitude, input.date));
  const gmst = normalizeDegrees(lst - input.observer.longitude);
  const ra = normalizeDegrees(input.coordinate.ra);

  return {
    equatorial: {
      ra,
      dec: input.coordinate.dec,
    },
    horizontal: {
      altitude: horizontal.alt,
      azimuth: normalizeDegrees(horizontal.az),
    },
    galactic: {
      l: normalizeDegrees(galactic.l),
      b: galactic.b,
    },
    ecliptic: {
      longitude: normalizeDegrees(ecliptic.lon),
      latitude: ecliptic.lat,
    },
    sidereal: {
      gmst,
      lst,
      hourAngle: normalizeSignedDegrees(lst - ra),
    },
    meta: {
      backend: 'tauri',
      model: 'tauri-rust',
    },
  };
}

async function computeRiseTransitSet(request: RiseTransitSetRequest): Promise<RiseTransitSetResponse> {
  if (!isBodySupportedByTauri(request.body)) {
    throw unsupportedBodyError(request.body);
  }

  const equatorial = await resolveSupportedBodyEquatorial(
    request.body,
    request.date,
    request.observer,
    request.customCoordinate
  );

  const timestamp = toTimestampSeconds(request.date);
  const visibility = await astronomyApi.visibility.calculateVisibility(
    equatorial.ra,
    equatorial.dec,
    request.observer.latitude,
    request.observer.longitude,
    timestamp,
    request.minAltitude ?? 0
  );

  const twilight = convertTwilightFromLocalFallback(
    request.date,
    request.observer.latitude,
    request.observer.longitude
  );

  let darkImagingStart: Date | null = null;
  let darkImagingEnd: Date | null = null;
  let darkImagingHours = 0;

  if (twilight.astronomicalDusk && twilight.astronomicalDawn) {
    const [start, end] = clampVisibilityWindow(
      fromTimestampSeconds(visibility.rise_time),
      fromTimestampSeconds(visibility.set_time),
      twilight.astronomicalDusk,
      twilight.astronomicalDawn < twilight.astronomicalDusk
        ? new Date(twilight.astronomicalDawn.getTime() + 24 * 3600000)
        : twilight.astronomicalDawn
    );
    darkImagingStart = start;
    darkImagingEnd = end;
    if (start && end) {
      darkImagingHours = (end.getTime() - start.getTime()) / 3600000;
    }
  }

  return {
    riseTime: fromTimestampSeconds(visibility.rise_time),
    transitTime: fromTimestampSeconds(visibility.transit_time),
    setTime: fromTimestampSeconds(visibility.set_time),
    transitAltitude: visibility.transit_altitude,
    currentAltitude: visibility.current_altitude,
    currentAzimuth: visibility.current_azimuth,
    isCircumpolar: visibility.is_circumpolar,
    neverRises: visibility.never_rises,
    darkImagingStart,
    darkImagingEnd,
    darkImagingHours,
    meta: {
      backend: 'tauri',
      model: 'tauri-rust',
    },
  };
}

async function computeEphemeris(request: EphemerisRequest): Promise<EphemerisResponse> {
  if (!isBodySupportedByTauri(request.body)) {
    throw unsupportedBodyError(request.body);
  }

  const points = [];
  for (let index = 0; index < request.steps; index += 1) {
    const date = new Date(request.startDate.getTime() + index * request.stepHours * 3600000);
    const equatorial = await resolveSupportedBodyEquatorial(
      request.body,
      date,
      request.observer,
      request.customCoordinate
    );

    const coordinates = await computeCoordinates({
      coordinate: equatorial,
      observer: request.observer,
      date,
      refraction: request.refraction,
    });

    let phaseFraction: number | undefined;
    if (request.body === 'Moon') {
      const moonPhase = await astronomyApi.celestial.getMoonPhase(toTimestampSeconds(date));
      phaseFraction = moonPhase.phase;
    }

    points.push({
      date,
      ra: coordinates.equatorial.ra,
      dec: coordinates.equatorial.dec,
      altitude: coordinates.horizontal.altitude,
      azimuth: coordinates.horizontal.azimuth,
      galacticL: coordinates.galactic.l,
      galacticB: coordinates.galactic.b,
      eclipticLon: coordinates.ecliptic.longitude,
      eclipticLat: coordinates.ecliptic.latitude,
      phaseFraction,
    });
  }

  return {
    body: request.body,
    points,
    meta: {
      backend: 'tauri',
      model: 'tauri-rust',
    },
  };
}

async function computeAlmanac(request: AlmanacRequest): Promise<AlmanacResponse> {
  const timestamp = toTimestampSeconds(request.date);
  const [sunPosition, moonPosition, moonPhase] = await Promise.all([
    astronomyApi.celestial.getSunPosition(request.observer.latitude, request.observer.longitude, timestamp),
    astronomyApi.celestial.getMoonPosition(request.observer.latitude, request.observer.longitude, timestamp),
    astronomyApi.celestial.getMoonPhase(timestamp),
  ]);

  const moonVisibility = await astronomyApi.visibility.calculateVisibility(
    moonPosition.ra,
    moonPosition.dec,
    request.observer.latitude,
    request.observer.longitude,
    timestamp,
    0
  );

  const twilight = convertTwilightFromLocalFallback(
    request.date,
    request.observer.latitude,
    request.observer.longitude
  );

  return {
    twilight,
    sun: {
      ra: normalizeDegrees(sunPosition.ra),
      dec: sunPosition.dec,
      altitude: sunPosition.altitude,
      azimuth: normalizeDegrees(sunPosition.azimuth),
    },
    moon: {
      ra: normalizeDegrees(moonPosition.ra),
      dec: moonPosition.dec,
      altitude: moonPosition.altitude,
      azimuth: normalizeDegrees(moonPosition.azimuth),
      phase: moonPhase.phase,
      illumination: moonPhase.illumination,
      riseTime: fromTimestampSeconds(moonVisibility.rise_time),
      setTime: fromTimestampSeconds(moonVisibility.set_time),
    },
    meta: {
      backend: 'tauri',
      model: 'tauri-rust',
    },
  };
}

async function searchPhenomena(request: PhenomenaRequest): Promise<PhenomenaResponse> {
  const startDate = formatDateKey(request.startDate);
  const endDate = formatDateKey(request.endDate);
  const events = await eventsApi.getAstroEvents(startDate, endDate);

  const mapped = events
    .map<PhenomenaEvent>((event) => ({
      date: new Date(event.timestamp * 1000),
      type: mapEventType(event.event_type),
      object1: event.name,
      details: event.description || event.name,
      separation: event.magnitude ?? undefined,
      importance: eventImportance(event),
      source: 'tauri-events',
    }))
    .filter((event) => request.includeMinor || event.importance !== 'low');

  return {
    events: mapped.sort((left, right) => left.date.getTime() - right.date.getTime()),
    meta: {
      backend: 'tauri',
      model: 'tauri-events',
    },
  };
}

export const tauriAstronomyBackend: AstronomyEngineBackend = {
  async computeCoordinates(input): Promise<CoordinateComputationResult> {
    if (!isTauri() || !astronomyApi.isAvailable()) {
      throw new Error('Tauri backend is unavailable');
    }
    return computeCoordinates(input);
  },

  async computeEphemeris(request): Promise<EphemerisResponse> {
    if (!isTauri() || !astronomyApi.isAvailable()) {
      throw new Error('Tauri backend is unavailable');
    }
    return computeEphemeris(request);
  },

  async computeRiseTransitSet(request): Promise<RiseTransitSetResponse> {
    if (!isTauri() || !astronomyApi.isAvailable()) {
      throw new Error('Tauri backend is unavailable');
    }
    return computeRiseTransitSet(request);
  },

  async searchPhenomena(request): Promise<PhenomenaResponse> {
    if (!isTauri() || !eventsApi.isAvailable()) {
      throw new Error('Tauri events backend is unavailable');
    }
    return searchPhenomena(request);
  },

  async computeAlmanac(request): Promise<AlmanacResponse> {
    if (!isTauri() || !astronomyApi.isAvailable()) {
      throw new Error('Tauri backend is unavailable');
    }
    return computeAlmanac(request);
  },
};
