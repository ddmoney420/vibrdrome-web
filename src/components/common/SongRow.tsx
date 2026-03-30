import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Song } from '../../types/subsonic';
import { getSubsonicClient } from '../../api/SubsonicClient';
import { usePlayerStore } from '../../stores/playerStore';
import ContextMenu from './ContextMenu';

interface SongRowProps {
  song: Song;
  index?: number;
  showTrackNumber?: boolean;
  showAlbum?: boolean;
  onPlay?: () => void;
}

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SongRow({
  song,
  index,
  showTrackNumber = false,
  showAlbum = false,
  onPlay,
}: SongRowProps) {
  const navigate = useNavigate();
  const [starred, setStarred] = useState(!!song.starred);

  const displayNumber = showTrackNumber ? song.track : index !== undefined ? index + 1 : undefined;

  const handleStarToggle = async () => {
    const client = getSubsonicClient();
    try {
      if (starred) {
        await client.unstar(song.id);
      } else {
        await client.star(song.id);
      }
      setStarred(!starred);
    } catch {
      // silently fail
    }
  };

  const menuItems = [
    {
      label: 'Play Next',
      onClick: () => {
        usePlayerStore.getState().playNext(song);
      },
    },
    {
      label: 'Add to Queue',
      onClick: () => {
        usePlayerStore.getState().addToQueue(song);
      },
    },
    {
      label: 'Go to Album',
      onClick: () => {
        if (song.albumId) navigate(`/album/${song.albumId}`);
      },
    },
    {
      label: 'Go to Artist',
      onClick: () => {
        if (song.artistId) navigate(`/artist/${song.artistId}`);
      },
    },
    {
      label: starred ? 'Unstar' : 'Star',
      onClick: handleStarToggle,
    },
    {
      label: 'Song Radio',
      onClick: async () => {
        try {
          const client = getSubsonicClient();
          const result = await client.getSimilarSongs2(song.id, 50);
          if (result && result.length > 0) {
            usePlayerStore.getState().playSongs(result);
          }
        } catch {
          // silently fail
        }
      },
    },
  ];

  return (
    <div
      onClick={onPlay}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-tertiary"
    >
      {/* Track number / index */}
      {displayNumber !== undefined && (
        <span className="w-7 shrink-0 text-right text-sm text-text-muted">
          {displayNumber}
        </span>
      )}

      {/* Song info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {song.title}
        </p>
        <p className="truncate text-xs text-text-secondary">
          {song.artist}
          {showAlbum && song.album ? ` \u00B7 ${song.album}` : ''}
        </p>
      </div>

      {/* Duration */}
      <span className="shrink-0 text-xs text-text-muted">
        {formatDuration(song.duration)}
      </span>

      {/* Context menu */}
      <ContextMenu
        items={menuItems}
        trigger={
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted opacity-0 transition-all hover:bg-bg-secondary hover:text-text-primary group-hover:opacity-100"
            aria-label="More options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        }
      />
    </div>
  );
}
