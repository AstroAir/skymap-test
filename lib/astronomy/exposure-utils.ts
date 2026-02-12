/**
 * Exposure calculation utilities
 * Extracted from components/starmap/planning/exposure-calculator.tsx
 */

// ============================================================================
// SNR Calculation
// ============================================================================

/**
 * Simplified SNR estimation
 * SNR ∝ √(signal_photons) / √(signal + sky + read_noise²)
 */
export function calculateSNR(
  exposureTime: number,
  gain: number,
  bortle: number,
  isNarrowband: boolean
): number {
  const skyBackground = Math.pow(10, (21.6 - (bortle * 0.5)) / 5); // Based on SQM
  const signalRate = isNarrowband ? 0.5 : 1.0; // Narrowband captures less light
  const readNoise = Math.max(1, 5 - gain / 50); // Lower read noise with higher gain
  
  const signal = signalRate * exposureTime;
  const sky = skyBackground * exposureTime * 0.01;
  const noise = Math.sqrt(signal + sky + readNoise * readNoise);
  
  return signal / noise;
}

// ============================================================================
// File Size Estimation
// ============================================================================

/**
 * Estimate file size in MB for a single frame
 */
export function estimateFileSize(
  binning: string,
  bitDepth: number = 16,
  width: number = 4656,
  height: number = 3520
): number {
  const binFactor = parseInt(binning.charAt(0));
  const effectiveWidth = width / binFactor;
  const effectiveHeight = height / binFactor;
  const bytesPerPixel = bitDepth / 8;
  return (effectiveWidth * effectiveHeight * bytesPerPixel) / (1024 * 1024);
}
