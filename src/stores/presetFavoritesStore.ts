// Local-only store of favorited visualizer presets (engine-prefixed keys; see
// utils/presetFavorites). Persisted to localStorage as a versioned JSON blob so
// the shape can evolve; malformed/old data degrades safely to an empty set.
// Orphaned keys (preset no longer in the manifest) are kept stored — callers
// just don't show what they can't resolve.
import { create } from 'zustand';

const STORAGE_KEY = 'vibrdrome_visualizer_favorites';
const VERSION = 1;

/** Load favorites from localStorage. Never throws; bad data → empty set. */
export function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { keys?: unknown }).keys)) {
      return new Set();
    }
    const keys = (parsed as { keys: unknown[] }).keys.filter((k): k is string => typeof k === 'string');
    return new Set(keys);
  } catch {
    return new Set();
  }
}

function persist(keys: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, keys: [...keys] }));
  } catch {
    /* ignore quota/availability errors */
  }
}

interface PresetFavoritesState {
  favoriteKeys: Set<string>;
  isFavorite: (key: string) => boolean;
  addFavorite: (key: string) => void;
  removeFavorite: (key: string) => void;
  removeFavorites: (keys: Iterable<string>) => void;
  toggleFavorite: (key: string) => void;
}

export const usePresetFavoritesStore = create<PresetFavoritesState>((set, get) => ({
  favoriteKeys: loadFavorites(),
  isFavorite: (key) => get().favoriteKeys.has(key),
  addFavorite: (key) => {
    if (get().favoriteKeys.has(key)) return;
    const next = new Set(get().favoriteKeys);
    next.add(key);
    persist(next);
    set({ favoriteKeys: next });
  },
  removeFavorite: (key) => {
    if (!get().favoriteKeys.has(key)) return;
    const next = new Set(get().favoriteKeys);
    next.delete(key);
    persist(next);
    set({ favoriteKeys: next });
  },
  // Atomic bulk removal (one persist + one state update). No-op if nothing in
  // `keys` was actually present — used by explicit orphan cleanup.
  removeFavorites: (keys) => {
    const next = new Set(get().favoriteKeys);
    let changed = false;
    for (const key of keys) {
      if (next.delete(key)) changed = true;
    }
    if (!changed) return;
    persist(next);
    set({ favoriteKeys: next });
  },
  toggleFavorite: (key) => {
    if (get().favoriteKeys.has(key)) get().removeFavorite(key);
    else get().addFavorite(key);
  },
}));
