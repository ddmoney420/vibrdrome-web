import { create } from 'zustand';
import type { ServerConfig } from '../types/subsonic';
import { getSubsonicClient } from '../api/SubsonicClient';

const SERVERS_KEY = 'vibrdrome_servers';
const ACTIVE_SERVER_KEY = 'vibrdrome_active_server';

interface AuthState {
  servers: ServerConfig[];
  activeServerId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  addServer: (server: ServerConfig) => void;
  removeServer: (id: string) => void;
  setActiveServer: (id: string) => void;
  login: (server: ServerConfig) => Promise<boolean>;
  logout: () => void;
  loadFromStorage: () => void;
}

// Load persisted auth state synchronously at store creation time
// so SubsonicClient is configured before any playback attempts.
function loadInitialAuth() {
  try {
    const raw = localStorage.getItem(SERVERS_KEY);
    const servers: ServerConfig[] = raw ? JSON.parse(raw) : [];
    const activeServerId = localStorage.getItem(ACTIVE_SERVER_KEY) || null;
    const activeServer = servers.find((s) => s.id === activeServerId);

    if (activeServer) {
      const client = getSubsonicClient();
      client.setConfig(activeServer);
    }

    return { servers, activeServerId, isAuthenticated: !!activeServer };
  } catch {
    return { servers: [] as ServerConfig[], activeServerId: null, isAuthenticated: false };
  }
}

const initialAuth = loadInitialAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  servers: initialAuth.servers,
  activeServerId: initialAuth.activeServerId,
  isAuthenticated: initialAuth.isAuthenticated,
  isLoading: false,
  error: null,

  addServer: (server) => {
    const servers = [...get().servers, server];
    localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
    set({ servers });
  },

  removeServer: (id) => {
    const servers = get().servers.filter((s) => s.id !== id);
    localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));

    const updates: Partial<AuthState> = { servers };
    if (get().activeServerId === id) {
      updates.activeServerId = null;
      updates.isAuthenticated = false;
      localStorage.removeItem(ACTIVE_SERVER_KEY);
    }
    set(updates);
  },

  setActiveServer: (id) => {
    localStorage.setItem(ACTIVE_SERVER_KEY, id);
    set({ activeServerId: id });
  },

  login: async (server) => {
    set({ isLoading: true, error: null });
    try {
      const client = getSubsonicClient();
      client.setConfig(server);
      await client.ping();

      const { servers } = get();
      const exists = servers.some((s) => s.id === server.id);
      const updatedServers = exists ? servers : [...servers, server];

      localStorage.setItem(SERVERS_KEY, JSON.stringify(updatedServers));
      localStorage.setItem(ACTIVE_SERVER_KEY, server.id);

      set({
        servers: updatedServers,
        activeServerId: server.id,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(ACTIVE_SERVER_KEY);
    set({ activeServerId: null, isAuthenticated: false, error: null });
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(SERVERS_KEY);
      const servers: ServerConfig[] = raw ? JSON.parse(raw) : [];
      const activeServerId = localStorage.getItem(ACTIVE_SERVER_KEY);
      const activeServer = servers.find((s) => s.id === activeServerId);
      const isAuthenticated = !!activeServer;

      if (activeServer) {
        const client = getSubsonicClient();
        client.setConfig(activeServer);
      }

      set({ servers, activeServerId, isAuthenticated });
    } catch {
      set({ servers: [], activeServerId: null, isAuthenticated: false });
    }
  },
}));
