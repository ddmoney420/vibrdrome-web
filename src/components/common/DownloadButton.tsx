import { useDownloadStore } from '../../stores/downloadStore';
import { getDownloadManager } from '../../audio/DownloadManager';
import type { Song } from '../../types/subsonic';

interface DownloadButtonProps {
  songs: Song[];
  albumId?: string;
  className?: string;
}

export default function DownloadButton({ songs, albumId, className = '' }: DownloadButtonProps) {
  const cachedSongs = useDownloadStore((s) => s.cachedSongs);
  const queue = useDownloadStore((s) => s.queue);

  const allCached = songs.length > 0 && songs.every((s) => cachedSongs.has(s.id));
  const someInQueue = songs.some((s) => queue.some((q) => q.song.id === s.id));

  const handleClick = () => {
    if (allCached) return;
    getDownloadManager().queueSongs(songs, albumId);
  };

  return (
    <button
      onClick={handleClick}
      disabled={allCached}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors ${
        allCached
          ? 'text-accent border-accent/30'
          : someInQueue
            ? 'text-text-muted animate-pulse'
            : 'text-text-secondary hover:bg-bg-tertiary'
      } ${className}`}
      aria-label={allCached ? 'Downloaded' : someInQueue ? 'Downloading...' : 'Download for offline'}
      title={allCached ? 'Available offline' : someInQueue ? 'Downloading...' : 'Download for offline'}
    >
      {allCached ? (
        // Checkmark
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
        </svg>
      ) : (
        // Download arrow
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      )}
    </button>
  );
}
