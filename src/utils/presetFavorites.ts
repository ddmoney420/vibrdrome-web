// Stable, engine-prefixed identity for a "favorited" visualizer preset.
//
// projectM preset *names* are NOT unique (the corpus has many duplicates), so
// projectM favorites are keyed on the manifest `path` (the documented stable
// unique key). butterchurn has no path — its preset names are the only stable
// identity, so butterchurn favorites are keyed on `name`. The engine prefix
// keeps the two corpora from colliding.
import type { PresetIndexEntry } from '../types/presets';

export type MilkdropEngine = 'projectm' | 'butterchurn';

/** projectM favorite key from a manifest path. */
export function projectmFavoriteKey(path: string): string {
  return `projectm:${path}`;
}

/** butterchurn favorite key from a preset name. */
export function butterchurnFavoriteKey(name: string): string {
  return `butterchurn:${name}`;
}

/**
 * Resolve the favorite key for an active-list index, per engine.
 * - projectM: by `projectmEntries[index].path`
 * - butterchurn: by `names[index]`
 * Returns `null` if the index can't be resolved (e.g. list not ready).
 */
export function favoriteKeyForIndex(
  engine: MilkdropEngine | null,
  index: number,
  projectmEntries: PresetIndexEntry[],
  names: string[],
): string | null {
  if (engine === 'projectm') {
    const entry = projectmEntries[index];
    return entry ? projectmFavoriteKey(entry.path) : null;
  }
  if (engine === 'butterchurn') {
    const name = names[index];
    return name != null ? butterchurnFavoriteKey(name) : null;
  }
  return null;
}

/**
 * Active-engine list indices whose favorite key is currently favorited, in
 * list order. `keyForIndex` resolves a row's key (null/unresolvable → skipped).
 */
export function favoritedIndicesIn(
  names: string[],
  favoriteKeys: Set<string>,
  keyForIndex: (index: number) => string | null,
): number[] {
  const out: number[] = [];
  for (let i = 0; i < names.length; i++) {
    const key = keyForIndex(i);
    if (key != null && favoriteKeys.has(key)) out.push(i);
  }
  return out;
}

/**
 * Pick a favorited index at random, avoiding `currentIndex` when possible.
 * - empty list → `null`
 * - single favorite → that index (even if it is the current one)
 * - multiple → a random favorite, never `currentIndex`
 * Uses a bounded selection (no unbounded retry loop). `rng` defaults to
 * `Math.random` and is injectable for deterministic tests.
 */
export function randomFavoriteIndex(
  favIndices: number[],
  currentIndex: number,
  rng: () => number = Math.random,
): number | null {
  if (favIndices.length === 0) return null;
  if (favIndices.length === 1) return favIndices[0];
  // Choose from the favorites excluding the current one, so we never retry.
  const candidates = favIndices.filter((i) => i !== currentIndex);
  const pool = candidates.length > 0 ? candidates : favIndices;
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * The next favorited index after `currentIndex` in active-list order, wrapping.
 * - empty list → `null`
 * - single favorite → that index
 * - otherwise → the first favorite with index > current, else the first favorite
 *   (so it advances even when `currentIndex` isn't itself a favorite).
 */
export function nextFavoriteIndex(favIndices: number[], currentIndex: number): number | null {
  if (favIndices.length === 0) return null;
  if (favIndices.length === 1) return favIndices[0];
  for (const i of favIndices) {
    if (i > currentIndex) return i;
  }
  return favIndices[0];
}

/**
 * The previous favorited index before `currentIndex` in active-list order,
 * wrapping. Mirror of {@link nextFavoriteIndex}.
 * - empty list → `null`
 * - single favorite → that index
 * - otherwise → the largest favorite with index < current, else wrap to the last
 *   favorite (so it moves even when `currentIndex` isn't itself a favorite).
 * Assumes `favIndices` is in ascending order; does not mutate it.
 */
export function previousFavoriteIndex(favIndices: number[], currentIndex: number): number | null {
  if (favIndices.length === 0) return null;
  if (favIndices.length === 1) return favIndices[0];
  for (let k = favIndices.length - 1; k >= 0; k--) {
    if (favIndices[k] < currentIndex) return favIndices[k];
  }
  return favIndices[favIndices.length - 1];
}

const PROJECTM_PREFIX = 'projectm:';
const BUTTERCHURN_PREFIX = 'butterchurn:';

/**
 * Identify favorite keys that are *positively* orphaned — i.e. their preset is
 * known to be absent from a **loaded** corpus for that key's engine.
 *
 * Safety is the entire point. A key is flagged ONLY when its engine's corpus is
 * actually present and non-empty. If a corpus is absent or empty (e.g. the
 * butterchurn presets aren't loaded because projectM/WebGPU is active, or the
 * manifest hasn't loaded yet), that engine's keys are treated as "not
 * evaluable" and are NEVER flagged — so callers can't wipe the inactive
 * engine's favorites or delete during a load race. Unknown prefixes are never
 * flagged. Pure: does not mutate input, touch storage, or call store actions —
 * it only reads the corpora explicitly passed in.
 *
 * - projectM keys (`projectm:${path}`): orphaned iff `projectmPaths` is provided
 *   and non-empty and does not contain the stripped path.
 * - butterchurn keys (`butterchurn:${name}`): orphaned iff `butterchurnNames` is
 *   provided and non-empty and does not contain the stripped name.
 */
export function orphanedFavorites(
  favoriteKeys: Iterable<string>,
  corpora: { projectmPaths?: Set<string>; butterchurnNames?: Set<string> },
): string[] {
  const { projectmPaths, butterchurnNames } = corpora;
  const orphans: string[] = [];
  for (const key of favoriteKeys) {
    if (key.startsWith(PROJECTM_PREFIX)) {
      // Evaluate only against a loaded (present + non-empty) projectM corpus.
      if (projectmPaths && projectmPaths.size > 0 && !projectmPaths.has(key.slice(PROJECTM_PREFIX.length))) {
        orphans.push(key);
      }
    } else if (key.startsWith(BUTTERCHURN_PREFIX)) {
      if (butterchurnNames && butterchurnNames.size > 0 && !butterchurnNames.has(key.slice(BUTTERCHURN_PREFIX.length))) {
        orphans.push(key);
      }
    }
    // Unknown prefix → never flagged (no accidental deletion semantics).
  }
  return orphans;
}
