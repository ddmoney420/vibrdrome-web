// Visualizer-scoped preset search overlay. Filters the active engine's preset
// name list and, on select, jumps by ORIGINAL index — the caller wires that to
// the existing `setActiveIndex` preset-switch path, so all transition behaviour
// (hard-cut / live crossfade / reduced-motion / butterchurn) is preserved with
// no new rendering logic. Search is name-only (no preset text is loaded).
//
// Mounted only while open (the parent conditionally renders it), so it starts
// with fresh state and an autofocused input each time.
import { useEffect, useMemo, useRef, useState } from 'react';
import { fuzzyFilter } from '../../utils/fuzzySearch';

const MAX_RESULTS = 50;

interface PresetSearchProps {
  /** Active engine's selectable preset names (projectM or butterchurn). */
  names: string[];
  /** Called with the ORIGINAL index into `names` for the chosen preset. */
  onSelect: (index: number) => void;
  onClose: () => void;
}

export default function PresetSearch({ names, onSelect, onClose }: PresetSearchProps) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Pair each name with its original index so a fuzzy-sorted result still maps
  // back to the correct preset index.
  const items = useMemo(() => names.map((name, index) => ({ name, index })), [names]);
  const matches = useMemo(() => fuzzyFilter(items, query, (i) => i.name), [items, query]);
  const shown = matches.slice(0, MAX_RESULTS);
  const overflow = matches.length - shown.length;

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
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          placeholder={`Search ${names.length} presets…`}
          aria-label="Search presets"
          className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
        />
        <ul
          ref={listRef}
          className="max-h-80 overflow-y-auto border-t border-white/10"
          role="listbox"
          aria-label="Preset results"
        >
          {shown.length === 0 ? (
            <li className="px-4 py-3 text-sm text-white/50">No matching presets</li>
          ) : (
            shown.map((m, i) => (
              <li
                key={m.index}
                role="option"
                aria-selected={i === highlight}
                onClick={() => choose(i)}
                onMouseMove={() => setHighlight(i)}
                className={`cursor-pointer truncate px-4 py-2 text-sm ${
                  i === highlight ? 'bg-white/15 text-white' : 'text-white/80'
                }`}
              >
                {m.name}
              </li>
            ))
          )}
        </ul>
        {overflow > 0 && (
          <div className="border-t border-white/10 px-4 py-2 text-xs text-white/50">
            Showing {shown.length} of {matches.length} — refine your search to narrow results.
          </div>
        )}
      </div>
    </div>
  );
}
