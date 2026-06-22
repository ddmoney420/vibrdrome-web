import { describe, it, expect } from 'vitest';
import {
  projectmFavoriteKey,
  butterchurnFavoriteKey,
  favoriteKeyForIndex,
} from './presetFavorites';
import type { PresetIndexEntry } from '../types/presets';

const entry = (name: string, path: string): PresetIndexEntry => ({
  name,
  path,
  category: 'Test',
  shard: 'Test.ndjson.gz',
});

describe('presetFavorites key helper', () => {
  it('projectM favorite key uses the path, engine-prefixed', () => {
    expect(projectmFavoriteKey('pack/sub/cool.milk')).toBe('projectm:pack/sub/cool.milk');
  });

  it('butterchurn favorite key uses the engine-prefixed name', () => {
    expect(butterchurnFavoriteKey('Flexi - mom')).toBe('butterchurn:Flexi - mom');
  });

  it('duplicate projectM names with different paths produce DIFFERENT keys', () => {
    const a = entry('Cool', 'packA/cool.milk');
    const b = entry('Cool', 'packB/cool.milk');
    const ka = favoriteKeyForIndex('projectm', 0, [a], ['Cool']);
    const kb = favoriteKeyForIndex('projectm', 0, [b], ['Cool']);
    expect(ka).not.toBe(kb);
    expect(ka).toBe('projectm:packA/cool.milk');
    expect(kb).toBe('projectm:packB/cool.milk');
  });

  it('resolves by path for projectM and by name for butterchurn', () => {
    const entries = [entry('One', 'p/one.milk'), entry('Two', 'p/two.milk')];
    expect(favoriteKeyForIndex('projectm', 1, entries, ['One', 'Two'])).toBe('projectm:p/two.milk');
    expect(favoriteKeyForIndex('butterchurn', 1, [], ['One', 'Two'])).toBe('butterchurn:Two');
  });

  it('returns null for an out-of-range index or no engine', () => {
    expect(favoriteKeyForIndex('projectm', 5, [], [])).toBeNull();
    expect(favoriteKeyForIndex('butterchurn', 5, [], [])).toBeNull();
    expect(favoriteKeyForIndex(null, 0, [], ['x'])).toBeNull();
  });
});
