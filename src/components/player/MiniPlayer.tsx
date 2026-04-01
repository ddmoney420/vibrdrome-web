import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import CoverArt from '../common/CoverArt';
import ProgressRing from './ProgressRing';
import MiniWaveform from './MiniWaveform';

export default function MiniPlayer() {
  const navigate = useNavigate();
  const { currentSong, isPlaying, positionMs, durationMs, togglePlay, next, toggleStarCurrent } = usePlayerStore();

  if (!currentSong) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    navigate('/now-playing');
  };

  return (
    <div className="shrink-0 border-t border-border bg-bg-secondary">
      {/* Content */}
      <div
        className="flex h-16 cursor-pointer items-center gap-3 px-3"
        onClick={handleBarClick}
      >
        {/* Cover art with progress ring */}
        <ProgressRing progress={progress} size={46}>
          <CoverArt coverArt={currentSong.coverArt} size={38} className="rounded" />
        </ProgressRing>

        {/* Song info + waveform */}
        <div className="min-w-0 flex-1 flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {currentSong.title}
            </p>
            <p className="truncate text-xs text-text-muted">
              {currentSong.artist ?? 'Unknown Artist'}
            </p>
          </div>
          <MiniWaveform isPlaying={isPlaying} />
        </div>

        {/* Quick actions — hidden on small screens */}
        <div className="hidden sm:flex items-center gap-0.5">
          {/* Star/Heart */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleStarCurrent(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary"
            aria-label={currentSong.starred ? 'Unstar' : 'Star'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              fill={currentSong.starred ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth={2}
              className={`h-4 w-4 ${currentSong.starred ? 'text-accent' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>

          {/* Lyrics */}
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/lyrics'); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary"
            aria-label="Lyrics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" d="M4 6h16M4 10h12M4 14h14M4 18h10" />
            </svg>
          </button>

          {/* Visualizer */}
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/visualizer'); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary"
            aria-label="Visualizer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h2" />
            </svg>
          </button>
        </div>

        {/* Play/Pause */}
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
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
          onClick={(e) => { e.stopPropagation(); next(); }}
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
