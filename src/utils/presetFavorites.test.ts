import { describe, it, expect } from 'vitest';
import {
  projectmFavoriteKey,
  butterchurnFavoriteKey,
  favoriteKeyForIndex,
  favoritedIndicesIn,
  randomFavoriteIndex,
  nextFavoriteIndex,
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

describe('favoritedIndicesIn', () => {
  const names = ['A', 'B', 'C', 'D'];

  it('resolves only the active-engine favorited indices (projectM, by path key)', () => {
    const entries = names.map((n, i) => entry(n, `p/${i}.milk`));
    const keyForIndex = (i: number) => favoriteKeyForIndex('projectm', i, entries, names);
    const favs = new Set(['projectm:p/1.milk', 'projectm:p/3.milk']);
    expect(favoritedIndicesIn(names, favs, keyForIndex)).toEqual([1, 3]);
  });

  it('resolves butterchurn favorites by name key', () => {
    const keyForIndex = (i: number) => favoriteKeyForIndex('butterchurn', i, [], names);
    const favs = new Set(['butterchurn:C']);
    expect(favoritedIndicesIn(names, favs, keyForIndex)).toEqual([2]);
  });

  it('skips unresolvable keys and non-favorites', () => {
    const keyForIndex = (i: number) => (i === 0 ? null : `k:${i}`);
    expect(favoritedIndicesIn(names, new Set(['k:2']), keyForIndex)).toEqual([2]);
  });
});

describe('randomFavoriteIndex', () => {
  it('returns null for an empty list', () => {
    expect(randomFavoriteIndex([], 0)).toBeNull();
  });
  it('returns the only favorite (even if it is the current one)', () => {
    expect(randomFavoriteIndex([5], 5)).toBe(5);
    expect(randomFavoriteIndex([5], 0)).toBe(5);
  });
  it('avoids the current index when multiple favorites exist', () => {
    // rng=0 → first of the current-excluded pool; current=2 excluded → [1,3,4][0]=1
    expect(randomFavoriteIndex([1, 2, 3, 4], 2, () => 0)).toBe(1);
    // rng→last of the excluded pool
    expect(randomFavoriteIndex([1, 2, 3, 4], 2, () => 0.999)).toBe(4);
  });
  it('is deterministic with an injected rng and never returns current', () => {
    for (let r = 0; r < 1; r += 0.1) {
      expect(randomFavoriteIndex([0, 1, 2], 1, () => r)).not.toBe(1);
    }
  });
});

describe('nextFavoriteIndex', () => {
  it('returns null for an empty list', () => {
    expect(nextFavoriteIndex([], 0)).toBeNull();
  });
  it('returns the only favorite', () => {
    expect(nextFavoriteIndex([7], 3)).toBe(7);
  });
  it('returns the next favorite after current, wrapping', () => {
    expect(nextFavoriteIndex([2, 5, 9], 2)).toBe(5);
    expect(nextFavoriteIndex([2, 5, 9], 5)).toBe(9);
    expect(nextFavoriteIndex([2, 5, 9], 9)).toBe(2); // wraps
    expect(nextFavoriteIndex([2, 5, 9], 6)).toBe(9); // current not itself a favorite
    expect(nextFavoriteIndex([2, 5, 9], 12)).toBe(2); // past the end → wrap
  });
});
