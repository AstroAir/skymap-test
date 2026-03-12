import type {
  SearchResultItem,
  SearchRunMessage,
  SearchRunOutcome,
  SearchProviderDiagnostic,
  SearchProgressStage,
} from '@/lib/core/types';
import {
  searchOnlineByCoordinates,
  searchOnlineByName,
  type OnlineSearchResponse,
  type OnlineSearchResult,
  type OnlineSearchSource,
} from '@/lib/services/online-search-service';
import { formatRA, formatDec } from '@/lib/astronomy/coordinates/formats';
import { parseSearchQuery } from './query-parser';
import { mergeSearchItems } from './search-merge';
import type { ParsedSearchQuery, SearchIntent } from './search-intent';
import { filterSearchProvidersForQuery, getEligibleSearchProviders } from '@/lib/services/online-data-provider-registry';

export type UnifiedSearchMode = 'local' | 'online' | 'hybrid';

export interface CachedOnlinePayload {
  results: OnlineSearchResult[];
  timestamp: number;
}

export interface UnifiedSearchProgress {
  stage: Exclude<SearchProgressStage, 'idle'>;
  parsed: ParsedSearchQuery;
  intent: SearchIntent;
  outcome: SearchRunOutcome;
  results: SearchResultItem[];
  localResults: SearchResultItem[];
  onlineResults: SearchResultItem[];
  issues: SearchRunIssue[];
  providerDiagnostics: SearchProviderDiagnostic[];
  refinementHints: ParsedSearchQuery['refinementHints'];
  usedCachedOnline: boolean;
}

export interface UnifiedSearchOptions {
  query: string;
  mode: UnifiedSearchMode;
  onlineAvailable: boolean;
  enabledSources: OnlineSearchSource[];
  timeout: number;
  maxResults: number;
  searchRadiusDeg: number;
  includeMinorObjects: boolean;
  signal?: AbortSignal;
  localSearch?: (context: {
    parsed: ParsedSearchQuery;
    query: string;
  }) => Promise<SearchResultItem[]> | SearchResultItem[];
  cachedOnline?: CachedOnlinePayload | null;
  cacheMaxAgeMs?: number;
  onProgress?: (update: UnifiedSearchProgress) => void;
}

export interface BatchSearchItem {
  query: string;
  results: SearchResultItem[];
  outcome: SearchRunOutcome;
  issues?: SearchRunIssue[];
  errors?: string[];
  warnings?: string[];
  providerDiagnostics?: SearchProviderDiagnostic[];
  refinementHints?: ParsedSearchQuery['refinementHints'];
}

export type SearchRunIssue = SearchRunMessage;

export interface UnifiedSearchResult {
  parsed: ParsedSearchQuery;
  intent: SearchIntent;
  stage: 'finalized';
  outcome: SearchRunOutcome;
  results: SearchResultItem[];
  localResults: SearchResultItem[];
  onlineResults: SearchResultItem[];
  onlineResponse?: OnlineSearchResponse;
  issues: SearchRunIssue[];
  errors: string[];
  warnings: string[];
  providerDiagnostics: SearchProviderDiagnostic[];
  refinementHints: ParsedSearchQuery['refinementHints'];
  usedCachedOnline: boolean;
  batchItems?: BatchSearchItem[];
}

const DEFAULT_CACHE_MAX_AGE_MS = 30 * 60 * 1000;

function onlineResultToSearchItem(result: OnlineSearchResult): SearchResultItem {
  const typeMap: Record<string, string> = {
    galaxy: 'DSO',
    nebula: 'DSO',
    cluster: 'DSO',
    star: 'Star',
    planet: 'Planet',
    comet: 'Comet',
    asteroid: 'Asteroid',
    quasar: 'DSO',
    other: 'DSO',
  };

  return {
    Name: result.name,
    Type: (typeMap[result.category] || 'DSO') as SearchResultItem['Type'],
    RA: result.ra,
    Dec: result.dec,
    CanonicalId: result.canonicalId,
    Identifiers: result.identifiers,
    'Common names': result.alternateNames?.join(', '),
    Magnitude: result.magnitude,
    Size: result.angularSize,
    _isOnlineResult: true,
    _onlineSource: result.source,
  };
}

