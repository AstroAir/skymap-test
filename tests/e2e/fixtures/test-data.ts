/**
 * Test data constants for E2E tests
 */

export const TEST_OBJECTS = {
  // Popular deep sky objects
  M31: {
    name: 'M31',
    fullName: 'Andromeda Galaxy',
    type: 'galaxy',
    ra: '00h42m44s',
    dec: '+41°16\'09"',
  },
  M42: {
    name: 'M42',
    fullName: 'Orion Nebula',
    type: 'nebula',
    ra: '05h35m17s',
    dec: '-05°23\'28"',
  },
  M45: {
    name: 'M45',
    fullName: 'Pleiades',
    type: 'cluster',
    ra: '03h47m00s',
    dec: '+24°07\'00"',
  },
  NGC7000: {
    name: 'NGC7000',
    fullName: 'North America Nebula',
    type: 'nebula',
    ra: '20h58m47s',
    dec: '+44°19\'48"',
  },
  // Planets
  Mars: {
    name: 'Mars',
    type: 'planet',
  },
  Jupiter: {
    name: 'Jupiter',
    type: 'planet',
  },
  Saturn: {
    name: 'Saturn',
    type: 'planet',
  },
};

export const TEST_COORDINATES = {
  // Decimal degrees
  decimal: {
    ra: 10.68,
    dec: 41.27,
  },
  // HMS/DMS format
  sexagesimal: {
    ra: '00h42m44s',
    dec: '+41°16\'09"',
  },
};

export const TEST_LOCATIONS = {
  beijing: {
    name: 'Beijing',
    latitude: 39.9042,
    longitude: 116.4074,
    altitude: 50,
    bortle: 8,
  },
  darkSite: {
    name: 'Dark Site',
    latitude: 35.0,
    longitude: -110.0,
    altitude: 2000,
    bortle: 2,
  },
};

export const TEST_EQUIPMENT = {
  telescopes: [
    {
      name: 'Test Refractor',
      aperture: 80,
      focalLength: 600,
    },
    {
      name: 'Test Newtonian',
      aperture: 200,
      focalLength: 1000,
    },
  ],
  cameras: [
    {
      name: 'Test Camera',
      sensorWidth: 23.5,
      sensorHeight: 15.6,
      pixelSize: 3.76,
    },
  ],
  eyepieces: [
    {
      name: '25mm Plossl',
      focalLength: 25,
      afov: 52,
    },
    {
      name: '10mm Plossl',
      focalLength: 10,
      afov: 52,
    },
  ],
};

export const TEST_TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  splash: 15000,
};

export const VIEWPORT_SIZES = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

export const LOCALES = {
  en: 'English',
  zh: '中文',
};
