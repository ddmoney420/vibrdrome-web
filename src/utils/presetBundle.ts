// Network + decode layer for the projectM-rs preset bundles.
//
// Bundles are produced by `tools/preset-pack` (manifest v1): a manifest.json
// index plus one gzipped NDJSON shard per category. These helpers fetch and
// decode them. They are intentionally side-effect-free (caching lives in
// presetCache.ts) and take an injectable `fetchFn` so they're easy to test.

import type { PresetManifest, PresetRecord } from '../types/presets';

/** Where the bundles are served from (copied into public/presets/ later). */
export const DEFAULT_PRESETS_BASE = '/presets';

type FetchFn = typeof fetch;

/** Validate and narrow an untrusted JSON value to a v1 manifest. */
export function parseManifest(json: unknown): PresetManifest {
  const m = json as PresetManifest;
  if (
    !m ||
    typeof m !== 'object' ||
    m.version !== 1 ||
    !Array.isArray(m.shards) ||
    !Array.isArray(m.presets)
  ) {
    throw new Error('invalid preset manifest (expected version 1 with shards[]/presets[])');
  }
  return m;
}

export async function fetchManifest(
  base: string = DEFAULT_PRESETS_BASE,
  fetchFn: FetchFn = fetch,
): Promise<PresetManifest> {
  const res = await fetchFn(`${base}/manifest.json`);
  if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
  return parseManifest(await res.json());
}

/** Parse NDJSON shard text into preset records, skipping malformed lines. */
export function parseNdjson(text: string): PresetRecord[] {
  const out: PresetRecord[] = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    try {
      const rec = JSON.parse(line) as PresetRecord;
      if (rec && typeof rec.path === 'string' && typeof rec.text === 'string') {
        out.push({ name: String(rec.name ?? rec.path), path: rec.path, text: rec.text });
      }
    } catch {
      // Skip a corrupt line rather than failing the whole shard.
    }
  }
  return out;
}

/**
 * Decode a shard body to text. The shards are pre-gzipped `.ndjson.gz` that we
 * decompress in JS via `DecompressionStream('gzip')`.
 *
 * Content-Encoding gotcha: if the host *also* applied `Content-Encoding: gzip`,
 * the browser already decoded the body, so the bytes we receive are plain
 * NDJSON (no gzip magic). We detect the gzip magic number (0x1f 0x8b) and only
 * decompress when it's actually present — otherwise treat the bytes as UTF-8.
 */
export async function decodeShardBytes(buf: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buf);
  const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!isGzip) {
    return new TextDecoder().decode(bytes);
  }
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  void writer.write(bytes);
  void writer.close();
  return new Response(ds.readable).text();
}

export async function fetchShard(
  shardFile: string,
  base: string = DEFAULT_PRESETS_BASE,
  fetchFn: FetchFn = fetch,
): Promise<PresetRecord[]> {
  const res = await fetchFn(`${base}/${shardFile}`);
  if (!res.ok) throw new Error(`shard fetch failed (${shardFile}): ${res.status}`);
  const text = await decodeShardBytes(await res.arrayBuffer());
  return parseNdjson(text);
}
