import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getSubsonicClient } from '../api/SubsonicClient';
import type { ServerConfig } from '../types/subsonic';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { servers, isLoading, error, login, removeServer, setActiveServer } =
    useAuthStore();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUrl = url.replace(/\/+$/, '');

    const server: ServerConfig = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name || cleanUrl,
      url: cleanUrl,
      username,
      password,
    };

    // Configure the singleton client before login
    const client = getSubsonicClient();
    client.setConfig(server);

    const success = await login(server);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  const handleSwitchServer = async (server: ServerConfig) => {
    const client = getSubsonicClient();
    client.setConfig(server);
    setActiveServer(server.id);

    const success = await login(server);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  const handleDeleteServer = (id: string) => {
    removeServer(id);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-12 w-12 text-accent"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19V6l12-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zm12-3c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2z"
            />
          </svg>
          <h1 className="text-3xl font-bold text-text-primary">Vibrdrome</h1>
        </div>

        {/* Login form */}
        <form onSubmit={handleConnect} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Server Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
          />
          <input
            type="url"
            placeholder="Server URL (e.g. https://music.example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
          />

          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-accent py-3 font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </form>

        {/* Saved servers */}
        {servers.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
              Saved Servers
            </h2>
            <div className="flex flex-col gap-2">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {server.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">{server.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSwitchServer(server)}
                      disabled={isLoading}
                      className="rounded-md bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30"
                    >
                      Switch
                    </button>
                    <button
                      onClick={() => handleDeleteServer(server.id)}
                      className="rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
