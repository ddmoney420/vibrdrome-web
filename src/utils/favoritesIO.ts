// Favorites-only export / import for moving visualizer favorites between
// devices WITHOUT a backend. Import is a lossless UNION merge — it adds the
// file's keys to the local set and never removes or replaces existing ones.
//
// The payload deliberately contains ONLY the favorite keys (which are preset
// paths/names — no PII): no server URL, username, password, or other settings.
import { usePresetFavoritesStore } from '../stores/presetFavoritesStore';

/** On-disk export shape (the inner `favorites` blob matches the store's). */
export interface FavoritesExport {
  version: 1;
  exportedAt: string;
  favorites: { v: 1; keys: string[] };
}

export interface FavoritesImportResult {
  added: number;
  alreadyPresent: number;
  ignoredInvalid: number;
}

/** Build the export payload from the current favorites (no credentials). */
export function buildFavoritesExport(now: Date = new Date()): FavoritesExport {
  const keys = [...usePresetFavoritesStore.getState().favoriteKeys];
  return { version: 1, exportedAt: now.toISOString(), favorites: { v: 1, keys } };
}

/** Download the current visualizer favorites as a versioned JSON file. */
export function exportFavorites(now: Date = new Date()): void {
  const data = buildFavoritesExport(now);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vibrdrome-visualizer-favorites-${now.toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse a favorites-export string and UNION its keys into the store. Validation
 * throws BEFORE any mutation, so a malformed/unsupported file leaves local
 * favorites unchanged. Non-string keys are ignored; duplicates are idempotent.
 */
export function mergeFavoritesFromText(text: string): FavoritesImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid favorites file');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid favorites file');
  const obj = parsed as { version?: unknown; favorites?: unknown };
  if (obj.version !== 1) throw new Error('Unsupported favorites file version');
  const fav = obj.favorites as { keys?: unknown } | undefined;
  if (!fav || typeof fav !== 'object' || !Array.isArray(fav.keys)) {
    throw new Error('Invalid favorites file');
  }

  const rawKeys = fav.keys as unknown[];
  const validKeys = rawKeys.filter((k): k is string => typeof k === 'string');
  const ignoredInvalid = rawKeys.length - validKeys.length;

  const uniqueKeys = [...new Set(validKeys)];
  const existing = usePresetFavoritesStore.getState().favoriteKeys;
  const toAdd = uniqueKeys.filter((k) => !existing.has(k));
  const alreadyPresent = uniqueKeys.length - toAdd.length;

  // Union merge (no-op when toAdd is empty). Never removes existing favorites.
  usePresetFavoritesStore.getState().addFavorites(toAdd);

  return { added: toAdd.length, alreadyPresent, ignoredInvalid };
}

/** Read a favorites-export File and union-merge it into the store. */
export async function importFavoritesMerge(file: File): Promise<FavoritesImportResult> {
  const text = await file.text();
  return mergeFavoritesFromText(text);
}
