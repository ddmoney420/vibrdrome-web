import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { useUIStore } from '../../stores/uiStore';
import { getPlaybackManager } from '../../audio/PlaybackManager';
import CoverArt from '../common/CoverArt';
import FirstRunTooltip from '../common/FirstRunTooltip';
import ProgressRing from './ProgressRing';
import MiniWaveform from './MiniWaveform';
import CastButton from './CastButton';

export default function MiniPlayer() {
  const navigate = useNavigate();
  const { currentSong, isPlaying, positionMs, durationMs, togglePlay, next, previous, repeatMode, cycleRepeat, toggleStarCurrent, radioMode, radioPlaying, stopRadio } = usePlayerStore();
  const pm = useRef(getPlaybackManager());
  const [volume, setVolume] = useState(() => Math.round(getPlaybackManager().getVolume() * 100));
  const [showVolume, setShowVolume] = useState(false);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    pm.current.setVolume(v / 100);
  }, []);

  if (!currentSong && !radioMode) return null;

  const isRadio = !!radioMode;
  const title = isRadio ? radioMode.stationName : currentSong?.title;
  const subtitle = isRadio ? 'Radio' : (currentSong?.artist ?? 'Unknown Artist');
  const coverArt = isRadio ? radioMode.coverArt : currentSong?.coverArt;
  const progress = isRadio ? 0 : (durationMs > 0 ? positionMs / durationMs : 0);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    navigate('/now-playing');
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

        {/* Pop-out player */}
        <button
          onClick={(e) => { e.stopPropagation(); useUIStore.getState().setPopOutPlayerOpen(true); }}
          className="hidden sm:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Pop-out player"
          title="Pop-out mini player"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" />
            <path d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" />
          </svg>
        </button>

        {/* Volume control — inline slider */}
        <div className="hidden sm:flex items-center gap-1"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newVol = volume === 0 ? 100 : 0;
              setVolume(newVol);
              pm.current.setVolume(newVol / 100);
            }}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Volume"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              {volume === 0 ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6L7.5 9.5H4v5h3.5L12 18V6zM16 9l4 4m0-4l-4 4" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6L7.5 9.5H4v5h3.5L12 18V6z" />
              )}
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${showVolume ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-bg-tertiary accent-accent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
          </div>
        </div>

        {/* Visualizer — always visible */}
        <FirstRunTooltip id="mini-visualizer" message="Open the full-screen visualizer with WebGL effects" position="top" delay={5000}>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/visualizer'); }}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-accent"
          aria-label="Visualizer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h2" />
          </svg>
        </button>
        </FirstRunTooltip>

        {/* Chromecast */}
        <CastButton />

        {/* Previous — hide for radio */}
        {!isRadio && (
          <button
            onClick={(e) => { e.stopPropagation(); previous(); }}
            className="hidden sm:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Previous track"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
            </svg>
          </button>
        )}

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

        {/* Repeat — hide for radio */}
        {!isRadio && (
          <button
            onClick={(e) => { e.stopPropagation(); cycleRepeat(); }}
            className={`relative hidden sm:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
            }`}
            aria-label="Repeat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4" />
              <path strokeLinecap="round" d="M3 11V9a4 4 0 014-4h14" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 23l-4-4 4-4" />
              <path strokeLinecap="round" d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
            {repeatMode === 'one' && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-accent text-[7px] font-bold text-bg-primary">1</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