function passesMinorObjectFilter(
  result: OnlineSearchResult,
  includeMinorObjects: boolean,
  explicitMinor: boolean
): boolean {
  if (explicitMinor) return true;
  if (includeMinorObjects) return true;
  const lowerType = result.type.toLowerCase();
  return !(
    result.category === 'comet' ||
    result.category === 'asteroid' ||
    lowerType.includes('minor planet') ||
    lowerType.includes('asteroid') ||
    lowerType.includes('comet')
  );
}

async function mapBatchInParallel<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const result: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      result[current] = await mapper(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return result;
}

function deriveOutcome(results: SearchResultItem[], issues: SearchRunIssue[]): SearchRunOutcome {
  if (results.length > 0) {
    return issues.length > 0 ? 'partial_success' : 'success';
  }
  return issues.length > 0 ? 'error' : 'empty';
}

function summarizeIssues(issues: SearchRunIssue[]): { errors: string[]; warnings: string[] } {
  return {
    errors: issues.filter(i => i.level === 'error').map(i => i.message),
    warnings: issues.filter(i => i.level === 'warning').map(i => i.message),
  };
}

function classifyDiagnosticStatus(message: string): 'timeout' | 'error' {
  return /timeout|timed out|abort/i.test(message) ? 'timeout' : 'error';
}

function normalizeEnabledSources(options: UnifiedSearchOptions, parsed: ParsedSearchQuery): OnlineSearchSource[] {
  const enabled = options.enabledSources.filter(source => source !== 'local');
  const queryKind = parsed.intent === 'coordinates'
    ? 'coordinates'
    : parsed.explicitMinor || parsed.intent === 'minor'
      ? 'minor'
      : 'name';

  if (enabled.length > 0) {
    const filtered = filterSearchProvidersForQuery(enabled, queryKind);
    if (filtered.length > 0) {
      return filtered;
    }
  }

  return getEligibleSearchProviders(queryKind);
}

function withProviderDiagnostics(
  sourceList: OnlineSearchSource[],
  map: Map<OnlineSearchSource, SearchProviderDiagnostic>
): SearchProviderDiagnostic[] {
  return sourceList.map((source) => map.get(source) ?? {
    source,
    status: 'skipped',
    message: 'Provider not queried',
  });
}

function emitProgress(options: UnifiedSearchOptions, payload: UnifiedSearchProgress): void {
  options.onProgress?.(payload);
}

