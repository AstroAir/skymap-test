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
