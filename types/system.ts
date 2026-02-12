/**
 * System-related type definitions
 */

/**
 * System performance statistics
 */
export interface SystemStats {
  online: boolean;
  memoryUsage: number | null;
  fps: number | null;
}
