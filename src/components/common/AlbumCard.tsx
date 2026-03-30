import { useNavigate } from 'react-router-dom';
import type { Album } from '../../types/subsonic';
import CoverArt from './CoverArt';

interface AlbumCardProps {
  album: Album;
  size?: 'small' | 'medium' | 'fill';
}

const SIZES = {
  small: 120,
  medium: 160,
} as const;

export default function AlbumCard({ album, size = 'fill' }: AlbumCardProps) {
  const navigate = useNavigate();
  const fixed = size !== 'fill' ? SIZES[size] : undefined;

  return (
    <button
      onClick={() => navigate(`/album/${album.id}`)}
      className="group flex flex-col gap-2 text-left"
      style={fixed ? { width: fixed } : undefined}
    >
      <CoverArt
        coverArt={album.coverArt}
        size={fixed}
        className="transition-transform duration-200 group-hover:scale-[1.03]"
      />
      <div className="min-w-0 px-0.5">
        <p className="truncate text-sm font-medium text-text-primary">
          {album.name}
        </p>
        {album.artist && (
          <p className="truncate text-xs text-text-secondary">
            {album.artist}
          </p>
        )}
      </div>
    </button>
  );
}
