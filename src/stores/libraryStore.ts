import { create } from 'zustand';

const STORAGE_KEY = 'vibrdrome_library_config';

export interface LibraryItem {
  id: string;
  label: string;
  visible: boolean;
}

interface LibraryConfig {
  pills: LibraryItem[];
  carousels: LibraryItem[];
  setPills: (pills: LibraryItem[]) => void;
  setCarousels: (carousels: LibraryItem[]) => void;
  togglePill: (id: string) => void;
  toggleCarousel: (id: string) => void;
  movePill: (from: number, to: number) => void;
  moveCarousel: (from: number, to: number) => void;
}

const DEFAULT_PILLS: LibraryItem[] = [
  { id: 'genres', label: 'Genres', visible: true },
  { id: 'radio', label: 'Radio', visible: true },
  { id: 'artists', label: 'Artists', visible: true },
  { id: 'favorites', label: 'Favorites', visible: true },
  { id: 'albums', label: 'Albums', visible: true },
  { id: 'folders', label: 'Folders', visible: true },
  { id: 'songs', label: 'Songs', visible: true },
  { id: 'downloads', label: 'Downloads', visible: true },
  { id: 'playlists', label: 'Playlists', visible: true },
  { id: 'recentlyAdded', label: 'Recently Added', visible: true },
  { id: 'generations', label: 'Generations', visible: true },
  { id: 'recentlyPlayed', label: 'Recently Played', visible: true },
  { id: 'randomMix', label: 'Random Mix', visible: true },
  { id: 'randomAlbum', label: 'Random Album', visible: true },
];

const DEFAULT_CAROUSELS: LibraryItem[] = [
  { id: 'newest', label: 'Recently Added', visible: true },
  { id: 'frequent', label: 'Most Played', visible: true },
  { id: 'random', label: 'Random Picks', visible: true },
];

function loadConfig(): { pills: LibraryItem[]; carousels: LibraryItem[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to pick up any new items added in updates
      const pills = mergeItems(DEFAULT_PILLS, parsed.pills ?? []);
      const carousels = mergeItems(DEFAULT_CAROUSELS, parsed.carousels ?? []);
      return { pills, carousels };
    }
  } catch { /* ignore */ }
  return { pills: DEFAULT_PILLS, carousels: DEFAULT_CAROUSELS };
}

function mergeItems(defaults: LibraryItem[], saved: LibraryItem[]): LibraryItem[] {
  const savedMap = new Map(saved.map((s) => [s.id, s]));
  const merged: LibraryItem[] = [];

  // Keep saved order for items that still exist
  for (const s of saved) {
    const def = defaults.find((d) => d.id === s.id);
    if (def) {
      merged.push({ ...def, visible: s.visible });
    }
  }

  // Add any new defaults not in saved
  for (const d of defaults) {
    if (!savedMap.has(d.id)) {
      merged.push(d);
    }
  }

  return merged;
}

function persist(state: { pills: LibraryItem[]; carousels: LibraryItem[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      pills: state.pills.map(({ id, visible }) => ({ id, visible })),
      carousels: state.carousels.map(({ id, visible }) => ({ id, visible })),
    }));
  } catch { /* ignore */ }
}

function moveItem(items: LibraryItem[], from: number, to: number): LibraryItem[] {
  const arr = [...items];
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
  return arr;
}

const initial = loadConfig();

export const useLibraryStore = create<LibraryConfig>((set, get) => ({
  pills: initial.pills,
  carousels: initial.carousels,

  setPills: (pills) => {
    set({ pills });
    persist(get());
  },

  setCarousels: (carousels) => {
    set({ carousels });
    persist(get());
  },

  togglePill: (id) => {
    const pills = get().pills.map((p) =>
      p.id === id ? { ...p, visible: !p.visible } : p
    );
    set({ pills });
    persist({ pills, carousels: get().carousels });
  },

  toggleCarousel: (id) => {
    const carousels = get().carousels.map((c) =>
      c.id === id ? { ...c, visible: !c.visible } : c
    );
    set({ carousels });
    persist({ pills: get().pills, carousels });
  },

  movePill: (from, to) => {
    const pills = moveItem(get().pills, from, to);
    set({ pills });
    persist({ pills, carousels: get().carousels });
  },

  moveCarousel: (from, to) => {
    const carousels = moveItem(get().carousels, from, to);
    set({ carousels });
    persist({ pills: get().pills, carousels });
  },
}));
