export type MobileToolSurface = 'bottom-bar' | 'mobile-menu';

export const MOBILE_TOOL_IDS = [
  'markers',
  'location',
  'fov',
  'exposure',
  'daily-knowledge',
  'tonight',
  'session-planner',
  'astro-events',
  'astro-calculator',
  'shotlist',
  'observation-log',
  'mount',
  'plate-solver',
  'ocular',
  'sky-atlas',
  'equipment-manager',
  'offline-cache',
  'satellite',
  'settings',
  'keyboard-shortcuts',
  'about',
] as const;

export type MobileToolId = (typeof MOBILE_TOOL_IDS)[number];

export interface MobileToolDefinition {
  id: MobileToolId;
  tourId: string;
  labelKey: string;
  surfaces: readonly MobileToolSurface[];
}

export const MOBILE_COMPACT_TOOL_LIMIT = 6;

export const DEFAULT_MOBILE_PRIORITIZED_TOOLS: MobileToolId[] = [
  'markers',
  'location',
  'fov',
  'shotlist',
  'tonight',
  'daily-knowledge',
];

export const MOBILE_TOOL_REGISTRY: readonly MobileToolDefinition[] = [
  { id: 'markers', tourId: 'markers', labelKey: 'settingsNew.mobile.tools.markers', surfaces: ['bottom-bar'] },
  { id: 'location', tourId: 'location', labelKey: 'settingsNew.mobile.tools.location', surfaces: ['bottom-bar'] },
  { id: 'fov', tourId: 'fov', labelKey: 'settingsNew.mobile.tools.fov', surfaces: ['bottom-bar'] },
  { id: 'exposure', tourId: 'exposure', labelKey: 'settingsNew.mobile.tools.exposure', surfaces: ['bottom-bar'] },
  { id: 'daily-knowledge', tourId: 'daily-knowledge', labelKey: 'settingsNew.mobile.tools.daily-knowledge', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'tonight', tourId: 'tonight', labelKey: 'settingsNew.mobile.tools.tonight', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'session-planner', tourId: 'session-planner', labelKey: 'settingsNew.mobile.tools.session-planner', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'astro-events', tourId: 'astro-events', labelKey: 'settingsNew.mobile.tools.astro-events', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'astro-calculator', tourId: 'astro-calculator', labelKey: 'settingsNew.mobile.tools.astro-calculator', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'shotlist', tourId: 'shotlist', labelKey: 'settingsNew.mobile.tools.shotlist', surfaces: ['bottom-bar'] },
  { id: 'observation-log', tourId: 'observation-log', labelKey: 'settingsNew.mobile.tools.observation-log', surfaces: ['bottom-bar'] },
  { id: 'mount', tourId: 'mount', labelKey: 'settingsNew.mobile.tools.mount', surfaces: ['bottom-bar'] },
  { id: 'plate-solver', tourId: 'plate-solver', labelKey: 'settingsNew.mobile.tools.plate-solver', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'ocular', tourId: 'ocular', labelKey: 'settingsNew.mobile.tools.ocular', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'sky-atlas', tourId: 'sky-atlas', labelKey: 'settingsNew.mobile.tools.sky-atlas', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'equipment-manager', tourId: 'equipment-manager', labelKey: 'settingsNew.mobile.tools.equipment-manager', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'offline-cache', tourId: 'offline-cache', labelKey: 'settingsNew.mobile.tools.offline-cache', surfaces: ['bottom-bar', 'mobile-menu'] },
  { id: 'satellite', tourId: 'satellite', labelKey: 'settingsNew.mobile.tools.satellite', surfaces: ['mobile-menu'] },
  { id: 'settings', tourId: 'settings', labelKey: 'settingsNew.mobile.tools.settings', surfaces: ['mobile-menu'] },
  { id: 'keyboard-shortcuts', tourId: 'keyboard-shortcuts', labelKey: 'settingsNew.mobile.tools.keyboard-shortcuts', surfaces: ['mobile-menu'] },
  { id: 'about', tourId: 'about', labelKey: 'settingsNew.mobile.tools.about', surfaces: ['mobile-menu'] },
];

const MOBILE_TOOL_ID_SET = new Set<string>(MOBILE_TOOL_IDS);
const MOBILE_TOOL_ORDER = new Map<MobileToolId, number>(
  MOBILE_TOOL_IDS.map((toolId, index) => [toolId, index] as [MobileToolId, number]),
);

interface NormalizeMobilePriorityOptions {
  fallbackToDefault?: boolean;
  appendDefaultOrder?: boolean;
}

export function isMobileToolId(toolId: string): toolId is MobileToolId {
  return MOBILE_TOOL_ID_SET.has(toolId);
}

export function normalizeMobilePrioritizedTools(
  prioritizedTools: readonly string[] | null | undefined,
  options: NormalizeMobilePriorityOptions = {},
): MobileToolId[] {
  const { fallbackToDefault = true, appendDefaultOrder = false } = options;
  const normalized: MobileToolId[] = [];

  for (const toolId of prioritizedTools ?? []) {
    if (isMobileToolId(toolId) && !normalized.includes(toolId)) {
      normalized.push(toolId);
    }
  }

  if (appendDefaultOrder) {
    for (const defaultTool of DEFAULT_MOBILE_PRIORITIZED_TOOLS) {
      if (!normalized.includes(defaultTool)) {
        normalized.push(defaultTool);
      }
    }
  }

  if (normalized.length === 0 && fallbackToDefault) {
    return [...DEFAULT_MOBILE_PRIORITIZED_TOOLS];
  }

  return normalized;
}

export function getMobileToolsForSurface(surface: MobileToolSurface): MobileToolDefinition[] {
  return MOBILE_TOOL_REGISTRY.filter((tool) => tool.surfaces.includes(surface));
}

export function sortByMobileToolPriority<T extends { id: string }>(
  items: readonly T[],
  prioritizedTools: readonly string[] | null | undefined,
): T[] {
  const normalizedPriority = normalizeMobilePrioritizedTools(prioritizedTools, {
    fallbackToDefault: false,
  });

  const priorityOrder = new Map<MobileToolId, number>(
    normalizedPriority.map((toolId, index) => [toolId, index] as [MobileToolId, number]),
  );

  return [...items].sort((left, right) => {
    const leftPriority = isMobileToolId(left.id)
      ? (priorityOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
    const rightPriority = isMobileToolId(right.id)
      ? (priorityOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftRegistryOrder = isMobileToolId(left.id)
      ? (MOBILE_TOOL_ORDER.get(left.id) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
    const rightRegistryOrder = isMobileToolId(right.id)
      ? (MOBILE_TOOL_ORDER.get(right.id) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;

    return leftRegistryOrder - rightRegistryOrder;
  });
}
