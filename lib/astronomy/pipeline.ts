import { raDecToAltAzAtTime } from './coordinates/transforms';
import { getHourAngleAtTime } from './coordinates/transforms';
import { getGST, getLST } from './time/sidereal';
import { buildTimeScaleContext, jdToIsoTimestamp, triggerBackgroundEopRefresh } from './time-scales';
import { createCoordinateMetadata, normalizeDegrees } from './frames';
import type { CoordinateContext, CoordinateResult } from '@/lib/core/types/astronomy';

export function transformCoordinate(
  coordinates: { raDeg: number; decDeg: number },
  context: CoordinateContext
): CoordinateResult {
  const date = context.date ?? new Date();
  const scales = buildTimeScaleContext(date, context.jdUtc);
  triggerBackgroundEopRefresh(date);

  const altAz = raDecToAltAzAtTime(
    coordinates.raDeg,
    coordinates.decDeg,
    context.latitude,
    context.longitude,
    date
  );

  const lstDeg = getLST(context.longitude, scales.jdUt1);
  const gstDeg = getGST(scales.jdUt1);
  const hourAngleDeg = getHourAngleAtTime(coordinates.raDeg, context.longitude, date);

  const qualityFlag = context.precisionMode === 'realtime_lightweight' ? 'interpolated' : 'precise';
  const metadata = createCoordinateMetadata({
    frame: context.toFrame ?? 'ICRF',
    epochJd: scales.jdUtc,
    timeScale: 'UTC',
    qualityFlag: scales.eop.freshness === 'fallback' ? 'fallback' : qualityFlag,
    dataFreshness: scales.eop.freshness,
    source: 'calculation',
  });

  return {
    raDeg: normalizeDegrees(coordinates.raDeg),
    decDeg: coordinates.decDeg,
    altitudeDeg: altAz.altitude,
    azimuthDeg: normalizeDegrees(altAz.azimuth),
    hourAngleDeg,
    lstDeg,
    gstDeg,
    metadata: {
      ...metadata,
      generatedAt: jdToIsoTimestamp(scales.jdUtc),
    },
  };
}
