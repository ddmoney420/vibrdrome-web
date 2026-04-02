import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../../api/SubsonicClient';
import { usePlayerStore } from '../../stores/playerStore';
import { useUIStore } from '../../stores/uiStore';
import { useMusicFolderStore } from '../../stores/musicFolderStore';
import { fuzzyFilter } from '../../utils/fuzzySearch';
import CoverArt from './CoverArt';
import type { Artist, Album, Song } from '../../types/subsonic';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface QuickAction {
  label: string;
  action: () => void;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Library', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3' },
  { label: 'Artists', path: '/artists', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Albums', path: '/albums', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2' },
  { label: 'Songs', path: '/songs', icon: 'M9 19V6l12-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2z' },
  { label: 'Genres', path: '/genres', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
  { label: 'Playlists', path: '/playlists', icon: 'M4 6h16M4 10h16M4 14h16M4 18h12' },
  { label: 'Favorites', path: '/favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { label: 'Radio', path: '/radio', icon: 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728' },
  { label: 'Search', path: '/search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { label: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35' },
  { label: 'Now Playing', path: '/now-playing', icon: 'M9 19V6l12-3v13' },
  { label: 'Queue', path: '/queue', icon: 'M4 6h16M4 10h16M4 14h16M4 18h12' },
  { label: 'Visualizer', path: '/visualizer', icon: 'M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h2' },
  { label: 'Equalizer', path: '/eq', icon: 'M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3' },
];

interface ResultItem {
  type: 'nav' | 'action' | 'artist' | 'album' | 'song';
  label: string;
  sublabel?: string;
  coverArt?: string;
  onSelect: () => void;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [serverResults, setServerResults] = useState<{ artists: Artist[]; albums: Album[]; songs: Song[] }>({ artists: [], albums: [], songs: [] });
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setServerResults({ artists: [], albums: [], songs: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced server search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setServerResults({ artists: [], albums: [], songs: [] });
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      const folderId = useMusicFolderStore.getState().activeFolderId;
      getSubsonicClient()
        .search3(query, 5, 5, 10, folderId ?? undefined)
        .then((result) => {
          setServerResults({
            artists: result.artist ?? [],
            albums: result.album ?? [],
            songs: result.song ?? [],
          });
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Build results list
  const store = usePlayerStore.getState();
  const quickActions: QuickAction[] = [
    { label: isPlaying() ? 'Pause' : 'Play', action: () => store.togglePlay(), icon: 'M8 5v14l11-7z' },
    { label: 'Next Track', action: () => store.next(), icon: 'M6 18l8.5-6L6 6v12zm8.5-6v6h2V6h-2v6z' },
    { label: 'Previous Track', action: () => store.previous(), icon: 'M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z' },
    { label: 'Toggle Shuffle', action: () => store.toggleShuffle(), icon: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5' },
    { label: 'Cycle Repeat', action: () => store.cycleRepeat(), icon: 'M17 1l4 4-4 4' },
  ];

  function isPlaying() { return usePlayerStore.getState().isPlaying; }

  const results: ResultItem[] = [];

  // Navigation
  const filteredNav = fuzzyFilter(NAV_ITEMS, query, (n) => n.label);
  for (const nav of filteredNav.slice(0, query ? 5 : 6)) {
    results.push({
      type: 'nav',
      label: nav.label,
      onSelect: () => { close(); navigate(nav.path); },
    });
  }

  // Quick actions
  const filteredActions = fuzzyFilter(quickActions, query, (a) => a.label);
  for (const action of filteredActions.slice(0, query ? 3 : 3)) {
    results.push({
      type: 'action',
      label: action.label,
      onSelect: () => { close(); action.action(); },
    });
  }

  // Server results
  for (const artist of serverResults.artists) {
    results.push({
      type: 'artist',
      label: artist.name,
      sublabel: `${artist.albumCount ?? 0} albums`,
      coverArt: artist.coverArt,
      onSelect: () => { close(); navigate(`/artist/${artist.id}`); },
    });
  }

  for (const album of serverResults.albums) {
    results.push({
      type: 'album',
      label: album.name,
      sublabel: album.artist,
      coverArt: album.coverArt,
      onSelect: () => { close(); navigate(`/album/${album.id}`); },
    });
  }

  for (const song of serverResults.songs) {
    results.push({
      type: 'song',
      label: song.title,
      sublabel: `${song.artist ?? 'Unknown'} — ${song.album ?? ''}`,
      coverArt: song.coverArt,
      onSelect: () => { close(); usePlayerStore.getState().playSongs([song], 0); },
    });
  }

  // Keyboard navigation — use ref to avoid stale closure
  const resultsRef = useRef(results);
  const selectedRef = useRef(selectedIndex);
  resultsRef.current = results;
  selectedRef.current = selectedIndex;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, resultsRef.current.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        resultsRef.current[selectedRef.current]?.onSelect();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }, [close]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement;
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const typeLabels: Record<string, string> = { nav: 'Go to', action: 'Action', artist: 'Artist', album: 'Album', song: 'Song' };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60" role="dialog" aria-modal="true" aria-label="Command palette" onClick={close}>
      <div
        className="w-full max-w-lg rounded-xl bg-bg-secondary shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 shrink-0 text-text-muted">
            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or type a command..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
          />
          <kbd className="hidden sm:inline rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 && !searching && query.length >= 2 && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">No results found</p>
          )}

          {searching && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">Searching...</p>
          )}

          {results.map((item, i) => {
            const showSectionLabel = i === 0 || results[i - 1].type !== item.type;

            return (
              <div key={`${item.type}-${item.label}-${i}`}>
                {showSectionLabel && (
                  <div className="px-4 pt-2 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      {typeLabels[item.type] ?? item.type}
                    </span>
                  </div>
                )}
                <button
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                    i === selectedIndex ? 'bg-accent/10 text-accent' : 'text-text-primary hover:bg-bg-tertiary'
                  }`}
                >
                  {item.coverArt ? (
                    <CoverArt coverArt={item.coverArt} size={32} className="rounded shrink-0" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-bg-tertiary text-text-muted">
                      {item.type === 'nav' && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      )}
                      {item.type === 'action' && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    {item.sublabel && (
                      <p className="truncate text-xs text-text-muted">{item.sublabel}</p>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-3 text-[10px] text-text-muted">
          <span><kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-medium">↑↓</kbd> navigate</span>
          <span><kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-medium">↵</kbd> select</span>
          <span><kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-medium">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
