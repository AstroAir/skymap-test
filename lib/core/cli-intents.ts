import type { SolverType } from '@/lib/tauri/plate-solver-api';
import type { CliArgMatch, CliMatches } from '@/lib/tauri/cli-api';

export type CliRouteTarget = 'starmap' | 'search' | 'settings' | 'session-planner' | 'plate-solver';

export type CliLaunchIntent =
  | { type: 'focus-window' }
  | { type: 'open-settings' }
  | { type: 'open-search' }
  | { type: 'open-route'; route: CliRouteTarget }
  | { type: 'open-object'; query: string }
  | { type: 'import-targets'; path: string }
  | { type: 'import-session-plan'; path: string }
  | {
      type: 'solve-image';
      path: string;
      solver?: SolverType;
      raHint?: number;
      decHint?: number;
      fovHint?: number;
    };

export interface CliLaunchValidationError {
  code: 'invalid-number' | 'missing-value' | 'invalid-route' | 'unsupported-command';
  message: string;
}

export interface CliNormalizationResult {
  intents: CliLaunchIntent[];
  errors: CliLaunchValidationError[];
}

function getArg(matches: CliMatches, name: string): CliArgMatch | undefined {
  return matches.args[name];
}

function getBooleanArg(matches: CliMatches, name: string): boolean {
  return getArg(matches, name)?.value === true;
}

function getStringArg(matches: CliMatches, name: string): string | null {
  const value = getArg(matches, name)?.value;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function parseNumericArg(
  matches: CliMatches,
  name: string,
  errors: CliLaunchValidationError[],
): number | undefined {
  const raw = getStringArg(matches, name);
  if (raw === null) {
    return undefined;
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    errors.push({
      code: 'invalid-number',
      message: `Invalid numeric value for ${name}: ${raw}`,
    });
    return undefined;
  }

  return parsed;
}

function normalizeRootFlags(matches: CliMatches, intents: CliLaunchIntent[]) {
  if (getBooleanArg(matches, 'focus')) {
    intents.push({ type: 'focus-window' });
  }

  if (getBooleanArg(matches, 'settings')) {
    intents.push({ type: 'open-settings' });
  }

  if (getBooleanArg(matches, 'search')) {
    intents.push({ type: 'open-search' });
  }
}

export function normalizeCliMatches(matches: CliMatches | null): CliNormalizationResult {
  if (!matches) {
    return { intents: [], errors: [] };
  }

  const intents: CliLaunchIntent[] = [];
  const errors: CliLaunchValidationError[] = [];

  normalizeRootFlags(matches, intents);

  const subcommand = matches.subcommand;
  if (!subcommand) {
    return { intents, errors };
  }

  if (subcommand.name === 'open') {
    const nested = subcommand.matches.subcommand;
    if (!nested) {
      errors.push({ code: 'unsupported-command', message: 'Missing open subcommand.' });
      return { intents, errors };
    }

    if (nested.name === 'object') {
      const query = getStringArg(nested.matches, 'query');
      if (!query) {
        errors.push({ code: 'missing-value', message: 'Missing object query.' });
        return { intents, errors };
      }
      intents.push({ type: 'open-object', query });
      return { intents, errors };
    }

    if (nested.name === 'route') {
      const route = getStringArg(nested.matches, 'route') as CliRouteTarget | null;
      if (!route) {
        errors.push({ code: 'missing-value', message: 'Missing route target.' });
        return { intents, errors };
      }
      intents.push({ type: 'open-route', route });
      return { intents, errors };
    }
  }

  if (subcommand.name === 'import') {
    const nested = subcommand.matches.subcommand;
    if (!nested) {
      errors.push({ code: 'unsupported-command', message: 'Missing import subcommand.' });
      return { intents, errors };
    }

    const path = getStringArg(nested.matches, 'path');
    if (!path) {
      errors.push({ code: 'missing-value', message: 'Missing import path.' });
      return { intents, errors };
    }

    if (nested.name === 'targets') {
      intents.push({ type: 'import-targets', path });
      return { intents, errors };
    }

    if (nested.name === 'session-plan') {
      intents.push({ type: 'import-session-plan', path });
      return { intents, errors };
    }
  }

  if (subcommand.name === 'solve') {
    const nested = subcommand.matches.subcommand;
    if (!nested || nested.name !== 'image') {
      errors.push({ code: 'unsupported-command', message: 'Missing solve image subcommand.' });
      return { intents, errors };
    }

    const path = getStringArg(nested.matches, 'path');
    if (!path) {
      errors.push({ code: 'missing-value', message: 'Missing image path.' });
      return { intents, errors };
    }

    const solver = getStringArg(nested.matches, 'solver') as SolverType | null;
    const raHint = parseNumericArg(nested.matches, 'ra-hint', errors);
    const decHint = parseNumericArg(nested.matches, 'dec-hint', errors);
    const fovHint = parseNumericArg(nested.matches, 'fov-hint', errors);

    if (errors.length === 0) {
      intents.push({
        type: 'solve-image',
        path,
        ...(solver ? { solver } : {}),
        ...(raHint !== undefined ? { raHint } : {}),
        ...(decHint !== undefined ? { decHint } : {}),
        ...(fovHint !== undefined ? { fovHint } : {}),
      });
    }

    return { intents, errors };
  }

  errors.push({ code: 'unsupported-command', message: `Unsupported command: ${subcommand.name}` });
  return { intents, errors };
}
