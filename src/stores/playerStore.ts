import { create } from 'zustand';
import type { Song } from '../types/subsonic';

const QUEUE_KEY = 'vibrdrome_queue';
const PLAYER_SETTINGS_KEY = 'vibrdrome_player_settings';

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0, 0.5, 0.75];

function shuffleArray(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Move currentIndex to the front so current song stays playing
  const pos = indices.indexOf(currentIndex);
  if (pos > 0) {
    [indices[0], indices[pos]] = [indices[pos], indices[0]];
  }
  return indices;
}

interface PlaybackState {
  queue: Song[];
  currentIndex: number;
  currentSong: Song | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  repeatMode: 'off' | 'all' | 'one';
  shuffleEnabled: boolean;
  shuffleOrder: number[];
  playbackSpeed: number;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;

  playSongs: (songs: Song[], startIndex?: number) => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  skipToIndex: (index: number) => void;
  next: () => void;
  previous: () => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setPosition: (ms: number) => void;
  setDuration: (ms: number) => void;
  seek: (ms: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  cycleSpeed: () => void;
  setSpeed: (speed: number) => void;
  setCrossfade: (enabled: boolean) => void;
  setCrossfadeDuration: (seconds: number) => void;
}

function persistQueue(state: PlaybackState) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify({
      queue: state.queue,
      currentIndex: state.currentIndex,
    }));
  } catch { /* storage full or unavailable */ }
}

function persistSettings(state: PlaybackState) {
  try {
    localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify({
      repeatMode: state.repeatMode,
      shuffleEnabled: state.shuffleEnabled,
      playbackSpeed: state.playbackSpeed,
      crossfadeEnabled: state.crossfadeEnabled,
      crossfadeDuration: state.crossfadeDuration,
    }));
  } catch { /* storage full or unavailable */ }
}

function loadPersistedState(): Partial<PlaybackState> {
  try {
    const queueRaw = localStorage.getItem(QUEUE_KEY);
    const settingsRaw = localStorage.getItem(PLAYER_SETTINGS_KEY);
    const queueData = queueRaw ? JSON.parse(queueRaw) : {};
    const settingsData = settingsRaw ? JSON.parse(settingsRaw) : {};

    const queue: Song[] = queueData.queue ?? [];
    const currentIndex: number = queueData.currentIndex ?? -1;
    const currentSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

    return {
      queue,
      currentIndex,
      currentSong,
      repeatMode: settingsData.repeatMode ?? 'off',
      shuffleEnabled: settingsData.shuffleEnabled ?? false,
      playbackSpeed: settingsData.playbackSpeed ?? 1.0,
      crossfadeEnabled: settingsData.crossfadeEnabled ?? false,
      crossfadeDuration: settingsData.crossfadeDuration ?? 5,
    };
  } catch {
    return {};
  }
}

const persisted = loadPersistedState();

