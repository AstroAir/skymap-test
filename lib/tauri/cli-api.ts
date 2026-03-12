import { createLogger } from '@/lib/logger';
import { isTauri } from '@/lib/storage/platform';

const logger = createLogger('cli-api');

export const CLI_SECOND_INSTANCE_EVENT = 'cli-second-instance';

export interface CliArgMatch {
  value: string | boolean | string[] | null;
  occurrences: number;
}

export interface CliSubcommandMatch {
  name: string;
  matches: CliMatches;
}

export interface CliMatches {
  args: Record<string, CliArgMatch>;
  subcommand: CliSubcommandMatch | null;
}

export interface ForwardedCliInvocation {
  args: string[];
  cwd: string | null;
}

export type ForwardedCliInvocationHandler = (invocation: ForwardedCliInvocation) => void;

type CliPlugin = typeof import('@tauri-apps/plugin-cli');

export let cliPluginLoader = async (): Promise<CliPlugin | null> => {
  if (!isTauri()) {
    return null;
  }

  return await import('@tauri-apps/plugin-cli');
}

export const cliApi = {
  isAvailable(): boolean {
    return isTauri();
  },

  async getStartupMatches(): Promise<CliMatches | null> {
    const plugin = await cliPluginLoader();
    if (!plugin) {
      return null;
    }

    try {
      return await plugin.getMatches();
    } catch (error) {
      logger.error('Failed to read startup CLI matches', error);
      return null;
    }
  },

  async parseMatchesFromArgs(args: string[]): Promise<CliMatches | null> {
    if (!isTauri()) {
      return null;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<CliMatches>('parse_cli_matches_from_args', { args });
    } catch (error) {
      logger.error('Failed to parse forwarded CLI args', error);
      return null;
    }
  },

  async listenForForwardedInvocations(
    handler: ForwardedCliInvocationHandler,
  ): Promise<(() => void) | null> {
    if (!isTauri()) {
      return null;
    }

    const { listen } = await import('@tauri-apps/api/event');
    return await listen<ForwardedCliInvocation>(CLI_SECOND_INSTANCE_EVENT, (event) => {
      handler(event.payload);
    });
  },
};

export function setCliPluginLoader(loader: typeof cliPluginLoader) {
  cliPluginLoader = loader;
}

export default cliApi;


