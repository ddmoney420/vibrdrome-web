import { create } from 'zustand';

const THEME_KEY = 'vibrdrome_theme';
const REDUCE_MOTION_KEY = 'vibrdrome_reduce_motion';
const KEYBOARD_SHORTCUTS_KEY = 'vibrdrome_keyboard_shortcuts';
const STREAM_QUALITY_KEY = 'vibrdrome_stream_quality';
const EPILEPSY_DISMISSED_KEY = 'vibrdrome_epilepsy_dismissed';
const ACCENT_COLOR_KEY = 'vibrdrome_accent_color';
const LASTFM_KEY = 'vibrdrome_lastfm_key';
const NOTIFICATIONS_KEY = 'vibrdrome_notifications';
const SLEEP_FADE_KEY = 'vibrdrome_sleep_fade_duration';
const REPLAYGAIN_MODE_KEY = 'vibrdrome_replaygain_mode';
const QUEUE_SYNC_KEY = 'vibrdrome_queue_sync';
const VIS_FORCE_BUTTERCHURN_KEY = 'vibrdrome_visualizer_force_butterchurn';
const VIS_AUTO_ADVANCE_KEY = 'vibrdrome_visualizer_auto_advance';
const VIS_AUTO_ADVANCE_INTERVAL_KEY = 'vibrdrome_visualizer_auto_advance_interval';
const VIS_SHUFFLE_KEY = 'vibrdrome_visualizer_shuffle';
const VIS_SHOW_TRANSPORT_KEY = 'vibrdrome_visualizer_show_transport';
const VIS_TRANSITION_POLISH_KEY = 'vibrdrome_visualizer_transition_polish';
const VIS_PARTICLES_KEY = 'vibrdrome_visualizer_particles';
const DEFAULT_ACCENT = '#8b5cf6';

type Theme = 'system' | 'dark' | 'light' | 'apple' | 'apple-dark' | 'retro' | 'terminal' | 'midnight' | 'sunset';

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  accentColor: string;
  setAccentColor: (color: string) => void;

  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;

  keyboardShortcutsEnabled: boolean;
  setKeyboardShortcutsEnabled: (value: boolean) => void;

  streamQuality: number; // 0 = original/lossless, otherwise maxBitRate in kbps
  setStreamQuality: (quality: number) => void;

  epilepsyWarningDismissed: boolean;
  setEpilepsyWarningDismissed: (value: boolean) => void;

  lastfmApiKey: string;
  setLastfmApiKey: (key: string) => void;

  popOutPlayerOpen: boolean;
  setPopOutPlayerOpen: (open: boolean) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;

  sleepFadeDuration: number;
  setSleepFadeDuration: (seconds: number) => void;

  replayGainMode: 'track' | 'album' | 'off';
  setReplayGainMode: (mode: 'track' | 'album' | 'off') => void;

  queueSyncEnabled: boolean;
  setQueueSyncEnabled: (value: boolean) => void;

  // Visualizer (projectM / Milkdrop) preferences
  visualizerForceButterchurn: boolean;
  setVisualizerForceButterchurn: (value: boolean) => void;
  visualizerAutoAdvance: boolean;
  setVisualizerAutoAdvance: (value: boolean) => void;
  visualizerAutoAdvanceInterval: number; // seconds
  setVisualizerAutoAdvanceInterval: (seconds: number) => void;
  visualizerShuffle: boolean;
  setVisualizerShuffle: (value: boolean) => void;
  visualizerShowTransport: boolean;
  setVisualizerShowTransport: (value: boolean) => void;
  visualizerTransitionPolish: boolean;
  setVisualizerTransitionPolish: (value: boolean) => void;
  visualizerParticles: boolean;
  setVisualizerParticles: (value: boolean) => void;

  castConnected: boolean;
  setCastConnected: (connected: boolean) => void;

  shortcutsOverlayOpen: boolean;
  setShortcutsOverlayOpen: (open: boolean) => void;

  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  sleepTimer: { endTime: number | null; duration: number | null };
  setSleepTimer: (minutes: number | null) => void;
}

