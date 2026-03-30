import { useEffect, useRef, useCallback } from 'react';
import { getPlaybackManager } from './PlaybackManager';
import { usePlayerStore } from '../stores/playerStore';
import { useEQStore } from '../stores/eqStore';

export function usePlayback() {
  const managerRef = useRef(getPlaybackManager());
  const initializedRef = useRef(false);
  const lastSongIdRef = useRef<string | null>(null);
  const playTriggeredRef = useRef(false); // guard against resume() right after play()

  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackSpeed = usePlayerStore((s) => s.playbackSpeed);
  const eqBands = useEQStore((s) => s.bands);
  const eqEnabled = useEQStore((s) => s.enabled);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    managerRef.current.init();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
    document.removeEventListener('touchstart', initAudio);
  }, []);

  useEffect(() => {
    document.addEventListener('click', initAudio, { once: false });
    document.addEventListener('keydown', initAudio, { once: false });
    document.addEventListener('touchstart', initAudio, { once: false });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, [initAudio]);

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
      managerRef.current.init();
    }

    // Mark that play was just triggered so the isPlaying effect doesn't also call resume
    playTriggeredRef.current = true;
    managerRef.current.play(currentSong);
  }, [currentSong]);

  // Watch for isPlaying changes -> pause/resume (only for user-initiated toggles)
  useEffect(() => {
    if (!currentSong) return;

    // Skip if play() was just called — it already starts playback
    if (playTriggeredRef.current) {
      playTriggeredRef.current = false;
      return;
    }

    if (isPlaying) {
      managerRef.current.resume();
    } else {
      managerRef.current.pause();
    }
  }, [isPlaying]);

  // Watch for playback speed changes
  useEffect(() => {
    managerRef.current.setPlaybackRate(playbackSpeed);
  }, [playbackSpeed]);

  // Watch for EQ changes
  useEffect(() => {
    managerRef.current.updateEQ(eqBands, eqEnabled);
  }, [eqBands, eqEnabled]);

  // Reset refs on unmount
  useEffect(() => {
    return () => {
      lastSongIdRef.current = null;
    };
  }, []);

  return managerRef.current;
}
