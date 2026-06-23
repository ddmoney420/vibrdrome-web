import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePresetFavoritesStore, loadFavorites } from './presetFavoritesStore';

const STORAGE_KEY = 'vibrdrome_visualizer_favorites';

// Deterministic in-memory localStorage (the test env's built-in one is partial).
beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  });
  usePresetFavoritesStore.setState({ favoriteKeys: new Set() });
});
afterEach(() => vi.unstubAllGlobals());

describe('presetFavoritesStore', () => {
  it('toggles favorites correctly', () => {
    const s = usePresetFavoritesStore.getState();
    expect(s.isFavorite('projectm:a')).toBe(false);
    s.toggleFavorite('projectm:a');
    expect(usePresetFavoritesStore.getState().isFavorite('projectm:a')).toBe(true);
    usePresetFavoritesStore.getState().toggleFavorite('projectm:a');
    expect(usePresetFavoritesStore.getState().isFavorite('projectm:a')).toBe(false);
  });

  it('add/remove are idempotent', () => {
    const s = usePresetFavoritesStore.getState();
    s.addFavorite('butterchurn:x');
    s.addFavorite('butterchurn:x');
    expect(usePresetFavoritesStore.getState().favoriteKeys.size).toBe(1);
    usePresetFavoritesStore.getState().removeFavorite('butterchurn:x');
    usePresetFavoritesStore.getState().removeFavorite('butterchurn:x');
    expect(usePresetFavoritesStore.getState().favoriteKeys.size).toBe(0);
  });

  it('persists a versioned JSON blob to localStorage', () => {
    usePresetFavoritesStore.getState().toggleFavorite('projectm:p/one.milk');
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual({ v: 1, keys: ['projectm:p/one.milk'] });
  });

  it('loadFavorites reads a versioned JSON blob back into a Set', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, keys: ['projectm:a', 'butterchurn:b'] }));
    const set = loadFavorites();
    expect(set.has('projectm:a')).toBe(true);
    expect(set.has('butterchurn:b')).toBe(true);
    expect(set.size).toBe(2);
  });

  it('degrades safely to empty for malformed / unknown blobs', () => {
    localStorage.setItem(STORAGE_KEY, 'not json at all {{{');
    expect(loadFavorites().size).toBe(0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));
    expect(loadFavorites().size).toBe(0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, keys: 'oops' }));
    expect(loadFavorites().size).toBe(0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, keys: [1, 2, 'projectm:ok'] }));
    expect(loadFavorites().size).toBe(1); // non-strings filtered out
    expect(loadFavorites().has('projectm:ok')).toBe(true);
  });

  describe('removeFavorites (bulk)', () => {
    const seed = (keys: string[]) => {
      const s = usePresetFavoritesStore.getState();
      keys.forEach((k) => s.addFavorite(k));
    };

    it('removes exactly the requested keys and leaves the rest', () => {
      seed(['projectm:a', 'projectm:b', 'projectm:c', 'butterchurn:x']);
      usePresetFavoritesStore.getState().removeFavorites(['projectm:a', 'projectm:c']);
      const keys = usePresetFavoritesStore.getState().favoriteKeys;
      expect([...keys].sort()).toEqual(['butterchurn:x', 'projectm:b']);
    });

    it('does not throw when asked to remove absent keys, and leaves others intact', () => {
      seed(['projectm:a', 'butterchurn:x']);
      expect(() =>
        usePresetFavoritesStore.getState().removeFavorites(['projectm:ghost', 'nope:none']),
      ).not.toThrow();
      expect([...usePresetFavoritesStore.getState().favoriteKeys].sort()).toEqual([
        'butterchurn:x',
        'projectm:a',
      ]);
    });

    it('is a no-op for an empty iterable (state ref unchanged → no set())', () => {
      seed(['projectm:a']);
      const before = usePresetFavoritesStore.getState().favoriteKeys;
      usePresetFavoritesStore.getState().removeFavorites([]);
      expect(usePresetFavoritesStore.getState().favoriteKeys).toBe(before);
    });

    it('is a no-op when none of the keys are present (no state churn)', () => {
      seed(['projectm:a']);
      const before = usePresetFavoritesStore.getState().favoriteKeys;
      usePresetFavoritesStore.getState().removeFavorites(['projectm:ghost']);
      expect(usePresetFavoritesStore.getState().favoriteKeys).toBe(before);
    });

    it('persists the surviving keys once, in the versioned shape', () => {
      seed(['projectm:a', 'projectm:b', 'butterchurn:x']);
      usePresetFavoritesStore.getState().removeFavorites(['projectm:b']);
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.v).toBe(1);
      expect([...parsed.keys].sort()).toEqual(['butterchurn:x', 'projectm:a']);
      // round-trips back into a Set with exactly the survivors
      expect([...loadFavorites()].sort()).toEqual(['butterchurn:x', 'projectm:a']);
    });

    it('accepts a Set as input', () => {
      seed(['projectm:a', 'projectm:b']);
      usePresetFavoritesStore.getState().removeFavorites(new Set(['projectm:a']));
      expect([...usePresetFavoritesStore.getState().favoriteKeys]).toEqual(['projectm:b']);
    });
  });

  describe('addFavorites (bulk union)', () => {
    const seed = (keys: string[]) => {
      const s = usePresetFavoritesStore.getState();
      keys.forEach((k) => s.addFavorite(k));
    };

    it('adds only the missing keys and leaves existing keys intact', () => {
      seed(['projectm:a', 'butterchurn:x']);
      usePresetFavoritesStore.getState().addFavorites(['projectm:a', 'projectm:b', 'butterchurn:y']);
      expect([...usePresetFavoritesStore.getState().favoriteKeys].sort()).toEqual([
        'butterchurn:x',
        'butterchurn:y',
        'projectm:a',
        'projectm:b',
      ]);
    });

    it('is a no-op for an empty iterable (state ref unchanged → no set())', () => {
      seed(['projectm:a']);
      const before = usePresetFavoritesStore.getState().favoriteKeys;
      usePresetFavoritesStore.getState().addFavorites([]);
      expect(usePresetFavoritesStore.getState().favoriteKeys).toBe(before);
    });

    it('is a no-op when all keys already exist (no churn)', () => {
      seed(['projectm:a', 'projectm:b']);
      const before = usePresetFavoritesStore.getState().favoriteKeys;
      usePresetFavoritesStore.getState().addFavorites(['projectm:a', 'projectm:b']);
      expect(usePresetFavoritesStore.getState().favoriteKeys).toBe(before);
    });

    it('persists once, round-tripping the union in the versioned shape', () => {
      seed(['projectm:a']);
      usePresetFavoritesStore.getState().addFavorites(['butterchurn:x']);
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw!);
      expect(parsed.v).toBe(1);
      expect([...parsed.keys].sort()).toEqual(['butterchurn:x', 'projectm:a']);
      expect([...loadFavorites()].sort()).toEqual(['butterchurn:x', 'projectm:a']);
    });

    it('accepts a Set as input', () => {
      seed(['projectm:a']);
      usePresetFavoritesStore.getState().addFavorites(new Set(['projectm:b']));
      expect([...usePresetFavoritesStore.getState().favoriteKeys].sort()).toEqual(['projectm:a', 'projectm:b']);
    });
  });
});
