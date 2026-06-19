// Types for the projectM-rs Milkdrop preset bundles produced by the
// `tools/preset-pack` pipeline (manifest version 1). See that tool's README.

/** One gzipped NDJSON shard = all presets in one top-level category. */
export interface ShardInfo {
  file: string; // e.g. "Geometric.ndjson.gz"
  category: string; // human label, e.g. "Geometric" or "! Transition"
  count: number;
  rawBytes: number;
  gzBytes: number;
}

/** Flat per-preset index entry (in the manifest) for listing/search without
 *  downloading any shard. */
export interface PresetIndexEntry {
  name: string; // display name (filename sans extension)
  path: string; // stable unique key: "<pack>/<relpath>.milk"
  category: string;
  shard: string; // shard file that holds the full text
}

/** `manifest.json` — the index of the whole corpus. */
export interface PresetManifest {
  version: number; // 1
  sources: string[];
  totalPresets: number;
  totalRawBytes: number;
  totalGzBytes: number;
  shards: ShardInfo[];
  presets: PresetIndexEntry[];
}

/** One preset record as stored in a shard / IndexedDB (keyed by `path`). */
export interface PresetRecord {
  name: string;
  path: string; // primary key
  text: string; // raw .milk source — fed straight to PmEngine.load_preset
}
