import { create } from 'zustand';
import type { MusicFolder } from '../types/subsonic';
import { getSubsonicClient } from '../api/SubsonicClient';

const STORAGE_KEY = 'vibrdrome_music_folder';

interface MusicFolderState {
  folders: MusicFolder[];
  activeFolderId: string | null; // null = "All Libraries"
  loaded: boolean;
  setActiveFolderId: (id: string | null) => void;
  loadFolders: () => Promise<void>;
}

function loadPersistedFolder(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch { return null; }
}

export const useMusicFolderStore = create<MusicFolderState>((set) => ({
  folders: [],
  activeFolderId: loadPersistedFolder(),
  loaded: false,

  setActiveFolderId: (id) => {
    try {
      if (id === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, id);
      }
    } catch { /* ignore */ }
    set({ activeFolderId: id });
  },

  loadFolders: async () => {
    try {
      const folders = await getSubsonicClient().getMusicFolders();
      set({ folders, loaded: true });
    } catch {
      set({ folders: [], loaded: true });
    }
  },
}));
