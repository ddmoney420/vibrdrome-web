import { create } from 'zustand';

const THEME_KEY = 'vibrdrome_theme';
const REDUCE_MOTION_KEY = 'vibrdrome_reduce_motion';
const EPILEPSY_DISMISSED_KEY = 'vibrdrome_epilepsy_dismissed';
const ACCENT_COLOR_KEY = 'vibrdrome_accent_color';
const LASTFM_KEY = 'vibrdrome_lastfm_key';
const FANART_KEY = 'vibrdrome_fanart_key';
const DEFAULT_ACCENT = '#8b5cf6';

type Theme = 'system' | 'dark' | 'light' | 'apple' | 'spotify' | 'retro' | 'terminal' | 'midnight' | 'sunset';

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  accentColor: string;
  setAccentColor: (color: string) => void;

  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;

  epilepsyWarningDismissed: boolean;
  setEpilepsyWarningDismissed: (value: boolean) => void;

  lastfmApiKey: string;
  setLastfmApiKey: (key: string) => void;

  fanartApiKey: string;
  setFanartApiKey: (key: string) => void;

  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  sleepTimer: { endTime: number | null; duration: number | null };
  setSleepTimer: (minutes: number | null) => void;
}

const VALID_THEMES: Theme[] = ['system', 'dark', 'light', 'apple', 'spotify', 'retro', 'terminal', 'midnight', 'sunset'];

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

  fanartApiKey: (() => {
    try { return localStorage.getItem(FANART_KEY) || ''; }
    catch { return ''; }
  })(),

  setFanartApiKey: (key) => {
    try { localStorage.setItem(FANART_KEY, key); } catch { /* ignore */ }
    set({ fanartApiKey: key });
  },

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
