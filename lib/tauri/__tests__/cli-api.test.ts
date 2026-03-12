/**
 * @jest-environment jsdom
 */

import { cliApi, CLI_SECOND_INSTANCE_EVENT, type CliMatches, setCliPluginLoader } from '../cli-api';
import { isTauri } from '@/lib/storage/platform';

const mockInvoke = jest.fn();
const mockListen = jest.fn();

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
}));

jest.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

jest.mock('@tauri-apps/api/event', () => ({
  listen: (...args: unknown[]) => mockListen(...args),
}));

describe('cliApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isTauri as jest.Mock).mockReturnValue(true);
    setCliPluginLoader(async () => null);
  });

  it('returns null startup matches outside Tauri', async () => {
    (isTauri as jest.Mock).mockReturnValue(false);

    await expect(cliApi.getStartupMatches()).resolves.toBeNull();
  });

  it('reads startup matches from the plugin in Tauri', async () => {
    const matches: CliMatches = { args: { focus: { value: true, occurrences: 1 } }, subcommand: null };
    setCliPluginLoader(async () => ({
      getMatches: jest.fn(async () => matches),
    } as never));

    await expect(cliApi.getStartupMatches()).resolves.toEqual(matches);
  });

  it('reparses forwarded args through the backend bridge', async () => {
    const matches: CliMatches = { args: {}, subcommand: null };
    mockInvoke.mockResolvedValue(matches);

    await expect(cliApi.parseMatchesFromArgs(['SkyMap.exe', 'open', 'object', 'M31'])).resolves.toEqual(matches);
    expect(mockInvoke).toHaveBeenCalledWith('parse_cli_matches_from_args', {
      args: ['SkyMap.exe', 'open', 'object', 'M31'],
    });
  });

  it('listens for second-instance payloads in Tauri', async () => {
    const callback = jest.fn();
    const unlisten = jest.fn();
    mockListen.mockResolvedValue(unlisten);

    await expect(cliApi.listenForForwardedInvocations(callback)).resolves.toBe(unlisten);
    expect(mockListen).toHaveBeenCalledWith(CLI_SECOND_INSTANCE_EVENT, expect.any(Function));

    const handler = mockListen.mock.calls[0][1] as (event: { payload: unknown }) => void;
    handler({ payload: { args: ['SkyMap.exe', '--focus'], cwd: 'D:/Astro' } });

    expect(callback).toHaveBeenCalledWith({ args: ['SkyMap.exe', '--focus'], cwd: 'D:/Astro' });
  });
});
