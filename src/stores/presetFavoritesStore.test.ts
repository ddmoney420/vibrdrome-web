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
});
