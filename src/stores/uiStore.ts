import { create } from 'zustand';

const THEME_KEY = 'vibrdrome_theme';
const REDUCE_MOTION_KEY = 'vibrdrome_reduce_motion';
const EPILEPSY_DISMISSED_KEY = 'vibrdrome_epilepsy_dismissed';

type Theme = 'system' | 'dark' | 'light';

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;

  epilepsyWarningDismissed: boolean;
  setEpilepsyWarningDismissed: (value: boolean) => void;

  sleepTimer: { endTime: number | null; duration: number | null };
  setSleepTimer: (minutes: number | null) => void;
}

function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
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
