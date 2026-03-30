import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { useEQStore } from '../stores/eqStore';
import { Header } from '../components/common';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { servers, activeServerId, logout } = useAuthStore();
  const { theme, setTheme, reduceMotion, setReduceMotion } = useUIStore();
  const { crossfadeEnabled, crossfadeDuration, setCrossfade, setCrossfadeDuration } = usePlayerStore();
  const eqEnabled = useEQStore((s) => s.enabled);

  const activeServer = servers.find((s) => s.id === activeServerId);

  const handleClearCache = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vibrdrome_cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    alert(`Cleared ${keysToRemove.length} cached items`);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Settings" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="mx-auto max-w-lg space-y-6">

          {/* Server */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Server
            </h2>
            <div className="space-y-2 rounded-lg bg-bg-secondary p-4">
              {activeServer ? (
                <div className="space-y-1">
                  <p className="text-sm text-text-primary">{activeServer.url}</p>
                  <p className="text-xs text-text-muted">Signed in as {activeServer.username}</p>
                </div>
              ) : (
                <p className="text-sm text-text-muted">No active server</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => navigate('/settings/servers')}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
                >
                  Manage Servers
                </button>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </section>

          {/* Playback */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Playback
            </h2>
            <div className="space-y-3 rounded-lg bg-bg-secondary p-4">
              <button
                onClick={() => navigate('/eq')}
                className="flex w-full items-center justify-between rounded-lg py-1 text-left"
              >
                <span className="text-sm text-text-primary">Equalizer</span>
                <span className={`text-xs ${eqEnabled ? 'text-accent' : 'text-text-muted'}`}>
                  {eqEnabled ? 'On' : 'Off'}
                </span>
              </button>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">Crossfade</span>
                  <button
                    onClick={() => setCrossfade(!crossfadeEnabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      crossfadeEnabled ? 'bg-accent' : 'bg-bg-tertiary'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        crossfadeEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {crossfadeEnabled && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-text-muted">Duration:</span>
                    <select
                      value={crossfadeDuration}
                      onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                      className="rounded border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary outline-none"
                    >
                      {[1, 2, 3, 5, 7, 10].map((s) => (
                        <option key={s} value={s}>{s}s</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Appearance
            </h2>
            <div className="rounded-lg bg-bg-secondary p-4">
              <div className="flex gap-2">
                {(['system', 'dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 rounded-lg py-2 text-center text-sm font-medium capitalize transition-colors ${
                      theme === t
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Accessibility */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Accessibility
            </h2>
            <div className="space-y-3 rounded-lg bg-bg-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-text-primary">Reduce Motion</span>
                  <p className="text-xs text-text-muted">Disables visualizer animations and flashing effects</p>
                </div>
                <button
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    reduceMotion ? 'bg-accent' : 'bg-bg-tertiary'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      reduceMotion ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Storage */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Storage
            </h2>
            <div className="rounded-lg bg-bg-secondary p-4">
              <button
                onClick={handleClearCache}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              >
                Clear Cache
              </button>
            </div>
          </section>

          {/* About */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              About
            </h2>
            <div className="rounded-lg bg-bg-secondary p-4">
              <p className="text-sm text-text-muted">Vibrdrome Web v1.0.0</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
