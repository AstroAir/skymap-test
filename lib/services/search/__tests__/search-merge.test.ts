import { mergeSearchItems } from '../search-merge';
import type { SearchResultItem } from '@/lib/core/types';

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
});
