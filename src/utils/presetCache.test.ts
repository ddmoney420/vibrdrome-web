import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import * as cache from './presetCache';
import type { PresetManifest, PresetRecord } from '../types/presets';

const MANIFEST: PresetManifest = {
  version: 1,
  sources: ['cream-of-the-crop'],
  totalPresets: 1,
  totalRawBytes: 10,
  totalGzBytes: 5,
  shards: [{ file: 'Geometric.ndjson.gz', category: 'Geometric', count: 1, rawBytes: 10, gzBytes: 5 }],
  presets: [{ name: 'A', path: 'cream/A.milk', category: 'Geometric', shard: 'Geometric.ndjson.gz' }],
};

const rec = (path: string, text: string): PresetRecord => ({ name: path, path, text });

beforeEach(async () => {
  await cache.clearPresetCache();
});

describe('manifest cache', () => {
  it('round-trips the manifest', async () => {
    expect(await cache.getCachedManifest()).toBeNull();
    await cache.cacheManifest(MANIFEST);
    const got = await cache.getCachedManifest();
    expect(got?.version).toBe(1);
    expect(got?.totalPresets).toBe(1);
  });
});

describe('preset records', () => {
  it('stores and retrieves by path', async () => {
    await cache.cacheShardPresets([rec('cream/A.milk', 'AAA'), rec('cream/B.milk', 'BBB')]);
    expect((await cache.getCachedPreset('cream/A.milk'))?.text).toBe('AAA');
    expect((await cache.getCachedPreset('cream/B.milk'))?.text).toBe('BBB');
    expect(await cache.countCachedPresets()).toBe(2);
  });

  it('returns null for an unknown path', async () => {
    expect(await cache.getCachedPreset('nope')).toBeNull();
  });

  it('dedupes by path (re-store overwrites, count unchanged)', async () => {
    await cache.cacheShardPresets([rec('cream/A.milk', 'v1')]);
    await cache.cacheShardPresets([rec('cream/A.milk', 'v2')]);
    expect((await cache.getCachedPreset('cream/A.milk'))?.text).toBe('v2');
    expect(await cache.countCachedPresets()).toBe(1);
  });
});

describe('loaded-shard bookkeeping', () => {
  it('marks and lists cached shards without duplicates', async () => {
    expect(await cache.getCachedShards()).toEqual([]);
    expect(await cache.isShardCached('Geometric.ndjson.gz')).toBe(false);

    await cache.markShardCached('Geometric.ndjson.gz');
    await cache.markShardCached('Geometric.ndjson.gz'); // dup ignored
    await cache.markShardCached('Fractal.ndjson.gz');

    expect(await cache.isShardCached('Geometric.ndjson.gz')).toBe(true);
    expect((await cache.getCachedShards()).sort()).toEqual([
      'Fractal.ndjson.gz',
      'Geometric.ndjson.gz',
    ]);
  });
});

describe('clearPresetCache', () => {
  it('empties presets and meta', async () => {
    await cache.cacheManifest(MANIFEST);
    await cache.cacheShardPresets([rec('cream/A.milk', 'AAA')]);
    await cache.markShardCached('Geometric.ndjson.gz');

    await cache.clearPresetCache();

    expect(await cache.getCachedManifest()).toBeNull();
    expect(await cache.countCachedPresets()).toBe(0);
    expect(await cache.getCachedShards()).toEqual([]);
  });
});
