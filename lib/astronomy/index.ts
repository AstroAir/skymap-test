/**
 * Astronomy module - Pure astronomical calculations
 * 
 * This module provides all astronomical calculations as pure functions
 * with no side effects, making them easy to test and reuse.
 */

// Coordinate conversions and transforms
export * from './coordinates';

// Time calculations (Julian Date, Sidereal Time)
export * from './time';

// Celestial body positions (Sun, Moon)
export * from './celestial';

// Twilight calculations
export * from './twilight';

// Target visibility calculations
export * from './visibility';

// Imaging feasibility and exposure calculations
export * from './imaging';

// Custom horizon support
export * from './horizon';
