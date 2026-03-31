import { useState, useEffect, useCallback } from 'react';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { useMusicFolderStore } from '../stores/musicFolderStore';
import type { Song } from '../types/subsonic';
import { Header, SongRow, LoadingSpinner } from '../components/common';

export default function SongsScreen() {
  const playSongs = usePlayerStore((s) => s.playSongs);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const activeFolderId = useMusicFolderStore((s) => s.activeFolderId);

  const loadSongs = useCallback(async () => {
    setLoading(true);
    try {
      const client = getSubsonicClient();
      const data = await client.getRandomSongs(100, undefined, activeFolderId ?? undefined);
      setSongs(data);
    } catch (err) {
      console.error('Failed to load songs:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFolderId]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

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
      <Header title="Songs" showBack />

      {/* Action buttons */}
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
          onClick={loadSongs}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex-1 overflow-y-auto px-1 pb-24">
          {songs.map((song, i) => (
            <SongRow
              key={song.id}
              song={song}
              index={i}
              showAlbum
              onPlay={() => handlePlayFrom(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
