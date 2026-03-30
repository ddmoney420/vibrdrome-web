import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getSubsonicClient } from '../api/SubsonicClient';
import { Header } from '../components/common';

export default function ServerManagerScreen() {
  const navigate = useNavigate();
  const { servers, activeServerId, setActiveServer, removeServer } = useAuthStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSwitch = (id: string) => {
    const server = servers.find((s) => s.id === id);
    if (server) {
      setActiveServer(id);
      const client = getSubsonicClient();
      client.setConfig(server);
    }
  };

  const handleDelete = (id: string) => {
    removeServer(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Manage Servers" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="mx-auto max-w-lg space-y-4">

          {servers.length === 0 && (
            <p className="py-12 text-center text-text-muted">No servers configured</p>
          )}

          <div className="space-y-2">
            {servers.map((server) => {
              const isActive = server.id === activeServerId;
              return (
                <div
                  key={server.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    isActive ? 'border-accent bg-accent/5' : 'border-border bg-bg-secondary'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                        )}
                        <p className="truncate text-sm font-medium text-text-primary">
                          {server.name}
                        </p>
                        {isActive && (
                          <span className="flex-shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-text-muted">{server.url}</p>
                      <p className="truncate text-xs text-text-muted">{server.username}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitch(server.id)}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                      >
                        Switch
                      </button>
                    )}

                    {confirmDeleteId === server.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(server.id)}
                          className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-bg-tertiary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(server.id)}
                        className="rounded-lg px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-bg-tertiary hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            + Add Server
          </button>
        </div>
      </div>
    </div>
  );
}
