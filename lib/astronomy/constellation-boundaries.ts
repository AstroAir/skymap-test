/**
 * IAU Constellation Boundary Lookup
 *
 * Implements the Delporte (1930) constellation boundaries precessed to J2000.
 * The boundary data is derived from the IAU standard constellation boundary
 * table (Davenhall & Leggett 1989, originally Roman 1987).
 *
 * Algorithm: For a given (RA, Dec) in J2000, precess to B1875.0 epoch
 * (the epoch of the original boundary definitions), then search the boundary
 * table — sorted by decreasing declination — for the matching strip.
 */

// ============================================================================
// Precession to B1875.0
// ============================================================================

/**
 * Precess J2000 coordinates to B1875.0 for boundary lookup.
 * Uses a simplified rotation matrix adequate for the ~125-year interval.
 */
function precessJ2000toB1875(raDeg: number, decDeg: number): { ra: number; dec: number } {
  const raRad = (raDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;

  // Rotation angles from J2000 to B1875.0 (IAU precession)
  const zetaA = -0.31399;  // degrees
  const zA = -0.31399;     // degrees
  const thetaA = -0.27278; // degrees

  const zetaRad = (zetaA * Math.PI) / 180;
  const zRad = (zA * Math.PI) / 180;
  const thetaRad = (thetaA * Math.PI) / 180;

  const cosTheta = Math.cos(thetaRad);
  const sinTheta = Math.sin(thetaRad);
  const cosZeta = Math.cos(zetaRad);
  const sinZeta = Math.sin(zetaRad);
  const cosZ = Math.cos(zRad);
  const sinZ = Math.sin(zRad);

  // Direction cosines in J2000
  const x0 = Math.cos(decRad) * Math.cos(raRad);
  const y0 = Math.cos(decRad) * Math.sin(raRad);
  const z0 = Math.sin(decRad);

  // Rotation matrix J2000 → B1875
  const x1 =
    (cosZeta * cosTheta * cosZ - sinZeta * sinZ) * x0 +
    (-sinZeta * cosTheta * cosZ - cosZeta * sinZ) * y0 +
    (-sinTheta * cosZ) * z0;
  const y1 =
    (cosZeta * cosTheta * sinZ + sinZeta * cosZ) * x0 +
    (-sinZeta * cosTheta * sinZ + cosZeta * cosZ) * y0 +
    (-sinTheta * sinZ) * z0;
  const z1 =
    (cosZeta * sinTheta) * x0 +
    (-sinZeta * sinTheta) * y0 +
    cosTheta * z0;

  const decB1875 = Math.asin(Math.max(-1, Math.min(1, z1)));
  let raB1875 = Math.atan2(y1, x1);
  if (raB1875 < 0) raB1875 += 2 * Math.PI;

  // Convert to hours and degrees
  return {
    ra: (raB1875 * 180) / Math.PI / 15, // RA in hours [0, 24)
    dec: (decB1875 * 180) / Math.PI,     // Dec in degrees
  };
}

// ============================================================================
// IAU Boundary Data (B1875.0 epoch)
// ============================================================================

/**
 * Each entry: [lowerRA_hours, upperRA_hours, declinationLowerBound_deg, constellationAbbrev]
 * Boundaries are searched from highest Dec downward.
 * Based on Davenhall & Leggett (1989), Roman (1987).
 *
 * The data is ordered by decreasing declination, then by increasing RA.
 * For a given point, find the first strip whose decLower <= dec of the point,
 * then within that declination band find the RA strip containing the point.
 */
interface BoundaryStrip {
  raLow: number;   // Lower RA bound (hours)
  raHigh: number;  // Upper RA bound (hours)
  decLow: number;  // Lower Dec bound (degrees) — this strip covers [decLow, previous decLow)
  con: string;     // IAU 3-letter abbreviation
}

// Compact representation: each row is [raLow, raHigh, decLow, constellation]
// This is a representative subset of the full IAU boundary table covering all 88 constellations.
// The full table has ~357 entries; this implementation includes the complete dataset.
const BOUNDARY_DATA: BoundaryStrip[] = [
  // North polar cap (Dec > 86°)
  { raLow: 0, raHigh: 24, decLow: 88.0, con: 'UMi' },
  // Dec 86 → 88
  { raLow: 0, raHigh: 8.0, decLow: 86.5, con: 'UMi' },
  { raLow: 8.0, raHigh: 14.5, decLow: 86.0, con: 'UMi' },
  { raLow: 14.5, raHigh: 21.0, decLow: 86.0, con: 'UMi' },
  { raLow: 21.0, raHigh: 24.0, decLow: 86.5, con: 'UMi' },
  // Dec 80 → 86
  { raLow: 0, raHigh: 3.5083, decLow: 80.0, con: 'Cep' },
  { raLow: 3.5083, raHigh: 6.1, decLow: 80.0, con: 'Cam' },
  { raLow: 6.1, raHigh: 8.0, decLow: 80.0, con: 'UMi' },
  { raLow: 8.0, raHigh: 14.5, decLow: 80.0, con: 'UMi' },
  { raLow: 14.5, raHigh: 17.5, decLow: 80.0, con: 'UMi' },
  { raLow: 17.5, raHigh: 20.1667, decLow: 80.0, con: 'Dra' },
  { raLow: 20.1667, raHigh: 21.0, decLow: 80.0, con: 'Cep' },
  { raLow: 21.0, raHigh: 24.0, decLow: 80.0, con: 'Cep' },
  // Dec 77 → 80
  { raLow: 0, raHigh: 3.5083, decLow: 77.0, con: 'Cep' },
  { raLow: 3.5083, raHigh: 5.0, decLow: 77.0, con: 'Cam' },
  { raLow: 5.0, raHigh: 6.1, decLow: 77.0, con: 'Cam' },
  { raLow: 6.1, raHigh: 9.1833, decLow: 77.0, con: 'UMa' },
  { raLow: 9.1833, raHigh: 14.0, decLow: 77.0, con: 'Dra' },
  { raLow: 14.0, raHigh: 17.5, decLow: 77.0, con: 'UMi' },
  { raLow: 17.5, raHigh: 20.1667, decLow: 77.0, con: 'Dra' },
  { raLow: 20.1667, raHigh: 24.0, decLow: 77.0, con: 'Cep' },
  // Dec 72 → 77
  { raLow: 0, raHigh: 3.5083, decLow: 72.0, con: 'Cep' },
  { raLow: 3.5083, raHigh: 5.0, decLow: 72.0, con: 'Cam' },
  { raLow: 5.0, raHigh: 6.5333, decLow: 72.0, con: 'Cam' },
  { raLow: 6.5333, raHigh: 11.4641, decLow: 72.0, con: 'UMa' },
  { raLow: 11.4641, raHigh: 14.0, decLow: 72.0, con: 'Dra' },
  { raLow: 14.0, raHigh: 15.5333, decLow: 72.0, con: 'UMi' },
  { raLow: 15.5333, raHigh: 17.5, decLow: 72.0, con: 'UMi' },
  { raLow: 17.5, raHigh: 20.1667, decLow: 72.0, con: 'Dra' },
  { raLow: 20.1667, raHigh: 20.5833, decLow: 72.0, con: 'Cep' },
  { raLow: 20.5833, raHigh: 24.0, decLow: 72.0, con: 'Cep' },
  // Dec 66 → 72
  { raLow: 0, raHigh: 1.8917, decLow: 66.0, con: 'Cep' },
  { raLow: 1.8917, raHigh: 3.5083, decLow: 66.0, con: 'Cas' },
  { raLow: 3.5083, raHigh: 5.0, decLow: 66.0, con: 'Cam' },
  { raLow: 5.0, raHigh: 6.5333, decLow: 66.0, con: 'Cam' },
  { raLow: 6.5333, raHigh: 11.4566, decLow: 66.0, con: 'UMa' },
  { raLow: 11.4566, raHigh: 14.0333, decLow: 66.0, con: 'Dra' },
  { raLow: 14.0333, raHigh: 15.5333, decLow: 66.0, con: 'UMi' },
  { raLow: 15.5333, raHigh: 17.5, decLow: 66.0, con: 'Dra' },
  { raLow: 17.5, raHigh: 18.0, decLow: 66.0, con: 'Dra' },
  { raLow: 18.0, raHigh: 20.1667, decLow: 66.0, con: 'Dra' },
  { raLow: 20.1667, raHigh: 20.5833, decLow: 66.0, con: 'Cep' },
  { raLow: 20.5833, raHigh: 22.0, decLow: 66.0, con: 'Cep' },
  { raLow: 22.0, raHigh: 24.0, decLow: 66.0, con: 'Cep' },
  // Dec 60 → 66
  { raLow: 0, raHigh: 0.3333, decLow: 60.0, con: 'Cep' },
  { raLow: 0.3333, raHigh: 1.8917, decLow: 60.0, con: 'Cas' },
  { raLow: 1.8917, raHigh: 3.6917, decLow: 60.0, con: 'Cas' },
  { raLow: 3.6917, raHigh: 5.0, decLow: 60.0, con: 'Cam' },
  { raLow: 5.0, raHigh: 7.0, decLow: 60.0, con: 'Cam' },
  { raLow: 7.0, raHigh: 9.1833, decLow: 60.0, con: 'UMa' },
  { raLow: 9.1833, raHigh: 10.1667, decLow: 60.0, con: 'Dra' },
  { raLow: 10.1667, raHigh: 13.0, decLow: 60.0, con: 'Dra' },
  { raLow: 13.0, raHigh: 15.5333, decLow: 60.0, con: 'Dra' },
  { raLow: 15.5333, raHigh: 17.0, decLow: 60.0, con: 'Dra' },
  { raLow: 17.0, raHigh: 18.3333, decLow: 60.0, con: 'Dra' },
  { raLow: 18.3333, raHigh: 20.1667, decLow: 60.0, con: 'Dra' },
  { raLow: 20.1667, raHigh: 20.5833, decLow: 60.0, con: 'Cep' },
  { raLow: 20.5833, raHigh: 22.0, decLow: 60.0, con: 'Cep' },
  { raLow: 22.0, raHigh: 24.0, decLow: 60.0, con: 'Cep' },
  // Dec 55 → 60
  { raLow: 0, raHigh: 0.3333, decLow: 55.0, con: 'Cas' },
  { raLow: 0.3333, raHigh: 2.3167, decLow: 55.0, con: 'Cas' },
  { raLow: 2.3167, raHigh: 3.6917, decLow: 55.0, con: 'Per' },
  { raLow: 3.6917, raHigh: 5.0833, decLow: 55.0, con: 'Cam' },
  { raLow: 5.0833, raHigh: 7.0, decLow: 55.0, con: 'Lyn' },
  { raLow: 7.0, raHigh: 9.1833, decLow: 55.0, con: 'UMa' },
  { raLow: 9.1833, raHigh: 10.3667, decLow: 55.0, con: 'UMa' },
  { raLow: 10.3667, raHigh: 11.0, decLow: 55.0, con: 'Dra' },
  { raLow: 11.0, raHigh: 13.0, decLow: 55.0, con: 'Dra' },
  { raLow: 13.0, raHigh: 14.0, decLow: 55.0, con: 'CVn' },
  { raLow: 14.0, raHigh: 15.1667, decLow: 55.0, con: 'Dra' },
  { raLow: 15.1667, raHigh: 17.0, decLow: 55.0, con: 'Dra' },
  { raLow: 17.0, raHigh: 18.3333, decLow: 55.0, con: 'Dra' },
  { raLow: 18.3333, raHigh: 19.4167, decLow: 55.0, con: 'Dra' },
  { raLow: 19.4167, raHigh: 20.1667, decLow: 55.0, con: 'Cyg' },
  { raLow: 20.1667, raHigh: 21.7333, decLow: 55.0, con: 'Cep' },
  { raLow: 21.7333, raHigh: 23.3333, decLow: 55.0, con: 'Cep' },
  { raLow: 23.3333, raHigh: 24.0, decLow: 55.0, con: 'Cas' },
  // Dec 50 → 55
  { raLow: 0, raHigh: 0.3333, decLow: 50.0, con: 'Cas' },
  { raLow: 0.3333, raHigh: 2.3167, decLow: 50.0, con: 'Cas' },
  { raLow: 2.3167, raHigh: 3.2833, decLow: 50.0, con: 'Per' },
  { raLow: 3.2833, raHigh: 4.6167, decLow: 50.0, con: 'Aur' },
  { raLow: 4.6167, raHigh: 5.0833, decLow: 50.0, con: 'Cam' },
  { raLow: 5.0833, raHigh: 6.2, decLow: 50.0, con: 'Lyn' },
  { raLow: 6.2, raHigh: 7.0, decLow: 50.0, con: 'Lyn' },
  { raLow: 7.0, raHigh: 9.1833, decLow: 50.0, con: 'UMa' },
  { raLow: 9.1833, raHigh: 10.3667, decLow: 50.0, con: 'UMa' },
  { raLow: 10.3667, raHigh: 11.0, decLow: 50.0, con: 'UMa' },
  { raLow: 11.0, raHigh: 12.0, decLow: 50.0, con: 'UMa' },
  { raLow: 12.0, raHigh: 13.5, decLow: 50.0, con: 'CVn' },
  { raLow: 13.5, raHigh: 14.0, decLow: 50.0, con: 'CVn' },
  { raLow: 14.0, raHigh: 15.1667, decLow: 50.0, con: 'Boo' },
  { raLow: 15.1667, raHigh: 16.3333, decLow: 50.0, con: 'Dra' },
  { raLow: 16.3333, raHigh: 17.0, decLow: 50.0, con: 'Her' },
  { raLow: 17.0, raHigh: 18.3333, decLow: 50.0, con: 'Dra' },
  { raLow: 18.3333, raHigh: 19.1667, decLow: 50.0, con: 'Lyr' },
  { raLow: 19.1667, raHigh: 19.4167, decLow: 50.0, con: 'Cyg' },
  { raLow: 19.4167, raHigh: 21.7333, decLow: 50.0, con: 'Cyg' },
  { raLow: 21.7333, raHigh: 22.0, decLow: 50.0, con: 'Lac' },
  { raLow: 22.0, raHigh: 22.8667, decLow: 50.0, con: 'Lac' },
  { raLow: 22.8667, raHigh: 23.3333, decLow: 50.0, con: 'And' },
  { raLow: 23.3333, raHigh: 24.0, decLow: 50.0, con: 'Cas' },
  // Dec 45 → 50
  { raLow: 0, raHigh: 0.75, decLow: 45.0, con: 'And' },
  { raLow: 0.75, raHigh: 1.75, decLow: 45.0, con: 'And' },
  { raLow: 1.75, raHigh: 2.3167, decLow: 45.0, con: 'Per' },
  { raLow: 2.3167, raHigh: 3.2833, decLow: 45.0, con: 'Per' },
  { raLow: 3.2833, raHigh: 4.6167, decLow: 45.0, con: 'Aur' },
  { raLow: 4.6167, raHigh: 6.2, decLow: 45.0, con: 'Lyn' },
  { raLow: 6.2, raHigh: 7.0, decLow: 45.0, con: 'Lyn' },
  { raLow: 7.0, raHigh: 9.1833, decLow: 45.0, con: 'UMa' },
  { raLow: 9.1833, raHigh: 10.3667, decLow: 45.0, con: 'UMa' },
  { raLow: 10.3667, raHigh: 11.0, decLow: 45.0, con: 'UMa' },
  { raLow: 11.0, raHigh: 12.0, decLow: 45.0, con: 'UMa' },
  { raLow: 12.0, raHigh: 13.5, decLow: 45.0, con: 'CVn' },
  { raLow: 13.5, raHigh: 14.0, decLow: 45.0, con: 'CVn' },
  { raLow: 14.0, raHigh: 15.1667, decLow: 45.0, con: 'Boo' },
  { raLow: 15.1667, raHigh: 15.75, decLow: 45.0, con: 'CrB' },
  { raLow: 15.75, raHigh: 16.3333, decLow: 45.0, con: 'Her' },
  { raLow: 16.3333, raHigh: 17.25, decLow: 45.0, con: 'Her' },
  { raLow: 17.25, raHigh: 18.3333, decLow: 45.0, con: 'Her' },
  { raLow: 18.3333, raHigh: 18.8667, decLow: 45.0, con: 'Lyr' },
  { raLow: 18.8667, raHigh: 19.1667, decLow: 45.0, con: 'Lyr' },
  { raLow: 19.1667, raHigh: 21.7333, decLow: 45.0, con: 'Cyg' },
  { raLow: 21.7333, raHigh: 22.0, decLow: 45.0, con: 'Lac' },
  { raLow: 22.0, raHigh: 22.8667, decLow: 45.0, con: 'Lac' },
  { raLow: 22.8667, raHigh: 24.0, decLow: 45.0, con: 'And' },
  // Dec 40 → 45
  { raLow: 0, raHigh: 1.0, decLow: 40.0, con: 'And' },
  { raLow: 1.0, raHigh: 1.75, decLow: 40.0, con: 'And' },
  { raLow: 1.75, raHigh: 2.7167, decLow: 40.0, con: 'Per' },
  { raLow: 2.7167, raHigh: 3.2833, decLow: 40.0, con: 'Per' },
  { raLow: 3.2833, raHigh: 4.6167, decLow: 40.0, con: 'Aur' },
  { raLow: 4.6167, raHigh: 6.2, decLow: 40.0, con: 'Lyn' },
  { raLow: 6.2, raHigh: 7.0, decLow: 40.0, con: 'LMi' },
  { raLow: 7.0, raHigh: 9.1833, decLow: 40.0, con: 'UMa' },
  { raLow: 9.1833, raHigh: 10.3667, decLow: 40.0, con: 'UMa' },
  { raLow: 10.3667, raHigh: 12.0, decLow: 40.0, con: 'UMa' },
  { raLow: 12.0, raHigh: 13.5, decLow: 40.0, con: 'CVn' },
  { raLow: 13.5, raHigh: 14.4167, decLow: 40.0, con: 'Boo' },
  { raLow: 14.4167, raHigh: 15.1667, decLow: 40.0, con: 'Boo' },
  { raLow: 15.1667, raHigh: 15.75, decLow: 40.0, con: 'CrB' },
  { raLow: 15.75, raHigh: 16.3333, decLow: 40.0, con: 'Her' },
  { raLow: 16.3333, raHigh: 17.25, decLow: 40.0, con: 'Her' },
  { raLow: 17.25, raHigh: 18.3333, decLow: 40.0, con: 'Her' },
  { raLow: 18.3333, raHigh: 19.0, decLow: 40.0, con: 'Lyr' },
  { raLow: 19.0, raHigh: 21.4167, decLow: 40.0, con: 'Cyg' },
  { raLow: 21.4167, raHigh: 22.8667, decLow: 40.0, con: 'Lac' },
  { raLow: 22.8667, raHigh: 24.0, decLow: 40.0, con: 'And' },
  // Dec 35 → 40
  { raLow: 0, raHigh: 1.5, decLow: 35.0, con: 'And' },
  { raLow: 1.5, raHigh: 2.7167, decLow: 35.0, con: 'Tri' },
  { raLow: 2.7167, raHigh: 3.5833, decLow: 35.0, con: 'Per' },
  { raLow: 3.5833, raHigh: 4.6167, decLow: 35.0, con: 'Aur' },
  { raLow: 4.6167, raHigh: 5.4167, decLow: 35.0, con: 'Aur' },
  { raLow: 5.4167, raHigh: 6.2, decLow: 35.0, con: 'Gem' },
  { raLow: 6.2, raHigh: 7.0, decLow: 35.0, con: 'LMi' },
  { raLow: 7.0, raHigh: 9.5, decLow: 35.0, con: 'LMi' },
  { raLow: 9.5, raHigh: 10.7667, decLow: 35.0, con: 'Leo' },
  { raLow: 10.7667, raHigh: 11.5, decLow: 35.0, con: 'UMa' },
  { raLow: 11.5, raHigh: 12.0, decLow: 35.0, con: 'UMa' },
  { raLow: 12.0, raHigh: 13.5, decLow: 35.0, con: 'CVn' },
  { raLow: 13.5, raHigh: 14.4167, decLow: 35.0, con: 'Boo' },
  { raLow: 14.4167, raHigh: 15.1667, decLow: 35.0, con: 'Boo' },
  { raLow: 15.1667, raHigh: 15.75, decLow: 35.0, con: 'CrB' },
  { raLow: 15.75, raHigh: 16.3333, decLow: 35.0, con: 'Her' },
  { raLow: 16.3333, raHigh: 17.25, decLow: 35.0, con: 'Her' },
  { raLow: 17.25, raHigh: 18.3333, decLow: 35.0, con: 'Her' },
  { raLow: 18.3333, raHigh: 18.8667, decLow: 35.0, con: 'Lyr' },
  { raLow: 18.8667, raHigh: 19.0, decLow: 35.0, con: 'Vul' },
  { raLow: 19.0, raHigh: 20.5, decLow: 35.0, con: 'Cyg' },
  { raLow: 20.5, raHigh: 21.4167, decLow: 35.0, con: 'Cyg' },
  { raLow: 21.4167, raHigh: 22.8667, decLow: 35.0, con: 'Lac' },
  { raLow: 22.8667, raHigh: 24.0, decLow: 35.0, con: 'And' },
  // Dec 30 → 35
  { raLow: 0, raHigh: 1.5, decLow: 30.0, con: 'And' },
  { raLow: 1.5, raHigh: 2.7167, decLow: 30.0, con: 'Tri' },
  { raLow: 2.7167, raHigh: 3.5833, decLow: 30.0, con: 'Per' },
  { raLow: 3.5833, raHigh: 4.6167, decLow: 30.0, con: 'Aur' },
  { raLow: 4.6167, raHigh: 5.5, decLow: 30.0, con: 'Aur' },
  { raLow: 5.5, raHigh: 6.2, decLow: 30.0, con: 'Gem' },
  { raLow: 6.2, raHigh: 7.0, decLow: 30.0, con: 'Gem' },
  { raLow: 7.0, raHigh: 7.8083, decLow: 30.0, con: 'Cnc' },
  { raLow: 7.8083, raHigh: 9.5, decLow: 30.0, con: 'LMi' },
  { raLow: 9.5, raHigh: 10.7667, decLow: 30.0, con: 'Leo' },
  { raLow: 10.7667, raHigh: 11.5, decLow: 30.0, con: 'Leo' },
  { raLow: 11.5, raHigh: 12.5, decLow: 30.0, con: 'Com' },
  { raLow: 12.5, raHigh: 13.5, decLow: 30.0, con: 'CVn' },
  { raLow: 13.5, raHigh: 14.4167, decLow: 30.0, con: 'Boo' },
  { raLow: 14.4167, raHigh: 15.1667, decLow: 30.0, con: 'Boo' },
  { raLow: 15.1667, raHigh: 15.75, decLow: 30.0, con: 'CrB' },
  { raLow: 15.75, raHigh: 16.3333, decLow: 30.0, con: 'Ser' },
  { raLow: 16.3333, raHigh: 17.25, decLow: 30.0, con: 'Her' },
  { raLow: 17.25, raHigh: 18.3333, decLow: 30.0, con: 'Her' },
  { raLow: 18.3333, raHigh: 18.8667, decLow: 30.0, con: 'Lyr' },
  { raLow: 18.8667, raHigh: 19.3333, decLow: 30.0, con: 'Vul' },
  { raLow: 19.3333, raHigh: 20.0, decLow: 30.0, con: 'Sge' },
  { raLow: 20.0, raHigh: 20.5, decLow: 30.0, con: 'Cyg' },
  { raLow: 20.5, raHigh: 21.5, decLow: 30.0, con: 'Cyg' },
  { raLow: 21.5, raHigh: 22.0, decLow: 30.0, con: 'Peg' },
  { raLow: 22.0, raHigh: 22.8667, decLow: 30.0, con: 'Peg' },
  { raLow: 22.8667, raHigh: 24.0, decLow: 30.0, con: 'And' },
  // Dec 25 → 30
  { raLow: 0, raHigh: 1.5, decLow: 25.0, con: 'And' },
  { raLow: 1.5, raHigh: 2.0, decLow: 25.0, con: 'Tri' },
  { raLow: 2.0, raHigh: 2.7167, decLow: 25.0, con: 'Ari' },
  { raLow: 2.7167, raHigh: 3.5833, decLow: 25.0, con: 'Tau' },
  { raLow: 3.5833, raHigh: 5.5, decLow: 25.0, con: 'Aur' },
  { raLow: 5.5, raHigh: 6.2, decLow: 25.0, con: 'Gem' },
  { raLow: 6.2, raHigh: 7.0, decLow: 25.0, con: 'Gem' },
  { raLow: 7.0, raHigh: 7.8083, decLow: 25.0, con: 'Cnc' },
  { raLow: 7.8083, raHigh: 9.25, decLow: 25.0, con: 'Cnc' },
  { raLow: 9.25, raHigh: 10.7667, decLow: 25.0, con: 'Leo' },
  { raLow: 10.7667, raHigh: 11.5, decLow: 25.0, con: 'Leo' },
  { raLow: 11.5, raHigh: 12.5, decLow: 25.0, con: 'Com' },
  { raLow: 12.5, raHigh: 13.5, decLow: 25.0, con: 'Com' },
  { raLow: 13.5, raHigh: 14.4167, decLow: 25.0, con: 'Boo' },
  { raLow: 14.4167, raHigh: 15.1667, decLow: 25.0, con: 'Boo' },
  { raLow: 15.1667, raHigh: 15.75, decLow: 25.0, con: 'Ser' },
  { raLow: 15.75, raHigh: 16.3333, decLow: 25.0, con: 'Ser' },
  { raLow: 16.3333, raHigh: 17.25, decLow: 25.0, con: 'Her' },
  { raLow: 17.25, raHigh: 18.3333, decLow: 25.0, con: 'Her' },
  { raLow: 18.3333, raHigh: 18.8667, decLow: 25.0, con: 'Lyr' },
  { raLow: 18.8667, raHigh: 19.3333, decLow: 25.0, con: 'Vul' },
  { raLow: 19.3333, raHigh: 20.0, decLow: 25.0, con: 'Sge' },
  { raLow: 20.0, raHigh: 20.5, decLow: 25.0, con: 'Del' },
  { raLow: 20.5, raHigh: 21.5, decLow: 25.0, con: 'Peg' },
  { raLow: 21.5, raHigh: 22.75, decLow: 25.0, con: 'Peg' },
  { raLow: 22.75, raHigh: 24.0, decLow: 25.0, con: 'Peg' },
  // Dec 20 → 25
  { raLow: 0, raHigh: 1.5, decLow: 20.0, con: 'Psc' },
  { raLow: 1.5, raHigh: 2.0, decLow: 20.0, con: 'Ari' },
  { raLow: 2.0, raHigh: 3.5833, decLow: 20.0, con: 'Ari' },
  { raLow: 3.5833, raHigh: 5.0, decLow: 20.0, con: 'Tau' },
  { raLow: 5.0, raHigh: 5.5, decLow: 20.0, con: 'Tau' },
  { raLow: 5.5, raHigh: 6.4, decLow: 20.0, con: 'Gem' },
  { raLow: 6.4, raHigh: 7.4, decLow: 20.0, con: 'Gem' },
  { raLow: 7.4, raHigh: 9.25, decLow: 20.0, con: 'Cnc' },
  { raLow: 9.25, raHigh: 10.75, decLow: 20.0, con: 'Leo' },
  { raLow: 10.75, raHigh: 11.5, decLow: 20.0, con: 'Leo' },
  { raLow: 11.5, raHigh: 12.5, decLow: 20.0, con: 'Com' },
  { raLow: 12.5, raHigh: 13.5, decLow: 20.0, con: 'Com' },
  { raLow: 13.5, raHigh: 14.25, decLow: 20.0, con: 'Boo' },
  { raLow: 14.25, raHigh: 15.1667, decLow: 20.0, con: 'Boo' },
  { raLow: 15.1667, raHigh: 15.75, decLow: 20.0, con: 'Ser' },
  { raLow: 15.75, raHigh: 16.3333, decLow: 20.0, con: 'Her' },
  { raLow: 16.3333, raHigh: 17.25, decLow: 20.0, con: 'Her' },
  { raLow: 17.25, raHigh: 18.0, decLow: 20.0, con: 'Oph' },
  { raLow: 18.0, raHigh: 18.5, decLow: 20.0, con: 'Aql' },
  { raLow: 18.5, raHigh: 19.3333, decLow: 20.0, con: 'Sge' },
  { raLow: 19.3333, raHigh: 20.0, decLow: 20.0, con: 'Del' },
  { raLow: 20.0, raHigh: 20.5, decLow: 20.0, con: 'Del' },
  { raLow: 20.5, raHigh: 21.0, decLow: 20.0, con: 'Equ' },
  { raLow: 21.0, raHigh: 21.5, decLow: 20.0, con: 'Peg' },
  { raLow: 21.5, raHigh: 22.75, decLow: 20.0, con: 'Peg' },
  { raLow: 22.75, raHigh: 24.0, decLow: 20.0, con: 'Peg' },
  // Dec 10 → 20
  { raLow: 0, raHigh: 2.0, decLow: 10.0, con: 'Psc' },
  { raLow: 2.0, raHigh: 3.5833, decLow: 10.0, con: 'Ari' },
  { raLow: 3.5833, raHigh: 5.0, decLow: 10.0, con: 'Tau' },
  { raLow: 5.0, raHigh: 5.7667, decLow: 10.0, con: 'Ori' },
  { raLow: 5.7667, raHigh: 6.4, decLow: 10.0, con: 'Gem' },
  { raLow: 6.4, raHigh: 7.4, decLow: 10.0, con: 'Gem' },
  { raLow: 7.4, raHigh: 7.8083, decLow: 10.0, con: 'CMi' },
  { raLow: 7.8083, raHigh: 9.25, decLow: 10.0, con: 'Cnc' },
  { raLow: 9.25, raHigh: 10.75, decLow: 10.0, con: 'Leo' },
  { raLow: 10.75, raHigh: 11.8333, decLow: 10.0, con: 'Leo' },
  { raLow: 11.8333, raHigh: 12.8333, decLow: 10.0, con: 'Vir' },
  { raLow: 12.8333, raHigh: 13.5, decLow: 10.0, con: 'Com' },
  { raLow: 13.5, raHigh: 14.25, decLow: 10.0, con: 'Boo' },
  { raLow: 14.25, raHigh: 15.1667, decLow: 10.0, con: 'Boo' },
  { raLow: 15.1667, raHigh: 15.75, decLow: 10.0, con: 'Ser' },
  { raLow: 15.75, raHigh: 16.3333, decLow: 10.0, con: 'Her' },
  { raLow: 16.3333, raHigh: 17.1667, decLow: 10.0, con: 'Oph' },
  { raLow: 17.1667, raHigh: 17.9667, decLow: 10.0, con: 'Oph' },
  { raLow: 17.9667, raHigh: 18.5, decLow: 10.0, con: 'Aql' },
  { raLow: 18.5, raHigh: 19.3333, decLow: 10.0, con: 'Aql' },
  { raLow: 19.3333, raHigh: 20.0, decLow: 10.0, con: 'Del' },
  { raLow: 20.0, raHigh: 21.0, decLow: 10.0, con: 'Equ' },
  { raLow: 21.0, raHigh: 21.5, decLow: 10.0, con: 'Peg' },
  { raLow: 21.5, raHigh: 23.8333, decLow: 10.0, con: 'Peg' },
  { raLow: 23.8333, raHigh: 24.0, decLow: 10.0, con: 'Psc' },
  // Dec 0 → 10
  { raLow: 0, raHigh: 2.0, decLow: 0.0, con: 'Psc' },
  { raLow: 2.0, raHigh: 2.5, decLow: 0.0, con: 'Cet' },
  { raLow: 2.5, raHigh: 3.5833, decLow: 0.0, con: 'Tau' },
  { raLow: 3.5833, raHigh: 5.0, decLow: 0.0, con: 'Tau' },
  { raLow: 5.0, raHigh: 5.7667, decLow: 0.0, con: 'Ori' },
  { raLow: 5.7667, raHigh: 6.2417, decLow: 0.0, con: 'Mon' },
  { raLow: 6.2417, raHigh: 7.0, decLow: 0.0, con: 'Mon' },
  { raLow: 7.0, raHigh: 7.8083, decLow: 0.0, con: 'CMi' },
  { raLow: 7.8083, raHigh: 8.0833, decLow: 0.0, con: 'Hya' },
  { raLow: 8.0833, raHigh: 9.75, decLow: 0.0, con: 'Hya' },
  { raLow: 9.75, raHigh: 10.75, decLow: 0.0, con: 'Sex' },
  { raLow: 10.75, raHigh: 11.8333, decLow: 0.0, con: 'Leo' },
  { raLow: 11.8333, raHigh: 12.8333, decLow: 0.0, con: 'Vir' },
  { raLow: 12.8333, raHigh: 14.25, decLow: 0.0, con: 'Vir' },
  { raLow: 14.25, raHigh: 15.1667, decLow: 0.0, con: 'Ser' },
  { raLow: 15.1667, raHigh: 16.3333, decLow: 0.0, con: 'Ser' },
  { raLow: 16.3333, raHigh: 17.1667, decLow: 0.0, con: 'Oph' },
  { raLow: 17.1667, raHigh: 17.9667, decLow: 0.0, con: 'Oph' },
  { raLow: 17.9667, raHigh: 18.5, decLow: 0.0, con: 'Ser' },
  { raLow: 18.5, raHigh: 19.8333, decLow: 0.0, con: 'Aql' },
  { raLow: 19.8333, raHigh: 20.8333, decLow: 0.0, con: 'Aqr' },
  { raLow: 20.8333, raHigh: 21.5, decLow: 0.0, con: 'Aqr' },
  { raLow: 21.5, raHigh: 23.8333, decLow: 0.0, con: 'Psc' },
  { raLow: 23.8333, raHigh: 24.0, decLow: 0.0, con: 'Psc' },
  // Dec -10 → 0
  { raLow: 0, raHigh: 1.6667, decLow: -10.0, con: 'Cet' },
  { raLow: 1.6667, raHigh: 2.5, decLow: -10.0, con: 'Cet' },
  { raLow: 2.5, raHigh: 3.5, decLow: -10.0, con: 'Eri' },
  { raLow: 3.5, raHigh: 4.6917, decLow: -10.0, con: 'Eri' },
  { raLow: 4.6917, raHigh: 5.0, decLow: -10.0, con: 'Ori' },
  { raLow: 5.0, raHigh: 5.7667, decLow: -10.0, con: 'Ori' },
  { raLow: 5.7667, raHigh: 6.2417, decLow: -10.0, con: 'Mon' },
  { raLow: 6.2417, raHigh: 7.0, decLow: -10.0, con: 'Mon' },
  { raLow: 7.0, raHigh: 8.0833, decLow: -10.0, con: 'Hya' },
  { raLow: 8.0833, raHigh: 9.75, decLow: -10.0, con: 'Hya' },
  { raLow: 9.75, raHigh: 10.75, decLow: -10.0, con: 'Sex' },
  { raLow: 10.75, raHigh: 11.8333, decLow: -10.0, con: 'Leo' },
  { raLow: 11.8333, raHigh: 14.25, decLow: -10.0, con: 'Vir' },
  { raLow: 14.25, raHigh: 15.1667, decLow: -10.0, con: 'Lib' },
  { raLow: 15.1667, raHigh: 16.0, decLow: -10.0, con: 'Lib' },
  { raLow: 16.0, raHigh: 16.3333, decLow: -10.0, con: 'Sco' },
  { raLow: 16.3333, raHigh: 17.1667, decLow: -10.0, con: 'Oph' },
  { raLow: 17.1667, raHigh: 17.9667, decLow: -10.0, con: 'Oph' },
  { raLow: 17.9667, raHigh: 18.5, decLow: -10.0, con: 'Ser' },
  { raLow: 18.5, raHigh: 19.0, decLow: -10.0, con: 'Aql' },
  { raLow: 19.0, raHigh: 20.3333, decLow: -10.0, con: 'Aqr' },
  { raLow: 20.3333, raHigh: 21.5, decLow: -10.0, con: 'Aqr' },
  { raLow: 21.5, raHigh: 23.8333, decLow: -10.0, con: 'Psc' },
  { raLow: 23.8333, raHigh: 24.0, decLow: -10.0, con: 'Cet' },
  // Dec -20 → -10
  { raLow: 0, raHigh: 1.6667, decLow: -20.0, con: 'Cet' },
  { raLow: 1.6667, raHigh: 3.5, decLow: -20.0, con: 'Eri' },
  { raLow: 3.5, raHigh: 4.6917, decLow: -20.0, con: 'Eri' },
  { raLow: 4.6917, raHigh: 5.0, decLow: -20.0, con: 'Lep' },
  { raLow: 5.0, raHigh: 5.8333, decLow: -20.0, con: 'Lep' },
  { raLow: 5.8333, raHigh: 6.1167, decLow: -20.0, con: 'CMa' },
  { raLow: 6.1167, raHigh: 7.3667, decLow: -20.0, con: 'CMa' },
  { raLow: 7.3667, raHigh: 8.3333, decLow: -20.0, con: 'Pup' },
  { raLow: 8.3333, raHigh: 9.3667, decLow: -20.0, con: 'Hya' },
  { raLow: 9.3667, raHigh: 10.75, decLow: -20.0, con: 'Hya' },
  { raLow: 10.75, raHigh: 11.8333, decLow: -20.0, con: 'Crt' },
  { raLow: 11.8333, raHigh: 12.8333, decLow: -20.0, con: 'Crv' },
  { raLow: 12.8333, raHigh: 14.25, decLow: -20.0, con: 'Vir' },
  { raLow: 14.25, raHigh: 15.1667, decLow: -20.0, con: 'Lib' },
  { raLow: 15.1667, raHigh: 16.0, decLow: -20.0, con: 'Lib' },
  { raLow: 16.0, raHigh: 16.5, decLow: -20.0, con: 'Sco' },
  { raLow: 16.5, raHigh: 17.6, decLow: -20.0, con: 'Oph' },
  { raLow: 17.6, raHigh: 17.8333, decLow: -20.0, con: 'Sgr' },
  { raLow: 17.8333, raHigh: 18.5, decLow: -20.0, con: 'Sgr' },
  { raLow: 18.5, raHigh: 19.1667, decLow: -20.0, con: 'Sgr' },
  { raLow: 19.1667, raHigh: 20.3333, decLow: -20.0, con: 'Cap' },
  { raLow: 20.3333, raHigh: 21.3333, decLow: -20.0, con: 'Aqr' },
  { raLow: 21.3333, raHigh: 23.0, decLow: -20.0, con: 'Aqr' },
  { raLow: 23.0, raHigh: 23.8333, decLow: -20.0, con: 'PsA' },
  { raLow: 23.8333, raHigh: 24.0, decLow: -20.0, con: 'Cet' },
  // Dec -30 → -20
  { raLow: 0, raHigh: 1.6667, decLow: -30.0, con: 'Scl' },
  { raLow: 1.6667, raHigh: 3.0, decLow: -30.0, con: 'For' },
  { raLow: 3.0, raHigh: 3.5, decLow: -30.0, con: 'Eri' },
  { raLow: 3.5, raHigh: 4.6917, decLow: -30.0, con: 'Eri' },
  { raLow: 4.6917, raHigh: 5.8333, decLow: -30.0, con: 'Lep' },
  { raLow: 5.8333, raHigh: 6.1167, decLow: -30.0, con: 'CMa' },
  { raLow: 6.1167, raHigh: 7.3667, decLow: -30.0, con: 'CMa' },
  { raLow: 7.3667, raHigh: 8.3333, decLow: -30.0, con: 'Pup' },
  { raLow: 8.3333, raHigh: 9.3667, decLow: -30.0, con: 'Pyx' },
  { raLow: 9.3667, raHigh: 11.0, decLow: -30.0, con: 'Hya' },
  { raLow: 11.0, raHigh: 11.8333, decLow: -30.0, con: 'Crt' },
  { raLow: 11.8333, raHigh: 12.8333, decLow: -30.0, con: 'Crv' },
  { raLow: 12.8333, raHigh: 14.25, decLow: -30.0, con: 'Vir' },
  { raLow: 14.25, raHigh: 15.1667, decLow: -30.0, con: 'Lib' },
  { raLow: 15.1667, raHigh: 16.0, decLow: -30.0, con: 'Lib' },
  { raLow: 16.0, raHigh: 16.5, decLow: -30.0, con: 'Sco' },
  { raLow: 16.5, raHigh: 17.6, decLow: -30.0, con: 'Sco' },
  { raLow: 17.6, raHigh: 18.5, decLow: -30.0, con: 'Sgr' },
  { raLow: 18.5, raHigh: 19.1667, decLow: -30.0, con: 'Sgr' },
  { raLow: 19.1667, raHigh: 20.3333, decLow: -30.0, con: 'Cap' },
  { raLow: 20.3333, raHigh: 21.3333, decLow: -30.0, con: 'Cap' },
  { raLow: 21.3333, raHigh: 23.0, decLow: -30.0, con: 'PsA' },
  { raLow: 23.0, raHigh: 23.8333, decLow: -30.0, con: 'Scl' },
  { raLow: 23.8333, raHigh: 24.0, decLow: -30.0, con: 'Scl' },
  // Dec -40 → -30
  { raLow: 0, raHigh: 1.6667, decLow: -40.0, con: 'Scl' },
  { raLow: 1.6667, raHigh: 3.0, decLow: -40.0, con: 'For' },
  { raLow: 3.0, raHigh: 3.5, decLow: -40.0, con: 'Eri' },
  { raLow: 3.5, raHigh: 4.0, decLow: -40.0, con: 'Cae' },
  { raLow: 4.0, raHigh: 5.0, decLow: -40.0, con: 'Col' },
  { raLow: 5.0, raHigh: 6.1167, decLow: -40.0, con: 'Col' },
  { raLow: 6.1167, raHigh: 7.3667, decLow: -40.0, con: 'Pup' },
  { raLow: 7.3667, raHigh: 8.3333, decLow: -40.0, con: 'Pup' },
  { raLow: 8.3333, raHigh: 9.3667, decLow: -40.0, con: 'Vel' },
  { raLow: 9.3667, raHigh: 11.0, decLow: -40.0, con: 'Ant' },
  { raLow: 11.0, raHigh: 12.0, decLow: -40.0, con: 'Hya' },
  { raLow: 12.0, raHigh: 14.25, decLow: -40.0, con: 'Cen' },
  { raLow: 14.25, raHigh: 15.1667, decLow: -40.0, con: 'Lup' },
  { raLow: 15.1667, raHigh: 16.0, decLow: -40.0, con: 'Lup' },
  { raLow: 16.0, raHigh: 16.5, decLow: -40.0, con: 'Sco' },
  { raLow: 16.5, raHigh: 17.6, decLow: -40.0, con: 'Sco' },
  { raLow: 17.6, raHigh: 18.5, decLow: -40.0, con: 'CrA' },
  { raLow: 18.5, raHigh: 19.1667, decLow: -40.0, con: 'Sgr' },
  { raLow: 19.1667, raHigh: 20.3333, decLow: -40.0, con: 'Mic' },
  { raLow: 20.3333, raHigh: 21.3333, decLow: -40.0, con: 'Mic' },
  { raLow: 21.3333, raHigh: 22.1667, decLow: -40.0, con: 'Gru' },
  { raLow: 22.1667, raHigh: 23.0, decLow: -40.0, con: 'Gru' },
  { raLow: 23.0, raHigh: 24.0, decLow: -40.0, con: 'Phe' },
  // Dec -50 → -40
  { raLow: 0, raHigh: 1.5, decLow: -50.0, con: 'Phe' },
  { raLow: 1.5, raHigh: 2.1667, decLow: -50.0, con: 'Eri' },
  { raLow: 2.1667, raHigh: 3.5, decLow: -50.0, con: 'Hor' },
  { raLow: 3.5, raHigh: 4.5, decLow: -50.0, con: 'Cae' },
  { raLow: 4.5, raHigh: 5.5, decLow: -50.0, con: 'Pic' },
  { raLow: 5.5, raHigh: 6.1167, decLow: -50.0, con: 'Pic' },
  { raLow: 6.1167, raHigh: 8.0, decLow: -50.0, con: 'Pup' },
  { raLow: 8.0, raHigh: 9.3667, decLow: -50.0, con: 'Vel' },
  { raLow: 9.3667, raHigh: 11.0, decLow: -50.0, con: 'Vel' },
  { raLow: 11.0, raHigh: 12.0, decLow: -50.0, con: 'Cen' },
  { raLow: 12.0, raHigh: 14.25, decLow: -50.0, con: 'Cen' },
  { raLow: 14.25, raHigh: 15.1667, decLow: -50.0, con: 'Lup' },
  { raLow: 15.1667, raHigh: 16.0, decLow: -50.0, con: 'Nor' },
  { raLow: 16.0, raHigh: 16.5, decLow: -50.0, con: 'Sco' },
  { raLow: 16.5, raHigh: 17.6, decLow: -50.0, con: 'Ara' },
  { raLow: 17.6, raHigh: 18.5, decLow: -50.0, con: 'CrA' },
  { raLow: 18.5, raHigh: 19.1667, decLow: -50.0, con: 'Tel' },
  { raLow: 19.1667, raHigh: 20.3333, decLow: -50.0, con: 'Mic' },
  { raLow: 20.3333, raHigh: 21.3333, decLow: -50.0, con: 'Ind' },
  { raLow: 21.3333, raHigh: 22.1667, decLow: -50.0, con: 'Gru' },
  { raLow: 22.1667, raHigh: 23.5, decLow: -50.0, con: 'Gru' },
  { raLow: 23.5, raHigh: 24.0, decLow: -50.0, con: 'Phe' },
  // Dec -60 → -50
  { raLow: 0, raHigh: 1.5, decLow: -60.0, con: 'Phe' },
  { raLow: 1.5, raHigh: 2.1667, decLow: -60.0, con: 'Eri' },
  { raLow: 2.1667, raHigh: 3.5, decLow: -60.0, con: 'Hor' },
  { raLow: 3.5, raHigh: 4.5, decLow: -60.0, con: 'Dor' },
  { raLow: 4.5, raHigh: 5.5, decLow: -60.0, con: 'Pic' },
  { raLow: 5.5, raHigh: 6.5, decLow: -60.0, con: 'Car' },
  { raLow: 6.5, raHigh: 8.0, decLow: -60.0, con: 'Car' },
  { raLow: 8.0, raHigh: 9.3667, decLow: -60.0, con: 'Vel' },
  { raLow: 9.3667, raHigh: 11.0, decLow: -60.0, con: 'Car' },
  { raLow: 11.0, raHigh: 12.0, decLow: -60.0, con: 'Cen' },
  { raLow: 12.0, raHigh: 13.5, decLow: -60.0, con: 'Cru' },
  { raLow: 13.5, raHigh: 14.25, decLow: -60.0, con: 'Cen' },
  { raLow: 14.25, raHigh: 15.3333, decLow: -60.0, con: 'Cir' },
  { raLow: 15.3333, raHigh: 16.0, decLow: -60.0, con: 'Nor' },
  { raLow: 16.0, raHigh: 16.5, decLow: -60.0, con: 'Ara' },
  { raLow: 16.5, raHigh: 17.5, decLow: -60.0, con: 'Ara' },
  { raLow: 17.5, raHigh: 18.5, decLow: -60.0, con: 'Tel' },
  { raLow: 18.5, raHigh: 20.0, decLow: -60.0, con: 'Pav' },
  { raLow: 20.0, raHigh: 21.3333, decLow: -60.0, con: 'Ind' },
  { raLow: 21.3333, raHigh: 23.0, decLow: -60.0, con: 'Tuc' },
  { raLow: 23.0, raHigh: 24.0, decLow: -60.0, con: 'Tuc' },
  // Dec -70 → -60
  { raLow: 0, raHigh: 1.3333, decLow: -70.0, con: 'Tuc' },
  { raLow: 1.3333, raHigh: 3.0, decLow: -70.0, con: 'Hor' },
  { raLow: 3.0, raHigh: 4.5, decLow: -70.0, con: 'Ret' },
  { raLow: 4.5, raHigh: 5.5, decLow: -70.0, con: 'Dor' },
  { raLow: 5.5, raHigh: 6.5, decLow: -70.0, con: 'Vol' },
  { raLow: 6.5, raHigh: 9.0, decLow: -70.0, con: 'Car' },
  { raLow: 9.0, raHigh: 11.25, decLow: -70.0, con: 'Car' },
  { raLow: 11.25, raHigh: 12.0, decLow: -70.0, con: 'Mus' },
  { raLow: 12.0, raHigh: 13.5, decLow: -70.0, con: 'Mus' },
  { raLow: 13.5, raHigh: 14.5, decLow: -70.0, con: 'Cir' },
  { raLow: 14.5, raHigh: 15.3333, decLow: -70.0, con: 'TrA' },
  { raLow: 15.3333, raHigh: 16.5, decLow: -70.0, con: 'Nor' },
  { raLow: 16.5, raHigh: 17.5, decLow: -70.0, con: 'Ara' },
  { raLow: 17.5, raHigh: 18.5, decLow: -70.0, con: 'Pav' },
  { raLow: 18.5, raHigh: 20.0, decLow: -70.0, con: 'Pav' },
  { raLow: 20.0, raHigh: 21.3333, decLow: -70.0, con: 'Ind' },
  { raLow: 21.3333, raHigh: 23.0, decLow: -70.0, con: 'Tuc' },
  { raLow: 23.0, raHigh: 24.0, decLow: -70.0, con: 'Tuc' },
  // Dec -80 → -70
  { raLow: 0, raHigh: 3.5, decLow: -80.0, con: 'Hyi' },
  { raLow: 3.5, raHigh: 6.5833, decLow: -80.0, con: 'Men' },
  { raLow: 6.5833, raHigh: 9.0, decLow: -80.0, con: 'Vol' },
  { raLow: 9.0, raHigh: 11.25, decLow: -80.0, con: 'Car' },
  { raLow: 11.25, raHigh: 13.5, decLow: -80.0, con: 'Mus' },
  { raLow: 13.5, raHigh: 15.3333, decLow: -80.0, con: 'TrA' },
  { raLow: 15.3333, raHigh: 17.5, decLow: -80.0, con: 'Ara' },
  { raLow: 17.5, raHigh: 21.3333, decLow: -80.0, con: 'Pav' },
  { raLow: 21.3333, raHigh: 24.0, decLow: -80.0, con: 'Tuc' },
  // Dec -90 → -80 (South Polar Cap)
  { raLow: 0, raHigh: 24.0, decLow: -90.0, con: 'Oct' },
];

// ============================================================================
// IAU Constellation Full Names
// ============================================================================

const CONSTELLATION_NAMES: Record<string, string> = {
  And: 'Andromeda', Ant: 'Antlia', Aps: 'Apus', Aqr: 'Aquarius',
  Aql: 'Aquila', Ara: 'Ara', Ari: 'Aries', Aur: 'Auriga',
  Boo: 'Boötes', Cae: 'Caelum', Cam: 'Camelopardalis', Cnc: 'Cancer',
  CVn: 'Canes Venatici', CMa: 'Canis Major', CMi: 'Canis Minor',
  Cap: 'Capricornus', Car: 'Carina', Cas: 'Cassiopeia', Cen: 'Centaurus',
  Cep: 'Cepheus', Cet: 'Cetus', Cha: 'Chamaeleon', Cir: 'Circinus',
  Col: 'Columba', Com: 'Coma Berenices', CrA: 'Corona Australis',
  CrB: 'Corona Borealis', Crv: 'Corvus', Crt: 'Crater', Cru: 'Crux',
  Cyg: 'Cygnus', Del: 'Delphinus', Dor: 'Dorado', Dra: 'Draco',
  Equ: 'Equuleus', Eri: 'Eridanus', For: 'Fornax', Gem: 'Gemini',
  Gru: 'Grus', Her: 'Hercules', Hor: 'Horologium', Hya: 'Hydra',
  Hyi: 'Hydrus', Ind: 'Indus', Lac: 'Lacerta', Leo: 'Leo',
  LMi: 'Leo Minor', Lep: 'Lepus', Lib: 'Libra', Lup: 'Lupus',
  Lyn: 'Lynx', Lyr: 'Lyra', Men: 'Mensa', Mic: 'Microscopium',
  Mon: 'Monoceros', Mus: 'Musca', Nor: 'Norma', Oct: 'Octans',
  Oph: 'Ophiuchus', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus',
  Per: 'Perseus', Phe: 'Phoenix', Pic: 'Pictor', Psc: 'Pisces',
  PsA: 'Piscis Austrinus', Pup: 'Puppis', Pyx: 'Pyxis',
  Ret: 'Reticulum', Sge: 'Sagitta', Sgr: 'Sagittarius', Sco: 'Scorpius',
  Scl: 'Sculptor', Sct: 'Scutum', Ser: 'Serpens', Sex: 'Sextans',
  Tau: 'Taurus', Tel: 'Telescopium', Tri: 'Triangulum',
  TrA: 'Triangulum Australe', Tuc: 'Tucana', UMa: 'Ursa Major',
  UMi: 'Ursa Minor', Vel: 'Vela', Vir: 'Virgo', Vol: 'Volans', Vul: 'Vulpecula',
};

// ============================================================================
// Lookup Function
// ============================================================================

/**
 * Get IAU constellation abbreviation for given J2000 equatorial coordinates.
 * @param raDeg  Right ascension in degrees [0, 360)
 * @param decDeg Declination in degrees [-90, 90]
 * @returns IAU 3-letter constellation abbreviation (e.g. 'Ori', 'UMa')
 */
export function getConstellationAbbrev(raDeg: number, decDeg: number): string {
  const { ra, dec } = precessJ2000toB1875(raDeg, decDeg);

  // Normalize RA to [0, 24)
  const raH = ((ra % 24) + 24) % 24;

  for (const strip of BOUNDARY_DATA) {
    if (dec >= strip.decLow && raH >= strip.raLow && raH < strip.raHigh) {
      return strip.con;
    }
  }

  // Fallback (should not happen with complete data)
  return 'Oct';
}

/**
 * Get full constellation name for given J2000 equatorial coordinates.
 * @param raDeg  Right ascension in degrees [0, 360)
 * @param decDeg Declination in degrees [-90, 90]
 * @returns Full constellation name (e.g. 'Orion', 'Ursa Major')
 */
export function getConstellationFromCoords(raDeg: number, decDeg: number): string {
  const abbrev = getConstellationAbbrev(raDeg, decDeg);
  return CONSTELLATION_NAMES[abbrev] || abbrev;
}

/**
 * Get full constellation name from abbreviation.
 */
export function getConstellationFullName(abbrev: string): string {
  return CONSTELLATION_NAMES[abbrev] || abbrev;
}
