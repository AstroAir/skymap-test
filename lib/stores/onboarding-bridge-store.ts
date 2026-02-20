import { create } from 'zustand';

interface OnboardingBridgeState {
  expandRightPanelRequestId: number;
  openSettingsDrawerRequestId: number;
  settingsDrawerTab: string | null;
  openSearchRequestId: number;
  openMobileDrawerRequestId: number;
  openDailyKnowledgeRequestId: number;
  mobileDrawerSection: string | null;
  closeTransientPanelsRequestId: number;

  expandRightPanel: () => void;
  openSettingsDrawer: (tab?: string) => void;
  openSearch: () => void;
  openMobileDrawer: (section?: string) => void;
  openDailyKnowledge: () => void;
  closeTransientPanels: () => void;
}

export const useOnboardingBridgeStore = create<OnboardingBridgeState>()(
  (set) => ({
    expandRightPanelRequestId: 0,
    openSettingsDrawerRequestId: 0,
    settingsDrawerTab: null,
    openSearchRequestId: 0,
    openMobileDrawerRequestId: 0,
    openDailyKnowledgeRequestId: 0,
    mobileDrawerSection: null,
    closeTransientPanelsRequestId: 0,

    expandRightPanel: () =>
      set((state) => ({
        expandRightPanelRequestId: state.expandRightPanelRequestId + 1,
      })),

    openSettingsDrawer: (tab) =>
      set((state) => ({
        openSettingsDrawerRequestId: state.openSettingsDrawerRequestId + 1,
        settingsDrawerTab: tab ?? null,
      })),

    openSearch: () =>
      set((state) => ({
        openSearchRequestId: state.openSearchRequestId + 1,
      })),

    openMobileDrawer: (section) =>
      set((state) => ({
        openMobileDrawerRequestId: state.openMobileDrawerRequestId + 1,
        mobileDrawerSection: section ?? null,
      })),

    openDailyKnowledge: () =>
      set((state) => ({
        openDailyKnowledgeRequestId: state.openDailyKnowledgeRequestId + 1,
      })),

    closeTransientPanels: () =>
      set((state) => ({
        closeTransientPanelsRequestId: state.closeTransientPanelsRequestId + 1,
      })),
  }),
);
