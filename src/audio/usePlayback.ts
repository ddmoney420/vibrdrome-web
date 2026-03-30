import { useEffect, useRef } from 'react';
import { getPlaybackManager } from './PlaybackManager';
import { usePlayerStore } from '../stores/playerStore';
import { useEQStore } from '../stores/eqStore';

// The PlaybackManager is a singleton — grab it once at module level
const manager = getPlaybackManager();

export function usePlayback() {
  const initializedRef = useRef(false);
  const lastSongIdRef = useRef<string | null>(null);
  const playTriggeredRef = useRef(false);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackSpeed = usePlayerStore((s) => s.playbackSpeed);
  const eqBands = useEQStore((s) => s.bands);
  const eqEnabled = useEQStore((s) => s.enabled);

  // Warmup audio context on every user interaction so that async flows
  // (e.g. fetch then play) don't lose the user-gesture context.
  useEffect(() => {
    const handler = () => {
      if (!initializedRef.current) {
        initializedRef.current = true;
      }
      manager.warmup();
    };

    document.addEventListener('click', handler);
    document.addEventListener('keydown', handler);
    document.addEventListener('touchstart', handler);

    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Watch for currentSong changes -> call play()
  useEffect(() => {
    if (!currentSong) {
      lastSongIdRef.current = null;
      return;
    }

    if (currentSong.id === lastSongIdRef.current) return;
    lastSongIdRef.current = currentSong.id;

    if (!initializedRef.current) {
      initializedRef.current = true;
      manager.init();
    }

    playTriggeredRef.current = true;
    manager.play(currentSong);
  }, [currentSong]);

  // Track previous isPlaying to detect actual toggles
  const prevIsPlayingRef = useRef(isPlaying);

  // Watch for isPlaying changes -> pause/resume
  useEffect(() => {
    if (!currentSong) return;
    if (playTriggeredRef.current) {
      playTriggeredRef.current = false;
      prevIsPlayingRef.current = isPlaying;
      return;
    }
    // Only act on actual isPlaying changes, not re-renders from currentSong changing
    if (isPlaying === prevIsPlayingRef.current) return;
    prevIsPlayingRef.current = isPlaying;

    if (isPlaying) {
      manager.resume();
    } else {
      manager.pause();
    }
  }, [isPlaying, currentSong]);

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
