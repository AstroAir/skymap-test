export interface EopBaselineEntry {
  mjd: number;
  dut1: number;
  xp?: number;
  yp?: number;
}

/**
 * Built-in EOP baseline snapshot.
 * Values are low-volume anchors to keep UT1 conversion available offline.
 * `dut1` is expressed in seconds.
 */
export const EOP_BASELINE_VERSION = '2026.02.01';

export const EOP_BASELINE_UPDATED_AT = '2026-02-01T00:00:00.000Z';

export const EOP_BASELINE_DATA: EopBaselineEntry[] = [
  { mjd: 60250, dut1: 0.0827, xp: 0.166, yp: 0.289 },
  { mjd: 60300, dut1: 0.0794, xp: 0.129, yp: 0.303 },
  { mjd: 60350, dut1: 0.0712, xp: 0.093, yp: 0.316 },
  { mjd: 60400, dut1: 0.0581, xp: 0.061, yp: 0.322 },
  { mjd: 60450, dut1: 0.0414, xp: 0.034, yp: 0.329 },
  { mjd: 60500, dut1: 0.0278, xp: 0.017, yp: 0.334 },
  { mjd: 60550, dut1: 0.0143, xp: 0.002, yp: 0.337 },
  { mjd: 60600, dut1: -0.0019, xp: -0.011, yp: 0.341 },
  { mjd: 60650, dut1: -0.0152, xp: -0.023, yp: 0.343 },
  { mjd: 60700, dut1: -0.0279, xp: -0.034, yp: 0.346 },
];
