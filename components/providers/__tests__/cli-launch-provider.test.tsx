/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { CliLaunchProvider } from '../cli-launch-provider';
import type { CliMatches } from '@/lib/tauri/cli-api';
import { cliApi } from '@/lib/tauri/cli-api';
import { useCliBridgeStore, useOnboardingBridgeStore, usePlanningUiStore, usePlateSolverStore } from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { targetIoApi, sessionIoApi } from '@/lib/tauri/api';
import { isTauri } from '@/lib/storage/platform';

let mockPathname = '/';
const mockPush = jest.fn();
const mockUnlisten = jest.fn();

async function flushAsyncWork() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => ((key: string) => key),
}));

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(async () => null),
}));

jest.mock('@/lib/tauri/secret-vault-api', () => ({
  secretVaultApi: {
    isAvailable: jest.fn(() => true),
    getStatus: jest.fn(async () => ({
      available: true,
      mode: 'desktop',
      state: 'ready',
    })),
    getMapApiKey: jest.fn(async () => null),
    setMapApiKey: jest.fn(async () => undefined),
    deleteMapApiKey: jest.fn(async () => undefined),
    getPlateSolverApiKey: jest.fn(async () => null),
    setPlateSolverApiKey: jest.fn(async () => undefined),
    deletePlateSolverApiKey: jest.fn(async () => undefined),
    getEventSourceApiKey: jest.fn(async () => null),
    setEventSourceApiKey: jest.fn(async () => undefined),
    deleteEventSourceApiKey: jest.fn(async () => undefined),
  },
}));

jest.mock('@tauri-apps/plugin-fs', () => ({
  exists: jest.fn(async () => true),
}));

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
  isServer: jest.fn(() => false),
  isWeb: jest.fn(() => false),
  isMobile: jest.fn(() => false),
  isDesktop: jest.fn(() => true),
  getPlatform: jest.fn(() => 'tauri'),
  onlyInTauri: jest.fn(),
  onlyInWeb: jest.fn(),
}));

jest.mock('@/lib/tauri/cli-api', () => ({
  CLI_SECOND_INSTANCE_EVENT: 'cli-second-instance',
  cliApi: {
    getStartupMatches: jest.fn(),
    parseMatchesFromArgs: jest.fn(),
    listenForForwardedInvocations: jest.fn(),
  },
}));

