import { describe, expect, it } from 'vitest';
import {
  parseManifest,
  parseNdjson,
  decodeShardBytes,
  fetchManifest,
  fetchShard,
} from './presetBundle';
import type { PresetManifest } from '../types/presets';

// gzip a string using the web CompressionStream API (no Node types needed).
async function gzip(text: string): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  void writer.write(new TextEncoder().encode(text));
  void writer.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}

const MANIFEST: PresetManifest = {
  version: 1,
  sources: ['cream-of-the-crop'],
  totalPresets: 2,
  totalRawBytes: 100,
  totalGzBytes: 50,
  shards: [{ file: 'Geometric.ndjson.gz', category: 'Geometric', count: 2, rawBytes: 100, gzBytes: 50 }],
  presets: [
    { name: 'A', path: 'cream/Geometric/A.milk', category: 'Geometric', shard: 'Geometric.ndjson.gz' },
    { name: 'B', path: 'cream/Geometric/B.milk', category: 'Geometric', shard: 'Geometric.ndjson.gz' },
  ],
};

const NDJSON =
  JSON.stringify({ name: 'A', path: 'cream/Geometric/A.milk', text: '[preset00]\nA' }) +
  '\n' +
  JSON.stringify({ name: 'B', path: 'cream/Geometric/B.milk', text: '[preset00]\nB' }) +
  '\n';

const mockFetch = (body: { json?: unknown; bytes?: Uint8Array; ok?: boolean; status?: number }) =>
  (async () =>
    ({
      ok: body.ok ?? true,
      status: body.status ?? 200,
      json: async () => body.json,
      arrayBuffer: async () => (body.bytes ? body.bytes.buffer : new ArrayBuffer(0)),
    }) as Response) as unknown as typeof fetch;

describe('parseManifest', () => {
  it('accepts a valid v1 manifest', () => {
    expect(parseManifest(MANIFEST).totalPresets).toBe(2);
  });
  it('rejects wrong version / shape', () => {
    expect(() => parseManifest({ ...MANIFEST, version: 2 })).toThrow();
    expect(() => parseManifest({ version: 1 })).toThrow();
    expect(() => parseManifest(null)).toThrow();
  });
});

describe('parseNdjson', () => {
  it('parses well-formed lines', () => {
    const recs = parseNdjson(NDJSON);
    expect(recs).toHaveLength(2);
    expect(recs[0]).toMatchObject({ name: 'A', path: 'cream/Geometric/A.milk' });
    expect(recs[1].text).toContain('B');
  });
  it('skips malformed / incomplete lines without throwing', () => {
    const messy =
      'not json\n' +
      JSON.stringify({ path: 'x', text: 'ok' }) +
      '\n' +
      JSON.stringify({ path: 'no-text' }) + // missing text → skipped
      '\n\n';
    const recs = parseNdjson(messy);
    expect(recs).toHaveLength(1);
    expect(recs[0].path).toBe('x');
  });
});

describe('decodeShardBytes', () => {
  it('decompresses gzipped NDJSON', async () => {
    const gz = await gzip(NDJSON);
    const text = await decodeShardBytes(gz.buffer as ArrayBuffer);
    expect(text).toBe(NDJSON);
  });
  it('passes through already-decoded (non-gzip) bytes', async () => {
    const plain = new TextEncoder().encode(NDJSON);
    const text = await decodeShardBytes(plain.buffer);
    expect(text).toBe(NDJSON);
  });
});

describe('fetchManifest', () => {
  it('fetches and validates', async () => {
    const m = await fetchManifest('/presets', mockFetch({ json: MANIFEST }));
    expect(m.shards[0].category).toBe('Geometric');
  });
  it('throws on non-ok response', async () => {
    await expect(fetchManifest('/presets', mockFetch({ ok: false, status: 404 }))).rejects.toThrow();
  });
});

describe('fetchShard', () => {
  it('fetches, gzip-decodes, and parses', async () => {
    const gz = await gzip(NDJSON);
    const recs = await fetchShard(
      'Geometric.ndjson.gz',
      '/presets',
      mockFetch({ bytes: gz }),
    );
    expect(recs).toHaveLength(2);
    expect(recs.map((r) => r.name)).toEqual(['A', 'B']);
  });
  it('throws on non-ok response', async () => {
    await expect(
      fetchShard('Geometric.ndjson.gz', '/presets', mockFetch({ ok: false, status: 500 })),
    ).rejects.toThrow();
  });
});
