import { useEffect, useRef } from 'react';
import { getPlaybackManager } from './PlaybackManager';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';
import { useEQStore } from '../stores/eqStore';
import { getSubsonicClient } from '../api/SubsonicClient';
import { syncPosition, loadServerQueue } from '../utils/queueSync';

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

  // Warmup audio context on every user interaction
  useEffect(() => {
    const warmupHandler = () => {
      if (!initializedRef.current) {
        initializedRef.current = true;
      }
      manager.warmup();
    };

    const keyHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!useUIStore.getState().keyboardShortcutsEnabled) return;

      const store = usePlayerStore.getState();

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (store.radioMode) {
            // Toggle radio
            const pm = getPlaybackManager();
            if (store.radioPlaying) pm.pauseRadio();
            else pm.resumeRadio();
            usePlayerStore.setState({ radioPlaying: !store.radioPlaying });
          } else if (store.currentSong) {
            store.togglePlay();
          }
          break;
        case 'ArrowRight':
          if (!store.radioMode) {
            if (e.shiftKey) {
              manager.seek(Math.min((manager.getPosition() + 10) * 1000, store.durationMs));
            } else {
              store.next();
            }
          }
          break;
        case 'ArrowLeft':
          if (!store.radioMode) {
            if (e.shiftKey) {
              manager.seek(Math.max((manager.getPosition() - 10) * 1000, 0));
            } else {
              store.previous();
            }
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
          if (!store.radioMode) store.toggleShuffle();
          break;
        case 'r':
        case 'R':
          if (!store.radioMode) store.cycleRepeat();
          break;
        case '?':
          useUIStore.getState().setShortcutsOverlayOpen(true);
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

  // Watch for currentSong changes -> call play()
  // ONLY reacts to currentSong changes, NOT radioMode changes
  useEffect(() => {
    if (!currentSong) {
      lastSongIdRef.current = null;
      return;
    }

    if (currentSong.id === lastSongIdRef.current) return;
    lastSongIdRef.current = currentSong.id;

    if (!initializedRef.current) return;

    // Don't play song if radio is active
    if (usePlayerStore.getState().radioMode) return;

    playTriggeredRef.current = true;
    manager.play(currentSong);

    // Desktop notification
    if (useUIStore.getState().notificationsEnabled && Notification.permission === 'granted') {
      const icon = currentSong.coverArt
        ? getSubsonicClient().getCoverArt(currentSong.coverArt, 256)
        : undefined;
      new Notification(currentSong.title, {
        body: `${currentSong.artist ?? 'Unknown Artist'} — ${currentSong.album ?? 'Unknown Album'}`,
        icon,
        silent: true,
        tag: 'vibrdrome-now-playing',
      });
    }
  }, [currentSong]);

  // Track previous isPlaying to detect actual toggles
  const prevIsPlayingRef = useRef(isPlaying);

  // Watch for isPlaying changes -> pause/resume
  // ONLY reacts to isPlaying changes
  useEffect(() => {
    if (!currentSong) return;

    // Don't control song audio when radio is active
    if (usePlayerStore.getState().radioMode) {
      prevIsPlayingRef.current = isPlaying;
      return;
    }

    if (playTriggeredRef.current) {
      playTriggeredRef.current = false;
      prevIsPlayingRef.current = isPlaying;
      return;
    }

    if (isPlaying === prevIsPlayingRef.current) return;
    prevIsPlayingRef.current = isPlaying;

    if (isPlaying) {
      if (!manager.hasSource()) {
        manager.play(currentSong);
      } else {
        manager.resume();
      }
    } else {
      manager.pause();
      syncPosition();
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

  // Server queue sync: periodic position save + startup load + beforeunload
  useEffect(() => {
    // Load queue from server if local queue is empty
    loadServerQueue();

    // Save position every 30s while playing
    const interval = setInterval(() => {
      const { currentSong: song, isPlaying: playing } = usePlayerStore.getState();
      if (song && playing) syncPosition();
    }, 30_000);

    // Save on page unload
    const handleUnload = () => syncPosition();
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return manager;
}
