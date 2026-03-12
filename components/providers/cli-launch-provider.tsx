'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';
import { isTauri } from '@/lib/storage/platform';
import { cliApi } from '@/lib/tauri/cli-api';
import { normalizeCliMatches, type CliLaunchIntent } from '@/lib/core/cli-intents';
import { targetIoApi, sessionIoApi } from '@/lib/tauri/api';
import {
  useCliBridgeStore,
  useOnboardingBridgeStore,
  usePlanningUiStore,
  usePlateSolverStore,
} from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';

const logger = createLogger('cli-launch-provider');

const TARGET_IMPORT_EXTENSIONS = new Set(['.csv', '.json', '.txt']);
const SESSION_PLAN_EXTENSIONS = new Set(['.txt', '.md', '.json', '.xml', '.csv']);
const SOLVE_IMAGE_EXTENSIONS = new Set(['.fits', '.fit', '.fts', '.xisf', '.jpg', '.jpeg', '.png', '.tif', '.tiff']);

async function focusMainWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const window = getCurrentWindow();

  try {
    if (await window.isMinimized()) {
      await window.unminimize();
    }
  } catch (error) {
    logger.warn('Failed to unminimize CLI target window', error);
  }

  try {
    await window.show();
  } catch (error) {
    logger.warn('Failed to show CLI target window', error);
  }

  await window.setFocus();
}

async function pathExists(path: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    const { exists } = await import('@tauri-apps/plugin-fs');
    return await exists(path);
  } catch (error) {
    logger.warn('Failed to validate CLI file path existence', error);
    return true;
  }
}

function getExtension(path: string): string {
  const normalized = path.trim().toLowerCase();
  const index = normalized.lastIndexOf('.');
  return index >= 0 ? normalized.slice(index) : '';
}

