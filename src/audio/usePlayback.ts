import { useEffect, useRef } from 'react';
import { getPlaybackManager } from './PlaybackManager';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';
import { useEQStore } from '../stores/eqStore';

// The PlaybackManager is a singleton — grab it once at module level
const manager = getPlaybackManager();

export function usePlayback() {
  const initializedRef = useRef(false);
  const lastSongIdRef = useRef<string | null>(null);
  const playTriggeredRef = useRef(false);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const radioMode = usePlayerStore((s) => s.radioMode);
  const playbackSpeed = usePlayerStore((s) => s.playbackSpeed);
  const eqBands = useEQStore((s) => s.bands);
  const eqEnabled = useEQStore((s) => s.enabled);

  // Warmup audio context on every user interaction so that async flows
  // (e.g. fetch then play) don't lose the user-gesture context.
  // Also handle global keyboard shortcuts for playback.
  useEffect(() => {
    const warmupHandler = () => {
      if (!initializedRef.current) {
        initializedRef.current = true;
      }
      manager.warmup();
    };

    const keyHandler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Check if keyboard shortcuts are enabled
      if (!useUIStore.getState().keyboardShortcutsEnabled) return;

      const store = usePlayerStore.getState();

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (store.currentSong) store.togglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            // Shift+Right: skip forward 10s
            manager.seek(Math.min((manager.getPosition() + 10) * 1000, store.durationMs));
          } else {
            store.next();
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            // Shift+Left: skip back 10s
            manager.seek(Math.max((manager.getPosition() - 10) * 1000, 0));
          } else {
            store.previous();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          manager.setVolume(Math.min(1, manager.getVolume() + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          manager.setVolume(Math.max(0, manager.getVolume() - 0.05));
          break;
        case 'm':
        case 'M':
          manager.toggleMute();
          break;
        case 's':
        case 'S':
          store.toggleShuffle();
          break;
        case 'r':
        case 'R':
          store.cycleRepeat();
          break;
      }
    };

    document.addEventListener('click', warmupHandler);
    document.addEventListener('keydown', warmupHandler);
    document.addEventListener('keydown', keyHandler);
    document.addEventListener('touchstart', warmupHandler);

    return () => {
      document.removeEventListener('click', warmupHandler);
      document.removeEventListener('keydown', warmupHandler);
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('touchstart', warmupHandler);
    };
  }, []);

  // Track if we were just in radio mode to prevent auto-play on radio stop
  const wasRadioRef = useRef(false);

  // Watch for currentSong changes -> call play()
  useEffect(() => {
    if (!currentSong) {
      lastSongIdRef.current = null;
      return;
    }

    // Don't start song playback when radio is active
    if (radioMode) {
      wasRadioRef.current = true;
      return;
    }

    // Don't auto-play when radio just stopped — show last song but don't play
    if (wasRadioRef.current) {
      lastSongIdRef.current = currentSong.id;
      return;
    }

    if (currentSong.id === lastSongIdRef.current) return;
    lastSongIdRef.current = currentSong.id;

    // Don't auto-play on page load — wait for a user gesture first
    if (!initializedRef.current) return;

    playTriggeredRef.current = true;
    manager.play(currentSong);
  }, [currentSong, radioMode]);

  // Track previous isPlaying to detect actual toggles
  const prevIsPlayingRef = useRef(isPlaying);

  // Watch for isPlaying changes -> pause/resume
  useEffect(() => {
    if (!currentSong) return;
    // Don't control song audio when in radio mode or just exited radio
    if (radioMode) {
      prevIsPlayingRef.current = isPlaying;
      return;
    }
    if (wasRadioRef.current) {
      prevIsPlayingRef.current = isPlaying;
      return;
    }
    if (playTriggeredRef.current) {
      playTriggeredRef.current = false;
      prevIsPlayingRef.current = isPlaying;
      return;
    }
    // Only act on actual isPlaying changes, not re-renders from currentSong changing
    if (isPlaying === prevIsPlayingRef.current) return;
    prevIsPlayingRef.current = isPlaying;

    if (isPlaying) {
      // If audio has no source (e.g. persisted song after reload), do a full play
      if (!manager.hasSource()) {
        manager.play(currentSong);
      } else {
        manager.resume();
      }
    } else {
      manager.pause();
    }
  }, [isPlaying, currentSong, radioMode]);

  // Clear wasRadio flag after effects have processed
  useEffect(() => {
    if (wasRadioRef.current && !radioMode) {
      const timer = setTimeout(() => { wasRadioRef.current = false; }, 100);
      return () => clearTimeout(timer);
    }
  }, [radioMode]);

  // Watch for playback speed changes
  useEffect(() => {
    manager.setPlaybackRate(playbackSpeed);
  }, [playbackSpeed]);

  // Watch for EQ changes
  useEffect(() => {
    manager.updateEQ(eqBands, eqEnabled);
  }, [eqBands, eqEnabled]);

  return manager;
}
