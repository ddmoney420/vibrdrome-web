import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { PresetManifest, PresetRecord } from '../types/presets';

// Mock the network layer; keep the real DEFAULT_PRESETS_BASE.
vi.mock('../utils/presetBundle', async (orig) => {
  const actual = await orig<typeof import('../utils/presetBundle')>();
  return { ...actual, fetchManifest: vi.fn(), fetchShard: vi.fn() };
});

import { usePresetStore } from './presetStore';
import * as cache from '../utils/presetCache';
import { fetchManifest, fetchShard } from '../utils/presetBundle';

const MANIFEST: PresetManifest = {
  version: 1,
  sources: ['cream-of-the-crop'],
  totalPresets: 3,
  totalRawBytes: 0,
  totalGzBytes: 0,
  shards: [
    { file: 'Geometric.ndjson.gz', category: 'Geometric', count: 2, rawBytes: 0, gzBytes: 0 },
    { file: 'Fractal.ndjson.gz', category: 'Fractal', count: 1, rawBytes: 0, gzBytes: 0 },
  ],
  presets: [
    { name: 'Cube', path: 'cream/Geometric/Cube.milk', category: 'Geometric', shard: 'Geometric.ndjson.gz' },
    { name: 'Grid', path: 'cream/Geometric/Grid.milk', category: 'Geometric', shard: 'Geometric.ndjson.gz' },
    { name: 'Julia', path: 'cream/Fractal/Julia.milk', category: 'Fractal', shard: 'Fractal.ndjson.gz' },
  ],
};

const SHARDS: Record<string, PresetRecord[]> = {
  'Geometric.ndjson.gz': [
    { name: 'Cube', path: 'cream/Geometric/Cube.milk', text: 'CUBE' },
    { name: 'Grid', path: 'cream/Geometric/Grid.milk', text: 'GRID' },
  ],
  'Fractal.ndjson.gz': [{ name: 'Julia', path: 'cream/Fractal/Julia.milk', text: 'JULIA' }],
};

beforeEach(async () => {
  await cache.clearPresetCache();
  usePresetStore.setState({
    manifest: null,
    categories: [],
    loadedShards: new Set(),
    loadingShards: new Set(),
    loading: false,
    error: null,
    base: '/presets',
  });
  (fetchManifest as Mock).mockReset().mockResolvedValue(MANIFEST);
  (fetchShard as Mock).mockReset().mockImplementation(async (file: string) => SHARDS[file] ?? []);
});

describe('init', () => {
  it('loads + caches the manifest and derives categories', async () => {
    await usePresetStore.getState().init();
    const s = usePresetStore.getState();
    expect(s.manifest?.totalPresets).toBe(3);
    expect(s.categories).toEqual(['Geometric', 'Fractal']);
    expect(s.error).toBeNull();
    // cached for next time
    expect((await cache.getCachedManifest())?.version).toBe(1);
  });

  it('uses the cached manifest without re-fetching', async () => {
    await cache.cacheManifest(MANIFEST);
    await usePresetStore.getState().init();
    expect(fetchManifest as Mock).not.toHaveBeenCalled();
  });

  it('records an error when the fetch fails', async () => {
    (fetchManifest as Mock).mockRejectedValue(new Error('boom'));
    await usePresetStore.getState().init();
    expect(usePresetStore.getState().error).toBe('boom');
  });
});

describe('listPresets', () => {
  beforeEach(async () => {
    await usePresetStore.getState().init();
  });
  it('lists all by default', () => {
    expect(usePresetStore.getState().listPresets()).toHaveLength(3);
  });
  it('filters by category', () => {
    const geo = usePresetStore.getState().listPresets({ category: 'Geometric' });
    expect(geo.map((p) => p.name)).toEqual(['Cube', 'Grid']);
  });
  it('filters by case-insensitive search', () => {
    expect(usePresetStore.getState().listPresets({ search: 'jul' })).toHaveLength(1);
  });
});

describe('ensureShard / lazy loading', () => {
  beforeEach(async () => {
    await usePresetStore.getState().init();
  });

  it('downloads + caches a shard and marks it loaded', async () => {
    await usePresetStore.getState().ensureShard('Geometric.ndjson.gz');
    expect(usePresetStore.getState().loadedShards.has('Geometric.ndjson.gz')).toBe(true);
    expect((await cache.getCachedPreset('cream/Geometric/Cube.milk'))?.text).toBe('CUBE');
    expect(await cache.isShardCached('Geometric.ndjson.gz')).toBe(true);
  });

  it('is idempotent — does not re-fetch a loaded shard', async () => {
    await usePresetStore.getState().ensureShard('Geometric.ndjson.gz');
    await usePresetStore.getState().ensureShard('Geometric.ndjson.gz');
    expect((fetchShard as Mock).mock.calls.length).toBe(1);
  });

  it('does not re-fetch a shard already cached from a previous session', async () => {
    await cache.cacheShardPresets(SHARDS['Geometric.ndjson.gz']);
    await cache.markShardCached('Geometric.ndjson.gz');
    await usePresetStore.getState().ensureShard('Geometric.ndjson.gz');
    expect(fetchShard as Mock).not.toHaveBeenCalled();
    expect(usePresetStore.getState().loadedShards.has('Geometric.ndjson.gz')).toBe(true);
  });

  it('clears the loading flag and records error on failure', async () => {
    (fetchShard as Mock).mockRejectedValueOnce(new Error('net down'));
    await expect(usePresetStore.getState().ensureShard('Geometric.ndjson.gz')).rejects.toThrow();
    const s = usePresetStore.getState();
    expect(s.loadingShards.has('Geometric.ndjson.gz')).toBe(false);
    expect(s.error).toBe('net down');
  });

  it('ensureCategory loads the backing shard', async () => {
    await usePresetStore.getState().ensureCategory('Fractal');
    expect(usePresetStore.getState().loadedShards.has('Fractal.ndjson.gz')).toBe(true);
  });
});

describe('getPresetText', () => {
  beforeEach(async () => {
    await usePresetStore.getState().init();
  });
  it('auto-loads the shard and returns the raw text', async () => {
    const text = await usePresetStore.getState().getPresetText('cream/Fractal/Julia.milk');
    expect(text).toBe('JULIA');
    expect(usePresetStore.getState().loadedShards.has('Fractal.ndjson.gz')).toBe(true);
  });
  it('returns null for an unknown path', async () => {
    expect(await usePresetStore.getState().getPresetText('nope')).toBeNull();
  });
});

describe('clear', () => {
  it('wipes cache + state', async () => {
    await usePresetStore.getState().init();
    await usePresetStore.getState().ensureShard('Geometric.ndjson.gz');
    await usePresetStore.getState().clear();
    expect(usePresetStore.getState().manifest).toBeNull();
    expect(usePresetStore.getState().loadedShards.size).toBe(0);
    expect(await cache.countCachedPresets()).toBe(0);
  });
});
