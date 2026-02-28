import { act } from '@testing-library/react';
import { useFavoritesStore, FAVORITE_TAGS, type FavoriteObject } from '../favorites-store';

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

function makeInput(name: string, ra = 10, dec = 20) {
  return { name, ra, dec, raString: `${ra}`, decString: `${dec}` };
}

describe('useFavoritesStore', () => {
  beforeEach(() => resetFavoritesStore());

  describe('addFavorite', () => {
    it('should add a favorite with generated id, addedAt, viewCount, tags', () => {
      act(() => { useFavoritesStore.getState().addFavorite(makeInput('M31')); });
      const favs = useFavoritesStore.getState().favorites;
      expect(favs).toHaveLength(1);
      expect(favs[0].name).toBe('M31');
      expect(favs[0].id).toMatch(/^fav_/);
      expect(favs[0].viewCount).toBe(0);
      expect(favs[0].tags).toEqual([]);
      expect(favs[0].addedAt).toBeGreaterThan(0);
    });

    it('should not add duplicate (case-insensitive)', () => {
      act(() => {
        useFavoritesStore.getState().addFavorite(makeInput('M31'));
        useFavoritesStore.getState().addFavorite(makeInput('m31'));
      });
      expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    });
  });

  describe('removeFavorite', () => {
    it('should remove a favorite by id', () => {
      act(() => { useFavoritesStore.getState().addFavorite(makeInput('M31')); });
      const id = useFavoritesStore.getState().favorites[0].id;
      act(() => { useFavoritesStore.getState().removeFavorite(id); });
      expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    });
  });

  describe('updateFavorite', () => {
    it('should update favorite properties', () => {
      act(() => { useFavoritesStore.getState().addFavorite(makeInput('M31')); });
      const id = useFavoritesStore.getState().favorites[0].id;
      act(() => { useFavoritesStore.getState().updateFavorite(id, { notes: 'Great galaxy' }); });
      expect(useFavoritesStore.getState().favorites[0].notes).toBe('Great galaxy');
    });
  });

  describe('isFavorite', () => {
    it('should return true for existing favorite (case-insensitive)', () => {
      act(() => { useFavoritesStore.getState().addFavorite(makeInput('M31')); });
      expect(useFavoritesStore.getState().isFavorite('m31')).toBe(true);
      expect(useFavoritesStore.getState().isFavorite('M31')).toBe(true);
    });

    it('should return false for non-existing name', () => {
      expect(useFavoritesStore.getState().isFavorite('M99')).toBe(false);
    });
  });

  describe('getFavoriteByName', () => {
    it('should return favorite by name (case-insensitive)', () => {
      act(() => { useFavoritesStore.getState().addFavorite(makeInput('M42', 83, -5)); });
      const fav = useFavoritesStore.getState().getFavoriteByName('m42');
      expect(fav).toBeDefined();
      expect(fav?.ra).toBe(83);
    });

    it('should return undefined for unknown name', () => {
      expect(useFavoritesStore.getState().getFavoriteByName('X')).toBeUndefined();
    });
  });

  describe('addTag / removeTag', () => {
    it('should add a tag to a favorite', () => {
      act(() => { useFavoritesStore.getState().addFavorite(makeInput('M31')); });
      const id = useFavoritesStore.getState().favorites[0].id;
      act(() => { useFavoritesStore.getState().addTag(id, 'imaging'); });
      expect(useFavoritesStore.getState().favorites[0].tags).toContain('imaging');
    });

    it('should not add duplicate tag', () => {
      act(() => { useFavoritesStore.getState().addFavorite(makeInput('M31')); });
      const id = useFavoritesStore.getState().favorites[0].id;
      act(() => {
        useFavoritesStore.getState().addTag(id, 'imaging');
        useFavoritesStore.getState().addTag(id, 'imaging');
      });
      expect(useFavoritesStore.getState().favorites[0].tags.filter(t => t === 'imaging')).toHaveLength(1);
    });

    it('should remove a tag from a favorite', () => {
      act(() => { useFavoritesStore.getState().addFavorite(makeInput('M31')); });
      const id = useFavoritesStore.getState().favorites[0].id;
      act(() => {
        useFavoritesStore.getState().addTag(id, 'imaging');
        useFavoritesStore.getState().addTag(id, 'visual');
        useFavoritesStore.getState().removeTag(id, 'imaging');
      });
      expect(useFavoritesStore.getState().favorites[0].tags).toEqual(['visual']);
    });
  });

  describe('recordView', () => {
    it('should update viewCount and lastViewedAt for existing favorite', () => {
      act(() => { useFavoritesStore.getState().addFavorite(makeInput('M31')); });
      act(() => { useFavoritesStore.getState().recordView(makeInput('M31')); });
      const fav = useFavoritesStore.getState().favorites[0];
      expect(fav.viewCount).toBe(1);
      expect(fav.lastViewedAt).toBeGreaterThan(0);
    });

    it('should add entry to recentlyViewed', () => {
      act(() => { useFavoritesStore.getState().recordView(makeInput('M42', 83, -5)); });
      const recent = useFavoritesStore.getState().recentlyViewed;
      expect(recent).toHaveLength(1);
      expect(recent[0].name).toBe('M42');
    });

    it('should deduplicate in recentlyViewed (case-insensitive)', () => {
      act(() => {
        useFavoritesStore.getState().recordView(makeInput('M42'));
        useFavoritesStore.getState().recordView(makeInput('M42'));
      });
      expect(useFavoritesStore.getState().recentlyViewed).toHaveLength(1);
    });

    it('should respect maxRecent limit', () => {
      act(() => {
        useFavoritesStore.setState({ maxRecent: 3 });
        for (let i = 0; i < 5; i++) {
          useFavoritesStore.getState().recordView(makeInput(`Obj${i}`, i, i));
        }
      });
      expect(useFavoritesStore.getState().recentlyViewed).toHaveLength(3);
    });
  });

  describe('clearRecentlyViewed', () => {
    it('should clear all recently viewed entries', () => {
      act(() => {
        useFavoritesStore.getState().recordView(makeInput('M31'));
        useFavoritesStore.getState().clearRecentlyViewed();
      });
      expect(useFavoritesStore.getState().recentlyViewed).toHaveLength(0);
    });
  });

  describe('getAllTags', () => {
    it('should return sorted unique tags', () => {
      act(() => {
        useFavoritesStore.getState().addFavorite(makeInput('M31'));
        useFavoritesStore.getState().addFavorite(makeInput('M42', 83, -5));
      });
      const ids = useFavoritesStore.getState().favorites.map(f => f.id);
      act(() => {
        useFavoritesStore.getState().addTag(ids[0], 'visual');
        useFavoritesStore.getState().addTag(ids[0], 'imaging');
        useFavoritesStore.getState().addTag(ids[1], 'visual');
      });
      expect(useFavoritesStore.getState().getAllTags()).toEqual(['imaging', 'visual']);
    });

    it('should return empty array when no tags', () => {
      expect(useFavoritesStore.getState().getAllTags()).toEqual([]);
    });
  });

  describe('getFavoritesByTag', () => {
    it('should return favorites matching tag', () => {
      act(() => {
        useFavoritesStore.getState().addFavorite(makeInput('M31'));
        useFavoritesStore.getState().addFavorite(makeInput('M42', 83, -5));
      });
      const id0 = useFavoritesStore.getState().favorites[0].id;
      act(() => { useFavoritesStore.getState().addTag(id0, 'imaging'); });
      const result = useFavoritesStore.getState().getFavoritesByTag('imaging');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('M31');
    });

    it('should return empty array for unmatched tag', () => {
      expect(useFavoritesStore.getState().getFavoritesByTag('nonexistent')).toEqual([]);
    });
  });
});

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

  it('returns zero counts for empty array', () => {
    const result = useFavoritesStore.getState().importFavorites([]);
    expect(result).toEqual({ imported: 0, skipped: 0 });
  });

  it('handles items without id/tags/addedAt/viewCount gracefully', () => {
    const partial = {
      name: 'NGC1',
      ra: 10,
      dec: 20,
      raString: '10',
      decString: '20',
    } as unknown as FavoriteObject;

    let result = { imported: 0, skipped: 0 };
    act(() => {
      result = useFavoritesStore.getState().importFavorites([partial]);
    });
    expect(result.imported).toBe(1);
    const fav = useFavoritesStore.getState().favorites[0];
    expect(fav.id).toBeDefined();
    expect(fav.tags).toEqual([]);
    expect(fav.viewCount).toBe(0);
  });
});

describe('FAVORITE_TAGS', () => {
  it('should have predefined tags', () => {
    expect(FAVORITE_TAGS.length).toBeGreaterThan(0);
    expect(FAVORITE_TAGS).toContain('imaging');
    expect(FAVORITE_TAGS).toContain('visual');
  });
});

