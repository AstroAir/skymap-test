/**
 * Coordinate system transforms.
 * Azimuth convention: North=0°, East=90°.
 */

import {
  Horizon,
  Observer,
  RotateVector,
  Rotation_ECL_EQJ,
  Rotation_ECT_EQJ,
  Rotation_EQJ_ECL,
  Rotation_EQJ_ECT,
  SphereFromVector,
  Spherical,
  VectorFromSphere,
} from 'astronomy-engine';
import { deg2rad, rad2deg } from './conversions';
import { getLSTForDate } from '../time/sidereal';

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function normalizeHourAngleDegrees(value: number): number {
  const normalized = normalizeDegrees(value);
  return normalized > 180 ? normalized - 360 : normalized;
}

function clampDeclination(dec: number): number {
  return Math.max(-90, Math.min(90, dec));
}

function equatorialVector(ra: number, dec: number, date: Date): ReturnType<typeof VectorFromSphere> {
  return VectorFromSphere(new Spherical(clampDeclination(dec), normalizeDegrees(ra), 1), date);
}

const EQ_TO_GAL_MATRIX: ReadonlyArray<ReadonlyArray<number>> = [
  [-0.0548755604162154, -0.873437090234885, -0.4838350155487132],
  [0.4941094278755837, -0.4448296299600112, 0.7469822444972189],
  [-0.8676661490190047, -0.1980763734312015, 0.4559837761750669],
];

const GAL_TO_EQ_MATRIX: ReadonlyArray<ReadonlyArray<number>> = [
  [EQ_TO_GAL_MATRIX[0][0], EQ_TO_GAL_MATRIX[1][0], EQ_TO_GAL_MATRIX[2][0]],
  [EQ_TO_GAL_MATRIX[0][1], EQ_TO_GAL_MATRIX[1][1], EQ_TO_GAL_MATRIX[2][1]],
  [EQ_TO_GAL_MATRIX[0][2], EQ_TO_GAL_MATRIX[1][2], EQ_TO_GAL_MATRIX[2][2]],
];

function multiplyMatrixVector(
  matrix: ReadonlyArray<ReadonlyArray<number>>,
  vector: readonly [number, number, number]
): [number, number, number] {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
  ];
}

function sphereToCartesian(lonDeg: number, latDeg: number): [number, number, number] {
  const lon = deg2rad(normalizeDegrees(lonDeg));
  const lat = deg2rad(clampDeclination(latDeg));
  const cosLat = Math.cos(lat);
  return [
    cosLat * Math.cos(lon),
    cosLat * Math.sin(lon),
    Math.sin(lat),
  ];
}

function cartesianToSphere(vector: readonly [number, number, number]): { lon: number; lat: number } {
  const [x, y, z] = vector;
  const lon = normalizeDegrees(rad2deg(Math.atan2(y, x)));
  const lat = rad2deg(Math.asin(Math.max(-1, Math.min(1, z))));
  return { lon, lat: clampDeclination(lat) };
}

// ============================================================================
// Equatorial ↔ Horizontal
// ============================================================================

/**
 * Convert RA/Dec (degrees) to Alt/Az for the current time.
 * Wrapper kept for backward compatibility; prefer `raDecToAltAzAtTime`.
 */
export function raDecToAltAz(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number
): { altitude: number; azimuth: number } {
  return raDecToAltAzAtTime(ra, dec, latitude, longitude, new Date());
}

/**
 * Convert RA/Dec (degrees) to Alt/Az (degrees) at a specific date/time.
 */
export function raDecToAltAzAtTime(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  date: Date
): { altitude: number; azimuth: number } {
  const observer = new Observer(latitude, longitude, 0);
  const horizontal = Horizon(date, observer, normalizeDegrees(ra) / 15, clampDeclination(dec), 'normal');

  return {
    altitude: horizontal.altitude,
    azimuth: normalizeDegrees(horizontal.azimuth),
  };
}

/**
 * Convert Alt/Az (degrees) to RA/Dec for the current time.
 * Wrapper kept for backward compatibility; prefer `altAzToRaDecAtTime`.
 */
