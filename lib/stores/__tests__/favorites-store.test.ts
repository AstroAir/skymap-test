import { act } from '@testing-library/react';
import { useFavoritesStore, type FavoriteObject } from '../favorites-store';

function resetFavoritesStore() {
  useFavoritesStore.setState({
    favorites: [],
    recentlyViewed: [],
    maxRecent: 20,
  });
}

function createFavorite(name: string, ra: number, dec: number): FavoriteObject {
  return {
    id: `fav-${name}`,
    name,
    ra,
    dec,
    raString: `${ra}`,
    decString: `${dec}`,
    type: 'Galaxy',
    addedAt: 1700000000000,
    viewCount: 0,
    tags: [],
  };
}

describe('favorites-store import/export', () => {
  beforeEach(() => {
    resetFavoritesStore();
  });

  it('exports current favorites', () => {
    const { addFavorite, exportFavorites } = useFavoritesStore.getState();

    act(() => {
      addFavorite({
        name: 'M31',
        ra: 10.6847,
        dec: 41.2689,
        raString: '00:42:44',
        decString: '+41:16:09',
      });
    });

    const exported = exportFavorites();
    expect(exported).toHaveLength(1);
    expect(exported[0].name).toBe('M31');
  });

  it('imports valid favorites and skips duplicates', () => {
    const { importFavorites } = useFavoritesStore.getState();
    const existing = createFavorite('M31', 10.6847, 41.2689);
    const incomingDuplicate = createFavorite('M31', 10.6847001, 41.2689001);
    const incomingNew = createFavorite('M42', 83.8221, -5.3911);

    act(() => {
      useFavoritesStore.setState({ favorites: [existing] });
    });

    let result: { imported: number; skipped: number } = { imported: 0, skipped: 0 };
    act(() => {
      result = importFavorites([incomingDuplicate, incomingNew]);
    });

    expect(result).toEqual({ imported: 1, skipped: 1 });
    expect(useFavoritesStore.getState().favorites.map(f => f.name)).toEqual(['M31', 'M42']);
  });

  it('skips invalid import entries', () => {
    const { importFavorites } = useFavoritesStore.getState();
    const valid = createFavorite('NGC7000', 314.6833, 44.3167);
    const invalid = {
      ...valid,
      name: undefined as unknown as string,
    };

    let result: { imported: number; skipped: number } = { imported: 0, skipped: 0 };
    act(() => {
      result = importFavorites([invalid, valid]);
    });

    expect(result).toEqual({ imported: 1, skipped: 1 });
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
  });
});

