import { useState, useCallback } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { getPlaybackManager } from '../../audio/PlaybackManager';
import CoverArt from '../common/CoverArt';
import WaveformSeekbar from '../player/WaveformSeekbar';

interface VisualizerTransportProps {
  /** Called on any interaction so the auto-hiding overlay timer resets. */
  onInteract: () => void;
}

/**
 * Compact now-playing transport rendered inside the visualizer overlay.
 *
 * Reuses existing playback state/logic (no duplication): playerStore for state
 * and next/previous/togglePlay, PlaybackManager for seek/volume, and the shared
 * CoverArt + WaveformSeekbar components (same seek idiom as PopOutPlayer).
 *
 * Click/tap only — no keyboard shortcuts (the document-level shortcuts in
 * usePlayback already cover playback). Stops event propagation in the bubble
 * phase so interacting here never triggers the canvas click/double-click
 * (overlay timer / random preset); children still handle their own clicks first.
 */
export default function VisualizerTransport({ onInteract }: VisualizerTransportProps) {
  const {
    currentSong, isPlaying, positionMs, durationMs,
    togglePlay, next, previous, radioMode, radioPlaying,
  } = usePlayerStore();
  const [volume, setVolume] = useState(() => Math.round(getPlaybackManager().getVolume() * 100));

  const isRadio = !!radioMode;
  const title = isRadio ? radioMode.stationName : currentSong?.title;
  const subtitle = isRadio ? 'Radio' : currentSong?.artist;
  const coverArt = isRadio ? radioMode.coverArt : currentSong?.coverArt;
  const playing = isRadio ? radioPlaying : isPlaying;

  const handleTogglePlay = useCallback(() => {
    if (isRadio) {
      const pm = getPlaybackManager();
      if (radioPlaying) pm.pauseRadio(); else pm.resumeRadio();
      usePlayerStore.setState({ radioPlaying: !radioPlaying });
    } else {
      togglePlay();
    }
    onInteract();
  }, [isRadio, radioPlaying, togglePlay, onInteract]);

  const handlePrev = useCallback(() => { previous(); onInteract(); }, [previous, onInteract]);
  const handleNext = useCallback(() => { next(); onInteract(); }, [next, onInteract]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    getPlaybackManager().setVolume(v / 100);
    onInteract();
  }, [onInteract]);

  const handleMute = useCallback(() => {
    const pm = getPlaybackManager();
    pm.toggleMute();
    setVolume(Math.round(pm.getVolume() * 100));
    onInteract();
  }, [onInteract]);

  // Nothing playing → render nothing. The smoke test loads with no playback, so
  // this path must never throw or log.
  if (!currentSong && !radioMode) return null;

  const btn = 'flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white';

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-3"
      onClick={(e) => { e.stopPropagation(); onInteract(); }}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => { e.stopPropagation(); onInteract(); }}
      onTouchStart={(e) => { e.stopPropagation(); onInteract(); }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <CoverArt coverArt={coverArt} size={44} className="shrink-0 rounded-md" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{title || 'Unknown'}</p>
          {subtitle && <p className="truncate text-xs text-white/60">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1">
          {!isRadio && (
            <button onClick={handlePrev} className={btn} aria-label="Previous track">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>
          )}
          <button onClick={handleTogglePlay} className={`${btn} bg-white/10`} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
          </button>
          {!isRadio && (
            <button onClick={handleNext} className={btn} aria-label="Next track">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M16 6h2v12h-2V6zM4 18l8.5-6L4 6v12z" />
              </svg>
            </button>
          )}
        </div>

        {/* Volume — desktop only; mobile relies on hardware volume. */}
        <div className="hidden items-center gap-1 sm:flex">
          <button onClick={handleMute} className={btn} aria-label={volume === 0 ? 'Unmute' : 'Mute'}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              {volume === 0 ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6L7.5 9.5H4v5h3.5L12 18V6zM16 9l4 4m0-4l-4 4" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6L7.5 9.5H4v5h3.5L12 18V6z" />
              )}
            </svg>
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/20 accent-accent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>

      {/* Seekbar — songs only (radio has no scrubbable duration). */}
      {!isRadio && (
        <div className="mx-auto mt-1 max-w-3xl" style={{ height: 28 }}>
          <WaveformSeekbar
            songId={currentSong?.id}
            progress={durationMs > 0 ? positionMs / durationMs : 0}
            onSeek={(p) => {
              const ms = Math.round(p * durationMs);
              getPlaybackManager().seek(ms);
              usePlayerStore.getState().setPosition(ms);
              onInteract();
            }}
          />
        </div>
      )}
    </div>
  );
}
