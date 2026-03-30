import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import CoverArt from '../common/CoverArt';

export default function MiniPlayer() {
  const navigate = useNavigate();
  const { currentSong, isPlaying, positionMs, durationMs, togglePlay, next } = usePlayerStore();

  if (!currentSong) return null;

  const progress = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent navigation when clicking buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    navigate('/now-playing');
  };

  return (
    <div className="shrink-0 border-t border-border bg-bg-secondary">
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-bg-tertiary">
        <div
          className="h-full bg-accent transition-[width] duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div
        className="flex h-16 cursor-pointer items-center gap-3 px-3"
        onClick={handleBarClick}
      >
        {/* Cover art */}
        <CoverArt coverArt={currentSong.coverArt} size={40} className="flex-shrink-0 rounded" />

        {/* Song info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">
            {currentSong.title}
          </p>
          <p className="truncate text-xs text-text-muted">
            {currentSong.artist ?? 'Unknown Artist'}
          </p>
        </div>

        {/* Play/Pause */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-bg-tertiary"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Skip Next */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Next track"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M6 18l8.5-6L6 6v12zm8.5-6v6h2V6h-2v6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