export function CliLaunchProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const pendingIntentsRef = useRef<CliLaunchIntent[]>([]);
  const drainingRef = useRef(false);
  const startupMatchesLoadedRef = useRef(false);
  const pathnameRef = useRef(pathname);

  const requestSearch = useCliBridgeStore((state) => state.requestSearch);
  const requestSessionPlanImport = useCliBridgeStore((state) => state.requestSessionPlanImport);
  const requestPlateSolverLaunch = useCliBridgeStore((state) => state.requestPlateSolverLaunch);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const handleNormalization = useCallback((source: 'startup' | 'forwarded', matches: Awaited<ReturnType<typeof cliApi.getStartupMatches>>) => {
    const normalized = normalizeCliMatches(matches);
    for (const error of normalized.errors) {
      logger.warn(`CLI normalization error (${source})`, error);
      toast.error(t('cli.notifications.invalidRequest'), {
        description: error.message,
      });
    }
    pendingIntentsRef.current.push(...normalized.intents);
  }, [t]);

  const dispatchIntent = useCallback(async (intent: CliLaunchIntent): Promise<boolean> => {
    const requireStarmap = (
      intent.type === 'open-settings' ||
      intent.type === 'open-search' ||
      intent.type === 'open-route' ||
      intent.type === 'open-object' ||
      intent.type === 'import-session-plan' ||
      intent.type === 'solve-image'
    );

    if (requireStarmap && pathnameRef.current !== '/starmap') {
      router.push('/starmap');
      return false;
    }

    switch (intent.type) {
      case 'focus-window':
        await focusMainWindow();
        return true;
      case 'open-settings':
        useOnboardingBridgeStore.getState().openSettingsDrawer();
        return true;
      case 'open-search':
        requestSearch();
        useOnboardingBridgeStore.getState().openSearch();
        return true;
      case 'open-route':
        if (intent.route === 'starmap') {
          return true;
        }
        if (intent.route === 'search') {
          requestSearch();
          useOnboardingBridgeStore.getState().openSearch();
          return true;
        }
        if (intent.route === 'settings') {
          useOnboardingBridgeStore.getState().openSettingsDrawer();
          return true;
        }
        if (intent.route === 'session-planner') {
          usePlanningUiStore.getState().openSessionPlanner();
          return true;
        }
        if (intent.route === 'plate-solver') {
          requestPlateSolverLaunch({});
          return true;
        }
        return true;
      case 'open-object':
        requestSearch(intent.query);
        useOnboardingBridgeStore.getState().openSearch();
        return true;
      case 'import-targets': {
        const extension = getExtension(intent.path);
        if (!TARGET_IMPORT_EXTENSIONS.has(extension) || !(await pathExists(intent.path))) {
          toast.error(t('cli.notifications.importTargetsFailed'), {
            description: t('cli.notifications.invalidPath', { path: intent.path }),
          });
          return true;
        }

        const result = await targetIoApi.importTargets(intent.path);
        if (result.targets.length > 0) {
          useTargetListStore.getState().addTargetsBatch(
            result.targets.map((target) => ({
              name: target.name,
              ra: target.ra,
              dec: target.dec,
              raString: target.ra_string || '',
              decString: target.dec_string || '',
            })),
          );
        }

        toast.success(t('cli.notifications.importTargetsSuccess'), {
          description: t('cli.notifications.importTargetsSummary', {
            imported: result.imported,
            skipped: result.skipped,
          }),
        });
        return true;
      }
      case 'import-session-plan': {
        const extension = getExtension(intent.path);
        if (!SESSION_PLAN_EXTENSIONS.has(extension) || !(await pathExists(intent.path))) {
          toast.error(t('cli.notifications.importSessionPlanFailed'), {
            description: t('cli.notifications.invalidPath', { path: intent.path }),
          });
          return true;
        }

        const content = await sessionIoApi.importSessionPlan(intent.path);
        usePlanningUiStore.getState().openSessionPlanner();
        requestSessionPlanImport(content, intent.path);
        toast.success(t('cli.notifications.importSessionPlanReady'));
        return true;
      }
      case 'solve-image': {
        const extension = getExtension(intent.path);
        if (!SOLVE_IMAGE_EXTENSIONS.has(extension) || !(await pathExists(intent.path))) {
          toast.error(t('cli.notifications.solveImageFailed'), {
            description: t('cli.notifications.invalidPath', { path: intent.path }),
          });
          return true;
        }

        if (intent.solver) {
          usePlateSolverStore.getState().setConfig({ solver_type: intent.solver });
        }

        requestPlateSolverLaunch({
          imagePath: intent.path,
          solver: intent.solver,
          raHint: intent.raHint,
          decHint: intent.decHint,
          fovHint: intent.fovHint,
        });

        toast.success(t('cli.notifications.solveImageReady'));
        return true;
      }
      default:
        return true;
    }
  }, [requestPlateSolverLaunch, requestSearch, requestSessionPlanImport, router, t]);

  const drainQueue = useCallback(async () => {
    if (drainingRef.current) {
      return;
    }

    drainingRef.current = true;
    try {
      while (pendingIntentsRef.current.length > 0) {
        const intent = pendingIntentsRef.current[0];
        const completed = await dispatchIntent(intent);
        if (!completed) {
          break;
        }
        pendingIntentsRef.current.shift();
      }
    } catch (error) {
      logger.error('Failed to dispatch CLI launch intent', error);
      toast.error(t('cli.notifications.executionFailed'));
      pendingIntentsRef.current.shift();
    } finally {
      drainingRef.current = false;
    }
  }, [dispatchIntent, t]);

  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    let mounted = true;
    let unlisten: (() => void) | null = null;

    const initialize = async () => {
      if (!startupMatchesLoadedRef.current) {
        startupMatchesLoadedRef.current = true;
        const startupMatches = await cliApi.getStartupMatches();
        if (!mounted) {
          return;
        }
        handleNormalization('startup', startupMatches);
        await drainQueue();
      }

      const forwardedUnlisten = await cliApi.listenForForwardedInvocations(async ({ args }) => {
        const forwardedMatches = await cliApi.parseMatchesFromArgs(args);
        if (!mounted) {
          return;
        }
        handleNormalization('forwarded', forwardedMatches);
        await drainQueue();
      });

      if (!mounted) {
        forwardedUnlisten?.();
        return;
      }

      unlisten = forwardedUnlisten;
    };

    void initialize();

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, [drainQueue, handleNormalization]);

  useEffect(() => {
    if (!isTauri()) {
      return;
    }
    void drainQueue();
  }, [drainQueue, pathname]);

  return <>{children}</>;
}

export default CliLaunchProvider;
