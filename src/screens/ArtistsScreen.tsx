import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import type { ArtistIndex } from '../types/subsonic';
import { Header, CoverArt, LoadingSpinner } from '../components/common';

export default function ArtistsScreen() {
  const navigate = useNavigate();
  const [indexes, setIndexes] = useState<ArtistIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getArtists();
        setIndexes(data);
      } catch (err) {
        console.error('Failed to load artists:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Artists" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Artists" showBack />

      <div className="flex-1 overflow-y-auto">
        {indexes.map((index) => (
          <div key={index.name}>
            <div className="sticky top-0 z-10 bg-bg-primary px-4 py-1.5">
              <span className="text-xs font-semibold uppercase text-accent">
                {index.name}
              </span>
            </div>

            {index.artist?.map((artist) => (
              <button
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-bg-tertiary"
              >
                <CoverArt
                  coverArt={artist.coverArt}
                  size={44}
                  className="rounded-full"
                />
                <div className="min-w-0 flex-1">
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
        ))}
      </div>
    </div>
  );
}
