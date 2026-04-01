import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../stores/playerStore';
import { getPlaybackManager } from '../audio/PlaybackManager';
import { CoverArt } from '../components/common';
import DynamicBackground from '../components/player/DynamicBackground';

function useSwipeDown(onSwipe: () => void, threshold = 80) {
  const startY = useRef(0);
  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const delta = e.changedTouches[0].clientY - startY.current;
      if (delta > threshold) onSwipe();
    },
  };
  return handlers;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SLEEP_OPTIONS = [5, 10, 15, 30, 45, 60, 120];

export default function NowPlayingScreen() {
  const navigate = useNavigate();
  const {
    currentSong,
    isPlaying,
    positionMs,
    durationMs,
    shuffleEnabled,
    repeatMode,
    playbackSpeed,
    togglePlay,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
    cycleSpeed,
  } = usePlayerStore();

  // Seek slider state — decouple from store while dragging
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const displayPosition = isSeeking ? seekValue : positionMs;

  // Volume
  const [volume, setVolume] = useState(100);
  const pm = useRef(getPlaybackManager());

  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);
  const [sleepRemaining, setSleepRemaining] = useState('');
  const [showSleepModal, setShowSleepModal] = useState(false);

  // Sleep timer countdown display
  useEffect(() => {
    if (!sleepTimerEnd) return;
    const interval = setInterval(() => {
      const remaining = sleepTimerEnd - Date.now();
      if (remaining <= 0) {
        setSleepTimerEnd(null);
        setSleepRemaining('');
      } else {
        const mins = Math.ceil(remaining / 60000);
        setSleepRemaining(`${mins}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEnd]);

  const handleSleepOption = useCallback((minutes: number) => {
    setSleepTimerEnd(Date.now() + minutes * 60000);
    getPlaybackManager().startSleepTimer(minutes);
    setShowSleepModal(false);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    setSleepTimerEnd(null);
    setSleepRemaining('');
    getPlaybackManager().cancelSleepTimer();
    setShowSleepModal(false);
  }, []);

  const seekValueRef = useRef(0);
  const seekingRef = useRef(false);

  const handleSeekStart = useCallback(() => {
    seekingRef.current = true;
    setIsSeeking(true);
    seekValueRef.current = positionMs;
    setSeekValue(positionMs);
  }, [positionMs]);

  const handleSeekInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const v = Number((e.target as HTMLInputElement).value);
    seekValueRef.current = v;
    setSeekValue(v);
  }, []);

  const handleSeekCommit = useCallback(() => {
    if (!seekingRef.current) return; // prevent double-fire from mouse+touch
    seekingRef.current = false;
    const v = seekValueRef.current;
    pm.current.seek(v);
    usePlayerStore.getState().setPosition(v);
    // Small delay before re-syncing with store to avoid flicker
    setTimeout(() => setIsSeeking(false), 50);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    pm.current.setVolume(v / 100);
  }, []);

  const swipeHandlers = useSwipeDown(() => navigate(-1));

  return (
    <DynamicBackground coverArt={currentSong?.coverArt} className="flex h-full flex-col" {...swipeHandlers}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Visualizer */}
          <button onClick={() => navigate('/visualizer')} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary" aria-label="Visualizer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 md:h-5 md:w-5">
              <path strokeLinecap="round" d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h2" />
            </svg>
          </button>
          {/* Lyrics */}
          <button onClick={() => navigate('/lyrics')} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary" aria-label="Lyrics">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 md:h-5 md:w-5">
              <path strokeLinecap="round" d="M4 6h16M4 10h12M4 14h14M4 18h10" />
            </svg>
          </button>
          {/* EQ */}
          <button onClick={() => navigate('/eq')} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary" aria-label="Equalizer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 md:h-5 md:w-5">
              <path strokeLinecap="round" d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3" />
              <path strokeLinecap="round" d="M1 14h6M9 8h6M17 16h6" />
            </svg>
          </button>
          {/* Queue */}
          <button onClick={() => navigate('/queue')} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary" aria-label="Queue">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 md:h-5 md:w-5">
              <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content — artwork expands to fill available space */}
      <div className="flex flex-1 flex-col items-center overflow-hidden px-6 pb-4">
        {/* Album art — grows to fill available vertical space */}
        <div className="flex flex-1 items-center justify-center w-full py-4">
          <div className="aspect-square h-full max-h-[min(60vh,85vw)] md:max-h-[min(70vh,70vw)] w-auto">
            <CoverArt
              coverArt={currentSong?.coverArt}
              className="shadow-2xl !h-full !w-full rounded-xl"
            />
          </div>
        </div>

        {/* Controls section — fixed at bottom, full width */}
        <div className="flex w-full max-w-2xl flex-col items-center gap-3">
          {/* Song info */}
          <div className="w-full text-center">
            <h2 className="truncate text-xl font-bold text-text-primary">
              {currentSong?.title ?? 'No song playing'}
            </h2>
            <div className="flex items-center justify-center gap-2">
              {currentSong?.artist && (
                <button
                  onClick={() => currentSong.artistId && navigate(`/artist/${currentSong.artistId}`)}
                  className="truncate text-sm text-text-secondary hover:text-accent"
                >
                  {currentSong.artist}
                </button>
              )}
              {currentSong?.artist && currentSong?.album && (
                <span className="text-text-muted">·</span>
              )}
              {currentSong?.album && (
                <button
                  onClick={() => currentSong.albumId && navigate(`/album/${currentSong.albumId}`)}
                  className="truncate text-xs text-text-muted hover:text-accent"
                >
                  {currentSong.album}
                </button>
              )}
            </div>
          </div>

          {/* Seek slider */}
          <div className="w-full">
            <input
              type="range"
              min={0}
              max={durationMs || 1}
              value={displayPosition}
              onChange={() => {}} // controlled input — actual handling via onInput
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onInput={handleSeekInput}
              onMouseUp={handleSeekCommit}
              onTouchEnd={handleSeekCommit}
              onClick={(e) => e.stopPropagation()}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-bg-tertiary accent-accent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-text-muted">
              <span>{formatTime(displayPosition)}</span>
              <span>{formatTime(durationMs)}</span>
            </div>
          </div>

          {/* Transport controls */}
          <div className="flex w-full max-w-sm items-center justify-between">
            <button
              onClick={toggleShuffle}
              className={`flex h-10 w-10 items-center justify-center rounded-full ${shuffleEnabled ? 'text-accent' : 'text-text-muted'}`}
              aria-label="Shuffle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
            </button>
            <button onClick={previous} className="flex h-12 w-12 items-center justify-center rounded-full text-text-primary hover:bg-bg-tertiary" aria-label="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-bg-primary hover:opacity-90"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-8 w-8">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>
            <button onClick={next} className="flex h-12 w-12 items-center justify-center rounded-full text-text-primary hover:bg-bg-tertiary" aria-label="Next">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                <path d="M16 6h2v12h-2V6zM4 18l8.5-6L4 6v12z" />
              </svg>
            </button>
            <button
              onClick={cycleRepeat}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full ${repeatMode !== 'off' ? 'text-accent' : 'text-text-muted'}`}
              aria-label="Repeat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4" />
                <path strokeLinecap="round" d="M3 11V9a4 4 0 014-4h14" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 23l-4-4 4-4" />
                <path strokeLinecap="round" d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
              {repeatMode === 'one' && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-bg-primary">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Volume + Speed + Sleep — single row */}
          <div className="flex w-full items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-text-muted">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6L7.5 9.5H4v5h3.5L12 18V6z" />
            </svg>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-bg-tertiary accent-accent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-text-muted">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 6L7.5 9.5H4v5h3.5L12 18V6z" />
            </svg>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={cycleSpeed}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-bg-tertiary"
              >
                {playbackSpeed.toFixed(playbackSpeed % 1 === 0 ? 1 : 2)}x
              </button>
              <button
                onClick={() => setShowSleepModal(true)}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-bg-tertiary"
              >
                {sleepTimerEnd ? sleepRemaining : 'Sleep'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sleep timer modal */}
      {showSleepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSleepModal(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-bg-secondary p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold text-text-primary">Sleep Timer</h3>
            <div className="grid grid-cols-3 gap-3">
              {SLEEP_OPTIONS.map((min) => (
                <button
                  key={min}
                  onClick={() => handleSleepOption(min)}
                  className="rounded-lg bg-bg-tertiary px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-accent hover:text-bg-primary"
                >
                  {min} min
                </button>
              ))}
              <button
                onClick={cancelSleepTimer}
                className="rounded-lg bg-bg-tertiary px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/20"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DynamicBackground>
  );
}
