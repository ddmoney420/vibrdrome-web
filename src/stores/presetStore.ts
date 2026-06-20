// presetStore — the projectM-rs Milkdrop preset library/cache facade.
//
// Responsibilities (data layer only — no visualizer/WASM wiring here):
//   - load the manifest (from IndexedDB if cached, else fetch + cache)
//   - list/search presets and categories from the manifest (no shard download)
//   - lazily ensure a shard/category is downloaded + cached on demand
//   - retrieve a preset's raw .milk text by path (auto-loads its shard)
//   - expose loading/progress/error state
//
// Lazy by default (per category/shard). Preloading is supported by calling
// `ensureShard`/`ensureCategory` ahead of time (e.g. for all shards).

import { create } from 'zustand';
import type { PresetManifest, PresetIndexEntry } from '../types/presets';
import { fetchManifest, fetchShard, DEFAULT_PRESETS_BASE } from '../utils/presetBundle';
import * as cache from '../utils/presetCache';

interface PresetState {
  manifest: PresetManifest | null;
  categories: string[];
  loadedShards: Set<string>;
  loadingShards: Set<string>;
  loading: boolean; // manifest init in flight
  error: string | null;
  base: string;

  /** Load the manifest (cache-first) and the set of already-cached shards. */
  init: (base?: string) => Promise<void>;
  /** List presets from the manifest, optionally filtered by category/search. */
  listPresets: (opts?: { category?: string; search?: string }) => PresetIndexEntry[];
  /** Download + cache a shard if not already present (idempotent). */
  ensureShard: (shardFile: string) => Promise<void>;
  /** Ensure the shard backing a category is loaded. */
  ensureCategory: (category: string) => Promise<void>;
  /** Get a preset's raw .milk text by path, loading its shard if needed. */
  getPresetText: (path: string) => Promise<string | null>;
  /** Wipe the cache and reset in-memory state. */
  clear: () => Promise<void>;
}

export const usePresetStore = create<PresetState>((set, get) => ({
  manifest: null,
  categories: [],
  loadedShards: new Set(),
  loadingShards: new Set(),
  loading: false,
  error: null,
  base: DEFAULT_PRESETS_BASE,

  init: async (base = DEFAULT_PRESETS_BASE) => {
    if (get().loading) return;
    set({ loading: true, error: null, base });
    try {
      let manifest = await cache.getCachedManifest();
      if (!manifest || manifest.version !== 1) {
        manifest = await fetchManifest(base);
        await cache.cacheManifest(manifest);
      }
      const loaded = new Set(await cache.getCachedShards());
      set({
        manifest,
        categories: manifest.shards.map((s) => s.category),
        loadedShards: loaded,
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  listPresets: (opts) => {
    const m = get().manifest;
    if (!m) return [];
    let list = m.presets;
    if (opts?.category) list = list.filter((p) => p.category === opts.category);
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  },

  ensureShard: async (shardFile) => {
    const { loadedShards, loadingShards, base } = get();
    if (loadedShards.has(shardFile) || loadingShards.has(shardFile)) return;

    // Already in IndexedDB from a previous session?
    if (await cache.isShardCached(shardFile)) {
      set((s) => ({ loadedShards: new Set(s.loadedShards).add(shardFile) }));
      return;
    }

    set((s) => ({ loadingShards: new Set(s.loadingShards).add(shardFile) }));
    try {
      const records = await fetchShard(shardFile, base);
      await cache.cacheShardPresets(records);
      await cache.markShardCached(shardFile);
      set((s) => {
        const loaded = new Set(s.loadedShards).add(shardFile);
        const loading = new Set(s.loadingShards);
        loading.delete(shardFile);
        return { loadedShards: loaded, loadingShards: loading };
      });
    } catch (e) {
      set((s) => {
        const loading = new Set(s.loadingShards);
        loading.delete(shardFile);
        return { loadingShards: loading, error: e instanceof Error ? e.message : String(e) };
      });
      throw e;
    }
  },

  ensureCategory: async (category) => {
    const m = get().manifest;
    if (!m) return;
    const shard = m.shards.find((s) => s.category === category);
    if (shard) await get().ensureShard(shard.file);
  },

  getPresetText: async (path) => {
    const m = get().manifest;
    const entry = m?.presets.find((p) => p.path === path);
    if (entry) await get().ensureShard(entry.shard);
    const rec = await cache.getCachedPreset(path);
    return rec?.text ?? null;
  },

  clear: async () => {
    await cache.clearPresetCache();
    set({ manifest: null, categories: [], loadedShards: new Set(), loadingShards: new Set() });
  },
}));
