import { describe, it, expect } from 'vitest';
import {
  projectmFavoriteKey,
  butterchurnFavoriteKey,
  favoriteKeyForIndex,
  favoritedIndicesIn,
  randomFavoriteIndex,
  nextFavoriteIndex,
  previousFavoriteIndex,
  orphanedFavorites,
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

describe('previousFavoriteIndex', () => {
  it('returns null for an empty list', () => {
    expect(previousFavoriteIndex([], 0)).toBeNull();
  });
  it('returns the only favorite', () => {
    expect(previousFavoriteIndex([7], 3)).toBe(7);
    expect(previousFavoriteIndex([7], 9)).toBe(7);
  });
  it('returns the previous favorite before current', () => {
    expect(previousFavoriteIndex([2, 5, 9], 9)).toBe(5);
    expect(previousFavoriteIndex([2, 5, 9], 5)).toBe(2);
  });
  it('wraps to the last favorite when current is before/at the first favorite', () => {
    expect(previousFavoriteIndex([2, 5, 9], 2)).toBe(9); // current == first fav → wrap to last
    expect(previousFavoriteIndex([2, 5, 9], 0)).toBe(9); // before all favs → wrap to last
  });
  it('handles current not being a favorite', () => {
    expect(previousFavoriteIndex([2, 5, 9], 7)).toBe(5); // largest fav < 7
    expect(previousFavoriteIndex([2, 5, 9], 12)).toBe(9); // past the end → last
  });
  it('does not mutate the input', () => {
    const favs = [2, 5, 9];
    const copy = [...favs];
    previousFavoriteIndex(favs, 5);
    expect(favs).toEqual(copy);
  });
});

describe('favoritedIndicesIn ascending order', () => {
  it('produces indices in ascending active-list order', () => {
    const names = ['a', 'b', 'c', 'd', 'e'];
    const keyForIndex = (i: number) => `k:${i}`;
    const favs = new Set(['k:4', 'k:1', 'k:3']); // out-of-order set
    expect(favoritedIndicesIn(names, favs, keyForIndex)).toEqual([1, 3, 4]); // ascending
  });
});

describe('orphanedFavorites', () => {
  const pmPaths = new Set(['packA/cool.milk', 'packB/warm.milk']);
  const bcNames = new Set(['Flexi - mom', 'Geiss - Cosmic']);

  it('does NOT flag a valid projectM key when the projectM corpus is loaded', () => {
    expect(orphanedFavorites(['projectm:packA/cool.milk'], { projectmPaths: pmPaths })).toEqual([]);
  });

  it('detects an invalid projectM key when the projectM corpus is loaded', () => {
    expect(orphanedFavorites(['projectm:packZ/gone.milk'], { projectmPaths: pmPaths })).toEqual([
      'projectm:packZ/gone.milk',
    ]);
  });

  it('does NOT evaluate projectM keys when projectmPaths is absent (corpus not loaded)', () => {
    expect(orphanedFavorites(['projectm:packZ/gone.milk'], {})).toEqual([]);
    expect(orphanedFavorites(['projectm:packZ/gone.milk'], { butterchurnNames: bcNames })).toEqual([]);
  });

  it('does NOT evaluate projectM keys when projectmPaths is empty (load race)', () => {
    expect(orphanedFavorites(['projectm:packZ/gone.milk'], { projectmPaths: new Set() })).toEqual([]);
  });

  it('does NOT flag a valid butterchurn key when the butterchurn corpus is loaded', () => {
    expect(orphanedFavorites(['butterchurn:Flexi - mom'], { butterchurnNames: bcNames })).toEqual([]);
  });

  it('detects an invalid butterchurn key when the butterchurn corpus is loaded', () => {
    expect(orphanedFavorites(['butterchurn:Deleted - preset'], { butterchurnNames: bcNames })).toEqual([
      'butterchurn:Deleted - preset',
    ]);
  });

  it('does NOT evaluate butterchurn keys when butterchurnNames is absent (corpus not loaded)', () => {
    expect(orphanedFavorites(['butterchurn:Deleted - preset'], {})).toEqual([]);
    expect(orphanedFavorites(['butterchurn:Deleted - preset'], { projectmPaths: pmPaths })).toEqual([]);
  });

  it('does NOT evaluate butterchurn keys when butterchurnNames is empty (load race)', () => {
    expect(orphanedFavorites(['butterchurn:Deleted - preset'], { butterchurnNames: new Set() })).toEqual([]);
  });

  it('with mixed favorites, only flags keys for engines whose corpus is loaded', () => {
    // projectM corpus loaded, butterchurn corpus NOT loaded.
    const favs = [
      'projectm:packA/cool.milk', // valid pm → not flagged
      'projectm:packZ/gone.milk', // invalid pm → flagged
      'butterchurn:Flexi - mom', // bc corpus absent → not evaluable
      'butterchurn:Deleted - preset', // bc corpus absent → not evaluable
    ];
    expect(orphanedFavorites(favs, { projectmPaths: pmPaths })).toEqual(['projectm:packZ/gone.milk']);
  });

  it('never flags inactive/absent-engine favorites even when they would be invalid', () => {
    // A butterchurn-only session: projectM corpus absent. The (invalid-looking)
    // projectM key must be left untouched — we cannot see its corpus.
    expect(
      orphanedFavorites(['projectm:packZ/gone.milk', 'butterchurn:Flexi - mom'], {
        butterchurnNames: bcNames,
      }),
    ).toEqual([]);
  });

  it('does not mutate its inputs', () => {
    const favs = ['projectm:packZ/gone.milk', 'butterchurn:Flexi - mom'];
    const favsCopy = [...favs];
    const pm = new Set(pmPaths);
    const bc = new Set(bcNames);
    orphanedFavorites(favs, { projectmPaths: pm, butterchurnNames: bc });
    expect(favs).toEqual(favsCopy);
    expect([...pm]).toEqual([...pmPaths]);
    expect([...bc]).toEqual([...bcNames]);
  });

  it('never flags unknown-prefix keys', () => {
    expect(
      orphanedFavorites(['weird:thing', 'no-prefix', 'projectm:packZ/gone.milk'], {
        projectmPaths: pmPaths,
        butterchurnNames: bcNames,
      }),
    ).toEqual(['projectm:packZ/gone.milk']); // only the real pm orphan, never the unknowns
  });

  it('returns an empty array for an empty favorite set', () => {
    expect(orphanedFavorites([], { projectmPaths: pmPaths, butterchurnNames: bcNames })).toEqual([]);
    expect(orphanedFavorites(new Set<string>(), { projectmPaths: pmPaths })).toEqual([]);
  });
});