async function runSingleSearch(
  options: UnifiedSearchOptions,
  parsed: ParsedSearchQuery
): Promise<UnifiedSearchResult> {
  const query = parsed.catalogQuery || parsed.refinedQuery || parsed.normalized;
  const issues: SearchRunIssue[] = [];
  const localSearch = options.localSearch;
  const shouldUseLocal = options.mode === 'local' || options.mode === 'hybrid';
  const shouldUseOnline = options.mode !== 'local' && options.onlineAvailable;
  const requestedOnlineSources = shouldUseOnline
    ? normalizeEnabledSources(options, parsed)
    : [];
  const unavailableOnlineSources =
    options.mode === 'online' && !options.onlineAvailable
      ? normalizeEnabledSources(options, parsed)
      : [];
  const providerSourceOrder =
    requestedOnlineSources.length > 0 ? requestedOnlineSources : unavailableOnlineSources;
  const providerDiagnosticsMap = new Map<OnlineSearchSource, SearchProviderDiagnostic>();

  const markProvider = (
    source: OnlineSearchSource,
    status: SearchProviderDiagnostic['status'],
    message?: string,
    usedFallbackCache?: boolean
  ) => {
    providerDiagnosticsMap.set(source, { source, status, message, usedFallbackCache });
  };

  if (options.mode === 'online' && !options.onlineAvailable) {
    issues.push({
      source: 'online',
      level: 'error',
      code: 'ONLINE_UNAVAILABLE',
      message: 'Online search is unavailable',
    });
    for (const source of normalizeEnabledSources(options, parsed)) {
      markProvider(source, 'unavailable', 'Online search is unavailable');
    }
  }

  let localResults: SearchResultItem[] = [];
  if (shouldUseLocal && localSearch) {
    try {
      localResults = await Promise.resolve(localSearch({ parsed, query }));
    } catch (error) {
      issues.push({
        source: 'local',
        level: 'error',
        code: 'LOCAL_SEARCH_FAILED',
        message: error instanceof Error ? error.message : 'Local search failed',
      });
      localResults = [];
    }
  }

  if (options.mode === 'hybrid' && requestedOnlineSources.length > 0) {
    const localReadyResults = mergeSearchItems(localResults, [], {
      maxResults: options.maxResults,
      coordinateContext: parsed.coordinates,
    });
    emitProgress(options, {
      stage: 'local_ready',
      parsed,
      intent: parsed.intent,
      outcome: deriveOutcome(localReadyResults, issues),
      results: localReadyResults,
      localResults,
      onlineResults: [],
      issues: [...issues],
      providerDiagnostics: withProviderDiagnostics(providerSourceOrder, providerDiagnosticsMap),
      refinementHints: parsed.refinementHints,
      usedCachedOnline: false,
    });
  }

  let onlineResponse: OnlineSearchResponse | undefined;
  let onlineRaw: OnlineSearchResult[] = [];
  let usedCachedOnline = false;
  let onlineRequestFailed = false;

  if (shouldUseOnline) {
    try {
      if (parsed.intent === 'coordinates' && parsed.coordinates) {
        onlineResponse = await searchOnlineByCoordinates(
          { ra: parsed.coordinates.ra, dec: parsed.coordinates.dec, radius: options.searchRadiusDeg },
          {
            sources: requestedOnlineSources,
            limit: options.maxResults,
            timeout: options.timeout,
            signal: options.signal,
          }
        );
      } else {
        onlineResponse = await searchOnlineByName(query, {
          sources: requestedOnlineSources,
          limit: options.maxResults,
          timeout: options.timeout,
          signal: options.signal,
        });
      }
      onlineRaw = onlineResponse.results ?? [];
    } catch (error) {
      onlineRequestFailed = true;
      const message = error instanceof Error ? error.message : 'Online search failed';
      issues.push({
        source: 'online',
        level: options.mode === 'online' ? 'error' : 'warning',
        code: 'ONLINE_REQUEST_FAILED',
        message,
      });
      const status = classifyDiagnosticStatus(message);
      for (const source of requestedOnlineSources) {
        markProvider(source, status, message);
      }
    }
  }

  if (onlineResponse) {
    const successfulSources = new Set(onlineResponse.sources ?? []);
    for (const source of requestedOnlineSources) {
      if (successfulSources.has(source)) {
        markProvider(source, 'success');
      } else {
        markProvider(source, 'empty', 'No matches returned from provider');
      }
    }

    if (onlineResponse.errors?.length) {
      for (const err of onlineResponse.errors) {
        const status = classifyDiagnosticStatus(err.error);
        markProvider(err.source, status, err.error);
      }
      issues.push(
        ...onlineResponse.errors.map((err) => ({
          source: err.source,
          level: 'warning' as const,
          code: 'ONLINE_PROVIDER_ERROR',
          message: `${err.source}: ${err.error}`,
        }))
      );
    }
  }

  const cacheMaxAgeMs = options.cacheMaxAgeMs ?? DEFAULT_CACHE_MAX_AGE_MS;
  const cachedOnline = options.cachedOnline;
  if (
    shouldUseOnline &&
    cachedOnline?.results?.length &&
    (onlineRequestFailed || (onlineResponse?.errors?.length ?? 0) > 0)
  ) {
    const ageMs = Date.now() - cachedOnline.timestamp;
    if (ageMs <= cacheMaxAgeMs) {
      onlineRaw = cachedOnline.results;
      usedCachedOnline = true;
      issues.push({
        source: 'online-cache',
        level: 'warning',
        code: 'ONLINE_CACHE_FALLBACK',
        message: 'Using cached online results due to provider degradation',
      });
      for (const source of requestedOnlineSources) {
        const current = providerDiagnosticsMap.get(source);
        if (!current || current.status !== 'success') {
          markProvider(source, current?.status ?? 'empty', current?.message, true);
        }
      }
    }
  }

  const onlineResults = onlineRaw
    .filter(result => passesMinorObjectFilter(result, options.includeMinorObjects, parsed.explicitMinor))
    .map(result => {
      const mapped = onlineResultToSearchItem(result);
      if (usedCachedOnline) {
        mapped._fallbackSource = 'cache';
      }
      return mapped;
    });

  const merged = mergeSearchItems(localResults, onlineResults, {
    maxResults: options.maxResults,
    coordinateContext: parsed.coordinates,
  });
  const outcome = deriveOutcome(merged, issues);
  const { errors, warnings } = summarizeIssues(issues);
  const providerDiagnostics = withProviderDiagnostics(providerSourceOrder, providerDiagnosticsMap);

  const finalized: UnifiedSearchResult = {
    parsed,
    intent: parsed.intent,
    stage: 'finalized',
    outcome,
    results: merged,
    localResults,
    onlineResults,
    onlineResponse,
    issues,
    errors,
    warnings,
    providerDiagnostics,
    refinementHints: parsed.refinementHints,
    usedCachedOnline,
  };

  emitProgress(options, {
    stage: 'finalized',
    parsed,
    intent: parsed.intent,
    outcome,
    results: merged,
    localResults,
    onlineResults,
    issues: [...issues],
    providerDiagnostics,
    refinementHints: parsed.refinementHints,
    usedCachedOnline,
  });

  return finalized;
}

