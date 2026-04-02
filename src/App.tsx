import React, { Suspense, useEffect, Component } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { usePlayerStore } from './stores/playerStore';
import LoadingSpinner from './components/common/LoadingSpinner';
import Sidebar from './components/common/Sidebar';
import { usePlayback } from './audio/usePlayback';
import { darkenHex } from './utils/color';
import CommandPalette from './components/common/CommandPalette';
import RightPane from './components/player/RightPane';

// Error boundary for stale chunk errors after deploys
class ChunkErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    if (error.message.includes('dynamically imported module') || error.message.includes('Failed to fetch')) {
      return { hasError: true };
    }
    throw error;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-bg-primary px-4 text-center">
          <p className="mb-4 text-lg text-text-primary">A new version is available</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-loaded screens with auto-retry on chunk failure
function lazyWithRetry(importFn: () => Promise<{ default: React.ComponentType }>) {
  return React.lazy(() =>
    importFn().catch(() => {
      // Chunk failed to load — likely a new deploy. Force reload.
      window.location.reload();
      return new Promise(() => {}); // never resolves, page reloads
    })
  );
}

// Lazy-loaded screens
const LoginScreen = lazyWithRetry(() => import('./screens/LoginScreen'));
const LibraryScreen = lazyWithRetry(() => import('./screens/LibraryScreen'));
const ArtistsScreen = lazyWithRetry(() => import('./screens/ArtistsScreen'));
const ArtistDetailScreen = lazyWithRetry(() => import('./screens/ArtistDetailScreen'));
const AlbumsListScreen = lazyWithRetry(() => import('./screens/AlbumsListScreen'));
const AlbumDetailScreen = lazyWithRetry(() => import('./screens/AlbumDetailScreen'));
const SongsScreen = lazyWithRetry(() => import('./screens/SongsScreen'));
const GenresScreen = lazyWithRetry(() => import('./screens/GenresScreen'));
const GenerationsScreen = lazyWithRetry(() => import('./screens/GenerationsScreen'));
const FavoritesScreen = lazyWithRetry(() => import('./screens/FavoritesScreen'));
const FolderBrowserScreen = lazyWithRetry(() => import('./screens/FolderBrowserScreen'));
const FolderDetailScreen = lazyWithRetry(() => import('./screens/FolderDetailScreen'));
const PlaylistsScreen = lazyWithRetry(() => import('./screens/PlaylistsScreen'));
const PlaylistDetailScreen = lazyWithRetry(() => import('./screens/PlaylistDetailScreen'));
const PlaylistEditorScreen = lazyWithRetry(() => import('./screens/PlaylistEditorScreen'));
const SmartPlaylistScreen = lazyWithRetry(() => import('./screens/SmartPlaylistScreen'));
const RadioScreen = lazyWithRetry(() => import('./screens/RadioScreen'));
const StationSearchScreen = lazyWithRetry(() => import('./screens/StationSearchScreen'));
const AddStationScreen = lazyWithRetry(() => import('./screens/AddStationScreen'));
const SearchScreen = lazyWithRetry(() => import('./screens/SearchScreen'));
const SettingsScreen = lazyWithRetry(() => import('./screens/SettingsScreen'));
const ServerManagerScreen = lazyWithRetry(() => import('./screens/ServerManagerScreen'));
const DownloadsScreen = lazyWithRetry(() => import('./screens/DownloadsScreen'));
const NowPlayingScreen = lazyWithRetry(() => import('./screens/NowPlayingScreen'));
const QueueScreen = lazyWithRetry(() => import('./screens/QueueScreen'));
const LyricsScreen = lazyWithRetry(() => import('./screens/LyricsScreen'));
const EQScreen = lazyWithRetry(() => import('./screens/EQScreen'));
const VisualizerScreen = lazyWithRetry(() => import('./screens/VisualizerScreen'));

const MiniPlayer = lazyWithRetry(() => import('./components/player/MiniPlayer'));

const HIDE_MINIPLAYER_ROUTES = ['/now-playing', '/visualizer', '/login'];
const HIDE_SIDEBAR_ROUTES = ['/login', '/now-playing', '/visualizer'];

export default function App() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();
  const theme = useUIStore((s) => s.theme);
  const accentColor = useUIStore((s) => s.accentColor);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const location = useLocation();

  // Initialize playback engine
  usePlayback();

  // Load auth state from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Apply theme to html element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Apply accent color to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', accentColor);
    root.style.setProperty('--color-accent-hover', darkenHex(accentColor, 8));
  }, [accentColor]);

  // Command palette shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const { commandPaletteOpen, openCommandPalette, closeCommandPalette } = useUIStore.getState();
        if (commandPaletteOpen) closeCommandPalette();
        else openCommandPalette();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const radioMode = usePlayerStore((s) => s.radioMode);
  const hasPlayback = currentSong !== null || radioMode !== null;
  const showMiniPlayer =
    hasPlayback && !HIDE_MINIPLAYER_ROUTES.includes(location.pathname);
  const showSidebar =
    isAuthenticated && !HIDE_SIDEBAR_ROUTES.includes(location.pathname);
  const showRightPane =
    isAuthenticated && hasPlayback && !HIDE_SIDEBAR_ROUTES.includes(location.pathname);

  return (
    <div className="flex h-dvh flex-col bg-bg-primary text-text-primary">
      {isAuthenticated && <CommandPalette />}
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}
        <div className="flex-1 overflow-y-auto">
        <ChunkErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={isAuthenticated ? <LibraryScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/artists"
              element={isAuthenticated ? <ArtistsScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/artist/:artistId"
              element={isAuthenticated ? <ArtistDetailScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/albums"
              element={isAuthenticated ? <AlbumsListScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/album/:albumId"
              element={isAuthenticated ? <AlbumDetailScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/songs"
              element={isAuthenticated ? <SongsScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/genres"
              element={isAuthenticated ? <GenresScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/generations"
              element={isAuthenticated ? <GenerationsScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/favorites"
              element={isAuthenticated ? <FavoritesScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/folders"
              element={isAuthenticated ? <FolderBrowserScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/folder/:folderId"
              element={isAuthenticated ? <FolderDetailScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/playlists"
              element={isAuthenticated ? <PlaylistsScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/playlist/:playlistId"
              element={isAuthenticated ? <PlaylistDetailScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/playlist/edit/:playlistId?"
              element={isAuthenticated ? <PlaylistEditorScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/smart-playlists"
              element={isAuthenticated ? <SmartPlaylistScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/radio"
              element={isAuthenticated ? <RadioScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/radio/search"
              element={isAuthenticated ? <StationSearchScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/radio/add"
              element={isAuthenticated ? <AddStationScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/search"
              element={isAuthenticated ? <SearchScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/settings"
              element={isAuthenticated ? <SettingsScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/settings/servers"
              element={isAuthenticated ? <ServerManagerScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/downloads"
              element={isAuthenticated ? <DownloadsScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/now-playing"
              element={isAuthenticated ? <NowPlayingScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/queue"
              element={isAuthenticated ? <QueueScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/lyrics"
              element={isAuthenticated ? <LyricsScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/eq"
              element={isAuthenticated ? <EQScreen /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/visualizer"
              element={isAuthenticated ? <VisualizerScreen /> : <Navigate to="/login" replace />}
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </ChunkErrorBoundary>
        </div>
        {showRightPane && <RightPane />}
      </div>

      {showMiniPlayer && (
        <Suspense fallback={null}>
          <MiniPlayer />
        </Suspense>
      )}
    </div>
  );
}
