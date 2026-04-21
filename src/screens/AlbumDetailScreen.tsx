import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { shareUrl } from '../utils/share';
import type { Album } from '../types/subsonic';
import { Header, CoverArt, SongRow, LoadingSpinner } from '../components/common';
import DownloadButton from '../components/common/DownloadButton';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min`;
}

export default function AlbumDetailScreen() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const playSongs = usePlayerStore((s) => s.playSongs);
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    if (!albumId) return;
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getAlbum(albumId);
        setAlbum(data);
        setStarred(!!data.starred);
      } catch (err) {
        console.error('Failed to load album:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [albumId]);

  const handlePlay = () => {
    if (!album?.song?.length) return;
    playSongs(album.song, 0);
  };

  const handleShuffle = () => {
    if (!album?.song?.length) return;
    const shuffled = [...album.song].sort(() => Math.random() - 0.5);
    playSongs(shuffled, 0);
  };

  const handleStarToggle = async () => {
    if (!album) return;
    const client = getSubsonicClient();
    try {
      if (starred) {
        await client.unstar(undefined, album.id);
      } else {
        await client.star(undefined, album.id);
      }
      setStarred(!starred);
    } catch {
      // silently fail
    }
  };

  const handlePlayFromTrack = (index: number) => {
    if (!album?.song?.length) return;
    playSongs(album.song, index);
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Album" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Album" showBack />
        <p className="px-4 py-8 text-center text-text-muted">Album not found.</p>
      </div>
    );
  }

  const songs = album.song ?? [];
  const meta: string[] = [];
  if (album.year) meta.push(String(album.year));
  if (album.genre) meta.push(album.genre);
  if (album.songCount) meta.push(`${album.songCount} songs`);
  if (album.duration) meta.push(formatDuration(album.duration));

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title={album.name} showBack />

      <div className="flex-1 overflow-y-auto">
        {/* Album header info */}
        <div className="flex flex-col items-center px-3 pb-4 md:px-4">
          <CoverArt coverArt={album.coverArt} size={200} className="md:!h-[240px] md:!w-[240px]" />

          <h2 className="mt-4 text-center text-lg font-bold text-text-primary">
            {album.name}
          </h2>

          {album.artist && (
            <button
              onClick={() => album.artistId && navigate(`/artist/${album.artistId}`)}
              className="mt-1 text-sm text-accent transition-colors hover:underline"
            >
              {album.artist}
            </button>
          )}

          {meta.length > 0 && (
            <p className="mt-1 text-center text-xs text-text-muted">
              {meta.join(' \u00B7 ')}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex w-full items-center gap-3 md:w-auto">
            <button
              onClick={handlePlay}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 md:flex-initial md:py-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
              Play
            </button>

            <button
              onClick={handleShuffle}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-tertiary md:flex-initial md:py-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
              Shuffle
            </button>

            <button
              onClick={() => shareUrl(`${album.name} by ${album.artist ?? 'Unknown'}`)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-bg-tertiary"
              aria-label="Share"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

            <button
              onClick={handleStarToggle}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-bg-tertiary"
              aria-label={starred ? 'Unstar' : 'Star'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={starred ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                className={`h-4 w-4 ${starred ? 'text-accent' : ''}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>

            {album.song && album.song.length > 0 && (
              <DownloadButton songs={album.song} albumId={album.id} />
            )}
          </div>
        </div>

        {/* Track list */}
        <div className="px-1 pb-20">
          {songs.map((song, i) => (
            <SongRow
              key={song.id}
              song={song}
              showTrackNumber
              onPlay={() => handlePlayFromTrack(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
