/**
 * Tests for management-validators field-level validation functions
 */
import {
  validateTelescopeForm,
  validateTelescopeFields,
  validateCameraForm,
  validateCameraFields,
  validateLocationForm,
  validateLocationFields,
} from '../management-validators';

describe('management-validators', () => {
  // =========================================================================
  // Telescope Validators
  // =========================================================================

  describe('validateTelescopeForm', () => {
    it('returns null for valid form', () => {
      expect(validateTelescopeForm({ name: 'Newton', aperture: '200', focal_length: '1000' })).toBeNull();
    });

    it('returns error for empty name', () => {
      expect(validateTelescopeForm({ name: '', aperture: '200', focal_length: '1000' })).toBe('equipment.fillRequired');
    });

    it('returns error for aperture out of range', () => {
      expect(validateTelescopeForm({ name: 'T', aperture: '5', focal_length: '1000' })).toBe('equipment.validation.apertureRange');
      expect(validateTelescopeForm({ name: 'T', aperture: '99999', focal_length: '1000' })).toBe('equipment.validation.apertureRange');
    });

    it('returns error for focal length out of range', () => {
      expect(validateTelescopeForm({ name: 'T', aperture: '200', focal_length: '10' })).toBe('equipment.validation.focalLengthRange');
    });
  });

  describe('validateTelescopeFields', () => {
    it('returns empty object for valid form', () => {
      const errors = validateTelescopeFields({ name: 'Newton', aperture: '200', focal_length: '1000' });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns name error for empty name', () => {
      const errors = validateTelescopeFields({ name: ' ', aperture: '200', focal_length: '1000' });
      expect(errors.name).toBe('equipment.fillRequired');
      expect(errors.aperture).toBeUndefined();
      expect(errors.focal_length).toBeUndefined();
    });

    it('returns aperture error for invalid aperture', () => {
      const errors = validateTelescopeFields({ name: 'T', aperture: 'abc', focal_length: '1000' });
      expect(errors.aperture).toBe('equipment.validation.apertureRange');
      expect(errors.name).toBeUndefined();
    });

    it('returns focal_length error for invalid focal length', () => {
      const errors = validateTelescopeFields({ name: 'T', aperture: '200', focal_length: '30' });
      expect(errors.focal_length).toBe('equipment.validation.focalLengthRange');
    });

    it('returns multiple errors simultaneously', () => {
      const errors = validateTelescopeFields({ name: '', aperture: '', focal_length: '' });
      expect(errors.name).toBeDefined();
      expect(errors.aperture).toBeDefined();
      expect(errors.focal_length).toBeDefined();
    });

    it('validates boundary values', () => {
      expect(Object.keys(validateTelescopeFields({ name: 'T', aperture: '10', focal_length: '50' }))).toHaveLength(0);
      expect(Object.keys(validateTelescopeFields({ name: 'T', aperture: '10000', focal_length: '50000' }))).toHaveLength(0);
      expect(validateTelescopeFields({ name: 'T', aperture: '9', focal_length: '50' }).aperture).toBeDefined();
      expect(validateTelescopeFields({ name: 'T', aperture: '10001', focal_length: '50' }).aperture).toBeDefined();
    });
  });

  // =========================================================================
  // Camera Validators
  // =========================================================================

  describe('validateCameraForm', () => {
    it('returns null for valid form', () => {
      expect(validateCameraForm({ name: 'ASI294', sensor_width: '23.2', sensor_height: '15.5' })).toBeNull();
    });

    it('returns error for empty name', () => {
      expect(validateCameraForm({ name: '', sensor_width: '23.2', sensor_height: '15.5' })).toBe('equipment.fillRequired');
    });

    it('returns error for sensor width out of range', () => {
      expect(validateCameraForm({ name: 'C', sensor_width: '0.5', sensor_height: '15' })).toBe('equipment.validation.sensorWidthRange');
      expect(validateCameraForm({ name: 'C', sensor_width: '101', sensor_height: '15' })).toBe('equipment.validation.sensorWidthRange');
    });

    it('returns error for sensor height out of range', () => {
      expect(validateCameraForm({ name: 'C', sensor_width: '23', sensor_height: '0' })).toBe('equipment.validation.sensorHeightRange');
    });
  });

  describe('validateCameraFields', () => {
    it('returns empty object for valid form', () => {
      const errors = validateCameraFields({ name: 'ASI294', sensor_width: '23.2', sensor_height: '15.5' });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns per-field errors for each invalid field', () => {
      const errors = validateCameraFields({ name: '', sensor_width: '0', sensor_height: '200' });
      expect(errors.name).toBe('equipment.fillRequired');
      expect(errors.sensor_width).toBe('equipment.validation.sensorWidthRange');
      expect(errors.sensor_height).toBe('equipment.validation.sensorHeightRange');
    });

    it('returns only relevant errors', () => {
      const errors = validateCameraFields({ name: 'C', sensor_width: 'abc', sensor_height: '15' });
      expect(errors.name).toBeUndefined();
      expect(errors.sensor_width).toBeDefined();
      expect(errors.sensor_height).toBeUndefined();
    });

    it('validates boundary values', () => {
      expect(Object.keys(validateCameraFields({ name: 'C', sensor_width: '1', sensor_height: '1' }))).toHaveLength(0);
      expect(Object.keys(validateCameraFields({ name: 'C', sensor_width: '100', sensor_height: '100' }))).toHaveLength(0);
    });
  });

  // =========================================================================
  // Location Validators
  // =========================================================================

  describe('validateLocationForm', () => {
    it('returns null for valid form', () => {
      expect(validateLocationForm({ name: 'Site', latitude: '40', longitude: '-74', altitude: '100', bortle_class: '3' })).toBeNull();
    });

    it('returns error for empty name', () => {
      expect(validateLocationForm({ name: '', latitude: '40', longitude: '-74', altitude: '', bortle_class: '' })).toBe('locations.fillRequired');
    });

    it('returns error for latitude out of range', () => {
      expect(validateLocationForm({ name: 'S', latitude: '91', longitude: '0', altitude: '', bortle_class: '' })).toBe('locations.validation.latitudeRange');
    });

    it('returns error for longitude out of range', () => {
      expect(validateLocationForm({ name: 'S', latitude: '0', longitude: '181', altitude: '', bortle_class: '' })).toBe('locations.validation.longitudeRange');
    });

    it('returns error for altitude out of range', () => {
      expect(validateLocationForm({ name: 'S', latitude: '0', longitude: '0', altitude: '-600', bortle_class: '' })).toBe('locations.validation.altitudeRange');
    });

    it('returns error for bortle out of range', () => {
      expect(validateLocationForm({ name: 'S', latitude: '0', longitude: '0', altitude: '', bortle_class: '10' })).toBe('locations.validation.bortleRange');
    });

    it('skips optional fields when empty', () => {
      expect(validateLocationForm({ name: 'S', latitude: '0', longitude: '0', altitude: '', bortle_class: '' })).toBeNull();
    });
  });

  describe('validateLocationFields', () => {
    it('returns empty object for valid form', () => {
      const errors = validateLocationFields({ name: 'Site', latitude: '40', longitude: '-74', altitude: '100', bortle_class: '3' });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns per-field errors for all invalid fields', () => {
      const errors = validateLocationFields({ name: '', latitude: '999', longitude: '999', altitude: '-9999', bortle_class: '0' });
      expect(errors.name).toBeDefined();
      expect(errors.latitude).toBeDefined();
      expect(errors.longitude).toBeDefined();
      expect(errors.altitude).toBeDefined();
      expect(errors.bortle_class).toBeDefined();
    });

    it('skips optional fields when empty', () => {
      const errors = validateLocationFields({ name: 'S', latitude: '40', longitude: '-74', altitude: '', bortle_class: '' });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns only relevant errors', () => {
      const errors = validateLocationFields({ name: 'S', latitude: 'abc', longitude: '0', altitude: '', bortle_class: '' });
      expect(errors.latitude).toBeDefined();
      expect(errors.name).toBeUndefined();
      expect(errors.longitude).toBeUndefined();
    });

    it('validates boundary values', () => {
      expect(Object.keys(validateLocationFields({ name: 'S', latitude: '-90', longitude: '-180', altitude: '-500', bortle_class: '1' }))).toHaveLength(0);
      expect(Object.keys(validateLocationFields({ name: 'S', latitude: '90', longitude: '180', altitude: '9000', bortle_class: '9' }))).toHaveLength(0);
    });
  });
});