const VALID_THEMES: Theme[] = ['system', 'dark', 'light', 'apple', 'apple-dark', 'retro', 'terminal', 'midnight', 'sunset'];

function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && VALID_THEMES.includes(stored as Theme)) return stored as Theme;
  } catch { /* ignore */ }
  return 'system';
}

function loadBool(key: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(key);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch { /* ignore */ }
  return fallback;
}

export const useUIStore = create<UIState>((set) => ({
  theme: loadTheme(),

  setTheme: (theme) => {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
    set({ theme });
  },

  accentColor: (() => {
    try { return localStorage.getItem(ACCENT_COLOR_KEY) || DEFAULT_ACCENT; }
    catch { return DEFAULT_ACCENT; }
  })(),

  setAccentColor: (color) => {
    try { localStorage.setItem(ACCENT_COLOR_KEY, color); } catch { /* ignore */ }
    set({ accentColor: color });
  },

  reduceMotion: loadBool(REDUCE_MOTION_KEY, false),

  setReduceMotion: (value) => {
    try { localStorage.setItem(REDUCE_MOTION_KEY, String(value)); } catch { /* ignore */ }
    set({ reduceMotion: value });
  },

  keyboardShortcutsEnabled: loadBool(KEYBOARD_SHORTCUTS_KEY, true),

  setKeyboardShortcutsEnabled: (value) => {
    try { localStorage.setItem(KEYBOARD_SHORTCUTS_KEY, String(value)); } catch { /* ignore */ }
    set({ keyboardShortcutsEnabled: value });
  },

  epilepsyWarningDismissed: loadBool(EPILEPSY_DISMISSED_KEY, false),

  setEpilepsyWarningDismissed: (value) => {
    try { localStorage.setItem(EPILEPSY_DISMISSED_KEY, String(value)); } catch { /* ignore */ }
    set({ epilepsyWarningDismissed: value });
  },

  lastfmApiKey: (() => {
    try { return localStorage.getItem(LASTFM_KEY) || ''; }
    catch { return ''; }
  })(),

  setLastfmApiKey: (key) => {
    try { localStorage.setItem(LASTFM_KEY, key); } catch { /* ignore */ }
    set({ lastfmApiKey: key });
  },

  streamQuality: (() => {
    try { return Number(localStorage.getItem(STREAM_QUALITY_KEY)) || 0; }
    catch { return 0; }
  })(),

  setStreamQuality: (quality) => {
    try { localStorage.setItem(STREAM_QUALITY_KEY, String(quality)); } catch { /* ignore */ }
    set({ streamQuality: quality });
  },

  notificationsEnabled: loadBool(NOTIFICATIONS_KEY, false),

  setNotificationsEnabled: (value) => {
    try { localStorage.setItem(NOTIFICATIONS_KEY, String(value)); } catch { /* ignore */ }
    set({ notificationsEnabled: value });
  },

  sleepFadeDuration: (() => {
    try { return Number(localStorage.getItem(SLEEP_FADE_KEY)) || 10; }
    catch { return 10; }
  })(),

  setSleepFadeDuration: (seconds) => {
    try { localStorage.setItem(SLEEP_FADE_KEY, String(seconds)); } catch { /* ignore */ }
    set({ sleepFadeDuration: seconds });
  },

  replayGainMode: (() => {
    try {
      const stored = localStorage.getItem(REPLAYGAIN_MODE_KEY);
      if (stored === 'track' || stored === 'album' || stored === 'off') return stored;
    } catch { /* ignore */ }
    return 'track' as const;
  })(),

  setReplayGainMode: (mode) => {
    try { localStorage.setItem(REPLAYGAIN_MODE_KEY, mode); } catch { /* ignore */ }
    set({ replayGainMode: mode });
  },

  queueSyncEnabled: loadBool(QUEUE_SYNC_KEY, false),

  setQueueSyncEnabled: (value) => {
    try { localStorage.setItem(QUEUE_SYNC_KEY, String(value)); } catch { /* ignore */ }
    set({ queueSyncEnabled: value });
  },

  visualizerForceButterchurn: loadBool(VIS_FORCE_BUTTERCHURN_KEY, false),
  setVisualizerForceButterchurn: (value) => {
    try { localStorage.setItem(VIS_FORCE_BUTTERCHURN_KEY, String(value)); } catch { /* ignore */ }
    set({ visualizerForceButterchurn: value });
  },

  visualizerAutoAdvance: loadBool(VIS_AUTO_ADVANCE_KEY, false),
  setVisualizerAutoAdvance: (value) => {
    try { localStorage.setItem(VIS_AUTO_ADVANCE_KEY, String(value)); } catch { /* ignore */ }
    set({ visualizerAutoAdvance: value });
  },

  visualizerAutoAdvanceInterval: (() => {
    try { return Number(localStorage.getItem(VIS_AUTO_ADVANCE_INTERVAL_KEY)) || 15; }
    catch { return 15; }
  })(),
  setVisualizerAutoAdvanceInterval: (seconds) => {
    try { localStorage.setItem(VIS_AUTO_ADVANCE_INTERVAL_KEY, String(seconds)); } catch { /* ignore */ }
    set({ visualizerAutoAdvanceInterval: seconds });
  },

  visualizerShuffle: loadBool(VIS_SHUFFLE_KEY, false),
  setVisualizerShuffle: (value) => {
    try { localStorage.setItem(VIS_SHUFFLE_KEY, String(value)); } catch { /* ignore */ }
    set({ visualizerShuffle: value });
  },
  // Conservative default: off. The transport self-hides with no song, so this
  // keeps existing behavior (and the smoke test) unchanged until opted in.
  visualizerShowTransport: loadBool(VIS_SHOW_TRANSPORT_KEY, false),
  setVisualizerShowTransport: (value) => {
    try { localStorage.setItem(VIS_SHOW_TRANSPORT_KEY, String(value)); } catch { /* ignore */ }
    set({ visualizerShowTransport: value });
  },
  // Subtle DOM/CSS vignette dip around the (still hard-cut) preset switch.
  // Default off; always suppressed under reduced motion. No engine changes.
  visualizerTransitionPolish: loadBool(VIS_TRANSITION_POLISH_KEY, false),
  setVisualizerTransitionPolish: (value) => {
    try { localStorage.setItem(VIS_TRANSITION_POLISH_KEY, String(value)); } catch { /* ignore */ }
    set({ visualizerTransitionPolish: value });
  },
  // Optional 2D-canvas particle layer. Default off; force-suppressed under
  // reduced motion by the consumer. No GL/WebGPU context involved.
  visualizerParticles: loadBool(VIS_PARTICLES_KEY, false),
  setVisualizerParticles: (value) => {
    try { localStorage.setItem(VIS_PARTICLES_KEY, String(value)); } catch { /* ignore */ }
    set({ visualizerParticles: value });
  },

  castConnected: false,
  setCastConnected: (connected) => set({ castConnected: connected }),

  shortcutsOverlayOpen: false,
  setShortcutsOverlayOpen: (open) => set({ shortcutsOverlayOpen: open }),

  popOutPlayerOpen: false,
  setPopOutPlayerOpen: (open) => set({ popOutPlayerOpen: open }),

  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  sleepTimer: { endTime: null, duration: null },

  setSleepTimer: (minutes) => {
    if (minutes === null) {
      set({ sleepTimer: { endTime: null, duration: null } });
    } else {
      set({
        sleepTimer: {
          endTime: Date.now() + minutes * 60 * 1000,
          duration: minutes,
        },
      });
    }
  },
}));
