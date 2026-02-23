/**
 * Tests for planning-ui-store.ts
 * Planning panel open/close state management
 */

import { act } from '@testing-library/react';
import { usePlanningUiStore } from '../planning-ui-store';

beforeEach(() => {
  act(() => {
    usePlanningUiStore.setState({
      sessionPlannerOpen: false,
      shotListOpen: false,
      tonightRecommendationsOpen: false,
    });
  });
});

describe('usePlanningUiStore', () => {
  it('should start with all panels closed', () => {
    const state = usePlanningUiStore.getState();
    expect(state.sessionPlannerOpen).toBe(false);
    expect(state.shotListOpen).toBe(false);
    expect(state.tonightRecommendationsOpen).toBe(false);
  });

  it('should open session planner', () => {
    act(() => {
      usePlanningUiStore.getState().openSessionPlanner();
    });
    expect(usePlanningUiStore.getState().sessionPlannerOpen).toBe(true);
  });

  it('should close session planner', () => {
    act(() => {
      usePlanningUiStore.getState().openSessionPlanner();
      usePlanningUiStore.getState().closeSessionPlanner();
    });
    expect(usePlanningUiStore.getState().sessionPlannerOpen).toBe(false);
  });

  it('should toggle session planner via set', () => {
    act(() => {
      usePlanningUiStore.getState().setSessionPlannerOpen(true);
    });
    expect(usePlanningUiStore.getState().sessionPlannerOpen).toBe(true);
  });

  it('should open shot list', () => {
    act(() => {
      usePlanningUiStore.getState().openShotList();
    });
    expect(usePlanningUiStore.getState().shotListOpen).toBe(true);
  });

  it('should close shot list', () => {
    act(() => {
      usePlanningUiStore.getState().openShotList();
      usePlanningUiStore.getState().closeShotList();
    });
    expect(usePlanningUiStore.getState().shotListOpen).toBe(false);
  });

  it('should open tonight recommendations', () => {
    act(() => {
      usePlanningUiStore.getState().openTonightRecommendations();
    });
    expect(usePlanningUiStore.getState().tonightRecommendationsOpen).toBe(true);
  });

  it('should close tonight recommendations', () => {
    act(() => {
      usePlanningUiStore.getState().openTonightRecommendations();
      usePlanningUiStore.getState().closeTonightRecommendations();
    });
    expect(usePlanningUiStore.getState().tonightRecommendationsOpen).toBe(false);
  });
});
