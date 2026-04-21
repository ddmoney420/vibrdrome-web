import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { useEQStore } from '../stores/eqStore';
import { isValidHex } from '../utils/color';
import { exportSettings, importSettings } from '../utils/settingsIO';
import { Header } from '../components/common';
import ThemePicker from '../components/settings/ThemePicker';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { servers, activeServerId, logout } = useAuthStore();
  const { accentColor, setAccentColor, lastfmApiKey, setLastfmApiKey, reduceMotion, setReduceMotion, keyboardShortcutsEnabled, setKeyboardShortcutsEnabled, streamQuality, setStreamQuality } = useUIStore();
  const { crossfadeEnabled, crossfadeDuration, setCrossfade, setCrossfadeDuration, gaplessEnabled, setGapless } = usePlayerStore();
  const { sleepFadeDuration, setSleepFadeDuration, notificationsEnabled, setNotificationsEnabled, replayGainMode, setReplayGainMode, queueSyncEnabled, setQueueSyncEnabled } = useUIStore();
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
                    role="switch"
                    aria-checked={crossfadeEnabled}
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

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-primary">Gapless Playback</span>
                    <p className="text-xs text-text-muted">{crossfadeEnabled ? 'Disabled when crossfade is on' : 'Seamless track transitions'}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={gaplessEnabled}
                    disabled={crossfadeEnabled}
                    onClick={() => setGapless(!gaplessEnabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      gaplessEnabled && !crossfadeEnabled ? 'bg-accent' : 'bg-bg-tertiary'
                    } ${crossfadeEnabled ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        gaplessEnabled && !crossfadeEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-primary">Stream Quality</span>
                    <p className="text-xs text-text-muted">Lower quality saves bandwidth on mobile</p>
                  </div>
                  <select
                    value={streamQuality}
                    onChange={(e) => setStreamQuality(Number(e.target.value))}
                    className="rounded border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary outline-none"
                  >
                    <option value={0}>Original</option>
                    <option value={320}>High (320 kbps)</option>
                    <option value={256}>Medium (256 kbps)</option>
                    <option value={192}>Standard (192 kbps)</option>
                    <option value={128}>Low (128 kbps)</option>
                    <option value={96}>Very Low (96 kbps)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-primary">Sleep Timer Fade</span>
                    <p className="text-xs text-text-muted">Gradually lower volume before pausing</p>
                  </div>
                  <select
                    value={sleepFadeDuration}
                    onChange={(e) => setSleepFadeDuration(Number(e.target.value))}
                    className="rounded border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary outline-none"
                  >
                    <option value={10}>10s</option>
                    <option value={30}>30s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-primary">ReplayGain</span>
                    <p className="text-xs text-text-muted">Normalize volume across tracks</p>
                  </div>
                  <select
                    value={replayGainMode}
                    onChange={(e) => setReplayGainMode(e.target.value as 'track' | 'album' | 'off')}
                    className="rounded border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary outline-none"
                  >
                    <option value="track">Track</option>
                    <option value="album">Album</option>
                    <option value="off">Off</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Appearance
            </h2>
            <div className="rounded-lg bg-bg-secondary p-4">
              <ThemePicker />

              {/* Accent Color */}
              <div className="mt-4 border-t border-border pt-4">
                <span className="text-sm text-text-primary">Accent Color</span>
                <AccentColorPicker color={accentColor} onChange={setAccentColor} />
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
                  role="switch"
                  aria-checked={reduceMotion}
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

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-primary">Keyboard Shortcuts</span>
                    <p className="text-xs text-text-muted">Space, arrows, M, S, R for playback control — press ? to view all</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={keyboardShortcutsEnabled}
                    onClick={() => setKeyboardShortcutsEnabled(!keyboardShortcutsEnabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      keyboardShortcutsEnabled ? 'bg-accent' : 'bg-bg-tertiary'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        keyboardShortcutsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Integrations */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Integrations
            </h2>
            <div className="space-y-3 rounded-lg bg-bg-secondary p-4">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-primary">Last.fm</span>
                    <p className="text-xs text-text-muted">Artist bios, similar artists, and photos</p>
                  </div>
                  {lastfmApiKey && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">Connected</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {lastfmApiKey ? (
                    <>
                      <div className="flex-1 rounded-lg border border-border bg-bg-tertiary px-3 py-1.5 text-xs text-text-muted tracking-widest">
                        {'•'.repeat(Math.min(lastfmApiKey.length, 20))}
                      </div>
                      <button
                        onClick={() => setLastfmApiKey('')}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <input
                      type="password"
                      onChange={(e) => setLastfmApiKey(e.target.value)}
                      placeholder="Enter Last.fm API key"
                      className="flex-1 rounded-lg border border-border bg-bg-tertiary px-3 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent"
                    />
                  )}
                </div>
                <p className="mt-1.5 text-[10px] text-text-muted">
                  Get a free API key at last.fm/api/account/create
                </p>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-primary">Desktop Notifications</span>
                    <p className="text-xs text-text-muted">Show a notification on track change</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={notificationsEnabled}
                    onClick={async () => {
                      if (!notificationsEnabled) {
                        const perm = await Notification.requestPermission();
                        if (perm === 'granted') setNotificationsEnabled(true);
                      } else {
                        setNotificationsEnabled(false);
                      }
                    }}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-accent' : 'bg-bg-tertiary'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-primary">Sync Queue</span>
                    <p className="text-xs text-text-muted">Save queue and position to server for cross-device sync</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={queueSyncEnabled}
                    onClick={() => setQueueSyncEnabled(!queueSyncEnabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      queueSyncEnabled ? 'bg-accent' : 'bg-bg-tertiary'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        queueSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
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
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <button
                  onClick={exportSettings}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                >
                  Export Settings
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = async () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      try {
                        const result = await importSettings(file);
                        alert(`Imported ${result.imported} settings. Reloading...`);
                        window.location.reload();
                      } catch {
                        alert('Invalid settings file');
                      }
                    };
                    input.click();
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                >
                  Import Settings
                </button>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              About
            </h2>
            <div className="rounded-lg bg-bg-secondary p-4">
              <p className="text-sm text-text-muted">Vibrdrome Web v1.8.1-beta.1</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

const ACCENT_PRESETS = [
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Green', color: '#10b981' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Lime', color: '#84cc16' },
];

function AccentColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [customHex, setCustomHex] = useState(color);
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = () => {
    const hex = customHex.startsWith('#') ? customHex : `#${customHex}`;
    if (isValidHex(hex)) {
      onChange(hex);
    }
  };

  return (
    <div className="mt-2 space-y-3">
      {/* Preset swatches */}
      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.color}
            onClick={() => { onChange(preset.color); setCustomHex(preset.color); }}
            className={`group relative h-8 w-8 rounded-full transition-transform hover:scale-110 ${
              color === preset.color ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-secondary' : ''
            }`}
            style={{ backgroundColor: preset.color }}
            aria-label={preset.name}
            title={preset.name}
          />
        ))}

        {/* Custom color toggle */}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed transition-colors ${
            showCustom ? 'border-accent text-accent' : 'border-border text-text-muted hover:border-text-muted'
          }`}
          aria-label="Custom color"
          title="Custom color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
        </button>
      </div>

      {/* Custom hex input */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 shrink-0 rounded-full border border-border"
            style={{ backgroundColor: isValidHex(customHex.startsWith('#') ? customHex : `#${customHex}`) ? (customHex.startsWith('#') ? customHex : `#${customHex}`) : color }}
          />
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            placeholder="#8b5cf6"
            maxLength={7}
            className="w-24 rounded-lg border border-border bg-bg-tertiary px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
          />
          <button
            onClick={handleCustomSubmit}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
