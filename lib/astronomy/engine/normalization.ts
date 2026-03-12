import type {
  AlmanacRequest,
  CalculationValidationIssue,
  CoordinateComputationInput,
  EphemerisRequest,
  NormalizedAlmanacRequest,
  NormalizedCalculationContext,
  NormalizedCoordinateComputationInput,
  NormalizedEphemerisRequest,
  NormalizedObserverLocation,
  NormalizedPhenomenaRequest,
  NormalizedRiseTransitSetRequest,
  PhenomenaRequest,
  RiseTransitSetRequest,
} from './types';

const DEFAULT_ELEVATION_METERS = 0;
const ROUND_DIGITS = 6;

function round(value: number, digits: number = ROUND_DIGITS): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeRaDegrees(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return round(normalized);
}

function normalizeLongitudeDegrees(value: number): number {
  const wrapped = ((value + 180) % 360 + 360) % 360 - 180;
  return round(wrapped);
}

function normalizeDateToSecond(date: Date): Date {
  return new Date(Math.floor(date.getTime() / 1000) * 1000);
}

function toIsoHourBucket(date: Date): string {
  return normalizeDateToSecond(date).toISOString().slice(0, 13);
}

function toIsoDayBucket(date: Date): string {
  return normalizeDateToSecond(date).toISOString().slice(0, 10);
}

function validateFinite(value: number, field: string, issues: CalculationValidationIssue[], code: CalculationValidationIssue['code']): void {
  if (!Number.isFinite(value)) {
    issues.push({
      code,
      field,
      message: `${field} must be a finite number`,
    });
  }
}

function ensureDate(value: Date, field: string, issues: CalculationValidationIssue[]): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    issues.push({
      code: 'invalid_date',
      field,
      message: `${field} must be a valid Date`,
    });
    return new Date(0);
  }
  return normalizeDateToSecond(value);
}

function normalizeObserver(observer: { latitude: number; longitude: number; elevation?: number }, fieldPrefix: string, issues: CalculationValidationIssue[]): NormalizedObserverLocation {
  validateFinite(observer.latitude, `${fieldPrefix}.latitude`, issues, 'invalid_latitude');
  validateFinite(observer.longitude, `${fieldPrefix}.longitude`, issues, 'invalid_longitude');
  if (observer.elevation !== undefined) {
    validateFinite(observer.elevation, `${fieldPrefix}.elevation`, issues, 'invalid_elevation');
  }

  if (observer.latitude < -90 || observer.latitude > 90) {
    issues.push({
      code: 'invalid_latitude',
      field: `${fieldPrefix}.latitude`,
      message: `${fieldPrefix}.latitude must be within [-90, 90]`,
    });
  }

  return {
    latitude: round(observer.latitude),
    longitude: normalizeLongitudeDegrees(observer.longitude),
    elevation: round(observer.elevation ?? DEFAULT_ELEVATION_METERS, 2),
  };
}

function normalizeCoordinate(
  coordinate: { ra: number; dec: number },
  fieldPrefix: string,
  issues: CalculationValidationIssue[]
): { ra: number; dec: number } {
  validateFinite(coordinate.ra, `${fieldPrefix}.ra`, issues, 'invalid_ra');
  validateFinite(coordinate.dec, `${fieldPrefix}.dec`, issues, 'invalid_dec');

  if (coordinate.dec < -90 || coordinate.dec > 90) {
    issues.push({
      code: 'invalid_dec',
      field: `${fieldPrefix}.dec`,
      message: `${fieldPrefix}.dec must be within [-90, 90]`,
    });
  }

  return {
    ra: normalizeRaDegrees(coordinate.ra),
    dec: round(coordinate.dec),
  };
}

function throwIfIssues(issues: CalculationValidationIssue[]): void {
  if (issues.length === 0) return;
  throw new AstronomyEngineValidationError(issues);
}

export class AstronomyEngineValidationError extends Error {
  readonly issues: CalculationValidationIssue[];

  constructor(issues: CalculationValidationIssue[]) {
    super(
      issues.length === 1
        ? issues[0].message
        : `Astronomy input validation failed with ${issues.length} issues`,
    );
    this.name = 'AstronomyEngineValidationError';
    this.issues = issues;
  }
}

