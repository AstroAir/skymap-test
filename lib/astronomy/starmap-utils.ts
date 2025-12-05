/**
 * Coordinate conversion and astronomical utility functions
 */

/**
 * Convert degrees to Hours:Minutes:Seconds format (for RA)
 */
export function degreesToHMS(deg: number): string {
  const totalHours = deg / 15;
  const h = Math.floor(totalHours);
  const remainingHours = totalHours - h;
  const totalMinutes = remainingHours * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;
  const hStr = String(h);
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${hStr}:${mStr}:${sStr}`;
}

/**
 * Convert degrees to Degrees:Minutes:Seconds format (for Dec)
 */
export function degreesToDMS(deg: number): string {
  const sign = deg < 0 ? '-' : '+';
  deg = Math.abs(deg);
  const d = Math.floor(deg);
  const remainingDeg = deg - d;
  const totalMinutes = remainingDeg * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;

  const dStr = String(d).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${sign}${dStr}:${mStr}:${sStr}`;
}

/**
 * Convert HMS string to degrees
 */
export function hmsToDegrees(hmsString: string): number {
  const parts = hmsString.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  return hours * 15 + minutes * (15 / 60) + seconds * (15 / 3600);
}

/**
 * Convert DMS string to degrees
 */
export function dmsToDegrees(dmsString: string): number {
  const sign = dmsString.startsWith('-') ? -1 : 1;
  const stripped = dmsString.replace('-', '').replace('+', '');
  const parts = stripped.split(':');
  const degrees = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);

  return sign * (degrees + minutes / 60 + seconds / 3600);
}

/**
 * Convert radians to degrees
 */
export function rad2deg(rad: number): number {
  return rad * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 */
export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Convert UTC Date to Modified Julian Date
 */
export function utcToMJD(utcDate: Date): number {
  return utcDate.getTime() / 86400000 + 40587;
}

/**
 * Convert Modified Julian Date to UTC Date
 */
export function mjdToUTC(mjd: number): Date {
  return new Date((mjd - 40587) * 86400000);
}

/**
 * Format timestamp to time string
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Calculate Julian Date
 */
export function getJulianDate(): number {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const second = now.getUTCSeconds();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5 +
    (hour + minute / 60 + second / 3600) / 24;

  return JD;
}

/**
 * Calculate Greenwich Sidereal Time (GST) in degrees
 */
export function getGST(): number {
  const JD = getJulianDate();
  const S = JD - 2451545.0;
  const T = S / 36525.0;
  const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
  return ((GST % 360) + 360) % 360;
}

/**
 * Calculate Local Sidereal Time (LST) in degrees
 */
export function getLST(longitude: number): number {
  const GST = getGST();
  return (GST + longitude) % 360;
}

/**
 * Convert RA/Dec to Alt/Az
 */
export function raDecToAltAz(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number
): { altitude: number; azimuth: number } {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const LST = getLST(longitude);
  const delta = dec * rad;
  const phi = latitude * rad;
  const HA = (LST - ra) * rad;

  const sinAlt = Math.sin(delta) * Math.sin(phi) + Math.cos(delta) * Math.cos(phi) * Math.cos(HA);
  const altitude = Math.asin(sinAlt) * deg;

  const y = -Math.cos(delta) * Math.sin(HA);
  const x = Math.sin(delta) * Math.cos(phi) - Math.cos(delta) * Math.sin(phi) * Math.cos(HA);
  let azimuth = Math.atan2(y, x) * deg;
  if (azimuth < 0) azimuth += 360;

  return { altitude, azimuth };
}

/**
 * Convert Alt/Az to RA/Dec
 */
export function altAzToRaDec(
  altitude: number,
  azimuth: number,
  latitude: number,
  longitude: number
): { ra: number; dec: number } {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const LST = getLST(longitude);
  const h = altitude * rad;
  const A = azimuth * rad;
  const phi = latitude * rad;

  const sinDec = Math.sin(h) * Math.sin(phi) + Math.cos(h) * Math.cos(phi) * Math.cos(A);
  const dec = Math.asin(sinDec) * deg;

  const y = -Math.sin(A) * Math.cos(h);
  const x = Math.cos(phi) * Math.sin(h) - Math.sin(phi) * Math.cos(h) * Math.cos(A);
  const HA = Math.atan2(y, x) * deg;

  let ra = (LST - HA) % 360;
  if (ra < 0) ra += 360;

  return { ra, dec };
}

/**
 * Format date for input[type="date"]
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time for input[type="time"]
 */
export function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
