import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { useMusicFolderStore } from '../stores/musicFolderStore';
import type { ArtistIndex } from '../types/subsonic';
import { Header, CoverArt, LoadingSpinner } from '../components/common';

export default function ArtistsScreen() {
  const navigate = useNavigate();
  const [indexes, setIndexes] = useState<ArtistIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const activeFolderId = useMusicFolderStore((s) => s.activeFolderId);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getArtists(activeFolderId ?? undefined);
        setIndexes(data);
      } catch (err) {
        console.error('Failed to load artists:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeFolderId]);

  const [filterText, setFilterText] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Artists" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  // Filter indexes by name
  const filteredIndexes = filterText
    ? indexes.map((idx) => ({
        ...idx,
        artist: idx.artist?.filter((a) => a.name.toLowerCase().includes(filterText.toLowerCase())),
      })).filter((idx) => idx.artist && idx.artist.length > 0)
    : indexes;

  const totalArtists = filteredIndexes.reduce((sum, idx) => sum + (idx.artist?.length ?? 0), 0);

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title={`Artists${totalArtists > 0 ? ` (${totalArtists})` : ''}`} showBack />

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            showFilter || filterText ? 'border-accent text-accent' : 'border-border text-text-primary hover:bg-bg-tertiary'
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
              className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent"
              autoFocus
            />
            {filterText && (
              <button onClick={() => setFilterText('')} className="text-xs text-accent hover:underline">Clear</button>
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
                <button
                  key={artist.id}
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <CoverArt
                    coverArt={artist.coverArt}
                    className="w-full !rounded-full transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                  <div className="min-w-0 w-full px-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {artist.name}
                    </p>
                    {artist.albumCount !== undefined && (
                      <p className="text-xs text-text-muted">
                        {artist.albumCount} {artist.albumCount === 1 ? 'album' : 'albums'}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