export const usePlayerStore = create<PlaybackState>((set, get) => ({
  queue: persisted.queue ?? [],
  currentIndex: persisted.currentIndex ?? -1,
  currentSong: persisted.currentSong ?? null,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  repeatMode: persisted.repeatMode ?? 'off',
  shuffleEnabled: persisted.shuffleEnabled ?? false,
  shuffleOrder: [],
  playbackSpeed: persisted.playbackSpeed ?? 1.0,
  crossfadeEnabled: persisted.crossfadeEnabled ?? false,
  crossfadeDuration: persisted.crossfadeDuration ?? 5,

  playSongs: (songs, startIndex = 0) => {
    const state: Partial<PlaybackState> = {
      queue: songs,
      currentIndex: startIndex,
      currentSong: songs[startIndex] ?? null,
      isPlaying: true,
      positionMs: 0,
    };
    if (get().shuffleEnabled) {
      state.shuffleOrder = shuffleArray(songs.length, startIndex);
    }
    set(state);
    persistQueue(get());
  },

  playNext: (song) => {
    const { queue, currentIndex } = get();
    const insertAt = currentIndex + 1;
    const newQueue = [...queue.slice(0, insertAt), song, ...queue.slice(insertAt)];
    set({ queue: newQueue });
    persistQueue(get());
  },

  addToQueue: (song) => {
    const queue = [...get().queue, song];
    set({ queue });
    persistQueue(get());
  },

  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    if (index < 0 || index >= queue.length) return;

    const newQueue = queue.filter((_, i) => i !== index);
    let newIndex = currentIndex;
    if (index < currentIndex) {
      newIndex = currentIndex - 1;
    } else if (index === currentIndex) {
      newIndex = Math.min(currentIndex, newQueue.length - 1);
    }

    set({
      queue: newQueue,
      currentIndex: newIndex,
      currentSong: newIndex >= 0 && newIndex < newQueue.length ? newQueue[newIndex] : null,
      isPlaying: newQueue.length > 0 ? get().isPlaying : false,
    });
    persistQueue(get());
  },

  clearQueue: () => {
    set({
      queue: [],
      currentIndex: -1,
      currentSong: null,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      shuffleOrder: [],
    });
    persistQueue(get());
  },

  skipToIndex: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return;
    set({
      currentIndex: index,
      currentSong: queue[index],
      isPlaying: true,
      positionMs: 0,
    });
    persistQueue(get());
  },

  next: () => {
    const { queue, currentIndex, shuffleEnabled, shuffleOrder, repeatMode } = get();
    if (queue.length === 0) return;

    // Repeat-one only applies to auto-advance (track ended), not manual skip
    let nextIndex: number;
    if (shuffleEnabled && shuffleOrder.length > 0) {
      const shufflePos = shuffleOrder.indexOf(currentIndex);
      const nextShufflePos = shufflePos + 1;
      if (nextShufflePos >= shuffleOrder.length) {
        if (repeatMode === 'all') {
          nextIndex = shuffleOrder[0];
        } else {
          set({ isPlaying: false });
          return;
        }
      } else {
        nextIndex = shuffleOrder[nextShufflePos];
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
    }

    set({
      currentIndex: nextIndex,
      currentSong: queue[nextIndex],
      isPlaying: true,
      positionMs: 0,
    });
    persistQueue(get());
  },

  previous: () => {
    const { queue, currentIndex, shuffleEnabled, shuffleOrder, repeatMode, positionMs } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current song
    if (positionMs > 3000) {
      get().seek(0);
      return;
    }

    let prevIndex: number;
    if (shuffleEnabled && shuffleOrder.length > 0) {
      const shufflePos = shuffleOrder.indexOf(currentIndex);
      const prevShufflePos = shufflePos - 1;
      if (prevShufflePos < 0) {
        if (repeatMode === 'all') {
          prevIndex = shuffleOrder[shuffleOrder.length - 1];
        } else {
          set({ positionMs: 0 });
          return;
        }
      } else {
        prevIndex = shuffleOrder[prevShufflePos];
      }
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          prevIndex = queue.length - 1;
        } else {
          set({ positionMs: 0 });
          return;
        }
      }
    }

    set({
      currentIndex: prevIndex,
      currentSong: queue[prevIndex],
      isPlaying: true,
      positionMs: 0,
    });
    persistQueue(get());
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (ms) => set({ positionMs: ms }),
  setDuration: (ms) => set({ durationMs: ms }),
  seek: (ms) => {
    set({ positionMs: ms });
    // Dynamically import to avoid circular dependency
    import('../audio/PlaybackManager').then(({ getPlaybackManager }) => {
      getPlaybackManager().seek(ms);
    });
  },

  toggleShuffle: () => {
    const { shuffleEnabled, queue, currentIndex } = get();
    const newShuffle = !shuffleEnabled;
    const shuffleOrder = newShuffle ? shuffleArray(queue.length, currentIndex) : [];
    set({ shuffleEnabled: newShuffle, shuffleOrder });
    persistSettings(get());
  },

  cycleRepeat: () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const current = modes.indexOf(get().repeatMode);
    const next = modes[(current + 1) % modes.length];
    set({ repeatMode: next });
    persistSettings(get());
  },

  cycleSpeed: () => {
    const current = get().playbackSpeed;
    const idx = SPEED_OPTIONS.indexOf(current);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    set({ playbackSpeed: next });
    persistSettings(get());
  },

  setSpeed: (speed) => {
    set({ playbackSpeed: speed });
    persistSettings(get());
  },

  setCrossfade: (enabled) => {
    set({ crossfadeEnabled: enabled });
    persistSettings(get());
  },

  setCrossfadeDuration: (seconds) => {
    set({ crossfadeDuration: seconds });
    persistSettings(get());
  },
}));
