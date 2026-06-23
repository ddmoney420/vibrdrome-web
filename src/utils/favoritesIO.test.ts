import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildFavoritesExport, mergeFavoritesFromText } from './favoritesIO';
import { usePresetFavoritesStore } from '../stores/presetFavoritesStore';

// Deterministic in-memory localStorage (the test env's built-in one is partial),
// matching the presetFavoritesStore test harness.
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

const seed = (keys: string[]) => usePresetFavoritesStore.setState({ favoriteKeys: new Set(keys) });
const currentKeys = () => [...usePresetFavoritesStore.getState().favoriteKeys].sort();
const fileFor = (keys: unknown[], version: unknown = 1) =>
  JSON.stringify({ version, exportedAt: '2026-06-21T00:00:00.000Z', favorites: { v: 1, keys } });

describe('favoritesIO export', () => {
  it('creates a versioned payload with the current favorite keys', () => {
    seed(['projectm:a', 'butterchurn:b']);
    const out = buildFavoritesExport(new Date('2026-06-21T12:00:00.000Z'));
    expect(out.version).toBe(1);
    expect(out.exportedAt).toBe('2026-06-21T12:00:00.000Z');
    expect(out.favorites.v).toBe(1);
    expect([...out.favorites.keys].sort()).toEqual(['butterchurn:b', 'projectm:a']);
  });

  it('excludes credentials / server / other settings (only favorites are present)', () => {
    seed(['projectm:a']);
    const out = buildFavoritesExport();
    const json = JSON.stringify(out);
    // Only the top-level keys version/exportedAt/favorites exist.
    expect(Object.keys(out).sort()).toEqual(['exportedAt', 'favorites', 'version']);
    // No credential/server fields leak in.
    for (const forbidden of ['username', 'password', 'url', 'vibrdrome_servers', 'vibrdrome_active_server', 'server']) {
      expect(json).not.toContain(forbidden);
    }
  });
});

describe('favoritesIO import (union merge)', () => {
  it('adds new keys and reports the added count', () => {
    seed([]);
    const r = mergeFavoritesFromText(fileFor(['projectm:a', 'butterchurn:b']));
    expect(r).toEqual({ added: 2, alreadyPresent: 0, ignoredInvalid: 0 });
    expect(currentKeys()).toEqual(['butterchurn:b', 'projectm:a']);
  });

  it('keeps existing keys and only adds the missing ones (lossless union)', () => {
    seed(['projectm:keep', 'butterchurn:keep']);
    const r = mergeFavoritesFromText(fileFor(['projectm:keep', 'projectm:new']));
    expect(r).toEqual({ added: 1, alreadyPresent: 1, ignoredInvalid: 0 });
    expect(currentKeys()).toEqual(['butterchurn:keep', 'projectm:keep', 'projectm:new']);
  });

  it('importing a strict subset removes nothing', () => {
    seed(['projectm:a', 'projectm:b', 'butterchurn:c']);
    const r = mergeFavoritesFromText(fileFor(['projectm:a']));
    expect(r).toEqual({ added: 0, alreadyPresent: 1, ignoredInvalid: 0 });
    expect(currentKeys()).toEqual(['butterchurn:c', 'projectm:a', 'projectm:b']);
  });

  it('is idempotent for duplicate keys within the file', () => {
    seed([]);
    const r = mergeFavoritesFromText(fileFor(['projectm:a', 'projectm:a', 'projectm:a']));
    expect(r.added).toBe(1);
    expect(currentKeys()).toEqual(['projectm:a']);
  });

  it('filters non-string keys and counts them as ignoredInvalid', () => {
    seed([]);
    const r = mergeFavoritesFromText(fileFor(['projectm:a', 1, null, { x: 1 }, 'butterchurn:b']));
    expect(r.added).toBe(2);
    expect(r.ignoredInvalid).toBe(3);
    expect(currentKeys()).toEqual(['butterchurn:b', 'projectm:a']);
  });

  it('a fully-present import is a no-op (no removals, nothing added)', () => {
    seed(['projectm:a', 'butterchurn:b']);
    const r = mergeFavoritesFromText(fileFor(['projectm:a', 'butterchurn:b']));
    expect(r).toEqual({ added: 0, alreadyPresent: 2, ignoredInvalid: 0 });
    expect(currentKeys()).toEqual(['butterchurn:b', 'projectm:a']);
  });

  // --- safe failure: never mutate on bad input ---

  it('throws on malformed JSON and leaves favorites unchanged', () => {
    seed(['projectm:keep']);
    expect(() => mergeFavoritesFromText('not json {{{')).toThrow();
    expect(currentKeys()).toEqual(['projectm:keep']);
  });

  it('throws on an unsupported version and leaves favorites unchanged', () => {
    seed(['projectm:keep']);
    expect(() => mergeFavoritesFromText(fileFor(['projectm:new'], 2))).toThrow();
    expect(currentKeys()).toEqual(['projectm:keep']);
  });

  it('throws when the favorites payload is missing/invalid and leaves favorites unchanged', () => {
    seed(['projectm:keep']);
    expect(() => mergeFavoritesFromText(JSON.stringify({ version: 1, exportedAt: 'x' }))).toThrow();
    expect(() => mergeFavoritesFromText(JSON.stringify({ version: 1, favorites: { v: 1, keys: 'oops' } }))).toThrow();
    expect(() => mergeFavoritesFromText('null')).toThrow();
    expect(currentKeys()).toEqual(['projectm:keep']);
  });

  it('round-trips an export back through import without loss', () => {
    seed(['projectm:a', 'butterchurn:b', 'projectm:c']);
    const exported = JSON.stringify(buildFavoritesExport());
    usePresetFavoritesStore.setState({ favoriteKeys: new Set(['projectm:c', 'butterchurn:d']) });
    const r = mergeFavoritesFromText(exported);
    expect(r.added).toBe(2); // a + b are new; c already present
    expect(currentKeys()).toEqual(['butterchurn:b', 'butterchurn:d', 'projectm:a', 'projectm:c']);
  });
});
