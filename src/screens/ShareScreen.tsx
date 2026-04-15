import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Header } from '../components/common';

export default function ShareScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const serverUrl = params.get('server');
  const playlistId = params.get('playlist');
  const { servers, activeServerId } = useAuthStore();
  const activeServer = servers.find((s) => s.id === activeServerId);

  useEffect(() => {
    // If authenticated to the same server, redirect to the playlist
    if (activeServer && playlistId && activeServer.url === serverUrl) {
      navigate(`/playlist/${playlistId}`, { replace: true });
    }
  }, [activeServer, serverUrl, playlistId, navigate]);

  if (!serverUrl || !playlistId) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Shared Link" showBack />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-muted">Invalid share link</p>
        </div>
      </div>
    );
  }

  // If redirecting, show nothing (useEffect handles it)
  if (activeServer?.url === serverUrl) return null;

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Shared Playlist" showBack />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-text-primary">This playlist is from:</p>
        <p className="rounded-lg bg-bg-secondary px-4 py-2 text-sm font-mono text-text-secondary">{serverUrl}</p>
        {activeServer ? (
          <p className="text-sm text-text-muted">
            You're connected to a different server. Connect to this server to view the playlist.
          </p>
        ) : (
          <p className="text-sm text-text-muted">
            Sign in to this server to view the playlist.
          </p>
        )}
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