export function altAzToRaDec(
  altitude: number,
  azimuth: number,
  latitude: number,
  longitude: number
): { ra: number; dec: number } {
  return altAzToRaDecAtTime(altitude, azimuth, latitude, longitude, new Date());
}

/**
 * Convert Alt/Az (degrees) to RA/Dec (degrees) at a specific date/time.
 */
export function altAzToRaDecAtTime(
  altitude: number,
  azimuth: number,
  latitude: number,
  longitude: number,
  date: Date
): { ra: number; dec: number } {
  const lst = getLSTForDate(longitude, date);
  const altitudeRad = deg2rad(altitude);
  const azimuthRad = deg2rad(normalizeDegrees(azimuth));
  const latitudeRad = deg2rad(latitude);

  const sinDec = Math.sin(altitudeRad) * Math.sin(latitudeRad)
    + Math.cos(altitudeRad) * Math.cos(latitudeRad) * Math.cos(azimuthRad);
  const dec = rad2deg(Math.asin(Math.max(-1, Math.min(1, sinDec))));

  const y = -Math.sin(azimuthRad) * Math.cos(altitudeRad);
  const x = Math.cos(latitudeRad) * Math.sin(altitudeRad)
    - Math.sin(latitudeRad) * Math.cos(altitudeRad) * Math.cos(azimuthRad);
  const hourAngle = rad2deg(Math.atan2(y, x));

  return {
    ra: normalizeDegrees(lst - hourAngle),
    dec: clampDeclination(dec),
  };
}

// ============================================================================
// Equatorial ↔ Galactic
// ============================================================================

export function raDecToGalactic(
  ra: number,
  dec: number,
  _date?: Date
): { l: number; b: number } {
  const equatorialCartesian = sphereToCartesian(ra, dec);
  const galacticCartesian = multiplyMatrixVector(EQ_TO_GAL_MATRIX, equatorialCartesian);
  const sphere = cartesianToSphere(galacticCartesian);

  return {
    l: sphere.lon,
    b: sphere.lat,
  };
}

export function galacticToRaDec(
  l: number,
  b: number,
  _date?: Date
): { ra: number; dec: number } {
  const galacticCartesian = sphereToCartesian(l, b);
  const equatorialCartesian = multiplyMatrixVector(GAL_TO_EQ_MATRIX, galacticCartesian);
  const sphere = cartesianToSphere(equatorialCartesian);

  return {
    ra: sphere.lon,
    dec: sphere.lat,
  };
}

// ============================================================================
// Equatorial ↔ Ecliptic
// ============================================================================

export function raDecToEcliptic(
  ra: number,
  dec: number,
  date?: Date
): { longitude: number; latitude: number } {
  const at = date ?? new Date();
  const rotation = date ? Rotation_EQJ_ECT(at) : Rotation_EQJ_ECL();
  const rotated = RotateVector(rotation, equatorialVector(ra, dec, at));
  const sphere = SphereFromVector(rotated);

  return {
    longitude: normalizeDegrees(sphere.lon),
    latitude: sphere.lat,
  };
}

export function eclipticToRaDec(
  longitude: number,
  latitude: number,
  date?: Date
): { ra: number; dec: number } {
  const at = date ?? new Date();
  const rotation = date ? Rotation_ECT_EQJ(at) : Rotation_ECL_EQJ();
  const eclVector = VectorFromSphere(
    new Spherical(clampDeclination(latitude), normalizeDegrees(longitude), 1),
    at
  );
  const rotated = RotateVector(rotation, eclVector);
  const sphere = SphereFromVector(rotated);

  return {
    ra: normalizeDegrees(sphere.lon),
    dec: clampDeclination(sphere.lat),
  };
}

// ============================================================================
// Hour Angle
// ============================================================================

export function getHourAngle(ra: number, longitude: number): number {
  return getHourAngleAtTime(ra, longitude, new Date());
}

export function getHourAngleAtTime(ra: number, longitude: number, date: Date): number {
  const lst = getLSTForDate(longitude, date);
  return normalizeHourAngleDegrees(lst - normalizeDegrees(ra));
}
