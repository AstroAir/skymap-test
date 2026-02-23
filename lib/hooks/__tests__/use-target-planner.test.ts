/**
 * Tests for use-target-planner.ts
 * Session planning and target visibility
 */

import { renderHook } from '@testing-library/react';
import { useTargetPlanner } from '../use-target-planner';

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: jest.fn((selector) =>
    selector({
      targets: [],
      getTargets: () => [],
    })
  ),
}));

jest.mock('@/lib/stores', () => ({
  useMountStore: jest.fn((selector) =>
    selector({
      profileInfo: {
        AstrometrySettings: { Latitude: 40, Longitude: -74, Elevation: 0 },
      },
    })
  ),
}));

describe('useTargetPlanner', () => {
  it('should return planner data', () => {
    const { result } = renderHook(() => useTargetPlanner());
    expect(result.current).toBeDefined();
    expect(typeof result.current.updateAllVisibility).toBe('function');
  });
});
