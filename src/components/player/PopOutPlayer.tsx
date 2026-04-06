import { useState, useRef, useCallback, useEffect } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { getPlaybackManager } from '../../audio/PlaybackManager';
import CoverArt from '../common/CoverArt';
import WaveformSeekbar from './WaveformSeekbar';

type Size = 'small' | 'medium' | 'large' | 'xlarge';

const SIZES = {
  small: { width: 280, waveHeight: 30 },
  medium: { width: 400, waveHeight: 50 },
  large: { width: 520, waveHeight: 80 },
  xlarge: { width: 1040, waveHeight: 160 },
};

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PopOutPlayerProps {
  onClose: () => void;
}

export default function PopOutPlayer({ onClose }: PopOutPlayerProps) {
  const { currentSong, isPlaying, positionMs, durationMs, togglePlay, next, previous, radioMode, radioPlaying } = usePlayerStore();
  const [size, setSize] = useState<Size>('medium');
  const [position, setPosition] = useState({ x: window.innerWidth - SIZES.medium.width - 20, y: 80 });
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isRadio = !!radioMode;
  const title = isRadio ? radioMode.stationName : currentSong?.title;
  const subtitle = isRadio ? 'Radio' : currentSong?.artist;
  const coverArt = isRadio ? radioMode.coverArt : currentSong?.coverArt;
  const playing = isRadio ? radioPlaying : isPlaying;
  const { width, waveHeight } = SIZES[size];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-no-drag]')) return;
    draggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - width, e.clientX - dragOffsetRef.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffsetRef.current.y)),
      });
    };
    const handleMouseUp = () => { draggingRef.current = false; };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [width]);

  const handleTogglePlay = () => {
    if (isRadio) {
      const pm = getPlaybackManager();
      if (radioPlaying) pm.pauseRadio();
      else pm.resumeRadio();
      usePlayerStore.setState({ radioPlaying: !radioPlaying });
    } else {
      togglePlay();
    }
  };

  if (!currentSong && !radioMode) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[90] select-none rounded-2xl bg-bg-secondary/95 shadow-2xl backdrop-blur-xl border border-border"
      style={{ left: position.x, top: position.y, width }}
      onMouseDown={handleMouseDown}
    >
      {/* Header — drag handle */}
      <div className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400 cursor-pointer" onClick={onClose} />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 cursor-pointer" onClick={() => setSize(size === 'small' ? 'medium' : 'small')} />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400 cursor-pointer" onClick={() => setSize(size === 'xlarge' ? 'medium' : 'xlarge')} />
          </div>
          <span className="text-[10px] text-text-muted ml-1">Mini Player</span>
        </div>
        <div className="flex items-center gap-1">
          {(['small', 'medium', 'large', 'xlarge'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${size === s ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              {s === 'xlarge' ? 'XL' : s[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-3">
          {/* Album art */}
          <CoverArt coverArt={coverArt} size={size === 'small' ? 40 : size === 'medium' ? 56 : size === 'large' ? 72 : 120} className="shrink-0 rounded-lg" />

          {/* Song info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-text-primary">{title}</p>
            <p className="truncate text-xs text-text-muted">{subtitle}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {!isRadio && (
              <button onClick={previous} className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleTogglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-bg-primary hover:opacity-90"
            >
              {playing ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>
            {!isRadio && (
              <button onClick={next} className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M16 6h2v12h-2V6zM4 18l8.5-6L4 6v12z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Waveform seekbar — scalable */}
        {!isRadio && (
          <div className="mt-2" data-no-drag style={{ height: waveHeight }}>
            <WaveformSeekbar
              songId={currentSong?.id}
              progress={durationMs > 0 ? positionMs / durationMs : 0}
              onSeek={(p) => {
                const ms = Math.round(p * durationMs);
                getPlaybackManager().seek(ms);
                usePlayerStore.getState().setPosition(ms);
              }}
            />
          </div>
        )}

        {/* Time display */}
        {!isRadio && (
          <div className="mt-1 flex justify-between text-[10px] text-text-muted">
            <span>{formatTime(positionMs)}</span>
            <span>{formatTime(durationMs)}</span>
          </div>
        )}

        {/* Radio live indicator */}
        {isRadio && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className={`h-2 w-2 rounded-full ${radioPlaying ? 'bg-green-400 animate-pulse' : 'bg-text-muted'}`} />
            <span className="text-xs text-text-muted">{radioPlaying ? 'Live' : 'Paused'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
