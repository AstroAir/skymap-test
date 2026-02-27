/**
 * Tests for planning-styles.ts
 * Style mappings, feasibility colors, status/priority colors, score badges, formatters
 */

import {
  getSkyConditionColor,
  getSkyConditionLabelKey,
  getFeasibilityColor,
  getFeasibilityBadgeColor,
  getStatusColor,
  getPriorityColor,
  getScoreBadgeVariant,
  formatPlanningTime,
  formatPlanningDate,
  formatCountdown,
} from '../planning-styles';

// ============================================================================
// Sky Condition Styles
// ============================================================================

describe('getSkyConditionColor', () => {
  it('returns correct color for night', () => {
    expect(getSkyConditionColor('night')).toBe('bg-indigo-600');
  });

  it('returns correct color for astronomical', () => {
    expect(getSkyConditionColor('astronomical')).toBe('bg-purple-600');
  });

  it('returns correct color for nautical', () => {
    expect(getSkyConditionColor('nautical')).toBe('bg-blue-600');
  });

  it('returns correct color for civil', () => {
    expect(getSkyConditionColor('civil')).toBe('bg-orange-500');
  });

  it('returns correct color for day', () => {
    expect(getSkyConditionColor('day')).toBe('bg-yellow-500');
  });

  it('returns fallback for unknown condition', () => {
    expect(getSkyConditionColor('unknown')).toBe('bg-gray-600');
    expect(getSkyConditionColor('')).toBe('bg-gray-600');
  });
});

describe('getSkyConditionLabelKey', () => {
  it('returns correct key for night', () => {
    expect(getSkyConditionLabelKey('night')).toBe('session.darkSky');
  });

  it('returns correct key for astronomical', () => {
    expect(getSkyConditionLabelKey('astronomical')).toBe('session.astroTwilight');
  });

  it('returns correct key for nautical', () => {
    expect(getSkyConditionLabelKey('nautical')).toBe('session.nauticalTwilight');
  });

  it('returns correct key for civil', () => {
    expect(getSkyConditionLabelKey('civil')).toBe('session.civilTwilight');
  });

  it('returns correct key for day', () => {
    expect(getSkyConditionLabelKey('day')).toBe('session.daylight');
  });

  it('returns the input string for unknown condition', () => {
    expect(getSkyConditionLabelKey('foggy')).toBe('foggy');
    expect(getSkyConditionLabelKey('')).toBe('');
  });
});

// ============================================================================
// Feasibility Styles
// ============================================================================

describe('getFeasibilityColor', () => {
  it('returns correct color for excellent', () => {
    expect(getFeasibilityColor('excellent')).toBe('text-green-400 bg-green-900/30');
  });

  it('returns correct color for good', () => {
    expect(getFeasibilityColor('good')).toBe('text-emerald-400 bg-emerald-900/30');
  });

  it('returns correct color for fair', () => {
    expect(getFeasibilityColor('fair')).toBe('text-yellow-400 bg-yellow-900/30');
  });

  it('returns correct color for poor', () => {
    expect(getFeasibilityColor('poor')).toBe('text-orange-400 bg-orange-900/30');
  });

  it('returns correct color for not_recommended', () => {
    expect(getFeasibilityColor('not_recommended')).toBe('text-red-400 bg-red-900/30');
  });

  it('returns fallback for unknown', () => {
    expect(getFeasibilityColor('unknown')).toBe('text-muted-foreground');
  });
});

describe('getFeasibilityBadgeColor', () => {
  it('returns correct badge color for each recommendation', () => {
    expect(getFeasibilityBadgeColor('excellent')).toBe('bg-green-600');
    expect(getFeasibilityBadgeColor('good')).toBe('bg-emerald-600');
    expect(getFeasibilityBadgeColor('fair')).toBe('bg-yellow-600');
    expect(getFeasibilityBadgeColor('poor')).toBe('bg-orange-600');
    expect(getFeasibilityBadgeColor('not_recommended')).toBe('bg-red-600');
  });
});

// ============================================================================
// Target Status/Priority Styles
// ============================================================================

describe('getStatusColor', () => {
  it('returns correct color for planned', () => {
    expect(getStatusColor('planned')).toBe('bg-muted-foreground');
  });

  it('returns correct color for in_progress', () => {
    expect(getStatusColor('in_progress')).toBe('bg-amber-600');
  });

  it('returns correct color for completed', () => {
    expect(getStatusColor('completed')).toBe('bg-green-600');
  });
});

describe('getPriorityColor', () => {
  it('returns correct color for low', () => {
    expect(getPriorityColor('low')).toBe('border-muted-foreground text-muted-foreground');
  });

  it('returns correct color for medium', () => {
    expect(getPriorityColor('medium')).toBe('border-primary text-primary');
  });

  it('returns correct color for high', () => {
    expect(getPriorityColor('high')).toBe('border-red-500 text-red-400');
  });
});

// ============================================================================
// Score Badge
// ============================================================================

describe('getScoreBadgeVariant', () => {
  it('returns default for score >= 80', () => {
    expect(getScoreBadgeVariant(80)).toBe('default');
    expect(getScoreBadgeVariant(100)).toBe('default');
    expect(getScoreBadgeVariant(95)).toBe('default');
  });

  it('returns secondary for score 60-79', () => {
    expect(getScoreBadgeVariant(60)).toBe('secondary');
    expect(getScoreBadgeVariant(79)).toBe('secondary');
  });

  it('returns outline for score 40-59', () => {
    expect(getScoreBadgeVariant(40)).toBe('outline');
    expect(getScoreBadgeVariant(59)).toBe('outline');
  });

  it('returns destructive for score < 40', () => {
    expect(getScoreBadgeVariant(39)).toBe('destructive');
    expect(getScoreBadgeVariant(0)).toBe('destructive');
    expect(getScoreBadgeVariant(-1)).toBe('destructive');
  });
});

// ============================================================================
// Formatters
// ============================================================================

describe('formatPlanningTime', () => {
  it('returns "--:--" for null', () => {
    expect(formatPlanningTime(null)).toBe('--:--');
  });

  it('returns formatted time for valid date', () => {
    const date = new Date('2024-06-15T14:30:00');
    const result = formatPlanningTime(date);
    // Should contain hour and minute parts
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatPlanningDate', () => {
  it('formats valid date string', () => {
    const result = formatPlanningDate('2024-06-15');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns "Invalid Date" for unparseable date string', () => {
    // new Date('not-a-date').toLocaleDateString() returns 'Invalid Date' without throwing
    expect(formatPlanningDate('not-a-date')).toBe('Invalid Date');
  });
});

describe('formatCountdown', () => {
  it('formats minutes under 60 as Xm', () => {
    expect(formatCountdown(30)).toBe('30m');
    expect(formatCountdown(1)).toBe('1m');
    expect(formatCountdown(59)).toBe('59m');
  });

  it('formats minutes >= 60 as Xh Ym', () => {
    expect(formatCountdown(60)).toBe('1h 0m');
    expect(formatCountdown(90)).toBe('1h 30m');
    expect(formatCountdown(150)).toBe('2h 30m');
  });

  it('rounds fractional minutes', () => {
    expect(formatCountdown(30.4)).toBe('30m');
    expect(formatCountdown(30.6)).toBe('31m');
  });

  it('handles zero', () => {
    expect(formatCountdown(0)).toBe('0m');
  });
});
