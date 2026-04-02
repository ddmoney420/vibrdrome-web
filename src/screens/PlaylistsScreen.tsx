import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import type { Playlist } from '../types/subsonic';
import { Header, CoverArt, LoadingSpinner } from '../components/common';

function formatDuration(totalSeconds?: number): string {
  if (!totalSeconds) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function PlaylistsScreen() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getPlaylists();
        setPlaylists(data);
      } catch (err) {
        console.error('Failed to load playlists:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Playlists" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header
        title="Playlists"
        showBack
        rightActions={
          <button
            onClick={() => navigate('/playlist/edit')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary"
            aria-label="Create playlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {playlists.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-text-muted">No playlists yet</p>
            <button
              onClick={() => navigate('/playlist/edit')}
              className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary"
            >
              Create Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => navigate(`/playlist/${playlist.id}`)}
                className="group flex flex-col gap-2 text-left"
              >
                <CoverArt
                  coverArt={playlist.coverArt}
                  className="w-full transition-transform duration-200 group-hover:scale-[1.03]"
                />
                <div className="min-w-0 px-0.5">
                  <p className="truncate text-sm font-medium text-text-primary">{playlist.name}</p>
                  <p className="truncate text-xs text-text-muted">
                    {playlist.songCount ?? 0} songs
                    {playlist.duration ? ` \u00B7 ${formatDuration(playlist.duration)}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
