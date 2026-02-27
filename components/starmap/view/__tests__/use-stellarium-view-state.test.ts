/**
 * @jest-environment jsdom
 */

import {
  dialogReducer,
  initialDialogState,
  type DialogState,
  type DialogAction,
} from '../use-stellarium-view-state';

describe('useStellariumViewState module', () => {
  it('module can be imported', async () => {
    const mod = await import('../use-stellarium-view-state');
    expect(mod).toBeDefined();
  });

  it('exports dialogReducer function', async () => {
    const mod = await import('../use-stellarium-view-state');
    expect(typeof mod.dialogReducer).toBe('function');
  });

  it('exports initialDialogState', async () => {
    const mod = await import('../use-stellarium-view-state');
    expect(mod.initialDialogState).toBeDefined();
    expect(mod.initialDialogState.contextMenuOpen).toBe(false);
  });

  it('exports useStellariumViewState hook', async () => {
    const mod = await import('../use-stellarium-view-state');
    expect(typeof mod.useStellariumViewState).toBe('function');
  });
});

describe('dialogReducer (via use-stellarium-view-state)', () => {
  it('handles all dialog action types without throwing', () => {
    const actions: DialogAction[] = [
      { type: 'SET_CONTEXT_MENU', open: true },
      { type: 'OPEN_CONTEXT_MENU', position: { x: 100, y: 200 } },
      { type: 'SET_CONTEXT_MENU', open: false },
      { type: 'SET_GO_TO_DIALOG', open: true },
      { type: 'SET_GO_TO_DIALOG', open: false },
      { type: 'SET_DETAIL_DRAWER', open: true },
      { type: 'SET_DETAIL_DRAWER', open: false },
      { type: 'SET_CLOSE_CONFIRM', open: true },
      { type: 'SET_CLOSE_CONFIRM', open: false },
    ];

    let state: DialogState = initialDialogState;
    for (const action of actions) {
      state = dialogReducer(state, action);
    }
    // After running all actions, all should be closed (last close action for each type)
    expect(state.contextMenuOpen).toBe(false);
    expect(state.goToDialogOpen).toBe(false);
    expect(state.detailDrawerOpen).toBe(false);
    expect(state.closeConfirmDialogOpen).toBe(false);
  });

  it('OPEN_CONTEXT_MENU sets position correctly', () => {
    const result = dialogReducer(initialDialogState, {
      type: 'OPEN_CONTEXT_MENU',
      position: { x: 42, y: 99 },
    });
    expect(result.contextMenuPosition).toEqual({ x: 42, y: 99 });
    expect(result.contextMenuOpen).toBe(true);
  });

  it('preserves unrelated state on each action', () => {
    const state: DialogState = {
      contextMenuOpen: true,
      contextMenuPosition: { x: 10, y: 20 },
      goToDialogOpen: true,
      detailDrawerOpen: true,
      closeConfirmDialogOpen: true,
    };
    const result = dialogReducer(state, { type: 'SET_CONTEXT_MENU', open: false });
    expect(result.contextMenuOpen).toBe(false);
    expect(result.goToDialogOpen).toBe(true);
    expect(result.detailDrawerOpen).toBe(true);
    expect(result.closeConfirmDialogOpen).toBe(true);
  });

  it('returns same reference for unknown action', () => {
    const result = dialogReducer(initialDialogState, { type: 'UNKNOWN' } as unknown as DialogAction);
    expect(result).toBe(initialDialogState);
  });
});