export function normalizeCoordinateComputationInput(input: CoordinateComputationInput): NormalizedCoordinateComputationInput {
  const issues: CalculationValidationIssue[] = [];
  const date = ensureDate(input.date, 'date', issues);
  const observer = normalizeObserver(input.observer, 'observer', issues);
  const coordinate = normalizeCoordinate(input.coordinate, 'coordinate', issues);
  throwIfIssues(issues);

  return {
    ...input,
    date,
    observer,
    coordinate,
  };
}

export function normalizeEphemerisRequest(request: EphemerisRequest): NormalizedEphemerisRequest {
  const issues: CalculationValidationIssue[] = [];
  const startDate = ensureDate(request.startDate, 'startDate', issues);
  const observer = normalizeObserver(request.observer, 'observer', issues);
  const customCoordinate = request.customCoordinate
    ? normalizeCoordinate(request.customCoordinate, 'customCoordinate', issues)
    : undefined;

  validateFinite(request.steps, 'steps', issues, 'invalid_steps');
  validateFinite(request.stepHours, 'stepHours', issues, 'invalid_step_hours');

  if (!Number.isInteger(request.steps) || request.steps <= 0) {
    issues.push({
      code: 'invalid_steps',
      field: 'steps',
      message: 'steps must be a positive integer',
    });
  }
  if (request.stepHours <= 0) {
    issues.push({
      code: 'invalid_step_hours',
      field: 'stepHours',
      message: 'stepHours must be greater than 0',
    });
  }

  throwIfIssues(issues);

  return {
    ...request,
    startDate,
    observer,
    customCoordinate,
  };
}

export function normalizeRiseTransitSetRequest(request: RiseTransitSetRequest): NormalizedRiseTransitSetRequest {
  const issues: CalculationValidationIssue[] = [];
  const date = ensureDate(request.date, 'date', issues);
  const observer = normalizeObserver(request.observer, 'observer', issues);
  const customCoordinate = request.customCoordinate
    ? normalizeCoordinate(request.customCoordinate, 'customCoordinate', issues)
    : undefined;

  if (request.minAltitude !== undefined) {
    validateFinite(request.minAltitude, 'minAltitude', issues, 'invalid_min_altitude');
    if (request.minAltitude < -90 || request.minAltitude > 90) {
      issues.push({
        code: 'invalid_min_altitude',
        field: 'minAltitude',
        message: 'minAltitude must be within [-90, 90]',
      });
    }
  }

  throwIfIssues(issues);

  return {
    ...request,
    date,
    observer,
    customCoordinate,
    minAltitude: request.minAltitude !== undefined ? round(request.minAltitude) : undefined,
  };
}

export function normalizePhenomenaRequest(request: PhenomenaRequest): NormalizedPhenomenaRequest {
  const issues: CalculationValidationIssue[] = [];
  const startDate = ensureDate(request.startDate, 'startDate', issues);
  const endDate = ensureDate(request.endDate, 'endDate', issues);
  const observer = normalizeObserver(request.observer, 'observer', issues);

  if (endDate.getTime() < startDate.getTime()) {
    issues.push({
      code: 'invalid_date_range',
      field: 'endDate',
      message: 'endDate must not be earlier than startDate',
    });
  }

  throwIfIssues(issues);

  return {
    ...request,
    startDate,
    endDate,
    observer,
  };
}

export function normalizeAlmanacRequest(request: AlmanacRequest): NormalizedAlmanacRequest {
  const issues: CalculationValidationIssue[] = [];
  const date = ensureDate(request.date, 'date', issues);
  const observer = normalizeObserver(request.observer, 'observer', issues);
  throwIfIssues(issues);
  return {
    ...request,
    date,
    observer,
  };
}

export function buildNormalizedContext(
  observer: NormalizedObserverLocation,
  dateOrRange: Date | { startDate: Date; endDate: Date },
  requestKey: string
): NormalizedCalculationContext {
  const observerKey = `${observer.latitude.toFixed(4)}|${observer.longitude.toFixed(4)}|${observer.elevation.toFixed(1)}`;
  const timeWindowKey = dateOrRange instanceof Date
    ? toIsoHourBucket(dateOrRange)
    : `${toIsoDayBucket(dateOrRange.startDate)}..${toIsoDayBucket(dateOrRange.endDate)}`;
  return {
    observerKey,
    timeWindowKey,
    requestKey,
  };
}
