/**
 * Offline cache utility functions
 */

import type { SkySurvey } from '@/lib/core/constants';
import type { HiPSSurvey } from '@/lib/services/hips-service';

/**
 * Convert a SkySurvey config to HiPSSurvey format for cache operations.
 * Adds default values for maxOrder, tileFormat, and frame.
 */
export function convertToHiPSSurvey(survey: SkySurvey): HiPSSurvey {
  return {
    id: survey.id,
    name: survey.name,
    url: survey.url,
    description: survey.description,
    category: survey.category,
    maxOrder: 11,
    tileFormat: 'jpeg',
    frame: 'equatorial',
  };
}
