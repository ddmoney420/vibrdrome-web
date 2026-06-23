// Visualizer-scoped preset search overlay. Filters the active engine's preset
// name list and, on select, jumps by ORIGINAL index — the caller wires that to
// the existing `setActiveIndex` preset-switch path, so all transition behaviour
// (hard-cut / live crossfade / reduced-motion / butterchurn) is preserved with
// no new rendering logic. Search is name-only (no preset text is loaded).
//
// Rows can be favorited (per-engine, persisted by the caller's store) and an
// optional Favorites filter narrows the list to favorited presets.
//
// Mounted only while open (the parent conditionally renders it), so it starts
// with fresh state and an autofocused input each time.
import { useEffect, useMemo, useRef, useState } from 'react';
import { fuzzyFilter } from '../../utils/fuzzySearch';

const MAX_RESULTS = 50;

interface PresetSearchProps {
  /** Active engine's selectable preset names (projectM or butterchurn). */
  names: string[];
  /** Currently-favorited keys (engine-prefixed); used for star state + filter. */
  favoriteKeys: Set<string>;
  /** Resolve the favorite key for an active-list index (null if unresolvable). */
  favoriteKeyForIndex: (index: number) => string | null;
  /** Toggle the favorite for a given key. */
  onToggleFavorite: (key: string) => void;
  /** Called with the ORIGINAL index into `names` for the chosen preset. */
  onSelect: (index: number) => void;
  onClose: () => void;
  /** Count of active-engine favorites that no longer resolve to a preset. */
  orphanCount?: number;
  /** Active engine label for the cleanup confirmation copy (e.g. 'projectM'). */
  engineLabel?: string;
  /** Remove the active-engine orphans (caller recomputes + bulk-removes). */
  onCleanupOrphans?: () => void;
}

export default function PresetSearch({
  names,
  favoriteKeys,
  favoriteKeyForIndex,
  onToggleFavorite,
  onSelect,
  onClose,
  orphanCount = 0,
  engineLabel,
  onCleanupOrphans,
}: PresetSearchProps) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [confirmingCleanup, setConfirmingCleanup] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Pair each name with its original index so a fuzzy-sorted result still maps
  // back to the correct preset index.
  const items = useMemo(() => names.map((name, index) => ({ name, index })), [names]);
  // Favorites filter narrows the candidate list *before* text filtering.
  const base = useMemo(
    () =>
      favoritesOnly
        ? items.filter((it) => {
            const k = favoriteKeyForIndex(it.index);
            return k != null && favoriteKeys.has(k);
          })
        : items,
    [items, favoritesOnly, favoriteKeys, favoriteKeyForIndex],
  );
  const matches = useMemo(() => fuzzyFilter(base, query, (i) => i.name), [base, query]);
  const shown = matches.slice(0, MAX_RESULTS);
  const overflow = matches.length - shown.length;

  const isFav = (index: number) => {
    const k = favoriteKeyForIndex(index);
    return k != null && favoriteKeys.has(k);
  };

  // Autofocus the input on mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  // Keep the highlighted row scrolled into view (no state change here).
  useEffect(() => {
    (listRef.current?.children[highlight] as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' });
  }, [highlight]);

  const choose = (i: number) => {
    const m = shown[i];
    if (m) onSelect(m.index);
  };

  const toggleRowFavorite = (index: number) => {
    const k = favoriteKeyForIndex(index);
    if (k) onToggleFavorite(k);
  };

  // Handle keys at the overlay level and stop propagation so the visualizer's
  // global shortcuts never fire while searching. Printable keys fall through to
  // the input (only navigation keys are intercepted).
  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, shown.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        choose(highlight);
        break;
      case 'Tab':
        // Trap focus inside the overlay.
        e.preventDefault();
        inputRef.current?.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center bg-black/60 p-4 pt-16"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-white/10 bg-bg-secondary shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Search presets"
      >
        <div className="flex items-center border-b border-white/10">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            placeholder={`Search ${names.length} presets…`}
            aria-label="Search presets"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={() => {
              setFavoritesOnly((v) => !v);
              setHighlight(0);
            }}
            aria-pressed={favoritesOnly}
            aria-label="Show favorites only"
            title="Show favorites only"
            className={`mr-2 shrink-0 rounded-full px-3 py-1 text-xs ${
              favoritesOnly ? 'bg-accent/30 text-white' : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            ★ Favorites
          </button>
        </div>
        <ul
          ref={listRef}
          className="max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Preset results"
        >
          {shown.length === 0 ? (
            <li className="px-4 py-3 text-sm text-white/50">
              {favoritesOnly ? 'No favorited presets yet' : 'No matching presets'}
            </li>
          ) : (
            shown.map((m, i) => {
              const fav = isFav(m.index);
              return (
                <li
                  key={m.index}
                  role="option"
                  aria-selected={i === highlight}
                  onClick={() => choose(i)}
                  onMouseMove={() => setHighlight(i)}
                  className={`flex cursor-pointer items-center gap-2 px-4 py-2 text-sm ${
                    i === highlight ? 'bg-white/15 text-white' : 'text-white/80'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowFavorite(m.index);
                    }}
                    aria-label={fav ? 'Unfavorite preset' : 'Favorite preset'}
                    aria-pressed={fav}
                    title={fav ? 'Unfavorite preset' : 'Favorite preset'}
                    className={`shrink-0 rounded px-1 text-base leading-none ${
                      fav ? 'text-yellow-300' : 'text-white/30 hover:text-white/70'
                    }`}
                  >
                    {fav ? '★' : '☆'}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        {overflow > 0 && (
          <div className="border-t border-white/10 px-4 py-2 text-xs text-white/50">
            Showing {shown.length} of {matches.length} — refine your search to narrow results.
          </div>
        )}
        {orphanCount > 0 && (
          <div className="border-t border-white/10 px-4 py-2 text-xs">
            {!confirmingCleanup ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/50">
                  {orphanCount === 1 ? '1 unavailable favorite' : `${orphanCount} unavailable favorites`}
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmingCleanup(true)}
                  className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-white/70 hover:text-white"
                >
                  Clean up unavailable
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-white/70">
                  {`Remove ${orphanCount} unavailable ${engineLabel ? `${engineLabel} ` : ''}favorite${
                    orphanCount === 1 ? '' : 's'
                  } from this device? This only removes favorites that no longer match the loaded preset list.`}
                </span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingCleanup(false)}
                    className="rounded-full bg-white/10 px-3 py-1 text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCleanupOrphans?.();
                      setConfirmingCleanup(false);
                    }}
                    className="rounded-full bg-red-500/30 px-3 py-1 text-white hover:bg-red-500/40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
