import { useState, useEffect, useCallback, useRef } from 'react';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { useMusicFolderStore } from '../stores/musicFolderStore';
import { useMultiSelect } from '../hooks/useMultiSelect';
import type { Song, Genre } from '../types/subsonic';
import { Header, SongRow, LoadingSpinner } from '../components/common';
import BatchActionBar from '../components/common/BatchActionBar';

const PAGE_SIZE = 100;

export default function SongsScreen() {
  const playSongs = usePlayerStore((s) => s.playSongs);
  const activeFolderId = useMusicFolderStore((s) => s.activeFolderId);

  const [songs, setSongs] = useState<Song[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [genres, setGenres] = useState<Genre[]>([]);
  const [filterGenre, setFilterGenre] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterArtist, setFilterArtist] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Load genres for filter
  useEffect(() => {
    getSubsonicClient().getGenres().then((g) => {
      setGenres(g.sort((a, b) => a.value.localeCompare(b.value)));
    }).catch(() => { /* silently fail */ });
  }, []);

  // Load songs
  const loadSongs = useCallback(async (append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const client = getSubsonicClient();
      const data = await client.getRandomSongs(PAGE_SIZE, filterGenre || undefined, activeFolderId ?? undefined);

      if (append) {
        setAllSongs((prev) => {
          const ids = new Set(prev.map((s) => s.id));
          const newSongs = data.filter((s) => !ids.has(s.id));
          return [...prev, ...newSongs];
        });
      } else {
        setAllSongs(data);
      }

      if (data.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error('Failed to load songs:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFolderId, filterGenre]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when load dependencies change
    setHasMore(true);
    loadSongs(false);
  }, [loadSongs]);

  // Apply client-side filters
  useEffect(() => {
    let filtered = allSongs;

    if (filterArtist) {
      const q = filterArtist.toLowerCase();
      filtered = filtered.filter((s) => s.artist?.toLowerCase().includes(q));
    }

    if (filterYear) {
      const y = Number(filterYear);
      if (!isNaN(y)) filtered = filtered.filter((s) => s.year === y);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived filtering
    setSongs(filtered);
  }, [allSongs, filterArtist, filterYear]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadSongs(true);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadSongs]);

  const { selectionMode, selectedIds, selectedCount, toggle, clearAll, enterSelectionMode, selectAll, isSelected } = useMultiSelect<string>();

  const handleShuffleAll = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playSongs(shuffled, 0);
  };

  const handlePlayFrom = (index: number) => {
    playSongs(songs, index);
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title={`Songs${songs.length > 0 ? ` (${songs.length.toLocaleString()})` : ''}`} showBack />

      {/* Action buttons + filter toggle */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <button
          onClick={handleShuffleAll}
          disabled={loading || songs.length === 0}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
          Shuffle All
        </button>

        <button
          onClick={() => loadSongs(true)}
          disabled={loading || loadingMore}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
        >
          Load More
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            showFilters || filterGenre || filterArtist || filterYear
              ? 'border-accent text-accent'
              : 'border-border text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
          Filters
        </button>

        <button
          onClick={() => {
            if (selectionMode) clearAll();
            else enterSelectionMode();
          }}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            selectionMode ? 'border-accent text-accent' : 'border-border text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          {selectionMode ? 'Cancel' : 'Select'}
        </button>

        {selectionMode && songs.length > 0 && (
          <button
            onClick={() => selectAll(songs.map((s) => s.id))}
            className="text-xs text-accent hover:underline"
          >
            Select All
          </button>
        )}
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          <input
            type="text"
            value={filterArtist}
            onChange={(e) => setFilterArtist(e.target.value)}
            placeholder="Filter by artist..."
            className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent"
          />
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.value} value={g.value}>{g.value}</option>
            ))}
          </select>
          <input
            type="number"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            placeholder="Year"
            min={1900}
            max={2099}
            className="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent"
          />
          {(filterGenre || filterArtist || filterYear) && (
            <button
              onClick={() => { setFilterGenre(''); setFilterArtist(''); setFilterYear(''); }}
              className="text-xs text-accent hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="mx-auto max-w-5xl px-1">
            {songs.map((song, i) => (
              <div key={`${song.id}-${i}`} className="flex items-center gap-0">
                {selectionMode && (
                  <button
                    onClick={() => toggle(song.id)}
                    className="flex h-10 w-8 shrink-0 items-center justify-center"
                  >
                    <div className={`h-4 w-4 rounded border-2 transition-colors ${
                      isSelected(song.id) ? 'border-accent bg-accent' : 'border-text-muted'
                    }`}>
                      {isSelected(song.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-3 w-3">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                )}
              <SongRow
                song={song}
                index={i}
                showAlbum
                onPlay={() => selectionMode ? toggle(song.id) : handlePlayFrom(i)}
              />
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-4">
                {loadingMore && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-bg-tertiary border-t-accent" />
                )}
              </div>
            )}

            {songs.length === 0 && !loading && (
              <p className="py-8 text-center text-text-muted">No songs found</p>
            )}
          </div>
        </div>
      )}

      {selectionMode && (
        <BatchActionBar
          selectedCount={selectedCount}
          songs={songs}
          selectedIds={selectedIds}
          onClear={clearAll}
        />
      )}
    </div>
  );
}
