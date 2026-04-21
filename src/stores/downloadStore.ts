import { create } from 'zustand';
import { openDB } from 'idb';
import type { Song } from '../types/subsonic';

const DB_NAME = 'vibrdrome_downloads';
const STORE_NAME = 'cached_songs';

export interface CachedSong {
  songId: string;
  title: string;
  artist?: string;
  album?: string;
  albumId?: string;
  coverArt?: string;
  size: number;
  cachedAt: number;
}

export interface DownloadQueueItem {
  song: Song;
  albumId?: string;
  progress: number; // 0-1
  status: 'pending' | 'downloading' | 'done' | 'error';
}

interface DownloadState {
  queue: DownloadQueueItem[];
  cachedSongs: Map<string, CachedSong>;
  totalCachedSize: number;
  isDownloading: boolean;

  addToQueue: (songs: Song[], albumId?: string) => void;
  removeFromQueue: (songId: string) => void;
  updateProgress: (songId: string, progress: number) => void;
  markDone: (songId: string, size: number) => void;
  markError: (songId: string) => void;
  setDownloading: (active: boolean) => void;
  removeFromCache: (songId: string) => void;
  clearAllCached: () => void;
  loadCachedSongs: () => Promise<void>;
  isCached: (songId: string) => boolean;
}

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'songId' });
        store.createIndex('albumId', 'albumId');
      }
    },
  });
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  queue: [],
  cachedSongs: new Map(),
  totalCachedSize: 0,
  isDownloading: false,

  addToQueue: (songs, albumId) => {
    const existing = get().cachedSongs;
    const currentQueue = get().queue;
    const newItems: DownloadQueueItem[] = songs
      .filter((s) => !existing.has(s.id) && !currentQueue.some((q) => q.song.id === s.id))
      .map((song) => ({ song, albumId, progress: 0, status: 'pending' as const }));
    if (newItems.length > 0) {
      set({ queue: [...currentQueue, ...newItems] });
    }
  },

  removeFromQueue: (songId) => {
    set({ queue: get().queue.filter((q) => q.song.id !== songId) });
  },

  updateProgress: (songId, progress) => {
    set({
      queue: get().queue.map((q) =>
        q.song.id === songId ? { ...q, progress, status: 'downloading' as const } : q
      ),
    });
  },

  markDone: (songId, size) => {
    const queue = get().queue;
    const item = queue.find((q) => q.song.id === songId);
    if (!item) return;

    const cached: CachedSong = {
      songId,
      title: item.song.title,
      artist: item.song.artist,
      album: item.song.album,
      albumId: item.albumId,
      coverArt: item.song.coverArt,
      size,
      cachedAt: Date.now(),
    };

    const newCached = new Map(get().cachedSongs);
    newCached.set(songId, cached);

    // Persist to IndexedDB
    getDb().then((db) => db.put(STORE_NAME, cached)).catch(() => {});

    set({
      queue: queue.filter((q) => q.song.id !== songId),
      cachedSongs: newCached,
      totalCachedSize: get().totalCachedSize + size,
    });
  },

  markError: (songId) => {
    set({
      queue: get().queue.map((q) =>
        q.song.id === songId ? { ...q, status: 'error' as const } : q
      ),
    });
  },

  setDownloading: (active) => set({ isDownloading: active }),

  removeFromCache: (songId) => {
    const cached = get().cachedSongs.get(songId);
    if (!cached) return;

    const newCached = new Map(get().cachedSongs);
    newCached.delete(songId);

    // Remove from IndexedDB
    getDb().then((db) => db.delete(STORE_NAME, songId)).catch(() => {});

    // Remove from SW cache
    navigator.serviceWorker?.controller?.postMessage({
      type: 'REMOVE_CACHED_AUDIO',
      url: cached.songId, // Will need the actual stream URL
    });

    set({
      cachedSongs: newCached,
      totalCachedSize: Math.max(0, get().totalCachedSize - cached.size),
    });
  },

  clearAllCached: () => {
    // Clear IndexedDB
    getDb().then((db) => db.clear(STORE_NAME)).catch(() => {});

    // Clear SW audio cache
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_AUDIO_CACHE' });

    set({ cachedSongs: new Map(), totalCachedSize: 0, queue: [] });
  },

  loadCachedSongs: async () => {
    try {
      const db = await getDb();
      const all = await db.getAll(STORE_NAME);
      const map = new Map<string, CachedSong>();
      let totalSize = 0;
      for (const item of all) {
        map.set(item.songId, item);
        totalSize += item.size;
      }
      set({ cachedSongs: map, totalCachedSize: totalSize });
    } catch { /* ignore */ }
  },

  isCached: (songId) => get().cachedSongs.has(songId),
}));
