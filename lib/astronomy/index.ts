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
export * from './time-scales';

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

// FOV utility functions
export * from './fov-utils';

// Celestial navigation utilities
export * from './navigation';

// Coordinate validators
export * from './coordinate-validators';

// Coordinate frame pipeline
export * from './frames';
export * from './pipeline';

// Unified astronomy engine (Tauri + fallback)
export * from './engine';
