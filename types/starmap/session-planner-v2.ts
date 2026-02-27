import type { ImagingFeasibility } from '@/lib/core/types/astronomy';
import type { ScheduledTarget, SessionPlan } from './planning';

export type SessionExportFormat =
  | 'text'
  | 'markdown'
  | 'json'
  | 'nina-xml'
  | 'csv'
  | 'sgp-csv';

export interface SessionWeatherSnapshot {
  cloudCover?: number;
  humidity?: number;
  windSpeed?: number;
  dewPoint?: number;
  source: 'device' | 'manual' | 'none';
  capturedAt: string;
}

export interface ManualScheduleItem {
  targetId: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  locked?: boolean;
  reason?: string;
}

export interface SessionConstraintSet {
  minAltitude: number;
  minImagingTime: number;
  sessionWindow?: {
    /** Local HH:mm; end <= start means next day. */
    startTime: string;
    /** Local HH:mm; end <= start means next day. */
    endTime: string;
  };
  minMoonDistance?: number;
  /**
   * When true (default), use `TargetItem.exposurePlan.totalExposure` (minutes)
   * as the desired duration. Falls back to `minImagingTime` when missing.
   */
  useExposurePlanDuration?: boolean;
  weatherLimits?: {
    maxCloudCover?: number;
    maxHumidity?: number;
    maxWindSpeed?: number;
  };
  safetyLimits?: {
    enforceMountSafety?: boolean;
    avoidMeridianFlipWindow?: boolean;
  };
}

export type SessionConflictType =
  | 'overlap'
  | 'altitude'
  | 'moon-distance'
  | 'weather'
  | 'session-window'
  | 'insufficient-duration'
  | 'mount-safety'
  | 'manual-time';

export interface SessionConflict {
  type: SessionConflictType;
  targetId: string;
  message: string;
}

export interface SessionDraftV2 {
  name?: string;
  notes?: string;
  planDate: string;
  strategy: 'altitude' | 'transit' | 'moon' | 'duration' | 'balanced';
  constraints: SessionConstraintSet;
  excludedTargetIds: string[];
  manualEdits: ManualScheduleItem[];
  weatherSnapshot?: SessionWeatherSnapshot;
  exportMeta?: {
    lastFormat?: SessionExportFormat;
    lastExportedAt?: string;
  };
}

export interface SessionTemplate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  draft: SessionDraftV2;
}

export interface SessionPlanV2 extends SessionPlan {
  targets: ScheduledTargetWithLock[];
  conflicts: SessionConflict[];
  weatherSnapshot?: SessionWeatherSnapshot;
  draft?: SessionDraftV2;
}

export interface ScheduledTargetWithLock extends ScheduledTarget {
  locked?: boolean;
  manual?: boolean;
  /** Desired duration used during scheduling/export (minutes). */
  desiredDurationMinutes?: number;
  feasibility: ImagingFeasibility;
}