export async function searchUnified(options: UnifiedSearchOptions): Promise<UnifiedSearchResult> {
  const parsed = parseSearchQuery(options.query);
  if (!parsed.normalized) {
    return {
      parsed,
      intent: parsed.intent,
      stage: 'finalized',
      outcome: 'empty',
      results: [],
      localResults: [],
      onlineResults: [],
      issues: [],
      errors: [],
      warnings: [],
      providerDiagnostics: [],
      refinementHints: parsed.refinementHints,
      usedCachedOnline: false,
    };
  }

  if (parsed.intent !== 'batch' || !parsed.batchQueries?.length) {
    return runSingleSearch(options, parsed);
  }

  const batchResults = await mapBatchInParallel(parsed.batchQueries, 3, async (query) => {
    const itemParsed = parseSearchQuery(query);
    const itemResult = await runSingleSearch({ ...options, query, onProgress: undefined }, itemParsed);
    return {
      query,
      results: itemResult.results,
      outcome: itemResult.outcome,
      issues: itemResult.issues.length > 0 ? itemResult.issues : undefined,
      errors: itemResult.errors.length > 0 ? itemResult.errors : undefined,
      warnings: itemResult.warnings.length > 0 ? itemResult.warnings : undefined,
      providerDiagnostics: itemResult.providerDiagnostics,
      refinementHints: itemResult.refinementHints,
    } as BatchSearchItem;
  });

  const flattened = mergeSearchItems(
    batchResults.flatMap(item => item.results),
    [],
    { maxResults: options.maxResults }
  );
  const issues = batchResults.flatMap((item) =>
    (item.issues ?? []).map((issue) => ({
      ...issue,
      source: `${issue.source}[${item.query}]`,
    }))
  );
  const outcome = deriveOutcome(flattened, issues);
  const { errors, warnings } = summarizeIssues(issues);
  const providerDiagnostics = batchResults.flatMap((item) =>
    (item.providerDiagnostics ?? []).map((diagnostic) => ({
      ...diagnostic,
      source: `${diagnostic.source}[${item.query}]`,
    }))
  );

  return {
    parsed,
    intent: 'batch',
    stage: 'finalized',
    outcome,
    results: flattened,
    localResults: [],
    onlineResults: [],
    issues,
    errors,
    warnings,
    providerDiagnostics,
    refinementHints: parsed.refinementHints,
    usedCachedOnline: false,
    batchItems: batchResults,
  };
}

export function createCoordinateSearchResult(ra: number, dec: number): SearchResultItem {
  return {
    Name: `${formatRA(ra)} ${formatDec(dec)}`,
    Type: 'Coordinates',
    RA: ra,
    Dec: dec,
    CanonicalId: `coord:${ra.toFixed(6)},${dec.toFixed(6)}`,
    'Common names': 'Custom Coordinates',
  };
}
