import { create } from 'zustand';

const THEME_KEY = 'vibrdrome_theme';

type Theme = 'system' | 'dark' | 'light';

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;

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

export const useUIStore = create<UIState>((set) => ({
  theme: loadTheme(),

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch { /* ignore */ }
    set({ theme });
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
