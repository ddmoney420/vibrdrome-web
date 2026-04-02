import { create } from 'zustand';

const STORAGE_KEY = 'vibrdrome_smart_playlist_config';

export interface SmartPlaylistConfig {
  heavyRotationDays: number;
  forgottenGemsMonths: number;
  recentUnplayedDays: number;
}

interface SmartPlaylistState extends SmartPlaylistConfig {
  setHeavyRotationDays: (days: number) => void;
  setForgottenGemsMonths: (months: number) => void;
  setRecentUnplayedDays: (days: number) => void;
}

function loadConfig(): SmartPlaylistConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { heavyRotationDays: 30, forgottenGemsMonths: 2, recentUnplayedDays: 30 };
}

function persist(config: SmartPlaylistConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

const initial = loadConfig();

export const useSmartPlaylistStore = create<SmartPlaylistState>((set, get) => ({
  ...initial,

  setHeavyRotationDays: (days) => {
    set({ heavyRotationDays: days });
    persist({ ...get(), heavyRotationDays: days });
  },

  setForgottenGemsMonths: (months) => {
    set({ forgottenGemsMonths: months });
    persist({ ...get(), forgottenGemsMonths: months });
  },

  setRecentUnplayedDays: (days) => {
    set({ recentUnplayedDays: days });
    persist({ ...get(), recentUnplayedDays: days });
  },
}));
