import { exportSessionPlan, getExportFileExtension } from '../plan-exporter';
import type { SessionPlan } from '@/types/starmap/planning';
import type { TargetItem } from '@/lib/stores/target-list-store';

function makeTarget(): TargetItem {
  return {
    id: 't1',
    name: 'M31',
    ra: 10.6847083,
    dec: 41.26875,
    raString: '',
    decString: '',
    addedAt: Date.now(),
    status: 'planned',
    priority: 'medium',
    tags: [],
    isFavorite: false,
    isArchived: false,
  } as TargetItem;
}

function makePlan(): SessionPlan {
  const start = new Date('2025-10-10T20:00:00.000Z');
  const end = new Date('2025-10-10T21:30:00.000Z');
  return {
    targets: [
      {
        target: makeTarget(),
        startTime: start,
        endTime: end,
        duration: 1.5,
        transitTime: start,
        maxAltitude: 72,
        moonDistance: 88,
        feasibility: {
          score: 88,
          moonScore: 90,
          altitudeScore: 85,
          durationScore: 80,
          twilightScore: 95,
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
    nightCoverage: 45,
    efficiency: 100,
    gaps: [],
    recommendations: [],
    warnings: [],
  };
}

describe('plan-exporter', () => {
  const options = {
    format: 'csv' as const,
    planDate: new Date('2025-10-10T00:00:00.000Z'),
    latitude: 40,
    longitude: -74,
  };

  it('exports generic CSV format', () => {
    const csv = exportSessionPlan(makePlan(), { ...options, format: 'csv' });
    expect(csv).toContain('order,name,ra_deg,dec_deg');
    expect(csv).toContain('"M31"');
  });

  it('exports SGP CSV wizard header and fields', () => {
    const sgp = exportSessionPlan(makePlan(), { ...options, format: 'sgp-csv' });
    expect(sgp).toContain('name,ra,dec,start,duration,filter,exposure,subframes');
    expect(sgp).toContain('"M31"');
    expect(sgp).toContain(',L,300,-1');
  });

  it('exports JSON with targets payload', () => {
    const json = exportSessionPlan(makePlan(), { ...options, format: 'json' });
    const parsed = JSON.parse(json) as { targets: Array<{ name: string }> };
    expect(parsed.targets).toHaveLength(1);
    expect(parsed.targets[0].name).toBe('M31');
  });

  it('maps extension for SGP CSV', () => {
    expect(getExportFileExtension('sgp-csv')).toBe('.csv');
  });
});
