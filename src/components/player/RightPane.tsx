import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { CoverArt } from '../common';
import NowPlayingQueue from './NowPlayingQueue';
import NowPlayingLyrics from './NowPlayingLyrics';
import WaveformSeekbar from './WaveformSeekbar';
import { getPlaybackManager } from '../../audio/PlaybackManager';

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type PaneTab = 'playing' | 'queue' | 'lyrics';

export default function RightPane() {
  const navigate = useNavigate();
  const { currentSong, isPlaying, positionMs, durationMs, togglePlay, next, previous, radioPlaying } = usePlayerStore();
  const [tab, setTab] = useState<PaneTab>('playing');

  const radioMode = usePlayerStore((s) => s.radioMode);
  if (!currentSong && !radioMode) return null;

  return (
    <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-l border-border bg-bg-secondary">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['playing', 'queue', 'lyrics'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-center text-xs font-medium uppercase tracking-wider transition-colors ${
              tab === t ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t === 'playing' ? 'Playing' : t === 'queue' ? 'Queue' : 'Lyrics'}
          </button>
        ))}
      </div>

      {tab === 'playing' ? (
        <div className="flex flex-1 flex-col items-center overflow-y-auto p-4">
          {/* Album art */}
          <button
            onClick={() => !radioMode && navigate('/now-playing')}
            className="w-full max-w-[240px] transition-transform hover:scale-[1.02]"
          >
            <CoverArt coverArt={radioMode?.coverArt ?? currentSong?.coverArt} className="w-full rounded-xl shadow-lg" />
          </button>

          {/* Song/Radio info */}
          <div className="mt-4 w-full text-center">
            <h3 className="truncate text-sm font-bold text-text-primary">
              {radioMode ? radioMode.stationName : currentSong?.title}
            </h3>
            <p className="truncate text-xs text-text-secondary">
              {radioMode ? 'Radio' : currentSong?.artist}
            </p>
            {!radioMode && currentSong?.album && (
              <button
                onClick={() => currentSong?.albumId && navigate(`/album/${currentSong.albumId}`)}
                className="truncate text-[10px] text-text-muted hover:text-accent"
              >
                {currentSong.album}
              </button>
            )}
          </div>

          {/* Waveform Seek — hide for radio */}
          {!radioMode && (
            <div className="mt-3 w-full">
              <WaveformSeekbar
                songId={currentSong?.id}
                progress={durationMs > 0 ? positionMs / durationMs : 0}
                onSeek={(p) => {
                  const ms = Math.round(p * durationMs);
                  getPlaybackManager().seek(ms);
                  usePlayerStore.getState().setPosition(ms);
                }}
              />
              <div className="mt-1 flex justify-between text-[10px] text-text-muted">
                <span>{formatTime(positionMs)}</span>
                <span>{formatTime(durationMs)}</span>
              </div>
            </div>
          )}
          {radioMode && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className={`h-2 w-2 rounded-full ${radioPlaying ? 'bg-green-400 animate-pulse' : 'bg-text-muted'}`} />
              <span className="text-xs text-text-muted">{radioPlaying ? 'Live' : 'Paused'}</span>
            </div>
          )}

          {/* Transport controls */}
          <div className="mt-2 flex items-center gap-3">
            {!radioMode && <button onClick={previous} className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>}
            <button
              onClick={() => {
                if (radioMode) {
                  const pm = getPlaybackManager();
                  if (radioPlaying) pm.pauseRadio();
                  else pm.resumeRadio();
                  usePlayerStore.setState({ radioPlaying: !radioPlaying });
                } else {
                  togglePlay();
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-bg-primary hover:opacity-90"
            >
              {(radioMode ? radioPlaying : isPlaying) ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>
            {radioMode ? (
              <button
                onClick={() => { getPlaybackManager().stopRadio(); usePlayerStore.getState().stopRadio(); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary hover:text-red-400"
                aria-label="Stop radio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>
            ) : (
              <button onClick={next} className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M16 6h2v12h-2V6zM4 18l8.5-6L4 6v12z" />
                </svg>
              </button>
            )}
          </div>

          {/* Open full player link */}
          <button
            onClick={() => navigate('/now-playing')}
            className="mt-4 text-[10px] font-medium text-accent hover:underline"
          >
            Open Full Player
          </button>
        </div>
      ) : tab === 'queue' ? (
        <div className="flex-1 overflow-hidden">
          <NowPlayingQueue />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <NowPlayingLyrics />
        </div>
      )}
    </div>
  );
}
