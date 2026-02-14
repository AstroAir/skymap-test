/**
 * @jest-environment jsdom
 */

import {
  dialogReducer,
  initialDialogState,
  type DialogState,
  type DialogAction,
} from '../use-stellarium-view-state';

describe('dialogReducer', () => {
  it('has correct initial state', () => {
    expect(initialDialogState).toEqual({
      contextMenuOpen: false,
      contextMenuPosition: { x: 0, y: 0 },
      goToDialogOpen: false,
      detailDrawerOpen: false,
      closeConfirmDialogOpen: false,
    });
  });

  describe('SET_CONTEXT_MENU', () => {
    it('opens context menu', () => {
      const result = dialogReducer(initialDialogState, { type: 'SET_CONTEXT_MENU', open: true });
      expect(result.contextMenuOpen).toBe(true);
    });

    it('closes context menu', () => {
      const state: DialogState = { ...initialDialogState, contextMenuOpen: true };
      const result = dialogReducer(state, { type: 'SET_CONTEXT_MENU', open: false });
      expect(result.contextMenuOpen).toBe(false);
    });

    it('preserves other dialog states when closing', () => {
      const state: DialogState = {
        ...initialDialogState,
        contextMenuOpen: true,
        goToDialogOpen: true,
        detailDrawerOpen: true,
      };
      const result = dialogReducer(state, { type: 'SET_CONTEXT_MENU', open: false });
      expect(result.contextMenuOpen).toBe(false);
      expect(result.goToDialogOpen).toBe(true);
      expect(result.detailDrawerOpen).toBe(true);
    });
  });

  describe('OPEN_CONTEXT_MENU', () => {
    it('sets open to true and updates position', () => {
      const position = { x: 150, y: 300 };
      const result = dialogReducer(initialDialogState, { type: 'OPEN_CONTEXT_MENU', position });
      expect(result.contextMenuOpen).toBe(true);
      expect(result.contextMenuPosition).toEqual(position);
    });

    it('updates position when already open', () => {
      const state: DialogState = {
        ...initialDialogState,
        contextMenuOpen: true,
        contextMenuPosition: { x: 100, y: 200 },
      };
      const newPosition = { x: 250, y: 450 };
      const result = dialogReducer(state, { type: 'OPEN_CONTEXT_MENU', position: newPosition });
      expect(result.contextMenuOpen).toBe(true);
      expect(result.contextMenuPosition).toEqual(newPosition);
    });
  });

  describe('SET_GO_TO_DIALOG', () => {
    it('opens go-to dialog', () => {
      const result = dialogReducer(initialDialogState, { type: 'SET_GO_TO_DIALOG', open: true });
      expect(result.goToDialogOpen).toBe(true);
    });

    it('closes go-to dialog', () => {
      const state: DialogState = { ...initialDialogState, goToDialogOpen: true };
      const result = dialogReducer(state, { type: 'SET_GO_TO_DIALOG', open: false });
      expect(result.goToDialogOpen).toBe(false);
    });
  });

  describe('SET_DETAIL_DRAWER', () => {
    it('opens detail drawer', () => {
      const result = dialogReducer(initialDialogState, { type: 'SET_DETAIL_DRAWER', open: true });
      expect(result.detailDrawerOpen).toBe(true);
    });

    it('closes detail drawer', () => {
      const state: DialogState = { ...initialDialogState, detailDrawerOpen: true };
      const result = dialogReducer(state, { type: 'SET_DETAIL_DRAWER', open: false });
      expect(result.detailDrawerOpen).toBe(false);
    });
  });

  describe('SET_CLOSE_CONFIRM', () => {
    it('opens close confirm dialog', () => {
      const result = dialogReducer(initialDialogState, { type: 'SET_CLOSE_CONFIRM', open: true });
      expect(result.closeConfirmDialogOpen).toBe(true);
    });

    it('closes close confirm dialog', () => {
      const state: DialogState = { ...initialDialogState, closeConfirmDialogOpen: true };
      const result = dialogReducer(state, { type: 'SET_CLOSE_CONFIRM', open: false });
      expect(result.closeConfirmDialogOpen).toBe(false);
    });
  });

  describe('unknown action', () => {
    it('returns current state for unknown action type', () => {
      const unknownAction = { type: 'UNKNOWN' } as unknown as DialogAction;
      const result = dialogReducer(initialDialogState, unknownAction);
      expect(result).toBe(initialDialogState);
    });
  });

  describe('state immutability', () => {
    it('returns a new object reference on state change', () => {
      const result = dialogReducer(initialDialogState, { type: 'SET_GO_TO_DIALOG', open: true });
      expect(result).not.toBe(initialDialogState);
    });

    it('does not mutate the original state', () => {
      const stateBefore = { ...initialDialogState };
      dialogReducer(initialDialogState, { type: 'SET_CONTEXT_MENU', open: true });
      expect(initialDialogState).toEqual(stateBefore);
    });
  });
});
