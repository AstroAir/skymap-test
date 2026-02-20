import type { TargetItem } from '@/lib/stores/target-list-store';
import type {
  ScheduledTarget,
  SessionPlan,
  OptimizationStrategy,
} from '@/types/starmap/planning';
import type {
  ManualScheduleItem,
  SessionConflict,
  SessionConstraintSet,
  SessionDraftV2,
  SessionPlanV2,
  SessionWeatherSnapshot,
} from '@/types/starmap/session-planner-v2';
import {
  angularSeparation,
  calculateImagingFeasibility,
  calculateTargetVisibility,
  getMoonPosition,
  getJulianDateFromDate,
} from './astro-utils';
import { optimizeSchedule } from './session-scheduler';
import type { TwilightTimes } from '@/lib/core/types/astronomy';

function getEditDate(
  planDate: Date,
  timeString: string | undefined
): Date | null {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const result = new Date(planDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function toManualScheduledTarget(
  target: TargetItem,
  visibilityData: ReturnType<typeof calculateTargetVisibility>,
  feasibility: ReturnType<typeof calculateImagingFeasibility>,
  startTime: Date,
  endTime: Date,
  moonDistance: number,
  order: number,
): ScheduledTarget {
  return {
    target,
    startTime,
    endTime,
    duration: Math.max(0, (endTime.getTime() - startTime.getTime()) / 3600000),
    transitTime: visibilityData.transitTime,
    maxAltitude: visibilityData.transitAltitude,
    moonDistance,
    feasibility,
    conflicts: [],
    isOptimal: feasibility.score >= 70,
    order,
  };
}

function detectConflicts(
  targets: ScheduledTarget[],
  constraints: SessionConstraintSet,
  weatherSnapshot?: SessionWeatherSnapshot,
): SessionConflict[] {
  const conflicts: SessionConflict[] = [];
  const minMoonDistance = constraints.minMoonDistance ?? 0;

  for (let index = 0; index < targets.length; index++) {
    const current = targets[index];
    const previous = targets[index - 1];

    if (previous && current.startTime.getTime() < previous.endTime.getTime()) {
      conflicts.push({
        type: 'overlap',
        targetId: current.target.id,
        message: `${current.target.name} overlaps with ${previous.target.name}`,
      });
    }

    if (current.maxAltitude < constraints.minAltitude) {
      conflicts.push({
        type: 'altitude',
        targetId: current.target.id,
        message: `${current.target.name} max altitude ${current.maxAltitude.toFixed(1)}° is below ${constraints.minAltitude}°`,
      });
    }

    if (minMoonDistance > 0 && current.moonDistance < minMoonDistance) {
      conflicts.push({
        type: 'moon-distance',
        targetId: current.target.id,
        message: `${current.target.name} is ${current.moonDistance.toFixed(1)}° from moon (min ${minMoonDistance}°)`,
      });
    }
  }

  if (constraints.weatherLimits && weatherSnapshot) {
    const { weatherLimits } = constraints;
    if (
      weatherLimits.maxCloudCover !== undefined &&
      weatherSnapshot.cloudCover !== undefined &&
      weatherSnapshot.cloudCover > weatherLimits.maxCloudCover
    ) {
      conflicts.push({
        type: 'weather',
        targetId: 'global',
        message: `Cloud cover ${weatherSnapshot.cloudCover}% exceeds ${weatherLimits.maxCloudCover}%`,
      });
    }
    if (
      weatherLimits.maxHumidity !== undefined &&
      weatherSnapshot.humidity !== undefined &&
      weatherSnapshot.humidity > weatherLimits.maxHumidity
    ) {
      conflicts.push({
        type: 'weather',
        targetId: 'global',
        message: `Humidity ${weatherSnapshot.humidity}% exceeds ${weatherLimits.maxHumidity}%`,
      });
    }
    if (
      weatherLimits.maxWindSpeed !== undefined &&
      weatherSnapshot.windSpeed !== undefined &&
      weatherSnapshot.windSpeed > weatherLimits.maxWindSpeed
    ) {
      conflicts.push({
        type: 'weather',
        targetId: 'global',
        message: `Wind ${weatherSnapshot.windSpeed} km/h exceeds ${weatherLimits.maxWindSpeed} km/h`,
      });
    }
  }

  return conflicts;
}

export function optimizeScheduleV2(
  targets: TargetItem[],
  latitude: number,
  longitude: number,
  twilight: TwilightTimes,
  strategy: OptimizationStrategy,
  constraints: SessionConstraintSet,
  planDate: Date,
  excludedIds: Set<string> = new Set(),
  manualEdits: ManualScheduleItem[] = [],
  weatherSnapshot?: SessionWeatherSnapshot,
): SessionPlanV2 {
  const basePlan: SessionPlan = optimizeSchedule(
    targets,
    latitude,
    longitude,
    twilight,
    strategy,
    constraints.minAltitude,
    constraints.minImagingTime,
    planDate,
    excludedIds,
  );

  const targetMap = new Map(targets.map((target) => [target.id, target]));
  const scheduledMap = new Map(basePlan.targets.map((scheduled) => [scheduled.target.id, scheduled]));
  const moonPosition = getMoonPosition(getJulianDateFromDate(planDate));

  for (const edit of manualEdits) {
    const target = targetMap.get(edit.targetId);
    if (!target || excludedIds.has(target.id)) continue;

    const existing = scheduledMap.get(target.id);
    const startFromEdit = getEditDate(planDate, edit.startTime);
    const endFromEdit = getEditDate(planDate, edit.endTime);
    const startTime = startFromEdit ?? existing?.startTime ?? null;

    let endTime = endFromEdit ?? null;
    if (!endTime && startTime && edit.durationMinutes && edit.durationMinutes > 0) {
      endTime = new Date(startTime.getTime() + edit.durationMinutes * 60000);
    }
    if (!startTime || !endTime || endTime <= startTime) continue;

    const visibilityData = calculateTargetVisibility(
      target.ra,
      target.dec,
      latitude,
      longitude,
      constraints.minAltitude,
      planDate,
    );
    const feasibility = calculateImagingFeasibility(
      target.ra,
      target.dec,
      latitude,
      longitude,
      constraints.minAltitude,
      planDate,
    );
    const moonDistance = angularSeparation(
      target.ra,
      target.dec,
      moonPosition.ra,
      moonPosition.dec,
    );
    const manualTarget = toManualScheduledTarget(
      target,
      visibilityData,
      feasibility,
      startTime,
      endTime,
      moonDistance,
      existing?.order ?? scheduledMap.size + 1,
    );
    scheduledMap.set(target.id, manualTarget);
  }

  const mergedTargets = Array.from(scheduledMap.values())
    .sort((left, right) => left.startTime.getTime() - right.startTime.getTime())
    .map((target, index) => ({
      ...target,
      order: index + 1,
    }));

  const totalImagingTime = mergedTargets.reduce((sum, target) => sum + target.duration, 0);
  const nightCoverage = twilight.darknessDuration > 0
    ? (totalImagingTime / twilight.darknessDuration) * 100
    : 0;
  const efficiency = mergedTargets.length > 0
    ? (mergedTargets.filter((target) => target.isOptimal).length / mergedTargets.length) * 100
    : 0;

  const conflicts = detectConflicts(mergedTargets, constraints, weatherSnapshot);
  const warnings = [...basePlan.warnings];
  if (conflicts.some((conflict) => conflict.type === 'weather')) {
    warnings.push({ key: 'planRec.weatherNotIdeal' });
  }

  return {
    ...basePlan,
    targets: mergedTargets,
    totalImagingTime,
    nightCoverage,
    efficiency,
    warnings,
    conflicts,
    weatherSnapshot,
  };
}

export function createDraftFromSessionPlan(
  plan: SessionPlanV2,
  strategy: OptimizationStrategy,
  constraints: SessionConstraintSet,
  planDate: Date,
): SessionDraftV2 {
  return {
    planDate: planDate.toISOString(),
    strategy,
    constraints,
    excludedTargetIds: [],
    manualEdits: plan.targets.map((target) => ({
      targetId: target.target.id,
      startTime: target.startTime.toTimeString().slice(0, 5),
      endTime: target.endTime.toTimeString().slice(0, 5),
    })),
    weatherSnapshot: plan.weatherSnapshot,
  };
}
