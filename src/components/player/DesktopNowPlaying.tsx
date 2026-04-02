import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { getPlaybackManager } from '../../audio/PlaybackManager';
import DynamicBackground from './DynamicBackground';
import SpinningAlbumArt from './SpinningAlbumArt';
import NowPlayingQueue from './NowPlayingQueue';
import NowPlayingLyrics from './NowPlayingLyrics';
import NowPlayingArtist from './NowPlayingArtist';

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type RightTab = 'queue' | 'lyrics' | 'artist';

export default function DesktopNowPlaying() {
  const navigate = useNavigate();
  const {
    currentSong, isPlaying, positionMs, durationMs,
    shuffleEnabled, repeatMode, playbackSpeed,
    togglePlay, next, previous, toggleShuffle, cycleRepeat, cycleSpeed,
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<RightTab>('queue');
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const pm = useRef(getPlaybackManager());
  const [volume, setVolume] = useState(() => Math.round(getPlaybackManager().getVolume() * 100));

  const displayPosition = isSeeking ? seekValue : positionMs;
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
    if (!seekingRef.current) return;
    seekingRef.current = false;
    const v = seekValueRef.current;
    pm.current.seek(v);
    usePlayerStore.getState().setPosition(v);
    setTimeout(() => setIsSeeking(false), 50);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    pm.current.setVolume(v / 100);
  }, []);

  return (
    <DynamicBackground coverArt={currentSong?.coverArt} className="flex h-full flex-col">
      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-medium uppercase tracking-widest text-white/40">Now Playing</span>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/visualizer')} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10" aria-label="Visualizer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h2" />
            </svg>
          </button>
          <button onClick={() => navigate('/eq')} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10" aria-label="Equalizer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14h6M9 8h6M17 16h6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main three-column layout */}
      <div className="flex flex-1 gap-6 overflow-hidden px-6 pb-6">
        {/* Left: Spinning album art */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <button
            onClick={() => setActiveTab('artist')}
            className="cursor-pointer transition-transform hover:scale-[1.02] w-[min(45vh,350px)] h-[min(45vh,350px)]"
            aria-label="View artist info"
          >
            <SpinningAlbumArt
              coverArt={currentSong?.coverArt}
              className="h-full w-full"
            />
          </button>
          {/* Artist info below art */}
          <div className="mt-6 text-center">
            {currentSong?.artist && (
              <button
                onClick={() => currentSong.artistId && navigate(`/artist/${currentSong.artistId}`)}
                className="text-sm text-white/50 hover:text-accent transition-colors"
              >
                {currentSong.artist}
              </button>
            )}
          </div>
        </div>

        {/* Center: Song info + controls */}
        <div className="flex w-80 flex-col items-center justify-center gap-4">
          {/* Song info */}
          <div className="w-full text-center">
            <h2 className="truncate text-xl font-bold text-white">
              {currentSong?.title ?? 'No song playing'}
            </h2>
            {currentSong?.album && (
              <button
                onClick={() => currentSong.albumId && navigate(`/album/${currentSong.albumId}`)}
                className="mt-1 truncate text-sm text-white/40 hover:text-accent transition-colors"
              >
                {currentSong.album}
              </button>
            )}
          </div>

          {/* Seek */}
          <div className="w-full">
            <input
              type="range" min={0} max={durationMs || 1} value={displayPosition}
              onChange={() => {}}
              onMouseDown={handleSeekStart} onTouchStart={handleSeekStart}
              onInput={handleSeekInput}
              onMouseUp={handleSeekCommit} onTouchEnd={handleSeekCommit}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-accent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-white/40">
              <span>{formatTime(displayPosition)}</span>
              <span>{formatTime(durationMs)}</span>
            </div>
          </div>

          {/* Transport */}
          <div className="flex w-full items-center justify-between">
            <button onClick={toggleShuffle} className={`flex h-10 w-10 items-center justify-center rounded-full ${shuffleEnabled ? 'text-accent' : 'text-white/40'}`} aria-label="Shuffle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
            </button>
            <button onClick={previous} className="flex h-12 w-12 items-center justify-center rounded-full text-white hover:bg-white/10" aria-label="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>
            <button onClick={togglePlay} className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-black hover:opacity-90" aria-label={isPlaying ? 'Pause' : 'Play'}>
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
            <button onClick={next} className="flex h-12 w-12 items-center justify-center rounded-full text-white hover:bg-white/10" aria-label="Next">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                <path d="M16 6h2v12h-2V6zM4 18l8.5-6L4 6v12z" />
              </svg>
            </button>
            <button onClick={cycleRepeat} className={`relative flex h-10 w-10 items-center justify-center rounded-full ${repeatMode !== 'off' ? 'text-accent' : 'text-white/40'}`} aria-label="Repeat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4" />
                <path strokeLinecap="round" d="M3 11V9a4 4 0 014-4h14" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 23l-4-4 4-4" />
                <path strokeLinecap="round" d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
              {repeatMode === 'one' && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-black">1</span>
              )}
            </button>
          </div>

          {/* Volume + extras */}
          <div className="flex w-full items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-white/30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6L7.5 9.5H4v5h3.5L12 18V6z" />
            </svg>
            <input
              type="range" min={0} max={100} value={volume} onChange={handleVolumeChange}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-accent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
            <button onClick={cycleSpeed} className="rounded-full border border-white/10 px-2 py-0.5 text-xs font-medium text-white/50 hover:bg-white/10">
              {playbackSpeed.toFixed(playbackSpeed % 1 === 0 ? 1 : 2)}x
            </button>
          </div>
        </div>

        {/* Right: Queue / Lyrics tabs */}
        <div className="flex w-80 flex-col overflow-hidden rounded-xl bg-black/20 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {(['queue', 'lyrics', 'artist'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === tab ? 'text-accent border-b-2 border-accent' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'queue' && <NowPlayingQueue />}
            {activeTab === 'lyrics' && <NowPlayingLyrics />}
            {activeTab === 'artist' && <NowPlayingArtist />}
          </div>
        </div>
      </div>
    </DynamicBackground>
  );
}
