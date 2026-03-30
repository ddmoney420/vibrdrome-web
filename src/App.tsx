import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { usePlayerStore } from './stores/playerStore';
import LoadingSpinner from './components/common/LoadingSpinner';
import Sidebar from './components/common/Sidebar';
import { usePlayback } from './audio/usePlayback';

// Lazy-loaded screens
const LoginScreen = React.lazy(() => import('./screens/LoginScreen'));
const LibraryScreen = React.lazy(() => import('./screens/LibraryScreen'));
const ArtistsScreen = React.lazy(() => import('./screens/ArtistsScreen'));
const ArtistDetailScreen = React.lazy(() => import('./screens/ArtistDetailScreen'));
const AlbumsListScreen = React.lazy(() => import('./screens/AlbumsListScreen'));
const AlbumDetailScreen = React.lazy(() => import('./screens/AlbumDetailScreen'));
const SongsScreen = React.lazy(() => import('./screens/SongsScreen'));
const GenresScreen = React.lazy(() => import('./screens/GenresScreen'));
const GenerationsScreen = React.lazy(() => import('./screens/GenerationsScreen'));
const FavoritesScreen = React.lazy(() => import('./screens/FavoritesScreen'));
const FolderBrowserScreen = React.lazy(() => import('./screens/FolderBrowserScreen'));
const FolderDetailScreen = React.lazy(() => import('./screens/FolderDetailScreen'));
const PlaylistsScreen = React.lazy(() => import('./screens/PlaylistsScreen'));
const PlaylistDetailScreen = React.lazy(() => import('./screens/PlaylistDetailScreen'));
const PlaylistEditorScreen = React.lazy(() => import('./screens/PlaylistEditorScreen'));
const SmartPlaylistScreen = React.lazy(() => import('./screens/SmartPlaylistScreen'));
const RadioScreen = React.lazy(() => import('./screens/RadioScreen'));
const StationSearchScreen = React.lazy(() => import('./screens/StationSearchScreen'));
const AddStationScreen = React.lazy(() => import('./screens/AddStationScreen'));
const SearchScreen = React.lazy(() => import('./screens/SearchScreen'));
const SettingsScreen = React.lazy(() => import('./screens/SettingsScreen'));
const ServerManagerScreen = React.lazy(() => import('./screens/ServerManagerScreen'));
const DownloadsScreen = React.lazy(() => import('./screens/DownloadsScreen'));
const NowPlayingScreen = React.lazy(() => import('./screens/NowPlayingScreen'));
const QueueScreen = React.lazy(() => import('./screens/QueueScreen'));
const LyricsScreen = React.lazy(() => import('./screens/LyricsScreen'));
const EQScreen = React.lazy(() => import('./screens/EQScreen'));
const VisualizerScreen = React.lazy(() => import('./screens/VisualizerScreen'));

// Lazy-loaded MiniPlayer (will be created later)
const MiniPlayer = React.lazy(() => import('./components/player/MiniPlayer'));

const HIDE_MINIPLAYER_ROUTES = ['/now-playing', '/visualizer', '/login'];
const HIDE_SIDEBAR_ROUTES = ['/login', '/now-playing', '/visualizer'];

export default function App() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();
  const theme = useUIStore((s) => s.theme);
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

  const showMiniPlayer =
    currentSong !== null && !HIDE_MINIPLAYER_ROUTES.includes(location.pathname);
  const showSidebar =
    isAuthenticated && !HIDE_SIDEBAR_ROUTES.includes(location.pathname);

  return (
    <div className="flex h-dvh flex-col bg-bg-primary text-text-primary">
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}
        <div className="flex-1 overflow-y-auto">
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
              path="/folder/:directoryId"
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
        </div>
      </div>

      {showMiniPlayer && (
        <Suspense fallback={null}>
          <MiniPlayer />
        </Suspense>
      )}
    </div>
  );
}
