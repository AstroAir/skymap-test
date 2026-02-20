/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SessionPlanner } from '../session-planner';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('../mount-safety-simulator', () => ({
  MountSafetySimulator: () => <div data-testid="mount-safety-simulator" />,
}));

jest.mock('@/lib/storage/platform', () => ({
  isTauri: () => false,
}));

jest.mock('@/lib/tauri', () => ({
  tauriApi: {
    sessionIo: {
      exportSessionPlan: jest.fn(),
      importSessionPlan: jest.fn(),
      saveSessionTemplate: jest.fn(),
      loadSessionTemplates: jest.fn(),
    },
  },
  mountApi: {
    getObservingConditions: jest.fn(),
    getSafetyState: jest.fn(),
  },
}));

jest.mock('@/lib/astronomy/astro-utils', () => {
  const dusk = new Date('2025-06-15T20:00:00.000Z');
  const dawn = new Date('2025-06-16T04:00:00.000Z');
  return {
    calculateTwilightTimes: jest.fn(() => ({
      sunset: new Date('2025-06-15T18:00:00.000Z'),
      civilDusk: new Date('2025-06-15T18:30:00.000Z'),
      nauticalDusk: new Date('2025-06-15T19:00:00.000Z'),
      astronomicalDusk: dusk,
      astronomicalDawn: dawn,
      nauticalDawn: new Date('2025-06-16T04:30:00.000Z'),
      civilDawn: new Date('2025-06-16T05:00:00.000Z'),
      sunrise: new Date('2025-06-16T05:30:00.000Z'),
      nightDuration: 8,
      darknessDuration: 8,
      isCurrentlyNight: true,
      currentTwilightPhase: 'night',
    })),
    getMoonPhase: jest.fn(() => 0.2),
    getMoonPhaseName: jest.fn(() => 'Waxing Crescent'),
    getMoonIllumination: jest.fn(() => 22),
    formatTimeShort: jest.fn((date: Date | null) => (date ? '20:00' : '--:--')),
    formatDuration: jest.fn((hours: number) => `${hours.toFixed(1)}h`),
    getJulianDateFromDate: jest.fn(() => 2460000),
  };
});

jest.mock('@/lib/astronomy/session-scheduler-v2', () => ({
  optimizeScheduleV2: jest.fn(() => {
    const start = new Date('2025-06-15T20:30:00.000Z');
    const end = new Date('2025-06-15T22:00:00.000Z');
    return {
      targets: [
        {
          target: {
            id: 'target-1',
            name: 'M31',
            ra: 10.684,
            dec: 41.269,
            raString: '',
            decString: '',
            addedAt: Date.now(),
            status: 'planned',
            priority: 'medium',
            tags: [],
            isFavorite: false,
            isArchived: false,
          },
          startTime: start,
          endTime: end,
          duration: 1.5,
          transitTime: start,
          maxAltitude: 72,
          moonDistance: 88,
          feasibility: {
            score: 86,
            moonScore: 90,
            altitudeScore: 85,
            durationScore: 80,
            twilightScore: 92,
            recommendation: 'excellent',
            warnings: [],
            tips: [],
          },
          conflicts: [],
          isOptimal: true,
          order: 1,
        },
      ],
      totalImagingTime: 1.5,
      nightCoverage: 40,
      efficiency: 100,
      gaps: [
        {
          start: new Date('2025-06-15T22:30:00.000Z'),
          end: new Date('2025-06-15T23:00:00.000Z'),
          duration: 0.5,
        },
      ],
      recommendations: [],
      warnings: [],
      conflicts: [{ type: 'weather', targetId: 'global', message: 'Cloud cover too high' }],
    };
  }),
}));

const mockMountState = {
  profileInfo: {
    AstrometrySettings: {
      Latitude: 40,
      Longitude: -74,
    },
  },
  mountInfo: {
    Connected: false,
  },
};

const mockStellariumState = {
  setViewDirection: jest.fn(),
};

const mockEquipmentState = {
  focalLength: 800,
  aperture: 100,
  sensorWidth: 22.3,
  sensorHeight: 14.9,
};

const mockSessionPlanState = {
  savedPlans: [],
  templates: [{
    id: 'tpl-1',
    name: 'Template A',
    draft: {
      planDate: new Date('2025-06-15T00:00:00.000Z').toISOString(),
      strategy: 'balanced',
      constraints: {
        minAltitude: 20,
        minImagingTime: 30,
      },
      excludedTargetIds: [],
      manualEdits: [],
    },
    createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
  }],
  savePlan: jest.fn(),
  saveTemplate: jest.fn(),
  loadTemplate: jest.fn(),
  importPlanV2: jest.fn(),
  deletePlan: jest.fn(),
};

const mockPlanningUiState = {
  sessionPlannerOpen: true,
  setSessionPlannerOpen: jest.fn(),
  openShotList: jest.fn(),
  openTonightRecommendations: jest.fn(),
};

const mockStoreSelectors = {
  useMountStore: jest.fn((selector: (state: typeof mockMountState) => unknown) => selector(mockMountState)),
  useStellariumStore: jest.fn((selector: (state: typeof mockStellariumState) => unknown) => selector(mockStellariumState)),
  useEquipmentStore: jest.fn((selector: (state: typeof mockEquipmentState) => unknown) => selector(mockEquipmentState)),
  useSessionPlanStore: jest.fn((selector: (state: typeof mockSessionPlanState) => unknown) => selector(mockSessionPlanState)),
  usePlanningUiStore: jest.fn((selector: (state: typeof mockPlanningUiState) => unknown) => selector(mockPlanningUiState)),
};

jest.mock('@/lib/stores', () => ({
  useMountStore: (selector: (state: unknown) => unknown) => mockStoreSelectors.useMountStore(selector),
  useStellariumStore: (selector: (state: unknown) => unknown) => mockStoreSelectors.useStellariumStore(selector),
  useEquipmentStore: (selector: (state: unknown) => unknown) => mockStoreSelectors.useEquipmentStore(selector),
  useSessionPlanStore: (selector: (state: unknown) => unknown) => mockStoreSelectors.useSessionPlanStore(selector),
  usePlanningUiStore: (selector: (state: unknown) => unknown) => mockStoreSelectors.usePlanningUiStore(selector),
}));

const mockTargetStoreState = {
  targets: [{
    id: 'target-1',
    name: 'M31',
    ra: 10.684,
    dec: 41.269,
    raString: '',
    decString: '',
    addedAt: 1,
    status: 'planned',
    priority: 'medium',
    tags: [],
    isFavorite: false,
    isArchived: false,
  }],
  setActiveTarget: jest.fn(),
};

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: (selector: (state: typeof mockTargetStoreState) => unknown) => selector(mockTargetStoreState),
}));

describe('SessionPlanner', () => {
  it('renders conflict banners and template entry points', () => {
    render(<SessionPlanner />);
    expect(screen.getByText('Cloud cover too high')).toBeInTheDocument();
    expect(screen.getByText('sessionPlanner.templates')).toBeInTheDocument();
    expect(screen.getByText('sessionPlanner.importPlan')).toBeInTheDocument();
  });

  it('toggles timeline gaps through showGaps switch', () => {
    render(<SessionPlanner />);
    expect(screen.getAllByTestId('session-gap').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'sessionPlanner.optimizationSettings' }));
    const gapSwitch = screen.getAllByRole('switch')[0];
    fireEvent.click(gapSwitch);

    expect(screen.queryByTestId('session-gap')).not.toBeInTheDocument();
  });
});
