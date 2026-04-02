import { create } from 'zustand';

const STORAGE_KEY = 'vibrdrome_library_config';
const CUSTOM_CAROUSELS_KEY = 'vibrdrome_custom_carousels';

export interface LibraryItem {
  id: string;
  label: string;
  visible: boolean;
}

export interface CustomCarousel {
  id: string;
  label: string;
  type: 'byYear' | 'byGenre' | 'highest' | 'decade';
  visible: boolean;
  // byYear / decade params
  fromYear?: number;
  toYear?: number;
  // byGenre param
  genre?: string;
}

interface LibraryConfig {
  pills: LibraryItem[];
  carousels: LibraryItem[];
  customCarousels: CustomCarousel[];
  setPills: (pills: LibraryItem[]) => void;
  setCarousels: (carousels: LibraryItem[]) => void;
  togglePill: (id: string) => void;
  toggleCarousel: (id: string) => void;
  movePill: (from: number, to: number) => void;
  moveCarousel: (from: number, to: number) => void;
  addCustomCarousel: (carousel: Omit<CustomCarousel, 'id'>) => void;
  removeCustomCarousel: (id: string) => void;
  toggleCustomCarousel: (id: string) => void;
  moveCustomCarousel: (from: number, to: number) => void;
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
  { id: 'starred', label: 'Starred Albums', visible: true },
  { id: 'thisYear', label: 'Released This Year', visible: true },
  { id: 'recent', label: 'Recently Played', visible: true },
];

function loadConfig(): { pills: LibraryItem[]; carousels: LibraryItem[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const pills = mergeItems(DEFAULT_PILLS, parsed.pills ?? []);
      const carousels = mergeItems(DEFAULT_CAROUSELS, parsed.carousels ?? []);
      return { pills, carousels };
    }
  } catch { /* ignore */ }
  return { pills: DEFAULT_PILLS, carousels: DEFAULT_CAROUSELS };
}

function loadCustomCarousels(): CustomCarousel[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CAROUSELS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function mergeItems(defaults: LibraryItem[], saved: LibraryItem[]): LibraryItem[] {
  const savedMap = new Map(saved.map((s) => [s.id, s]));
  const merged: LibraryItem[] = [];

  for (const s of saved) {
    const def = defaults.find((d) => d.id === s.id);
    if (def) {
      merged.push({ ...def, visible: s.visible });
    }
  }

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

function persistCustom(carousels: CustomCarousel[]) {
  try {
    localStorage.setItem(CUSTOM_CAROUSELS_KEY, JSON.stringify(carousels));
  } catch { /* ignore */ }
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const arr = [...items];
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
  return arr;
}

const initial = loadConfig();

export const useLibraryStore = create<LibraryConfig>((set, get) => ({
  pills: initial.pills,
  carousels: initial.carousels,
  customCarousels: loadCustomCarousels(),

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

  addCustomCarousel: (carousel) => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const custom = [...get().customCarousels, { ...carousel, id, visible: true }];
    set({ customCarousels: custom });
    persistCustom(custom);
  },

  removeCustomCarousel: (id) => {
    const custom = get().customCarousels.filter((c) => c.id !== id);
    set({ customCarousels: custom });
    persistCustom(custom);
  },

  toggleCustomCarousel: (id) => {
    const custom = get().customCarousels.map((c) =>
      c.id === id ? { ...c, visible: !c.visible } : c
    );
    set({ customCarousels: custom });
    persistCustom(custom);
  },

  moveCustomCarousel: (from, to) => {
    const custom = moveItem(get().customCarousels, from, to);
    set({ customCarousels: custom });
    persistCustom(custom);
  },
}));
