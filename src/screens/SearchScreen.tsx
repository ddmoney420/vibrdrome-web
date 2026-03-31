import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { useMusicFolderStore } from '../stores/musicFolderStore';
import Header from '../components/common/Header';
import AlbumCard from '../components/common/AlbumCard';
import SongRow from '../components/common/SongRow';
import CoverArt from '../components/common/CoverArt';
import { usePlayerStore } from '../stores/playerStore';
import type { Artist, Album, Song } from '../types/subsonic';

export default function SearchScreen() {
  const navigate = useNavigate();
  const playSongs = usePlayerStore((s) => s.playSongs);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<{
    artists: Artist[];
    albums: Album[];
    songs: Song[];
    loading: boolean;
    searched: boolean;
    forQuery: string;
  }>({ artists: [], albums: [], songs: [], loading: false, searched: false, forQuery: '' });

  // Derive — if debounced query changed, reset or start loading
  if (results.forQuery !== debouncedQuery) {
    if (!debouncedQuery) {
      setResults({ artists: [], albums: [], songs: [], loading: false, searched: false, forQuery: '' });
    } else {
      setResults((s) => ({ ...s, loading: true, forQuery: debouncedQuery }));
    }
  }

  const { artists, albums, songs, loading, searched } = results;

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery) return;

    let cancelled = false;

    getSubsonicClient()
      .search3(debouncedQuery, 5, 5, 50, useMusicFolderStore.getState().activeFolderId ?? undefined)
      .then((result) => {
        if (cancelled) return;
        setResults({
          artists: result.artist ?? [],
          albums: result.album ?? [],
          songs: result.song ?? [],
          loading: false,
          searched: true,
          forQuery: debouncedQuery,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setResults({
            artists: [], albums: [], songs: [],
            loading: false, searched: true, forQuery: debouncedQuery,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handlePlaySong = useCallback(
    (index: number) => {
      playSongs(songs, index);
    },
    [songs, playSongs],
  );

  const hasResults = artists.length > 0 || albums.length > 0 || songs.length > 0;

  return (
    <div className="pb-20 md:pb-4">
      <Header title="Search" showBack />

      {/* Search input */}
      <div className="px-3 pb-4 md:px-4">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search artists, albums, songs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-secondary py-3 pl-10 pr-4 text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bg-tertiary border-t-accent" />
        </div>
      )}

      {/* No results */}
      {!loading && searched && !hasResults && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-text-muted">No results found</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasResults && (
        <div className="space-y-6">
          {/* Artists */}
          {artists.length > 0 && (
            <section>
              <h2 className="mb-2 px-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Artists
              </h2>
              <div className="flex flex-col">
                {artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="flex items-center gap-3 px-4 py-3 min-h-[48px] transition-colors hover:bg-bg-tertiary"
                  >
                    <CoverArt coverArt={artist.coverArt} size={40} className="rounded-full" />
                    <span className="truncate text-sm font-medium text-text-primary">
                      {artist.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {albums.length > 0 && (
            <section>
              <h2 className="mb-2 px-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Albums
              </h2>
              <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {albums.map((album) => (
                  <div key={album.id} className="shrink-0">
                    <AlbumCard album={album} size="small" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Songs */}
          {songs.length > 0 && (
            <section>
              <h2 className="mb-2 px-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Songs
              </h2>
              <div className="flex flex-col">
                {songs.map((song, index) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={index}
                    showAlbum
                    onPlay={() => handlePlaySong(index)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
