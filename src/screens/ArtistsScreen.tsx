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

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {indexes.map((index) => (
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
