import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { useMusicFolderStore } from '../stores/musicFolderStore';
import type { ArtistIndex, Genre, Song } from '../types/subsonic';
import { Header, CoverArt, LoadingSpinner } from '../components/common';

export default function ArtistsScreen() {
  const navigate = useNavigate();
  const playSongs = usePlayerStore((s) => s.playSongs);
  const [indexes, setIndexes] = useState<ArtistIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const activeFolderId = useMusicFolderStore((s) => s.activeFolderId);

  const [filterText, setFilterText] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [allArtistGenres, setAllArtistGenres] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const [data, genreData] = await Promise.all([
          client.getArtists(activeFolderId ?? undefined),
          client.getGenres(),
        ]);
        setIndexes(data);
        setGenres(genreData.sort((a, b) => a.value.localeCompare(b.value)));
      } catch (err) {
        console.error('Failed to load artists:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeFolderId]);

  // Build artist→genres map when genre filter is first used
  useEffect(() => {
    if (!filterGenre || allArtistGenres.size > 0) return;

    // Fetch albums to map artists to genres
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const albums = await client.getAlbumList2('alphabeticalByArtist' as 'newest', 500, undefined, undefined, undefined, undefined, activeFolderId ?? undefined);
        const map = new Map<string, Set<string>>();
        for (const album of albums) {
          if (album.artistId && album.genre) {
            if (!map.has(album.artistId)) map.set(album.artistId, new Set());
            map.get(album.artistId)!.add(album.genre.toLowerCase());
          }
        }
        setAllArtistGenres(map);
      } catch { /* silently fail */ }
    };
    load();
  }, [filterGenre, allArtistGenres.size, activeFolderId]);

  const [radioLoading, setRadioLoading] = useState(false);

  const handleArtistRadio = async (artistId: string, artistName: string) => {
    if (radioLoading) return;
    setRadioLoading(true);
    try {
      const client = getSubsonicClient();

      // Try similar songs first
      let songs: Song[] = [];
      try {
        songs = await client.getSimilarSongs2(artistId, 50);
      } catch { /* no similar songs */ }

      // If no similar songs, get top songs
      if (songs.length === 0) {
        try {
          songs = await client.getTopSongs(artistName, 50);
        } catch { /* no top songs */ }
      }

      // Fallback: get random songs
      if (songs.length === 0) {
        songs = await client.getRandomSongs(50);
      }

      if (songs.length > 0) {
        const shuffled = [...songs].sort(() => Math.random() - 0.5);
        playSongs(shuffled, 0);
      }
    } catch {
      console.error('Failed to start artist radio');
    } finally {
      setRadioLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Artists" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  // Apply filters
  let filteredIndexes = indexes;

  if (filterText) {
    const q = filterText.toLowerCase();
    filteredIndexes = filteredIndexes.map((idx) => ({
      ...idx,
      artist: idx.artist?.filter((a) => a.name.toLowerCase().includes(q)),
    })).filter((idx) => idx.artist && idx.artist.length > 0);
  }

  if (filterGenre && allArtistGenres.size > 0) {
    const g = filterGenre.toLowerCase();
    filteredIndexes = filteredIndexes.map((idx) => ({
      ...idx,
      artist: idx.artist?.filter((a) => allArtistGenres.get(a.id)?.has(g)),
    })).filter((idx) => idx.artist && idx.artist.length > 0);
  }

  const totalArtists = filteredIndexes.reduce((sum, idx) => sum + (idx.artist?.length ?? 0), 0);

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title={`Artists${totalArtists > 0 ? ` (${totalArtists})` : ''}`} showBack />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            showFilter || filterText || filterGenre ? 'border-accent text-accent' : 'border-border text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
          Filter
        </button>
        {showFilter && (
          <>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search artists..."
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
            {(filterText || filterGenre) && (
              <button onClick={() => { setFilterText(''); setFilterGenre(''); }} className="text-xs text-accent hover:underline">Clear</button>
            )}
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {filteredIndexes.map((index) => (
          <div key={index.name}>
            <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm py-1.5">
              <span className="text-xs font-semibold uppercase text-accent">
                {index.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mb-4">
              {index.artist?.map((artist) => (
                <div key={artist.id} className="group relative flex flex-col items-center gap-2 text-center">
                  <button
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="w-full"
                  >
                    <CoverArt
                      coverArt={artist.coverArt}
                      className="w-full !rounded-full transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                  </button>

                  {/* Artist radio button — shows on hover */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleArtistRadio(artist.id, artist.name); }}
                    className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    aria-label={`Play ${artist.name} radio`}
                    title="Artist Radio"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="min-w-0 w-full px-1"
                  >
                    <p className="truncate text-sm font-medium text-text-primary">
                      {artist.name}
                    </p>
                    {artist.albumCount !== undefined && (
                      <p className="text-xs text-text-muted">
                        {artist.albumCount} {artist.albumCount === 1 ? 'album' : 'albums'}
                      </p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredIndexes.length === 0 && (
          <p className="py-8 text-center text-text-muted">No artists found</p>
        )}
      </div>
    </div>
  );
}
