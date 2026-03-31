import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { shareUrl } from '../utils/share';
import type { Playlist } from '../types/subsonic';
import { Header, SongRow, LoadingSpinner, CoverArt } from '../components/common';

function formatDuration(totalSeconds?: number): string {
  if (!totalSeconds) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function PlaylistDetailScreen() {
  const navigate = useNavigate();
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const playSongs = usePlayerStore((s) => s.playSongs);

  useEffect(() => {
    if (!playlistId) return;
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getPlaylist(playlistId);
        setPlaylist(data);
      } catch (err) {
        console.error('Failed to load playlist:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playlistId]);

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Playlist" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Playlist" showBack />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-muted">Playlist not found</p>
        </div>
      </div>
    );
  }

  const songs = playlist.entry ?? [];

  const handlePlay = () => {
    if (songs.length > 0) playSongs(songs, 0);
  };

  const handleShuffle = () => {
    if (songs.length > 0) {
      const startIndex = Math.floor(Math.random() * songs.length);
      playSongs(songs, startIndex);
      usePlayerStore.getState().toggleShuffle();
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header
        title={playlist.name}
        showBack
        rightActions={
          <button
            onClick={() => navigate(`/playlist/edit/${playlistId}`)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary"
            aria-label="Edit playlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Playlist header */}
        <div className="flex flex-col items-center gap-3 px-6 pb-4 pt-2">
          <CoverArt coverArt={playlist.coverArt} size={180} />
          <div className="text-center">
            <h2 className="text-lg font-bold text-text-primary">{playlist.name}</h2>
            <p className="text-sm text-text-muted">
              {playlist.songCount ?? songs.length} songs
              {playlist.duration ? ` \u00B7 ${formatDuration(playlist.duration)}` : ''}
            </p>
          </div>

          {/* Play / Shuffle / Share buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
              Play
            </button>
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-tertiary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
              Shuffle
            </button>
            <button
              onClick={() => shareUrl(playlist.name)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-bg-tertiary"
              aria-label="Share"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Track list */}
        <div className="px-1">
          {songs.map((song, index) => (
            <SongRow
              key={`${song.id}-${index}`}
              song={song}
              index={index}
              onPlay={() => playSongs(songs, index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
