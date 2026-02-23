/**
 * Tests for plate-solving/solve-utils.ts
 * Progress formatting utilities
 */

import { getProgressText, getProgressPercent } from '../solve-utils';
import type { SolveProgress } from '../astrometry-api';

const mockT = (key: string) => key;

describe('getProgressText', () => {
  it('should return empty string when progress is null', () => {
    const text = getProgressText(null, mockT);
    expect(text).toBe('');
  });

  it('should return text for uploading stage', () => {
    const p: SolveProgress = { stage: 'uploading', progress: 50 };
    const text = getProgressText(p, mockT);
    expect(text).toContain('50');
  });

  it('should return text for queued stage', () => {
    const p: SolveProgress = { stage: 'queued', subid: 12345 };
    const text = getProgressText(p, mockT);
    expect(text).toContain('12345');
  });
});

describe('getProgressPercent', () => {
  it('should return 0 when online progress is null', () => {
    expect(getProgressPercent('online', 0, null)).toBe(0);
  });

  it('should return localProgress for local mode', () => {
    expect(getProgressPercent('local', 75, null)).toBe(75);
  });

  it('should return 30 for queued stage', () => {
    const p: SolveProgress = { stage: 'queued', subid: 1 };
    expect(getProgressPercent('online', 0, p)).toBe(30);
  });

  it('should return 100 for success stage', () => {
    const p: SolveProgress = { stage: 'success', result: {} as never };
    expect(getProgressPercent('online', 0, p)).toBe(100);
  });
});
