/**
 * @jest-environment jsdom
 */
import { DEFAULT_MOBILE_PRIORITIZED_TOOLS } from '@/lib/constants/mobile-tools';

let capturedPersistOptions: {
  migrate?: (state: unknown, version: number) => unknown;
  merge?: (persistedState: unknown, currentState: unknown) => unknown;
} | null = null;

jest.mock('zustand/middleware', () => ({
  persist: (
    config: unknown,
    options: {
      migrate?: (state: unknown, version: number) => unknown;
      merge?: (persistedState: unknown, currentState: unknown) => unknown;
    },
  ) => {
    capturedPersistOptions = options;
    return config;
  },
}));

jest.mock('@/lib/storage', () => ({
  getZustandStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

describe('settings-store migration', () => {
  beforeAll(async () => {
    await import('../settings-store');
  });

  it('normalizes invalid prioritized tools in v14 migration', () => {
    const migrate = capturedPersistOptions?.migrate;
    expect(migrate).toBeDefined();

    const migrated = migrate!(
      {
        mobileFeaturePreferences: {
          compactBottomBar: true,
          oneHandMode: true,
          prioritizedTools: ['search', 'tonight', 'tonight'],
        },
      },
      13,
    ) as {
      mobileFeaturePreferences?: { prioritizedTools?: string[] };
    };

    expect(migrated.mobileFeaturePreferences?.prioritizedTools).toEqual([
      'tonight',
      ...DEFAULT_MOBILE_PRIORITIZED_TOOLS.filter((toolId) => toolId !== 'tonight'),
    ]);
  });

  it('fills default order for older migrations after filtering', () => {
    const migrate = capturedPersistOptions?.migrate;
    expect(migrate).toBeDefined();

    const migrated = migrate!(
      {
        skyEngine: 'stellarium',
        mobileFeaturePreferences: {
          compactBottomBar: false,
          oneHandMode: false,
          prioritizedTools: ['target-list', 'equipment-manager', 'equipment-manager'],
        },
      },
      8,
    ) as {
      mobileFeaturePreferences?: { prioritizedTools?: string[] };
    };

    expect(migrated.mobileFeaturePreferences?.prioritizedTools).toEqual([
      'equipment-manager',
      ...DEFAULT_MOBILE_PRIORITIZED_TOOLS.filter((toolId) => toolId !== 'equipment-manager'),
    ]);
  });

  it('normalizes v14 persisted partial mobile preferences in merge', () => {
    const merge = capturedPersistOptions?.merge;
    expect(merge).toBeDefined();

    const merged = merge!(
      {
        mobileFeaturePreferences: {
          compactBottomBar: true,
          oneHandMode: true,
        },
      },
      {
        mobileFeaturePreferences: {
          compactBottomBar: false,
          oneHandMode: false,
          prioritizedTools: DEFAULT_MOBILE_PRIORITIZED_TOOLS,
        },
      },
    ) as {
      mobileFeaturePreferences?: {
        compactBottomBar?: boolean;
        oneHandMode?: boolean;
        prioritizedTools?: string[];
      };
    };

    expect(merged.mobileFeaturePreferences).toEqual({
      compactBottomBar: true,
      oneHandMode: true,
      prioritizedTools: DEFAULT_MOBILE_PRIORITIZED_TOOLS,
    });
  });
});
