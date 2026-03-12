/**
 * @jest-environment jsdom
 */

import type { CliMatches } from '@/lib/tauri/cli-api';
import { normalizeCliMatches } from '../cli-intents';

function arg(value: string | boolean | string[] | null, occurrences = 1) {
  return { value, occurrences };
}

describe('normalizeCliMatches', () => {
  it('creates intents from root launch flags', () => {
    const matches: CliMatches = {
      args: {
        focus: arg(true),
        settings: arg(true),
      },
      subcommand: null,
    };

    const result = normalizeCliMatches(matches);

    expect(result.errors).toEqual([]);
    expect(result.intents).toEqual([
      { type: 'focus-window' },
      { type: 'open-settings' },
    ]);
  });

  it('normalizes object open commands', () => {
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
                query: arg('M31'),
              },
              subcommand: null,
            },
          },
        },
      },
    };

    const result = normalizeCliMatches(matches);

    expect(result.errors).toEqual([]);
    expect(result.intents).toEqual([
      { type: 'open-object', query: 'M31' },
    ]);
  });

  it('normalizes import and solve commands with typed options', () => {
    const importMatches: CliMatches = {
      args: {},
      subcommand: {
        name: 'import',
        matches: {
          args: {},
          subcommand: {
            name: 'session-plan',
            matches: {
              args: {
                path: arg('D:/plans/tonight.json'),
              },
              subcommand: null,
            },
          },
        },
      },
    };

    const solveMatches: CliMatches = {
      args: {},
      subcommand: {
        name: 'solve',
        matches: {
          args: {},
          subcommand: {
            name: 'image',
            matches: {
              args: {
                path: arg('D:/images/m31.fits'),
                solver: arg('astap'),
                'ra-hint': arg('10.684'),
                'dec-hint': arg('41.269'),
                'fov-hint': arg('2.5'),
              },
              subcommand: null,
            },
          },
        },
      },
    };

    expect(normalizeCliMatches(importMatches)).toEqual({
      intents: [
        { type: 'import-session-plan', path: 'D:/plans/tonight.json' },
      ],
      errors: [],
    });

    expect(normalizeCliMatches(solveMatches)).toEqual({
      intents: [
        {
          type: 'solve-image',
          path: 'D:/images/m31.fits',
          solver: 'astap',
          raHint: 10.684,
          decHint: 41.269,
          fovHint: 2.5,
        },
      ],
      errors: [],
    });
  });

  it('reports invalid numeric hints without crashing normalization', () => {
    const matches: CliMatches = {
      args: {},
      subcommand: {
        name: 'solve',
        matches: {
          args: {},
          subcommand: {
            name: 'image',
            matches: {
              args: {
                path: arg('D:/images/m31.fits'),
                'ra-hint': arg('not-a-number'),
              },
              subcommand: null,
            },
          },
        },
      },
    };

    const result = normalizeCliMatches(matches);

    expect(result.intents).toEqual([]);
    expect(result.errors).toEqual([
      {
        code: 'invalid-number',
        message: expect.stringContaining('ra-hint'),
      },
    ]);
  });
});
