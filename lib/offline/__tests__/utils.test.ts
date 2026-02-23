/**
 * Tests for offline/utils.ts
 * Offline cache utility functions
 */

import { convertToHiPSSurvey } from '../utils';
import type { SkySurvey } from '@/lib/core/constants';

describe('convertToHiPSSurvey', () => {
  it('should convert SkySurvey to HiPSSurvey with defaults', () => {
    const survey = {
      id: 'DSS',
      name: 'DSS Color',
      url: 'https://example.com/DSS',
      description: 'Digitized Sky Survey',
      category: 'optical' as const,
    } as SkySurvey;

    const result = convertToHiPSSurvey(survey);
    expect(result.id).toBe('DSS');
    expect(result.name).toBe('DSS Color');
    expect(result.url).toBe('https://example.com/DSS');
    expect(result.maxOrder).toBe(11);
    expect(result.tileFormat).toBe('jpeg');
    expect(result.frame).toBe('equatorial');
  });
});
