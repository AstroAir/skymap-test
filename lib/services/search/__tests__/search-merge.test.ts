import { mergeSearchItems } from '../search-merge';
import type { SearchResultItem } from '@/lib/core/types';
import { getResultId } from '@/lib/core/search-utils';

describe('mergeSearchItems', () => {
  it('deduplicates by close coordinates', () => {
    const local: SearchResultItem[] = [
      { Name: 'M31', Type: 'DSO', RA: 10.6847, Dec: 41.2689 },
    ];
    const online: SearchResultItem[] = [
      {
        Name: 'Andromeda Galaxy',
        Type: 'DSO',
        RA: 10.68471,
        Dec: 41.26891,
        _onlineSource: 'simbad',
      },
    ];

    const merged = mergeSearchItems(local, online, { maxResults: 20 });
    expect(merged).toHaveLength(1);
    expect(merged[0]['Common names']).toContain('Andromeda Galaxy');
  });

  it('keeps unique objects', () => {
    const local: SearchResultItem[] = [{ Name: 'M31', Type: 'DSO', RA: 10, Dec: 20 }];
    const online: SearchResultItem[] = [{ Name: 'M42', Type: 'DSO', RA: 30, Dec: 40, _onlineSource: 'sesame' }];
    const merged = mergeSearchItems(local, online, { maxResults: 20 });
    expect(merged).toHaveLength(2);
  });

  it('computes coordinate distance when context provided', () => {
    const online: SearchResultItem[] = [{ Name: 'M42', Type: 'DSO', RA: 83.8, Dec: -5.3, _onlineSource: 'simbad' }];
    const merged = mergeSearchItems([], online, {
      maxResults: 20,
      coordinateContext: { ra: 83.9, dec: -5.4 },
    });
    expect(merged[0]._angularSeparation).toBeDefined();
  });

  it('merges aliases when canonical ids match', () => {
    const local: SearchResultItem[] = [
      { Name: 'M31', Type: 'DSO', CanonicalId: 'M31', RA: 10.6847, Dec: 41.2689 },
    ];
    const online: SearchResultItem[] = [
      {
        Name: 'Andromeda Galaxy',
        Type: 'DSO',
        CanonicalId: 'Messier 31',
        Identifiers: ['M31'],
        RA: 10.6848,
        Dec: 41.2688,
        _onlineSource: 'sesame',
      },
    ];

    const merged = mergeSearchItems(local, online, { maxResults: 20 });
    expect(merged).toHaveLength(1);
    expect(merged[0]['Common names']).toContain('Andromeda Galaxy');
  });

  it('keeps near-name collisions as separate objects when coordinates differ', () => {
    const local: SearchResultItem[] = [{ Name: 'NGC 123', Type: 'DSO', RA: 10.0, Dec: 20.0 }];
    const online: SearchResultItem[] = [{ Name: 'NGC123', Type: 'DSO', RA: 11.0, Dec: 21.0, _onlineSource: 'simbad' }];

    const merged = mergeSearchItems(local, online, { maxResults: 20, coordinateThresholdArcsec: 1 });
    expect(merged).toHaveLength(2);
    expect(merged[0]._stableId).toBeDefined();
    expect(merged[1]._stableId).toBeDefined();
  });

  it('ranks canonical exact match ahead of fuzzy match', () => {
    const local: SearchResultItem[] = [
      { Name: 'M31', Type: 'DSO', CanonicalId: 'M31', RA: 10.6847, Dec: 41.2689, _fuzzyScore: 0.4 },
      { Name: 'Andromeda', Type: 'DSO', RA: 10.6849, Dec: 41.2690, _fuzzyScore: 0.95 },
    ];

    const merged = mergeSearchItems(local, [], { maxResults: 20 });
    expect(merged[0].CanonicalId).toBe('M31');
  });

  it('marks merge score for deterministic ordering', () => {
    const local: SearchResultItem[] = [{ Name: 'M31', Type: 'DSO', RA: 10.6847, Dec: 41.2689 }];
    const merged = mergeSearchItems(local, [], { maxResults: 20 });
    expect(typeof merged[0]._mergeScore).toBe('number');
  });

  it('preserves stable id when progressive merge upgrades local result with online metadata', () => {
    const local: SearchResultItem[] = [{ Name: 'M31', Type: 'DSO', RA: 10.6847, Dec: 41.2689 }];
    const online: SearchResultItem[] = [
      {
        Name: 'Andromeda Galaxy',
        Type: 'DSO',
        CanonicalId: 'M31',
        Identifiers: ['M31'],
        RA: 10.68472,
        Dec: 41.26891,
        _onlineSource: 'sesame',
      },
    ];

    const merged = mergeSearchItems(local, online, { maxResults: 20 });
    const initialId = getResultId(local[0]);
    expect(merged).toHaveLength(1);
    expect(merged[0]._stableId).toBe(initialId);
  });
});