jest.mock('@/lib/tauri/api', () => ({
  targetIoApi: {
    importTargets: jest.fn(),
  },
  sessionIoApi: {
    importSessionPlan: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('CliLaunchProvider', () => {
  const mockGetStartupMatches = cliApi.getStartupMatches as jest.Mock;
  const mockParseMatchesFromArgs = cliApi.parseMatchesFromArgs as jest.Mock;
  const mockListenForForwardedInvocations = cliApi.listenForForwardedInvocations as jest.Mock;
  const mockImportTargets = targetIoApi.importTargets as jest.Mock;
  const mockImportSessionPlan = sessionIoApi.importSessionPlan as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
    (isTauri as jest.Mock).mockReturnValue(true);
    mockListenForForwardedInvocations.mockResolvedValue(mockUnlisten);
    mockGetStartupMatches.mockResolvedValue(null);
    mockParseMatchesFromArgs.mockResolvedValue(null);
    mockImportTargets.mockResolvedValue({ imported: 1, skipped: 0, errors: [], targets: [] });
    mockImportSessionPlan.mockResolvedValue('{"planDate":"2026-03-12T00:00:00.000Z"}');

    act(() => {
      useCliBridgeStore.setState({
        searchRequestId: 0,
        pendingSearchQuery: null,
        sessionPlanImportRequestId: 0,
        sessionPlanImportContent: null,
        sessionPlanImportSourcePath: null,
        plateSolverRequestId: 0,
        plateSolverLaunch: null,
      });
      useOnboardingBridgeStore.setState({
        openSettingsDrawerRequestId: 0,
        settingsDrawerTab: null,
        settingsDrawerOpen: false,
        openSearchRequestId: 0,
        toggleSearchRequestId: 0,
        toggleSessionPanelRequestId: 0,
        openMobileDrawerRequestId: 0,
        openDailyKnowledgeRequestId: 0,
        mobileDrawerSection: null,
        closeTransientPanelsRequestId: 0,
      } as never);
      usePlanningUiStore.setState({ sessionPlannerOpen: false } as never);
      usePlateSolverStore.setState((state) => ({
        ...state,
        config: {
          ...state.config,
          solver_type: 'astrometry_net_online',
        },
      }));
      useTargetListStore.setState({
        addTargetsBatch: jest.fn(),
      } as never);
    });
  });

  it('queues search intents until the starmap route is active', async () => {
    const matches: CliMatches = {
      args: {},
      subcommand: {
        name: 'open',
        matches: {
          args: {},
          subcommand: {
            name: 'object',
            matches: {
              args: {
                query: { value: 'M31', occurrences: 1 },
              },
              subcommand: null,
            },
          },
        },
      },
    };
    mockGetStartupMatches.mockResolvedValue(matches);

    const { rerender } = render(
      <CliLaunchProvider>
        <div>child</div>
      </CliLaunchProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/starmap');
    });

    expect(useCliBridgeStore.getState().searchRequestId).toBe(0);

    mockPathname = '/starmap';
    rerender(
      <CliLaunchProvider>
        <div>child</div>
      </CliLaunchProvider>
    );

    await waitFor(() => {
      expect(useCliBridgeStore.getState().searchRequestId).toBe(1);
      expect(useCliBridgeStore.getState().pendingSearchQuery).toBe('M31');
    });
  });

  it('does not replay startup intents after routing to starmap', async () => {
    const matches: CliMatches = {
      args: {},
      subcommand: {
        name: 'open',
        matches: {
          args: {},
          subcommand: {
            name: 'object',
            matches: {
              args: {
                query: { value: 'M31', occurrences: 1 },
              },
              subcommand: null,
            },
          },
        },
      },
    };
    mockGetStartupMatches.mockResolvedValue(matches);

    const { rerender } = render(
      <CliLaunchProvider>
        <div>child</div>
      </CliLaunchProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/starmap');
    });

    mockPathname = '/starmap';
    rerender(
      <CliLaunchProvider>
        <div>child</div>
      </CliLaunchProvider>
    );

    await waitFor(() => {
      expect(useCliBridgeStore.getState().searchRequestId).toBe(1);
    });
    await flushAsyncWork();

    expect(mockGetStartupMatches).toHaveBeenCalledTimes(1);
    expect(useCliBridgeStore.getState().searchRequestId).toBe(1);
    expect(useCliBridgeStore.getState().pendingSearchQuery).toBe('M31');
  });

  it('reparses forwarded args from second-instance events', async () => {
    const forwardedMatches: CliMatches = {
      args: {
        settings: { value: true, occurrences: 1 },
      },
      subcommand: null,
    };
    mockPathname = '/starmap';
    mockParseMatchesFromArgs.mockResolvedValue(forwardedMatches);

    render(
      <CliLaunchProvider>
        <div>child</div>
      </CliLaunchProvider>
    );

    await waitFor(() => {
      expect(mockListenForForwardedInvocations).toHaveBeenCalled();
    });

    const listener = mockListenForForwardedInvocations.mock.calls[0][0] as (payload: { args: string[]; cwd: string | null }) => void;
    await act(async () => {
      listener({ args: ['SkyMap.exe', '--settings'], cwd: 'D:/Astro' });
    });

    await waitFor(() => {
      expect(mockParseMatchesFromArgs).toHaveBeenCalledWith(['SkyMap.exe', '--settings']);
      expect(useOnboardingBridgeStore.getState().openSettingsDrawerRequestId).toBe(1);
    });
  });

  it('imports target files through the provider workflow', async () => {
    mockPathname = '/starmap';
    const addTargetsBatch = jest.fn();
    useTargetListStore.setState({ addTargetsBatch } as never);
    mockGetStartupMatches.mockResolvedValue({
      args: {},
      subcommand: {
        name: 'import',
        matches: {
          args: {},
          subcommand: {
            name: 'targets',
            matches: {
              args: {
                path: { value: 'D:/targets.csv', occurrences: 1 },
              },
              subcommand: null,
            },
          },
        },
      },
    } satisfies CliMatches);
    mockImportTargets.mockResolvedValue({
      imported: 1,
      skipped: 0,
      errors: [],
      targets: [
        {
          name: 'M31',
          ra: 10.684,
          dec: 41.269,
          ra_string: '00h42m44s',
          dec_string: '+41°16′9″',
        },
      ],
    });

    render(
      <CliLaunchProvider>
        <div>child</div>
      </CliLaunchProvider>
    );

    await waitFor(() => {
      expect(mockImportTargets).toHaveBeenCalledWith('D:/targets.csv');
      expect(addTargetsBatch).toHaveBeenCalledWith([
        {
          name: 'M31',
          ra: 10.684,
          dec: 41.269,
          raString: '00h42m44s',
          decString: '+41°16′9″',
        },
      ]);
    });
  });

  it('does nothing outside Tauri', async () => {
    (isTauri as jest.Mock).mockReturnValue(false);

    render(
      <CliLaunchProvider>
        <div>child</div>
      </CliLaunchProvider>
    );

    await waitFor(() => {
      expect(mockGetStartupMatches).not.toHaveBeenCalled();
      expect(mockListenForForwardedInvocations).not.toHaveBeenCalled();
    });
  });
});



