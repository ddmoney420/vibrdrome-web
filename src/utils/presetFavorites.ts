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
