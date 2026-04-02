import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import CoverArt from '../common/CoverArt';
import ProgressRing from './ProgressRing';
import MiniWaveform from './MiniWaveform';

export default function MiniPlayer() {
  const navigate = useNavigate();
  const { currentSong, isPlaying, positionMs, durationMs, togglePlay, next, toggleStarCurrent, radioMode, radioPlaying, stopRadio } = usePlayerStore();

  if (!currentSong && !radioMode) return null;

  const isRadio = !!radioMode;
  const title = isRadio ? radioMode.stationName : currentSong?.title;
  const subtitle = isRadio ? 'Radio' : (currentSong?.artist ?? 'Unknown Artist');
  const coverArt = isRadio ? radioMode.coverArt : currentSong?.coverArt;
  const progress = isRadio ? 0 : (durationMs > 0 ? positionMs / durationMs : 0);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    // Don't open Now Playing for radio — it doesn't have a dedicated view yet
    if (!isRadio) navigate('/now-playing');
  };

  return (
    <div className="shrink-0 overflow-hidden border-t border-border bg-bg-secondary">
      {/* Content */}
      <div
        className="flex h-16 cursor-pointer items-center gap-3 overflow-hidden px-3"
        onClick={handleBarClick}
      >
        {/* Cover art with progress ring + spin */}
        <ProgressRing progress={progress} size={46}>
          <div
            className="h-full w-full overflow-hidden rounded-full"
            style={{
              animation: (isPlaying || radioPlaying) ? 'spin-album 8s linear infinite' : 'none',
            }}
          >
            <CoverArt coverArt={coverArt} size={38} className="!rounded-full" />
          </div>
        </ProgressRing>

        {/* Song info + waveform */}
        <div className="min-w-0 flex-1 flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {title}
            </p>
            <p className="truncate text-xs text-text-muted">
              {subtitle}
            </p>
          </div>
          <MiniWaveform isPlaying={isPlaying} />
        </div>

        {/* Quick actions — hidden on small screens */}
        <div className="hidden sm:flex items-center gap-0.5">
          {/* Star/Heart — hide for radio */}
          {!isRadio && <button
            onClick={(e) => { e.stopPropagation(); toggleStarCurrent(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary"
            aria-label={currentSong?.starred ? 'Unstar' : 'Star'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              fill={currentSong?.starred ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth={2}
              className={`h-4 w-4 ${currentSong?.starred ? 'text-accent' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>}

          {/* Lyrics — hide for radio */}
          {!isRadio &&
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/lyrics'); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary"
            aria-label="Lyrics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" d="M4 6h16M4 10h12M4 14h14M4 18h10" />
            </svg>
          </button>}

        </div>

        {/* Visualizer — always visible */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/visualizer'); }}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-accent"
          aria-label="Visualizer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h2" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isRadio) {
              import('../../audio/PlaybackManager').then(({ getPlaybackManager }) => {
                const pm = getPlaybackManager();
                if (radioPlaying) pm.pauseRadio();
                else pm.resumeRadio();
              });
              usePlayerStore.setState({ radioPlaying: !radioPlaying });
            } else {
              togglePlay();
            }
          }}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-bg-tertiary"
          aria-label={(isPlaying || radioPlaying) ? 'Pause' : 'Play'}
        >
          {(isPlaying || radioPlaying) ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Skip Next / Stop Radio */}
        {isRadio ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              import('../../audio/PlaybackManager').then(({ getPlaybackManager }) => {
                getPlaybackManager().stopRadio();
              });
              stopRadio();
            }}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-red-400"
            aria-label="Stop radio"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Next track"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M6 18l8.5-6L6 6v12zm8.5-6v6h2V6h-2v6z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
