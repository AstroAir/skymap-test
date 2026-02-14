/**
 * Validation utilities for management components
 * Returns i18n keys (not translated strings) to keep lib layer free of React/i18n dependencies.
 * Components should translate the returned key via `t(key)`.
 */

// ============================================================================
// Equipment Validators
// ============================================================================

interface TelescopeFormValues {
  name: string;
  aperture: string;
  focal_length: string;
}

/**
 * Validate telescope form data.
 * @returns i18n error key or null if valid
 */
export function validateTelescopeForm(form: TelescopeFormValues): string | null {
  if (!form.name.trim()) return 'equipment.fillRequired';
  const aperture = parseFloat(form.aperture);
  const focalLength = parseFloat(form.focal_length);
  if (isNaN(aperture) || aperture < 10 || aperture > 10000)
    return 'equipment.validation.apertureRange';
  if (isNaN(focalLength) || focalLength < 50 || focalLength > 50000)
    return 'equipment.validation.focalLengthRange';
  return null;
}

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

/**
 * Validate telescope form data with per-field errors.
 * @returns map of field → i18n error key (empty if valid)
 */
export function validateTelescopeFields(form: TelescopeFormValues): FieldErrors<'name' | 'aperture' | 'focal_length'> {
  const errors: FieldErrors<'name' | 'aperture' | 'focal_length'> = {};
  if (!form.name.trim()) errors.name = 'equipment.fillRequired';
  const aperture = parseFloat(form.aperture);
  if (isNaN(aperture) || aperture < 10 || aperture > 10000)
    errors.aperture = 'equipment.validation.apertureRange';
  const focalLength = parseFloat(form.focal_length);
  if (isNaN(focalLength) || focalLength < 50 || focalLength > 50000)
    errors.focal_length = 'equipment.validation.focalLengthRange';
  return errors;
}

interface CameraFormValues {
  name: string;
  sensor_width: string;
  sensor_height: string;
}

/**
 * Validate camera form data.
 * @returns i18n error key or null if valid
 */
export function validateCameraForm(form: CameraFormValues): string | null {
  if (!form.name.trim()) return 'equipment.fillRequired';
  const sw = parseFloat(form.sensor_width);
  const sh = parseFloat(form.sensor_height);
  if (isNaN(sw) || sw < 1 || sw > 100)
    return 'equipment.validation.sensorWidthRange';
  if (isNaN(sh) || sh < 1 || sh > 100)
    return 'equipment.validation.sensorHeightRange';
  return null;
}

/**
 * Validate camera form data with per-field errors.
 * @returns map of field → i18n error key (empty if valid)
 */
export function validateCameraFields(form: CameraFormValues): FieldErrors<'name' | 'sensor_width' | 'sensor_height'> {
  const errors: FieldErrors<'name' | 'sensor_width' | 'sensor_height'> = {};
  if (!form.name.trim()) errors.name = 'equipment.fillRequired';
  const sw = parseFloat(form.sensor_width);
  if (isNaN(sw) || sw < 1 || sw > 100)
    errors.sensor_width = 'equipment.validation.sensorWidthRange';
  const sh = parseFloat(form.sensor_height);
  if (isNaN(sh) || sh < 1 || sh > 100)
    errors.sensor_height = 'equipment.validation.sensorHeightRange';
  return errors;
}

// ============================================================================
// Location Validators
// ============================================================================

interface LocationFormValues {
  name: string;
  latitude: string;
  longitude: string;
  altitude: string;
  bortle_class: string;
}

/**
 * Validate location form data.
 * @returns i18n error key or null if valid
 */
export function validateLocationForm(form: LocationFormValues): string | null {
  if (!form.name.trim()) return 'locations.fillRequired';
  const lat = parseFloat(form.latitude);
  const lon = parseFloat(form.longitude);
  if (isNaN(lat) || lat < -90 || lat > 90)
    return 'locations.validation.latitudeRange';
  if (isNaN(lon) || lon < -180 || lon > 180)
    return 'locations.validation.longitudeRange';
  if (form.altitude) {
    const alt = parseFloat(form.altitude);
    if (isNaN(alt) || alt < -500 || alt > 9000)
      return 'locations.validation.altitudeRange';
  }
  if (form.bortle_class) {
    const bc = parseInt(form.bortle_class);
    if (isNaN(bc) || bc < 1 || bc > 9)
      return 'locations.validation.bortleRange';
  }
  return null;
}

/**
 * Validate location form data with per-field errors.
 * @returns map of field → i18n error key (empty if valid)
 */
export function validateLocationFields(form: LocationFormValues): FieldErrors<'name' | 'latitude' | 'longitude' | 'altitude' | 'bortle_class'> {
  const errors: FieldErrors<'name' | 'latitude' | 'longitude' | 'altitude' | 'bortle_class'> = {};
  if (!form.name.trim()) errors.name = 'locations.fillRequired';
  const lat = parseFloat(form.latitude);
  if (isNaN(lat) || lat < -90 || lat > 90)
    errors.latitude = 'locations.validation.latitudeRange';
  const lon = parseFloat(form.longitude);
  if (isNaN(lon) || lon < -180 || lon > 180)
    errors.longitude = 'locations.validation.longitudeRange';
  if (form.altitude) {
    const alt = parseFloat(form.altitude);
    if (isNaN(alt) || alt < -500 || alt > 9000)
      errors.altitude = 'locations.validation.altitudeRange';
  }
  if (form.bortle_class) {
    const bc = parseInt(form.bortle_class);
    if (isNaN(bc) || bc < 1 || bc > 9)
      errors.bortle_class = 'locations.validation.bortleRange';
  }
  return errors;
}
