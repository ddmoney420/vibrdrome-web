// IndexedDB persistence for projectM-rs presets, mirroring the app's existing
// idb pattern (see downloadStore.ts / lastfmCache.ts). Two object stores:
//   - `presets`: full preset records keyed by `path` (so re-storing a path
//                dedupes/overwrites).
//   - `meta`:    the cached manifest and the set of shards already downloaded,
//                under fixed string keys.
//
// All reads fail soft (return null/[]); writes that matter (caching presets)
// surface errors so the store can report them.

import { openDB } from 'idb';
import type { PresetManifest, PresetRecord } from '../types/presets';

const DB_NAME = 'vibrdrome_presets';
const DB_VERSION = 1;
const PRESETS_STORE = 'presets';
const META_STORE = 'meta';
const MANIFEST_KEY = 'manifest';
const LOADED_SHARDS_KEY = 'loadedShards';

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PRESETS_STORE)) {
        db.createObjectStore(PRESETS_STORE, { keyPath: 'path' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    },
  });
}

// --- manifest ---

export async function cacheManifest(manifest: PresetManifest): Promise<void> {
  try {
    const db = await getDB();
    await db.put(META_STORE, manifest, MANIFEST_KEY);
  } catch {
    /* non-fatal: a missing cached manifest just means we re-fetch */
  }
}

export async function getCachedManifest(): Promise<PresetManifest | null> {
  try {
    const db = await getDB();
    return ((await db.get(META_STORE, MANIFEST_KEY)) as PresetManifest | undefined) ?? null;
  } catch {
    return null;
  }
}

// --- preset records ---

/** Bulk-store preset records. Keyed by `path`, so duplicates overwrite. */
export async function cacheShardPresets(records: PresetRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(PRESETS_STORE, 'readwrite');
  await Promise.all(records.map((r) => tx.store.put(r)));
  await tx.done;
}

export async function getCachedPreset(path: string): Promise<PresetRecord | null> {
  try {
    const db = await getDB();
    return ((await db.get(PRESETS_STORE, path)) as PresetRecord | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function countCachedPresets(): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(PRESETS_STORE);
  } catch {
    return 0;
  }
}

// --- loaded-shard bookkeeping ---

export async function getCachedShards(): Promise<string[]> {
  try {
    const db = await getDB();
    return ((await db.get(META_STORE, LOADED_SHARDS_KEY)) as string[] | undefined) ?? [];
  } catch {
    return [];
  }
}

export async function markShardCached(file: string): Promise<void> {
  try {
    const db = await getDB();
    const existing = ((await db.get(META_STORE, LOADED_SHARDS_KEY)) as string[] | undefined) ?? [];
    if (!existing.includes(file)) {
      existing.push(file);
      await db.put(META_STORE, existing, LOADED_SHARDS_KEY);
    }
  } catch {
    /* non-fatal */
  }
}

export async function isShardCached(file: string): Promise<boolean> {
  return (await getCachedShards()).includes(file);
}

export async function clearPresetCache(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(PRESETS_STORE);
    await db.clear(META_STORE);
  } catch {
    /* non-fatal */
  }
}
